const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const clock = { minutes: 0 };
const astronomy = load('src/features/scene/astronomy.ts', {
  three: require('three'), suncalc: require('suncalc'), './ai/laraLifeStore': { simulationClock: clock },
}, source => source.replaceAll('import.meta.env', '({ VITE_STUDIO_AZ: 270 })'));

it('utilise la date réelle à Paris et l’heure du jeu, indépendamment du jour de vie', () => {
  const today = new Date('2026-11-09T12:00:00Z');
  assert.equal(astronomy.skyDate(12, today).toISOString(), '2026-11-09T11:00:00.000Z');
  clock.minutes = 4 * 60;
  assert.equal(astronomy.simulatedHour(), 12);
  clock.minutes += 24 * 60 * 100;
  assert.equal(astronomy.simulatedHour(), 12);
  assert.equal(astronomy.celestialState(undefined, today).date.toISOString(), '2026-11-09T11:00:00.000Z');
  assert.equal(astronomy.skyDate(12, new Date('2026-11-09T23:30:00Z')).toISOString(), '2026-11-10T11:00:00.000Z');
});

it('gère les offsets été/hiver et les passages de minuit', () => {
  assert.equal(astronomy.skyDate(12, new Date('2026-06-21')).toISOString(), '2026-06-21T10:00:00.000Z');
  assert.equal(astronomy.skyDate(0, new Date('2026-11-09')).toISOString(), '2026-11-08T23:00:00.000Z');
  assert.equal(astronomy.skyDate(24, new Date('2026-11-09')).toISOString(), '2026-11-09T23:00:00.000Z');
  assert.throws(() => astronomy.skyDate(NaN), /Invalid environment hour/);
});

it('adapte la durée du jour et la barre horaire à la saison réelle', () => {
  const winter = new Date('2026-11-09'), summer = new Date('2026-06-21');
  assert(astronomy.solarElevation(12, winter) > 0);
  assert(astronomy.solarElevation(18, winter) < 0);
  assert.equal(astronomy.daylight(19, winter), 0);
  assert.equal(astronomy.daylight(19, summer), 1);
  assert.notEqual(astronomy.dayTimeTrack(winter), astronomy.dayTimeTrack(summer));
});

it('calcule une lune indépendante du soleil, avec une phase datée', () => {
  const newMoon = astronomy.celestialState(12, new Date('2026-11-09'));
  const fullMoon = astronomy.celestialState(0, new Date('2026-11-24'));
  assert(newMoon.illumination.fraction < 0.05);
  assert(fullMoon.illumination.fraction > 0.95);
  assert(fullMoon.moon.elevation > 0);
  assert(fullMoon.sun.elevation < 0);
  for (const sky of [newMoon, fullMoon]) {
    assert(Math.abs(sky.sun.direction.length() - 1) < 1e-10);
    assert(Math.abs(sky.moon.direction.length() - 1) < 1e-10);
    assert(Math.abs(sky.sun.direction.y - Math.sin(sky.sun.elevation * Math.PI / 180)) < 1e-10);
  }
});

it('aligne le disque solaire, la lumière et les ombres sur la même position astronomique', () => {
  const THREE = require('three');
  const center = new THREE.Vector3(150, 0, 150), radius = 3600;
  const source = new THREE.DirectionalLight(), disc = new THREE.Mesh(), material = new THREE.MeshBasicMaterial();
  const refs = [source, disc, material], frames = [];
  let hour = 9;
  const { SunLight, SunSphere } = load('src/features/scene/SunLight.tsx', {
    three: THREE, 'react/jsx-runtime': require('react/jsx-runtime'),
    react: { useRef: () => ({ current: refs.shift() }) },
    '@react-three/fiber': { useFrame: callback => frames.push(callback) },
    './skyBounds': { SKY_CENTER: center.toArray(), SKY_RADIUS: radius },
    './astronomy': { celestialState: () => astronomy.celestialState(hour, new Date('2026-11-09')) },
  });
  SunLight(); SunSphere();
  for (const frame of frames) frame();
  assert(source.intensity > 0);
  assert.equal(disc.visible, true);
  assert(source.target.position.equals(center));
  const lightDirection = source.position.clone().sub(center).normalize();
  const discDirection = disc.position.clone().sub(center).normalize();
  assert(lightDirection.distanceTo(discDirection) < 1e-10);
  assert(Math.abs(source.position.distanceTo(center) - 2 * radius) < 1e-8);
  hour = 19;
  for (const frame of frames) frame();
  assert.equal(source.intensity, 0);
  assert.equal(disc.visible, false);
});
