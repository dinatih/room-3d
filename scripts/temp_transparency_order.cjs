const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createServer } = require('vite');
const launch = require('./browser-test-options.cjs');

(async () => {
  const source = fs.readFileSync('src/features/scene/building/BermudaGround.tsx', 'utf8');
  const order = Number(source.match(/renderOrder=\{(-?\d+)\}/)[1]);
  assert.match(source, /opacity: 0\.8/);
  const server = await createServer({ server: { host: '127.0.0.1', port: 5197, strictPort: true } });
  server.middlewares.use('/transparency-test', (_, res) => res.end('<html><body></body></html>'));
  let browser;
  try {
    await server.listen();
    browser = await launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5197/transparency-test');
    const pixels = await page.evaluate(async groundOrder => {
      const T = await import('/node_modules/three/build/three.module.js');
      const renderer = new T.WebGLRenderer({ preserveDrawingBuffer: true });
      renderer.setSize(128, 128);
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(50, 1, 1, 3000);
      camera.position.set(0, 200, 300);
      camera.lookAt(0, 70, 0);
      const ground = new T.Mesh(new T.PlaneGeometry(2000, 2000), new T.MeshBasicMaterial({ color: 'green', transparent: true, opacity: 0.8 }));
      ground.rotation.x = -Math.PI / 2;
      ground.position.z = 250;
      scene.add(ground);
      const door = new T.Mesh(new T.PlaneGeometry(90, 204), new T.MeshBasicMaterial({ color: 'red', transparent: true, opacity: 0.3, depthWrite: false }));
      door.position.y = 102;
      scene.add(door);
      const sample = renderOrder => {
        ground.renderOrder = renderOrder;
        renderer.render(scene, camera);
        const pixel = new Uint8Array(4);
        renderer.getContext().readPixels(64, 64, 1, 1, renderer.getContext().RGBA, renderer.getContext().UNSIGNED_BYTE, pixel);
        return [...pixel];
      };
      const result = { before: sample(0), after: sample(groundOrder) };
      renderer.dispose();
      return result;
    }, order);
    assert.ok(pixels.after[0] > pixels.before[0], JSON.stringify(pixels));
    assert.ok(pixels.after[1] < pixels.before[1], JSON.stringify(pixels));
    console.log('Porte devant le gazon, opacité du sol conservée :', pixels);
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
