const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    console.log(`[BROWSER LOG]: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.error(`[BROWSER ERROR]: ${err.toString()}`);
  });

  try {
    console.log('Navigating to http://localhost:5173/all_lara_style.html...');
    await page.goto('http://localhost:5173/all_lara_style.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    console.log('Waiting 8 seconds for all models to load...');
    await new Promise(r => setTimeout(r, 8000));
    
    console.log('Finished waiting.');
  } catch (e) {
    console.error('Execution error:', e.message);
  } finally {
    await browser.close();
  }
})();
