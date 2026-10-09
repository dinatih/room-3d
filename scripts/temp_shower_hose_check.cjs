const { createRequire } = require('node:module');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const puppeteer = createRequire(`${process.cwd()}/package.json`)('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width: 1000, height: 1000 });
    await page.goto('http://127.0.0.1:5175/AGENTS.md');
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
      const { Shower } = await import('/src/features/scene/items/Shower.tsx');
      document.body.innerHTML = '<div id="fixture" style="height:100vh"></div>';
      document.body.style.margin = '0';
      function Capture() {
        const { camera, scene } = useThree();
        camera.lookAt(0, 120, 25);
        window.fixture = { scene, camera, THREE };
        return null;
      }
      const e = React.createElement;
      createRoot(document.getElementById('fixture')).render(e(Canvas,
        { camera: { position: [60, 130, -230], near: 1, far: 1000, fov: 48 }, gl: { preserveDrawingBuffer: true } },
        e('color', { attach: 'background', args: ['#b9c2c9'] }),
        e('ambientLight', { intensity: 2 }),
        e('directionalLight', { position: [50, 180, -100], intensity: 4 }),
        e(Capture), e(React.Suspense, { fallback: null }, e(Shower, { actionState: { showerDoor: true }, onSize: () => { window.ready = true; } }))));
    });
    await page.waitForFunction(() => window.ready);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const geometry = await page.evaluate(() => {
      const { scene, THREE } = window.fixture;
      scene.updateMatrixWorld(true);
      const result = [];
      scene.traverse(object => {
        if (!object.userData.gltfPath?.includes('vallamosse')) return;
        object.traverse(mesh => {
          if (!mesh.isMesh) return;
          const positions = mesh.geometry.attributes.position;
          const points = [];
          for (let i = 0; i < positions.count; i++) points.push(new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).toArray());
          result.push({ path: object.userData.gltfPath, material: mesh.material.name, points });
        });
      });
      return result;
    });
    fs.writeFileSync('/tmp/room-shower-geometry.json', JSON.stringify(geometry));
    await page.screenshot({ path: '/tmp/room-shower-hose.png' });
    const clearance = await page.evaluate(() => {
      const { scene, THREE } = window.fixture;
      const hose = scene.getObjectByName('shower-hose');
      let tapRoot;
      scene.traverse(object => {
        if (object.userData.gltfPath?.includes('vallamosse mitigeur')) tapRoot = object;
      });
      const tapBox = new THREE.Box3().setFromObject(tapRoot);
      const { path, radius, tubularSegments } = hose.geometry.parameters;
      const points = path.getPoints(tubularSegments).map(point => hose.localToWorld(point));
      const crossing = points.slice(0, -1).filter(point => point.y >= tapBox.min.y && point.y <= tapBox.max.y);
      const minClearance = Math.min(...crossing.map(point => tapBox.min.z - point.z - radius));
      const end = points.at(-1);
      return { minClearance, crossingCount: crossing.length, endpointHeightError: Math.abs(end.y - tapBox.min.y) };
    });
    assert(clearance.crossingCount > 0, 'The descending hose must pass the height of the faucet');
    assert(clearance.minClearance > 0, `Hose intersects the faucet: ${JSON.stringify(clearance)}`);
    assert(clearance.endpointHeightError < 1e-5, 'Hose end must meet the bottom outlet');
    console.log('Front clearance and outlet connection:', clearance);
    await page.evaluate(() => {
      window.fixture.camera.position.set(220, 125, -40);
      window.fixture.camera.lookAt(0, 120, 25);
    });
    await new Promise(resolve => setTimeout(resolve, 250));
    await page.screenshot({ path: '/tmp/room-shower-hose-side.png' });
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('Shower rendered without browser errors. Geometry: /tmp/room-shower-geometry.json; image: /tmp/room-shower-hose.png');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
