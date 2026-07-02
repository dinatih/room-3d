const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    console.log(msg.text());
  });

  try {
    await page.goto('http://localhost:5173/cyber_sekes_scratch.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 3000));

    await page.evaluate(() => {
      console.log("=== CC Homme Current T-Pose Positions ===");
      const model = window.refModels.male;
      if (!model) return;
      model.updateMatrixWorld(true);
      
      const list = [
        'CC_Base_Hip',
        'CC_Base_Pelvis',
        'CC_Base_L_Thigh',
        'CC_Base_R_Thigh',
        'CC_Base_L_Upperarm',
        'CC_Base_L_Forearm',
        'CC_Base_L_Hand',
        'CC_Base_R_Upperarm',
        'CC_Base_R_Forearm',
        'CC_Base_R_Hand'
      ];

      model.traverse(c => {
        if (c.isBone) {
          const base = c.name.replace(/_\d+/, '');
          if (list.includes(base) && !c.name.includes('scaleCompensation')) {
            const wp = new THREE.Vector3();
            c.getWorldPosition(wp);
            console.log(`Bone: "${c.name}" | worldPos: [${wp.x.toFixed(3)}, ${wp.y.toFixed(3)}, ${wp.z.toFixed(3)}]`);
          }
        }
      });
    });

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
