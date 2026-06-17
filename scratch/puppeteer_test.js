import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => {
      const text = msg.text();
      if (text.includes('retargetMixamoClip') || text.includes('Lara Perfect Box')) console.log('BROWSER:', text);
  });
  await page.goto('http://localhost:5174');
  await new Promise(r => setTimeout(r, 2000));
  // Press 'L' a few times to switch walkers
  await page.keyboard.press('l');
  await new Promise(r => setTimeout(r, 1000));
  await page.keyboard.press('l');
  await new Promise(r => setTimeout(r, 1000));
  await page.keyboard.press('l');
  await new Promise(r => setTimeout(r, 1000));
  // Walk forward
  await page.keyboard.down('ArrowUp');
  await new Promise(r => setTimeout(r, 2000));
  await page.keyboard.up('ArrowUp');
  await browser.close();
})();
