const assert = require('node:assert/strict');
const launchBrowser = require('../../scripts/browser-test-options.cjs');
(async () => {
  const browser = await launchBrowser({ args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage(); await page.setViewport({ width: 1200, height: 800 });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', async request => {
      if (request.isNavigationRequest()) return request.respond({ contentType: 'text/html', body: '<div id="root"></div>' });
      if (process.argv.includes('--baseline') && request.url().includes('/src/features/inventory/InventoryPreview.tsx')) {
        const body = await fetch(request.url()).then(r => r.text());
        return request.respond({ contentType: 'application/javascript', body: body.replace('preserveOrigin ? 0 : -box.min.y', '-box.min.y') });
      }
      request.continue();
    });
    await page.goto(process.env.ROOM_TEST_URL || 'http://127.0.0.1:5181');
    await page.evaluate(async () => {
      const refresh = (await import('/@react-refresh')).default; refresh.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;
      await import('/scss/app.scss'); await import('/src/index.css');
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { InventoryPreview: Preview } = await import('/src/features/inventory/InventoryPreview.tsx');
      const { INVENTORY } = await import('/src/features/inventory/inventoryData.ts');
      const source = await fetch('/src/features/inventory/InventoryPreview.tsx').then(r => r.text());
      window.fiber = await import(source.match(/from "([^"]+@react-three_fiber[^"]+)"/)[1]);
      const root = createRoot(document.getElementById('root'));
      window.renderPreview = () => root.render(React.createElement(Preview, { item: { ...INVENTORY.find(i => i.id === 'curious_skeleton') }, initialAnim: 'laying-sleeping', height: '700px', defaultShowGrid: true, defaultAutoRotate: false, neutralLighting: true }));
      window.renderPreview();
    });
    await page.waitForFunction(() => [...window.fiber._roots.values()].some(root => root.store.getState().scene.getObjectByName('mixamorigHips')), { timeout: 60000 });
    await page.evaluate(async () => {
      const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
      const { retargetClip } = await import('/src/features/scene/retargeting/retargetClip.ts');
      const THREE = await import('/node_modules/.vite/deps/three.js');
      const source = await new GLTFLoader().loadAsync('/animations/mixamo/anim_laying_sleeping.glb');
      source.animations[0].name = 'laying-sleeping';
      const scene = [...window.fiber._roots.values()][0].store.getState().scene;
      const model = scene.getObjectByName('skeletal3').parent;
      const mixer = new THREE.AnimationMixer(model); mixer.clipAction(retargetClip(source.animations[0], model, source.scene)).play(); mixer.setTime(0.6);
      model.updateMatrixWorld(true);
      model.traverse(node => { if (node.isSkinnedMesh) { node.skeleton.update(); node.computeBoundingBox(); } });
      window.renderPreview();
    });
    // Include every delayed fit, after explicitly posing the model independently of worker startup.
    await new Promise(resolve => setTimeout(resolve, 1500));
    const measurement = await page.evaluate(() => {
      for (const root of window.fiber._roots.values()) {
        const scene = root.store.getState().scene, marker = scene.getObjectByName('GroundPoint');
        if (!marker) continue;
        marker.updateWorldMatrix(true, false);
        const ancestors = []; for (let node = marker.parent; node && node !== scene; node = node.parent) ancestors.push(node.position.y);
        return { markerY: marker.matrixWorld.elements[13], ancestors };
      }
      throw Error('Missing ground marker');
    });
    console.log(measurement);
    assert.deepEqual(errors, []);
    if (process.argv.includes('--baseline')) assert(measurement.markerY > 0.05 + 1e-6, 'Baseline must reproduce the lifted origin');
    else assert(Math.abs(measurement.markerY - 0.05) < 1e-6, 'Preview must preserve the character ground origin');
    await page.screenshot({ path: `/tmp/skeleton-bis-ground-${process.argv.includes('--baseline') ? 'before' : 'after'}.png` });
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
