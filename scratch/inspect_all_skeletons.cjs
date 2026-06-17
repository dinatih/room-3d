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
    console.error(e);
    await browser.close();
    return;
  }

  await new Promise(r => setTimeout(r, 4000));

  async function printModelBones(modelKey, animName) {
    console.log(`\n==========================================`);
    console.log(`BONE WORLD POSITIONS FOR ${modelKey} IN: ${animName}`);
    console.log(`==========================================`);
    
    await page.evaluate((name) => {
      const select = document.getElementById('select-anim');
      const opt = Array.from(select.options).find(o => o.text.includes(name));
      if (opt) {
        select.value = opt.value;
        select.dispatchEvent(new Event('change'));
      }
    }, animName);

    await new Promise(r => setTimeout(r, 2000));

    const bonesData = await page.evaluate((mKey) => {
      const instance = MODELS_META[mKey].instance;
      const list = [];
      if (instance) {
        instance.traverse(c => {
          if (c.isBone) {
            const pos = new THREE.Vector3();
            c.getWorldPosition(pos);
            list.push({
              name: c.name,
              x: pos.x.toFixed(2),
              y: pos.y.toFixed(2),
              z: pos.z.toFixed(2)
            });
          }
        });
      }
      return list;
    }, modelKey);

    bonesData.forEach(b => {
      const nameLower = b.name.toLowerCase();
      if (nameLower.includes('hips') || nameLower.includes('spine') || nameLower.includes('head') || nameLower.includes('foot') || nameLower.includes('ankle') || nameLower.includes('thigh') || nameLower.includes('knee')) {
        console.log(`${b.name.padEnd(30)}: (${b.x.padStart(7)}, ${b.y.padStart(7)}, ${b.z.padStart(7)})`);
      }
    });
  }

  await printModelBones('lara', 'Laying Idle 1 (anim_laying_idle_1.glb)');
  await printModelBones('ybot', 'Laying Idle 1 (anim_laying_idle_1.glb)');

  await browser.close();
})();
