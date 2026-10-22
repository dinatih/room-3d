// With Vite running: HORNET_TEST_URL=http://127.0.0.1:5173 node tests/visual/hornet-controls.cjs
const assert = require('node:assert/strict');
const launchBrowser = require('../../scripts/browser-test-options.cjs');

(async () => {
  const browser = await launchBrowser({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.setViewport({ width: 1280, height: 800 });
    await page.setRequestInterception(true);
    page.on('request', request => request.isNavigationRequest()
      ? request.respond({ contentType: 'text/html', body: '<body class="m-0"><div id="root"></div></body>' })
      : request.continue());
    await page.goto(`${process.env.HORNET_TEST_URL || 'http://127.0.0.1:5173'}/?mode=orbit&cameraTarget=studio`);
    await page.evaluate(async () => {
      const RefreshRuntime = (await import('/@react-refresh')).default;
      RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      await import('/scss/app.scss');
      const { CameraController } = await import('/src/features/scene/CameraController.tsx');
      const { BlackHornetDrone } = await import('/src/features/scene/items/BlackHornetDrone.tsx');
      const { ViewControlBar } = await import('/src/features/scene/ViewControlBar.tsx');
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const fiberUrl = performance.getEntriesByType('resource').find(entry => entry.name.includes('/@react-three_fiber.js?v=')).name;
      const fiber = await import(fiberUrl);
      window.hornetCamera = (await import('/src/features/scene/cameraState.ts')).cameraState;
      window.hornetStore = (await import('/src/features/scene/droneControls.ts')).useDroneControlStore;
      window.sceneStore = (await import('/src/features/scene/store/useSceneStore.ts')).useSceneStore;
      window.hornetCamera.isSceneLaunched = true;
      window.hornetRoots = fiber._roots;
      const h = React.createElement;
      window.hornetApp = createRoot(document.getElementById('root'));
      window.hornetApp.render(h(React.Fragment, null,
        h('div', { style: { height: '100vh' } }, h(fiber.Canvas, { camera: { position: [150, 200, 400], near: 0.1, far: 50000 }, frameloop: 'demand' },
          h(React.Suspense, { fallback: null }, h(CameraController), h(BlackHornetDrone)),
          h('ambientLight', { intensity: 2 }),
          h('gridHelper', { args: [2000, 20] }))),
        h(ViewControlBar, { showCharacterModes: true })));
    });
    await page.waitForFunction(() => window.hornetStore?.getState().available, { timeout: 60000 });
    const pose = () => page.evaluate(() => ({ ...window.hornetCamera.positions.drone }));
    const character = await page.evaluate(() => [window.hornetCamera.characterX, window.hornetCamera.characterZ, window.sceneStore.getState().activeCharacterId]);
    const click = title => page.click(`button[title="${title}"]`);
    const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const hold = async (key, ms = 250) => {
      await page.keyboard.down(key);
      await new Promise(resolve => setTimeout(resolve, ms));
      await page.keyboard.up(key);
      await settle();
    };
    await click('Observer la scène depuis la caméra du Hornet');
    await page.waitForFunction(() => window.hornetCamera.animalTarget === 'drone' && window.hornetCamera.mode === 'fpv');
    assert.equal(await page.evaluate(() => window.hornetStore.getState().piloting), false);
    await click('Piloter le Hornet');
    await page.waitForFunction(() => window.hornetStore.getState().piloting);
    await settle();
    await page.evaluate(() => {
      window.hornetLeakedKeys = [];
      window.addEventListener('keydown', event => {
        if (['w', 's'].includes(event.key)) window.hornetLeakedKeys.push(event.key);
      });
    });
    const start = await pose();
    await hold('z');
    const forward = await pose();
    assert(Math.hypot(forward.x - start.x, forward.z - start.z) > 10, 'Forward input must move drone');
    await hold('w');
    await hold('ArrowRight');
    const strafed = await pose();
    assert(strafed.x < forward.x - 10, 'Right arrow must strafe to camera right');
    await hold('Space');
    const above = await pose();
    assert(above.y > forward.y + 10, 'Space must raise drone');
    await hold('c');
    const below = await pose();
    assert(below.y < above.y - 10, 'C must lower drone');
    await hold('s');
    assert.deepEqual(await page.evaluate(() => window.hornetLeakedKeys), [], 'Pilot keys must not trigger scene shortcuts');
    assert.deepEqual(await page.evaluate(() => [window.hornetCamera.characterX, window.hornetCamera.characterZ, window.sceneStore.getState().activeCharacterId]), character, 'Pilot input must not affect human');
    await page.keyboard.down('z');
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.keyboard.up('z');
    await settle();
    const stopped = await pose();
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.deepEqual(await pose(), stopped, 'Blur must release held controls');
    await page.keyboard.down('z');
    await page.focus('select');
    await page.keyboard.up('z');
    await settle();
    const focused = await pose();
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.deepEqual(await pose(), focused, 'Editing a field must release controls');
    const canvas = await page.$('canvas');
    const box = await canvas.boundingBox();
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.keyboard.down('z');
    await page.mouse.move(x + 150, y - 80, { steps: 8 });
    await page.mouse.up();
    await settle();
    assert((await pose()).yaw < stopped.yaw, 'Drag right must turn right');
    assert(await page.evaluate(() => window.hornetCamera.animalViews.drone.forward.y > 0), 'Drag up must pitch camera upwards');
    const afterDrag = await pose();
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.notDeepEqual(await pose(), afterDrag, 'Releasing mouse must not release held movement keys');
    await page.keyboard.up('z');
    await page.screenshot({ path: '/tmp/room-hornet-pilot.png' });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.hornetCamera.mode === 'orbit' && !window.hornetStore.getState().piloting);
    const parked = await pose();
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.deepEqual(await pose(), parked, 'Exit must leave drone hovering in place');
    await click('Piloter le Hornet');
    await page.waitForFunction(() => window.hornetStore.getState().piloting);
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('camera-mode', { detail: 'fpv' })));
    await page.waitForFunction(() => !window.hornetStore.getState().piloting && window.hornetCamera.animalTarget === null);
    await click('Piloter le Hornet');
    await page.waitForFunction(() => window.hornetStore.getState().piloting);
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'drone-patrol-all' } })));
    await page.waitForFunction(() => !window.hornetStore.getState().piloting);
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.notDeepEqual(await pose(), parked, 'Patrol must resume after manual flight');
    await page.evaluate(() => window.hornetApp.unmount());
    assert.equal(await page.evaluate(() => window.hornetCamera.animalTarget), null);
    assert.equal(await page.evaluate(() => window.hornetStore.getState().available), false);
    assert.deepEqual(errors, []);
    console.log('Hornet: view, movement, altitude, mouse look, input isolation, focus/blur, exit/hover, human FPV and patrol resume passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
