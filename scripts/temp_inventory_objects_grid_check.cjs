const assert = require('node:assert/strict');
const puppeteer = require('../node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
    await page.setViewport({ width: 1200, height: 900 });
    await page.goto(`${process.argv[2] || 'http://127.0.0.1:5176'}/AGENTS.md?mode=orbit`);
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
      const { CameraController } = await import('/src/features/scene/CameraController.tsx');
      const { InventoryObjectsGrid } = await import('/src/features/scene/InventoryObjectsGrid.tsx');
      const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
      const { cameraState } = await import('/src/features/scene/cameraState.ts');
      cameraState.isSceneLaunched = true;
      document.body.replaceChildren();
      document.body.style.margin = '0';
      const container = document.createElement('div');
      container.style.width = '1200px';
      container.style.height = '700px';
      document.body.append(container);
      window.fixture = { THREE, useSceneStore, container, views: [] };
      document.addEventListener('camera-view', e => window.fixture.views.push(e.detail));
      function Capture() {
        const state = useThree();
        React.useLayoutEffect(() => { Object.assign(window.fixture, state); }, [state]);
        return null;
      }
      function Grid() {
        const active = useSceneStore(state => state.layers.inventoryGrid);
        return active ? React.createElement(React.Suspense, { fallback: null }, React.createElement(InventoryObjectsGrid)) : null;
      }
      createRoot(container).render(React.createElement(Canvas, { camera: { position: [0, 300, 2000], near: 5, far: 10000 } },
        React.createElement(Capture), React.createElement(CameraController), React.createElement(Grid)));
    });
    await page.waitForFunction(() => window.fixture?.get);
    await page.evaluate(() => window.fixture.useSceneStore.getState().toggleLayer('inventoryGrid'));
    await page.waitForFunction(() => window.fixture.views.length && window.fixture.get().camera.isOrthographicCamera, { timeout: 60000 });
    for (const [width, height] of [[1200, 700], [390, 844]]) {
      await page.evaluate(({ width, height }) => {
        window.fixture.container.style.width = `${width}px`;
        window.fixture.container.style.height = `${height}px`;
      }, { width, height });
      await page.waitForFunction(({ width, height }) => window.fixture.size.width === width && window.fixture.size.height === height, {}, { width, height });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const result = await page.evaluate(() => {
        const { get, THREE, views, useSceneStore, scene } = window.fixture;
        const camera = get().camera;
        const view = views.at(-1);
        const direction = camera.getWorldDirection(new THREE.Vector3()).toArray();
        const grid = scene.getObjectByName('inventory-objects-grid');
        grid.updateWorldMatrix(true, true);
        const panels = grid.children.filter(child => child.isGroup).map(section => section.children.find(child => child.isMesh && child.geometry.type === 'PlaneGeometry'));
        const corners = panels.flatMap(panel => {
          panel.geometry.computeBoundingBox();
          const box = panel.geometry.boundingBox;
          return [box.min.clone(), box.max.clone()].map(point => point.applyMatrix4(panel.matrixWorld).project(camera).toArray());
        });
        return { projection: useSceneStore.getState().cameraProjection, mouse: useSceneStore.getState().orbitMouseMode,
          activeView: useSceneStore.getState().activeCameraView, direction, corners, view };
      });
      assert.equal(result.projection, 'ortho');
      assert.equal(result.mouse, 'pan');
      assert.equal(result.activeView, 'front');
      assert(Math.abs(result.direction[0]) < 1e-7 && Math.abs(result.direction[1]) < 1e-7 && result.direction[2] < -0.999999);
      assert(result.corners.every(point => Math.abs(point[0]) <= 1.000001 && Math.abs(point[1]) <= 1.000001), JSON.stringify(result));
      console.log(`${width}×${height}: orthographic front view, pan and all panels in frame OK`);
    }
    await page.evaluate(() => window.fixture.useSceneStore.getState().toggleLayer('inventoryGrid'));
    await page.waitForFunction(() => !window.fixture.scene.getObjectByName('inventory-objects-grid'));
    await page.evaluate(() => window.fixture.useSceneStore.getState().toggleLayer('inventoryGrid'));
    await page.waitForFunction(() => window.fixture.scene.getObjectByName('inventory-objects-grid'));
    assert.deepEqual(errors, []);
    console.log('Toggle off/on and browser errors: OK');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
