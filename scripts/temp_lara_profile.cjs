const fs = require('node:fs');
const { spawn } = require('node:child_process');
const launch = require('./browser-test-options.cjs');
const verify = process.argv.includes('--verify-inventory');
const isolate = process.argv.includes('--isolate-blur');
const out = verify ? '/tmp/room-lara-inventory' : isolate ? '/tmp/room-lara-blur-isolation' : '/tmp/room-lara-profile';
const delay = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  if (process.argv.includes('--checks')) return checkBoundsReuse();
  if (process.argv.includes('--scene-profile')) return await profileScene();
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
      const filters = await page.evaluate(() => [...document.querySelectorAll('.inventory-overlay, .inventory-modal')].filter(el => getComputedStyle(el).backdropFilter !== 'none').map(el => ({ tag: el.tagName, classes: el.className, filter: getComputedStyle(el).backdropFilter })));
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
      console.log('Scene retains its backdrop filters; inventory overlays remain unblurred.');
    }
    fs.writeFileSync(`${out}/summary.json`, JSON.stringify({ results, errors }, null, 2));
  } finally { await browser?.close(); server?.kill(); }
})().catch(e => { console.error(e); process.exitCode = 1; });


async function profileScene() {
  const { createServer } = await import('vite');
  const { execFileSync } = require('node:child_process');
  const path = require('node:path');
  const option = name => process.argv.find(arg => arg.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
  const label = option('label') || 'diagnostic';
  const directory = `/tmp/room-scene-${label}`;
  const conditions = (option('conditions') || 'natural,continuous,no-mirrors,no-shadows,no-characters,no-environment,no-ui,no-debug,continuous').split(',');
  const supported = new Set(['natural', 'continuous', 'no-mirrors', 'no-shadows', 'no-characters', 'no-animals', 'no-physics', 'no-environment', 'no-ui', 'no-debug', 'no-off-lights']);
  for (const condition of conditions) if (!supported.has(condition)) throw Error(`Unknown profiling condition: ${condition}`);
  const reference = option('baseline-ref');
  fs.mkdirSync(directory, { recursive: true });
  const versions = reference ? ['baseline', 'current', 'current', 'baseline'] : ['current'];
  let server, browser;
  const results = [], errors = [];
  try {
    browser = await launch({ args: ['--no-sandbox', '--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan,VulkanFromANGLE', '--disable-vulkan-surface'] });
    const system = await browser.target().createCDPSession();
    const gpu = await system.send('SystemInfo.getInfo');
    fs.writeFileSync(`${directory}/gpu.json`, JSON.stringify(gpu, null, 2));
    console.log('GPU', JSON.stringify(gpu.gpu.devices));
    const page = await browser.newPage();
    await page.setViewport({ width: 1362, height: 810, deviceScaleFactor: 1 });
    page.on('pageerror', error => errors.push(String(error)));
    const client = await page.createCDPSession();
    await client.send('Profiler.enable'); await client.send('Performance.enable');
    for (const [run, version] of versions.entries()) {
      const historical = new Map();
      if (version === 'baseline') {
        const files = execFileSync('git', ['diff', '--name-only', reference, '--', 'src'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
        for (const file of files) historical.set(path.resolve(file), execFileSync('git', ['show', `${reference}:${file}`], { encoding: 'utf8' }));
      }
      server = await createServer({ server: { host: '127.0.0.1', port: 5185, strictPort: true }, plugins: [{ name: 'profile-baseline', enforce: 'pre', load(id) { return historical.get(id.split('?')[0]); } }] });
      await server.listen();
      await page.goto('http://127.0.0.1:5185/?skipIntro=1', { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForFunction(async () => {
        const { cameraState } = await import('/src/features/scene/cameraState.ts');
        return cameraState.isSceneLaunched && !cameraState.isIntroRunning && !!window.__THREE_GL__;
      }, { timeout: 180000 });
      await page.evaluate(async () => {
        const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
        const { cameraState } = await import('/src/features/scene/cameraState.ts');
        useSceneStore.getState().setCameraMovement('fix');
        useSceneStore.setState(state => ({ layers: { ...state.layers, groundType: 'bermuda' } }));
        window.__profileBase = { layers: { ...useSceneStore.getState().layers }, onUpdate: window.__DEV_STATE__.onUpdate, fpsCanvas: window.__DEV_STATE__.fpsCanvas };
        window.__profileActive = false;
        window.__profileLights = []; window.__THREE_SCENE__.traverse(o => { if (o.isLight) window.__profileLights.push({ light: o, visible: o.visible }); });
        const tick = () => { for (const {light, visible} of window.__profileLights) light.visible = visible && (!window.__profileOffLights || light.intensity !== 0); if (window.__profileActive) cameraState.invalidate(); requestAnimationFrame(tick); }; tick();
        window.__profileActivity = setInterval(() => window.dispatchEvent(new MouseEvent('mousemove')), 1000);
      });
      await delay(12000);
      for (const [conditionIndex, condition] of conditions.entries()) {
        await page.evaluate(async condition => {
          const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
          const layers = { ...window.__profileBase.layers };
          if (condition === 'no-mirrors') layers.mirrors = false;
          if (condition === 'no-shadows') layers.shadows = false;
          if (condition === 'no-characters') layers.character = false;
          if (condition === 'no-animals') layers.animals = false;
          if (condition === 'no-physics') { layers.hairPhysics = false; layers.breastPhysics = false; layers.wigPhysics = false; }
          if (condition === 'no-environment') { layers.environment = false; layers.bermudaGrass = false; layers.neighbors = false; }
          useSceneStore.setState({ layers });
          window.__profileActive = condition !== 'natural';
          window.__profileOffLights = condition === 'no-off-lights';
          document.getElementById('profile-hide-ui')?.remove();
          if (condition === 'no-ui') {
            const css = document.createElement('style'); css.id = 'profile-hide-ui';
            css.textContent = '#root > * { visibility: hidden !important; } canvas { visibility: visible !important; }'; document.head.append(css);
          }
          window.__DEV_STATE__.onUpdate = condition === 'no-debug' ? null : window.__profileBase.onUpdate;
          window.__DEV_STATE__.fpsCanvas = condition === 'no-debug' ? null : window.__profileBase.fpsCanvas;
        }, condition);
        await delay(3000);
        console.log('START', run+1, version, condition);
        const before = await client.send('Performance.getMetrics');
        await client.send('Profiler.start');
        const metrics = await page.evaluate(async () => {
          const gl = window.__THREE_GL__, scene = window.__THREE_SCENE__, ctx = gl.getContext();
          const extension = ctx.getExtension('EXT_disjoint_timer_query_webgl2');
          const originalRender = gl.render, originalShadow = gl.shadowMap.render;
          const frames = [], cpu = [], gpu = [], draws = [], triangles = [], passes = new Map(), pending = [];
          let depth = 0, shadowMs = 0, shadowCalls = 0, cameraPose;
          gl.shadowMap.render = function(...args) { const start = performance.now(); try { return originalShadow.apply(this,args); } finally { shadowMs += performance.now()-start; shadowCalls++; } };
          gl.render = function(s, camera) {
            const target = this.getRenderTarget(); const main = s === scene && target === null && depth === 0;
            const name = main ? 'main-inclusive' : target ? `target-${target.width}x${target.height}` : 'other';
            const start = performance.now(), calls = this.info.render.calls, tris = this.info.render.triangles;
            let query;
            if (main) { frames.push(start); cameraPose = { position: camera.position.toArray(), quaternion: camera.quaternion.toArray() }; if(extension) { query=ctx.createQuery(); ctx.beginQuery(extension.TIME_ELAPSED_EXT,query); } }
            depth++;
            try { return originalRender.call(this,s,camera); } finally {
              depth--; const ms = performance.now()-start;
              const pass = passes.get(name) || { count:0, cpuMs:0, calls:0, triangles:0 };
              pass.count++;pass.cpuMs+=ms;pass.calls+=this.info.render.calls-calls;pass.triangles+=this.info.render.triangles-tris;passes.set(name,pass);
              if(main) { cpu.push(ms); draws.push(this.info.render.calls-calls);triangles.push(this.info.render.triangles-tris); if(query) {ctx.endQuery(extension.TIME_ELAPSED_EXT);pending.push(query);} }
            }
          };
          const collect = () => { while(pending.length && ctx.getQueryParameter(pending[0],ctx.QUERY_RESULT_AVAILABLE)) { const q=pending.shift(); if(!ctx.getParameter(extension.GPU_DISJOINT_EXT)) gpu.push(ctx.getQueryParameter(q,ctx.QUERY_RESULT)/1e6);ctx.deleteQuery(q); } };
          const start = performance.now();
          try { await new Promise(resolve => { const tick=now=> { collect(); if(now-start<10000) requestAnimationFrame(tick); else resolve(); };requestAnimationFrame(tick); }); }
          finally { gl.render=originalRender;gl.shadowMap.render=originalShadow;collect();for(const q of pending)ctx.deleteQuery(q); }
          const summary = values => { if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b);return {mean:values.reduce((a,b)=>a+b,0)/values.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],p99:sorted[Math.floor(sorted.length*.99)]}; };
          const intervals=frames.slice(1).map((t,i)=>t-frames[i]);
          const debug=ctx.getExtension('WEBGL_debug_renderer_info');
          return {frames:frames.length,fps:intervals.length*1000/intervals.reduce((a,b)=>a+b,0),frameMs:summary(intervals),renderCpuMs:summary(cpu),gpuMs:summary(gpu),drawCalls:summary(draws),triangles:summary(triangles),passes:Object.fromEntries(passes),shadowMs,shadowCalls,cameraPose,renderer:debug?ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL):null,drawingBuffer:[ctx.drawingBufferWidth,ctx.drawingBufferHeight], layers:{...(await import('/src/features/scene/store/useSceneStore.ts')).useSceneStore.getState().layers}};
        });
        const {profile}=await client.send('Profiler.stop');
        fs.writeFileSync(`${directory}/${run+1}-${conditionIndex}-${version}-${condition}.cpuprofile`,JSON.stringify(profile));
        const after=await client.send('Performance.getMetrics');
        const prior=new Map(before.metrics.map(x=>[x.name,x.value]));
        const browserMetrics=Object.fromEntries(after.metrics.filter(x=>['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration'].includes(x.name)).map(x=>[x.name,x.value-prior.get(x.name)]));
        const power = Object.fromEntries(fs.readdirSync('/sys/class/power_supply').map(name => {const dir=`/sys/class/power_supply/${name}`;return [name,Object.fromEntries(['online','status'].filter(key=>fs.existsSync(`${dir}/${key}`)).map(key=>[key,fs.readFileSync(`${dir}/${key}`,'utf8').trim()]))];}));
        results.push({run:run+1,version,condition,...metrics,browserMetrics,power});
        fs.writeFileSync(`${directory}/summary.json`,JSON.stringify({reference,conditions,results,errors},null,2));
        console.log(JSON.stringify(results.at(-1),null,2));
        if (conditionIndex===0) {
          const breakdown = await page.evaluate(async () => {
            const gl=window.__THREE_GL__,scene=window.__THREE_SCENE__,original=gl.renderBufferDirect,records=new Map(),names=new WeakMap();
            const nameFor = object => {if(names.has(object))return names.get(object);let cur=object,key=object.name||object.type;while(cur&&cur!==scene){if(cur.userData?.hoverAction?.label){key=cur.userData.hoverAction.label;break;}if(cur.userData?.itemName){key=cur.userData.itemName;break;}if(cur.name)key=cur.name;cur=cur.parent;}names.set(object,key);return key;};
            let calls=0;
            gl.renderBufferDirect=function(camera,s,geometry,material,object,group){
              const key=`${material.isMeshDepthMaterial||material.isMeshDistanceMaterial?'shadow':'color'} | ${nameFor(object)}`;
              const before=this.info.render.triangles;
              const result=original.call(this,camera,s,geometry,material,object,group);
              const record=records.get(key)||{calls:0,triangles:0};record.calls++;record.triangles+=this.info.render.triangles-before;records.set(key,record);calls++;
              return result;
            };
            try {await new Promise(resolve=>{let count=0;const tick=()=>{if(++count<3)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});}finally{gl.renderBufferDirect=original;}
            const lights=[];scene.traverse(o=>{if(o.isLight)lights.push({name:o.name,type:o.type,castShadow:o.castShadow,intensity:o.intensity,mapSize:o.shadow?.mapSize.toArray()});});
            window.__DEV_STATE__.refreshScene();
            return {calls,objects:[...records].sort((a,b)=>b[1].triangles-a[1].triangles),lights,topObjects:window.__DEV_STATE__.topObjects};
          });
          fs.writeFileSync(`${directory}/${run+1}-breakdown.json`,JSON.stringify(breakdown,null,2));
        }
      }
      await page.goto('about:blank');await server.close();server=null;
      if (errors.length) throw Error(`Browser errors: ${errors.join('; ')}`);
    }
  } finally {await browser?.close();await server?.close();}
}


function checkBoundsReuse() {
  const assert = require('node:assert/strict');
  const ts = require('typescript');
  require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
  const THREE = require('three');
  const { enableAnimatedFrustumCulling, meshWorldBounds } = require('../src/features/scene/utils/animatedFrustumCulling.ts');
  const { getUnusedShadows } = require('../src/features/scene/utils/visibleShadowReceivers.ts');
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1,0,0, 1,0,0, 0,1,0], 3));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute([0,0,0,0, 1,0,0,0, 0,1,0,0], 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute([1,0,0,0, 1,0,0,0, .25,.75,0,0], 4));
  geometry.morphTargetsRelative = true;
  geometry.morphAttributes.position = [new THREE.Float32BufferAttribute([0,0,0, 10,0,0, 0,5,0],3)];
  const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshStandardMaterial());
  const root = new THREE.Bone(), arm = new THREE.Bone(), scene = new THREE.Scene();
  root.add(arm); arm.position.y=1; mesh.add(root);scene.add(mesh);scene.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton([root,arm]));
  enableAnimatedFrustumCulling(mesh);
  mesh.computeBoundingSphere();
  const original = THREE.Matrix4.prototype.multiplyMatrices;
  let multiplications=0;
  THREE.Matrix4.prototype.multiplyMatrices=function(...args){multiplications++;return original.apply(this,args);};
  try { mesh.computeBoundingSphere();meshWorldBounds(mesh,new THREE.Box3());void mesh.boundingSphere;assert.equal(multiplications,0,'Repeated bounds for an unchanged skeleton must reuse the envelope'); }
  finally { THREE.Matrix4.prototype.multiplyMatrices=original; }
  const assertContainsVertices=label=>{
    const sphere=mesh.boundingSphere,box=meshWorldBounds(mesh,new THREE.Box3()).expandByScalar(1e-6),point=new THREE.Vector3();
    for(let i=0;i<geometry.attributes.position.count;i++){mesh.getVertexPosition(i,point);assert.ok(point.distanceTo(sphere.center)<=sphere.radius+1e-6,label);assert.ok(box.containsPoint(point.clone().applyMatrix4(mesh.matrixWorld)),label);}
  };
  arm.position.x=20;arm.updateMatrixWorld(true);assertContainsVertices('Direct bone edit without mesh update invalidates bounds');
  mesh.morphTargetInfluences[0]=1;assertContainsVertices('Morph changes rebuild the envelope');
  mesh.scale.set(2,.5,3);scene.updateMatrixWorld(true);assertContainsVertices('Nonuniform scale updates bind transforms');
  const mirror=new THREE.Mesh(new THREE.PlaneGeometry(4,4),new THREE.MeshBasicMaterial());mirror.isReflector=true;scene.add(mirror);
  const light=new THREE.DirectionalLight();light.castShadow=true;light.position.set(0,10,10);light.shadow.map=new THREE.WebGLRenderTarget(1,1);scene.add(light,light.target);
  const receiver=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());receiver.receiveShadow=true;scene.add(receiver);
  receiver.geometry.computeBoundingBox=()=>{throw Error('Visible mirror must bypass receiver bounds');};
  const camera=new THREE.PerspectiveCamera(45,1,.1,100);camera.position.z=10;camera.lookAt(0,0,0);camera.updateMatrixWorld(true);scene.updateMatrixWorld(true);
  assert.ok(!getUnusedShadows(scene,camera).shadows.includes(light.shadow),'Visible mirror retains active shadows without evaluating receivers');
  light.intensity=0;assert.ok(getUnusedShadows(scene,camera).shadows.includes(light.shadow),'Mirror does not retain extinguished shadows');
  light.shadow.map.dispose();
  console.log('Bounds checks passed: reuse, direct bone edits, morphs, nonuniform scale, mirror short circuit and extinguished lights.');
}
