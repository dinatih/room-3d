const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.text().includes('THREE.PropertyBinding')) {
      console.log('BINDING ERROR:', msg.text());
    }
    if (msg.text().includes('targetName')) {
        console.log('TRACK:', msg.text());
    }
  });

  await page.goto('http://localhost:5173/test_metarig.html');
  await page.waitForTimeout(3000); // Wait for load
  
  await browser.close();
})();
