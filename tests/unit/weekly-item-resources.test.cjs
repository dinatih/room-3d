const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const jsx = require('react/jsx-runtime');
const { load } = require('../support/load-ts.cjs');
const { glbLocalBBox } = load('src/features/scene/glbUtils.ts', { three: THREE, 'three/addons/utils/BufferGeometryUtils.js': {} });

it('le téléphone conserve les UV et le cadrage partagés et libère ses propres ressources', () => {
  const geometry = new THREE.PlaneGeometry(2, 4); geometry.deleteAttribute('uv');
  const material = new THREE.MeshStandardMaterial(); material.name = 'Display';
  const source = new THREE.Group(); source.add(new THREE.Mesh(geometry, material));
  const scene = source.clone(true), wallpaper = new THREE.Texture(), cleanups = [];
  const { Phone } = load('src/features/scene/items/Phone.tsx', {
    three: THREE, 'react/jsx-runtime': jsx,
    react: { useMemo: fn => fn(), useLayoutEffect: fn => fn(), useEffect: fn => cleanups.push(fn()) },
    '@react-three/drei': { useTexture: () => wallpaper },
    '../useGLTFClone': { useGLTFClone: () => ({ scene }), preloadSceneGLTF() {} },
    '@features/scene/glbUtils': { removeGlbLines() {}, glbLocalBBox },
    '../utils/useSceneGlass': { useSceneGlass() {} },
  });
  Phone({});
  const screen = scene.children[0];
  assert.notEqual(screen.geometry, geometry);
  assert(screen.geometry.attributes.uv);
  assert.equal(geometry.attributes.uv, undefined);
  assert.notEqual(screen.material.map, wallpaper);
  assert.deepEqual(wallpaper.repeat.toArray(), [1, 1]);
  assert.deepEqual(wallpaper.offset.toArray(), [0, 0]);
  let disposed = 0, sharedDisposed = 0;
  for (const resource of [screen.geometry, screen.material, screen.material.map]) resource.addEventListener('dispose', () => disposed++);
  for (const resource of [geometry, material, wallpaper]) resource.addEventListener('dispose', () => sharedDisposed++);
  cleanups.forEach(cleanup => cleanup?.());
  assert.equal(disposed, 3); assert.equal(sharedDisposed, 0);
});

it('les clips d’objets lisent la scène et gardent la preview indépendante', () => {
  for (const preview of [false, true]) {
    const scene = new THREE.Group(), mesh = new THREE.Mesh(); mesh.name = 'Brush'; scene.add(mesh);
    const animation = new THREE.AnimationClip('brush_lift', 1, [new THREE.VectorKeyframeTrack('Brush.position', [0, 1], [0, 0, 0, 0, 1, 0])]);
    let frame;
    const { createAnimatedGlbItem } = load('src/features/scene/items/createAnimatedGlbItem.tsx', {
      three: THREE, 'react/jsx-runtime': jsx,
      react: { useLayoutEffect: fn => fn(), useRef: current => ({ current }) },
      '@react-three/fiber': { useFrame: fn => { frame = fn; }, useThree: () => ({ invalidate() {} }) },
      '../useGLTFClone': { useGLTFClone: () => ({ scene, animations: [animation] }), preloadSceneGLTF() {} },
      '../glbUtils': { glbLocalBBox }, '../objectActions': { getObjectActionIds: () => ['brush-lift'] },
      './useDoorOpen': { useDoorOpen: (key, isPreview, state) => isPreview ? !!state[key] : true },
    });
    const Brush = createAnimatedGlbItem('brush.glb', 'brush', 'Brosse', { clipNames: ['brush_lift'] });
    Brush({ isPreview: preview, actionState: { 'brush-lift': false } });
    frame(null, .5);
    assert.equal(mesh.position.y, preview ? 0 : .5);
  }
});

it('TACKAN libère les matériaux propres à chaque flacon sans détruire la source', () => {
  const source = new THREE.MeshPhysicalMaterial(); source.name = 'SimplygonCastMaterial_4';
  const material = source.clone(), scene = new THREE.Group(), cleanups = [];
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(.05, .1, .05), material));
  const { Tackan } = load('src/features/scene/items/Tackan.tsx', {
    three: THREE, 'react/jsx-runtime': jsx,
    react: { useLayoutEffect: fn => fn(), useEffect: fn => cleanups.push(fn()) },
    '@features/scene/useGLTFClone': { useGLTFClone: (_, ownMaterials) => { assert.equal(ownMaterials, true); return { scene }; }, preloadSceneGLTF() {} },
    '@features/scene/glbUtils': { removeGlbLines() {}, glbLocalBBox },
  });
  Tackan({ fillLevel: .5 });
  assert.equal(material.opacity, .22); assert.equal(source.opacity, 1);
  let disposed = 0, sharedDisposed = 0;
  material.addEventListener('dispose', () => disposed++);
  source.addEventListener('dispose', () => sharedDisposed++);
  cleanups.forEach(cleanup => cleanup?.());
  assert.equal(disposed, 1); assert.equal(sharedDisposed, 0);
});
