const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/lara_xbot_debug.html');
  await new Promise(r => setTimeout(r, 4000));
  
  const results = await page.evaluate(() => {
    const animKeys = Object.keys(loadedClips);
    const nativeKey = animKeys.find(k => k.includes('agree'));
    const nativeClip = loadedClips[nativeKey];
    const nativeTracks = nativeClip ? nativeClip.tracks.map(t => t.name).slice(0, 5) : [];
    
    const externalKey = 'media/sandbox/anim_walking.glb';
    const externalClip = loadedClips[externalKey];
    const externalTracks = externalClip ? externalClip.tracks.map(t => t.name).slice(0, 5) : [];
    
    return { nativeTracks, externalTracks };
  });
  
  console.log("Native Tracks (XBot):", results.nativeTracks);
  console.log("External Tracks:", results.externalTracks);
  await browser.close();
})();
