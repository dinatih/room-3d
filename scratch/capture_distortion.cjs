const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1000 });
  await page.goto('http://localhost:5173/lara_xbot_debug.html');
  await new Promise(r => setTimeout(r, 5000));
  
  await page.evaluate(() => {
    // Select a native animation to compare against user's screenshot
    const select = document.getElementById('select-anim');
    select.value = 'Studio Embedded: agree';
    select.dispatchEvent(new Event('change'));
  });
  await new Promise(r => setTimeout(r, 1000));
  
  await page.screenshot({ path: 'scratch/current_distortion.png' });
  console.log("Screenshot saved to scratch/current_distortion.png");
  
  await browser.close();
})();
