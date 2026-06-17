const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  try {
    await page.goto('http://localhost:5174/lara_xbot_debug.html', { waitUntil: 'load' });
  } catch (e) {
    console.error("Dev server not running?", e.message);
    await browser.close();
    return;
  }

  await new Promise(r => setTimeout(r, 4000));

  async function measure(animName) {
    console.log(`\n--- Measuring for animation: ${animName} ---`);
    await page.evaluate((name) => {
      const select = document.getElementById('select-anim');
      const opt = Array.from(select.options).find(o => o.text.includes(name));
      if (opt) {
        select.value = opt.value;
        select.dispatchEvent(new Event('change'));
      }
    }, animName);

    await new Promise(r => setTimeout(r, 2000));

    const data = await page.evaluate(() => {
      const results = {};
      ['lara', 'xbot', 'ybot'].forEach(key => {
        const meta = MODELS_META[key];
        if (meta && meta.instance) {
          const box = new THREE.Box3().setFromObject(meta.instance);
          const size = new THREE.Vector3();
          box.getSize(size);
          
          // Let's also get Hips, Knee, Foot positions
          const hips = meta.instance.getObjectByName(
            key === 'lara' ? 'mixamorig_root_hips' :
            key === 'ybot' ? 'mixamorig_Hips' : 'mixamorigHips'
          );
          const hipsPos = new THREE.Vector3();
          if (hips) {
            hips.getWorldPosition(hipsPos);
          }

          results[key] = {
            boxMin: [box.min.x.toFixed(2), box.min.y.toFixed(2), box.min.z.toFixed(2)],
            boxMax: [box.max.x.toFixed(2), box.max.y.toFixed(2), box.max.z.toFixed(2)],
            size: [size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2)],
            hipsY: hipsPos.y.toFixed(2)
          };
        }
      });
      return results;
    });
    console.log(JSON.stringify(data, null, 2));
  }

  await measure('Laying Idle (anim_laying_idle.glb)');
  await measure('Laying Idle 1 (anim_laying_idle_1.glb)');

  await browser.close();
})();
