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
      console.log("=== CC Homme Hierarchy and Rotations ===");
      const model = window.refModels.male;
      if (!model) return;
      
      const rad2deg = 180 / Math.PI;
      const dumpBone = (bone, depth = 0) => {
        const indent = '  '.repeat(depth);
        const q = bone.quaternion;
        const e = new THREE.Euler().setFromQuaternion(q);
        const wq = new THREE.Quaternion();
        bone.getWorldQuaternion(wq);
        const we = new THREE.Euler().setFromQuaternion(wq);
        
        console.log(`${indent}Bone: "${bone.name}"`);
        console.log(`${indent}  Local Q: [${q.x.toFixed(4)}, ${q.y.toFixed(4)}, ${q.z.toFixed(4)}, ${q.w.toFixed(4)}]`);
        console.log(`${indent}  Local Euler (deg): [${(e.x * rad2deg).toFixed(1)}, ${(e.y * rad2deg).toFixed(1)}, ${(e.z * rad2deg).toFixed(1)}]`);
        console.log(`${indent}  World Euler (deg): [${(we.x * rad2deg).toFixed(1)}, ${(we.y * rad2deg).toFixed(1)}, ${(we.z * rad2deg).toFixed(1)}]`);
        
        for (const child of bone.children) {
          if (child.isBone) {
            dumpBone(child, depth + 1);
          }
        }
      };
      
      // Find root bone
      let rootBone = null;
      model.traverse(c => {
        if (c.isBone && (!c.parent || !c.parent.isBone)) {
          rootBone = c;
        }
      });
      
      if (rootBone) {
        dumpBone(rootBone);
      } else {
        console.log("No root bone found!");
      }
    });
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
