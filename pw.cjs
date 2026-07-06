const { chromium, devices } = require('/home/user/daggerheart-campaign/node_modules/playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newContext({ ...devices['iPhone 13'], hasTouch: true }).then(c => c.newPage());
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://localhost:8904/index.html');
  await page.waitForTimeout(1500);
  const txt = await page.evaluate(() => document.body.innerText.replace(/\n+/g,' ').slice(0, 300));
  const heading = await page.locator('text=Co-GM').count();
  const buttons = await page.locator('button').count();
  console.log('heading has Co-GM:', heading > 0);
  console.log('interactive buttons:', buttons);
  console.log('sample:', JSON.stringify(txt));
  console.log('errors:', errors.length ? errors.slice(0,3) : 'none');
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
