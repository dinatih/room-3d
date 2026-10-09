const { createRequire } = require('node:module');
const puppeteer = createRequire(`${process.cwd()}/package.json`)('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && message.text().includes('Shader')) errors.push(message.text()); });
    await page.setViewport({ width: 1000, height: 1000 });
    await page.goto('http://127.0.0.1:5178/AGENTS.md');
    await page.evaluate(async () => {
      const refresh = (await import('/@react-refresh')).default;
      refresh.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { Canvas, useThree } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const THREE = await import('/node_modules/.vite/deps/three.js');
      const { useGLTF } = await import('/node_modules/.vite/deps/@react-three_drei.js');
      useGLTF.setDecoderPath('/draco/');
      const { Shower } = await import('/src/features/scene/items/Shower.tsx');
      document.body.innerHTML = '<div id="fixture" style="height:100vh"></div>';
      document.body.style.margin = '0';
      function Capture() {
        const state = useThree(); const { camera, scene } = state;
        camera.lookAt(0, 120, 25);
        window.fixture = { ...window.fixture, ...state, scene, camera, THREE };
        return null;
      }
      const e = React.createElement;
      function FixtureShower() {
        const [preview, setPreview] = React.useState(false);
        window.setPreview = setPreview;
        return e(Shower, { isPreview: preview, actionState: { showerDoor: false }, onSize: () => { window.ready = true; } });
      }
      createRoot(document.getElementById('fixture')).render(e(Canvas,
        { camera: { position: [60, 130, -230], near: 1, far: 1000, fov: 48 }, gl: { preserveDrawingBuffer: true } },
        e('color', { attach: 'background', args: ['#b9c2c9'] }),
        e('ambientLight', { intensity: 2 }),
        e('directionalLight', { position: [50, 180, -100], intensity: 4 }),
        e(Capture), e(React.Suspense, { fallback: null }, e(FixtureShower))));
    });
    await page.waitForFunction(() => window.ready);
    await page.evaluate(async () => {
      const { OccupancyManager } = await import('/src/features/scene/ai/occupancyManager.ts');
      const { cameraState } = await import('/src/features/scene/cameraState.ts');
      const { SMART_OBJECTS } = await import('/src/features/scene/ai/smartObjectRegistry.ts');
      const { resolveAnimationId } = await import('/src/features/scene/animations/animationResolver.ts');
      Object.assign(window.fixture, { OccupancyManager, cameraState, SMART_OBJECTS, resolveAnimationId });
    });
    await new Promise(resolve => setTimeout(resolve, 1500));
    const results = await page.evaluate(() => {
      const f = window.fixture;
      f.setFrameloop('never');
      const water = f.scene.getObjectByName('shower-water');
      const steam = f.scene.getObjectByName('shower-steam');
      const fog = f.scene.getObjectByName('shower-condensation-door').material;
      const tick = seconds => {
        for (let i = 0; i < Math.round(seconds * 10); i++) f.advance(f.clock.elapsedTime + 0.1);
      };
      const check = (ok, message) => { if (!ok) throw new Error(message); };
      const random = Math.random;
      const slot = f.SMART_OBJECTS.shower.slots[0];
      f.OccupancyManager.claimSlot('shower', slot.slotId, 'fixture-user');
      f.cameraState.positions['fixture-user'] = { x: 0, y: 0, z: 0, yaw: 0, anim: 'walk' };
      tick(1);
      check(!water.visible, 'Reservation during walking must not start the water');
      f.cameraState.positions['fixture-user'].anim = f.resolveAnimationId(slot.animation);
      Math.random = () => 0.1;
      tick(9);
      check(water.visible && fog.uniforms.amount.value === 0, `Water starts immediately; no steam before 10 seconds: ${JSON.stringify({water:water.visible,fog:fog.uniforms.amount.value, time:water.material.uniforms.time.value, clock:f.clock.elapsedTime,anim:f.cameraState.positions['fixture-user'].anim,occupant:f.OccupancyManager.getOccupant('shower',slot.slotId)})}`);
      tick(3);
      check(steam.visible && fog.uniforms.amount.value > 0, 'Steam and door condensation must appear after 10 seconds');
      const origin = water.material.uniforms.origin.value.toArray();
      check(origin.every(Number.isFinite) && origin[1] > 180, 'Spray must originate at the shower head');
      Math.random = random;
      return { waterBeforeSteam: true, steamAfterTenSeconds: true, origin };
    });
    await page.screenshot({ path: '/tmp/room-shower-running.png' });
    const stopped = await page.evaluate(() => {
      const f = window.fixture;
      const water = f.scene.getObjectByName('shower-water');
      const steam = f.scene.getObjectByName('shower-steam');
      const fog = f.scene.getObjectByName('shower-condensation-door').material;
      const tick = seconds => { for (let i = 0; i < seconds * 10; i++) f.advance(f.clock.elapsedTime + 0.1); };
      f.OccupancyManager.releaseAllForCharacter('fixture-user');
      tick(0.1);
      if (water.visible || fog.uniforms.amount.value === 0) throw new Error('Water must stop immediately while condensation lingers');
      tick(40);
      if (steam.visible || fog.uniforms.amount.value !== 0) throw new Error('Steam and condensation must dissipate');
      const random = Math.random;
      Math.random = () => 0.9;
      for (const slot of f.SMART_OBJECTS.shower.slots) {
        f.OccupancyManager.claimSlot('shower', slot.slotId, 'fixture-user');
        f.cameraState.positions['fixture-user'].anim = f.resolveAnimationId(slot.animation);
        tick(12);
        if (!water.visible || steam.visible || fog.uniforms.amount.value !== 0) throw new Error('Each shower slot works; random dry branch stays clear');
        f.OccupancyManager.releaseAllForCharacter('fixture-user');
        tick(0.1);
      }
      Math.random = random;
      return { stopsOnRelease: true, fogDissipates: true, allSlots: true, randomClearBranch: true };
    });
    await page.evaluate(() => window.setPreview(true));
    await new Promise(resolve => setTimeout(resolve, 100));
    await page.evaluate(() => {
      const f = window.fixture;
      const slot = f.SMART_OBJECTS.shower.slots[0];
      f.OccupancyManager.claimSlot('shower', slot.slotId, 'fixture-user');
      f.cameraState.positions['fixture-user'].anim = f.resolveAnimationId(slot.animation);
      for (let i = 0; i < 120; i++) f.advance(f.clock.elapsedTime + 0.1);
      if (f.scene.getObjectByName('shower-water').visible || f.scene.getObjectByName('shower-steam').visible) throw new Error('Isolated inventory preview must remain dry');
      f.OccupancyManager.releaseAllForCharacter('fixture-user');
    });
    console.log(JSON.stringify({ ...results, ...stopped, previewIsolated: true }));
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('Shower effects validated without browser errors; image: /tmp/room-shower-running.png');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
