const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const THREE = require('three');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const transpile = file => ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const definitions = {};
vm.runInNewContext(transpile('src/features/scene/aircraftModels.ts'), { exports: definitions, Math });
assert.equal(definitions.AIRCRAFT_MODELS[0].key, 'koi-fish');
assert.equal(definitions.DEFAULT_PLANE_MODEL, 'koi-fish');
assert(!definitions.AIRCRAFT_MODELS.some(entry => ['paper', 'paper-glb', 'a380'].includes(entry.key)));
// Tester les géométries et clips locaux sans décodage d'images/WebGL.
global.self = global;
THREE.TextureLoader.prototype.load = function (_, onLoad) { const texture = new THREE.Texture(); queueMicrotask(() => onLoad(texture)); return texture; };
(async () => {
  const esmThree = await import('three');
  esmThree.TextureLoader.prototype.load = THREE.TextureLoader.prototype.load;
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { clone } = await import('three/addons/utils/SkeletonUtils.js');
  const loader = new GLTFLoader();
  const { NodeIO } = await import('@gltf-transform/core');
  const { ALL_EXTENSIONS } = await import('@gltf-transform/extensions');
  const draco = require('draco3d');
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.decoder': await draco.createDecoderModule() });
  let origami;
  let comet;
  let koi;
  for (const definition of definitions.AIRCRAFT_MODELS.filter(entry => entry.path.startsWith('/items/aircraft/') || entry.key === 'comet')) {
    const file = path.join(root, 'public', definition.path);
    let bytes = fs.readFileSync(file);
    if (definition.key === 'comet') {
      const document = await io.read(file);
      document.getRoot().listExtensionsUsed().filter(extension => extension.extensionName === 'KHR_draco_mesh_compression').forEach(extension => extension.dispose());
      bytes = Buffer.from(await io.writeBinary(document));
    }
    const gltf = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
    const scene = clone(gltf.scene);
    const mixer = new THREE.AnimationMixer(scene);
    if (definition.key === 'koi-fish') {
      koi = gltf;
      assert(gltf.animations.length > 0, 'Koï conserve son animation');
      assert(!scene.getObjectByName('Sphere'), 'Le ciel de présentation est exclu');
      assert(gltf.parser.json.images?.length > 0, 'La texture Koï est embarquée');
    }
    if (definition.key === 'comet') {
      comet = gltf;
    }
    if (definition.key === 'origami') {
      assert(gltf.animations.some(clip => clip.tracks.some(track => track.name.includes('morphTargetInfluences'))), 'origami retains folding morphs');
      const action = mixer.clipAction(gltf.animations[0]);
      action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.play(); mixer.setTime(action.getClip().duration);
      origami = gltf;
    }
    scene.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(scene, true);
    assert(!bounds.isEmpty(), `${definition.key} contains geometry`);
    const size = bounds.getSize(new THREE.Vector3());
    assert(size.toArray().every(Number.isFinite));
    if (definition.key === 'delorean') {
      scene.traverse(object => {
        if (object.isMesh && object.material.name === 'red_glas') {
          const rear = new THREE.Box3().setFromObject(object, true).getCenter(new THREE.Vector3()).sub(bounds.getCenter(new THREE.Vector3()));
          rear.applyAxisAngle(new THREE.Vector3(0, 1, 0), definition.yaw);
          assert(rear.z > 0, 'DeLorean rear lights face backward in flight coordinates');
        }
      });
    }
    console.log(definition.key, 'size', size.toArray().map(v => v.toFixed(3)).join(' × '), 'clips', gltf.animations.map(clip => `${clip.name}: ${clip.duration.toFixed(2)}s`).join(', '));
  }
  // Exercer le composant réel : pliage/départ une fois, puis callback de mise en vol.
  const effects = [];
  let frame;
  const state = { planeLaunching: false, planeLaunched: false };
  let activeAsset = origami;
  const exported = {};
  vm.runInNewContext(transpile('src/features/scene/AircraftMesh.tsx'), { exports: exported, require(name) {
    if (name === 'react') return { useRef: value => ({ current: value }), useMemo: fn => fn(), useEffect: fn => effects.push(fn) };
    if (name === '@react-three/fiber') return { useFrame: fn => { frame = fn; } };
    if (name === './useGLTFClone') return { useGLTFClone: () => ({ scene: clone(activeAsset.scene), animations: activeAsset.animations }) };
    if (name === './cameraState') return { cameraState: state };
    return require(name);
  } });
  let launches = 0;
  exported.AircraftMesh({ definition: definitions.AIRCRAFT_MODELS.find(entry => entry.key === 'origami'), onLaunchReady: () => { launches++; state.planeLaunching = false; state.planeLaunched = true; } });
  effects.forEach(fn => fn());
  frame({}, 1 / 60); assert.equal(launches, 0);
  state.planeLaunching = true;
  for (let i = 0; i <= Math.ceil(origami.animations[0].duration * 60) + 1; i++) frame({}, 1 / 60);
  assert.equal(launches, 0, 'pliage encore en cours après la durée originale');
  for (let i = 0; i <= Math.ceil(origami.animations[0].duration * 4 * 60) + 1; i++) frame({}, 1 / 60);
  assert.equal(launches, 1, 'launch follows completion of folding/departure exactly once');
  activeAsset = comet;
  const element = exported.AircraftMesh({ definition: definitions.AIRCRAFT_MODELS.find(entry => entry.key === 'comet') });
  const wrapper = element.props.children;
  const scene = wrapper.props.children.props.object;
  const normalized = new THREE.Group();
  normalized.position.fromArray(wrapper.props.position);
  normalized.scale.setScalar(wrapper.props.scale ?? wrapper.props.children.props.scale);
  normalized.add(scene);
  normalized.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(normalized, true).getSize(new THREE.Vector3());
  assert(Math.abs(Math.max(...size.toArray()) - 55) < 0.01, `colibri normalisé à 55 cm, obtenu ${size.toArray()}`);
  for (let i = 0; i < 120; i++) {
    frame({}, 1 / 60);
    normalized.updateMatrixWorld(true);
    const animated = new THREE.Box3().setFromObject(normalized, true).getSize(new THREE.Vector3());
    assert(Math.max(...animated.toArray()) < 110, 'animation du colibri sans agrandissement du squelette');
  }
  console.log('Colibri: taille initiale de 55 cm et échelle stable pendant son animation.');
  activeAsset = koi;
  const koiElement = exported.AircraftMesh({ definition: definitions.AIRCRAFT_MODELS.find(entry => entry.key === 'koi-fish') });
  const koiScene = koiElement.props.children.props.children.props.object;
  const before = [];
  koiScene.traverse(object => { if (object.isBone) before.push(object.quaternion.clone()); });
  frame({}, 0.25);
  let boneIndex = 0, moved = false;
  koiScene.traverse(object => { if (object.isBone) { const changed = before[boneIndex++].angleTo(object.quaternion) > 0.001; moved ||= changed; } });
  assert(moved, 'Animation Koï jouée par AircraftMesh');
  console.log('All aircraft assets and origami launch checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
