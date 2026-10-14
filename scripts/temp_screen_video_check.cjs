const launchBrowser = require('./browser-test-options.cjs');
const puppeteer = require('puppeteer');
const assert = require('node:assert/strict');
(async () => {
 const browser = await launchBrowser({ headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
 try {
  for (const mobile of [false, true]) {
   const page = await browser.newPage();
   await page.setViewport({ width: mobile ? 390 : 1280, height: 900 });
   const requests = [];
   const errors = [];
   page.on('request', r => { if (r.url().includes('/videos/')) requests.push(r.url()); });
   page.on('pageerror', e => { errors.push(e.message); console.error(e.message); });
   await page.goto('http://127.0.0.1:5173/scripts/temp_screen_video_harness.html');
   await page.waitForFunction(() => window.results?.first && document.querySelector('#screen-video-quality'));
   assert.equal(await page.$eval('#screen-video-quality', e => e.value), mobile ? 'ld' : 'hd');
   assert.equal(requests.length, 0, 'inactive screens must not fetch video');
   await page.click('#screen-videos-enabled');
   await page.evaluate(() => window.store.getState().triggerAction('desk2-screen-toggle', true));
   await new Promise(r => setTimeout(r, 300));
   assert.equal(requests.length, 0, 'disabled screens must not fetch video, even when requested');
   await page.click('#screen-videos-enabled');
   await page.waitForFunction(() => window.results.first.texture?.image.videoWidth > 0 && !window.results.first.texture.image.paused);
   assert.deepEqual(await page.evaluate(() => {
    const a = window.results.first, b = window.results.second;
    window.oldVideo = a.texture.image; window.oldTexture = a.texture;
    return [a.texture === b.texture, a.texture.image.videoWidth, a.texture.image.videoHeight];
   }), [true, mobile ? 640 : 1280, mobile ? 428 : 854]);
   await page.evaluate(() => window.setSecond(false));
   await new Promise(r => setTimeout(r, 100));
   assert.equal(await page.evaluate(() => window.oldVideo.paused), false, 'remaining screen keeps shared video playing');
   await page.select('#screen-video-quality', mobile ? 'hd' : 'ld');
   await page.waitForFunction(() => window.results.first.texture?.image.videoWidth > 0 && window.results.first.texture !== window.oldTexture);
   assert.deepEqual(await page.evaluate(() => [window.oldVideo.paused, window.oldVideo.getAttribute('src'), window.results.first.texture.image.videoWidth]), [true, null, mobile ? 1280 : 640]);
   await page.evaluate(() => { window.lastVideo = window.results.first.texture.image; window.disposed = false; window.results.first.texture.addEventListener('dispose', () => window.disposed = true); });
   await page.click('#screen-videos-enabled');
   await page.waitForFunction(() => !window.results.first.isVideoActive && window.disposed);
   assert.deepEqual(await page.evaluate(() => [window.lastVideo.paused, window.lastVideo.getAttribute('src'), document.querySelector('#screen-video-quality').disabled]), [true, null, true]);
   assert.deepEqual(errors, []);
   console.log(`${mobile ? 'Mobile' : 'Desktop'}: default quality, lazy loading, shared playback, quality switch and full disable passed.`);
   await page.close();
  }
 } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
