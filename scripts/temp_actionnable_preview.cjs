const assert = require('node:assert/strict');
const launch = require('./browser-test-options.cjs');
(async () => {
  const browser = await launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5173'}/AGENTS.md`);
    await page.evaluate(async () => {
      window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const { default: React } = await import('/node_modules/.vite/deps/react.js');
      const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js');
      const { Inventory } = await import('/src/features/inventory/Inventory.tsx');
      await import('/scss/app.scss'); await import('/src/index.css');
      history.replaceState({}, '', '/studio.html?inventory=actionnable&item=kallax-ne-stack');
      document.body.innerHTML = '<div id="test-root"></div>';
      createRoot(document.getElementById('test-root')).render(React.createElement(Inventory, { initialCategory: 'actionnable', onClose() {} }));
    });
    await page.waitForSelector('[aria-label="PNJ de la preview"]', { timeout: 60000 });
    assert.equal(await page.$$eval('[aria-label="Smart action de la preview"] option:not([value=""])', options => options.length), 2);
    assert.ok(await page.$eval('[aria-label="PNJ de la preview"]', select => {
      const rect = select.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom < innerHeight;
    }), 'Le sélecteur PNJ doit être visible sans défiler');
    await page.select('[aria-label="Smart action de la preview"]', 'drona-ne-catchall:pick-item');
    await page.waitForSelector('[aria-label="Retirer le PNJ"]');
    await page.waitForFunction(async () => {
      const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      for (const root of _roots.values()) {
        const preview = root.store.getState().scene.getObjectByName('SmartActionPreview');
        if (preview?.userData.characterId === 'native' && preview.userData.playback.time > 0) return true;
      }
      return false;
    }, { timeout: 120000 });
    const result = await page.evaluate(async () => {
      const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      for (const root of _roots.values()) {
        const preview = root.store.getState().scene.getObjectByName('SmartActionPreview');
        if (preview) return { character: preview.userData.characterId, animation: preview.userData.animation, time: preview.userData.playback.time };
      }
    });
    assert.equal(result.character, 'native');
    assert.ok(result.time > 0);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: '/tmp/actionnable-kallax-ne.png' });
    console.log('PASS: sélecteur visible, deux smart actions et PNJ animé dans Kallax NE', result);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
