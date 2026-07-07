const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.text().includes('ROSANNA_BONE:')) console.log(msg.text());
  });

  await page.goto('http://localhost:5173/test_metarig.html');
  await new Promise(r => setTimeout(r, 3000));
  
  await page.evaluate(() => {
    if (window.rosannaModel) {
      window.rosannaModel.traverse(c => {
        if (c.isBone) console.log('ROSANNA_BONE: ' + c.name);
      });
    }
  });

  await browser.close();
})();
