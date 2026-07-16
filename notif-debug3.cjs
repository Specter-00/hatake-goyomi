const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ permissions: ['notifications'], timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  // Notificationコンストラクタをスパイ
  await page.addInitScript(() => {
    window.__notifCalls = [];
    const Orig = window.Notification;
    function Spy(title, opts) { window.__notifCalls.push({ title, body: opts?.body }); return { close(){} }; }
    Spy.requestPermission = Orig.requestPermission.bind(Orig);
    Object.defineProperty(Spy, 'permission', { get: () => Orig.permission });
    window.Notification = Spy;
  });
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    localStorage.setItem('onboarding_done', '1');
    localStorage.removeItem('last_notified_date');
    const openDB = () => new Promise((res, rej) => {
      const req = indexedDB.open('HatakeGoyomi');
      req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error);
    });
    const dbi = await openDB();
    const tx = dbi.transaction(['vegetables', 'settings'], 'readwrite');
    const d = new Date(); d.setDate(d.getDate() - 50);
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    tx.objectStore('vegetables').put({
      id: 'v1', name: 'ミニトマト', variety: '', plantedAt: iso,
      seedType: 'seedling', location: 'planter', sunlight: 'full',
      prefectureCode: '47', memo: '', currentStage: 'fruiting',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    tx.objectStore('settings').put({ id: 'app', prefectureCode: '47', notificationEnabled: true, notificationTime: '08:00', fontSize: 'normal' });
    await new Promise(r => { tx.oncomplete = r; });
    dbi.close();
  });
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const info = await page.evaluate(() => ({
    calls: window.__notifCalls,
    notified: localStorage.getItem('last_notified_date'),
    homeTasks: [...document.querySelectorAll('p')].filter(p => p.textContent === '水やり').length,
  }));
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
