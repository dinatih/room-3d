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
      (await import('/node_modules/.vite/deps/@react-three_drei.js')).useGLTF.setDecoderPath('/draco/');
      const { SCENE_REGISTRY } = await import('/src/features/inventory/previewRegistry.tsx');
      const { Dachshund } = await import('/src/features/scene/items/Dachshund.tsx');
      const { ShibaInu } = await import('/src/features/scene/items/ShibaInu.tsx');
      const { DogBowl } = await import('/src/features/scene/items/DogBowl.tsx');
      const { NavigationObstacle } = await import('/src/features/scene/ai/navigation/NavigationObstacle.tsx');
      const dogBehavior = await import('/src/features/scene/items/dogBehavior.ts');
      const bowlData = await import('/src/features/scene/items/dogBowlData.ts');
      const { getObjectActionIds } = await import('/src/features/scene/objectActions.ts');
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
      function Capture() { window.f = { ...useThree(), THREE, cameraState, useAnimPreviewStore, getActionDef, navigation, obstacles, geometry, walkableSurfaces, dogBehavior, bowlData, getObjectActionIds }; return null; }
      const root = createRoot(document.getElementById('fixture'));
      function Fixture() {
        const [mode, setMode] = React.useState('preview');
        const [anim, setAnim] = React.useState('idle-1');
        const [bowlPreview, setBowlPreview] = React.useState(false);
        window.setBowlPreview = setBowlPreview;
        window.setMode = setMode; window.setAnim = setAnim;
        return e(Canvas, { camera: { position: [65, 38, 60], fov: 35, near: 0.1, far: 2000 }, gl: { preserveDrawingBuffer: true } },
          e(Capture), e('color', { attach: 'background', args: ['#e4e5e9'] }),
          e('ambientLight', { intensity: 2 }), e('directionalLight', { position: [50, 100, 80], intensity: 3 }),
          e(React.Suspense, { fallback: null }, mode === 'dogs' ? e(React.Fragment, null,
            e(ShibaInu),
            e('group', { position: [210, 0, -200], rotation: [0, -Math.PI / 4, 0] }, e(Dachshund)),
            e('group', { position: bowlData.ULOTTE_BOWL_POSITION }, e(NavigationObstacle, { id: 'ulotte-bowl' }, e(DogBowl, { feedingStation: true, onSize: () => { window.bowlReady = true; } }))),
            bowlPreview && e('group', { position: [-100, 0, 0] }, e(DogBowl, { isPreview: true, feedingStation: true, onSize: () => { window.bowlPreviewReady = true; } }))) : mode === 'preview'
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
      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'ulotte-motion', value: 'walk' } }));
      const life = f.scene.getObjectByName('ulotte').userData.dogBehavior;
      life.autonomous = true; life.mode = 'move'; life.gait = 'walk';
      life.target.set(target.x, 0, target.z);
      const length = path.reduce((sum, point, index) => sum + f.geometry.distance(index ? path[index-1] : start, point), 0);
      const seconds = length / f.dogBehavior.DOG_WALK_SPEED.ulotte + f.useAnimPreviewStore.getState().duration * 2;
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
    await page.evaluate(() => window.setMode('dogs'));
    await page.waitForFunction(() => window.bowlReady && window.f.scene.getObjectByName('shiba-inu')?.userData.dogBehavior && window.f.scene.getObjectByName('ulotte')?.userData.dogBehavior, { timeout: 60000 });
    await page.evaluate(() => window.setBowlPreview(true));
    await page.waitForFunction(() => window.bowlPreviewReady);
    await page.evaluate(() => {
      const f = window.f;
      if (f.bowlData.dogFeedingStation.position.distanceTo(new f.THREE.Vector3(...f.bowlData.ULOTTE_BOWL_POSITION)) > 0) throw new Error('Bowl preview overwrites main feeding station');
      const preview = f.scene.getObjectByName('ulotte-bowl');
      const size = new f.THREE.Box3().setFromObject(preview, true).getSize(new f.THREE.Vector3());
      if (Math.abs(size.x - 20) > 0.01 || Math.abs(size.y - 6) > 0.01) throw new Error(`Incorrect bowl dimensions ${size.toArray()}`);
    });
    await page.evaluate(() => window.setBowlPreview(false));
    console.log('activities', await page.evaluate(() => {
      const f = window.f; f.setFrameloop('never');
      const { createDogBehavior, updateDogBehavior, startDogPause, releaseDogRoute, DOG_ACTIVITY, mealInterval } = f.dogBehavior;
      const root = f.scene.getObjectByName('shiba-inu');
      const state = createDogBehavior();
      state.position.set(180, 0, -120);
      const played = [];
      const context = { id: 'shiba', root, play: (action, once) => { played.push({ action, once }); return 2; } };
      const points = f.walkableSurfaces.flat(2);
      const xs = points.map(p => p.x), zs = points.map(p => p.z);
      const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
      const target = { x: 110, z: -180 };
      const counts = { walk: 0, run: 0 };
      const random = Math.random;
      try {
        for (let i = 0; i < 100; i++) {
          const draws = [1, (target.x - minX) / (maxX - minX), (target.z - minZ) / (maxZ - minZ), (i + 0.5) / 100];
          Math.random = () => { if (!draws.length) throw new Error('Unexpected behavior draw'); return draws.shift(); };
          state.mode = 'rest'; state.action = 'idle'; state.remaining = 0;
          updateDogBehavior(state, context, 1 / 60);
          if (state.mode !== 'move') throw new Error('Expected a reachable walk/run target');
          counts[state.gait]++;
        }
        if (counts.walk !== 80 || counts.run !== 20) throw new Error(`Wrong gait balance: ${JSON.stringify(counts)}`);
        Math.random = () => 0.99;
        startDogPause(state, context);
        if (state.action !== 'jump' || played.at(-1).once !== true || state.remaining !== 2) throw new Error('Jump must play exactly once');
        updateDogBehavior(state, context, state.remaining);
        if (state.action === 'jump') throw new Error('Jump must be followed by a calm pause');
        const previous = state.action;
        startDogPause(state, context);
        if (state.action === previous) throw new Error('Pause repeats immediately');
        Math.random = () => 0;
        if (mealInterval() !== 120) throw new Error('Minimum meal interval');
        Math.random = () => 1;
        if (mealInterval() !== 240) throw new Error('Maximum meal interval');
      } finally { Math.random = random; releaseDogRoute(state, 'shiba'); }
      if (f.getActionDef('shiba-dance') || f.getActionDef('dance-with-dog:::native')) throw new Error('Obsolete dance commands remain');
      if (f.getObjectActionIds('ushiro').some(id => id.includes('dance'))) throw new Error('Ushiro menu still offers dance');
      return { counts, pauses: played.slice(-4), bowl: f.bowlData.dogFeedingStation.position.toArray() };
    }));
    console.log('meal', await page.evaluate(() => {
      const f = window.f; f.setFrameloop('never');
      const root = f.scene.getObjectByName('ulotte');
      const life = root.userData.dogBehavior;
      life.mode = 'rest'; life.action = 'idle'; life.remaining = 0; life.mealRemaining = 0;
      f.advance(f.clock.elapsedTime + 1 / 60);
      if (life.mode !== 'meal-approach') throw new Error(`Meal approach failed: ${life.mode}, target ${life.target.toArray()}`);
      const target = life.target.clone();
      const route = f.navigation.getNavigationGraph(f.obstacles.getAgentProfile('ulotte')).find(life.position, target);
      const length = route.reduce((total, point, index) => total + f.geometry.distance(index ? route[index-1] : life.position, point), 0);
      const maxSeconds = length / f.dogBehavior.DOG_WALK_SPEED.ulotte + Math.PI / f.dogBehavior.DOG_ACTIVITY.turnSpeed + 1;
      for (let i = 0; i < Math.ceil(maxSeconds * 60) && life.mode !== 'eat'; i++) f.advance(f.clock.elapsedTime + 1 / 60);
      if (life.mode !== 'eat') throw new Error(`Ulotte did not reach the East garden bowl: ${JSON.stringify({ mode:life.mode, pos:life.position, target:life.target, route:life.route.error })}`);
      // At the measured midpoint, the animated muzzle must sit over the bowl.
      const duration = 2.0416667461395264;
      f.advance(f.clock.elapsedTime + duration / 2 - 1 / 60);
      f.scene.updateMatrixWorld(true);
      const muzzle = root.getObjectByName('Muzzle').getWorldPosition(new f.THREE.Vector3());
      const bowl = f.bowlData.dogFeedingStation.position;
      const horizontalError = Math.hypot(muzzle.x - bowl.x, muzzle.z - bowl.z);
      if (horizontalError > f.bowlData.DOG_BOWL.radius) throw new Error(`Muzzle misses food: ${horizontalError}`);
      const cameraTarget = new f.THREE.Vector3(bowl.x, 12, bowl.z);
      f.camera.position.copy(cameraTarget).add(new f.THREE.Vector3(65, 40, 65)); f.camera.lookAt(cameraTarget); f.camera.updateMatrixWorld(true);
      const remaining = life.remaining;
      for (let i = 0; i <= Math.ceil(remaining * 60); i++) f.advance(f.clock.elapsedTime + 1 / 60);
      if (life.mode === 'eat' || life.mealRemaining < 120 || life.mealRemaining > 240) throw new Error('Meal must finish and schedule its next interval');
      const originalPosition = life.position.clone();
      const blocker = 'meal-blocker';
      f.obstacles.setAgentProfile(blocker, { radius: 28, height: 170 });
      f.cameraState.positions[blocker] = { x:target.x, y:0, z:target.z, yaw:0 };
      life.mode = 'rest'; life.action = 'idle'; life.remaining = 0; life.mealRemaining = 0;
      try {
        f.advance(f.clock.elapsedTime + 1 / 60);
        if (life.mode === 'meal-approach' || life.mode === 'eat') throw new Error('Occupied feeding spot was accepted');
        if (life.mealRemaining !== f.dogBehavior.DOG_ACTIVITY.mealRetrySeconds) throw new Error('Meal not postponed');
        if (life.position.distanceTo(originalPosition) > 0) throw new Error('Blocked meal teleports dog');
      } finally { delete f.cameraState.positions[blocker]; f.obstacles.removeAgentProfile(blocker); }
      return { target:target.toArray(), muzzle:muzzle.toArray(), horizontalError, postponed:true };
    }));
    await page.screenshot({ path: '/tmp/room-dogs-meal.png' });
    assert.deepEqual(errors, []);
    console.log('Dogs: 80/20 gaits, varied pauses, East garden feeding, removed dance commands, autonomous navigation, native clips, texture, scale, floor, timeline, camera, placement and preview isolation passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
