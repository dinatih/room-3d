const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'load', timeout: 5000 });
  } catch(e) {}
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();
