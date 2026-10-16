const fs = require('node:fs');
const { spawn } = require('node:child_process');
const launch = require('./browser-test-options.cjs');
const verify = process.argv.includes('--verify-no-blur');
const isolate = process.argv.includes('--isolate-blur');
const out = verify ? '/tmp/room-lara-no-blur' : isolate ? '/tmp/room-lara-blur-isolation' : '/tmp/room-lara-profile';
const delay = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  if (process.argv.includes('--scene-comparison')) return await compareScene();
  fs.mkdirSync(out, { recursive: true });
  let server, browser;
  try {
    try { await fetch('http://localhost:5173'); } catch {
      server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1'], { stdio: 'ignore' });
      for (let i = 0; i < 100; i++) {
        await delay(300);
        try { await fetch('http://localhost:5173'); break; } catch { if(i === 99) throw Error('Vite unavailable'); }
      }
    }
    browser = await launch({ args: ['--no-sandbox', '--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan,VulkanFromANGLE', '--disable-vulkan-surface'] });
    const system = await browser.target().createCDPSession();
    const gpu = await system.send('SystemInfo.getInfo');
    fs.writeFileSync(`${out}/gpu.json`, JSON.stringify(gpu, null, 2));
    console.log('GPU', JSON.stringify(gpu.gpu.devices));
    const page = await browser.newPage();
    await page.setViewport({ width: 1362, height: 810, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto('http://localhost:5173/?inventory=characters', { waitUntil: 'networkidle2', timeout: 120000 });
    await page.waitForSelector('.inventory-item-thumb', { timeout: 120000 });
    await page.evaluate(() => { const thumb = document.querySelector('.inventory-item-thumb'); thumb.click(); });
    await page.waitForSelector('.inventory-preview-renderer canvas', { timeout: 120000 });
    await delay(12000);
    console.log('SELECTION', await page.$eval('.inventory-pane-list', e => e.innerText.slice(0, 500)));
    await page.screenshot({ path: `${out}/preview.png` });
    const client = await page.createCDPSession();
    await client.send('Profiler.enable');
    const results = [];
    let conditions = verify ? ['baseline'] : undefined;
    async function assertNoBackdropFilters(label) {
      const filters = await page.evaluate(() => [...document.querySelectorAll('*')].filter(el => getComputedStyle(el).backdropFilter !== 'none').map(el => ({ tag: el.tagName, classes: el.className, filter: getComputedStyle(el).backdropFilter })));
      if (filters.length) throw Error(`${label}: remaining backdrop filters: ${JSON.stringify(filters)}`);
      console.log(`${label}: no backdrop filters`);
    }
    if (verify) await assertNoBackdropFilters('inventory');
    if (isolate) {
      const elements = await page.evaluate(() => [...document.querySelectorAll('*')].filter(el => {
        const css = getComputedStyle(el), rect = el.getBoundingClientRect();
        return css.backdropFilter !== 'none' && rect.width > 0 && rect.height > 0 && css.visibility !== 'hidden';
      }).map((el, index) => {
        el.dataset.profileBlur = String(index);
        const css = getComputedStyle(el), rect = el.getBoundingClientRect();
        return { index, tag: el.tagName, classes: el.className, blur: css.backdropFilter, width: rect.width, height: rect.height };
      }));
      fs.writeFileSync(`${out}/elements.json`, JSON.stringify(elements, null, 2));
      console.log('BLUR ELEMENTS', JSON.stringify(elements));
      conditions = ['baseline', ...elements.map(el => `disable-${el.index}`), 'disable-overlay-modal', 'disable-all', 'baseline-restored'];
    }
    for (const condition of conditions || ['animated', 'paused', 'paused-no-blur', 'animated-no-blur', 'animated-blur-restored']) {
      if (isolate) {
        await page.evaluate(() => document.getElementById('profile-isolate-blur')?.remove());
        const selector = condition.startsWith('disable-') && /^disable-\d+$/.test(condition) ? `[data-profile-blur="${condition.slice(8)}"]` : condition === 'disable-overlay-modal' ? '.inventory-overlay, .inventory-modal' : condition === 'disable-all' ? '*' : null;
        if (selector) await page.addStyleTag({ content: `${selector} { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }` }).then(handle => handle.evaluate(el => el.id = 'profile-isolate-blur'));
      }
      if (condition === 'paused') await page.evaluate(async () => { const { useAnimPreviewStore } = await import('/src/features/inventory/useAnimPreviewStore.ts'); useAnimPreviewStore.getState().pause(); });
      if (condition === 'paused-no-blur') await page.addStyleTag({ content: '* { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }', id: 'profile-disable-blur' }).then(handle => handle.evaluate(el => el.id = 'profile-disable-blur'));
      if (condition === 'animated-no-blur') await page.evaluate(async () => { const { useAnimPreviewStore } = await import('/src/features/inventory/useAnimPreviewStore.ts'); useAnimPreviewStore.getState().play(); });
      if (condition === 'animated-blur-restored') await page.evaluate(() => document.getElementById('profile-disable-blur').remove());
      await delay(2000);
      await client.send('Profiler.start');
      const metrics = await page.evaluate(() => new Promise(resolve => {
        const frames = []; let prev; const start = performance.now();
        const tick = now => { if(prev !== undefined) frames.push(now-prev); prev = now;
          if(now-start < 10000) return requestAnimationFrame(tick);
          const sorted = [...frames].sort((a,b) => a-b);
          const gl = window.__THREE_GL__;
          const debug = gl?.getContext().getExtension('WEBGL_debug_renderer_info');
          resolve({ frames: frames.length, fps: frames.length * 1000 / frames.reduce((a,b)=>a+b,0), p50: sorted[Math.floor(sorted.length*.5)], p95: sorted[Math.floor(sorted.length*.95)], p99: sorted[Math.floor(sorted.length*.99)], over25ms: frames.filter(x=>x>25).length, render: gl?.info.render, renderer: debug ? gl.getContext().getParameter(debug.UNMASKED_RENDERER_WEBGL) : null });
        }; requestAnimationFrame(tick);
      }));
      const { profile } = await client.send('Profiler.stop');
      fs.writeFileSync(`${out}/${condition}.cpuprofile`, JSON.stringify(profile));
      const nodes = new Map(profile.nodes.map(n=>[n.id,n])); const costs = new Map();
      (profile.samples || []).forEach((id,i) => { const frame = nodes.get(id).callFrame; const key = `${frame.functionName || '(anonymous)'} ${frame.url}:${frame.lineNumber+1}`; costs.set(key, (costs.get(key)||0)+(profile.timeDeltas[i]||0)); });
      const top = [...costs].sort((a,b)=>b[1]-a[1]).slice(0,25).map(([name,us])=>({name,ms:Math.round(us/1000)}));
      results.push({ condition, ...metrics, top });
      console.log(JSON.stringify(results.at(-1), null, 2));
    }
    if (verify) {
      await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForSelector('canvas', { timeout: 120000 });
      await delay(5000);
      await assertNoBackdropFilters('scene');
    }
    fs.writeFileSync(`${out}/summary.json`, JSON.stringify({ results, errors }, null, 2));
  } finally { await browser?.close(); server?.kill(); }
})().catch(e => { console.error(e); process.exitCode = 1; });


// Serve historical UI sources in memory: never replace the working tree.
async function compareScene() {
  const { createServer } = await import('vite');
  const { execFileSync } = require('node:child_process');
  const path = require('node:path');
  const directory = '/tmp/room-scene-backdrop-comparison';
  fs.mkdirSync(directory, { recursive: true });
  const files = execFileSync('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', '5ec34fe7'], { encoding: 'utf8' }).trim().split('\n').filter(file => file.startsWith('src/'));
  const historical = new Map(files.map(file => [path.resolve(file), execFileSync('git', ['show', `824b2903:${file}`], { encoding: 'utf8' })]));
  const servers = []; let browser;
  const results = [], errors = [];
  try {
    for (const old of [true, false]) {
      const server = await createServer({
        server: { host: '127.0.0.1', port: old ? 5184 : 5185, strictPort: true },
        plugins: old ? [{ name: 'historical-backdrop-sources', enforce: 'pre', load(id) { return historical.get(id.split('?')[0]); } }] : [],
      });
      await server.listen(); servers.push(server);
    }
    browser = await launch({ args: ['--no-sandbox', '--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan,VulkanFromANGLE', '--disable-vulkan-surface'] });
    const system = await browser.target().createCDPSession();
    fs.writeFileSync(`${directory}/gpu.json`, JSON.stringify(await system.send('SystemInfo.getInfo'), null, 2));
    const page = await browser.newPage();
    await page.setViewport({ width: 1362, height: 810, deviceScaleFactor: 1 });
    page.on('pageerror', error => errors.push(String(error)));
    // ABBA order controls for a gradual change in load or temperature.
    for (const [index, old] of [true, false, false, true].entries()) {
      await page.goto(`http://127.0.0.1:${old ? 5184 : 5185}/?skipIntro=1`, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForFunction(async () => {
        const { cameraState } = await import('/src/features/scene/cameraState.ts');
        return cameraState.isSceneLaunched && !cameraState.isIntroRunning && !!window.__THREE_GL__;
      }, { timeout: 180000 });
      await page.evaluate(async () => {
        const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
        const { cameraState } = await import('/src/features/scene/cameraState.ts');
        useSceneStore.getState().setCameraMovement('fix');
        useSceneStore.setState(state => ({ layers: { ...state.layers, groundType: 'bermuda' } }));
        window.__sceneProfileActivity = setInterval(() => { window.dispatchEvent(new MouseEvent('mousemove')); cameraState.invalidate(); }, 1000);
        const forceFrame = () => { cameraState.invalidate(); window.__sceneProfileRaf = requestAnimationFrame(forceFrame); };
        forceFrame();
      });
      await delay(12000);
      const metrics = await page.evaluate(async () => {
        const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
        const state = useSceneStore.getState();
        const filters = [...document.querySelectorAll('*')].filter(el => {
          const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).backdropFilter !== 'none';
        }).map(el => ({ classes: typeof el.className === 'string' ? el.className : '', filter: getComputedStyle(el).backdropFilter }));
        const gl = window.__THREE_GL__, scene = window.__THREE_SCENE__, originalRender = gl.render;
        const rendered = []; let cameraPose;
        gl.render = function(s, camera) {
          if (s === scene && this.getRenderTarget() === null) {
            rendered.push(performance.now());
            cameraPose = { position: camera.position.toArray(), quaternion: camera.quaternion.toArray() };
          }
          return originalRender.call(this, s, camera);
        };
        const start = performance.now();
        await new Promise(resolve => { const tick = now => now-start < 10000 ? requestAnimationFrame(tick) : resolve(); requestAnimationFrame(tick); });
        gl.render = originalRender;
        const intervals = rendered.slice(1).map((time,i) => time-rendered[i]);
        if (!intervals.length) throw Error('No main-scene frames recorded');
        const sorted = [...intervals].sort((a,b)=>a-b);
        const debug = gl.getContext().getExtension('WEBGL_debug_renderer_info');
        return { fps: intervals.length*1000/intervals.reduce((a,b)=>a+b,0), frames: rendered.length, p50: sorted[Math.floor(sorted.length*.5)], p95: sorted[Math.floor(sorted.length*.95)], p99: sorted[Math.floor(sorted.length*.99)], over25ms: intervals.filter(ms=>ms>25).length, cameraPose, filters, render: {...gl.info.render}, layers: state.layers, renderer: debug ? gl.getContext().getParameter(debug.UNMASKED_RENDERER_WEBGL) : null };
      });
      if (old && !metrics.filters.length) throw Error('Historical version has no active backdrop filters');
      if (!old && metrics.filters.length) throw Error('Current version still has active backdrop filters');
      results.push({ version: old ? 'before-with-blur' : 'after-no-blur', run: index+1, ...metrics });
      console.log(JSON.stringify(results.at(-1), null, 2));
      await page.screenshot({ path: `${directory}/${index+1}-${old ? 'before' : 'after'}.png` });
      await page.goto('about:blank');
    }
    fs.writeFileSync(`${directory}/summary.json`, JSON.stringify({ viewport: { width: 1362, height: 810, dpr: 1 }, method: 'ABBA, fixed camera, continuous scene invalidation, 12s warmup then 10s sampling of main-scene renders', results, errors }, null, 2));
  } finally { await browser?.close(); await Promise.all(servers.map(server => server.close())); }
}
