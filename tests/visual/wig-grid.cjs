// With Vite running: node tests/visual/wig-grid.cjs
const assert = require('node:assert/strict');
const launch = require('../../scripts/browser-test-options.cjs');

(async () => {
  const browser = await launch({ args: ['--no-sandbox', '--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan,VulkanFromANGLE', '--disable-vulkan-surface'], protocolTimeout: 180000 });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1000 });
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error(error); });
    await page.goto('http://127.0.0.1:5173/?characterCount=0&preset=low&skipIntro=1&animals=0&mode=orbit', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(async () => (await import('/src/features/scene/cameraState.ts')).cameraState.isSceneLaunched, { timeout: 180000 });
    await page.waitForSelector('[aria-label="Outils & Actions"]', { visible: true });
    await page.click('[aria-label="Outils & Actions"]');
    const wigs = '[aria-label="Grille perruques"]';
    const inventory = '[aria-label="Grille inventaire (Alt+I)"]';
    await page.waitForSelector(wigs, { visible: true });
    await page.click(wigs);
    await page.waitForFunction(async () => {
      const { WIGS_ITEMS } = await import('/src/features/inventory/inventoryData.ts');
      const grid = window.__THREE_SCENE__?.getObjectByName('wigs-grid');
      if (!grid) return false;
      let busts = 0;
      grid.traverse(node => { if (node.userData.itemName === 'Buste Lara') busts++; });
      return busts === WIGS_ITEMS.length;
    }, { timeout: 180000 });
    assert.equal(await page.$eval(wigs, button => button.getAttribute('aria-pressed')), 'true');
    console.log('All wig busts mounted');
    await page.keyboard.press('Escape');
    await page.screenshot({ path: '/tmp/room-wig-grid.png' });
    await page.click('[aria-label="Outils & Actions"]');
    await page.waitForSelector(inventory, { visible: true });
    await page.click(inventory);
    await page.waitForFunction(selector => document.querySelector(selector).getAttribute('aria-pressed') === 'false', {}, wigs);
    await page.click(wigs);
    await page.waitForFunction(selector => document.querySelector(selector).getAttribute('aria-pressed') === 'false', {}, inventory);
    await page.click(wigs);
    await page.waitForFunction(selector => document.querySelector(selector).getAttribute('aria-pressed') === 'false', {}, wigs);
    assert.deepEqual(errors, []);
    console.log('PASS: all wigs mounted on Lara busts, grid switching and closing, no browser errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
