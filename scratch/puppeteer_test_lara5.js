import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => {
      const text = msg.text();
      console.log('BROWSER:', text);
  });
  await page.goto('http://localhost:5174'); 
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    document.dispatchEvent(new CustomEvent('keydown', { key: 'l' }));
  });
  await new Promise(r => setTimeout(r, 4000));
  await browser.close();
})();
