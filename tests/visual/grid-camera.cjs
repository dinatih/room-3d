// With Vite running: node tests/visual/grid-camera.cjs
const assert = require('node:assert/strict');
const launch = require('../../scripts/browser-test-options.cjs');

(async () => {
  const browser = await launch({ args: ['--no-sandbox', '--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan,VulkanFromANGLE', '--disable-vulkan-surface'], protocolTimeout: 180000 });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1000 });
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error(error); });
    const base = process.env.ROOM_TEST_URL || 'http://127.0.0.1:5173';
    const ready = async () => {
      console.log('Waiting for scene:', page.url());
      await page.waitForFunction(async () => {
        const entry = performance.getEntriesByType('resource').find(entry => /\/src\/features\/scene\/cameraState\.ts(?:\?|$)/.test(entry.name));
        if (!entry) return false;
        const { cameraState } = await import(entry.name);
        return cameraState.isSceneLaunched && !cameraState.isIntroRunning;
      }, { timeout: 180000 });
      await page.evaluate(async () => {
        const moduleUrl = suffix => performance.getEntriesByType('resource').find(entry => entry.name.split('?')[0].endsWith(suffix)).name;
        window.gridStore = (await import(moduleUrl('/store/useSceneStore.ts'))).useSceneStore;
        window.gridState = (await import(moduleUrl('/scene/cameraState.ts'))).cameraState;
        const fiberUrl = performance.getEntriesByType('resource').find(entry => entry.name.includes('/@react-three_fiber.js?v=')).name;
        const { _roots } = await import(fiberUrl);
        window.gridRoot = [..._roots.values()].find(root => root.store.getState().scene === window.__THREE_SCENE__).store;
      });
    };
    const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const snapshot = () => page.evaluate(() => {
      const state = window.gridStore.getState(), root = window.gridRoot.getState();
      return { mode: window.gridState.mode, target: state.cameraTarget, projection: state.cameraProjection,
        position: root.camera.position.toArray(), pivot: root.scene.getObjectByName('orbit-target-marker')?.position.toArray(), zoom: root.camera.zoom,
        layers: { lara: state.layers.characterGrid, wigs: state.layers.wigGrid, inventory: state.layers.inventoryGrid } };
    });
    const toggle = async kind => {
      if (kind === 'lara') await page.evaluate(() => document.dispatchEvent(new CustomEvent('camera-mode', { detail: 'toggle-npc-grid' })));
      else {
        await page.click('[aria-label="Outils & Actions"]');
        await page.click(kind === 'wigs' ? '[aria-label="Grille perruques"]' : '[aria-label="Grille inventaire (Alt+I)"]');
        await page.keyboard.press('Escape');
      }
      await settle();
    };
    const switchOnly = process.argv.includes('--switch-only');
    for (const view of switchOnly ? [''] : ['', '&follow=1', '&target=studio&projection=ortho&cameraPos=north-east']) {
      await page.goto(`${base}/?preset=low&characterCount=1&animals=0&skipIntro=1${view}`, { waitUntil: 'domcontentloaded' });
      await ready();
      await settle();
      if (!view) assert.equal(new URL(page.url()).search, '?preset=low&characterCount=1&animals=0&skipIntro=1');
      let laraPosition;
      for (const kind of ['lara', 'wigs']) {
        const before = await snapshot();
        await toggle(kind);
        await page.waitForFunction(kind => window.gridStore.getState().cameraTarget === (kind === 'lara' ? 'charactersGrid' : 'inventoryObjectGrid') && window.gridState.mode === 'orbit', { timeout: 180000 }, kind);
        await settle();
        const grid = await snapshot();
        assert.equal(grid.projection, kind === 'lara' ? 'persp' : 'ortho');
        assert.equal(grid.layers[kind], true);
        assert.equal(new URL(page.url()).searchParams.has('mode'), false);
        const centered = await page.evaluate(async kind => {
          const suffix = kind === 'lara' ? '/character/characterGridUtils.ts' : '/inventoryGridCamera.ts';
          const url = performance.getEntriesByType('resource').find(entry => entry.name.split('?')[0].endsWith(suffix)).name;
          const api = await import(url);
          const target = kind === 'lara' ? api.getCharacterGridCameraView().target : api.getInventoryGridCameraTarget();
          const camera = window.gridRoot.getState().camera;
          const point = camera.position.clone().set(...target).project(camera);
          return Math.hypot(point.x, point.y);
        }, kind);
        assert(centered < .001, 'Camera must center the grid');
        console.log('Grid opened:', kind, grid);
        if (kind === 'lara') laraPosition = grid.position;
        if (kind === 'wigs') {
          await toggle('inventory');
          await page.keyboard.press('p');
          await settle();
          await toggle('lara');
          const characters = await snapshot();
          assert.deepEqual(characters.layers, { lara: true, wigs: false, inventory: false });
          assert.equal(characters.target, 'charactersGrid');
          assert.equal(characters.projection, 'persp');
          assert(Math.hypot(...characters.position.map((value, i) => value - laraPosition[i])) < .01, 'Inventory → characters must restore the character grid framing');
          await toggle('wigs');
          assert.deepEqual((await snapshot()).layers, { lara: false, wigs: true, inventory: false });
        }
        await toggle(kind);
        await settle();
        const after = await snapshot();
        assert.equal(after.mode, before.mode);
        assert.equal(after.target, before.target);
        assert.equal(after.projection, before.projection);
        if (before.mode === 'orbit') {
          assert(Math.hypot(...after.position.map((v, i) => v - before.position[i])) < .01, 'Restore camera position');
          assert(Math.hypot(...after.pivot.map((v, i) => v - before.pivot[i])) < .01, 'Restore camera pivot');
          assert(Math.abs(after.zoom - before.zoom) < .0001, 'Restore zoom');
        }
        console.log('Grid restored:', kind, before.mode);
      }
    }
    for (const query of switchOnly ? [] : ['target=charactersGrid', 'target=inventoryObjectGrid&wigGrid=1']) {
      await page.goto(`${base}/?preset=low&characterCount=1&animals=0&skipIntro=1&${query}`, { waitUntil: 'domcontentloaded' });
      await ready(); await settle();
      const expected = query.includes('wigGrid') ? 'inventoryObjectGrid' : 'charactersGrid';
      await page.waitForFunction(expected => window.gridStore.getState().cameraTarget === expected && window.gridState.mode === 'orbit', {}, expected);
      const grid = await snapshot();
      assert.equal(expected === 'charactersGrid' ? grid.layers.lara : grid.layers.wigs && !grid.layers.inventory, true);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await ready(); await settle();
      assert.equal((await snapshot()).target, expected);
      console.log('Direct grid and reload:', query);
    }
    assert.deepEqual(errors, []);
    console.log('PASS: grid targets, projections, restoration, switching and direct links');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
