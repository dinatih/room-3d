const assert = require('node:assert/strict');
const launch = require('./browser-test-options.cjs');
(async () => {
  if (process.argv.includes('--archive')) {
    const THREE = require('three');
    const { load } = require('../tests/support/load-ts.cjs');
    const { packRenderArchive, unpackRenderArchive } = load('src/features/scene/photo/renderArchive.ts', {});
    const { serializeRenderScene } = load('src/features/scene/photo/serializeRenderScene.ts', { three: THREE });
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()));
    const camera = new THREE.PerspectiveCamera();
    const archive = packRenderArchive({ scene: serializeRenderScene(scene), camera: camera.toJSON(), width: 32, height: 32, samples: 1, bounces: 2 });
    const response = await fetch('http://127.0.0.1:5174/api/render-jobs', { method: 'POST', body: archive });
    const body = await response.text();
    assert.equal(response.status, 200, body);
    const job = JSON.parse(body);
    try {
      const input = await fetch(`http://127.0.0.1:5174/api/render-jobs/${job.id}/input`);
      assert.equal(input.status, 200);
      const received = await input.blob();
      assert.equal(received.size, archive.size);
      const payload = await unpackRenderArchive(received);
      const restored = await new THREE.ObjectLoader().parseAsync(payload.scene);
      assert(restored.children[0].geometry.attributes.position.array instanceof Float32Array);
      console.log(`PASS: HTTP binary upload, streamed download and Three.js reconstruction (${archive.size} bytes).`);
    } finally { await fetch(`http://127.0.0.1:5174/api/render-jobs/${job.id}/cancel`, { method: 'POST' }); }
    return;
  }
  const browser = await launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    const response = await page.goto('http://127.0.0.1:5174/render-jobs');
    assert.equal(response.status(), 200);
    await page.waitForFunction(() => document.querySelector('main')?.textContent.trim().length > 0, { timeout: 10000 });
    assert.equal(await page.title(), 'Rendus locaux');
    assert.deepEqual(errors, []);
    console.log('PASS: redirect, dashboard JavaScript and API polling in Chromium.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
