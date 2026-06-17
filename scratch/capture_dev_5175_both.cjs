const puppeteer = require('puppeteer');
(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
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
    console.log('1. Navigating to http://localhost:5175/red-lara.html...');
    await page.goto('http://localhost:5175/red-lara.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('Waiting 10 seconds for red-lara models to render...');
    await new Promise(r => setTimeout(r, 10000));
    
    // Save screenshot to artifacts folder
    const pathRedLara = '/home/dinatih/.gemini/antigravity-cli/brain/6cf40343-2557-4162-94fd-538f17d2073c/red_lara_screenshot.png';
    await page.screenshot({ path: pathRedLara });
    console.log('red-lara screenshot saved to:', pathRedLara);

    console.log('2. Navigating to http://localhost:5175/...');
    await page.goto('http://localhost:5175', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('Waiting 12 seconds for main studio to render...');
    await new Promise(r => setTimeout(r, 12000));
    
    const pathStudio = '/home/dinatih/.gemini/antigravity-cli/brain/6cf40343-2557-4162-94fd-538f17d2073c/studio_screenshot.png';
    await page.screenshot({ path: pathStudio });
    console.log('studio screenshot saved to:', pathStudio);
  } catch (e) {
    console.error('Failed to capture screenshots:', e.message);
  } finally {
    await browser.close();
    if (errors.length > 0) {
      console.log('\nFound browser errors:');
      errors.forEach(e => console.log('- ' + e));
    }
  }
})();
