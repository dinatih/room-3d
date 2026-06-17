const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    console.log('BROWSER:', msg.text());
  });
  page.on('pageerror', err => {
    errors.push(err.toString());
    console.log('PAGE ERROR:', err.toString());
  });

  try {
    console.log('Navigating to http://localhost:5174/stare_debug.html...');
    await page.goto('http://localhost:5174/stare_debug.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    console.log('Waiting 5 seconds for model and animations to be ready...');
    await new Promise(r => setTimeout(r, 5000));
    
    console.log('Clicking on walking.glb animation...');
    await page.click('.list-item[data-file="walking.glb"]');
    
    console.log('Clicking "Show Skeleton Helper" checkbox...');
    await page.click('#chk-skeleton');

    console.log('Clicking "Show Joint Names" checkbox...');
    await page.click('#chk-joint-names');
    
    console.log('Waiting 3 seconds for animation to play with skeleton and labels...');
    await new Promise(r => setTimeout(r, 3000));
    
    const pathScreenshot = '/home/dinatih/.gemini/antigravity-cli/brain/6cf40343-2557-4162-94fd-538f17d2073c/stare_debug_screenshot.png';
    await page.screenshot({ path: pathScreenshot });
    console.log('Screenshot saved to:', pathScreenshot);
    
    // Evaluate if model loaded
    const status = await page.evaluate(() => {
      const model = window.THREE ? true : false;
      return { threeLoaded: model };
    });
    console.log("STATUS:", JSON.stringify(status, null, 2));
  } catch (e) {
    console.error('Failed to capture screenshot:', e.message);
  } finally {
    await browser.close();
    if (errors.length > 0) {
      console.log('\nFound browser errors:');
      errors.forEach(e => console.log('- ' + e));
    }
  }
})();
