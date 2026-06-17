import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => {
      console.log('BROWSER:', msg.text());
  });
  await page.goto('http://localhost:5174'); 
  await new Promise(r => setTimeout(r, 4000));
  await browser.close();
})();
