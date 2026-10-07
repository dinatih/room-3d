const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.log('Page error:', error.message); });
    page.on('console', message => {
      if (message.text().includes('[Raytracing]')) console.log(message.text());
    });
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
      const materials = ['red', 'white', 'black'].map(color => new THREE.MeshStandardMaterial({ color }));
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(), [materials[0], materials[1], materials[2], materials[0], materials[1], materials[2]]);
      scene.add(mesh);
      const character = new THREE.Mesh(new THREE.BoxGeometry(), materials[0]);
      character.name = 'walker-fixture';
      scene.add(character, new THREE.DirectionalLight(0xffffff, 3));
      const camera = new THREE.PerspectiveCamera(45, 1.6, .1, 100);
      camera.position.set(2, 2, 4);
      camera.lookAt(0, 0, 0);
      const root = createRoot(container);
      const baseline = [];
      scene.traverse(object => baseline.push([object, object.visible, object.geometry, object.material]));
      window.fixture = { scene, mesh, root, camera, gl, canvasParent, baseline, compilations: [] };
      const compile = gl.compileAsync.bind(gl);
      gl.compileAsync = (...args) => {
        const promise = compile(...args);
        window.fixture.compilations.push(promise);
        return promise;
      };
      window.mountPhoto = () => root.render(React.createElement(RaytracingPhotoModal, { scene, camera, gl, onClose: () => root.render(null) }));
      window.mountPhoto();
    });
    for (let i = 0; i < 2; i++) {
      if (i) await page.evaluate(() => window.mountPhoto());
      await page.waitForFunction(() => document.body.innerText.includes('Calcul en cours'), { timeout: 120000 });
      const arrays = await page.evaluate(() => {
        let count = 0;
        window.fixture.scene.traverseVisible(object => { if (object.isMesh && Array.isArray(object.material)) count++; });
        return count;
      });
      assert.equal(arrays, 0);
      if (i === 0) await page.keyboard.press('Escape');
      else await page.evaluate(() => document.querySelector('[title="Fermer (Échap)"]').click());
      await page.waitForFunction(() => !document.querySelector('[title="Fermer (Échap)"]'), { timeout: 120000 });
      const changed = await page.evaluate(() => {
        const { baseline, gl, canvasParent } = window.fixture;
        if (gl.domElement.parentElement !== canvasParent) return ['canvas parent'];
        return baseline.filter(([object, visible, geometry, material]) => object.visible !== visible || object.geometry !== geometry || object.material !== material).map(([object]) => object.name || object.type);
      });
      assert.deepEqual(changed, []);
    }
    await page.evaluate(() => Promise.all(window.fixture.compilations));
    assert.deepEqual(errors, []);
    console.log('Browser fixture: two photo sessions, scalar materials, Escape/button close, exact geometry/material/visibility and canvas restoration verified.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
