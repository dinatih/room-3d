// One isolated R3F Canvas; no Studio or external network requests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const launch = require('./browser-test-options.cjs');
(async () => {
  const registry = fs.readFileSync(path.join(__dirname, '../src/features/inventory/previewRegistry.tsx'), 'utf8');
  assert(!/'tshirt-noir-(L|XL)'\s*:/.test(registry), 'shirt preview must use the flat GLB');
  const browser = await launch({ args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewport({ width: 900, height: 1000 });
    await page.setRequestInterception(true);
    page.on('request', r => ['localhost', '127.0.0.1'].includes(new URL(r.url()).hostname) ? r.continue() : r.abort());
    await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5173'}/AGENTS.md`);
    await page.evaluate(async () => {
      window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { Canvas } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const THREE = await import('/node_modules/.vite/deps/three.js');
      await import('/src/dracoSetup.ts');
      const { ClipHanger16Loaded } = await import('/src/features/scene/items/ClipHanger16.tsx');
      const { Mackapar50530988 } = await import('/src/features/scene/items/Mackapar50530988.tsx');
      const { createStaticGlbItem } = await import('/src/features/scene/items/createStaticGlbItem.tsx');
      const { INVENTORY } = await import('/src/features/inventory/inventoryData.ts');
      window.inventoryCheck = ['clip-hanger-16','tshirt-noir-L','tshirt-noir-XL'].map(id => INVENTORY.find(i=>i.id===id));
      const FlatL = createStaticGlbItem('/items/tshirt-noir/TShirtBlackFlatL.glb');
      const FlatXL = createStaticGlbItem('/items/tshirt-noir/TShirtBlackFlatXL.glb');
      const h = React.createElement;
      document.body.innerHTML = '<div id="fixture" style="width:900px;height:1000px"></div>';
      createRoot(document.querySelector('#fixture')).render(h(Canvas, {
        camera: { position: [270,200,290], near: .1, far: 2000, fov: 40 },
        onCreated: ({ scene, camera }) => { window.testScene = scene; camera.lookAt(30,100,0); window.THREE = THREE; },
      }, h('color', { attach: 'background', args: ['#656a71'] }),
      h('ambientLight', { intensity: 1.8 }), h('directionalLight', { position: [150,250,200], intensity: 3 }),
      h(React.Suspense, { fallback: null },
        h('group', { position: [32,0,0], rotation: [0,Math.PI/2,0] }, h(Mackapar50530988)),
        h('group', { name: 'loaded-clips', position: [30,189.38,.8], rotation: [0,Math.PI/2,0] }, h(ClipHanger16Loaded)),
        h('group', { name: 'flat-L', position: [150,0,0] }, h(FlatL)),
        h('group', { name: 'flat-XL', position: [150,0,-90] }, h(FlatXL))
      )));
    });
    await page.waitForFunction(() => {
      const s = window.testScene;
      if (!s) return false;
      return ['loaded-clips','flat-L','flat-XL'].every(name => {
        let ready = false;
        s.getObjectByName(name)?.traverse(o => { if (o.isMesh) ready = true; });
        return ready;
      });
    }, { timeout: 60000 });
    const result = await page.evaluate(() => {
      const out = {};
      for (const name of ['loaded-clips','flat-L','flat-XL']) {
        const o = window.testScene.getObjectByName(name);
        o.updateWorldMatrix(true, true);
        const box = new window.THREE.Box3().setFromObject(o);
        let triangles = 0;
        o.traverse(m => { if (m.isMesh) triangles += (m.geometry.index?.count ?? m.geometry.attributes.position.count)/3; });
        out[name] = { min: box.min.toArray(), max: box.max.toArray(), size: box.getSize(new window.THREE.Vector3()).toArray(), triangles };
      }
      return { models: out, inventory: window.inventoryCheck };
    });
    assert.equal(result.inventory[0].price, '7,39');
    assert(result.models['loaded-clips'].min[0] > 0, 'shirts must clear the west wall');
    assert(Math.abs(result.models['loaded-clips'].max[1] - 189.38) < .01, 'hook crown must align with the measured upper rail');
    assert(result.models['flat-L'].size[1] < 3, 'flat preview must lie horizontally');
    assert(result.models['flat-XL'].size[0] > result.models['flat-L'].size[0], 'XL must be larger than L');
    assert.deepEqual(errors, []);
    await page.screenshot({ path: '/tmp/clip-hanger-mackapar.png' });
    console.log(JSON.stringify(result, null, 2));
    console.log('PASS — inventory, GLB previews, isolated R3F rendering and wall clearance');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
