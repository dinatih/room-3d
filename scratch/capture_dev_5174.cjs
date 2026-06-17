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
    console.log('Navigating to http://localhost:5174...');
    await page.goto('http://localhost:5174', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('Waiting 12 seconds for scene assets and models to render...');
    await new Promise(r => setTimeout(r, 12000));
    
    // Save screenshot to artifacts folder
    const path = '/home/dinatih/.gemini/antigravity-cli/brain/6cf40343-2557-4162-94fd-538f17d2073c/verification_result.png';
    await page.screenshot({ path });
    console.log('Screenshot saved to:', path);
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
