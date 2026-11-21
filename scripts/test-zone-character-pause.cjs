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
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/tests/fixtures/zone-character-pause/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      let posed = false;
      window.characterScene?.traverse(object => {
        if (object.isBone && object.userData.restQuat && !object.quaternion.equals(object.userData.restQuat)) posed = true;
      });
      return posed;
    }, { timeout: 30000 });
    // Let asynchronous clip preparation finish before testing pose stability.
    await new Promise(resolve => setTimeout(resolve, 1000));
    const snapshot = () => page.evaluate(() => {
      const bones = [];
      window.characterScene.traverse(object => {
        if (object.isBone) bones.push([object.name, ...object.position.toArray(), ...object.quaternion.toArray(), ...object.scale.toArray()]);
      });
      return bones;
    });
    const frozen = await snapshot();
    assert(frozen.length > 0);
    await new Promise(resolve => setTimeout(resolve, 700));
    assert.deepEqual(await snapshot(), frozen, 'Paused zone bones must remain exactly unchanged');
    await page.evaluate(() => window.setCharacterPaused(false));
    await new Promise(resolve => setTimeout(resolve, 700));
    assert.notDeepEqual(await snapshot(), frozen, 'Animation must resume when the pause is removed');
    await page.evaluate(() => window.setCharacterPaused(true));
    await new Promise(resolve => setTimeout(resolve, 100));
    const pausedAgain = await snapshot();
    await new Promise(resolve => setTimeout(resolve, 700));
    assert.deepEqual(await snapshot(), pausedAgain, 'Pausing a running animation must also freeze its physics');
    assert.deepEqual(errors, []);
    console.log(`OK: ${frozen.length} bones frozen, animation resumed, running pose frozen again.`);
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
