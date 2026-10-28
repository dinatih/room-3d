const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const jsx = require('react/jsx-runtime');
const { load } = require('../support/load-ts.cjs');

function boxes() {
  const source = new THREE.BoxGeometry(.38, .33, .33);
  const module = load('src/features/scene/items/Drona.tsx', {
    three: THREE, 'react/jsx-runtime': jsx, react: { Suspense: () => null, useLayoutEffect: fn => fn() },
    '@react-three/drei': { useGLTF: path => {
      assert.equal(path, 'items/dröna/DRÖNA_high.glb');
      return { nodes: { box: new THREE.Mesh(source) } };
    } },
  });
  return { ...module, source };
}

it('la géométrie DRONA officielle est centrée et partagée sans modifier sa source', () => {
  const test = boxes(), vertices = [...test.source.attributes.position.array];
  const geo = test.useDronaGeo();
  assert(geo.boundingBox.getCenter(new THREE.Vector3()).length() < 1e-5);
  assert.equal(test.useDronaGeo(), geo);
  assert.notEqual(geo, test.source);
  assert.deepEqual([...test.source.attributes.position.array], vertices);
});

it('l’inventaire et les boîtes placées partagent le même rendu et la même géométrie', () => {
  const test = boxes(), sizes = [];
  const inventory = test.Drona({ onSize: size => sizes.push(size) }).props.children;
  const mesh = inventory.type(inventory.props);
  assert(sizes[0].equals(mesh.props.geometry.boundingBox.getSize(new THREE.Vector3())));
  const cell = test.DroneCell().props.children;
  assert.equal(cell.type(cell.props).props.geometry, mesh.props.geometry);
  assert.equal(mesh.props.dispose, null);
  assert.equal(mesh.props.userData.skipMerge, true);
});

it('une DRONA coulissante peut inverser sa course et garder sa preview indépendante', () => {
  const group = new THREE.Group(), refs = [], state = { extraStates: { slide: false } };
  let cursor = 0, frame, geometry = new THREE.BoxGeometry(33, 33, 38);
  geometry.computeBoundingBox();
  const { SlidingDrona } = load('src/features/scene/items/SlidingDrona.tsx', {
    'react/jsx-runtime': jsx,
    react: { useEffect: fn => fn(), useRef: value => refs[cursor++] ??= { current: value === null ? group : value } },
    '@react-three/fiber': { useThree: () => ({ invalidate() {} }), useFrame: fn => { frame = fn; } },
    './Drona': { DroneCell() {}, useDronaGeo: () => geometry },
    '../store/useSceneStore': { useSceneStore: select => select(state) },
    '../objectActions': { getObjectActionIds: () => ['slide'] }, '../ai/smartObjectRegistry': { SMART_OBJECTS: { box: { slots: [] } } },
  });
  const render = props => { cursor = 0; SlidingDrona({ objectId: 'box', label: 'Boîte', actionId: 'slide', duration: 1, ...props }); };
  render({}); frame(null, .25); assert(group.position.z === 0);
  state.extraStates.slide = true;
  render({}); frame(null, .25); assert(Math.abs(group.position.z + 38 / 6) < 1e-6);
  render({ isPreview: true, actionState: { slide: false } }); frame(null, .125);
  assert(Math.abs(group.position.z + 38 / 12) < 1e-6);
  state.extraStates.slide = false;
  render({ isPreview: true, actionState: { slide: true } }); frame(null, 1);
  assert.equal(group.position.z, -38 * 2 / 3);
  assert.equal(state.extraStates.slide, false);
});
