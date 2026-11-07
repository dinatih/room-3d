const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');

it('active les lumières HD la nuit et les désactive le jour, une fois par transition', () => {
  for (const lightsHD of [false, true]) {
    const scene = new THREE.Scene(), clock = { minutes: 0 }, actions = [];
    const layers = { lightsHD }, qualities = [];
    scene.add(new THREE.AmbientLight('white', 2));
    const refs = [null, new THREE.Mesh(), new THREE.MeshBasicMaterial(), new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial())];
    let frame;
    const { DayNight, daylight } = load('src/features/scene/DayNight.tsx', {
      three: THREE, 'react/jsx-runtime': require('react/jsx-runtime'),
      react: { useLayoutEffect() {}, useMemo: fn => fn(), useRef: value => ({ current: refs.shift() ?? value }) },
      '@react-three/fiber': { useThree: select => select({ scene }), useFrame: fn => { frame = fn; } },
      './skyBounds': { SKY_CENTER: [0, 0, 0], SKY_RADIUS: 10000 }, './ai/laraLifeStore': { simulationClock: clock },
      './store/useSceneStore': { useSceneStore: { getState: () => ({ layers,
        toggleLayer: key => { assert.equal(key, 'lightsHD'); qualities.push(layers.lightsHD = !layers.lightsHD); },
        triggerAction: (...action) => actions.push(action) }) } },
    });
    DayNight(); frame({ scene });
    assert.equal(layers.lightsHD, false);
    assert.equal(scene.children[0].intensity, 2);
    for (const hour of [18, 20, 21]) {
      clock.minutes = (hour - 8) * 60; frame({ scene });
      assert.equal(layers.lightsHD, false);
      assert.equal(daylight(hour), 1);
    }
    clock.minutes = 14 * 60; frame({ scene }); frame({ scene });
    assert.equal(layers.lightsHD, true);
    assert(scene.children[0].intensity < 2);
    clock.minutes = 21 * 60; frame({ scene });
    assert.equal(layers.lightsHD, true);
    assert.equal(daylight(5), 0);
    clock.minutes = 22 * 60; frame({ scene });
    assert.equal(layers.lightsHD, false);
    assert.equal(daylight(6), 0);
    clock.minutes = 24 * 60; frame({ scene });
    assert.equal(layers.lightsHD, false);
    assert.equal(scene.children[0].intensity, 2);
    assert.deepEqual(actions, [['lamp-toggle', false], ['lamp-toggle', true], ['lamp-toggle', false]]);
    assert.deepEqual(qualities, lightsHD ? [false, true, false] : [true, false]);
  }
});

it('garde le balayage Eiffel hors du groupe visuel masqué le jour et éteint son intensité', () => {
  const clock = { minutes: 0 }, refs = [];
  let frame;
  const { EiffelTowerLights } = load('src/features/scene/EiffelTowerLights.tsx', {
    three: THREE, 'react/jsx-runtime': require('react/jsx-runtime'),
    react: { useMemo: fn => fn(), useRef: value => { const ref = { current: value }; refs.push(ref); return ref; } },
    '@react-three/fiber': { useFrame: fn => { frame = fn; } },
    './DayNight': { simulatedHour: () => (8 + clock.minutes / 60) % 24, daylight: hour => hour === 8 ? 1 : 0 },
    './store/useSceneStore': { useSceneStore: select => select({ currentHdri: 'default', layers: { eiffelSparkle: true } }) },
  });
  const [light, visuals] = EiffelTowerLights({}).props.children;
  assert.equal(light.type, 'pointLight'); assert.equal(visuals.type, 'group');
  refs[0].current = new THREE.Group(); refs[1].current = new THREE.Group();
  light.props.ref.current = new THREE.PointLight();
  frame({ clock: { elapsedTime: 0 } }, 1 / 60);
  assert.equal(refs[0].current.visible, false); assert.equal(light.props.ref.current.intensity, 0);
  clock.minutes = 12 * 60; frame({ clock: { elapsedTime: 1 } }, 1 / 60);
  assert.equal(refs[0].current.visible, true); assert(light.props.ref.current.intensity > 0);
  clock.minutes = 0; frame({ clock: { elapsedTime: 2 } }, 1 / 60);
  assert.equal(refs[0].current.visible, false); assert.equal(light.props.ref.current.intensity, 0);
  assert.equal(light.props.ref.current.visible, true);
});
