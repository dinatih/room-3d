const puppeteer = require('puppeteer');
(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  try {
    console.log('Navigating to http://localhost:5173/all_lara_style.html...');
    await page.goto('http://localhost:5173/all_lara_style.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    console.log('Waiting 15 seconds for models to load and render...');
    await new Promise(r => setTimeout(r, 15000));
    
    const pathScreenshot = '/home/dinatih/.gemini/antigravity-cli/brain/582799ab-2b09-47bb-a03d-1f3bc69e494f/all_lara_style_screenshot.png';
    await page.screenshot({ path: pathScreenshot });
    console.log('Screenshot saved to:', pathScreenshot);
  } catch (e) {
    console.error('Failed to capture screenshot:', e.message);
  } finally {
    await browser.close();
  }
})();
