const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/lara_xbot_debug.html');
  await new Promise(r => setTimeout(r, 4000));
  
  const results = await page.evaluate(() => {
    const xbot = MODELS_META.xbot.instance;
    const xBones = [];
    xbot.traverse(o => { if(o.isBone) xBones.push(o.name); });
    return { xBones: xBones.slice(0, 20) };
  });
  
  console.log("XBot Bones:", results.xBones);
  await browser.close();
})();
