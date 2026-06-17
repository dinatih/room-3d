const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("Launching headless browser...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    console.log('[BROWSER CONSOLE]', text);
    logs.push(text);
  });

  page.on('pageerror', err => {
    console.log('[BROWSER ERROR]', err.toString());
    logs.push(err.toString());
  });

  console.log("Navigating to http://localhost:5174/lara_xbot_debug.html...");
  try {
    await page.goto('http://localhost:5174/lara_xbot_debug.html', { waitUntil: 'load', timeout: 10000 });
  } catch (e) {
    console.error("Failed to load page.", e.message);
    await browser.close();
    return;
  }

  console.log("Waiting 3 seconds for models and animations to load...");
  await new Promise(r => setTimeout(r, 3000));

  // Evaluate and log all rest bone rotations
  await page.evaluate(() => {
    const lara = window.MODELS_META ? window.MODELS_META.lara.instance : null;
    if (!lara) {
      console.log("Lara instance not found on window");
      return;
    }
    console.log("--- LARA REST BONE ROTATIONS ---");
    lara.traverse(c => {
      if (c.isBone) {
        const radToDeg = 180 / Math.PI;
        const euler = new window.THREE.Euler().setFromQuaternion(c.quaternion);
        console.log(`REST_ROT_LOG: ${c.name} Euler(x:${(euler.x*radToDeg).toFixed(1)}, y:${(euler.y*radToDeg).toFixed(1)}, z:${(euler.z*radToDeg).toFixed(1)})`);
      }
    });
  });

  console.log("Selecting walking animation...");
  await page.evaluate(() => {
    const select = document.getElementById('select-anim');
    select.value = 'media/sandbox/anim_walking.glb';
    select.dispatchEvent(new Event('change'));
  });

  console.log("Waiting 3 seconds for walking animation to play...");
  await new Promise(r => setTimeout(r, 3000));

  // Evaluate and log all bone rotations and positions
  await page.evaluate(() => {
    const lara = window.MODELS_META ? window.MODELS_META.lara.instance : null;
    if (!lara) {
      console.log("Lara instance not found on window");
      return;
    }
    console.log("--- LARA BONE ROTATIONS DURING PLAYBACK ---");
    lara.traverse(c => {
      if (c.isBone) {
        const radToDeg = 180 / Math.PI;
        const euler = new window.THREE.Euler().setFromQuaternion(c.quaternion);
        console.log(`BONE_ROT_LOG: ${c.name} Euler(x:${(euler.x*radToDeg).toFixed(1)}, y:${(euler.y*radToDeg).toFixed(1)}, z:${(euler.z*radToDeg).toFixed(1)})`);
      }
    });

    console.log("--- LARA UPPER BODY WORLD POSITIONS DURING PLAYBACK ---");
    const upperBones = [
      'mixamorig_root_hips',
      'mixamorig_spine_lower',
      'mixamorig_spine_upper',
      'mixamorig_head_neck_lower',
      'mixamorig_head_neck_upper'
    ];
    upperBones.forEach(name => {
      const b = lara.getObjectByName(name);
      if (b) {
        const pos = b.getWorldPosition(new window.THREE.Vector3());
        console.log(`BONE_POS_LOG: ${name} WorldPos(x:${pos.x.toFixed(1)}, y:${pos.y.toFixed(1)}, z:${pos.z.toFixed(1)})`);
      }
    });
  });

  console.log("Taking walking screenshot...");
  await page.screenshot({ path: 'scratch/walking.png' });

  console.log("Clicking T-Pose button...");
  await page.click('#btn-reset-pose');
  await new Promise(r => setTimeout(r, 1000));

  console.log("Taking T-Pose screenshot...");
  await page.screenshot({ path: 'scratch/tpose.png' });

  fs.writeFileSync('scratch/browser_logs.txt', logs.join('\n'));
  console.log("Screenshots saved to scratch/walking.png and scratch/tpose.png");

  await browser.close();
})();


