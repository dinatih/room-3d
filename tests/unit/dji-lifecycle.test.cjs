const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');

for (const name of ['DjiNeoDrone', 'DjiAvata2Drone', 'DjiFpvDrone']) it(`${name}: mesurer à nouveau conserve animation et visite`, () => {
  const root = new THREE.Group(), pivot = new THREE.Group(), scene = new THREE.Group();
  pivot.name = 'DronePivot'; root.add(pivot); pivot.add(scene);
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(2, 3, 4), new THREE.MeshStandardMaterial()));
  const refs = [], memos = [], effects = [], frames = [], sizes = [];
  let refIndex, memoIndex, effectIndex, frameIndex, tours = 0, registrations = 0, releases = 0;
  const invalidate = () => {};
  const { [name]: Component } = load('src/features/scene/items/DjiDrone.tsx', {
    three: THREE, 'react/jsx-runtime': require('react/jsx-runtime'),
    react: {
      useRef: value => { const index = refIndex++; return refs[index] ??= { current: index === 0 ? root : index === 1 ? pivot : value }; },
      useMemo: (fn, deps) => { const index = memoIndex++, previous = memos[index]; if (!previous || deps.some((v, i) => v !== previous.deps[i])) memos[index] = { deps, value: fn() }; return memos[index].value; },
      useLayoutEffect: (fn, deps) => { const index = effectIndex++, previous = effects[index]; if (!previous || deps.some((v, i) => v !== previous.deps[i])) { previous?.cleanup?.(); effects[index] = { deps, cleanup: fn() }; } },
    },
    '@react-three/fiber': { useThree: () => ({ invalidate }), useFrame: fn => { frames[frameIndex++] = fn; } },
    '@features/scene/useGLTFClone': { useGLTFClone: () => ({ scene }) },
    '@react-three/drei': { useGLTF: { preload() {} } }, '@features/scene/idleState': { isAppIdle: () => false },
    '@features/scene/glbUtils': { glbLocalBBox: object => new THREE.Box3().setFromObject(object) },
    '@features/inventory/useAnimPreviewStore': {},
    '../cameraState': { cameraState: { animalViews: {}, positions: {}, animalTarget: null } },
    '../hornetTour': { HornetTour: class {
      constructor() { tours++; this.observations = ['terrace', 'feeder', 'top'].map(id => ({ id, position: new THREE.Vector3(1, 2, 3) })); this.space = { safeStop: () => true }; }
      tick() {} release() { releases++; }
    } },
    '../camera/subjectControls': { SubjectDriver: class { step() {} dispose() {} } },
    '../droneControls': { useDroneControlStore: { getState: () => ({ speed: 100 }) } },
    '@features/ui/AppConsole': { appLog() {} },
    '../ai/navigation/obstacles': { setAgentProfile: () => registrations++, removeAgentProfile() {} },
  });
  const render = () => {
    refIndex = memoIndex = effectIndex = frameIndex = 0;
    const element = Component({ onSize: size => sizes.push(size.toArray()) });
    element.type(element.props);
  };
  render(); frames[0](null, .25);
  const mixer = refs.find(ref => ref.current instanceof THREE.AnimationMixer).current;
  const pose = pivot.position.toArray();
  root.position.set(20, 30, 40);
  render();
  assert.equal(refs.find(ref => ref.current instanceof THREE.AnimationMixer).current, mixer);
  assert.deepEqual(root.position.toArray(), [20, 30, 40]);
  assert.deepEqual(pivot.position.toArray(), pose);
  assert.deepEqual(sizes[1], sizes[0]);
  assert.equal(tours, 1); assert.equal(registrations, 1);
  effects.forEach(effect => effect.cleanup?.());
  assert.equal(releases, 1);
});
