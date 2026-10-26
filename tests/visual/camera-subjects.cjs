// With Vite running: node tests/visual/camera-subjects.cjs
const assert = require('node:assert/strict');
const launchBrowser = require('../../scripts/browser-test-options.cjs');

(async () => {
  const browser = await launchBrowser({ args: ['--no-sandbox', '--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan,VulkanFromANGLE', '--disable-vulkan-surface'], protocolTimeout: 180000 });
  try {
    const page = await browser.newPage(), errors = [];
    page.on('pageerror', error => { errors.push(String(error)); console.error(error); });
    await page.setViewport({ width: 1280, height: 800 });
    const base = process.env.HORNET_TEST_URL || 'http://127.0.0.1:5173';
    await page.goto(`${base}/?preset=low&characterCount=0&character=marissa&skipIntro=1&target=studio`, { waitUntil: 'domcontentloaded' });
    const ready = async () => {
      await page.waitForFunction(async () => {
        const { cameraState } = await import('/src/features/scene/cameraState.ts');
        const { CAMERA_SUBJECTS } = await import('/src/features/scene/camera/cameraSubjects.ts');
        return cameraState.isSceneLaunched && CAMERA_SUBJECTS.every(choice => choice.id === 'character' || cameraState.animalViews[choice.id]);
      }, { timeout: 180000 });
      return page.evaluate(async () => {
        window.cameraSubjectsState = (await import('/src/features/scene/cameraState.ts')).cameraState;
        window.cameraSubjectsStore = (await import('/src/features/scene/store/useSceneStore.ts')).useSceneStore;
        window.cameraSubjectsPilot = (await import('/src/features/scene/droneControls.ts')).useDroneControlStore;
        return { character: window.cameraSubjectsStore.getState().activeCharacterId, choices: (await import('/src/features/scene/camera/cameraSubjects.ts')).CAMERA_SUBJECTS };
      });
    };
    const initial = await ready();
    const selector = '[aria-label="Objet de position de la caméra"]';
    await page.waitForSelector(selector);
    const layout = await page.$eval(selector, select => {
      const box = select.getBoundingClientRect();
      const down = select.closest('.virtual-dpad').querySelector('.virtual-dpad__button--down').getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, downLeft: down.left, downTop: down.top, text: select.textContent.trim() };
    });
    assert(layout.right <= layout.downLeft && Math.abs(layout.top - layout.downTop) < 1, 'Selector must sit immediately left of the left D-pad down arrow');
    assert.equal(layout.text, '', 'Only the icon should be visible when closed');
    assert.deepEqual(await page.$$eval('[role="listbox"][aria-label="Position caméra"] [role="option"]', options => options.map(o => o.textContent)), ['Personnage actif', 'Hornet', 'Chien', 'Oiseau', 'G1', 'Go2', 'As2', 'H2', 'Jumper']);
    const select = async (id, mode) => {
      await page.click(selector);
      await page.waitForSelector('[role="listbox"][aria-label="Position caméra"]', { visible: true });
      const index = initial.choices.findIndex(choice => choice.id === id);
      await page.click(`[role="listbox"][aria-label="Position caméra"] button:nth-child(${index + 1})`);
      await page.waitForFunction((id, mode) => window.cameraSubjectsState.animalTarget === (id === 'character' ? null : id) && window.cameraSubjectsState.mode === mode, {}, id, mode);
      assert.equal(await page.evaluate(() => window.cameraSubjectsStore.getState().activeCharacterId), initial.character, 'Camera selection must not change the active human');
      assert.equal(new URL(page.url()).searchParams.get('target'), id === 'character' && mode === 'fpv' ? null : initial.choices.find(choice => choice.id === id).target);
      assert.equal(new URL(page.url()).searchParams.get('character'), 'marissa');
      if (id !== 'character') {
        const view = await page.evaluate(id => window.cameraSubjectsState.animalViews[id], id);
        assert([...Object.values(view.eyes), ...Object.values(view.forward), view.radius].every(Number.isFinite));
        assert(view.radius > 0);
        assert(Math.abs(Math.hypot(...Object.values(view.forward)) - 1) < 1e-6);
      }
    };
    for (const choice of initial.choices) {
      await select(choice.id, 'follow');
      for (const [command, mode] of [['fpv', 'fpv'], ['toggle-follow', 'follow']]) {
        await page.evaluate(command => document.dispatchEvent(new CustomEvent('camera-mode', { detail: command })), command);
        await page.waitForFunction((id, mode) => window.cameraSubjectsState.mode === mode && window.cameraSubjectsState.animalTarget === (id === 'character' ? null : id), {}, choice.id, mode);
        assert.equal(new URL(page.url()).searchParams.get('target'), choice.id === 'character' && mode === 'fpv' ? null : choice.target, 'Mode switch must preserve the subject');
      }
    }
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('camera-mode', { detail: 'fpv' })));
    await page.waitForFunction(() => window.cameraSubjectsState.mode === 'fpv');
    for (const choice of initial.choices) await select(choice.id, 'fpv');
    const manualIds = initial.choices.filter(choice => choice.id !== 'character').map(choice => choice.id);
    const pose = id => page.evaluate(id => ({ ...window.cameraSubjectsState.positions[id] }), id);
    const hold = async (button, ms, padIndex = 0) => {
      const pads = await page.$$('.virtual-dpad');
      const box = await (await pads[padIndex].$(button)).boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await new Promise(resolve => setTimeout(resolve, ms));
      await page.mouse.up();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    };
    for (const id of manualIds) {
      await select(id, 'fpv');
      const before = await pose(id);
      await hold('.virtual-dpad__button--left', 350);
      const turned = await pose(id);
      assert(Math.abs(turned.yaw - before.yaw) > .1, `${id}: left cross must turn the selected body`);
      await hold('.virtual-dpad__button--up', 450);
      let moved = await pose(id);
      if (Math.hypot(moved.x - turned.x, moved.z - turned.z) < .1) {
        await hold('.virtual-dpad__button--down', 450);
        moved = await pose(id);
      }
      assert(Math.hypot(moved.x - turned.x, moved.z - turned.z) > .1, `${id}: left cross must move the selected body`);
      await new Promise(resolve => setTimeout(resolve, 200));
      assert.deepEqual(await pose(id), moved, `${id}: AI must stay paused after releasing controls`);
      await hold('.virtual-dpad__button--left', 200, 1);
      assert.deepEqual(await pose(id), moved, `${id}: right cross must only turn the camera`);
      console.log(`Manual body control passed: ${id}`);
    }
    await new Promise(resolve => setTimeout(resolve, 12500));
    const resumed = await page.evaluate(async ids => {
      const { readSubjectInput } = await import('/src/features/scene/camera/subjectControls.ts');
      return ids.every(id => readSubjectInput(id) === null) && window.__THREE_SCENE__.getObjectByName('shiba-inu').userData.dogBehavior.autonomous;
    }, manualIds);
    assert(resumed, 'Every actor must automatically resume after 12 seconds');
    await select('shiba', 'fpv');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: '/tmp/room-ushiro-fpv-forward.png' });
    await page.click(selector);
    await page.screenshot({ path: '/tmp/room-camera-subject-popover.png' });
    await page.keyboard.press('Escape');
    await select('drone', 'fpv');
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'drone-pilot' } })));
    await page.waitForFunction(() => window.cameraSubjectsPilot.getState().piloting);
    await select('unitree-g1', 'fpv');
    assert.equal(await page.evaluate(() => window.cameraSubjectsPilot.getState().piloting), false, 'Changing subject must stop Hornet piloting');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const camera = await page.evaluate(async () => {
      const fiberUrl = performance.getEntriesByType('resource').find(entry => entry.name.includes('/@react-three_fiber.js?v=')).name;
      const { _roots } = await import(fiberUrl);
      const root = [..._roots.values()].find(r => r.store.getState().scene === window.__THREE_SCENE__).store.getState();
      const view = window.cameraSubjectsState.animalViews['unitree-g1'];
      return { position: root.camera.position.toArray(), eyes: Object.values(view.eyes) };
    });
    assert(Math.hypot(...camera.position.map((value, i) => value - camera.eyes[i])) < 1, 'FPV must be mounted on the robot');
    await page.screenshot({ path: '/tmp/room-camera-subject-g1.png' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await ready();
    await page.waitForFunction(() => window.cameraSubjectsState.animalTarget === 'unitree-g1' && window.cameraSubjectsState.mode === 'fpv');
    console.log('G1 target restored after reload.');
    await select('character', 'fpv');
    await page.screenshot({ path: '/tmp/room-camera-subject-selector.png' });
    for (const [query, id, mode] of [['fpv=ushiro', 'shiba', 'fpv'], ['follow=bird', 'robin', 'follow'], ['cameraTarget=hornet&follow=1', 'drone', 'follow'], ['target=character&fpv=1', null, 'fpv']]) {
      await page.goto(`${base}/?preset=low&characterCount=0&character=marissa&skipIntro=1&${query}`, { waitUntil: 'domcontentloaded' });
      await ready();
      await page.waitForFunction((id, mode) => window.cameraSubjectsState.animalTarget === id && window.cameraSubjectsState.mode === mode, {}, id, mode);
      assert.equal(await page.evaluate(() => window.cameraSubjectsStore.getState().activeCharacterId), 'marissa');
      const target = initial.choices.find(choice => choice.id === (id ?? 'character')).target;
      assert.equal(new URL(page.url()).searchParams.get('target'), id === null && mode === 'fpv' ? null : target);
      console.log(`Direct link passed: ${query}`);
    }
    assert.deepEqual(errors, []);
    console.log('Camera subjects: nine choices, persistent URL targets, Follow/FPV switches, direct links, reload and human isolation passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
