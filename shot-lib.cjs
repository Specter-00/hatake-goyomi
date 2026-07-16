const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({
    viewport: { width: 393, height: 852 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block',
  });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    localStorage.setItem('onboarding_done', '1');
    const openDB = () => new Promise((res, rej) => { const q = indexedDB.open('HatakeGoyomi'); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
    const dbi = await openDB();
    const tx = dbi.transaction(['vegetables','settings'], 'readwrite');
    const dstr = (off) => { const d = new Date(); d.setDate(d.getDate() - off); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
    tx.objectStore('vegetables').put({ id:'v1', name:'ゴーヤ', variety:'あばしゴーヤー', plantedAt:dstr(40), seedType:'seed', location:'field', sunlight:'full', prefectureCode:'47', memo:'', currentStage:'flowering', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() });
    tx.objectStore('settings').put({ id:'app', prefectureCode:'47', notificationEnabled:false, notificationTime:'08:00', fontSize:'normal', theme:'light' });
    await new Promise(r => { tx.oncomplete = r; });
    dbi.close();
  });
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: '/mnt/user-data/outputs/new_home.png' });
  await page.locator('[data-testid="open-library"]').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/mnt/user-data/outputs/library_list.png' });
  await page.locator('[data-testid="library-article-okinawa-climate"]').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/mnt/user-data/outputs/library_reader.png' });
  await browser.close();
  console.log('shots done');
})().catch(e => { console.error(e); process.exit(1); });
