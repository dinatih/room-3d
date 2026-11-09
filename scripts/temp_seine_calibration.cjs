const assert = require('node:assert/strict');
const fs = require('node:fs');
const launch = require('./browser-test-options.cjs');

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
  for (const [name, a, b] of [['BnF', 48.8339, 2.3758], ['Duo', 48.8212, 2.3765], ['Arc', 48.8738, 2.295]]) {
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
    const capture = async (path, azimuth) => {
      const data = await page.evaluate(azimuth => {
        let scene = window.__THREE_SCENE__;
        const camera = scene.__r3f.root.getState().camera.clone();
        camera.position.set(-1800, 1500, -1800);
        camera.lookAt(150, 0, 150);
        if (azimuth !== undefined) {
          const sky = scene.getObjectByName('SkySphere');
          scene = sky;
          const az = azimuth * Math.PI / 180, el = -2.2 * Math.PI / 180;
          camera.position.copy(sky.position);
          camera.lookAt(sky.position.x - Math.cos(az) * Math.cos(el) * 1000,
            sky.position.y + Math.sin(el) * 1000, sky.position.z + Math.sin(az) * Math.cos(el) * 1000);
          camera.fov = 6; camera.updateProjectionMatrix();
        }
        window.__THREE_GL__.render(scene, camera);
        return window.__THREE_GL__.domElement.toDataURL('image/png').split(',')[1];
      }, azimuth);
      fs.writeFileSync(path, Buffer.from(data, 'base64'));
    };
    page.on('pageerror', error => errors.push(error.message));
    const base = process.env.ROOM_TEST_URL || 'http://127.0.0.1:5173';
    await page.goto(`${base}/?target=studio&skipIntro=1&characterCount=0&animals=0&robots=0&seineDebugPath=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__THREE_SCENE__?.getObjectByName('SeineDebugTrace'), { timeout: 120000 });
    await page.evaluate(async () => {
      const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
      const { simulationClock } = await import('/src/features/scene/ai/laraLifeStore.ts');
      simulationClock.minutes = 240;
      window.__THREE_SCENE__.__r3f.root.getState().invalidate();
      const state = useSceneStore.getState();
      useSceneStore.setState({ layers: { ...state.layers, eiffelSparkle: false } });
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
    await capture('/tmp/room-arc-night.png', 224.35);
    assert.deepEqual(errors, []);
    console.log('PASS: day/night visibility, no browser exceptions. Screenshots: /tmp/room-seine-{day,night}.png');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
