const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');

async function main() {
  const files = fs.readdirSync(path.resolve(__dirname, '../public/animations/npz/yoga')).filter(f => f.endsWith('.glb'));
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5176'}/AGENTS.md`);
    const result = await page.evaluate(async files => {
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => type => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const { ANIMATION_DEFINITIONS } = await import('/src/features/scene/animations/animationRegistry.ts');
      const { getFilteredAnimOptions } = await import('/src/features/scene/CharacterAnimSelector.tsx');
      const { resolveAnimationPath } = await import('/src/features/scene/animations/animationResolver.ts');
      const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
      const THREE = await import('/node_modules/.vite/deps/three.js');
      const { AnimationMixer } = THREE;
      const { DRACOLoader } = await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
      const { MeshoptDecoder } = await import('/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js');
      const { extractCharacterParts, applyClothingAndAccessoriesVisibility } = await import('/src/features/scene/characterParts.ts');
      const { retargetClip, resolveTargetBoneName } = await import('/src/features/scene/retargeting/index.ts');
      const defs = ANIMATION_DEFINITIONS.filter(d => d.category === 'yoga');
      const options = getFilteredAnimOptions('', ['yoga']);
      function check(condition, message) { if (!condition) throw Error(message); }
      check(new Set(ANIMATION_DEFINITIONS.map(d => d.id)).size === ANIMATION_DEFINITIONS.length, 'Duplicate ID');
      check(defs.length === files.length && options.length === files.length, `Incomplete yoga selector: ${defs.length} definitions, ${options.length} options, ${files.length} files. Missing: ${files.filter(f => !defs.some(d => d.path.endsWith('/' + f))).join(', ')}`);
      const loader = new GLTFLoader();
      loader.setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));
      loader.setMeshoptDecoder(MeshoptDecoder);
      const reference = await loader.loadAsync('/animations/npz/yoga/anim_yoga_akarna_dhanurasana_a.glb');
      const referenceBones = new Map();
      reference.scene.traverse(o => { if (o.isBone) referenceBones.set(o.name, o); });
      const target = (await loader.loadAsync('/characters/lara/lara_native.glb')).scene;
      target.updateMatrixWorld(true);
      const parts = extractCharacterParts(target);
      const hipsName = resolveTargetBoneName(target, 'Hips');
      check(hipsName, 'Missing Lara hips');
      applyClothingAndAccessoriesVisibility(parts, { laraShoes: true, laraNude: false, laraTopOff: false, laraBottomOff: false, showAccessories: false, laraPistols: false, equipment: { holster: false, pistols: false, backpack: false } });
      const restBones = [];
      target.traverse(o => { if (o.isBone) restBones.push([o, o.position.clone(), o.quaternion.clone(), o.scale.clone()]); });
      function resetTarget() {
        for (const [bone, position, quaternion, scale] of restBones) {
          bone.position.copy(position); bone.quaternion.copy(quaternion); bone.scale.copy(scale);
        }
        target.updateMatrixWorld(true);
      }
      const variants = new Map();
      let played = 0;
      for (const filename of files) {
        const def = defs.find(d => d.path === `animations/npz/yoga/${filename}`);
        check(def && options.some(o => o.value === def.id), `Missing option: ${filename}`);
        check(resolveAnimationPath(def.id) === def.path, `Unresolved variant: ${filename}`);
        if (!/_[b-z]\.glb$/.test(filename)) continue;
        check(def.label.includes(`— ${filename.at(-5).toUpperCase()} (`), `Missing letter: ${filename}`);
        const gltf = await loader.loadAsync(`/${def.path}`);
        const bones = [];
        gltf.scene.traverse(o => { if (o.isBone) bones.push(o); });
        check(bones.length === referenceBones.size, `Uncalibrated skeleton: ${filename}`);
        for (const bone of bones) {
          const ref = referenceBones.get(bone.name);
          check(ref && bone.position.distanceTo(ref.position) < 1e-4 && bone.quaternion.clone().normalize().angleTo(ref.quaternion.clone().normalize()) < 1e-4 && bone.scale.distanceTo(ref.scale) < 1e-4, `Incorrect rest basis: ${filename}, ${bone.name}`);
        }
        check(gltf.animations.length > 0, `Missing clip: ${filename}`);
        const clip = gltf.animations[0];
        check(Math.abs(clip.duration - def.duration) <= 0.051, `Incorrect duration: ${filename}`);
        const mixer = new AnimationMixer(gltf.scene);
        mixer.clipAction(clip).play();
        for (const fraction of [0, 0.5, 1]) {
          mixer.setTime(clip.duration * fraction);
          gltf.scene.updateMatrixWorld(true);
          gltf.scene.traverse(o => check(o.matrixWorld.elements.every(Number.isFinite), `Invalid transform: ${filename}`));
        }
        mixer.stopAllAction();
        mixer.uncacheRoot(gltf.scene);
        // Exercise the application's actual retargeter on Lara, including hips translation.
        resetTarget();
        const retargeted = retargetClip(clip, target, gltf.scene);
        check(retargeted.tracks.some(t => t.name === `${hipsName}.position`), `Missing retargeted hips: ${filename}`);
        const targetMixer = new AnimationMixer(target);
        targetMixer.clipAction(retargeted).play();
        for (const fraction of [0, 0.5, 0.9]) {
          targetMixer.setTime(clip.duration * fraction);
          target.updateMatrixWorld(true);
          target.traverse(o => check(o.matrixWorld.elements.every(Number.isFinite), `Invalid Lara transform: ${filename}`));
          for (const [bone, position] of restBones) {
            if (bone.name !== hipsName) check(bone.position.distanceTo(position) < 1e-5, `Changed limb length: ${filename}, ${bone.name}`);
          }
        }
        targetMixer.stopAllAction();
        targetMixer.uncacheRoot(target);
        variants.set(filename, retargeted);
        played++;
      }
      window.yogaChecks = { THREE, target, variants, resetTarget, hipsName };
      return { yogaOptions: options.length, variantsPlayed: played };
    }, files);
    assert.equal(result.variantsPlayed, 45);
    console.log('Yoga selector, calibrated skeleton and Lara retargeting passed:', result);
    await page.setViewport({ width: 1500, height: 900, deviceScaleFactor: 1 });
    await page.evaluate(() => {
      const { THREE, target, variants, resetTarget, hipsName } = window.yogaChecks;
      const filenames = [
        'anim_yoga_boat_pose_or_paripurna_navasana_b.glb',
        'anim_yoga_bound_angle_pose_or_baddha_konasana_g.glb',
        'anim_yoga_bridge_pose_or_setu_bandha_sarvangasana_b.glb',
        'anim_yoga_camel_pose_or_ustrasana_b.glb',
        'anim_yoga_downward_facing_dog_pose_or_adho_mukha_svanasana_b.glb',
        'anim_yoga_extended_revolved_side_angle_pose_or_utthita_parsvakonasana_e.glb',
      ];
      document.body.innerHTML = '';
      document.body.style.margin = '0';
      const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
      renderer.setSize(1500, 900); renderer.setClearColor(0xe8edf2);
      document.body.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 3));
      const light = new THREE.DirectionalLight(0xffffff, 3); light.position.set(3, 5, 4); scene.add(light);
      scene.add(target);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshStandardMaterial({ color: 0xc4d0dc }));
      floor.rotation.x = -Math.PI / 2; scene.add(floor);
      const camera = new THREE.PerspectiveCamera(38, 500 / 450, 0.01, 100);
      renderer.setScissorTest(true);
      for (const [index, filename] of filenames.entries()) {
        resetTarget();
        const clip = variants.get(filename);
        const mixer = new THREE.AnimationMixer(target); mixer.clipAction(clip).play(); mixer.setTime(clip.duration / 2);
        target.updateMatrixWorld(true); target.traverse(o => { if (o.isSkinnedMesh) o.skeleton.update(); });
        const pelvis = target.getObjectByName(hipsName).getWorldPosition(new THREE.Vector3());
        const lookAt = new THREE.Vector3(pelvis.x, 0.65, pelvis.z);
        camera.position.copy(lookAt).add(new THREE.Vector3(2.4, 1.4, 3.5)); camera.lookAt(lookAt);
        const x = index % 3 * 500, y = (1 - Math.floor(index / 3)) * 450;
        renderer.setViewport(x, y, 500, 450); renderer.setScissor(x, y, 500, 450); renderer.render(scene, camera);
        const label = document.createElement('div'); label.textContent = filename.replace('anim_yoga_', '').replace('.glb', '').replaceAll('_', ' ');
        Object.assign(label.style, { position: 'absolute', left: `${x + 10}px`, top: `${900 - y - 450 + 10}px`, width: '480px', font: '15px sans-serif', color: '#172b40' });
        document.body.appendChild(label);
        mixer.stopAllAction(); mixer.uncacheRoot(target);
      }
    });
    await page.screenshot({ path: '/tmp/room-yoga-variants-corrected.png' });
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
