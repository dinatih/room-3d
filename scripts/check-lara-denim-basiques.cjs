const assert = require('node:assert/strict');
const launch = require('./browser-test-options.cjs');

(async () => {
  const browser = await launch({ args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1200 });
    const errors = [];
    page.on('pageerror', (e) => {
      errors.push(e.message);
      console.error(e.stack);
    });
    await page.setRequestInterception(true);
    page.on('request', (r) => {
      const u = new URL(r.url());
      return ['localhost', '127.0.0.1'].includes(u.hostname) || ['data:', 'blob:'].includes(u.protocol)
        ? r.continue()
        : r.abort();
    });

    await page.goto(`${process.env.LARA_COMPARISON_URL || 'http://127.0.0.1:5173'}/lara-outfit-comparison.html`);
    await page.waitForFunction(() => document.body.innerText.includes('4 tenues'));
    await page.evaluate(() =>
      [...document.querySelectorAll('button')]
        .find((b) => b.textContent === 'Ajouter basiques denim · Gemini 4 Hydrogen medium')
        .click(),
    );
    await page.waitForFunction(() => document.body.innerText.includes('35 tenues'));

    await page.evaluate(async () => {
      const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      window.denimTestScene = () => _roots.get(document.querySelector('canvas')).store.getState().scene;
    });

    // Wait for all 31 denim garments + 4 cropped/vest pairs (7 bottoms + 24 tops/one-pieces = 31,
    // note: the 4 jackets/vests are paired with denim-jeans-classic-g4h-medium, so 31 + 4 = 35 custom meshes!)
    await page.waitForFunction(
      () => {
        let count = 0;
        window.denimTestScene().traverse((o) => {
          if (o.name.startsWith('lara_custom_clothing_') && o.name.endsWith('-g4h-medium')) count++;
        });
        return count === 35;
      },
      { timeout: 120000 },
    );

    for (const animation of ['idle', 'walking', 'sitting-idle']) {
      await page.evaluate((v) => {
        const select = [...document.querySelectorAll('label')]
          .find((l) => l.textContent.startsWith('Animation commune'))
          .querySelector('select');
        select.value = v;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }, animation);
      await new Promise((r) => setTimeout(r, 2500));

      const report = await page.evaluate(() => {
        const result = [];
        window.denimTestScene().traverse((root) => {
          if (!root.name.startsWith('lara_custom_clothing_') || !root.name.endsWith('-g4h-medium')) return;
          let vertices = 0;
          let valid = true;
          root.traverse((o) => {
            if (!o.isSkinnedMesh) return;
            const p = o.position.clone();
            for (let i = 0; i < o.geometry.attributes.position.count; i++) {
              o.getVertexPosition(i, p);
              vertices++;
              if (!Number.isFinite(p.x + p.y + p.z)) valid = false;
            }
            for (const bone of o.skeleton.bones) {
              if (root.parent.getObjectByName(bone.name) !== bone) valid = false;
            }
          });
          result.push({ name: root.name, vertices, valid });
        });
        return result;
      });

      assert.equal(report.length, 35);
      for (const garment of report) {
        assert.ok(garment.valid && garment.vertices > 0, JSON.stringify(garment));
      }
      await page.screenshot({ path: `/tmp/lara-denim-basiques-${animation}.png` });
    }

    assert.deepEqual(errors, []);
    console.log(
      'PASS: 31 Basiques Denim (Gemini 4 Hydrogen medium) outfits loaded; idle, walking, sitting; native skeletons and finite animated vertices',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
