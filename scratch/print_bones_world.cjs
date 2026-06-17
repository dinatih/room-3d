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

  async function printBones(animName) {
    console.log(`\n==========================================`);
    console.log(`BONE WORLD POSITIONS FOR: ${animName}`);
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

    const bonesData = await page.evaluate(() => {
      const xbot = MODELS_META.xbot.instance;
      const list = [];
      if (xbot) {
        xbot.traverse(c => {
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
    });

    bonesData.forEach(b => {
      // Print main bones only to keep it readable
      if (b.name.includes('Hips') || b.name.includes('Spine') || b.name.includes('Neck') || b.name.includes('Head') || b.name.includes('Leg') || b.name.includes('Foot') || b.name.includes('Arm')) {
        console.log(`${b.name.padEnd(30)}: (${b.x.padStart(7)}, ${b.y.padStart(7)}, ${b.z.padStart(7)})`);
      }
    });
  }

  await printBones('Laying Idle (anim_laying_idle.glb)');
  await printBones('Laying Idle 1 (anim_laying_idle_1.glb)');

  await browser.close();
})();
