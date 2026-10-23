// With Vite running: node tests/visual/hornet-tour.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const launchBrowser = require('../../scripts/browser-test-options.cjs');

(async () => {
  const browser = await launchBrowser({ args: ['--no-sandbox', '--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan,VulkanFromANGLE', '--disable-vulkan-surface'], protocolTimeout: 180000 });
  try {
    const page = await browser.newPage(), errors = [];
    page.on('pageerror', error => { errors.push(String(error)); console.error(error); });
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${process.env.HORNET_TEST_URL || 'http://127.0.0.1:5173'}/?preset=low&characterCount=0&skipIntro=1&mode=orbit`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(async () => {
      const { cameraState } = await import('/src/features/scene/cameraState.ts');
      const { furnitureObstacles } = await import('/src/features/scene/ai/navigation/obstacles.ts');
      return cameraState.isSceneLaunched && cameraState.positions.drone && furnitureObstacles.has('tv:0') && window.__THREE_SCENE__;
    }, { timeout: 180000 });
    const setup = await page.evaluate(async () => {
      const { cameraState } = await import('/src/features/scene/cameraState.ts');
      const { Vector3 } = await import('/node_modules/.vite/deps/three.js');
      const fiberUrl = performance.getEntriesByType('resource').find(entry => entry.name.includes('/@react-three_fiber.js?v=')).name;
      const { _roots } = await import(fiberUrl);
      const root = [..._roots.values()].find(r => r.store.getState().scene === window.__THREE_SCENE__).store.getState();
      let model;
      root.scene.traverse(o => { if (o.userData.hornetTour) model = o; });
      if (!model) throw Error('Hornet model missing');
      model.updateWorldMatrix(true, true);
      const eyes = cameraState.animalViews.drone.eyes;
      const noseOffset = model.worldToLocal(new Vector3(eyes.x, eyes.y, eyes.z));
      window.hornetTest = { root, model, tour: model.userData.hornetTour, cameraState, noseOffset };
      window.hornetEvents = [];
      document.addEventListener('app-log', event => window.hornetEvents.push(event.detail));
      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'drone-goto-bathroom' } }));
      return { radius: window.hornetTest.tour.radius, start: model.position.toArray() };
    });
    console.log('Real scene loaded:', JSON.stringify(setup));
    await page.waitForFunction(() => {
      const { tour } = window.hornetTest;
      return tour.state === 'observing' && tour.observation.room === 'bathroom';
    }, { timeout: 60000 }).catch(async error => {
      console.log('Door traversal diagnostic:', JSON.stringify(await page.evaluate(async () => {
        const { model, tour } = window.hornetTest;
        const doors = await import('/src/features/scene/doorObstacles.ts');
        return { position: model.position, tour: { state: tour.state, wait: tour.wait, reason: tour.waitReason, path: tour.path, observation: tour.observation }, angles: doors.doorCollisionState, allowed: Object.fromEntries(Object.entries(doors.DOOR_CONFIGS).map(([key, d]) => [key, doors.computeDoorAllowedAngle(d)])), events: window.hornetEvents };
      })));
      throw error;
    });
    console.log('Real animated doors: bathroom reached from the garden.');
    await page.evaluate(() => window.hornetTest.root.setFrameloop('never'));
    const report = await page.evaluate(async () => {
      const { model, tour } = window.hornetTest;
      const { DOOR_CONFIGS, doorCollisionState, computeDoorAllowedAngle } = await import('/src/features/scene/doorObstacles.ts');
      const { doorRequested } = await import('/src/features/scene/ai/navigation/doorRequests.ts');
      const { HORNET_BOB_CM } = await import('/src/features/scene/hornetTour.ts');
      const { furnitureObstacles } = await import('/src/features/scene/ai/navigation/obstacles.ts');
      const log = [], visits = [], snapshots = {}, unsafe = [];
      tour.log = message => log.push(message);
      tour.reset();
      const validity = tour.observations.map(o => ({ id: o.id, position: o.position.toArray(), safe: tour.space.safeStop(o.position, Math.sqrt(3) * HORNET_BOB_CM), blocker: tour.space.blocker(o.position, o.position, Math.sqrt(3) * HORNET_BOB_CM) }));
      for (let frame = 0; frame < 30 * 900 && (new Set(visits).size < tour.observations.length || tour.elapsed < 4); frame++) {
        for (const key of Object.keys(DOOR_CONFIGS)) doorCollisionState[key].angle = doorRequested(key) ? computeDoorAllowedAngle(DOOR_CONFIGS[key]) : 0;
        const before = model.position.clone(), previous = tour.state;
        tour.tick(model.position, model.quaternion, 1 / 30);
        const blocker = tour.space.blocker(before, model.position);
        if (blocker) unsafe.push({ blocker, from: before.toArray(), to: model.position.toArray() });
        for (const key of Object.keys(DOOR_CONFIGS)) if (tour.space.doorHits(key, before, model.position, doorCollisionState[key].angle)) unsafe.push({ key, from: before.toArray(), to: model.position.toArray() });
        if (tour.state === 'observing' && previous !== 'observing') visits.push(tour.observation.id);
        if (tour.state === 'observing' && tour.elapsed >= 4 && !snapshots[tour.observation.id]) snapshots[tour.observation.id] = { position: model.position.toArray(), quaternion: model.quaternion.toArray() };
      }
      return { validity, visits, snapshots, unsafe, log, obstacles: [...furnitureObstacles.values()].map(o => ({ id: o.id, yMin: o.yMin, yMax: o.yMax, polygon: o.polygon })) };
    });
    fs.writeFileSync('/tmp/hornet-tour-report.json', JSON.stringify(report, null, 2));
    console.log('Viewpoints:', JSON.stringify(report.validity));
    console.log('Visited:', JSON.stringify([...new Set(report.visits)]));
    assert.deepEqual(report.unsafe, [], 'Collision during real-scene tour');
    assert.deepEqual(report.validity.filter(o => !o.safe), [], 'Unusable viewpoints in the furnished apartment');
    assert.equal(new Set(report.visits).size, report.validity.length, report.log.join('\n'));
    for (const id of ['north-east', 'north-west', 'south-east', 'south-west', 'under-tv', 'top']) {
      await page.evaluate(({ snapshot }) => {
        const { model, root, noseOffset } = window.hornetTest;
        model.position.fromArray(snapshot.position); model.quaternion.fromArray(snapshot.quaternion);
        model.updateWorldMatrix(true, true);
        root.camera.position.copy(noseOffset);
        model.localToWorld(root.camera.position);
        root.camera.quaternion.copy(model.quaternion);
        root.camera.rotateY(Math.PI); // Three cameras look along -Z; the Hornet looks along +Z.
        root.camera.near = .1; root.camera.updateProjectionMatrix();
        root.gl.render(root.scene, root.camera);
      }, { id, snapshot: report.snapshots[id] });
      await page.screenshot({ path: `/tmp/hornet-tour-${id}.png` });
    }
    assert.deepEqual(errors, []);
    console.log('Hornet furnished-apartment tour passed; report and viewpoint screenshots saved in /tmp.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
