const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    console.log(`[BROWSER LOG]: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.error(`[BROWSER ERROR]: ${err.toString()}`);
  });

  try {
    console.log('Navigating to http://localhost:5173/cyber_sekes_scratch.html...');
    await page.goto('http://localhost:5173/cyber_sekes_scratch.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    console.log('Waiting 3 seconds for initial load...');
    await new Promise(r => setTimeout(r, 3000));

    console.log('Inspecting CC Homme core bone positions...');
    await page.evaluate(() => {
      const refs = window.refModels;
      if (!refs || !refs.male) {
        console.error('CC Homme (refs.male) not loaded!');
        return;
      }
      
      const model = refs.male;
      model.updateMatrixWorld(true);
      console.log(`=== Core World Positions of CC Homme bones (scale: ${model.scale.x.toFixed(4)}) ===`);
      
      const coreBones = ['Hip', 'Pelvis', 'Waist', 'Spine', 'Thigh', 'Calf', 'Foot', 'Root'];
      model.traverse(c => {
        if (c.isBone) {
          const isCore = coreBones.some(name => c.name.includes(name));
          if (!isCore) return;

          const worldPos = new THREE.Vector3();
          c.getWorldPosition(worldPos);
          const localPos = c.position;
          const parentName = c.parent ? c.parent.name : 'null';
          console.log(`Bone: "${c.name}" (parent: "${parentName}")`);
          console.log(`  Local Pos: [${localPos.x.toFixed(3)}, ${localPos.y.toFixed(3)}, ${localPos.z.toFixed(3)}]`);
          console.log(`  World Pos: [${worldPos.x.toFixed(3)}, ${worldPos.y.toFixed(3)}, ${worldPos.z.toFixed(3)}]`);
        }
      });
    });

  } catch (e) {
    console.error('Execution error:', e.message);
  } finally {
    await browser.close();
  }
})();
