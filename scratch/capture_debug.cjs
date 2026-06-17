const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });

  try {
    console.log('Navigating to http://localhost:5174/lara_xbot_debug.html...');
    await page.goto('http://localhost:5174/lara_xbot_debug.html', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForSelector('#visible-lara', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 4000)); // Wait for models to load and animate
    await page.screenshot({ path: 'scratch/lara_xbot_debug_init.png' });
    console.log('Screenshot saved to scratch/lara_xbot_debug_init.png');
  } catch (e) {
    console.error('Failed to capture screenshot:', e.message);
  } finally {
    await browser.close();
  }
})();
