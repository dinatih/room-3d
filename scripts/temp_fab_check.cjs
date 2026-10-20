const fs = require('node:fs');
const path = require('node:path');

function readGlb(file) {
  const data = fs.readFileSync(file);
  return JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString());
}

if (process.argv.includes('--inspect')) {
  for (const file of ['public/characters/xbot/Xbot_official.glb']) {
    const gltf = readGlb(file);
    console.log(file, JSON.stringify(gltf.nodes.filter(n => !n.name?.startsWith('mixamorig:') || n.name === 'mixamorig:Hips')));
  }
  const inventory = JSON.parse(fs.readFileSync('/tmp/room-fab-animations/inventory.json'));
  for (const source of inventory) console.log(source.source, source.files.map(f => path.basename(f)).join(', '));
}

async function checkMotions() {
  const assert = require('node:assert/strict');
  const launchBrowser = require('./browser-test-options.cjs');
  const reportFile = process.argv.includes('--sample') ? 'scripts/fab-import-report-sample.json' : 'scripts/fab-import-report.json';
  const report = JSON.parse(fs.readFileSync(reportFile));
  if (!process.argv.includes('--sample')) {
    const assets = fs.readdirSync('public/animations/fab', { recursive: true }).filter(file => file.endsWith('.glb'));
    assert.equal(assets.length, report.imported.length, 'Unregistered Fab assets');
    for (const file of assets) assert(report.imported.some(entry => entry.path === 'animations/fab/' + file), `Unregistered asset ${file}`);
    assert.equal(report.sources.length, 25, 'Missing requested source');
    for (const source of report.sources) assert(report.imported.concat(report.excluded).some(entry => entry.source === source.source), `Unaccounted source ${source.source}`);
  }
  const { spawn } = require('node:child_process');
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5192', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', data => process.stdout.write(data));
  server.stderr.on('data', data => process.stderr.write(data));
  let browser;
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(Error('Vite startup timed out')), 30000);
      server.stdout.on('data', data => { if (data.toString().includes('Local:')) { clearTimeout(timeout); resolve(); } });
      server.on('error', error => { clearTimeout(timeout); reject(error); });
      server.on('exit', code => { clearTimeout(timeout); reject(Error(`Vite exited: ${code}`)); });
    });
    browser = await launchBrowser({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5192'}/AGENTS.md`);
    page.on('console', message => { if (message.type() === 'error' || message.text().startsWith('FAB_')) console.log('BROWSER', message.text()); });
    page.on('requestfailed', request => console.error('REQUEST_FAILED', request.url(), request.failure()?.errorText));
    const result = await page.evaluate(async ({ report, sample }) => {
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const THREE = await import('/node_modules/three/build/three.module.js');
      console.log('FAB_TEST imports');
      const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
      const { DRACOLoader } = await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
      const { MeshoptDecoder } = await import('/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js');
      const { retargetClip, resolveTargetBoneName } = await import('/src/features/scene/retargeting/index.ts');
      const { extractCharacterParts, applyPistolVisibility } = await import('/src/features/scene/characterParts.ts');
      const { ANIMATION_DEFINITIONS } = await import('/src/features/scene/animations/animationRegistry.ts');
      const { getFilteredAnimOptions } = await import('/src/features/scene/CharacterAnimSelector.tsx');
      const { getAnimationsByTags, resolveAnimationPath, resolveSlotAnimation } = await import('/src/features/scene/animations/animationResolver.ts');
      const { NPC_WALK_ANIMATIONS, getWalkSpeedForAnimation } = await import('/src/features/scene/ai/agent/agentWalkAnimations.ts');
      function check(value, message) { if (!value) throw Error(message); }
      check(new Set(ANIMATION_DEFINITIONS.map(d => d.id)).size === ANIMATION_DEFINITIONS.length, 'Duplicate animation IDs');
      if (!sample) {
        const definitions = ANIMATION_DEFINITIONS.filter(d => d.path.startsWith('animations/fab/'));
        check(definitions.length === report.imported.length, 'Incomplete Fab registry');
        check(getFilteredAnimOptions('', ['fab']).length === definitions.length, 'Incomplete Fab filter');
        for (const def of definitions) {
          check(resolveAnimationPath(def.id) === def.path, `Unresolved ID ${def.id}`);
          check(getFilteredAnimOptions(def.id, ['fab']).some(o => o.value === def.id), `Unsearchable ${def.id}`);
          check(!/injured|getting-up|vehicle/.test(def.id) || !getAnimationsByTags(['dance', 'combat', 'interactions'], 'any').includes(def), `Incompatible autonomous motion ${def.id}`);
        }
        const walks = definitions.filter(def => def.tags.includes('npc-walk'));
        check(walks.length === 5, 'Missing autonomous gait variants');
        for (const def of walks) {
          check(def.id.endsWith('-in-place') && NPC_WALK_ANIMATIONS.includes(def.id), `Unsafe moving gait ${def.id}`);
          check(def.walkSpeed > 0 && getWalkSpeedForAnimation(def.id) === def.walkSpeed, `Uncalibrated gait ${def.id}`);
        }
        for (const tag of ['dance', 'combat', 'interactions', 'poses-idles', 'locomotion']) {
          const imported = getAnimationsByTags(tag).filter(def => def.path.startsWith('animations/fab/'));
          check(imported.length > 0, `Unenriched AI activity ${tag}`);
          const resolved = resolveSlotAnimation({ slotId: 'fab-check', animationsRandom: tag });
          check(resolved.id || resolved.animId || resolved.animation || resolved.path, `Unresolved AI activity ${tag}`);
        }
      }
      const loader = new GLTFLoader();
      loader.setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));
      loader.setMeshoptDecoder(MeshoptDecoder);
      const targets = [];
      for (const path of ['/characters/xbot/Xbot_official.glb', '/characters/lara/lara_native.glb']) {
        console.log('FAB_TARGET', path);
        const target = (await loader.loadAsync(path)).scene;
        target.scale.setScalar(100);
        target.updateMatrixWorld(true);
        const parts = extractCharacterParts(target);
        const rest = [];
        target.traverse(o => { if (o.isBone) rest.push([o, o.position.clone(), o.quaternion.clone(), o.scale.clone()]); });
        function reset() { for (const [bone, pos, quat, scale] of rest) { bone.position.copy(pos); bone.quaternion.copy(quat); bone.scale.copy(scale); } target.updateMatrixWorld(true); }
        targets.push({ path, target, parts, rest, reset });
      }
      const lara = targets[1];
      const preferences = { showAccessories: false, laraPistols: false, equipment: { pistols: false, backpack: false, holster: false } };
      check(lara.parts.handPistols.length >= 2, 'Missing Lara dual pistols');
      applyPistolVisibility(lara.parts, { ...preferences, animationEquipment: 'dual-pistols' });
      check(lara.parts.handPistols.every(p => p.mesh.visible) && lara.parts.holsterPistols.every(p => !p.mesh.visible), 'Dual pistol override');
      applyPistolVisibility(lara.parts, preferences);
      check(lara.parts.handPistols.every(p => !p.mesh.visible), 'Pistol preference restoration');
      applyPistolVisibility(lara.parts, { showAccessories: true, laraPistols: false, equipment: { pistols: true, backpack: true, holster: true } });
      check(lara.parts.holsterPistols.every(p => p.mesh.visible) && lara.parts.handPistols.every(p => !p.mesh.visible), 'Holstered pistol restoration');

      const gallery = [];
      const originalWalks = new Map();
      const walkSourceIds = new Set(report.imported.filter(entry => entry.derivedFrom).map(entry => entry.derivedFrom));
      let played = 0;
      const ranges = [];
      for (const entry of report.imported) {
        console.log('FAB_CLIP', entry.id);
        const gltf = await loader.loadAsync('/' + entry.path);
        const sourceBones = [];
        gltf.scene.traverse(o => { if (o.isBone) sourceBones.push(o); });
        check(sourceBones.length === 67, `Incorrect bone count ${entry.id}: ${sourceBones.length}`);
        check(gltf.animations.length === 1, `Incorrect clip count ${entry.id}`);
        check(!gltf.parser.json.meshes && !gltf.parser.json.textures, `Unused geometry ${entry.id}`);
        const clip = gltf.animations[0];
        const def = ANIMATION_DEFINITIONS.find(d => d.id === entry.id);
        if (!sample) check(Math.abs(clip.duration - def.duration) < 0.0001, `Duration mismatch ${entry.id}`);
        const hipsTrack = clip.tracks.find(t => t.name === 'mixamorigHips.position' || /Hips\.position$/.test(t.name));
        check(hipsTrack, `Missing source hips ${entry.id}`);
        const sourceHips = sourceBones.find(b => /Hips$/.test(b.name));
        if (walkSourceIds.has(entry.id)) originalWalks.set(entry.id, clip);
        if (entry.derivedFrom) {
          const values = hipsTrack.values;
          check(Math.abs(values[values.length - 3] - values[0]) < 1e-6 && Math.abs(values[values.length - 1] - values[2]) < 1e-6, `Accumulating AI root displacement ${entry.id}`);
          const original = originalWalks.get(entry.derivedFrom);
          const originalHips = original.tracks.find(track => /Hips\.position$/.test(track.name));
          const dx = originalHips.values.at(-3) - originalHips.values[0];
          const dz = originalHips.values.at(-1) - originalHips.values[2];
          check(Math.abs(Math.hypot(dx, dz) * 100 / original.duration - def.walkSpeed) < 0.0001, `Incorrect gait speed ${entry.id}`);
          for (const track of clip.tracks.filter(track => track.name.endsWith('.quaternion'))) {
            const source = original.tracks.find(candidate => candidate.name === track.name);
            check(track.values.length === source.values.length && track.values.every((value, index) => value === source.values[index]), `Changed gait pose ${entry.id}: ${track.name}`);
          }
          for (let index = 0; index < hipsTrack.times.length; index++) {
            const progress = hipsTrack.times[index] / clip.duration;
            check(Math.abs(values[index * 3] + dx * progress - originalHips.values[index * 3]) < 1e-6 && Math.abs(values[index * 3 + 2] + dz * progress - originalHips.values[index * 3 + 2]) < 1e-6 && values[index * 3 + 1] === originalHips.values[index * 3 + 1], `Changed gait trajectory ${entry.id}`);
          }
        }
        const origin = sourceHips.position.clone();
        for (const { path, target, reset, rest } of targets) {
          reset();
          gltf.scene.updateMatrixWorld(true);
          const retargeted = retargetClip(clip, target, gltf.scene, 'rest-meters');
          check(retargeted.tracks.length >= 20, `Incomplete retarget ${entry.id}: ${retargeted.tracks.length}`);
          const hipsName = resolveTargetBoneName(target, 'Hips');
          const targetHips = target.getObjectByName(hipsName);
          const targetRestWorld = targetHips.getWorldPosition(new THREE.Vector3());
          const targetTrack = retargeted.tracks.find(t => t.name === hipsName + '.position');
          check(targetTrack && targetTrack.times[0] === hipsTrack.times[0] && targetTrack.times.at(-1) === hipsTrack.times.at(-1), `Lost hips endpoints ${entry.id}`);
          const mixer = new THREE.AnimationMixer(target);
          mixer.clipAction(retargeted).setLoop(THREE.LoopOnce, 1).play();
          for (const fraction of [0, 0.25, 0.5, 0.75, 0.999]) {
            const time = targetTrack.times[Math.floor((targetTrack.times.length - 1) * fraction)];
            mixer.setTime(time);
            target.updateMatrixWorld(true);
            target.traverse(o => check(o.matrixWorld.elements.every(Number.isFinite), `Invalid transform ${entry.id} ${path}`));
            for (const [bone, pos] of rest) if (bone.name !== hipsName) check(bone.position.distanceTo(pos) < 1e-5, `Changed limb length ${entry.id} ${bone.name}`);
            const expected = new THREE.Vector3().fromArray(hipsTrack.createInterpolant().evaluate(time)).sub(origin).multiplyScalar(100);
            const actual = targetHips.getWorldPosition(new THREE.Vector3()).sub(targetRestWorld);
            check(actual.distanceTo(expected) < 0.001, `Changed metric root trajectory ${entry.id} ${path}: ${actual.distanceTo(expected)}`);
          }
          if (path.includes('lara') && /actorcore|bboombboom|air-horse|back-kick|army-crawl|getting-up|vehicle/.test(entry.id)) {
            gallery.push({ id: entry.id, clip: retargeted.clone(), duration: clip.duration });
          }
          mixer.stopAllAction(); mixer.uncacheRoot(target);
        }
        const heights = Array.from(hipsTrack.values).filter((_, i) => i % 3 === 1);
        if (/getting-up|army-crawl|vehicle|walk-forward/.test(entry.id)) ranges.push({ id: entry.id, min: Math.min(...heights), max: Math.max(...heights) });
        played++;
      }
      window.fabChecks = { THREE, lara, gallery };
      return { played, retargets: played * 2, ranges, exclusions: report.excluded.length };
    }, { report, sample: process.argv.includes('--sample') || process.argv.includes('--motions-only') });
    assert.equal(result.played, report.imported.length);
    console.log('FAB_CHECK', JSON.stringify(result));
    await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
    await page.evaluate(() => {
      const { THREE, lara, gallery } = window.fabChecks;
      document.body.innerHTML = ''; document.body.style.margin = '0';
      const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
      renderer.setSize(1600, 1000); renderer.setClearColor(0xe8edf2); renderer.setScissorTest(true);
      document.body.appendChild(renderer.domElement);
      const scene = new THREE.Scene(); scene.add(lara.target);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 3));
      const light = new THREE.DirectionalLight(0xffffff, 3); light.position.set(300, 500, 400); scene.add(light);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(1500, 1500), new THREE.MeshStandardMaterial({ color: 0xc4d0dc }));
      floor.rotation.x = -Math.PI / 2; scene.add(floor);
      const columns = 4, rows = Math.ceil(gallery.length / columns), width = 1600 / columns, height = 1000 / rows;
      const camera = new THREE.PerspectiveCamera(42, width / height, 1, 10000);
      for (const [index, item] of gallery.entries()) {
        lara.reset();
        const mixer = new THREE.AnimationMixer(lara.target); mixer.clipAction(item.clip).play(); mixer.setTime(item.duration * 0.5);
        lara.target.updateMatrixWorld(true); lara.target.traverse(o => { if (o.isSkinnedMesh) o.skeleton.update(); });
        const hips = lara.parts.bones.hips.getWorldPosition(new THREE.Vector3());
        const look = new THREE.Vector3(hips.x, 85, hips.z);
        camera.position.copy(look).add(new THREE.Vector3(230, 120, 330)); camera.lookAt(look);
        const x = index % columns * width, y = (rows - 1 - Math.floor(index / columns)) * height;
        renderer.setViewport(x, y, width, height); renderer.setScissor(x, y, width, height); renderer.render(scene, camera);
        const label = document.createElement('div'); label.textContent = item.id;
        Object.assign(label.style, { position: 'absolute', left: `${x + 8}px`, top: `${1000 - y - height + 8}px`, width: `${width - 16}px`, font: '12px sans-serif', color: '#172b40' });
        document.body.appendChild(label);
        mixer.stopAllAction(); mixer.uncacheRoot(lara.target);
      }
    });
    await page.screenshot({ path: '/tmp/room-fab-animation-review.png' });
    if (!process.argv.includes('--sample') && !process.argv.includes('--motions-only')) {
      await page.evaluate(async () => {
        const { Character } = await import('/src/features/scene/character/Character.tsx');
        const { default: React } = await import('/node_modules/.vite/deps/react.js');
        const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js');
        const { Canvas, useFrame } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
        const { useGLTF } = await import('/node_modules/.vite/deps/@react-three_drei.js');
        const { NavigationEnabledContext } = await import('/src/features/scene/ai/navigation/NavigationContext.ts');
        const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
        const { useAnimPreviewStore } = await import('/src/features/inventory/useAnimPreviewStore.ts');
        useGLTF.setDecoderPath('/draco/');
        useSceneStore.setState(state => ({ layers: { ...state.layers, accessories: false, laraPistols: false } }));
        useAnimPreviewStore.setState({ isPlaying: true, speed: 1, currentTime: 0 });
        window.fabMounted = { handVisible: -1 };
        function Observer() {
          useFrame(({ scene, gl, camera }) => {
            let handVisible = 0, holsterVisible = 0, finite = true;
            scene.traverse(o => {
              if (o.isMesh && o.name.toLowerCase().includes('handgun')) {
                if (o.name.toLowerCase().includes('holster')) holsterVisible += Number(o.visible);
                else handVisible += Number(o.visible);
              }
              if (o.isBone) finite &&= o.matrixWorld.elements.every(Number.isFinite);
            });
            gl.render(scene, camera);
            window.fabMounted = { handVisible, holsterVisible, finite,
              preferences: { accessories: useSceneStore.getState().layers.accessories, pistols: useSceneStore.getState().layers.laraPistols } };
          }, 1);
          return null;
        }
        function Preview() {
          const [animation, setAnimation] = React.useState('fab-actorcore-dual-gun-muzdn-mov-cool-shoot-279383');
          window.setFabAnimation = setAnimation;
          return React.createElement(Canvas, { camera: { position: [250, 150, 350], near: 1, far: 10000 } },
            React.createElement('ambientLight', { intensity: 2 }),
            React.createElement(NavigationEnabledContext.Provider, { value: false },
              React.createElement(React.Suspense, { fallback: null }, React.createElement(Character, {
                id: 'native', name: 'Fab Equipment Test', modelPath: '/characters/lara/lara_native.glb',
                isLara: true, isActive: false, isPreview: true, targetHeight: 173.4, characterAnim: animation,
              }))),
            React.createElement(Observer));
        }
        document.body.innerHTML = '<div id="fab-root" style="width:100vw;height:100vh"></div>';
        window.fabReactRoot = createRoot(document.getElementById('fab-root'));
        window.fabReactRoot.render(React.createElement(Preview));
      });
      await page.waitForFunction(() => window.fabMounted.handVisible >= 2, { timeout: 60000 });
      const first = await page.evaluate(() => window.fabMounted);
      assert.deepEqual(first.preferences, { accessories: false, pistols: false });
      assert.equal(first.holsterVisible, 0);
      assert(first.finite);
      for (const animation of ['fab-solo-bboombboom-momoland-quinn-edit', 'idle', 't-pose']) {
        await page.evaluate(animation => window.setFabAnimation(animation), animation);
        await page.waitForFunction(() => window.fabMounted.handVisible === 0, { timeout: 30000 });
        assert.deepEqual(await page.evaluate(() => window.fabMounted.preferences), first.preferences);
      }
      await page.evaluate(() => window.setFabAnimation('fab-actorcore-dual-gun-muzdn-end-pose-279349'));
      await page.waitForFunction(() => window.fabMounted.handVisible >= 2, { timeout: 30000 });
      await page.evaluate(() => window.setFabAnimation('idle'));
      await page.waitForFunction(() => window.fabMounted.handVisible === 0, { timeout: 30000 });
      await page.evaluate(() => window.fabReactRoot.unmount());
      console.log('FAB_MOUNTED_EQUIPMENT passed: ActorCore → dance → idle → T-pose → ActorCore → idle; preferences unchanged');
      for (const script of ['scripts/temp_anim_selector_check.cjs', 'scripts/check-animation-sources.cjs']) {
        await new Promise((resolve, reject) => {
          const test = spawn(process.execPath, [script], { env: { ...process.env, ROOM_TEST_URL: 'http://127.0.0.1:5192' }, stdio: 'inherit' });
          test.on('error', reject);
          test.on('exit', code => code === 0 ? resolve() : reject(Error(`${script} exited ${code}`)));
        });
      }
    }
  } finally { try { await browser?.close(); } finally { server.kill(); } }
}

if (!process.argv.includes('--inspect')) checkMotions().catch(error => { console.error(error); process.exitCode = 1; });
