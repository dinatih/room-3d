const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');
const fixedDate = new Date('2026-11-24T12:00:00Z');
const astronomy = load('src/features/scene/astronomy.ts', {
  three: THREE, suncalc: require('suncalc'), './ai/laraLifeStore': { simulationClock: { minutes: 0 } },
}, source => source.replaceAll('import.meta.env', '({})'));

it('allume les lampes la nuit sans modifier la qualité HD', () => {
  for (const lightsHD of [false, true]) {
    const scene = new THREE.Scene(), clock = { minutes: 60 }, actions = [];
    const layers = { lightsHD }, qualities = [];
    const nightState = { nightLighting: false };
    scene.add(new THREE.AmbientLight('white', 2));
    const moonSource = new THREE.DirectionalLight();
    const refs = [null, new THREE.Mesh(), new THREE.ShaderMaterial({ uniforms: { sunDirection: { value: new THREE.Vector3() }, opacity: { value: 0 } } }), new THREE.Points(new THREE.BufferGeometry(), new THREE.ShaderMaterial({ uniforms: { opacity: { value: 0 } } })), moonSource];
    let frame;
    const daylight = hour => astronomy.daylight(hour, fixedDate);
    const { DayNight } = load('src/features/scene/DayNight.tsx', {
      three: THREE, 'react/jsx-runtime': require('react/jsx-runtime'),
      react: { useLayoutEffect() {}, useMemo: fn => fn(), useRef: value => ({ current: refs.shift() ?? value }) },
      '@react-three/fiber': { useThree: select => select({ scene }), useFrame: fn => { frame = fn; } },
      './skyBounds': { SKY_CENTER: [0, 0, 0], SKY_RADIUS: 10000 },
      './astronomy': { simulatedHour: () => (8 + clock.minutes / 60) % 24, daylight,
        celestialState: hour => astronomy.celestialState(hour, fixedDate) },
      './store/useSceneStore': { useSceneStore: { setState: next => Object.assign(nightState, next), getState: () => ({ layers,
        toggleLayer: key => { assert.equal(key, 'lightsHD'); qualities.push(layers.lightsHD = !layers.lightsHD); },
        triggerAction: (...action) => actions.push(action) }) } },
    });
    DayNight(); frame({ scene });
    assert.equal(moonSource.intensity, 0);
    assert.equal(layers.lightsHD, lightsHD);
    assert(scene.children[0].intensity > 0);
    for (const hour of [9, 12, 15]) {
      clock.minutes = (hour - 8) * 60; frame({ scene });
      assert.equal(layers.lightsHD, lightsHD);
      assert.equal(daylight(hour), 1);
      assert.equal(nightState.nightLighting, false);
    }
    clock.minutes = 9.25 * 60; frame({ scene });
    assert(daylight(17.25) > 0 && daylight(17.25) < 1);
    assert.equal(nightState.nightLighting, true);
    clock.minutes = 16 * 60; frame({ scene }); frame({ scene });
    assert.equal(layers.lightsHD, lightsHD);
    assert(scene.children[0].intensity < 2);
    assert.equal(nightState.nightLighting, true);
    assert.equal(daylight(0), 0);
    assert(moonSource.intensity > 0);
    assert(moonSource.position.y > 0);
    clock.minutes = 21 * 60; frame({ scene });
    assert.equal(layers.lightsHD, lightsHD);
    assert.equal(daylight(5), 0);
    clock.minutes = 22 * 60; frame({ scene });
    assert.equal(layers.lightsHD, lightsHD);
    assert.equal(daylight(6), 0);
    assert.equal(nightState.nightLighting, true);
    clock.minutes = 25 * 60; frame({ scene });
    assert.equal(layers.lightsHD, lightsHD);
    assert(scene.children[0].intensity > 0);
    assert.deepEqual(actions, [['lamp-toggle', false], ['lamp-toggle', true], ['lamp-toggle', false]]);
    assert.deepEqual(qualities, []);
  }
});

it('garde le balayage Eiffel hors du groupe visuel masqué le jour et éteint son intensité', () => {
  const clock = { minutes: 0 }, refs = [];
  let frame;
  const { EiffelTowerLights } = load('src/features/scene/EiffelTowerLights.tsx', {
    three: THREE, 'react/jsx-runtime': require('react/jsx-runtime'),
    react: { useMemo: fn => fn(), useRef: value => { const ref = { current: value }; refs.push(ref); return ref; } },
    '@react-three/fiber': { useFrame: fn => { frame = fn; } },
    './astronomy': { simulatedHour: () => (8 + clock.minutes / 60) % 24, daylight: hour => hour === 8 ? 1 : 0 },
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

it('garde les bandes aussi lumineuses la nuit sans HD, avec les ombres réservées au HD', () => {
  for (const nightLighting of [false, true]) for (const lightsHD of [false, true]) for (const on of [false, true]) {
    const state = { nightLighting, layers: { lightsHD }, furniture: { lampGardenStrips: on } };
    const { GardenLightStrips } = load('src/features/scene/placements/GardenLightStrips.tsx', {
      three: THREE, 'react/jsx-runtime': require('react/jsx-runtime'),
      react: { useMemo: fn => fn(), useEffect() {}, useRef: value => ({ current: value }) },
      '@react-three/fiber': { useFrame() {} },
      '../store/useSceneStore': { useSceneStore: select => select(state) },
      '../wallData': { pEast: () => 95, pWest: () => 260, ROOM_NORTH_WALL: 0 },
    });
    for (const placement of GardenLightStrips().props.children) {
      const strip = placement.props.children;
      const group = strip.type(strip.props);
      for (const segment of group.props.children) {
        const light = segment.props.children[1].props;
        assert.equal(light.intensity, on ? (nightLighting || lightsHD ? 120 : 2.5) : 0);
        assert.equal(light.castShadow, lightsHD);
        assert.equal(light.decay, nightLighting || lightsHD ? 1 : 2);
      }
    }
  }
});
