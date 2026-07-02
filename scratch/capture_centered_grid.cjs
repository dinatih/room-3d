const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  page.on('console', msg => {
    console.log(`[BROWSER LOG]: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.error(`[BROWSER ERROR]: ${err.toString()}`);
  });

  try {
    console.log('Navigating to http://localhost:5173/all_lara_style.html...');
    await page.goto('http://localhost:5173/all_lara_style.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    console.log('Waiting 10 seconds for all models to load and render...');
    await new Promise(r => setTimeout(r, 10000));
    
    const screenshotPath = '/home/dinatih/.gemini/antigravity-cli/brain/582799ab-2b09-47bb-a03d-1f3bc69e494f/lara_centered_grid_layout.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to: ${screenshotPath}`);
  } catch (e) {
    console.error('Execution error:', e.message);
  } finally {
    await browser.close();
  }
})();
