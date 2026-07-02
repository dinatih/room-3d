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
      // Toggle play to start animation
      const playBtn = document.getElementById('play-btn');
      if (playBtn && !playBtn.classList.contains('active')) {
        playBtn.click();
      }
      console.log("Started playback...");
    });
    
    // Wait for animation to play a bit
    await new Promise(r => setTimeout(r, 1500));
    
    await page.evaluate(() => {
      console.log("=== CC Homme Parts during Playback ===");
      const model = window.refModels.male;
      if (!model) return;
      
      model.updateMatrixWorld(true);
      
      const printBone = (name) => {
        const c = model.getObjectByName(name);
        if (!c) return;
        
        const q = c.quaternion;
        const e = new THREE.Euler().setFromQuaternion(q);
        const wq = new THREE.Quaternion();
        c.getWorldQuaternion(wq);
        const we = new THREE.Euler().setFromQuaternion(wq);
        const wp = new THREE.Vector3();
        c.getWorldPosition(wp);
        
        const rad2deg = 180 / Math.PI;
        console.log(`Bone: "${c.name}"`);
        console.log(`  World Pos: [${wp.x.toFixed(3)}, ${wp.y.toFixed(3)}, ${wp.z.toFixed(3)}]`);
        console.log(`  World Euler (deg): [${(we.x * rad2deg).toFixed(1)}, ${(we.y * rad2deg).toFixed(1)}, ${(we.z * rad2deg).toFixed(1)}]`);
      };
      
      printBone('CC_Base_Hip_0106');
      printBone('CC_Base_Pelvis_0107');
      printBone('CC_Base_L_Thigh_0108');
      printBone('CC_Base_R_Thigh_0123');
    });
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
