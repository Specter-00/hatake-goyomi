const { chromium } = require('playwright-core');
const CHROMIUM_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = 'http://localhost:4173';
const results = [];
const check = (name, cond, detail = '') =>
  results.push(`${cond ? '✅ PASS' : '❌ FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);

(async () => {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({
    viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true,
    locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block',
  });
  const page = await ctx.newPage();

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    localStorage.setItem('onboarding_done', '1');
    const openDB = () => new Promise((res, rej) => {
      const req = indexedDB.open('HatakeGoyomi');
      req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error);
    });
    const dbi = await openDB();
    const tx = dbi.transaction(['vegetables', 'settings'], 'readwrite');
    const d = new Date(); d.setDate(d.getDate() - 30);
    tx.objectStore('vegetables').put({
      id: 'v1', name: 'ゴーヤ', variety: '', plantedAt: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
      seedType: 'seed', location: 'field', sunlight: 'full',
      prefectureCode: '47', memo: '', currentStage: 'seedling',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    tx.objectStore('settings').put({ id: 'app', prefectureCode: '47', notificationEnabled: false, notificationTime: '08:00', fontSize: 'normal', theme: 'light' });
    await new Promise(r => { tx.oncomplete = r; });
    dbi.close();
  });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  /* T1: 新ヘッダー（あいさつ表示） */
  const greeting = await page.evaluate(() =>
    ['おはようございます','こんにちは','こんばんは'].some(g => document.body.textContent.includes(g))
  );
  check('T1 時間帯あいさつ表示', greeting);

  /* T2: まなぶボタン → ライブラリが開く */
  await page.locator('[data-testid="open-library"]').click();
  await page.waitForTimeout(500);
  const libOpen = await page.locator('[data-testid="library-page"]').count();
  check('T2 ライブラリを開く', libOpen === 1);

  /* T3: 記事数（18本） */
  const articleCount = await page.locator('[data-testid^="library-article-"]').count();
  check('T3 記事数', articleCount === 20, `${articleCount}本`);

  /* T4: カテゴリ絞り込み */
  await page.locator('[data-testid="library-cat-島野菜をまなぶ"]').click();
  await page.waitForTimeout(400);
  const catCount = await page.locator('[data-testid^="library-article-"]').count();
  check('T4 カテゴリ絞り込み（島野菜）', catCount === 10, `${catCount}本`);
  await page.locator('[data-testid="library-cat-島野菜をまなぶ"]').click(); // 解除
  await page.waitForTimeout(300);

  /* T5: ライブラリ内検索「台風」 */
  await page.locator('[data-testid="library-search"]').fill('台風');
  await page.waitForTimeout(400);
  const searchCount = await page.locator('[data-testid^="library-article-"]').count();
  check('T5 記事検索「台風」', searchCount >= 2, `${searchCount}本ヒット`);
  await page.locator('[data-testid="library-search"]').fill('');
  await page.waitForTimeout(300);

  /* T6: 記事リーダーを開く */
  await page.locator('[data-testid="library-article-okinawa-soil"]').click();
  await page.waitForTimeout(500);
  const reader = await page.locator('[data-testid="library-reader"]').count();
  const hasJagaru = await page.getByText('ジャーガル').first().count();
  check('T6 記事リーダー表示（土壌記事）', reader === 1 && hasJagaru >= 1);

  /* T7: 「次に読む」導線 */
  const nextNav = await page.getByText('次に読む').count();
  check('T7 次に読む導線', nextNav === 1);

  /* T8: 戻る → 一覧へ */
  await page.locator('[data-testid="reader-back"]').click();
  await page.waitForTimeout(400);
  const backToList = await page.locator('[data-testid="library-page"]').count();
  check('T8 リーダーから一覧へ戻る', backToList === 1);

  /* T9: 閉じてホームへ */
  await page.locator('[data-testid="library-page"] button').filter({ has: page.locator('svg') }).nth(0);
  await page.locator('[data-testid="library-page"]').getByRole('button').nth(0).click();
  await page.waitForTimeout(400);
  // Xを押したはず。ホームに戻ったか
  const homeVisible = await page.locator('[data-testid="open-library"]').count();
  check('T9 ライブラリを閉じる', homeVisible === 1);

  /* T10: 野菜詳細の関連記事リンク（ゴーヤ → ゴーヤー記事） */
  await page.locator('h3', { hasText: 'ゴーヤ' }).click();
  await page.waitForTimeout(600);
  const related = await page.locator('[data-testid="related-article"]').count();
  const relatedText = related ? await page.locator('[data-testid="related-article"]').textContent() : '';
  check('T10 野菜詳細の関連記事', related === 1 && relatedText.includes('ゴーヤー'), relatedText.slice(0, 40));

  await browser.close();
  console.log(results.join('\n'));
  const fails = results.filter(r => r.includes('FAIL')).length;
  console.log(`\n合計: ${results.length}件 / 失敗: ${fails}件`);
  process.exit(fails > 0 ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
