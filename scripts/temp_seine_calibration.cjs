const assert = require('node:assert/strict');
const fs = require('node:fs');
const launch = require('./browser-test-options.cjs');

(async () => {
  const browser = await launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1496, height: 873 });
    const errors = [];
    const capture = async path => {
      const data = await page.evaluate(() => {
        const scene = window.__THREE_SCENE__;
        const camera = scene.__r3f.root.getState().camera.clone();
        camera.position.set(-1800, 1500, -1800);
        camera.lookAt(150, 0, 150);
        window.__THREE_GL__.render(scene, camera);
        return window.__THREE_GL__.domElement.toDataURL('image/png').split(',')[1];
      });
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
    assert.deepEqual(errors, []);
    console.log('PASS: day/night visibility, no browser exceptions. Screenshots: /tmp/room-seine-{day,night}.png');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
