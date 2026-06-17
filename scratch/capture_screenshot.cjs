const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
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
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 5000)); // Wait for R3F to load
    await page.screenshot({ path: 'scratch/current_state.png' });
    console.log('Screenshot saved to scratch/current_state.png');
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
