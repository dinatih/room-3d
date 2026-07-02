const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(msg.text());
  });

  try {
    await page.goto('http://localhost:5173/cyber_sekes_scratch.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 3000));
    
    await page.evaluate(() => {
      console.log("=== CC Homme Parts World Rotations ===");
      const model = window.refModels.male;
      if (!model) return;
      
      const rad2deg = 180 / Math.PI;
      const targetBones = [
        'CC_Base_Hip',
        'CC_Base_Pelvis',
        'CC_Base_Waist',
        'CC_Base_Spine01',
        'CC_Base_Spine02',
        'CC_Base_NeckTwist01',
        'CC_Base_Head',
        'CC_Base_L_Clavicle',
        'CC_Base_L_Upperarm',
        'CC_Base_R_Clavicle',
        'CC_Base_R_Upperarm'
      ];
      
      model.updateMatrixWorld(true);
      model.traverse(c => {
        if (c.isBone) {
          const match = targetBones.find(b => c.name.startsWith(b));
          if (!match) return;
          
          const q = c.quaternion;
          const e = new THREE.Euler().setFromQuaternion(q);
          const wq = new THREE.Quaternion();
          c.getWorldQuaternion(wq);
          const we = new THREE.Euler().setFromQuaternion(wq);
          
          console.log(`Bone: "${c.name}"`);
          console.log(`  Local Q: [${q.x.toFixed(4)}, ${q.y.toFixed(4)}, ${q.z.toFixed(4)}, ${q.w.toFixed(4)}]`);
          console.log(`  Local Euler (deg): [${(e.x * rad2deg).toFixed(1)}, ${(e.y * rad2deg).toFixed(1)}, ${(e.z * rad2deg).toFixed(1)}]`);
          console.log(`  World Q: [${wq.x.toFixed(4)}, ${wq.y.toFixed(4)}, ${wq.z.toFixed(4)}, ${wq.w.toFixed(4)}]`);
          console.log(`  World Euler (deg): [${(we.x * rad2deg).toFixed(1)}, ${(we.y * rad2deg).toFixed(1)}, ${(we.z * rad2deg).toFixed(1)}]`);
        }
      });
    });
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
