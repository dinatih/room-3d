const assert = require('node:assert/strict');
const launch = require('./browser-test-options.cjs');
(async () => {
  if (process.argv.includes('--stop-navigation')) {
    const log = require('node:fs').readFileSync('/tmp/room-navigation-browser.log', 'utf8');
    const browser = await require('puppeteer').connect({ browserWSEndpoint: log.match(/ws:\/\/\S+/)[0] });
    await browser.close();
    return;
  }
  if (process.argv.includes('--navigation')) {
    const browser = await launch({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    const deadline = setTimeout(() => browser.process()?.kill('SIGKILL'), 180000);
    try {
      const page = await browser.newPage();
      await page.setRequestInterception(true);
      page.on('request', async request => {
        if (new URL(request.url()).pathname === '/src/features/scene/Studio.tsx') {
          const response = await fetch(request.url());
          const body = (await response.text()).replace('window.threeGl = gl;', 'window.threeGl = gl; gl.render = () => {}; gl.compileAsync = async () => {};');
          return request.respond({ status: 200, contentType: 'application/javascript', body });
        }
        return request.continue();
      });
      await page.evaluateOnNewDocument(() => {
        window.addEventListener('error', event => { window.navigationFailure = { message: event.message, cause: event.error?.cause }; });
        setInterval(() => window.dispatchEvent(new MouseEvent('mousemove')), 1000);
      });
      page.on('console', message => { if (message.type() === 'error') console.log(message.text()); });
      await page.goto('http://127.0.0.1:5173/?mode=follow&target=character&skipIntro=1', { waitUntil: 'domcontentloaded' });
      console.log('Scene document loaded');
      await page.waitForFunction(() => window.navigationFailure, { timeout: 120000 });
      const failure = await page.evaluate(() => window.navigationFailure);
      require('node:fs').writeFileSync('/tmp/room-navigation-failure.json', JSON.stringify(failure));
      console.log(failure.message);
    } finally { clearTimeout(deadline); await browser.close(); }
    return;
  }
  if (process.argv.includes('--walk') || process.argv.includes('--audit-walks')) {
    require('../tests/support/load-ts.cjs');
    const THREE = require('three');
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const { retargetClip } = require('../src/features/scene/retargeting/retargetClip.ts');
    const { getWalkCycleSpeed } = require('../src/features/scene/character/walkCadence.ts');
    const { ANIMATION_DEFINITIONS } = require('../src/features/scene/animations/animationRegistry.ts');
    const { ANIMATION_WALK_SPEEDS, NPC_WALK_ANIMATIONS } = require('../src/features/scene/ai/agent/agentWalkAnimations.ts');
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
    if (process.argv.includes('--audit-walks')) {
      const results = [];
      const definitions = ANIMATION_DEFINITIONS.filter(def => Object.hasOwn(ANIMATION_WALK_SPEEDS, def.id) || /(?:^|[-_ ])(?:walk\w*|run\w*|jog\w*)(?:$|[-_ ])/i.test(def.id));
      for (const definition of definitions) {
        const row = { id: definition.id, npc: NPC_WALK_ANIMATIONS.includes(definition.id), calibrated: Object.hasOwn(ANIMATION_WALK_SPEEDS, definition.id), reference: definition.walkSpeed !== undefined ? 'authored-root' : 'retargeted-forefoot', rootMotionSpace: definition.rootMotionSpace };
        try {
          const source = await read(`public/${definition.path}`);
          source.animations[0].name = definition.id;
          const clip = retargetClip(source.animations[0], scene, source.scene, definition.rootMotionSpace);
          clip.name = definition.id;
          row.speed = getWalkCycleSpeed(clip, scene);
          row.expected = ANIMATION_WALK_SPEEDS[definition.id];
          row.duration = clip.duration;
          row.translation = clip.tracks.filter(track => track.name.endsWith('.position')).map(track => ({ name: track.name, first: [...track.values.slice(0, 3)], last: [...track.values.slice(-3)] }));
        } catch (error) { row.error = error.message; }
        results.push(row);
      }
      require('node:fs').writeFileSync('/tmp/room-walk-audit.json', JSON.stringify(results, null, 2));
      console.log(JSON.stringify({ count: results.length, npc: results.filter(row => row.npc).length, calibrated: results.filter(row => row.calibrated).length, issues: results.filter(row => row.error || row.calibrated && row.reference === 'retargeted-forefoot' && Number(row.speed?.toFixed(1)) !== Number(row.expected.toFixed(1))) }, null, 2));
      return;
    }
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
