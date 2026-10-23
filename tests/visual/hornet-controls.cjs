// With Vite running: HORNET_TEST_URL=http://127.0.0.1:5173 node tests/visual/hornet-controls.cjs
const assert = require('node:assert/strict');
const launchBrowser = require('../../scripts/browser-test-options.cjs');

(async () => {
  const browser = await launchBrowser({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => { errors.push(String(error)); console.error(error); });
    page.on('console', message => { if (message.type() === 'error') console.error(message.text()); });
    page.on('requestfailed', request => console.error(`${request.url()}: ${request.failure()?.errorText}`));
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
      await import('/node_modules/bootstrap-icons/font/bootstrap-icons.css');
      const { CameraController } = await import('/src/features/scene/CameraController.tsx');
      const { BlackHornetDrone } = await import('/src/features/scene/items/BlackHornetDrone.tsx');
      const { ViewControlBar } = await import('/src/features/scene/ViewControlBar.tsx');
      const { HornetControls, HornetMenuButton } = await import('/src/features/scene/HornetControls.tsx');
      const { AppConsole } = await import('/src/features/ui/AppConsole.tsx');
      const { PanelPopover } = await import('/src/features/scene/sidepanel/PanelPopover.tsx');
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const fiberUrl = performance.getEntriesByType('resource').find(entry => entry.name.includes('/@react-three_fiber.js?v=')).name;
      const fiber = await import(fiberUrl);
      window.hornetCamera = (await import('/src/features/scene/cameraState.ts')).cameraState;
      window.hornetStore = (await import('/src/features/scene/droneControls.ts')).useDroneControlStore;
      window.sceneStore = (await import('/src/features/scene/store/useSceneStore.ts')).useSceneStore;
      window.hornetCamera.isSceneLaunched = true;
      window.hornetRoots = fiber._roots;
      window.hornetCameraErrors = [];
      function CheckCameraMount() {
        fiber.useFrame(({ camera }) => {
          if (window.hornetCamera.animalTarget !== 'drone' || window.hornetCamera.mode !== 'fpv') return;
          const { eyes, forward } = window.hornetCamera.animalViews.drone;
          const error = Math.hypot(camera.position.x - eyes.x, camera.position.y - eyes.y, camera.position.z - eyes.z);
          const direction = camera.getWorldDirection(camera.position.clone());
          const lookError = Math.hypot(direction.x - forward.x, direction.y - forward.y, direction.z - forward.z);
          if (error > 1e-8 || lookError > 1e-8) window.hornetCameraErrors.push({ error, lookError });
        });
        return null;
      }
      const h = React.createElement;
      window.hornetApp = createRoot(document.getElementById('root'));
      window.hornetApp.render(h(React.Fragment, null,
        h('div', { style: { height: '100vh' } }, h(fiber.Canvas, { camera: { position: [150, 200, 400], near: 0.1, far: 50000 }, frameloop: 'demand' },
          h(React.Suspense, { fallback: null }, h(CameraController), h(BlackHornetDrone), h(CheckCameraMount)),
          h('ambientLight', { intensity: 2 }),
          h('gridHelper', { args: [2000, 20] }))),
        h(ViewControlBar, { showCharacterModes: true }), h(HornetControls),
        h(AppConsole, { actionsMenu: h(PanelPopover, { icon: 'bi-plus-lg', title: 'Outils & Actions', noHeader: true }, h(HornetMenuButton)) })));
    });
    await page.waitForFunction(() => window.hornetStore?.getState().available, { timeout: 60000 });
    const pose = () => page.evaluate(() => ({ ...window.hornetCamera.positions.drone }));
    const character = await page.evaluate(() => [window.hornetCamera.characterX, window.hornetCamera.characterZ, window.sceneStore.getState().activeCharacterId]);
    const click = async title => {
      const selector = `button[title="${title}"]`;
      await page.waitForSelector(`${selector}:not([disabled])`);
      await page.click(selector);
    };
    const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const hold = async (key, ms = 250) => {
      await page.keyboard.down(key);
      await new Promise(resolve => setTimeout(resolve, ms));
      await page.keyboard.up(key);
      await settle();
    };
    assert.equal(await page.$('[aria-label="Contrôle des vues"] button[title="Observer la scène depuis la caméra du Hornet"]'), null, 'Hornet controls must be outside the main toolbar');
    assert.equal(await page.$('[aria-label="Commandes du Hornet"]'), null, 'Hornet panel must be hidden until requested');
    await click('Outils & Actions');
    await click('Afficher les commandes du Hornet');
    await click('Observer la scène depuis la caméra du Hornet');
    await page.waitForFunction(() => window.hornetCamera.animalTarget === 'drone' && window.hornetCamera.mode === 'fpv');
    assert.equal(await page.evaluate(() => window.hornetStore.getState().piloting), false);
    await click('Piloter le Hornet');
    await page.waitForFunction(() => window.hornetStore.getState().piloting);
    // The autonomous tour may have turned toward any viewpoint before manual input starts.
    await page.evaluate(async () => {
      const { droneInput } = await import('/src/features/scene/droneControls.ts');
      droneInput.yaw = 0;
      droneInput.pitch = 0;
    });
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
    const beforeTurn = await pose();
    await page.keyboard.down('Alt');
    await hold('ArrowRight');
    const rightTurn = await pose();
    assert(rightTurn.yaw < beforeTurn.yaw, 'Alt + right must rotate around Y');
    assert.deepEqual([rightTurn.x, rightTurn.y, rightTurn.z], [beforeTurn.x, beforeTurn.y, beforeTurn.z], 'Alt + arrows must rotate in place');
    const beforePitch = await page.evaluate(() => window.hornetCamera.animalViews.drone.forward.y);
    await hold('ArrowUp');
    assert(await page.evaluate(() => window.hornetCamera.animalViews.drone.forward.y) > beforePitch, 'Alt + up must pitch upwards');
    await page.keyboard.up('Alt');
    // Reproduire un relâchement d'Alt perdu : la flèche suivante porte altKey=false.
    await page.evaluate(async () => (await import('/src/features/scene/droneControls.ts')).droneInput.keys.add('Alt'));
    const afterAlt = await pose();
    await hold('ArrowUp');
    const afterPlainArrow = await pose();
    assert(Math.hypot(afterPlainArrow.x - afterAlt.x, afterPlainArrow.y - afterAlt.y, afterPlainArrow.z - afterAlt.z) > 10, 'Plain arrows must translate after releasing Alt, even if keyup was lost');
    assert.equal(afterPlainArrow.yaw, afterAlt.yaw, 'Plain arrows must not keep rotating');
    assert(await page.$eval('output[aria-label="Inclinaison du Hornet"]', element => parseFloat(element.textContent)) > 0, 'Indicator must show the upward flight angle');
    await click('Remettre à plat (0°)');
    await settle();
    assert.equal(await page.evaluate(() => window.hornetCamera.animalViews.drone.forward.y), 0, 'Level reset must make the view horizontal');
    assert.equal(await page.$eval('output[aria-label="Inclinaison du Hornet"]', element => element.textContent), '0.0°');
    const levelStart = await pose();
    await hold('ArrowUp');
    const levelEnd = await pose();
    assert.equal(levelEnd.y, levelStart.y, 'Forward flight must keep altitude after leveling');
    assert(Math.hypot(levelEnd.x - levelStart.x, levelEnd.z - levelStart.z) > 10);
    assert(await page.$eval('[aria-label="Commandes du Hornet"]', element => getComputedStyle(element).backgroundColor === 'rgba(0, 0, 0, 0)' && element.getBoundingClientRect().height <= 32 && !element.textContent.includes('Avancer fait')), 'Hornet controls must be transparent and fit on one compact row');
    await page.screenshot({ path: '/tmp/room-hornet-pilot.png' });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.hornetCamera.mode === 'orbit' && !window.hornetStore.getState().piloting);
    const parked = await pose();
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.deepEqual(await pose(), parked, 'Exit must leave drone hovering in place');
    await click('Piloter le Hornet');
    await page.waitForFunction(() => window.hornetStore.getState().piloting);
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('camera-mode', { detail: 'fpv' })));
    await page.waitForFunction(() => !window.hornetStore.getState().piloting && window.hornetCamera.animalTarget === 'drone');
    await click('Piloter le Hornet');
    await page.waitForFunction(() => window.hornetStore.getState().piloting);
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'drone-patrol-all' } })));
    await page.waitForFunction(() => !window.hornetStore.getState().piloting);
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.notDeepEqual(await pose(), parked, 'Patrol must resume after manual flight');
    assert.deepEqual(await page.evaluate(() => window.hornetCameraErrors), [], 'Camera must stay exactly at the published nose pose every frame, without damping or lag');
    await page.evaluate(() => window.hornetApp.unmount());
    assert.equal(await page.evaluate(() => window.hornetCamera.animalTarget), null);
    assert.equal(await page.evaluate(() => window.hornetStore.getState().available), false);
    assert.deepEqual(errors, []);
    console.log('Hornet: view, movement, altitude, mouse look, input isolation, focus/blur, exit/hover, human FPV and patrol resume passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
