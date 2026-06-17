import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => {
      const text = msg.text();
      if (text.includes('retargetMixamoClip') || text.includes('Lara Perfect Box')) console.log('BROWSER:', text);
  });
  await page.goto('http://localhost:5173'); // Using 5173 which is the main Vite process
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
