const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('LOG:', msg.text());
  });
  
  await page.goto('http://localhost:5173/test_rosanna_bones.html');
  await new Promise(r => setTimeout(r, 6000));
  
  await browser.close();
})();
