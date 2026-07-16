const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ permissions: ['notifications'] });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
  const r = await page.evaluate(() => {
    try {
      const n = new Notification('test', { body: 'x' });
      return 'constructed ok: ' + Notification.permission;
    } catch (e) {
      return 'THROW: ' + e.message + ' | permission=' + Notification.permission;
    }
  });
  console.log(r);
  await browser.close();
})();
