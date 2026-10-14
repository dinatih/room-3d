const launchBrowser = require('./browser-test-options.cjs');
/** Compare NPZ reference motion with actual exported and retargeted GLB motion.
 * python3 scripts/check_interx_pipeline.py --reference /tmp/interx-motion-reference.json
 * node scripts/check_interx_motion.cjs
 * Add --browser for visual captures of both published duos in the inventory.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const esbuild = require('esbuild');
const root = path.resolve(__dirname, '..');

async function main() {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  global.ProgressEvent = class { constructor(type, details) { Object.assign(this, { type }, details); } };
  const bundle = '/tmp/interx-motion-check-module.mjs';
  await esbuild.build({
    stdin: { contents: `
      export {retargetClip} from './src/features/scene/retargeting/retargetClip';
      export {resolveTargetBoneName} from './src/features/scene/retargeting/boneResolver';
      export {INTERX_DUO_ANIMATIONS, INTERX_ANIMATION_DEFINITIONS} from './src/features/scene/animations/interxManifest';
      export {computeWorldTransform} from './src/features/scene/animations/duoWorldTransform';
      export {groundInterxClip, interxSoleHeight} from './src/features/scene/retargeting/groundInterxClip';
    `, resolveDir: root },
    bundle: true, platform: 'node', format: 'esm', outfile: bundle,
  });
  const { retargetClip, resolveTargetBoneName, INTERX_DUO_ANIMATIONS, INTERX_ANIMATION_DEFINITIONS, computeWorldTransform, groundInterxClip, interxSoleHeight } = await import(pathToFileURL(bundle));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/animations/npz/interx/animations_manifest.json')));
  const reference = JSON.parse(fs.readFileSync('/tmp/interx-motion-reference.json'));
  const smplx = process.argv.includes('--smplx') ? JSON.parse(fs.readFileSync('/tmp/interx-smplx-reference.json')) : undefined;
  const smplxReport = smplx ? JSON.parse(fs.readFileSync('/tmp/interx-smplx-report.json')) : undefined;
  const comparisons = [];
  const { NodeIO } = await import('@gltf-transform/core');
  const { ALL_EXTENSIONS } = await import('@gltf-transform/extensions');
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.decoder': await require('draco3d').createDecoderModule() });
  const decoded = new Map();
  async function loadSkeleton(file, keepMeshes = false) {
    if (keepMeshes && !decoded.has(file)) {
      const document = await io.read(file);
      document.getRoot().listExtensionsUsed().filter(extension => extension.extensionName === 'KHR_draco_mesh_compression').forEach(extension => extension.dispose());
      decoded.set(file, Buffer.from(await io.writeBinary(document)));
    }
    const bytes = keepMeshes ? decoded.get(file) : fs.readFileSync(file);
    const jsonLength = bytes.readUInt32LE(12);
    const json = JSON.parse(bytes.subarray(20, 20 + jsonLength));
    const binStart = 20 + jsonLength;
    const bin = bytes.subarray(binStart + 8, binStart + 8 + bytes.readUInt32LE(binStart));
    json.buffers[0].uri = 'data:application/octet-stream;base64,' + bin.toString('base64');
    if (!keepMeshes) for (const node of json.nodes) { delete node.mesh; delete node.skin; }
    if (!keepMeshes) delete json.meshes;
    for (const mesh of json.meshes || []) for (const primitive of mesh.primitives) delete primitive.material;
    for (const key of ['textures', 'images', 'materials', 'extensionsRequired', 'extensionsUsed']) delete json[key];
    return new GLTFLoader().parseAsync(JSON.stringify(json), '');
  }
  function near(actual, expected, message, tolerance = 0.0001) {
    assert(actual.distanceTo(expected) < tolerance, `${message}: actual=${actual.toArray()}, expected=${expected.toArray()}`);
  }
  let worstError = 0;
  let worstWristError = 0;
  let largestShoulderMove = 0;
  for (const entry of manifest.duos) {
    const def = INTERX_DUO_ANIMATIONS.find(duo => duo.id === entry.id);
    const ref = reference.find(item => item.id === entry.id);
    const sourceBody = smplx?.find(item => item.id === entry.id);
    const sourceReport = smplxReport?.duos.find(item => item.id === entry.id);
    if (smplx) assert(sourceBody && sourceReport, `Missing reconstructed source pair: ${entry.id}`);
    assert(def && ref);
    assert.equal(def.rotB, 0);
    const initialOffset = new THREE.Vector3(...entry.start_offset).multiplyScalar(100);
    const grounded = entry.placement?.verticalOrigin === 'soles-preserve-hands';
    near(new THREE.Vector3(...def.offsetB), initialOffset, 'Manifest placement offset');
    for (const scale of [75, 100, 150]) {
      const participants = [];
      for (const person of ['p1', 'p2']) {
        const source = await loadSkeleton(path.join(root, 'public', entry.clips[person].path));
        if (process.argv.includes('--inspect') && scale === 75) {
          source.scene.updateMatrixWorld(true);
          const sourceHips = source.scene.getObjectByName(resolveTargetBoneName(source.scene, 'Hips'));
          console.log('Source root', sourceHips.name, 'parent quaternion', sourceHips.parent.getWorldQuaternion(new THREE.Quaternion()).toArray(), 'local quaternion', sourceHips.quaternion.toArray(), 'first animated quaternion', source.animations[0].tracks.find(track => track.name.endsWith('.quaternion') && /hips/i.test(track.name)).values.slice(0, 4));
        }
        const target = await loadSkeleton(path.join(root, 'public/characters/lara/lara_native.glb'), grounded);
        target.scene.updateMatrixWorld(true);
        target.scene.traverse(object => {
          object.restWorldQuaternion = object.getWorldQuaternion(new THREE.Quaternion());
          if (object.isBone) {
            object.defaultPosition = object.position.clone();
            object.restLocalQuaternion = object.quaternion.clone();
          }
        });
        target.scene.scale.setScalar(scale);
        target.scene.updateMatrixWorld(true);
        const hips = target.scene.getObjectByName(resolveTargetBoneName(target.scene, 'Hips'));
        const head = target.scene.getObjectByName(resolveTargetBoneName(target.scene, 'Head'));
        const feet = ['LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase'].map(name => target.scene.getObjectByName(resolveTargetBoneName(target.scene, name)));
        const hands = ['LeftHand', 'RightHand'].map(name => target.scene.getObjectByName(resolveTargetBoneName(target.scene, name)));
        const shoulders = ['LeftArm', 'RightArm'].map(name => target.scene.getObjectByName(resolveTargetBoneName(target.scene, name)));
        const shoulderRestPositions = shoulders.map(joint => joint.position.clone());
        const baseline = hips.getWorldPosition(new THREE.Vector3());
        const clipDef = INTERX_ANIMATION_DEFINITIONS.find(item => item.id === `${entry.id}-${person}`);
        let clip = retargetClip(source.animations[0], target.scene, source.scene, clipDef.rootMotionSpace);
        const originalHands = [];
        let correctionY = 0;
        if (grounded) {
          const originalMixer = new THREE.AnimationMixer(target.scene);
          const originalAction = originalMixer.clipAction(clip).setLoop(THREE.LoopOnce, 1).play();
          originalAction.clampWhenFinished = true;
          originalMixer.setTime(0);
          correctionY = -(clipDef.interxGrounding.baseHeightMeters * 100 + interxSoleHeight(target.scene));
          for (let frame = 0; frame < entry.clips[person].frameCount; frame++) {
            originalMixer.setTime(frame / 30);
            target.scene.updateMatrixWorld(true);
            originalHands.push(hands.map(hand => ({ position: hand.getWorldPosition(new THREE.Vector3()), quaternion: hand.getWorldQuaternion(new THREE.Quaternion()) })));
          }
          originalMixer.stopAllAction();
          originalMixer.uncacheRoot(target.scene);
          // Baking a new clip while the instance is already posed must neither
          // inherit that pose nor change the live instance on completion.
          shoulders[0].position.x += 0.01;
          const liveTransforms = [];
          target.scene.traverse(object => liveTransforms.push({ object, position: object.position.clone(), quaternion: object.quaternion.clone(), scale: object.scale.clone() }));
          clip = groundInterxClip(clip, target.scene, clipDef.interxGrounding.baseHeightMeters);
          liveTransforms.forEach(saved => {
            assert(saved.object.position.equals(saved.position) && saved.object.quaternion.equals(saved.quaternion) && saved.object.scale.equals(saved.scale), 'Baking must restore the live pose');
          });
          shoulders[0].position.copy(shoulderRestPositions[0]);
          baseline.y += correctionY;
        }
        const mixer = new THREE.AnimationMixer(target.scene);
        mixer.clipAction(clip).setLoop(THREE.LoopOnce, 1).play().clampWhenFinished = true;
        participants.push({ target, hips, head, feet, hands, shoulders, shoulderRestPositions, baseline, mixer, originalHands, correctionY });
      }
      for (let frame = 0; frame < entry.clips.p1.frameCount; frame++) {
        const displacements = participants.map((participant, index) => {
          participant.mixer.setTime(frame / 30);
          participant.target.scene.updateMatrixWorld(true);
          const actual = participant.hips.getWorldPosition(new THREE.Vector3()).sub(participant.baseline);
          if (grounded) {
            if (frame === 0) assert(Math.abs(interxSoleHeight(participant.target.scene) + (index ? initialOffset.y : 0)) < 0.0001, 'Initial soles must meet the shared floor');
            participant.hands.forEach((hand, side) => {
              worstWristError = Math.max(worstWristError, hand.getWorldPosition(new THREE.Vector3()).distanceTo(participant.originalHands[frame][side].position));
              near(hand.getWorldPosition(new THREE.Vector3()), participant.originalHands[frame][side].position, `${entry.id}: wrist target ${index}/${side}/${frame}`, 0.001);
              assert(hand.getWorldQuaternion(new THREE.Quaternion()).normalize().angleTo(participant.originalHands[frame][side].quaternion.clone().normalize()) < 0.0002, 'Wrist orientation must be preserved');
            });
            participant.shoulders.forEach((joint, side) => {
              const movement = joint.position.clone().sub(participant.shoulderRestPositions[side])
                .applyMatrix3(new THREE.Matrix3().setFromMatrix4(joint.parent.matrixWorld)).length();
              if (scale === 100) largestShoulderMove = Math.max(largestShoulderMove, movement);
            });
          }
          const motion = ref.participants[index];
          const expected = new THREE.Vector3(...motion.trans[frame]).sub(new THREE.Vector3(...motion.trans[0])).multiplyScalar(100);
          worstError = Math.max(worstError, actual.distanceTo(expected));
          near(actual, expected, `${entry.id} P${index + 1} scale=${scale} frame=${frame}`);
          const up = participant.head.getWorldPosition(new THREE.Vector3()).sub(participant.hips.getWorldPosition(new THREE.Vector3())).normalize();
          assert(up.y > Math.hypot(up.x, up.z), `${entry.id}: torso lies down at frame ${frame}`);
          const angle = new THREE.Vector3(...motion.root[frame]).length();
          const expectedRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...motion.root[frame]).normalize(), angle)
            .multiply(participant.hips.restWorldQuaternion);
          const actualRotation = participant.hips.getWorldQuaternion(new THREE.Quaternion());
          assert(actualRotation.angleTo(expectedRotation) < 0.0002, `${entry.id}: root orientation not preserved at frame ${frame}; actual=${actualRotation.toArray()}, expected=${expectedRotation.toArray()}, rest=${participant.hips.restWorldQuaternion.toArray()}`);
          return actual;
        });
        const expectedRelative = new THREE.Vector3(...ref.participants[1].trans[frame]).sub(new THREE.Vector3(...ref.participants[0].trans[frame])).multiplyScalar(100);
        if (sourceBody && scale === 100 && frame === sourceReport.closestWrists.frame30fps) {
          const sideA = sourceReport.closestWrists.p1Side === 'left' ? 0 : 1;
          const sideB = sourceReport.closestWrists.p2Side === 'left' ? 0 : 1;
          const rawDelta = new THREE.Vector3(...sourceBody.participants[1].wrists[frame][sideB])
            .sub(new THREE.Vector3(...sourceBody.participants[0].wrists[frame][sideA])).multiplyScalar(100);
          const targetDelta = participants[1].hands[sideB].getWorldPosition(new THREE.Vector3()).add(initialOffset)
            .sub(participants[0].hands[sideA].getWorldPosition(new THREE.Vector3()));
          const comparison = { id: entry.id, frame, sourceWristDeltaCm: rawDelta.toArray(), avatarWristDeltaCm: targetDelta.toArray(),
            sourceWristDistanceCm: rawDelta.length(), avatarWristDistanceCm: targetDelta.length(), vectorDifferenceCm: rawDelta.distanceTo(targetDelta),
            initialSourceSoleGapCm: sourceReport.participants[1].initialSoleYCm - sourceReport.participants[0].initialSoleYCm };
          comparisons.push(comparison);
          console.log('SMPL-X comparison:', JSON.stringify(comparison));
        }
        expectedRelative.y += participants[1].correctionY - participants[0].correctionY;
        if (process.argv.includes('--feet') && scale === 100 && [0, 59, 100].includes(frame)) {
          console.log(entry.id, frame, JSON.stringify(participants.map((participant, index) => ({
            hips: participant.hips.getWorldPosition(new THREE.Vector3()).toArray(),
            feet: participant.feet.map(bone => bone.getWorldPosition(new THREE.Vector3()).toArray()),
            hands: participant.hands.map(bone => bone.getWorldPosition(new THREE.Vector3()).add(index ? initialOffset : new THREE.Vector3()).toArray()),
          }))));
        }
        const placedDisplacements = displacements.map((value, index) => value.clone().add(new THREE.Vector3(0, participants[index].correctionY, 0)));
        const relative = new THREE.Vector3(...def.offsetB).add(placedDisplacements[1]).sub(placedDisplacements[0]);
        near(relative, expectedRelative, `${entry.id} paired motion frame=${frame}`);
        for (const rotation of [0, Math.PI / 2]) {
          const anchor = [123, 20, -456];
          const transforms = computeWorldTransform(anchor, rotation, def.offsetB, def.rotB);
          const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation);
          near(new THREE.Vector3(...transforms.posB).sub(new THREE.Vector3(...transforms.posA)), new THREE.Vector3(...def.offsetB).applyQuaternion(q), 'Session anchor start offset');
          const delta = new THREE.Vector3(...transforms.posB).add(placedDisplacements[1].clone().applyQuaternion(q))
            .sub(new THREE.Vector3(...transforms.posA).add(placedDisplacements[0].clone().applyQuaternion(q)));
          near(delta, expectedRelative.clone().applyQuaternion(q), 'Translated/rotated session motion');
        }
      }
    }
    console.log(`${entry.id}: initial soles grounded, original wrists preserved at every frame; metric motion and headings retained; scales 75/100/150, anchors 0°/90°.`);
  }
  console.log(`Maximum root displacement error: ${worstError.toFixed(8)} cm`);
  console.log(`Maximum wrist error: ${worstWristError.toFixed(8)} cm; maximum shoulder adjustment at native height: ${largestShoulderMove.toFixed(4)} cm`);
  if (smplx) fs.writeFileSync('/tmp/interx-smplx-avatar-comparison.json', JSON.stringify(comparisons, null, 2) + '\n');
  if (process.argv.includes('--browser')) await visualCheck();
}

async function visualCheck() {
  // The visual capture uses the app's inventory and actual character renderer.
  const browser = await launchBrowser({ headless: true, args: ['--no-sandbox'], defaultViewport: { width: 1400, height: 1000 } });
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => console.error('Browser page error:', error.message));
    page.on('console', message => { if (message.type() === 'error') console.error('Browser:', message.text()); });
    await page.goto((process.env.ROOM_TEST_URL || 'http://127.0.0.1:5173') + '/AGENTS.md', { waitUntil: 'domcontentloaded' });
    for (const [recording, label] of [['g001t000a000r000', 'Câlin'], ['g001t000a001r005', 'Poignée']]) {
    await page.evaluate(async recording => {
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const { default: React } = await import('/node_modules/.vite/deps/react.js');
      const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js');
      const { InventoryPreview } = await import('/src/features/inventory/InventoryPreview.tsx');
      const { INVENTORY } = await import('/src/features/inventory/inventoryData.ts');
      const { DUO_ANIMATIONS } = await import('/src/features/scene/animations/duoAnimations.ts');
      const { useAnimPreviewStore } = await import('/src/features/inventory/useAnimPreviewStore.ts');
      window.interxPreview = useAnimPreviewStore;
      useAnimPreviewStore.setState({ isPlaying: false, currentTime: 0, lockHipsXZ: false });
      document.body.innerHTML = '<div id="root"></div>';
      document.body.style.margin = '0';
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = '/node_modules/bootstrap/dist/css/bootstrap.min.css';
      document.head.append(css);
      await import('/src/features/scene/ViewControlBar.scss');
      const item = INVENTORY.find(item => item.id === 'native');
      const duo = DUO_ANIMATIONS.find(duo => duo.id === `interx-${recording}`);
      if (!item || !duo) throw new Error('Pilot character or duo is absent from the catalog');
      window.interxRoot?.unmount();
      window.interxRoot = createRoot(document.getElementById('root'));
      window.interxRoot.render(React.createElement(InventoryPreview, {
        item, height: '950px', initialDuoAnim: duo, initialDuoPartner: 'rosanna',
      }));
    }, recording);
    await page.waitForFunction(label => window.interxPreview.getState().clipName.includes(label) && window.interxPreview.getState().duration > 0, { timeout: 45000 }, label).catch(async error => {
      console.log('Preview state:', await page.evaluate(() => ({ state: window.interxPreview?.getState(), text: document.body.innerText.slice(-1800), canvases: document.querySelectorAll('canvas').length })));
      await page.screenshot({ path: '/tmp/interx-pilot-failure.png' });
      throw error;
    });
    await page.evaluate(() => {
      window.interxPreview.getState().pause();
      window.interxPreview.getState().setLockHipsXZ(false);
      const rotate = [...document.querySelectorAll('button')].find(button => button.textContent.includes('Rota'));
      if (rotate && rotate.classList.contains('btn-warning')) rotate.click();
    });
    for (const [label, time] of [['start', 0], ['contact', recording.includes('a001') ? 59 / 30 : 3.5]]) {
      await page.evaluate(time => window.interxPreview.getState().seekToTime(time), time);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.screenshot({ path: `/tmp/interx-${recording}-${label}.png` });
    }
    console.log(`Inventory ${recording} rendered at frame zero and contact.`);
    }
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
