const assert = require('node:assert/strict');
const launchBrowser = require('./browser-test-options.cjs');
(async () => {
  const browser = await launchBrowser({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') console.error(msg.text()); });
    await page.setViewport({ width: 640, height: 640 });
    await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5191'}/AGENTS.md`);
    await page.evaluate(async () => {
      (await import('/@react-refresh')).default.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { Canvas, useThree } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const THREE = await import('/node_modules/.vite/deps/three.js');
      const { SCENE_REGISTRY } = await import('/src/features/inventory/previewRegistry.tsx');
      const { Dachshund } = await import('/src/features/scene/items/Dachshund.tsx');
      const { cameraState } = await import('/src/features/scene/cameraState.ts');
      const { useAnimPreviewStore } = await import('/src/features/inventory/useAnimPreviewStore.ts');
      const { NavigationEnabledContext } = await import('/src/features/scene/ai/navigation/NavigationContext.ts');
      const navigation = await import('/src/features/scene/ai/navigation/service.ts');
      const obstacles = await import('/src/features/scene/ai/navigation/obstacles.ts');
      const { walkableSurfaces } = await import('/src/features/scene/ai/navigation/architecture.ts');
      const geometry = await import('/src/features/scene/ai/navigation/geometry.ts');
      const { getActionDef } = await import('/src/features/scene/objectActionRegistry.ts');
      document.body.innerHTML = '<div id="fixture" style="height:100vh"></div>';
      document.body.style.margin = '0';
      const e = React.createElement;
      function Capture() { window.f = { ...useThree(), THREE, cameraState, useAnimPreviewStore, getActionDef, navigation, obstacles, geometry, walkableSurfaces }; return null; }
      const root = createRoot(document.getElementById('fixture'));
      function Fixture() {
        const [mode, setMode] = React.useState('preview');
        const [anim, setAnim] = React.useState('idle-1');
        window.setMode = setMode; window.setAnim = setAnim;
        return e(Canvas, { camera: { position: [65, 38, 60], fov: 35, near: 0.1, far: 2000 }, gl: { preserveDrawingBuffer: true } },
          e(Capture), e('color', { attach: 'background', args: ['#e4e5e9'] }),
          e('ambientLight', { intensity: 2 }), e('directionalLight', { position: [50, 100, 80], intensity: 3 }),
          e(React.Suspense, { fallback: null }, mode === 'preview'
            ? e(SCENE_REGISTRY.ulotte, { actionState: { characterAnim: anim }, onSize: size => { window.size = size.toArray(); } })
            : e(NavigationEnabledContext.Provider, { value: mode !== 'zone' }, e('group', { position: [210, 0, -200], rotation: [0, -Math.PI / 4, 0] }, e(Dachshund, { key: mode, onSize: size => { window.size = size.toArray(); } })))));
      }
      root.render(e(Fixture));
    });
    await page.waitForFunction(() => window.size && window.f?.useAnimPreviewStore.getState().clipName === 'Ulotte idle-1', { timeout: 60000 });
    console.log('preview', await page.evaluate(() => {
      const f = window.f;
      f.setFrameloop('never');
      f.useAnimPreviewStore.getState().pause();
      f.useAnimPreviewStore.getState().seekToTime(0);
      f.advance(f.clock.elapsedTime + 1 / 60);
      f.scene.updateMatrixWorld(true);
      const box = new f.THREE.Box3().setFromObject(f.scene.getObjectByName('ulotte'), true);
      const size = box.getSize(new f.THREE.Vector3());
      if (Math.abs(size.y - 30) > 0.1 || Math.abs(box.min.y) > 0.1) throw new Error(`Scale/ground invalid: ${size.toArray()} min ${box.min.y}, reported ${window.size}, model ${JSON.stringify(f.scene.getObjectByName('ulotte').children.map(c=>({name:c.name,scale:c.scale.toArray(),pos:c.position.toArray()})))}`);
      if (f.cameraState.positions.ulotte) throw new Error('Preview publishes world position');
      f.camera.lookAt(0, 14, 0); f.camera.updateMatrixWorld(true);
      const mesh = f.scene.getObjectByName('Dog');
      if (!mesh.material.map?.image) throw new Error('Missing coat texture');
      if (mesh.material.opacity !== 1) throw new Error('Coat must be opaque');
      return { size: size.toArray(), texture: [mesh.material.map.image.width, mesh.material.map.image.height], duration: f.useAnimPreviewStore.getState().duration };
    }));
    for (const anim of ['idle-1', 'idle-2', 'walk', 'run', 'jump', 'eating']) {
      await page.evaluate(anim => window.setAnim(anim), anim);
      await page.waitForFunction(anim => window.f.useAnimPreviewStore.getState().clipName === `Ulotte ${anim}`, {}, anim);
      console.log('clip', await page.evaluate(() => {
        const f = window.f; const store = f.useAnimPreviewStore.getState();
        store.seekToTime(store.duration / 2); f.advance(f.clock.elapsedTime + 1 / 60);
        f.scene.updateMatrixWorld(true);
        const box = new f.THREE.Box3().setFromObject(f.scene.getObjectByName('ulotte'), true);
        if (!Number.isFinite(box.min.y) || box.isEmpty()) throw new Error('Invalid animated bounds');
        return { clip: store.clipName, duration: store.duration, min: box.min.toArray(), max: box.max.toArray() };
      }));
      if (anim === 'idle-1') await page.screenshot({ path: process.argv.includes('--thumbnail') ? 'public/characters/ulotte/ulotte_3d_preview.png' : '/tmp/room-ulotte-preview.png' });
    }
    await page.evaluate(() => window.setMode('scene'));
    await page.waitForFunction(() => window.f.scene.getObjectByName('Muzzle'));
    const scene = await page.evaluate(() => {
      const f = window.f; f.setFrameloop('never'); f.advance(f.clock.elapsedTime + 1 / 60); f.scene.updateMatrixWorld(true);
      const pos = f.cameraState.positions.ulotte;
      if (!pos || Math.abs(pos.x - 210) > 0.001 || Math.abs(pos.z + 200) > 0.001) throw new Error(`Parent placement not preserved: ${JSON.stringify(pos)}`);
      const view = f.cameraState.animalViews.ulotte;
      if (!view || !Number.isFinite(view.eyes.y)) throw new Error('Missing animal camera');
      const expected = new f.THREE.Vector3(Math.sin(pos.yaw), 0, Math.cos(pos.yaw));
      const forward = new f.THREE.Vector3(view.forward.x, 0, view.forward.z).normalize();
      if (expected.dot(forward) < 0.95) throw new Error(`Wrong muzzle direction: ${JSON.stringify(view)}`);
      f.camera.position.set(280, 55, -120); f.camera.lookAt(210, 15, -200); f.camera.updateMatrixWorld(true);
      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'ulotte-motion', value: 'jump' } }));
      for (let i = 0; i < 120; i++) f.advance(f.clock.elapsedTime + 1 / 60);
      if (f.cameraState.positions.ulotte.x !== pos.x) throw new Error('Manual clip moves world root');
      return { pos, view };
    });
    console.log('scene', scene);
    console.log('corner regression', await page.evaluate(() => {
      const f = window.f;
      f.setFrameloop('never');
      const start = { ...f.cameraState.positions.ulotte };
      const target = { x: 110, z: -180 };
      f.obstacles.registerObstacle({ id: 'ulotte-corner-regression', polygon: f.geometry.rectangle(160, -190, 30, 40), yMin: 0, yMax: 60 });
      const profile = f.obstacles.getAgentProfile('ulotte');
      const path = f.navigation.getNavigationGraph(profile).find(start, target);
      if (!path || path.length < 2) throw new Error(`Regression requires a detour: ${JSON.stringify(path)}`);
      const points = f.walkableSurfaces.flat(2);
      const xs = points.map(p => p.x), zs = points.map(p => p.z);
      const xMin = Math.min(...xs), xMax = Math.max(...xs), zMin = Math.min(...zs), zMax = Math.max(...zs);
      const samples = [(target.x - xMin) / (xMax - xMin), (target.z - zMin) / (zMax - zMin)];
      const originalRandom = Math.random;
      let sample = 0;
      Math.random = () => samples[sample++ % 2];
      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'ulotte-replay' } }));
      const length = path.reduce((sum, point, index) => sum + f.geometry.distance(index ? path[index-1] : start, point), 0);
      const seconds = length / 50 + f.useAnimPreviewStore.getState().duration * 2;
      let closest = Infinity;
      try {
        for (let i = 0; i < Math.ceil(seconds * 60); i++) {
          f.advance(f.clock.elapsedTime + 1 / 60);
          closest = Math.min(closest, f.geometry.distance(f.cameraState.positions.ulotte, target));
        }
      } finally {
        Math.random = originalRandom;
        f.obstacles.unregisterObstacle('ulotte-corner-regression');
      }
      const end = f.cameraState.positions.ulotte;
      if (closest > 1e-6) throw new Error(`Blocked at detour corner: ${JSON.stringify({ start, path, end, closest, route:f.obstacles.navigationDebug.get('ulotte') })}`);
      return { start, path, end, closest };
    }));
    console.log('navigation', await page.evaluate(() => {
      const f = window.f;
      f.setFrameloop('never');
      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'ulotte-replay' } }));
      const start = { ...f.cameraState.positions.ulotte };
      let traveled = 0;
      let previous = start;
      for (let i = 0; i < 1800; i++) {
        f.advance(f.clock.elapsedTime + 1 / 60);
        const pos = f.cameraState.positions.ulotte;
        traveled += Math.hypot(pos.x - previous.x, pos.z - previous.z);
        if (!Number.isFinite(pos.x + pos.z)) throw new Error('Invalid navigation position');
        previous = pos;
      }
      if (traveled < 50) throw new Error(`Ulotte does not walk autonomously: ${JSON.stringify({traveled,start, clock:f.clock.elapsedTime, validStart:f.navigation.getNavigationGraph(f.obstacles.getAgentProfile('ulotte')).find(start,start), blockers:f.navigation.architectureObstacles.filter(o=>f.geometry.pointInRing(start,o.polygon)).map(o=>o.id)})}`);
      return { start, end: previous, traveled };
    }));
    await page.screenshot({ path: '/tmp/room-ulotte-scene.png' });
    // Mounting a zone preview must neither overwrite nor clear the main animal camera/position.
    await page.evaluate(() => window.setMode('zone'));
    await page.waitForFunction(() => !window.f.cameraState.positions.ulotte);
    console.log('zone', await page.evaluate(() => {
      const f = window.f; f.setFrameloop('never'); for (let i = 0; i < 60; i++) f.advance(f.clock.elapsedTime + 1 / 60);
      if (f.cameraState.positions.ulotte || f.cameraState.animalViews.ulotte) throw new Error('Zone preview publishes an animal');
      return 'isolated';
    }));
    assert.deepEqual(errors, []);
    console.log('Ulotte: autonomous navigation, native clips, texture, scale, floor, timeline, camera, placement and preview isolation passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
