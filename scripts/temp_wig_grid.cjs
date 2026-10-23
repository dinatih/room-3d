const assert = require('node:assert/strict');
const launch = require('./browser-test-options.cjs');
(async () => {
  if (process.argv.includes('--walk')) {
    require('../tests/support/load-ts.cjs');
    const THREE = require('three');
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const { retargetClip } = require('../src/features/scene/retargeting/retargetClip.ts');
    const { getWalkCycleSpeed } = require('../src/features/scene/character/walkCadence.ts');
    const read = async path => {
      const loader = new GLTFLoader();
      loader.setDRACOLoader({ preload() {} });
      loader.register(() => ({ name: 'SkeletonOnly', loadMesh: () => Promise.resolve(new THREE.Group()) }));
      const data = require('node:fs').readFileSync(path);
      return loader.parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '');
    };
    const { scene } = await read('public/characters/lara/lara_native.glb');
    scene.scale.multiplyScalar(100);
    scene.updateMatrixWorld(true);
    scene.traverse(node => {
      node.defaultPosition = node.position.clone();
      node.restLocalQuaternion = node.quaternion.clone();
      node.restWorldQuaternion = node.getWorldQuaternion(new THREE.Quaternion());
      node.restWorldPosition = node.getWorldPosition(new THREE.Vector3());
    });
    const source = await read('public/animations/miley/miley_armature_41_provocative_walk.glb');
    source.animations[0].name = 'miley-armature-41-provocative-walk';
    const clip = retargetClip(source.animations[0], scene, source.scene);
    clip.name = source.animations[0].name;
    const ranges = track => ({ name: track.name, first: [...track.values.slice(0, 3)], last: [...track.values.slice(-3)], range: [0, 1, 2].map(axis => {
      const values = [...track.values].filter((_, i) => i % 3 === axis);
      return Math.max(...values) - Math.min(...values);
    }) });
    console.log(JSON.stringify({ duration: clip.duration, source: source.animations[0].tracks.filter(t => /CC_Base_(BoneRoot|Hip)\.position/.test(t.name)).map(ranges), target: clip.tracks.filter(t => t.name.endsWith('.position')).map(ranges) }, null, 2));
    console.log('Measured speed:', getWalkCycleSpeed(clip, scene));
    return;
  }
  const browser = await launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'], protocolTimeout: 180000 });
  const deadline = setTimeout(() => {
    console.error('Browser test exceeded its deadline');
    browser.process()?.kill('SIGKILL');
    process.exitCode = 1;
  }, 240000);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1000 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5173/?characterCount=0&preset=low&skipIntro=1&animals=0', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(async () => (await import('/src/features/scene/cameraState.ts')).cameraState.isSceneLaunched, { timeout: 180000 });
    await page.waitForSelector('[aria-label="Grille perruques"]', { visible: true, timeout: 60000 });
    await page.click('[aria-label="Grille perruques"]');
    await page.waitForFunction(async () => {
      const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const { WIGS_ITEMS } = await import('/src/features/inventory/inventoryData.ts');
      const grid = [..._roots.values()].map(root => root.store.getState().scene.getObjectByName('wigs-grid')).find(Boolean);
      if (!grid) return false;
      let busts = 0;
      grid.traverse(node => { if (node.userData.itemName === 'Buste Lara') busts++; });
      return busts === WIGS_ITEMS.length;
    }, { timeout: 180000 });
    assert.equal(await page.$eval('[aria-label="Grille perruques"]', button => button.getAttribute('aria-pressed')), 'true');
    await page.screenshot({ path: '/tmp/room-wig-grid.png' });
    await page.click('[aria-label="Grille inventaire (Alt+I)"]');
    assert.equal(await page.$eval('[aria-label="Grille perruques"]', button => button.getAttribute('aria-pressed')), 'false');
    await page.click('[aria-label="Grille perruques"]');
    assert.equal(await page.$eval('[aria-label="Grille inventaire (Alt+I)"]', button => button.getAttribute('aria-pressed')), 'false');
    await page.click('[aria-label="Grille perruques"]');
    assert.equal(await page.$eval('[aria-label="Grille perruques"]', button => button.getAttribute('aria-pressed')), 'false');
    assert.deepEqual(errors, []);
    console.log('PASS: all wigs mounted on Lara busts, grid switching and closing, no browser errors');
  } finally { clearTimeout(deadline); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
