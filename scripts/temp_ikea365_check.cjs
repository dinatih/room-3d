const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width: 1000, height: 900 });
    await page.goto('http://127.0.0.1:5177/AGENTS.md');
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
      const { KitchenFurniture, KitchenFurnishings } = await import('/src/features/scene/placements/KitchenPlacements.tsx');
      const { BATH_WEST_WALL, ROOM_D } = await import('/src/features/scene/wallData.ts');
      const { SCENE_REGISTRY } = await import('/src/features/inventory/previewRegistry.tsx');
      const { INVENTORY } = await import('/src/features/inventory/inventoryData.ts');
      window.fixture = { THREE, BATH_WEST_WALL, ROOM_D, item: INVENTORY.find(item => item.id === 'ikea36590066708'), hasPreview: !!SCENE_REGISTRY.ikea36590066708 };
      document.body.replaceChildren();
      document.body.style.margin = '0';
      const container = document.createElement('div');
      container.style.height = '900px';
      document.body.append(container);
      function Capture() {
        const state = useThree();
        React.useLayoutEffect(() => {
          Object.assign(window.fixture, state);
          state.camera.lookAt(BATH_WEST_WALL + 19.5, 157, ROOM_D - 37.75);
        }, [state]);
        return null;
      }
      createRoot(container).render(React.createElement(Canvas, { camera: { position: [BATH_WEST_WALL - 180, 215, ROOM_D - 140], near: 1, far: 2000 }, gl: { preserveDrawingBuffer: true } },
        React.createElement(Capture), React.createElement('ambientLight', { intensity: 2 }),
        React.createElement('directionalLight', { position: [BATH_WEST_WALL - 100, 300, ROOM_D - 100], intensity: 3 }),
        React.createElement(React.Suspense, { fallback: null }, React.createElement(KitchenFurniture), React.createElement(KitchenFurnishings))));
    });
    await page.waitForFunction(() => {
      const f = window.fixture;
      if (!f?.scene) return false;
      let count = 0;
      f.scene.traverse(node => { if (node.userData.itemName === 'Boîte IKEA 365+' && node.children.length) count++; });
      return count === 3;
    }, { timeout: 60000 });
    const result = await page.evaluate(() => {
      const { THREE, scene, item, hasPreview } = window.fixture;
      scene.updateMatrixWorld(true);
      const boxes = [];
      scene.traverse(node => {
        if (node.userData.itemName !== 'Boîte IKEA 365+') return;
        const local = node.clone();
        const box = new THREE.Box3().setFromObject(local);
        let transparent = false;
        node.traverse(child => { if (child.isMesh && child.material.transparent) transparent = true; });
        boxes.push({ min: box.min.toArray(), max: box.max.toArray(), transparent });
      });
      return { item, hasPreview, boxes };
    });
    assert.equal(result.item.qty, 3);
    assert(result.hasPreview);
    assert.equal(result.boxes.length, 3);
    for (const box of result.boxes) {
      assert(Math.abs(box.min[1] - 156.5) < 0.001);
      assert(box.max[1] < 190.5, 'Fits below the top frame');
      assert(box.min[0] >= -34.25 && box.max[0] <= -0.75, 'Fits in the north cell');
      assert(box.min[2] >= -19.5 && box.max[2] <= 19.5, 'Fits within shelf depth');
      assert(box.transparent, 'Transparent plastic retained');
    }
    const sorted = result.boxes.sort((a, b) => a.min[0] - b.min[0]);
    assert(sorted[0].max[0] < sorted[1].min[0] && sorted[1].max[0] < sorted[2].min[0], 'No overlap');
    assert.deepEqual(errors, []);
    await page.screenshot({ path: '/tmp/room-ikea365-kallax.png' });
    console.log(JSON.stringify(result, null, 2));
    console.log('Inventory, dedicated preview, three independent boxes, shelf bounds and transparency: OK');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
