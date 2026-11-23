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

    await page.goto(`${process.env.LARA_COMPARISON_URL || 'http://127.0.0.1:5174'}/lara-outfit-comparison.html`);
    await page.waitForFunction(() => document.body.innerText.includes('4 tenues'));

    // Click all three Gemini 4 Hydrogen (High) Basiques collection buttons
    for (const prefix of [
      'Basiques 01 · Maillots · Gemini 4 Hydrogen (High)',
      'Basiques 02 · Sport · Gemini 4 Hydrogen (High)',
      'Basiques 03 · Streetwear · Gemini 4 Hydrogen (High)',
    ]) {
      await page.evaluate((text) => {
        const btn = [...document.querySelectorAll('button')].find((b) => b.textContent === text);
        if (!btn) throw new Error(`Missing button: ${text}`);
        btn.click();
      }, prefix);
    }

    // 4 initial + 12 + 12 + 6 = 34 outfits on the grid
    await page.waitForFunction(() => document.body.innerText.includes('34 tenues'));

    await page.evaluate(async () => {
      const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      window.basiquesTestScene = () => _roots.get(document.querySelector('canvas')).store.getState().scene;
    });

    // 18 (Chart 01) + 20 (Chart 02) + 9 (Chart 03) = 47 custom clothing nodes across the 30 outfits
    await page.waitForFunction(() => {
      let count = 0;
      window.basiquesTestScene().traverse((o) => {
        if (o.name.startsWith('lara_custom_clothing_') && o.name.endsWith('-g4h-high')) count++;
      });
      return count === 47;
    }, { timeout: 120000 });

    for (const animation of ['idle', 'walking', 'sitting-idle']) {
      await page.evaluate((v) => {
        const select = [...document.querySelectorAll('label')].find((l) => l.textContent.startsWith('Animation commune')).querySelector('select');
        select.value = v;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }, animation);
      await new Promise((r) => setTimeout(r, 2500));

      const report = await page.evaluate(() => {
        const result = [];
        window.basiquesTestScene().traverse((root) => {
          if (!root.name.startsWith('lara_custom_clothing_') || !root.name.endsWith('-g4h-high')) return;
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

      assert.equal(report.length, 47);
      for (const garment of report) {
        assert.ok(garment.valid && garment.vertices > 0, JSON.stringify(garment));
      }
      await page.screenshot({ path: `/tmp/lara-basiques-g4h-high-${animation}.png` });
    }

    assert.deepEqual(errors, []);
    console.log('PASS: all 30 Basiques 01/02/03 outfits (47 garment instances) validated across idle, walking, sitting-idle with native skeletons and finite vertices');
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
