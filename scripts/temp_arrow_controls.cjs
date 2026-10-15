const assert = require('node:assert/strict');
const launchBrowser = require('./browser-test-options.cjs');
const base = process.argv[2] || process.env.ROOM_TEST_URL || 'http://127.0.0.1:5193';

async function mount(page, query = '', width = 1200) {
  await page.setViewport({ width, height: 900 });
  await page.goto(`${base}/AGENTS.md${query}`);
  await page.evaluate(async () => {
    const refresh = (await import('/@react-refresh')).default;
    refresh.injectIntoGlobalHook(window);
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => type => type;
    window.__vite_plugin_react_preamble_installed__ = true;
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { Canvas, useThree } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
    const { CameraController } = await import('/src/features/scene/CameraController.tsx');
    const { VirtualDPad } = await import('/src/features/scene/VirtualDPad.tsx');
    const { ViewControlBar } = await import('/src/features/scene/ViewControlBar.tsx');
    const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
    const { cameraState } = await import('/src/features/scene/cameraState.ts');
    const url = await import('/src/features/scene/camera/cameraUrlParams.ts');
    cameraState.isSceneLaunched = true;
    document.body.replaceChildren();
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/node_modules/bootstrap/dist/css/bootstrap.min.css';
    document.head.append(css);
    document.body.style.margin = '0';
    const container = document.createElement('div');
    container.style.height = '600px';
    const toolbar = document.createElement('div');
    document.body.append(container, toolbar);
    window.fixture = { useSceneStore, cameraState, url };
    function Capture() {
      const state = useThree();
      React.useLayoutEffect(() => { Object.assign(window.fixture, state); }, [state]);
      return null;
    }
    const character = new URLSearchParams(location.search).has('testCharacter')
      ? React.createElement((await import('/src/features/scene/character/CharacterGroup.tsx')).CharacterGroup) : null;
    createRoot(container).render(React.createElement(Canvas, { camera: { position: [0, 300, 2000], near: 5, far: 10000 } },
      React.createElement(Capture), React.createElement(CameraController), React.createElement(React.Suspense, { fallback: null }, character)));
    const root = createRoot(toolbar);
    window.setControlsVisible = visible => root.render(React.createElement(ViewControlBar, {
      showCharacterModes: true, directionalControls: React.createElement(VirtualDPad, { visible }),
    }));
    window.setControlsVisible(true);
  });
  await page.waitForFunction(() => window.fixture?.camera && document.querySelector('.virtual-dpad'));
  await page.waitForFunction(() => window.fixture.cameraState.mode === window.fixture.useSceneStore.getState().cameraMode);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

const snapshot = page => page.evaluate(() => {
  const { camera, cameraState: s, useSceneStore } = window.fixture;
  const state = useSceneStore.getState();
  return { camera: camera.position.toArray(), character: [s.characterX, s.characterZ], yaw: s.followYaw,
    moving: s.isMoving, mode: state.cameraMode, target: state.cameraTarget, control: state.arrowControl,
    userTime: s.lastUserControlTime, url: location.search };
});
const distance = (a, b) => Math.hypot(...a.map((n, i) => n - b[i]));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function press(page, key, virtual = false) {
  const before = await snapshot(page);
  if (virtual) {
    const pos = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[key];
    const button = await page.$(`.virtual-dpad__button--${pos}`);
    const rect = await button.boundingBox();
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down();
  } else await page.keyboard.down(key);
  await page.waitForFunction(({ before, key }) => {
    const { cameraState: s, camera, useSceneStore } = window.fixture;
    const state = useSceneStore.getState();
    if (state.cameraMode === 'fpv' || state.arrowControl === 'character') {
      return key === 'ArrowUp' || key === 'ArrowDown'
        ? Math.hypot(s.characterX - before.character[0], s.characterZ - before.character[1]) > 1
        : Math.abs(s.followYaw - before.yaw) > 0.01;
    }
    return Math.hypot(...camera.position.toArray().map((n, i) => n - before.camera[i])) > 1;
  }, { timeout: 10000 }, { before, key });
  await pause(100);
  const during = await snapshot(page);
  if (virtual) { await page.mouse.move(10, 10); await page.mouse.up(); }
  else await page.keyboard.up(key);
  await page.waitForFunction(() => !window.fixture.cameraState.isMoving);
  return during;
}
async function choose(page, label) {
  await page.waitForSelector('.virtual-controls');
  await page.evaluate(label => [...document.querySelectorAll('.virtual-controls button')].find(button => button.textContent.trim() === label).click(), label);
  await page.waitForFunction(label => [...document.querySelectorAll('.virtual-controls button')].some(button => button.textContent.trim() === label && button.getAttribute('aria-pressed') === 'true'), {}, label);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

(async () => {
  const browser = await launchBrowser({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await mount(page, '?preset=low&characterCount=1&skipIntro=1');
    assert.equal((await snapshot(page)).mode, 'orbit');
    for (const virtual of [false, true]) {
      const before = await snapshot(page);
      const during = await press(page, 'ArrowUp', virtual);
      assert(distance(before.camera, during.camera) > 1, 'Studio camera must orbit');
      assert.deepEqual(during.character, before.character);
      assert.equal(during.moving, false);
      assert.equal(during.userTime, before.userTime);
    }
    await choose(page, 'Caméra · PNJ');
    for (const virtual of [false, true]) {
      const before = await snapshot(page);
      const during = await press(page, 'ArrowLeft', virtual);
      assert(distance(before.camera, during.camera) > 1, 'PNJ camera must orbit');
      assert.deepEqual(during.character, before.character);
      assert.equal(during.moving, false);
    }
    await choose(page, 'Déplacer · PNJ');
    for (const virtual of [false, true]) {
      const before = await snapshot(page);
      const during = await press(page, 'ArrowUp', virtual);
      assert(distance(before.character, during.character) > 1, 'PNJ must walk');
      assert.equal(during.moving, true);
      assert(distance(before.camera, during.camera) > 1, 'Camera must follow movement');
      assert.equal((await snapshot(page)).moving, false);
    }
    const beforeTurn = await snapshot(page);
    const turning = await press(page, 'ArrowLeft');
    assert.notEqual(turning.yaw, beforeTurn.yaw);
    assert.deepEqual(turning.character, beforeTurn.character);
    await pause(600);
    const framing = await page.evaluate(() => {
      const before = window.fixture.camera.position.toArray();
      window.fixture.useSceneStore.getState().selectArrowControl('character', 'camera');
      return { before, after: window.fixture.camera.position.toArray() };
    });
    assert.deepEqual(framing.after, framing.before, 'Switch must preserve framing');

    // Blur, hidden UI, changing modes and editable fields must release held input.
    await choose(page, 'Déplacer · PNJ');
    for (const action of ['blur', 'hide', 'mode', 'input']) {
      await page.keyboard.down('ArrowUp');
      await pause(80);
      await page.evaluate(action => {
        if (action === 'blur') window.dispatchEvent(new Event('blur'));
        if (action === 'hide') window.setControlsVisible(false);
        if (action === 'mode') window.fixture.useSceneStore.getState().selectArrowControl('character', 'camera');
        if (action === 'input') { const input = document.createElement('input'); document.body.append(input); input.focus(); }
      }, action);
      await pause(100);
      const stopped = await snapshot(page);
      await pause(100);
      assert.deepEqual((await snapshot(page)).character, stopped.character, `${action} must stop input`);
      await page.keyboard.up('ArrowUp');
      await page.evaluate(() => { document.querySelector('input')?.remove(); window.setControlsVisible(true); });
      await choose(page, 'Déplacer · PNJ');
    }
    // Round-trip all three choices and preserve independent URL options.
    for (const [label, mode, target, control] of [
      ['Caméra · Studio', 'orbit', 'studio', 'camera'],
      ['Caméra · PNJ', 'follow', 'character', 'camera'],
      ['Déplacer · PNJ', 'follow', 'character', 'character'],
    ]) {
      await choose(page, label);
      const selected = await snapshot(page);
      const params = new URLSearchParams(selected.url);
      assert.equal(params.get('mode'), mode);
      assert.equal(params.get('cameraTarget'), target);
      assert.equal(params.get('arrowControl'), control);
      assert.equal(params.get('preset'), 'low');
      await mount(page, selected.url);
      const restored = await snapshot(page);
      assert.equal(restored.mode, mode);
      assert.equal(restored.target, target);
      assert.equal(restored.control, control);
      assert.equal(await page.$eval('.virtual-controls button[aria-pressed="true"]', button => button.textContent.trim()), label);
    }
    await page.keyboard.press('v');
    await pause(120);
    assert.equal((await snapshot(page)).control, 'character');
    await page.keyboard.press('f');
    await pause(120);
    assert.equal((await snapshot(page)).control, 'camera');
    await page.keyboard.down('Alt'); await page.keyboard.press('o'); await page.keyboard.up('Alt');
    await pause(120);
    assert.equal((await snapshot(page)).target, 'studio');
    await mount(page, '?mode=fpv&preset=low&characterCount=1');
    assert.equal((await snapshot(page)).control, 'character');
    assert(distance((await snapshot(page)).character, (await press(page, 'ArrowUp')).character) > 1);
    await mount(page, '?cameraPos=xbot&preset=low&characterCount=1');
    await choose(page, 'Caméra · PNJ');
    assert.equal(new URLSearchParams((await snapshot(page)).url).has('cameraPos'), false);
    await mount(page, (await snapshot(page)).url);
    assert.equal((await snapshot(page)).mode, 'follow');

    // Orthographic projection and fixed views use the actual active camera.
    await choose(page, 'Caméra · Studio');
    await page.keyboard.press('o'); await pause(180);
    assert.equal(await page.evaluate(() => window.fixture.camera.isOrthographicCamera), true);
    const ortho = await snapshot(page);
    assert(distance(ortho.camera, (await press(page, 'ArrowRight')).camera) > 1);
    await page.evaluate(() => document.dispatchEvent(new Event('camera-enter-top')));
    await pause(100);
    const top = await snapshot(page);
    assert(distance(top.camera, (await press(page, 'ArrowUp')).camera) > 1);
    await choose(page, 'Caméra · Studio');
    await page.evaluate(async () => {
      const { CHARACTERS } = await import('/src/features/scene/characterConfig.ts');
      window.fixture.useSceneStore.getState().setActiveCharacterId(CHARACTERS.find(character => character.id !== 'xbot').id);
    });
    await choose(page, 'Caméra · PNJ');
    assert.equal((await snapshot(page)).mode, 'follow');

    for (const width of [1200, 390, 320]) {
      await page.setViewport({ width, height: 900 });
      await pause(150);
      const layout = await page.evaluate(() => {
        const a = document.querySelector('.virtual-controls').getBoundingClientRect();
        const b = document.querySelector('.view-control-bar-dock').getBoundingClientRect();
        return { left: a.left, right: a.right, bottom: a.bottom, barTop: b.top };
      });
      assert(layout.left >= 0 && layout.right <= width, `Controls fit width ${width}`);
      assert(layout.bottom <= layout.barTop, `Controls clear toolbar at width ${width}`);
      if (width === 1200 || width === 320) await page.screenshot({ path: `/tmp/room-arrow-controls-${width}.png` });
    }
    await mount(page, '?mode=follow&arrowControl=character&preset=low&characterCount=1&testCharacter=1');
    await page.waitForFunction(() => {
      let found = false;
      window.fixture.scene.traverse(object => { if (object.userData.animUnit && object.name.includes('Xbot')) found = object.visible; });
      return found;
    }, { timeout: 60000 });
    const characterPose = () => page.evaluate(() => {
      let pose;
      window.fixture.scene.traverse(object => { if (object.userData.animUnit && object.name.includes('Xbot')) pose = object.position.toArray(); });
      return pose;
    });
    const meshBefore = await characterPose();
    await press(page, 'ArrowUp');
    assert(distance(meshBefore, await characterPose()) > 1, 'The rendered PNJ must move in Follow mode');
    await choose(page, 'Caméra · PNJ');
    const beforeOrbit = await snapshot(page);
    const duringOrbit = await press(page, 'ArrowUp');
    assert.equal(duringOrbit.moving, false, 'Orbit must not request a walking animation');
    assert.equal(duringOrbit.userTime, beforeOrbit.userTime, 'Orbit must leave autonomous AI in control');
    const invalid = await page.evaluate(() => {
      history.replaceState(null, '', '?arrowControl=wrong');
      try { window.fixture.url.parseUrlArrowControl(); return false; } catch { return true; }
    });
    assert(invalid, 'Invalid control must fail explicitly');
    assert.deepEqual(errors, []);
    console.log('PASS: keyboard/virtual camera and character controls, release, URL round-trips, FPV, orthographic/top, desktop/mobile layout');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
