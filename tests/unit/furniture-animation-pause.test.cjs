const { test } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');

for (const [name, key, clipName, scale] of [
  ['ChestBench', 'chest-bench-open', 'lid_open', 100],
  ['Vatterso20562909', 'vatterso-open', 'lid_open', 100],
  ['VacuumCleaner', 'vacuum-detach-tube', 'detach_tube', 100],
  ['TrashBin', 'bin-toggle', 'bin_open', 1],
]) test(`${name}: pause, resume, endpoint, reversal and mixer disposal`, () => {
  const scene = new THREE.Group();
  const moving = new THREE.Object3D(); moving.name = 'Moving'; scene.add(moving);
  const clip = new THREE.AnimationClip(clipName, 2, [new THREE.NumberKeyframeTrack('Moving.position[x]', [0, 2], [0, 10])]);
  const actionState = { [key]: true, previewPaused: true };
  let frame, cleanup, invalidations = 0, mounted = false;
  const runtimeRef = { current: null };
  const dependencies = {
    react: { useRef: () => runtimeRef, useLayoutEffect: fn => { if (!mounted) cleanup = fn(); } },
    'react/jsx-runtime': require('react/jsx-runtime'),
    '@react-three/drei': { useGLTF: { preload() {} } },
    '@react-three/fiber': { useFrame: fn => { frame = fn; }, useThree: () => ({ invalidate: () => invalidations++ }) },
    three: THREE,
    '../useGLTFClone': { useGLTFClone: () => ({ scene, animations: [clip] }) },
    '../glbUtils': { glbLocalBBox: () => new THREE.Box3(new THREE.Vector3(), new THREE.Vector3(1, 1, 1)) },
    '../objectActions': { getObjectActionIds: () => [key] },
  };
  dependencies['./createLidGlbItem'] = load('src/features/scene/items/createLidGlbItem.tsx', dependencies);
  const component = load(`src/features/scene/items/${name}.tsx`, dependencies)[name];
  component({ actionState, isPreview: true, onSize() {} });
  frame({}, 1);
  assert.equal(moving.position.x, 0);
  actionState.previewPaused = false;
  frame({}, 1);
  assert.equal(moving.position.x, 5);
  frame({}, 1);
  assert.equal(moving.position.x, 10, 'uses clip duration, not a hardcoded endpoint');
  const count = invalidations;
  frame({}, 1);
  assert.equal(invalidations, count, 'settled animation does not request continuous rendering');
  mounted = true;
  actionState[key] = false;
  component({ actionState, isPreview: true, onSize() {} });
  frame({}, 1);
  assert.equal(moving.position.x, 5, 'closing resumes from the open pose');
  frame({}, 1);
  assert.equal(moving.position.x, 0);
  cleanup();
  assert.equal(scene.scale.x, scale);
});
test('Air Performer respects the selected arc, preview isolation and pause; docked remote follows the model', () => {
  const { AIR_PERFORMER_CONTROLS } = require('../../src/features/home-assistant/airPerformer.ts');
  for (const arc of [45, 90, 180, 270, 350]) {
    const scene = new THREE.Group(), remote = new THREE.Object3D(), pivot = new THREE.Group();
    remote.name = 'RemoteControl'; scene.add(remote);
    let frame, refIndex = 0, linked = true;
    const refs = [{ current: pivot }, { current: 1 }];
    const { AirPerformer } = load('src/features/scene/items/AirPerformer.tsx', {
      react: { useRef: () => refs[refIndex++], useEffect() {}, useLayoutEffect: fn => fn() },
      'react/jsx-runtime': require('react/jsx-runtime'),
      '@react-three/drei': { useGLTF: { preload() {} } },
      '@react-three/fiber': { useFrame: fn => { frame = fn; }, useThree: () => ({ invalidate() {} }) },
      three: THREE,
      '../useGLTFClone': { useGLTFClone: () => ({ scene }) },
      '../glbUtils': { glbLocalBBox: () => new THREE.Box3(new THREE.Vector3(), new THREE.Vector3(1, 106, 1)) },
      '../objectActions': { getObjectActionIds: () => [] },
      '../utils/useFurnitureToggles': { useFurnitureToggles: () => ({ airPerformerOscillation: 0 }) },
      '../store/useSceneStore': {},
      '../../home-assistant/connection': { useHomeAssistant: () => ({ entities: {} }), isHomeAssistantLinked: () => linked },
      '../../home-assistant/appliances': { applianceValue: () => { throw Error('Preview must not read HA state'); } },
      '../../home-assistant/airPerformer': { AIR_PERFORMER_CONTROLS, AIR_PERFORMER_ACTION_IDS: Object.keys(AIR_PERFORMER_CONTROLS) },
    });
    const actionState = { airPerformerPower: true, airPerformerOscillation: arc, previewPaused: true };
    const rendered = AirPerformer({ isPreview: true, actionState });
    assert.equal(rendered.props.children.props.children.props.object, scene);
    assert.equal(remote.visible, true);
    frame({}, 1);
    assert.equal(pivot.rotation.y, 0);
    actionState.previewPaused = false;
    for (let i = 0; i < 100; i++) {
      frame({}, 1);
      assert(Math.abs(pivot.rotation.y) <= THREE.MathUtils.degToRad(arc) / 2 + Number.EPSILON);
    }
    refIndex = 0;
    linked = false;
    AirPerformer({ remoteDocked: false });
    assert.equal(remote.visible, false, 'external remote must not be duplicated in the GLB');
  }
});
