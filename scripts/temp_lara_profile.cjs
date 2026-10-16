const fs = require('node:fs');
const { spawn } = require('node:child_process');
const launch = require('./browser-test-options.cjs');
const out = '/tmp/room-lara-profile';
const delay = ms => new Promise(r => setTimeout(r, ms));
(async () => {
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
    for (const condition of ['animated', 'paused', 'paused-no-blur', 'animated-no-blur', 'animated-blur-restored']) {
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
    fs.writeFileSync(`${out}/summary.json`, JSON.stringify({ results, errors }, null, 2));
  } finally { await browser?.close(); server?.kill(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
