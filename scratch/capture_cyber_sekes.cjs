const puppeteer = require('puppeteer');
(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  const warnings = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('No target node found')) {
      if (text.includes('mixamorig')) {
        console.log('MISSING MIXAMO BONE:', text);
      }
      warnings.push(text);
    } else {
      console.log('BROWSER:', text);
    }
  });
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });

  try {
    console.log('Navigating to http://localhost:5174/cyber_sekes_scratch.html...');
    await page.goto('http://localhost:5174/cyber_sekes_scratch.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('Waiting 10 seconds...');
    await new Promise(r => setTimeout(r, 10000));
    
    console.log(`\nTotal 'No target node found' warnings: ${warnings.length}`);
  } catch (e) {
    console.error('Failed:', e.message);
  } finally {
    await browser.close();
  }
})();
