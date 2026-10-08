const assert = require('node:assert/strict');
const puppeteer = require('../node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5173/AGENTS.md');
    await page.evaluate(async () => {
      const refresh = (await import('/@react-refresh')).default;
      refresh.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const THREE = await import('/node_modules/.vite/deps/three.js');
      const { RaytracingPhotoModal } = await import('/src/features/scene/photo/RaytracingPhotoModal.tsx');
      document.body.replaceChildren();
      const container = document.createElement('div');
      const canvasParent = document.createElement('div');
      document.body.append(container, canvasParent);
      const gl = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
      gl.setSize(320, 200);
      canvasParent.append(gl.domElement);
      const scene = new THREE.Scene();
      const material = new THREE.MeshStandardMaterial({ color: 'white' });
      scene.add(new THREE.Mesh(new THREE.BoxGeometry(), material), new THREE.DirectionalLight(0xffffff, 3));
      const marker = new THREE.Group();
      marker.userData.isCameraViewMarker = true;
      marker.add(new THREE.Mesh(new THREE.BoxGeometry(.3, .3, .3), new THREE.MeshBasicMaterial({ color: '#dc3545' })));
      scene.add(marker);
      const camera = new THREE.PerspectiveCamera(45, 1.6, .1, 100);
      camera.position.set(2, 2, 4);
      camera.lookAt(0, 0, 0);
      const root = createRoot(container);
      const snapshotMarkerCounts = [];
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function (...args) {
        if (this !== gl.domElement) {
          let count = 0;
          marker.traverseVisible(object => { if (object.isMesh) count++; });
          snapshotMarkerCounts.push(count);
        }
        return originalToDataURL.apply(this, args);
      };
      window.fixture = { scene, marker, root, snapshotMarkerCounts, compilations: [] };
      const compile = gl.compileAsync.bind(gl);
      gl.compileAsync = (...args) => {
        const promise = compile(...args);
        window.fixture.compilations.push(promise);
        return promise;
      };
      window.mountPhoto = () => root.render(React.createElement(RaytracingPhotoModal, { scene, camera, gl, onClose: () => root.render(null) }));
      window.mountPhoto();
    });
    for (let session = 0; session < 2; session++) {
      if (session) await page.evaluate(() => window.mountPhoto());
      await page.waitForFunction(() => document.body.innerText.includes('Calcul en cours'), { timeout: 120000 });
      const during = await page.evaluate(() => ({ snapshots: window.fixture.snapshotMarkerCounts, markerVisible: window.fixture.marker.visible, childrenVisible: window.fixture.marker.children.map(child => child.visible) }));
      assert(during.snapshots.length > 0);
      assert(during.snapshots.every(count => count === 0), 'No marker in standard snapshots');
      assert.equal(during.markerVisible, false, 'Marker group hidden for path tracing');
      assert(during.childrenVisible.every(visible => !visible), 'Marker meshes hidden for path tracing');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('[title="Fermer (Échap)"]'));
      assert(await page.evaluate(() => window.fixture.marker.visible && window.fixture.marker.children.every(child => child.visible)), 'Marker visibility restored after closing photo');
    }
    await page.evaluate(() => Promise.all(window.fixture.compilations));
    assert.deepEqual(errors, []);
    console.log('Two photo sessions: markers excluded before standard snapshots and path tracing, then restored: OK');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
