const assert = require('node:assert/strict');
const launch = require('./browser-test-options.cjs');
(async () => {
  const browser = await launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'], protocolTimeout: 180000 });
  const deadline = setTimeout(() => {
    console.error('Browser test exceeded its deadline');
    browser.process()?.kill('SIGKILL');
    process.exitCode = 1;
  }, 240000);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1000 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5173/?characterCount=0&preset=low&skipIntro=1&animals=0', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(async () => (await import('/src/features/scene/cameraState.ts')).cameraState.isSceneLaunched, { timeout: 180000 });
    await page.waitForSelector('[aria-label="Grille perruques"]', { visible: true, timeout: 60000 });
    await page.click('[aria-label="Grille perruques"]');
    await page.waitForFunction(async () => {
      const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const { WIGS_ITEMS } = await import('/src/features/inventory/inventoryData.ts');
      const grid = [..._roots.values()].map(root => root.store.getState().scene.getObjectByName('wigs-grid')).find(Boolean);
      if (!grid) return false;
      let busts = 0;
      grid.traverse(node => { if (node.userData.itemName === 'Buste Lara') busts++; });
      return busts === WIGS_ITEMS.length;
    }, { timeout: 180000 });
    assert.equal(await page.$eval('[aria-label="Grille perruques"]', button => button.getAttribute('aria-pressed')), 'true');
    await page.screenshot({ path: '/tmp/room-wig-grid.png' });
    await page.click('[aria-label="Grille inventaire (Alt+I)"]');
    assert.equal(await page.$eval('[aria-label="Grille perruques"]', button => button.getAttribute('aria-pressed')), 'false');
    await page.click('[aria-label="Grille perruques"]');
    assert.equal(await page.$eval('[aria-label="Grille inventaire (Alt+I)"]', button => button.getAttribute('aria-pressed')), 'false');
    await page.click('[aria-label="Grille perruques"]');
    assert.equal(await page.$eval('[aria-label="Grille perruques"]', button => button.getAttribute('aria-pressed')), 'false');
    assert.deepEqual(errors, []);
    console.log('PASS: all wigs mounted on Lara busts, grid switching and closing, no browser errors');
  } finally { clearTimeout(deadline); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
