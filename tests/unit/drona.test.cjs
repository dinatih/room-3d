const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const jsx = require('react/jsx-runtime');
const { load } = require('../support/load-ts.cjs');

function boxes() {
  let mode = 'high';
  const sources = Object.fromEntries(['high', 'low'].map(key => [key, new THREE.BoxGeometry(.38, .33, .33)]));
  const module = load('src/features/scene/items/Drona.tsx', {
    three: THREE, 'react/jsx-runtime': jsx, react: { Suspense: () => null, useLayoutEffect: fn => fn() },
    '../store/useSceneStore': { useSceneStore: select => select({ furniture: { dronaMode: mode } }) },
    '@react-three/drei': { useGLTF: paths => paths.map(path => ({ nodes: { box: new THREE.Mesh(sources[path.includes('_low') ? 'low' : 'high']) } })) },
  });
  return { ...module, sources, mode: value => { mode = value; } };
}

it('les trois qualités DRONA partagent le même pivot, sans modifier la géométrie source', () => {
  const test = boxes(), prepared = {};
  for (const mode of ['high', 'low', 'procedural']) {
    test.mode(mode);
    const geo = test.useDronaGeo();
    const center = geo.boundingBox.getCenter(new THREE.Vector3());
    assert(center.length() < 1e-5, `${mode} doit être centré en X/Y/Z`);
    assert.equal(test.useDronaGeo(), geo, 'la géométrie préparée est partagée');
    prepared[mode] = geo;
  }
  assert.notEqual(prepared.high, test.sources.high);
  assert.notEqual(prepared.high, prepared.low);
  assert(Math.abs(new THREE.Box3().setFromBufferAttribute(test.sources.high.attributes.position).max.x - .19) < 1e-6);
});

it('le rendu DRONA commun masque les boîtes tout en conservant leur mesure dans l’inventaire', () => {
  const test = boxes(), sizes = [];
  test.mode('hidden');
  const inventory = test.Drona({ onSize: size => sizes.push(size) }).props.children;
  assert.equal(inventory.type(inventory.props), null);
  assert(sizes[0].y > 0);
  const cell = test.DroneCell().props.children;
  assert.equal(cell.type(cell.props), null);
  test.mode('low');
  const mesh = cell.type(cell.props);
  assert.equal(mesh.props.geometry, test.useDronaGeo());
  assert.equal(mesh.props.dispose, null);
  assert.equal(mesh.props.userData.skipMerge, true);
});

it('une DRONA coulissante peut inverser sa course, changer de qualité et garder sa preview indépendante', () => {
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
  render({ isPreview: true, actionState: { slide: true } }); frame(null, 1);
  geometry = new THREE.BoxGeometry(33, 33, 60); geometry.computeBoundingBox();
  render({ isPreview: true, actionState: { slide: true } }); frame(null, 0);
  assert.equal(group.position.z, -40);
  assert.equal(state.extraStates.slide, true);
});
