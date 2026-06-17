const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/lara_xbot_debug.html');
  await new Promise(r => setTimeout(r, 4000));
  
  const results = await page.evaluate(() => {
    const xbot = MODELS_META.xbot.instance;
    const lara = MODELS_META.lara.instance;
    const xBones = [];
    xbot.traverse(o => { if(o.isBone) xBones.push(o.name); });
    const lBones = [];
    lara.traverse(o => { if(o.isBone) lBones.push(o.name); });
    
    // Check first animation tracks
    const animKey = Object.keys(loadedClips)[0];
    const clip = loadedClips[animKey];
    const tracks = clip ? clip.tracks.map(t => t.name).slice(0, 10) : [];
    
    return { xBones: xBones.slice(0, 10), lBones: lBones.slice(0, 10), tracks };
  });
  
  console.log("XBot Bones:", results.xBones);
  console.log("Lara Bones:", results.lBones);
  console.log("Anim Tracks:", results.tracks);
  
  await browser.close();
})();
