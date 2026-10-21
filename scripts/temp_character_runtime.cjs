const fs = require('node:fs');
const path = require('node:path');
const launch = require('./browser-test-options.cjs');
const root = process.cwd();
const baseline = '/tmp/room-character-runtime-baseline';
const option = (key, fallback) => process.argv.find(arg => arg.startsWith(`--${key}=`))?.split('=').slice(1).join('=') ?? fallback;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
if (process.argv.includes('--compare')) {
  for (const label of ['production-before-valid', 'production-after']) {
    const report = JSON.parse(fs.readFileSync(`/tmp/room-character-runtime-${label}/report.json`));
    for (const run of report.runs) for (const [index,capture] of run.captures.entries()) {
      const rss = capture.memory.map(m=>m.rssBytes), metrics = capture.timings;
      console.log(JSON.stringify({ label, index, ...capture.summary,
        fps:1000*capture.frames.length/capture.frames.reduce((n,ms)=>n+ms,0),
        rssGiB:[Math.min(...rss),Math.max(...rss),rss.at(-1)].map(n=>n/1024**3), heapMiB:capture.heap/1024**2,
        simulationMax:metrics?.simulation.maxMs, animationMax:metrics?.animation.maxMs,
        resources:metrics?.resources, queued:metrics?.navigation.queued,
        largestTasks: [...capture.tasks].sort((a,b)=>b.ms-a.ms).slice(0,4),
      }));
    }
  }
  process.exit(0);
}
if (process.argv.includes('--test-report')) {
  const latest = fs.readdirSync('test-results').filter(name => name.endsWith('-studio')).sort().at(-1);
  const report = JSON.parse(fs.readFileSync(`test-results/${latest}/report.json`));
  console.log(latest);
  for (const result of report.results) console.log(result.id, result.status, result.error ?? '', result.errors?.slice(0, 2));
  process.exit(0);
}
if (process.argv.includes('--report')) {
  const directory = `/tmp/room-character-runtime-${option('label', 'before')}`;
  const report = JSON.parse(fs.readFileSync(`${directory}/report.json`));
  for (const run of report.runs) for (const [index, capture] of run.captures.entries()) {
    const timings = capture.timings ? { ...capture.timings, agents: undefined } : undefined;
    const samples = capture.memory?.filter(m=>m.agents) ?? [], changed = new Set();
    for (const sample of samples.slice(1)) for (const [id, pose] of Object.entries(sample.agents)) if (JSON.stringify(pose) !== JSON.stringify(samples[0].agents[id])) changed.add(id);
    const rss = (capture.memory ?? []).map(m=>m.rssBytes);
    console.log(report.label, run.count, index, capture.summary, 'timings', timings, 'tasks', capture.tasks.length, 'maxTask', Math.max(0,...capture.tasks.map(t=>t.ms)), 'heap', capture.heap, 'RSS', rss.length ? [Math.min(...rss),Math.max(...rss),rss.at(-1)] : [], 'actorsChanged', [...changed]);
    const file = `${directory}/${run.count}-${index}.cpuprofile`;
    if (!fs.existsSync(file)) continue;
    const profile = JSON.parse(fs.readFileSync(file)), nodes = new Map(profile.nodes.map(n=>[n.id,n])), parent = new Map(), totals = new Map();
    for (const node of profile.nodes) for (const child of node.children ?? []) parent.set(child,node.id);
    for (const [i,sample] of (profile.samples ?? []).entries()) {
      let id = sample;
      while (id !== undefined) { totals.set(id,(totals.get(id)??0)+(profile.timeDeltas[i]??0)); id=parent.get(id); }
    }
    console.log('CPU', [...totals].filter(([id])=>nodes.get(id).callFrame.url.includes('/src/') || ['update', 'updateMatrixWorld', '(garbage collector)'].includes(nodes.get(id).callFrame.functionName)).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([id,us])=>({fn:nodes.get(id).callFrame.functionName,url:nodes.get(id).callFrame.url,ms:us/1000})));
    console.log('PREPARATION CPU', [...totals].filter(([id])=>/parse|compileShader|buildShader|setProgram|readPixels|loadAnimation|loadSkin|computeBounding|computeVertex|prepare|clone|garbage collector/i.test(nodes.get(id).callFrame.functionName)).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([id,us])=>({fn:nodes.get(id).callFrame.functionName,ms:us/1000})));
  }
  process.exit(0);
}
if (process.argv.includes('--inspect')) {
  (async () => {
    const log = fs.readFileSync(`/tmp/room-character-runtime-${option('label', 'before')}.log`, 'utf8');
    const endpoint = [...log.matchAll(/DevTools listening on (ws:\/\/\S+)/g)].at(-1)[1];
    const browser = await require('puppeteer').connect({ browserWSEndpoint: endpoint });
    try {
      const pages = await browser.pages();
      const page = pages.find(p => p.url().includes('5198'));
      console.log(await page.evaluate(async production => {
        if (production) {
          const models = [];
          window.__THREE_SCENE__?.traverse(node => { if (node.userData.gltfPath?.includes('characters/')) models.push({ path: node.userData.gltfPath, visible: node.parent.parent.visible, position: node.parent.parent.position.toArray() }); });
          const camera = window.__PROFILE_CAMERA__;
          return { models: models.filter(model=>!/characters\/(accessories|wigs)\//.test(model.path)), camera: camera ? { mode: camera.mode, launched: camera.isSceneLaunched, intro: camera.isIntroRunning, skip: camera.skipIntro } : null, text: document.body.innerText.slice(0,1500), stats: window.__CHARACTER_RUNTIME_STATS__ };
        }
        const { cameraState } = await import('/src/features/scene/cameraState.ts');
        return { positions: cameraState.positions, launched: cameraState.isSceneLaunched, text: document.body.innerText.slice(0,1500), stats: window.__CHARACTER_RUNTIME_STATS__ };
      }, process.argv.includes('--production')));
    } finally { browser.disconnect(); }
  })().catch(e => { console.error(e); process.exitCode = 1; });
  return;
}
if (process.argv.includes('--stop')) {
  const processes = fs.readdirSync('/proc').filter(name => /^\d+$/.test(name)).flatMap(name => {
    try { return [{ pid: Number(name), ppid: Number(fs.readFileSync(`/proc/${name}/status`, 'utf8').match(/^PPid:\s+(\d+)/m)[1]), cmd: fs.readFileSync(`/proc/${name}/cmdline`, 'utf8').replaceAll('\0', ' ') }]; }
    catch { return []; }
  });
  const ids = new Set(processes.filter(p => p.pid !== process.pid && /^node scripts\/temp_character_runtime.cjs /.test(p.cmd)).map(p => p.pid));
  let previous;
  do { previous = ids.size; for (const p of processes) if (ids.has(p.ppid)) ids.add(p.pid); } while (previous !== ids.size);
  for (const pid of [...ids].reverse()) { try { process.kill(pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; } }
  process.exit(0);
}
if (process.argv.includes('--snapshot')) {
  if (fs.existsSync(baseline)) throw Error('Baseline snapshot already exists: '+baseline);
  fs.cpSync(path.join(root, 'src'), path.join(baseline, 'src'), { recursive: true, errorOnExist: true, force: false });
  process.exit(0);
}
(async () => {
  const label = option('label', 'current');
  const output = `/tmp/room-character-runtime-${label}`;
  fs.mkdirSync(output, { recursive: true });
  const { createServer, preview, build } = await import('vite');
  const baselinePlugin = {
      name: 'runtime-baseline', enforce: 'pre',
      transform(source, id) {
        if (id.endsWith('/src/features/scene/cameraState.ts')) return source + '\nObject.assign(window, { __PROFILE_CAMERA__: cameraState });';
      },
      load(id) {
        if (!process.argv.includes('--baseline') || !id.startsWith(`${root}/src/`) || !/\.[cm]?[jt]sx?$/.test(id)) return;
        const file = path.join(baseline, id.slice(root.length).split('?')[0]);
        if (fs.existsSync(file)) {
          const source = fs.readFileSync(file, 'utf8');
          // Shared prerequisite: raycasting the parachute must include its category layer.
          return id.endsWith('/HeartParachute.tsx') ? source.replace('const ray = new THREE.Raycaster();', 'const ray = new THREE.Raycaster(); ray.layers.enableAll();') : source;
        }
      },
    };
  const dist = process.argv.includes('--baseline') ? '/tmp/room-character-runtime-baseline-dist' : path.join(root, 'dist');
  if (process.argv.includes('--build')) {
    await build({ plugins: [baselinePlugin], worker: { plugins: () => [baselinePlugin] }, build: { outDir: dist, copyPublicDir: false, emptyOutDir: true } });
    for (const name of fs.readdirSync(path.join(root, 'public'))) fs.symlinkSync(path.join(root, 'public', name), path.join(dist, name));
    return;
  }
  const server = process.argv.includes('--production')
    ? await preview({ build: { outDir: dist }, preview: { host: '127.0.0.1', port: 5198, strictPort: true } })
    : await createServer({ server: { host: '127.0.0.1', port: 5198, strictPort: true, hmr: false }, plugins: [baselinePlugin] });
  if (!process.argv.includes('--production')) { await server.listen(); await server.watcher.close(); }
  let browser;
  const report = { label, production: process.argv.includes('--production'), runs: [] };
  const save = () => fs.writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  try {
    for (const count of option('counts', '27').split(',').map(Number)) {
      browser = await launch({ args: ['--no-sandbox', ...(process.argv.includes('--hardware-gpu')
        ? ['--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan,VulkanFromANGLE', '--disable-vulkan-surface']
        : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])], protocolTimeout: 180000 });
      const system = await browser.target().createCDPSession();
      const gpu = await system.send('SystemInfo.getInfo');
      const page = await browser.newPage();
      await page.setViewport({ width: 1362, height: 810, deviceScaleFactor: 1 });
      const run = { count, gpu: gpu.gpu.devices, errors: [], captures: [] };
      report.runs.push(run); save();
      page.on('pageerror', error => { run.errors.push(String(error)); save(); void page.close().catch(() => {}); });
      page.on('console', message => { if (message.type() === 'error') { run.errors.push(message.text()); save(); } });
      await page.evaluateOnNewDocument(() => {
        let seed = 42;
        Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
        window.runtimeFrames = [];
        window.runtimeTasks = [];
        new PerformanceObserver(list => window.runtimeTasks.push(...list.getEntries().map(e => ({ at: e.startTime, ms: e.duration })))).observe({ type: 'longtask', buffered: true });
        let last;
        function tick(now) { if (last !== undefined) window.runtimeFrames.push({ at: now, ms: now - last }); last = now; requestAnimationFrame(tick); }
        requestAnimationFrame(tick);
        setInterval(() => document.dispatchEvent(new MouseEvent('mousemove')), 1000);
      });
      const debug = process.argv.includes('--full-scene') ? '' : 'debug=characters-only&';
      await page.goto(`http://127.0.0.1:5198/?${debug}perfGraph=1&characterCount=${count}&skipIntro=1&mode=top`, { waitUntil: 'domcontentloaded', timeout: 180000 });
      await page.waitForFunction(() => window.__THREE_SCENE__ && window.__THREE_GL__, { timeout: 180000 });
      await page.waitForFunction(count => {
        let loaded = 0;
        window.__THREE_SCENE__.traverse(node => {
          const model = node.userData.gltfPath;
          if (model?.includes('characters/') && !/characters\/(accessories|wigs)\//.test(model)) loaded++;
        });
        return loaded >= count;
      }, { timeout: 180000 }, count);
      // Signal launch after Suspense commits the actual characters and camera controller.
      if (process.argv.includes('--production')) await page.waitForFunction(() => window.__PROFILE_CAMERA__?.mode === 'top', { timeout: 180000 });
      await page.evaluate(() => document.dispatchEvent(new CustomEvent('start-camera-intro', { detail: { skip: true } })));
      // Wait for deployment and the initial asset preparation independently of capture.
      await page.waitForFunction(count => {
        let loaded = 0;
        window.__THREE_SCENE__.traverseVisible(node => {
          const model = node.userData.gltfPath;
          if (model?.includes('characters/') && !/characters\/(accessories|wigs)\//.test(model)) loaded++;
        });
        return loaded >= count;
      }, { timeout: 180000 }, count);
      await sleep(Number(option('warmup', '45000')));
      if (process.argv.includes('--verify-navigation')) {
        run.visibilityVerification = await page.evaluate(async () => {
          const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
          const { cameraState } = await import('/src/features/scene/cameraState.ts');
          const { setAgentProfile, getAgentProfile, removeAgentProfile, furnitureObstacles } = await import('/src/features/scene/ai/navigation/obstacles.ts');
          const { getNavigationGraph } = await import('/src/features/scene/ai/navigation/service.ts');
          const { resolveNavigation } = await import('/src/features/scene/ai/navigation/navigationScope.ts');
          if (!cameraState.isSceneLaunched || !furnitureObstacles.size) throw Error('Scene not ready for visibility verification');
          const id = 'visibility-verification';
          setAgentProfile(id, { radius: 13.3, height: 170 });
          const keys = ['wallStructure','doors','equipment','furniture','furnishings','decor'];
          const original = { ...useSceneStore.getState().layers };
          try {
            if (!keys.every(key=>original[key] === false)) throw Error('Decor must start hidden');
            const before = await resolveNavigation(()=>getNavigationGraph(getAgentProfile(id)));
            useSceneStore.setState(state=>({layers:{...state.layers,...Object.fromEntries(keys.map(key=>[key,true]))}}));
            await new Promise(requestAnimationFrame);
            const shown = await resolveNavigation(()=>getNavigationGraph(getAgentProfile(id)));
            useSceneStore.setState(state=>({layers:{...state.layers,...Object.fromEntries(keys.map(key=>[key,false]))}}));
            await new Promise(requestAnimationFrame);
            const hidden = await resolveNavigation(()=>getNavigationGraph(getAgentProfile(id)));
            if (JSON.stringify(before.obstacles) !== JSON.stringify(shown.obstacles) || JSON.stringify(shown.obstacles) !== JSON.stringify(hidden.obstacles)) throw Error('Visibility changed navigation geometry');
            return { registeredObstacles: furnitureObstacles.size, graphVertices: hidden.vertices.length, sameGeometry: true };
          } finally { useSceneStore.setState({ layers: original }); removeAgentProfile(id); }
        });
        save(); console.log('VISIBILITY VERIFICATION', JSON.stringify(run.visibilityVerification));
      }
      if (process.argv.includes('--verify-animation')) {
        run.animationVerification = await page.evaluate(async () => {
          const { CHARACTERS } = await import('/src/features/scene/characterConfig.ts');
          const { acquireAnimationLibrary, animationLibraryStats } = await import('/src/features/scene/character/animationLibrary.ts');
          const { cacheDynamicGLTF } = await import('/src/features/scene/character/useCharacterAnimations.ts');
          const { getAnimationDef } = await import('/src/features/scene/animations/animationResolver.ts');
          const { retargetClip } = await import('/src/features/scene/retargeting/retargetClip.ts');
          const { captureAnimationRig, restoreAnimationRig } = await import('/src/features/scene/character/animationSerialization.ts');
          const results = [];
          for (const id of ['native', 'alex', 'gloria']) {
            const config = CHARACTERS.find(c => c.id === id);
            let target;
            window.__THREE_SCENE__.traverse(node => { if (node.userData.gltfPath?.replace(/^\//,'') === config.path.replace(/^\//,'') && node.userData.name === config.name) target = node; });
            if (!target) throw Error('Missing verification model: '+id);
            const before = animationLibraryStats();
            const library = acquireAnimationLibrary(target);
            try {
              for (const key of ['idle', 'walk', 'sitting-idle', 'sit-to-stand', 'interx-g004t009a022r004-p1']) {
                const def = getAnimationDef(key);
                if (!def) throw Error('Unknown verification animation: '+key);
                const source = await cacheDynamicGLTF(def.path);
                const raw = source.animations[0].clone(); raw.name = def.id;
                const expected = retargetClip(raw, target, restoreAnimationRig(captureAnimationRig(source.scene)), def.rootMotionSpace);
                const actual = await library.prepare(def.path, def.id, source, def.rootMotionSpace);
                if (actual.tracks.length !== expected.tracks.length) throw Error('Track count changed: '+id+':'+key);
                let maximumError = 0;
                actual.tracks.forEach((track, index) => {
                  const other = expected.tracks[index];
                  if (track.name !== other.name || track.times.length !== other.times.length || track.values.length !== other.values.length) throw Error('Track layout changed: '+id+':'+key);
                  for (let k=0;k<track.times.length;k++) maximumError = Math.max(maximumError,Math.abs(track.times[k]-other.times[k]));
                  for (let k=0;k<track.values.length;k++) maximumError = Math.max(maximumError,Math.abs(track.values[k]-other.values[k]));
                });
                if (!Number.isFinite(maximumError) || maximumError > 1e-5) throw Error('Retargeting changed: '+id+':'+key+' '+maximumError);
                results.push({ id, animation: def.id, tracks: actual.tracks.length, maximumError });
              }
            } finally { library.release(); }
            if (animationLibraryStats().users !== before.users) throw Error('Animation library leaked users');
          }
          return results;
        });
        save(); console.log('ANIMATION VERIFICATION', JSON.stringify(run.animationVerification));
        run.previewVerification = await page.evaluate(async () => (await import('/tests/support/character-preview.mjs')).verifyCharacterPreview());
        save(); console.log('PREVIEW VERIFICATION', JSON.stringify(run.previewVerification));
      }
      const client = await page.createCDPSession();
      for (let capture = 0; capture < Number(option('captures', '3')); capture++) {
        await client.send('Profiler.enable'); await client.send('Profiler.start');
        const start = await page.evaluate(() => {
          const stats = window.__CHARACTER_RUNTIME_STATS__;
          if (stats) {
            stats.frames = 0;
            for (const metric of Object.values(stats)) if (metric && typeof metric === 'object' && 'totalMs' in metric) {
              metric.totalMs = 0; metric.maxMs = 0;
              if ('calls' in metric) metric.calls = 0;
            }
          }
          return performance.now();
        });
        const memory = [], started = performance.now(), duration = Number(option('duration', '120000'));
        while (performance.now() - started < duration) {
          const { processInfo } = await system.send('SystemInfo.getProcessInfo');
          const rss = processInfo.map(process => {
            try { return Number(fs.readFileSync(`/proc/${process.id}/status`, 'utf8').match(/^VmRSS:\s+(\d+)/m)?.[1] ?? 0) * 1024; }
            catch (error) { if (error.code !== 'ENOENT') throw error; return 0; }
          });
          const agents = await page.evaluate(() => window.__CHARACTER_RUNTIME_STATS__?.agents ?? null);
          memory.push({ atMs: performance.now()-started, rssBytes: rss.reduce((n,v)=>n+v,0), agents });
          await sleep(Math.min(10000,Math.max(0,duration-(performance.now()-started))));
        }
        const data = await page.evaluate(start => ({ frames: window.runtimeFrames.filter(f => f.at >= start).map(f => f.ms), tasks: window.runtimeTasks.filter(t => t.at >= start), heap: performance.memory?.usedJSHeapSize, render: window.__THREE_GL__.info.render, timings: window.__CHARACTER_RUNTIME_STATS__, text: document.body.innerText.slice(-500) }), start);
        const { profile } = await client.send('Profiler.stop');
        data.memory = memory;
        fs.writeFileSync(`${output}/${count}-${capture}.cpuprofile`, JSON.stringify(profile));
        const frames = [...data.frames].sort((a, b) => a - b);
        data.summary = { count: frames.length, p50: frames[Math.floor(frames.length * .5)], p95: frames[Math.floor(frames.length * .95)], p99: frames[Math.floor(frames.length * .99)], max: frames.at(-1), over50: frames.filter(ms => ms > 50).length, over100: frames.filter(ms => ms > 100).length };
        run.captures.push(data); save(); console.log(label, count, capture, JSON.stringify(data.summary));
      }
      await browser.close(); browser = undefined;
      if (run.errors.length) throw new Error(run.errors.join('\n'));
    }
  } finally {
    await browser?.close();
    if (server.close) await server.close(); else await new Promise(resolve => server.httpServer.close(resolve));
    save();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
