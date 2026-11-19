// Exploratory comparison, not a historical regression verdict.
// node scripts/profile-lara-inventory.cjs --hardware-gpu [--studio] [--smoke]
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const launchBrowser = require('./browser-test-options.cjs');
const project = path.resolve(__dirname, '..');
const studio = process.argv.includes('--studio');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'room-lara-perf-'));

(async () => {
  const { createServer } = await import(pathToFileURL(require.resolve('vite')));
  const server = await createServer({ root: project, server: { host: '127.0.0.1', port: 0 } });
  let browser;
  let page;
  try {
    await server.listen();
    const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
    browser = await launchBrowser({ args: ['--no-sandbox'], defaultViewport: { width: 1496, height: 900 } });
    page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.stack));
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (['localhost', '127.0.0.1'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol)) request.continue();
      else request.abort();
    });
    const route = studio
      ? '/?skipIntro=1&characterCount=1&inventory=1&item=native&bnfMarker=0&furniture=0&decor=0&furnishings=0&animals=0&shadows=0'
      : '/tests/fixtures/lara-inventory/index.html';
    await page.goto(origin + route, { waitUntil: 'domcontentloaded' });
    if (studio) {
      await page.evaluate(async () => {
        window.anim = (await import('/src/features/inventory/useAnimPreviewStore.ts')).useAnimPreviewStore;
        window.store = (await import('/src/features/scene/store/useSceneStore.ts')).useSceneStore;
        Object.defineProperty(window, 'preview', { get: () => ({ gl: window.__THREE_GL__, scene: window.__THREE_SCENE__ }) });
      });
    }
    await page.waitForFunction(() => {
      const canvas = document.querySelector('.inventory-preview-renderer canvas');
      return canvas && window.preview?.gl?.domElement === canvas && window.anim?.getState().currentTime > 1
        && !document.getElementById('loading');
    }, { timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    const initial = await page.evaluate(() => ({ layers: window.store.getState().layers, shadows: window.preview.gl.shadowMap.enabled }));
    const client = await page.createCDPSession();
    await client.send('Profiler.enable');
    await client.send('Profiler.start');
    const results = [];
    const modes = process.argv.includes('--smoke') ? ['baseline'] : ['baseline', 'paused', 'noShadows', 'noPhysics', 'noAccessories', 'baselineRepeat'];
    for (const mode of modes) {
      await page.evaluate(({ mode, initial }) => {
        const { anim, store, preview } = window;
        store.getState().setLayers({
          hairPhysics: mode === 'noPhysics' ? false : initial.layers.hairPhysics,
          breastPhysics: mode === 'noPhysics' ? false : initial.layers.breastPhysics,
          accessories: mode === 'noAccessories' ? false : initial.layers.accessories,
        });
        preview.gl.shadowMap.enabled = mode === 'noShadows' ? false : initial.shadows;
        if (mode === 'paused') anim.getState().pause(); else anim.getState().play();
      }, { mode, initial });
      // Let React commit the changed layers before measuring.
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const measurement = await page.evaluate(async () => {
        const intervals = [];
        let previous;
        await new Promise(resolve => {
          function frame(time) {
            if (previous !== undefined) intervals.push(time - previous);
            previous = time;
            if (intervals.length < 240) requestAnimationFrame(frame); else resolve();
          }
          requestAnimationFrame(frame);
        });
        const { gl } = window.preview;
        const context = gl.getContext();
        const extension = context.getExtension('WEBGL_debug_renderer_info');
        const sorted = [...intervals].sort((a, b) => a - b);
        return {
          fps: 1000 * intervals.length / intervals.reduce((sum, value) => sum + value, 0),
          p95FrameMs: sorted[Math.ceil(sorted.length * 0.95) - 1],
          render: { ...gl.info.render }, memory: { ...gl.info.memory },
          dpr: gl.getPixelRatio(), width: gl.domElement.width, height: gl.domElement.height,
          animationTime: window.anim.getState().currentTime,
          gpu: extension ? context.getParameter(extension.UNMASKED_RENDERER_WEBGL) : context.getParameter(context.RENDERER),
        };
      });
      results.push({ mode, ...measurement });
      console.log(JSON.stringify(results.at(-1)));
    }
    await page.evaluate(() => window.anim.getState().pause());
    const frameInput = 'input[aria-label="Frame courante"]';
    await page.focus(frameInput);
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.type('30');
    await page.keyboard.press('Enter');
    await page.$eval(frameInput, input => input.blur());
    const seekTime = await page.evaluate(() => window.anim.getState().currentTime);
    if (Math.abs(seekTime - 1) > 0.001) throw new Error(`Frame 30 seek failed: ${seekTime}s`);
    await page.evaluate(() => window.anim.getState().play());
    await page.waitForFunction(() => window.anim.getState().currentTime > 1.1);
    console.log('Frame input seek and playback: OK');
    const { profile } = await client.send('Profiler.stop');
    fs.writeFileSync(path.join(output, 'cpu.cpuprofile'), JSON.stringify(profile));
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ studio, results, errors }, null, 2));
    if (errors.length) throw new Error(`Browser errors: ${errors.join('\n')}`);
    console.log(`Results: ${output}`);
  } catch (error) {
    if (page && !page.isClosed()) {
      const state = await page.evaluate(() => ({
        loading: document.getElementById('loading-item')?.textContent,
        animationTime: window.anim?.getState().currentTime,
        previewCanvas: Boolean(document.querySelector('.inventory-preview-renderer canvas')),
      }));
      fs.writeFileSync(path.join(output, 'failure.json'), JSON.stringify({ error: String(error), state }, null, 2));
      console.error('Readiness failure:', state, 'Artifacts:', output);
    }
    throw error;
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
