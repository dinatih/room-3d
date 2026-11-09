const assert = require('node:assert/strict');
const fs = require('node:fs');
const launch = require('./browser-test-options.cjs');

if (process.argv.includes('--overlay')) {
  const { ParisLandmarkLights } = require('../tests/support/load-ts.cjs').load('src/features/scene/ParisLandmarkLights.tsx', {
    three: require('three'), react: {}, '@react-three/fiber': {}, './astronomy': {}, './store/useSceneStore': {},
    'react/jsx-runtime': require('react/jsx-runtime'),
  });
  const draw = ParisLandmarkLights({}).flatMap(element => {
    const landmark = element.props.landmark;
    return 'paths' in landmark ? landmark.paths.map(path => `polyline ${path.map(point => point.join(',')).join(' ')}`) : [];
  }).join(' ');
  for (const [name, crop] of [['river', '2200x500+2300+2100'], ['avenues', '700x430+4700+2080'], ['bois', '2700x600+5278+2020'], ['bois-wrap', '1000x500+0+2020']]) {
    require('node:child_process').execFileSync('magick', ['public/environment/hdri/ciel_paris_8k.hdr', '-auto-gamma', '-fill', 'none', '-stroke', 'cyan', '-strokewidth', '1', '-draw', draw, '-crop', crop, `/tmp/room-city-${name}-calibration.png`]);
  }
  process.exit();
}

if (process.argv.includes('--locate')) {
  const monuments = [
    ['Eiffel', 48.85837, 2.29448, 173.5],
    ['Montparnasse', 48.8421, 2.3219, 148.2],
    ['Hyatt', 48.8805, 2.2845, 251.9],
  ];
  const bearing = (lat, lon, targetLat, targetLon) => Math.atan2((targetLon - lon) * Math.cos(lat * Math.PI / 180), targetLat - lat) * 180 / Math.PI;
  let lat = 48.86, lon = 2.27, span = 0.03, best;
  while (span > 0.000001) {
    best = { error: Infinity };
    for (let i = -20; i <= 20; i++) for (let j = -20; j <= 20; j++) {
      const a = lat + span * i / 20, b = lon + span * j / 20;
      const rotations = monuments.map(([, x, y, az]) => az + bearing(a, b, x, y));
      const rotation = rotations.reduce((sum, value) => sum + value) / rotations.length;
      const error = rotations.reduce((sum, value) => sum + (value - rotation) ** 2, 0);
      if (error < best.error) best = { lat: a, lon: b, rotation, error };
    }
    ({ lat, lon } = best); span /= 10;
  }
  console.log(best);
  for (const [name, a, b] of [['BnF', 48.8339, 2.3758], ['Duo', 48.8212, 2.3765], ['Bercy', 48.8385, 2.3784], ['Arc', 48.8738, 2.295]]) {
    const az = best.rotation - bearing(lat, lon, a, b);
    console.log(name, { az, x8k: az / 360 * 7978 });
  }
  process.exit();
}

(async () => {
  const browser = await launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1496, height: 873 });
    const errors = [];
    const capture = async (path, azimuth, elevation = -2.2, fov = 6) => {
      const data = await page.evaluate(({ azimuth, elevation, fov }) => {
        let scene = window.__THREE_SCENE__;
        const camera = scene.__r3f.root.getState().camera.clone();
        camera.position.set(-1800, 1500, -1800);
        camera.lookAt(150, 0, 150);
        if (azimuth !== undefined) {
          const sky = scene.getObjectByName('SkySphere');
          scene = sky;
          const az = azimuth * Math.PI / 180, el = elevation * Math.PI / 180;
          camera.position.copy(sky.position);
          camera.lookAt(sky.position.x - Math.cos(az) * Math.cos(el) * 1000,
            sky.position.y + Math.sin(el) * 1000, sky.position.z + Math.sin(az) * Math.cos(el) * 1000);
          camera.fov = fov; camera.updateProjectionMatrix();
        }
        const trace = scene.getObjectByName('SeineDebugTrace');
        const traceVisible = trace?.visible;
        if (trace && azimuth !== undefined) trace.visible = false;
        window.__THREE_GL__.render(scene, camera);
        if (trace) trace.visible = traceVisible;
        return window.__THREE_GL__.domElement.toDataURL('image/png').split(',')[1];
      }, { azimuth, elevation, fov });
      fs.writeFileSync(path, Buffer.from(data, 'base64'));
    };
    page.on('pageerror', error => errors.push(error.message));
    const base = process.env.ROOM_TEST_URL || 'http://127.0.0.1:5173';
    await page.goto(`${base}/?target=studio&skipIntro=1&characterCount=0&animals=0&robots=0&seineDebugPath=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__THREE_SCENE__?.getObjectByName('SeineDebugTrace'), { timeout: 120000 });
    await page.evaluate(async () => {
      const { simulationClock } = await import('/src/features/scene/ai/laraLifeStore.ts');
      simulationClock.minutes = 240;
      window.__THREE_SCENE__.__r3f.root.getState().invalidate();
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await capture('/tmp/room-seine-day.png');
    const day = await page.evaluate(() => window.__THREE_SCENE__.getObjectByName('MontparnasseLights').visible);
    assert.equal(day, false);
    await page.evaluate(async () => {
      const { simulationClock } = await import('/src/features/scene/ai/laraLifeStore.ts');
      simulationClock.minutes = 900;
      window.__THREE_SCENE__.__r3f.root.getState().invalidate();
    });
    await page.waitForFunction(() => window.__THREE_SCENE__.getObjectByName('MontparnasseLights').visible);
    await capture('/tmp/room-seine-night.png');
    await capture('/tmp/room-bnf-night.png', 156.2);
    await capture('/tmp/room-arc-night.png', 226.2, -6.5);
    await capture('/tmp/room-city-night.png', 174, -13, 42);
    await capture('/tmp/room-champ-night.png', 165, -10, 12);
    await capture('/tmp/room-avenues-night.png', 227, -13, 15);
    await capture('/tmp/room-eiffel-night.png', 173.6, -5.8, 17);
    await capture('/tmp/room-bois-night.png', 325, -8, 65);
    assert.deepEqual(errors, []);
    console.log('PASS: day/night visibility, no browser exceptions. Screenshots: /tmp/room-seine-{day,night}.png');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
