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
      console.log("=== CC Homme restWorldQ vs currentWorldQ ===");
      const model = window.refModels.male;
      if (!model) return;
      
      const rad2deg = 180 / Math.PI;
      const getEulerDeg = q => {
        if (!q) return 'null';
        const e = new THREE.Euler().setFromQuaternion(q);
        return `[${(e.x * rad2deg).toFixed(1)}, ${(e.y * rad2deg).toFixed(1)}, ${(e.z * rad2deg).toFixed(1)}]`;
      };
      
      const list = [
        'CC_Base_Hip',
        'CC_Base_Pelvis',
        'CC_Base_Waist',
        'CC_Base_Spine01',
        'CC_Base_Spine02',
        'CC_Base_L_Upperarm',
        'CC_Base_R_Upperarm'
      ];

      model.updateMatrixWorld(true);
      model.traverse(c => {
        if (c.isBone) {
          const base = c.name.replace(/_\d+/, '');
          if (list.includes(base) && !c.name.includes('scaleCompensation')) {
            const wq = new THREE.Quaternion();
            c.getWorldQuaternion(wq);
            console.log(`Bone: "${c.name}"`);
            console.log(`  restWorldQ Euler:   ${getEulerDeg(c.restWorldQ)}`);
            console.log(`  currentWorldQ Euler: ${getEulerDeg(wq)}`);
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
