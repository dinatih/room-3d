const launch = require('./browser-test-options.cjs');
(async () => {
  if (process.argv.includes('--inspect')) {
    const log = require('node:fs').readFileSync('/tmp/room-debug-studio-browser.log', 'utf8');
    const browser = await require('puppeteer').connect({ browserWSEndpoint: log.match(/ws:\/\/[^\s]+/)[0] });
    const page = (await browser.pages()).at(-1);
    console.log(await page.evaluate(() => ({ title: document.title, text: document.body.innerText.slice(-1500), images: [...document.images].map(image => image.src.slice(0, 90)) })));
    await page.screenshot({ path: '/tmp/room-raytracing-debug-loading.png' });
    browser.disconnect(); return;
  }
  const browser = await launch({ args: ['--enable-gpu', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    await page.goto('http://localhost:5173/?raytracing=debug&target=studio&projection=persp&cameraMovement=fix&skipIntro=1&characters=0&character=0&animals=0&robots=0&environment=0&bnfMarker=0&bermudaGrass=0&laraLife=0');
    await page.waitForFunction(() => [...document.querySelectorAll('img')].some(image => image.src.startsWith('data:image/png')), { timeout: 240000 });
    await page.screenshot({ path: '/tmp/room-raytracing-debug-studio.png' });
    const image = await page.$('img[src^="data:image/png"]');
    if (image) await image.screenshot({ path: '/tmp/room-raytracing-debug-raster.png' });
    console.log('Studio réel capturé : /tmp/room-raytracing-debug-studio.png');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
