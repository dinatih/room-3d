const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('DIAGNOSTIC') || text.includes('quaternion') || text.includes('restLocalQ')) {
      console.log(text);
    }
  });

  try {
    console.log('Navigating to http://localhost:5173/cyber_sekes_scratch.html...');
    await page.goto('http://localhost:5173/cyber_sekes_scratch.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('Waiting for diagnostics to print...');
    await new Promise(r => setTimeout(r, 4000));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
