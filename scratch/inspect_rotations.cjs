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

  page.on('pageerror', err => {
    console.error(`[BROWSER ERROR]: ${err.toString()}`);
  });

  try {
    console.log('Navigating to http://localhost:5173/cyber_sekes_scratch.html...');
    await page.goto('http://localhost:5173/cyber_sekes_scratch.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    console.log('Waiting 3 seconds for initial load...');
    await new Promise(r => setTimeout(r, 3000));

    await page.evaluate(() => {
      const refs = window.refModels;
      const targets = window.models;
      
      const printRotations = (model, name) => {
        if (!model) {
          console.log(`${name} not loaded.`);
          return;
        }
        console.log(`\n=== Rotations for ${name} ===`);
        model.updateMatrixWorld(true);
        model.traverse(c => {
          if (c.isBone) {
            const isTargetBone = ['hip', 'pelvis', 'thigh', 'upperarm'].some(n => c.name.toLowerCase().includes(n)) && !c.name.includes('Compensation') && !c.name.includes('Twist');
            if (!isTargetBone) return;

            const q = c.quaternion;
            const wq = new THREE.Quaternion();
            c.getWorldQuaternion(wq);
            
            const e = new THREE.Euler().setFromQuaternion(q);
            const we = new THREE.Euler().setFromQuaternion(wq);
            
            const rad2deg = 180 / Math.PI;
            console.log(`Bone: "${c.name}"`);
            console.log(`  Local Q: [${q.x.toFixed(4)}, ${q.y.toFixed(4)}, ${q.z.toFixed(4)}, ${q.w.toFixed(4)}]`);
            console.log(`  Local Euler (deg): [${(e.x * rad2deg).toFixed(1)}, ${(e.y * rad2deg).toFixed(1)}, ${(e.z * rad2deg).toFixed(1)}]`);
            console.log(`  World Q: [${wq.x.toFixed(4)}, ${wq.y.toFixed(4)}, ${wq.z.toFixed(4)}, ${wq.w.toFixed(4)}]`);
            console.log(`  World Euler (deg): [${(we.x * rad2deg).toFixed(1)}, ${(we.y * rad2deg).toFixed(1)}, ${(we.z * rad2deg).toFixed(1)}]`);
            if (c.restLocalQ) {
              const rq = c.restLocalQ;
              const re = new THREE.Euler().setFromQuaternion(rq);
              console.log(`  Cached restLocalQ: [${rq.x.toFixed(4)}, ${rq.y.toFixed(4)}, ${rq.z.toFixed(4)}, ${rq.w.toFixed(4)}]`);
              console.log(`  Cached restLocal Euler (deg): [${(re.x * rad2deg).toFixed(1)}, ${(re.y * rad2deg).toFixed(1)}, ${(re.z * rad2deg).toFixed(1)}]`);
            }
          }
        });
      };

      printRotations(refs.male, 'CC Homme');
      printRotations(targets.male, 'X-Bot');
    });

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
