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
  return { target, run: () => {
    const previous = global.window;
    global.window = {};
    try { return effect(); } finally { global.window = previous; }
  } };
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
    assert.equal(mesh.userData.wasMerged, undefined);
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
  const cleanups = [], cameraState = { mirrorQuality: 'mid' }, reflectionCamera = new THREE.PerspectiveCamera();
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
  const { MirrorSurface, mirrorPlanesGeometry } = load('src/features/scene/building/Mirrors.tsx', {
    three: THREE, 'react/jsx-runtime': jsx, react: { useMemo: fn => fn(), useEffect: fn => cleanups.push(fn()) },
    '@react-three/fiber': {}, 'three/addons/objects/Reflector.js': { Reflector },
    'three/addons/utils/BufferGeometryUtils.js': await geometryUtils,
    '@features/scene/cameraState': { cameraState }, '../SkySphere': { getLoadedSkyTexture: () => null },
    '../items/NissedalMirror': {}, './MergedStaticGroup': {}, '../wallData': {}, '@config': {},
  }, source => source + '\nexport { MirrorSurface, mirrorPlanesGeometry };');
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
