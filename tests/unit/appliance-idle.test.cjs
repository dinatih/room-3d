const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');

for (const [name, primaryKey, secondaryKey, clipNames] of [
  ['Freezer', 'freezer', null, ['door_open']],
  ['Fridge', 'fridge', 'fridge-crisper-toggle', ['door_open', 'crisper_slide']],
  ['SyckRc003a', 'syck-rc003a-lid', 'syck-rc003a-pot', ['lid_open', 'pot_extract']],
  ['NinjaSP101', 'ninja', 'ninja-rack', ['door_open', 'rack_slide']],
]) it(`${name}: ne recalcule plus au repos, respecte la pause et termine les deux sens`, () => {
  const scene = new THREE.Group(), primary = new THREE.Object3D(), secondary = new THREE.Object3D(), anchor = new THREE.Object3D();
  primary.name = 'Primary'; secondary.name = 'Secondary'; anchor.name = 'LampAnchor'; anchor.userData.powerWatts = 5;
  scene.add(primary, secondary, anchor);
  if (name === 'NinjaSP101') {
    anchor.name = 'NinjaLampAnchor'; anchor.userData.lumens = 45;
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
    bulb.name = 'NinjaLampBulb'; scene.add(bulb);
  }
  const animations = clipNames.map((name, index) => new THREE.AnimationClip(name, 1, [
    new THREE.NumberKeyframeTrack(`${index ? 'Secondary' : 'Primary'}.position[x]`, [0, 1], [0, 10]),
  ]));
  let frame, mounted = false, cleanup, updates = 0;
  const ref = { current: null }, actionState = {};
  const clone = { useGLTFClone: () => ({ scene, animations }) };
  const utils = { removeGlbLines() {}, glbLocalBBox: () => new THREE.Box3(new THREE.Vector3(), new THREE.Vector3(10, 10, 10)) };
  const { [name]: Component } = load(`src/features/scene/items/${name}.tsx`, {
    three: { ...THREE, AnimationMixer: class extends THREE.AnimationMixer { update(delta) { updates++; return super.update(delta); } } },
    react: { useRef: () => ref, useEffect() {}, useLayoutEffect: fn => { if (!mounted) cleanup = fn(); } },
    'react/jsx-runtime': require('react/jsx-runtime'),
    '@react-three/drei': { useGLTF: { preload() {} } },
    '@react-three/fiber': { useFrame: fn => { frame = fn; }, useThree: () => ({ invalidate() {} }) },
    '@features/scene/useGLTFClone': clone, '../useGLTFClone': clone,
    '@features/scene/glbUtils': utils, '../glbUtils': utils,
    '@features/scene/store/useSceneStore': { useSceneStore: select => select({ furniture: { fridge: false, freezerOpen: false }, extraStates: {} }) },
    '../objectActions': { getObjectActionIds: () => [primaryKey] }, '../ai/smartObjectRegistry': {},
  });
  const render = () => { Component({ actionState, isPreview: true }); mounted = true; };
  render();
  const initial = updates; frame(null, 2); assert.equal(updates, initial);
  actionState[primaryKey] = true;
  if (name === 'NinjaSP101') actionState['ninja-light'] = true;
  if (secondaryKey) actionState[secondaryKey] = true;
  actionState.previewPaused = true; render(); frame(null, 2);
  assert.equal(updates, initial); assert.equal(primary.position.x, 0);
  actionState.previewPaused = false; render();
  for (let i = 0; i < 3; i++) frame(null, 2);
  assert(primary.position.x > 0);
  if (secondaryKey) assert.equal(secondary.position.x, 10);
  if (name === 'Fridge') assert(anchor.children[0].intensity > 0);
  if (name === 'NinjaSP101') {
    assert(anchor.children[0].intensity > 0);
    assert.equal(scene.getObjectByName('NinjaLampBulb').material.emissiveIntensity, 3);
  }
  const open = updates; frame(null, 2); assert.equal(updates, open);
  actionState[primaryKey] = false;
  if (name === 'NinjaSP101') actionState['ninja-light'] = false;
  if (secondaryKey) actionState[secondaryKey] = false;
  render();
  for (let i = 0; i < 3; i++) frame(null, 2);
  assert.equal(primary.position.x, 0); assert.equal(secondary.position.x, 0);
  if (name === 'Fridge') assert.equal(anchor.children[0].intensity, 0);
  if (name === 'NinjaSP101') assert.equal(anchor.children[0].intensity, 0);
  const closed = updates; frame(null, 2); assert.equal(updates, closed);
  if (name === 'NinjaSP101') {
    actionState['ninja-light'] = true; render(); frame(null, .125);
    assert.equal(scene.getObjectByName('NinjaLampBulb').material.emissiveIntensity, 1.5, 'le fondu fonctionne aussi avec la porte fermée');
    frame(null, .125);
    assert.equal(scene.getObjectByName('NinjaLampBulb').material.emissiveIntensity, 3);
    const lit = updates; frame(null, 2); assert.equal(updates, lit);
  }
  cleanup();
});

it('WC: relancer la chasse remplace son délai et le démontage annule les rappels', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const previousDocument = globalThis.document;
  globalThis.document = new EventTarget();
  t.after(() => { if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument; });
  const scene = new THREE.Group(), button = new THREE.Object3D(), effects = [];
  button.name = 'button'; scene.add(button);
  for (const name of ['lid', 'seat']) { const part = new THREE.Object3D(); part.name = name; scene.add(part); }
  let frame, invalidations = 0;
  const { Toilet } = load('src/features/scene/items/Toilet.tsx', {
    three: THREE, 'react/jsx-runtime': require('react/jsx-runtime'),
    react: { useRef: value => ({ current: value }), useLayoutEffect: fn => effects.push(fn) },
    './useDoorOpen': { useDoorOpen: () => true },
    './toiletAnimation': { TOILET_HINGE_ANGLE: 1, TOILET_HINGE_SPEED: 1, TOILET_HINGE_TOLERANCE: .001 },
    '@react-three/drei': { useGLTF: { preload() {} } },
    '@features/scene/useGLTFClone': { useGLTFClone: () => ({ scene }) },
    '@react-three/fiber': { useFrame: fn => { frame = fn; }, useThree: () => ({ invalidate: () => invalidations++ }) },
    '@features/scene/glbUtils': { removeGlbLines() {}, glbLocalBBox: () => new THREE.Box3(new THREE.Vector3(), new THREE.Vector3(1, 1, 1)) },
  });
  Toilet({});
  const cleanups = effects.map(fn => fn()).filter(Boolean);
  const flush = value => document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'wc-flush', value } }));
  flush(); frame(null, 1 / 15); assert(Math.abs(button.position.z + .03) < Number.EPSILON);
  for (const name of ['lid', 'seat']) assert.equal(scene.getObjectByName(name).parent.rotation.x, THREE.MathUtils.damp(0, -1, 1, 1 / 15));
  t.mock.timers.tick(1000); flush(); t.mock.timers.tick(500);
  frame(null, 1 / 15); assert(Math.abs(button.position.z + .03) < Number.EPSILON, 'le premier délai ne coupe pas la deuxième chasse');
  t.mock.timers.tick(1000); frame(null, 1 / 15); assert(Math.abs(button.position.z) < Number.EPSILON);
  flush(); flush(false); frame(null, 1 / 15);
  const stopped = invalidations; t.mock.timers.tick(1500); assert.equal(invalidations, stopped);
  flush(); cleanups.forEach(fn => fn());
  const unmounted = invalidations; t.mock.timers.tick(1500); flush(); assert.equal(invalidations, unmounted);
});
