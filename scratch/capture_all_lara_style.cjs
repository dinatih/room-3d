const puppeteer = require('puppeteer');
(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    console.log('BROWSER:', msg.text());
  });
  page.on('pageerror', err => {
    errors.push(err.toString());
    console.log('PAGE ERROR:', err.toString());
  });

  try {
    console.log('Navigating to http://localhost:5174/all_lara_style.html...');
    await page.goto('http://localhost:5174/all_lara_style.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    console.log('Waiting 25 seconds for all 19 models and assets to load...');
    await new Promise(r => setTimeout(r, 25000));
    
    const pathScreenshot = '/home/dinatih/.gemini/antigravity-cli/brain/6cf40343-2557-4162-94fd-538f17d2073c/all_lara_style_screenshot.png';
    await page.screenshot({ path: pathScreenshot });
    console.log('all_lara_style screenshot saved to:', pathScreenshot);

    const status = await page.evaluate(() => {
      if (!window.allModels) return { status: "No allModels" };
      
      const debugModels = window.allModels.map(m => {
        const mixer = m.userData.mixer;
        const activeActions = mixer ? mixer._actions || [] : [];
        const isPlaying = activeActions.some(a => a.isRunning());
        
        // Inspect a sample bone if it exists
        const sampleBoneName = m.name === "Lara 324 Rigged" ? "arm_left_shoulder_2_014" : 
                               m.name === "Fortnite" ? "upperarm_l_09" : null;
        let boneData = null;
        if (sampleBoneName) {
          const bone = m.getObjectByName(sampleBoneName);
          if (bone) {
            boneData = {
              name: bone.name,
              pos: [bone.position.x.toFixed(4), bone.position.y.toFixed(4), bone.position.z.toFixed(4)],
              rot: [bone.quaternion.x.toFixed(4), bone.quaternion.y.toFixed(4), bone.quaternion.z.toFixed(4), bone.quaternion.w.toFixed(4)]
            };
          }
        }
        
        return {
          name: m.name,
          actions: activeActions.length,
          isPlaying: isPlaying,
          time: mixer ? mixer.time.toFixed(4) : 0,
          bone: boneData
        };
      });
      return debugModels;
    });
    console.log("MIXER & BONE STATUS:", JSON.stringify(status, null, 2));
  } catch (e) {
    console.error('Failed to capture screenshots:', e.message);
  } finally {
    await browser.close();
    if (errors.length > 0) {
      console.log('\nFound browser errors:');
      errors.forEach(e => console.log('- ' + e));
    }
  }
})();
