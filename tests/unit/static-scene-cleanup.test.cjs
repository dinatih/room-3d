const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');
const jsx = require('react/jsx-runtime');
const geometryUtils = import('three/addons/utils/BufferGeometryUtils.js');
const glbUtils = async (overrides = {}) => load('src/features/scene/glbUtils.ts', {
  three: THREE, 'three/addons/utils/BufferGeometryUtils.js': { ...await geometryUtils, ...overrides },
});

async function staticGroup(source, merger = {}) {
  const target = new THREE.Group(), refs = [source, target];
  let effect;
  const { MergedStaticGroup } = load('src/features/scene/building/MergedStaticGroup.tsx', {
    three: THREE, 'react/jsx-runtime': jsx,
    react: { useRef: () => ({ current: refs.shift() }), useContext: () => null, useLayoutEffect: callback => { effect = callback; } },
    '../sceneLayer': { CategoryLayerContext: { Provider: () => null } }, '../glbUtils': await glbUtils(),
    'three/addons/utils/BufferGeometryUtils.js': { ...await geometryUtils, ...merger },
  });
  MergedStaticGroup({ children: null });
  return { target, run: () => effect() };
}

it('conserve les couleurs, UV et types d’attributs incompatibles lors des deux fusions', async () => {
  for (const staticBatch of [false, true]) {
    const root = new THREE.Group(), material = new THREE.MeshBasicMaterial();
    for (const color of [null, new Float32Array(24 * 3), new Uint8Array(24 * 3)]) {
      const geometry = new THREE.BoxGeometry();
      if (color) geometry.setAttribute('color', new THREE.BufferAttribute(color, 3, color instanceof Uint8Array));
      root.add(new THREE.Mesh(geometry, material));
    }
    let result = root, cleanup;
    if (staticBatch) {
      const batch = await staticGroup(root);
      cleanup = batch.run(); result = batch.target;
      assert(root.children.every(mesh => !mesh.visible));
    } else (await glbUtils()).mergeGlbByMaterial(root);
    assert.equal(result.children.length, 3);
    assert(result.children.every(mesh => mesh.geometry.hasAttribute('uv')));
    assert.deepEqual(result.children.map(mesh => mesh.geometry.getAttribute('color')?.array.constructor.name),
      [undefined, 'Float32Array', 'Uint8Array']);
    cleanup?.();
    if (staticBatch) assert(root.children.every(mesh => mesh.visible));
  }
});

it('fusionne encore les géométries compatibles et respecte les transformations locales', async () => {
  const root = new THREE.Group(), material = new THREE.MeshBasicMaterial();
  root.position.set(100, 200, 300);
  for (const x of [0, 10]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), material);
    mesh.position.x = x; root.add(mesh);
  }
  const batch = await staticGroup(root), cleanup = batch.run();
  assert.equal(batch.target.children.length, 1);
  assert.deepEqual(batch.target.children[0].geometry.boundingBox.min.toArray(), [-1, -1, -1]);
  assert.deepEqual(batch.target.children[0].geometry.boundingBox.max.toArray(), [11, 1, 1]);
  cleanup();
});

it('sépare les groupes de matériaux non indexés sans dupliquer les triangles', async () => {
  const root = new THREE.Group();
  const geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0, 1, 0, 0, 0, 1, 0, 10, 0, 0, 11, 0, 0, 10, 1, 0,
  ], 3));
  geometry.addGroup(0, 3, 0); geometry.addGroup(3, 3, 1);
  root.add(new THREE.Mesh(geometry, [new THREE.MeshBasicMaterial(), new THREE.MeshBasicMaterial()]));
  const batch = await staticGroup(root), cleanup = batch.run();
  assert.equal(batch.target.children.length, 2);
  assert.deepEqual(batch.target.children.map(mesh => mesh.geometry.getAttribute('position').count), [3, 3]);
  assert.deepEqual(batch.target.children.map(mesh => mesh.geometry.boundingBox.min.x), [0, 10]);
  cleanup();
});

it('signale un échec de fusion sans cacher ni effacer les originaux', async () => {
  for (const staticBatch of [false, true]) {
    const root = new THREE.Group(), mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    root.add(mesh);
    const merger = { mergeGeometries: () => null };
    if (staticBatch) assert.throws((await staticGroup(root, merger)).run, /Cannot merge static geometry/);
    if (!staticBatch) {
      const utils = await glbUtils(merger);
      assert.throws(() => utils.mergeGlbByMaterial(root), /Cannot merge GLB geometry/);
      assert.equal(root.userData.merged, undefined);
    }
    assert.deepEqual(root.children, [mesh]);
    assert.equal(mesh.visible, true);
  }
});

it('mesure et recentre un GLB de façon stable après remontage sous un parent transformé', async () => {
  const utils = await glbUtils(), scene = new THREE.Group(), parent = new THREE.Group(), effects = [], preloads = [], sizes = [];
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(2, 4, 6), new THREE.MeshBasicMaterial()));
  parent.position.set(1000, 2000, 3000); parent.scale.setScalar(3); parent.add(scene);
  const { createStaticGlbItem } = load('src/features/scene/items/createStaticGlbItem.tsx', {
    three: THREE, 'react/jsx-runtime': jsx, react: { useLayoutEffect: callback => effects.push(callback) },
    '@react-three/drei': { useGLTF: { preload: path => preloads.push(path) } },
    '../useGLTFClone': { useGLTFClone: () => ({ scene }) }, '../glbUtils': utils,
  });
  const Item = createStaticGlbItem('/example.glb');
  for (let i = 0; i < 2; i++) {
    Item({ onSize: size => sizes.push(size.toArray()) }); effects.pop()();
    assert(scene.position.equals(new THREE.Vector3(0, 200, 0)));
  }
  Item({}); effects.pop()();
  assert.deepEqual(preloads, ['/example.glb']);
  assert.deepEqual(sizes, [[200, 400, 600], [200, 400, 600]]);
});

it('conserve le sommet et les accrochages Kallax après plusieurs mesures', async () => {
  const scene = new THREE.Group(), effects = [], sizes = [];
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 6), new THREE.MeshBasicMaterial());
  mesh.position.set(1, 2, 3); scene.add(mesh);
  const { createStaticGlbItem } = load('src/features/scene/items/createStaticGlbItem.tsx', {
    three: THREE, 'react/jsx-runtime': jsx, react: { useLayoutEffect: callback => effects.push(callback) },
    '@react-three/drei': { useGLTF: { preload() {} } },
    '../useGLTFClone': { useGLTFClone: () => ({ scene }) }, '../glbUtils': await glbUtils(),
  });
  const Item = createStaticGlbItem('/kallax.glb', { origin: 'top', rotationY: Math.PI });
  let vertices;
  for (let i = 0; i < 3; i++) {
    Item({ onSize: size => sizes.push(size.toArray()) }); effects.pop()();
    assert(Math.abs(scene.position.x - 100) < 1e-8);
    assert.equal(scene.position.y, -400);
    assert(Math.abs(scene.position.z - 300) < 1e-8);
    assert.equal(scene.rotation.y, 0);
    const positions = Array.from(scene.children[0].geometry.getAttribute('position').array);
    if (vertices) assert.deepEqual(positions, vertices);
    vertices = positions;
  }
  for (const size of sizes) size.forEach((value, axis) => assert(Math.abs(value - [200, 400, 600][axis]) < 1e-8));
});

it('restaure les échelles originales après transition, interruption et démontage', () => {
  const refs = [], cleanups = [], camera = new THREE.PerspectiveCamera();
  let cursor, update, frame;
  const config = { LAYER_STRUCTURE: 0, LAYER_EQUIPMENT: 1, LAYER_FURNITURE: 2, LAYER_FURNISHINGS: 3,
    LAYER_DECOR: 4, LAYER_ANIMALS: 5, LAYER_DOORS: 6, LAYER_WALL_STRUCTURE: 7 };
  const { LayerSmokeTransition, categoryLayerRegistry } = load('src/features/scene/transitions/LayerSmokeTransition.tsx', {
    three: THREE, 'react/jsx-runtime': jsx, '@config': config, './SmokeParticles': { SmokeParticles: () => null },
    '@react-three/fiber': { useThree: () => ({ camera, invalidate() {} }), useFrame: callback => { frame = callback; } },
    react: { useRef: value => refs[cursor++] ??= { current: value }, useEffect: (callback, deps) => {
      if (deps.length) update = callback; else if (!cleanups.length) cleanups.push(callback());
    } },
  });
  const group = new THREE.Group(), object = new THREE.Object3D();
  object.scale.set(2, 3, 4); group.add(object); categoryLayerRegistry.set(config.LAYER_FURNITURE, group);
  const render = (furniture, smokeTransition = true) => {
    cursor = 0; LayerSmokeTransition({ layers: { furniture, smokeTransition } }); update();
  };
  render(true); render(false);
  refs[3].current[0].startTime = performance.now() - 1000; frame();
  assert.equal(group.visible, false);
  assert.deepEqual(object.scale.toArray(), [2, 3, 4]);
  render(true);
  assert.deepEqual(object.scale.toArray(), [.002, .003, .004]);
  render(false, false);
  assert.equal(group.visible, false);
  assert.equal(refs[3].current.length, 0);
  assert.deepEqual(object.scale.toArray(), [2, 3, 4]);
  render(true); cleanups[0]();
  assert.deepEqual(object.scale.toArray(), [2, 3, 4]);
});

it('partage le rendu miroir et restaure la scène même quand une réflexion échoue', async () => {
  const cleanups = [], state = { mirrorQuality: 'mid', layers: { mirrorsHD: false } }, reflectionCamera = new THREE.PerspectiveCamera();
  let fail = true, renders = 0;
  class Reflector extends THREE.Mesh {
    constructor(geometry) {
      super(geometry, new THREE.MeshBasicMaterial());
      this.onBeforeRender = (_, scene, camera) => {
        renders++;
        assert.equal(scene.matrixWorldAutoUpdate, false);
        camera.projectionMatrix.identity();
        if (fail) throw new Error('reflection failed');
      };
    }
    getRenderTarget() { return { width: 256 }; }
    getReflectionCamera() { return reflectionCamera; }
    dispose() {}
  }
  const { MirrorSurface, mirrorPlanesGeometry, getMirrorTargetConfig } = load('src/features/scene/building/Mirrors.tsx', {
    three: THREE, 'react/jsx-runtime': jsx, react: { useMemo: fn => fn(), useEffect: fn => cleanups.push(fn()) },
    '@react-three/fiber': {}, 'three/addons/objects/Reflector.js': { Reflector },
    'three/addons/utils/BufferGeometryUtils.js': await geometryUtils,
    '../store/useSceneStore': { useSceneStore: { getState: () => state } }, '../SkySphere': { getLoadedSkyTexture: () => null },
    '../items/NissedalMirror': {}, './MergedStaticGroup': {}, '../wallData': {}, '@config': {},
  }, source => source + '\nexport { MirrorSurface, mirrorPlanesGeometry, getMirrorTargetConfig };');
  const { GRAPHICS_PRESETS } = load('src/features/scene/store/graphicsPresets.ts', {});
  for (const [preset, resolution] of [['low', 128], ['mid-low', 128], ['mid', 256], ['high', 512]]) {
    Object.assign(state, GRAPHICS_PRESETS[preset]);
    assert.equal(getMirrorTargetConfig().res, resolution);
  }
  state.layers = { ...state.layers, mirrorsHD: false };
  assert.equal(getMirrorTargetConfig().res, 256, 'désactiver HD après High réduit réellement la résolution');
  const geometry = mirrorPlanesGeometry([{ w: 2, h: 4, x: 0, y: 0 }, { w: 2, h: 4, x: 10, y: 0 }]);
  assert.deepEqual(geometry.boundingBox.min.toArray(), [-1, -2, 0]);
  assert.deepEqual(geometry.boundingBox.max.toArray(), [11, 2, 0]);
  const mirror = MirrorSurface({ geometry, position: [1, 2, 3], rotationY: Math.PI }).props.object;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera();
  const projection = camera.projectionMatrix.clone(), mask = camera.layers.mask;
  scene.background = new THREE.Color('red');
  const background = scene.background;
  assert.throws(() => mirror.onBeforeRender(null, scene, camera), /reflection failed/);
  assert.equal(scene.background, background);
  assert.equal(scene.matrixWorldAutoUpdate, true);
  assert(camera.projectionMatrix.equals(projection));
  assert.equal(camera.layers.mask, mask);
  fail = false;
  mirror.onBeforeRender(null, scene, camera);
  assert.equal(renders, 2, 'la profondeur de réflexion doit aussi être restaurée');
  cleanups.forEach(cleanup => cleanup());
});

it('isole les dalles ALTAPPEN et conserve leurs dimensions après une nouvelle mesure', async () => {
  const source = new THREE.Group(), effects = [], sizes = [];
  source.add(new THREE.Mesh(new THREE.BoxGeometry(.3, .02, .3), new THREE.MeshBasicMaterial()));
  let scene;
  const { AltappenRug } = load('src/features/scene/items/AltappenRug.tsx', {
    three: THREE, 'react/jsx-runtime': jsx, react: { useLayoutEffect: fn => effects.push(fn) },
    '@react-three/drei': { useGLTF: Object.assign(() => ({ scene: source }), { preload() {} }) },
    '@features/scene/useGLTFClone': { useGLTFClone: () => ({ scene }) },
    '@features/scene/glbUtils': await glbUtils(),
  });
  const instances = [source.clone(true), source.clone(true)];
  for (scene of instances) {
    for (let measurement = 0; measurement < 2; measurement++) {
      assert.equal(AltappenRug({ onSize: size => sizes.push(size) }).props.object, scene);
      effects.pop()();
    }
  }
  assert.equal(source.userData.merged, undefined);
  assert.deepEqual(source.scale.toArray(), [1, 1, 1]);
  assert.notEqual(instances[0].children[0].geometry, instances[1].children[0].geometry);
  sizes.forEach(size => assert(Math.abs(size.x - 30) < 1e-5 && Math.abs(size.z - 30) < 1e-5));
});

it('conserve les hauteurs assis/debout BOLLSIDAN et la priorité de la hauteur explicite', async () => {
  const utils = await glbUtils();
  for (const [props, expected] of [
    [{}, 70], ...['desk-toggle', 'desk1-toggle', 'desk2-toggle', 'standing'].map(key => [{ actionState: { [key]: true } }, 105]),
    [{ actionState: { 'desk-toggle': false, standing: true } }, 70],
    [{ height: 82, actionState: { standing: true } }, 82],
  ]) {
    const scene = new THREE.Group(), effects = [], sizes = [];
    scene.add(new THREE.Mesh(new THREE.BoxGeometry(.68, .8477, .36).translate(0, .8477 / 2, 0), new THREE.MeshBasicMaterial()));
    const { Bollsidan30574370 } = load('src/features/scene/items/Bollsidan30574370.tsx', {
      three: THREE, 'react/jsx-runtime': jsx,
      react: { useMemo: fn => fn(), useCallback: fn => fn, useRef: value => ({ current: value }), useLayoutEffect: fn => effects.push(fn) },
      '@react-three/fiber': { useThree: () => ({ invalidate() {} }), useFrame() {} },
      '@react-three/drei': { useGLTF: Object.assign(() => ({ scene }), { preload() {} }) },
      '@features/scene/glbUtils': utils,
    });
    Bollsidan30574370({ ...props, onSize: size => sizes.push(size) }); effects.pop()();
    assert(Math.abs(sizes[0].y - expected) < 1e-4);
  }
});

it('lit les actions Air Performer directement dans la preview et accepte un placement sans propriétés factices', async () => {
  const scene = new THREE.Group(), remote = new THREE.Mesh(new THREE.BoxGeometry(.02, .01, .1));
  remote.name = 'RemoteControl'; scene.add(remote);
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(.325, 1.064, .325)));
  const rotatingGroup = new THREE.Group(), effects = [], layouts = [];
  let frame;
  const { AirPerformer } = load('src/features/scene/items/AirPerformer.tsx', {
    three: THREE, 'react/jsx-runtime': jsx,
    react: {
      useState: value => [value, () => assert.fail('La preview ne doit pas recopier ses propriétés dans un état local')],
      useRef: value => ({ current: value === null ? rotatingGroup : value }),
      useEffect: fn => effects.push(fn), useLayoutEffect: fn => layouts.push(fn),
    },
    '@react-three/drei': { useGLTF: { preload() {} } },
    '@react-three/fiber': { useThree: () => ({ invalidate() {} }), useFrame: fn => { frame = fn; } },
    '../useGLTFClone': { useGLTFClone: (...args) => { assert.equal(args.length, 1); return { scene }; } },
    '../glbUtils': await glbUtils(), '../objectActions': { getObjectActionIds: () => [] },
    '../utils/useFurnitureToggles': { useFurnitureToggles: () => ({}) }, '../store/useSceneStore': {},
    '../../home-assistant/airPerformer': load('src/features/home-assistant/airPerformer.ts', {}),
    '../../home-assistant/appliances': {},
    '../../home-assistant/connection': { isHomeAssistantLinked: () => false, useHomeAssistant: () => ({ entities: {} }) },
  });
  for (const power of [true, false, true]) {
    const item = AirPerformer({ isPreview: true, actionState: { airPerformerPower: power, airPerformerMode: 'fan', airPerformerOscillation: 90 } });
    effects.splice(0).forEach(fn => fn()); layouts.pop()();
    assert.equal(remote.visible, true);
    assert(item.props.userData.hoverAction.label.includes(power ? 'fan' : 'Éteint'));
    rotatingGroup.rotation.y = 0; frame(null, 1);
    assert.equal(rotatingGroup.rotation.y !== 0, power);
  }
  AirPerformer({}); layouts.pop()();
  assert.equal(remote.visible, true);
  AirPerformer({ remoteDocked: false }); layouts.pop()();
  assert.equal(remote.visible, false);
});

it('les deux cadres UTÅKER conservent leur matelas et leur literie avec ou sans surmatelas', () => {
  const Anneland = () => null, Vestmarka = () => null;
  const { UtakerFrame } = load('src/features/scene/items/UtakerFrame.tsx', {
    three: THREE, 'react/jsx-runtime': jsx,
    react: { useRef: () => ({ current: null }), useLayoutEffect() {} },
    '@react-three/drei': { useGLTF: { preload() {} } },
    '@features/scene/useGLTFClone': {}, '@features/scene/glbUtils': {},
    './Anneland70481722': { Anneland70481722: Anneland },
    './Vestmarka90470195': { Vestmarka90470195: Vestmarka }, './Blaskata50569513': {},
  });
  for (const [upper, hasTopper, topY, drop] of [
    [false, false, 29, 14], [false, true, 33, 17], [true, false, 35, 16], [true, true, 39, 20],
  ]) {
    const [frame, mattress, duvet, bolsters] = UtakerFrame({ upper, hasTopper }).props.children;
    assert(frame.props.glbPath.endsWith(upper ? '-2.glb' : '-1.glb'));
    assert.equal(mattress.props.children.type, upper ? Anneland : Vestmarka);
    assert.deepEqual(duvet.props, { topY, drop });
    assert.deepEqual(bolsters.props, { topY, zOffset: upper ? -26 : 26 });
  }
});

it('les coffres partagent un couvercle réversible, une pause indépendante en preview et un nettoyage du mixer', async () => {
  const effects = [], refs = [], scene = new THREE.Group(), preloads = [];
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)); lid.name = 'lid'; scene.add(lid);
  const animations = [new THREE.AnimationClip('lid_open', 1, [new THREE.NumberKeyframeTrack('lid.rotation[y]', [0, 1], [0, 1])])];
  let cursor = 0, frame;
  const { createAnimatedGlbItem } = load('src/features/scene/items/createAnimatedGlbItem.tsx', {
    three: THREE, 'react/jsx-runtime': jsx,
    react: { useRef: value => refs[cursor++] ??= { current: value }, useLayoutEffect: fn => effects.push(fn) },
    '@react-three/drei': { useGLTF: { preload: path => preloads.push(path) } },
    '@react-three/fiber': { useThree: () => ({ invalidate() {} }), useFrame: fn => { frame = fn; } },
    '../useGLTFClone': { useGLTFClone: (...args) => { assert.equal(args.length, 1); return { scene, animations }; } },
    '../glbUtils': await glbUtils(), '../objectActions': { getObjectActionIds: () => ['open'] },
  });
  const Item = createAnimatedGlbItem('/chest.glb', 'chest', 'Coffre');
  const render = props => { cursor = 0; return Item(props); };
  assert.equal(render({}).props.object, scene);
  const cleanup = effects.splice(0).map(effect => effect()).find(result => typeof result === 'function');
  assert.deepEqual(preloads, ['/chest.glb']);
  assert.equal(scene.userData.hoverAction.label, 'Coffre');
  render({ actionState: { open: true } }); frame(null, .25);
  assert(Math.abs(lid.rotation.y - .25) < 1e-6);
  render({ actionState: { open: false } }); frame(null, .125);
  assert(Math.abs(lid.rotation.y - .125) < 1e-6);
  render({ isPreview: true, actionState: { open: true, previewPaused: true } }); frame(null, 1);
  assert(Math.abs(lid.rotation.y - .125) < 1e-6);
  render({ isPreview: true, actionState: { open: true } }); frame(null, .125);
  assert(Math.abs(lid.rotation.y - .25) < 1e-6);
  cleanup();
  assert.doesNotThrow(() => frame(null, 1));
  animations.length = 0;
  render({});
  assert.throws(() => effects.splice(0).forEach(effect => effect()), /missing lid_open animation/);
});

it('TRÅDFRI et OLA conservent leur géométrie et leurs matériaux lors des nouvelles mesures', async () => {
  for (const name of ['TradfriBulb', 'LampOla']) {
    const sourceMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const scene = new THREE.Group(), refs = [], deps = [], effects = [], sizes = [];
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), sourceMaterial);
    scene.add(mesh);
    let refCursor, effectCursor, clonedMaterials = false;
    const module = load(`src/features/scene/items/${name}.tsx`, {
      three: THREE, 'react/jsx-runtime': jsx,
      react: {
        useRef: value => refs[refCursor++] ??= { current: value },
        useLayoutEffect: (fn, next) => {
          const index = effectCursor++, previous = deps[index];
          if (!previous || next.some((value, i) => value !== previous[i])) effects.push(fn);
          deps[index] = next;
        },
      },
      '@react-three/drei': { useGLTF: { preload() {} } },
      '@features/scene/useGLTFClone': { useGLTFClone: (_, ownMaterials) => {
        if (ownMaterials && !clonedMaterials) { mesh.material = sourceMaterial.clone(); clonedMaterials = true; }
        return { scene };
      } },
      '@features/scene/glbUtils': await glbUtils(),
    });
    const render = (on, onSize) => {
      refCursor = effectCursor = 0;
      module[name]({ actionState: { on, lightColor: 0xff0000, brightness: .5 }, onSize });
      effects.splice(0).forEach(fn => fn());
    };
    const materials = () => scene.children.flatMap(mesh => Array.isArray(mesh.material) ? mesh.material : [mesh.material]);
    render(true, size => sizes.push(size.toArray()));
    const children = [...scene.children], preparedMaterials = materials();
    assert(preparedMaterials.some(mat => mat.emissiveIntensity > 0));
    render(true, size => sizes.push(size.toArray()));
    assert.deepEqual(scene.children, children, name);
    assert.deepEqual(materials(), preparedMaterials, name);
    assert.deepEqual(sizes[0], sizes[1], name);
    render(false, undefined);
    assert(materials().every(mat => mat.emissiveIntensity === 0 || mat.emissive.getHex() === 0), name);
    assert.equal(sourceMaterial.emissiveIntensity, 1);
    assert.equal(sourceMaterial.emissive.getHex(), 0);
  }
});

it('le placard SDB suit les nouveaux états des deux portes sans références intermédiaires', () => {
  const refs = [], dependencies = [], effects = [];
  let refIndex, effectIndex, frame;
  const { SdbCloset } = load('src/features/scene/items/SdbCloset.tsx', {
    three: THREE, 'react/jsx-runtime': jsx,
    react: {
      useRef: value => refs[refIndex++] ??= { current: value === null ? new THREE.Group() : value },
      useMemo: () => null,
      useLayoutEffect: (fn, next) => {
        const index = effectIndex++, previous = dependencies[index];
        if (!previous || next.some((value, i) => value !== previous[i])) effects.push(fn);
        dependencies[index] = next;
      },
    },
    '@react-three/fiber': { useFrame: fn => { frame = fn; }, useThree: () => ({ invalidate() {} }) },
    '../wallData': { pWest: () => 100, pEast: () => 0, pNorth: () => 500, WALL_H: 250 },
    '../building/buildingCommon': { boxFaceMats: () => [], noCapMat: null }, './Grejig40329868': {},
    '../ai/smartObjectRegistry': { SMART_OBJECTS: { 'sdb-closet': { slots: [] } } },
    '../objectActions': { getObjectActionIds: () => [] },
  });
  const render = actionState => {
    refIndex = effectIndex = 0; SdbCloset({ actionState }); effects.splice(0).forEach(fn => fn());
    for (let i = 0; i < 100; i++) frame();
    return refs.slice(0, 2).map(ref => ref.current.position.x);
  };
  assert.deepEqual(render({}), [-25, 25]);
  assert.deepEqual(render({ sdbClosetL: true }), [-25, -25]);
  assert.deepEqual(render({ sdbClosetR: true }), [25, 25]);
  assert.deepEqual(render({}), [-25, 25]);
});

it('les trois meubles METOD gardent leur géométrie et leurs dimensions après remontage et changement de callback', async () => {
  const utils = await glbUtils();
  for (const name of ['KitchenCabinet', 'BathroomCabinetWest', 'BathroomCabinetEast']) {
    const scenes = new Map(), effects = [], pivot = new THREE.Group(), parent = new THREE.Group();
    parent.position.set(110, 20, -80); parent.rotation.y = .7; parent.scale.setScalar(1.3); parent.add(pivot);
    let frame;
    const exports = load(`src/features/scene/items/${name === 'KitchenCabinet' ? name : 'BathroomCabinet'}.tsx`, {
      three: THREE, 'react/jsx-runtime': jsx,
      react: { useRef: () => ({ current: pivot }), useLayoutEffect: fn => effects.push(fn) },
      '@react-three/drei': { useGLTF: { preload() {} } },
      '@react-three/fiber': { useThree: () => ({ invalidate() {} }), useFrame: fn => { frame = fn; } },
      '@features/scene/useGLTFClone': { useGLTFClone: path => {
        if (!scenes.has(path)) {
          const scene = new THREE.Group();
          scene.add(new THREE.Mesh(new THREE.BoxGeometry(.4, .6, .2).translate(.07, .3, -.02), new THREE.MeshStandardMaterial()));
          scenes.set(path, scene);
          (scenes.size === 1 ? parent : pivot).add(scene);
        }
        return { scene: scenes.get(path) };
      } },
      '@features/scene/glbUtils': utils,
      '../objectActions': { getObjectActionIds: () => ['open'] },
      '../ai/smartObjectRegistry': {}, './useDoorOpen': { useDoorOpen: () => true },
    });
    const sizes = [];
    const render = () => {
      const props = { isPreview: true, onSize: size => sizes.push(size.toArray()) };
      const element = exports[name](props);
      if (typeof element.type === 'function') element.type(element.props);
      effects.splice(0).forEach(effect => effect());
    };
    const snapshot = () => {
      parent.updateMatrixWorld(true);
      return [...scenes.values()].map(scene => ({
        matrix: scene.matrixWorld.toArray(), geometry: scene.children[0].geometry.uuid,
      }));
    };
    render(); frame(null, 1);
    const expected = snapshot();
    render(); render();
    assert.deepEqual(snapshot(), expected, name);
    assert.equal(sizes.length, 3);
    assert.deepEqual(sizes[1], sizes[0]); assert.deepEqual(sizes[2], sizes[0]);
  }
});
