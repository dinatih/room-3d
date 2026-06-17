const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('ANIM_DEBUG')) console.log('LOG:', text);
  });

  console.log("Loading page...");
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  await page.evaluate(() => {
    window.ANIM_DEBUG_ON = true;
    console.log("ANIM_DEBUG: Starting diagnostic...");
  });

  // Small wait for things to start
  await new Promise(r => setTimeout(r, 10000));

  await browser.close();
})();
