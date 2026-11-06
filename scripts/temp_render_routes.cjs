const assert = require('node:assert/strict');
const launch = require('./browser-test-options.cjs');
(async () => {
  if (process.argv.includes('--replay')) {
    const response = await fetch('http://127.0.0.1:5174/api/render-jobs', {
      method: 'POST', headers: { 'Content-Type': 'application/octet-stream' },
      body: require('node:fs').createReadStream(process.argv.at(-1)), duplex: 'half',
    });
    const body = await response.text(); assert.equal(response.status, 200, body); console.log(body); return;
  }
  if (process.argv.includes('--gpu')) {
    const browser = await launch({ args: ['--enable-gpu'] });
    try {
      const page = await browser.newPage();
      await page.setCacheEnabled(false);
      console.log(await page.evaluate(() => {
        const gl = document.createElement('canvas').getContext('webgl2');
        const debug = gl.getExtension('WEBGL_debug_renderer_info');
        return { renderer: gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) };
      }));
    } finally { await browser.close(); }
    return;
  }
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
      const payload = await unpackRenderArchive(received.stream());
      const restored = await new THREE.ObjectLoader().parseAsync(payload.scene);
      assert(restored.children[0].geometry.attributes.position.array instanceof Float32Array);
      console.log(`PASS: HTTP binary upload, streamed download and Three.js reconstruction (${archive.size} bytes).`);
    } finally { await fetch(`http://127.0.0.1:5174/api/render-jobs/${job.id}/cancel`, { method: 'POST' }); }
    return;
  }
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    const response = await page.goto('http://127.0.0.1:5174/render-jobs');
    assert.equal(response.status(), 200);
    await page.waitForFunction(() => document.querySelector('main')?.textContent.trim().length > 0, { timeout: 10000 });
    assert.equal(await page.title(), 'Rendus locaux');
    const jobs = await page.evaluate(async () => (await fetch('/api/render-jobs')).json());
    assert(jobs.every((job, index) => Number.isFinite(job.createdAt) && (!index || jobs[index - 1].createdAt >= job.createdAt)));
    assert.deepEqual(await page.$$eval('article', cards => cards.map(card => card.dataset.jobId)), jobs.map(job => job.id));
    const link = await page.$('article a');
    if (link) {
      assert.equal(await link.evaluate(element => element.hasAttribute('download')), false);
      const opened = browser.waitForTarget(target => target.url().includes('/api/render-jobs/') && target.url().endsWith('/image'));
      await link.click();
      const image = await (await opened).page();
      await image.waitForFunction(() => document.querySelector('img')?.naturalWidth > 0);
      await image.close();
    }
    await page.screenshot({ path: '/tmp/room-render-jobs-redesign.png' });

    assert.deepEqual(errors, []);
    console.log('PASS: dashboard, newest-first ordering and direct image opening without download verified.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
