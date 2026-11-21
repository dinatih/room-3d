const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const launchBrowser = require('./browser-test-options.cjs');

(async () => {
  const { createServer } = await import(pathToFileURL(require.resolve('vite')));
  const server = await createServer({ root: path.resolve(__dirname, '..'), server: { host: '127.0.0.1', port: 0 } });
  let browser;
  try {
    await server.listen();
    browser = await launchBrowser({ args: ['--no-sandbox'], defaultViewport: { width: 640, height: 480 } });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (['localhost', '127.0.0.1'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol)) request.continue();
      else request.abort();
    });
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/tests/fixtures/zone-camera-shortcuts/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.cameraTestState?.().controls);
    const state = () => page.evaluate(() => {
      const { camera, controls } = window.cameraTestState();
      const store = window.useSceneStore.getState();
      return { projection: store.cameraProjection, ortho: !!camera.isOrthographicCamera, mode: store.orbitMouseMode,
        position: camera.position.toArray(), target: controls.target.toArray(), distance: camera.position.distanceTo(controls.target) };
    });
    await page.keyboard.press('t');
    assert.equal((await state()).mode, 'translate');
    await page.keyboard.press('r');
    assert.equal((await state()).mode, 'rotate');
    await page.keyboard.press('o');
    await page.waitForFunction(() => window.cameraTestState().camera.isOrthographicCamera);
    assert.equal((await state()).projection, 'ortho');
    await page.keyboard.press('p');
    await page.waitForFunction(() => window.cameraTestState().camera.isPerspectiveCamera);
    await page.keyboard.down('Alt'); await page.keyboard.press('Digit1'); await page.keyboard.up('Alt');
    const north = await state();
    assert(north.position.every(Number.isFinite));
    assert(north.position[2] < north.target[2]);
    await page.keyboard.press('Numpad1');
    await page.waitForFunction(() => window.cameraTestState().camera.isOrthographicCamera);
    await page.keyboard.press('Numpad5');
    await page.waitForFunction(() => window.cameraTestState().camera.isPerspectiveCamera);
    await page.keyboard.down('Alt'); await page.keyboard.press('o'); await page.keyboard.up('Alt');
    const reset = await state();
    assert(reset.position[0] > reset.target[0] && reset.position[2] > reset.target[2]);
    await page.keyboard.down('PageUp');
    await new Promise(resolve => setTimeout(resolve, 120));
    await page.keyboard.up('PageUp');
    assert((await state()).distance < reset.distance);
    await page.keyboard.press('h');
    assert.equal(await page.$eval('#performance', element => element.textContent), 'false');
    await page.keyboard.press('h');
    assert.equal(await page.$eval('#performance', element => element.textContent), 'true');
    const beforeTyping = await state();
    await page.focus('#search');
    await page.keyboard.type('rtoph');
    const afterTyping = await state();
    assert.equal(afterTyping.mode, beforeTyping.mode);
    assert.equal(afterTyping.projection, beforeTyping.projection);
    assert.equal(await page.$eval('#search', element => element.value), 'rtoph');
    assert.equal(await page.$eval('#performance', element => element.textContent), 'true');
    assert.deepEqual(errors, []);
    console.log('OK: R/T, O/P, Alt+1, numpad views, Alt+O, PageUp, H and typing isolation.');
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
