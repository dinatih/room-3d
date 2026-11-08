const assert = require('node:assert/strict');
const fs = require('node:fs');
const launch = require('./browser-test-options.cjs');
(async () => {
  const browser = await launch({ pipe: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  console.log('Chromium headless démarré');
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => console.error('PAGE ERROR', error.message));
    page.on('console', message => { if (message.type() === 'error') console.error('CONSOLE', message.text()); });
    await page.setViewport({ width: 1100, height: 900 });
    await page.setRequestInterception(true);
    page.on('request', request => request.url().includes('/src/main.tsx') && request.resourceType() === 'script' ? request.respond({ status: 200, contentType: 'application/javascript', body: '' }) : request.continue());
    await page.goto(process.env.ROOM_TEST_URL || 'http://127.0.0.1:5174/', { waitUntil: 'domcontentloaded' });
    console.log('Chargement du banc de test');
    await page.evaluate(async () => {
      const main = await (await fetch('/src/main.tsx')).text();
      const source = await (await fetch('/src/features/scene/placements/LivingRoomPlacements.tsx')).text();
      const fiberSource = await (await fetch('/src/features/scene/utils/useFurnitureToggles.ts')).text();
      const version = source.match(/react.js(\?v=[^"']+)/)[1];
      const React = (await import('/node_modules/.vite/deps/react.js' + version)).default;
      const { createRoot } = (await import(main.match(/"([^"\n]*react-dom_client[^"\n]*)"/)[1])).default;
      const { Canvas } = await import(fiberSource.match(/"([^"\n]*react-three_fiber[^"\n]*)"/)[1]);
      const { Beds, Desks, DeskDecor, OfficeChair } = await import('/src/features/scene/placements/LivingRoomPlacements.tsx');
      const { useSceneStore } = await import(source.match(/"([^"\n]*store\/useSceneStore\.ts[^"\n]*)"/)[1]);
      const { positionState } = await import(source.match(/"([^"\n]*positionState\.ts[^"\n]*)"/)[1]);
      const furniture = await import(source.match(/"([^"\n]*furniturePositions\.ts[^"\n]*)"/)[1]);
      const { getSmartObject } = await import(source.match(/"([^"\n]*smartObjectRegistry\.ts[^"\n]*)"/)[1]);
      window.bedTest = { useSceneStore, positionState, furniture, getSmartObject };
      const host = document.createElement('div'); host.style.cssText = 'width:1100px;height:900px'; document.body.replaceChildren(host);
      createRoot(host).render(React.createElement(React.StrictMode, null,
        React.createElement(Canvas, { orthographic: true, camera: { position: [158, 700, 200], zoom: 1.8, near: 0.1, far: 2000 }, onCreated: ({ camera }) => camera.lookAt(158, 0, 200) },
          React.createElement('color', { attach: 'background', args: ['#cccccc'] }),
          React.createElement('ambientLight', { intensity: 2 }),
          React.createElement('directionalLight', { position: [100, 400, 50], intensity: 3 }),
          React.createElement(React.Suspense, { fallback: null }, ...[Beds, Desks, DeskDecor, OfficeChair].map(component => React.createElement(component, { key: component.name }))))));
    });
    console.log('Composants montés');
    await page.waitForFunction(() => window.bedTest?.furniture.currentFurnitureTransforms['smorkull-position'], { timeout: 60000 });
    const settled = async (double, side) => {
      console.log('Attente disposition', { double, side });
      try { await page.waitForFunction(({ double, side }) => {
        const { positionState: state, furniture: f, useSceneStore } = window.bedTest;
        const keys = ['bed-west-position', 'bed-east-position', 'desk1-position', 'desk2-position', 'smorkull-position'];
        return state['bed-double']?.idx === Number(double) && state['bed-position']?.idx === side
          && useSceneStore.getState().extraStates['bed-position'] === (side === 1)
          && keys.every(key => f.currentFurnitureTransforms[key] && !f.movingFurniture.has(key));
      }, { timeout: 30000 }, { double, side }); } catch (error) {
        console.error(await page.evaluate(() => ({ state: window.bedTest?.positionState, moving: [...window.bedTest.furniture.movingFurniture], poses: window.bedTest.furniture.currentFurnitureTransforms })));
        throw error;
      }
      return page.evaluate(() => {
        const { positionState, furniture, getSmartObject } = window.bedTest;
        return { state: structuredClone(positionState), poses: structuredClone(furniture.currentFurnitureTransforms), bed: getSmartObject('bed-double'), hugs: getSmartObject('hugs-point').position };
      });
    };
    await page.evaluate(() => window.bedTest.useSceneStore.getState().toggleFurniture('bedDouble'));
    const captures = [];
    for (const [step, side] of [0, 1, 0, 1].entries()) {
      const result = await settled(true, side);
      assert.equal(result.state['bed-position'].total, 2);
      if (side === 0) assert.ok(Math.abs(result.poses['bed-west-position'].x - 83 / 2 - (16 + 22 / 2)) < 0.01, 'Lit Ouest accolé aux DIMPA');
      const expected = side === 0 ? [1, 1, 0] : [3, 4, 4];
      assert.deepEqual(['desk1-position', 'desk2-position', 'smorkull-position'].map(key => result.state[key].idx), expected);
      const actual = await page.evaluate(() => {
        const { furniture: f, positionState: s } = window.bedTest;
        return ['desk1-position', 'desk2-position', 'smorkull-position'].map((key, index) => {
          const target = [f.DESK1_POSITIONS, f.DESK2_POSITIONS, f.SMORKULL_POSITIONS][index][s[key].idx];
          const current = f.currentFurnitureTransforms[key];
          return Math.hypot(target.x - current.x, target.z - current.z) < 0.01 && Math.abs(target.ry - current.ry) < 0.01;
        });
      });
      assert.ok(actual.every(Boolean), 'Les positions réelles doivent suivre les indices');
      const sleep = result.bed.slots.filter(slot => slot.slotId.startsWith('lie-down'));
      assert.equal(sleep.length, 7);
      assert.equal(sleep.filter(slot => Math.abs(slot.rotY - Math.PI / 2) < 0.01).length, 4);
      assert.equal(sleep.filter(slot => Math.abs(slot.rotY - Math.PI) < 0.01).length, 3);
      assert.ok(result.hugs[2] < 0);
      captures.push({ side, state: result.state, poses: result.poses });
      if (step < 3) await page.evaluate(() => document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'bed-position' } })));
    }
    await page.evaluate(() => window.bedTest.useSceneStore.getState().toggleFurniture('bedDouble'));
    const single = await settled(false, 1);
    assert.equal(single.state['smorkull-position'].idx, 0);
    fs.writeFileSync('/tmp/room-3d-bed-layout.json', JSON.stringify({ captures, single }, null, 2));
    console.log('PASS: cycles Ouest → Est → Ouest → Est, positions réelles des bureaux/chaise, sept slots orientés et retour chaise position 1.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
