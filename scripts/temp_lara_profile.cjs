const fs = require('node:fs');
const { spawn } = require('node:child_process');
const launch = require('./browser-test-options.cjs');
const verify = process.argv.includes('--verify-inventory');
const isolate = process.argv.includes('--isolate-blur');
const out = verify ? '/tmp/room-lara-inventory' : isolate ? '/tmp/room-lara-blur-isolation' : '/tmp/room-lara-profile';
const delay = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  if (process.argv.includes('--stop-profile')) {const logfile=process.argv.find(a=>a.startsWith('--log='))?.slice(6);const endpoint=fs.readFileSync(logfile,'utf8').match(/DevTools listening on (ws:\/\/\S+)/)[1];const browser=await require('puppeteer').connect({browserWSEndpoint:endpoint});await browser.close();return;}
  if (process.argv.includes('--robot-paired')) return await profileRobotPairs();
  if (process.argv.includes('--robot-check')) return await checkRobotBatches();
  if (process.argv.includes('--lara-skeletons')) return await profileLaraSkeletons();
  if (process.argv.includes('--inspect-lara-asset')) return inspectLaraAsset();
  if (process.argv.includes('--navigation-live')) return await traceNavigation();
  if (process.argv.includes('--worker-check')) return await checkNavigationWorker();
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
        const files = execFileSync('git', ['diff', '--diff-filter=M', '--name-only', reference, '--', ...(option('baseline-files')?.split(',') || ['src'])], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
        for (const file of files) historical.set(path.resolve(file), execFileSync('git', ['show', `${reference}:${file}`], { encoding: 'utf8' }));
      }
      server = await createServer({ server: { host: '127.0.0.1', port: 5185, strictPort: true }, plugins: [{ name: 'profile-baseline', enforce: 'pre', load(id) { return historical.get(id.split('?')[0]); } }] });
      await server.listen();
      await page.goto('http://127.0.0.1:5185/?skipIntro=1&preset=mid&mode=orbit', { waitUntil: 'domcontentloaded', timeout: 120000 });
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
        const metrics = await page.evaluate(measureSceneFrames);
        if(version==='current' && metrics.robotBatchCount && metrics.robotVisibleOriginals)throw Error('Robot originals rendered alongside batches');
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
  const { shareSkeletons } = require('../src/features/scene/utils/shareSkeletons.ts');
  const skinRoot = new THREE.Group(), skinBoneA = new THREE.Bone(), skinBoneB = new THREE.Bone();
  const skin = (bones, inverses) => { const mesh = new THREE.SkinnedMesh(); mesh.skeleton = new THREE.Skeleton(bones, inverses); skinRoot.add(mesh); return mesh; };
  const skinA = skin([skinBoneA,skinBoneB],[new THREE.Matrix4(),new THREE.Matrix4()]);
  const skinSame = skin([skinBoneA,skinBoneB],[new THREE.Matrix4(),new THREE.Matrix4()]);
  const skinOrder = skin([skinBoneB,skinBoneA],[new THREE.Matrix4(),new THREE.Matrix4()]);
  const skinInverse = skin([skinBoneA,skinBoneB],[new THREE.Matrix4().makeTranslation(1,0,0),new THREE.Matrix4()]);
  const skinOther = skin([new THREE.Bone(),new THREE.Bone()],[new THREE.Matrix4(),new THREE.Matrix4()]);
  shareSkeletons(skinRoot);
  assert.equal(skinSame.skeleton,skinA.skeleton,'Identical bones and inverses share their palette');
  for(const mesh of [skinOrder,skinInverse,skinOther]) assert.notEqual(mesh.skeleton,skinA.skeleton,'Different bone order, inverses or bones must stay separate');
  console.log('Skeleton sharing checks passed: equivalent bindings only, independent bones preserved.');
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

async function checkNavigationWorker() {
  const assert = require('node:assert/strict');
  const { createServer } = await import('vite');
  const fixturePath=process.argv.find(arg=>arg.startsWith('--fixture='))?.slice('--fixture='.length)||'/tmp/room-navigation-benchmark.json';
  const fixture = JSON.parse(fs.readFileSync(fixturePath,'utf8'));
  const directory='/tmp/room-navigation-worker-check';fs.mkdirSync(directory,{recursive:true});
  const server=await createServer({server:{host:'127.0.0.1',port:5192,strictPort:true},plugins:[{name:'worker-check-page',configureServer(server){server.middlewares.use('/__worker-check',async(_,res,next)=>{try{res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml('/__worker-check','<!doctype html><html><body>Navigation worker check</body></html>'));}catch(error){next(error);}});}}]});
  let browser;
  try {
    await server.listen();browser=await launch({args:['--no-sandbox','--enable-gpu','--use-angle=vulkan','--enable-features=Vulkan,VulkanFromANGLE','--disable-vulkan-surface']});
    const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:5192/__worker-check',{waitUntil:'networkidle0'});
    const report=await page.evaluate(async fixture=>{
      const {VisibilityGraph}=await import('/src/features/scene/ai/navigation/geometry.ts');
      const {requestPath,pathfindingStats}=await import('/src/features/scene/ai/navigation/pathfindingClient.ts');
      const delay=ms=>new Promise(r=>setTimeout(r,ms));
      async function measure(operation){
        const gaps=[];let previous=performance.now();
        const timer=setInterval(()=>{const now=performance.now();gaps.push(now-previous);previous=now;},10);
        await delay(30);gaps.length=0;previous=performance.now();
        const start=performance.now();const value=await operation();const milliseconds=performance.now()-start;
        await delay(30);clearInterval(timer);
        return {milliseconds,ticks:gaps.length,worstHeartbeatGap:Math.max(...gaps),value};
      }
      const syncGraph=new VisibilityGraph(fixture.obstacles,fixture.comfort);
      const synchronous=await measure(()=>fixture.queries.map(([start,target])=>syncGraph.find(start,target)));
      const graph=new VisibilityGraph(fixture.obstacles,fixture.comfort);
      const get=async(g,start,target)=>{let done;const completed=new Promise(resolve=>done=resolve);const job=requestPath(g,start,target,done);await completed;if(job.status==='error')throw job.error;return job.path;};
      const background=await measure(async()=>{const paths=[];for(const [start,target] of fixture.queries)paths.push(await get(graph,start,target));return paths;});
      const validations=fixture.queries.map(([start],i)=>{
        const a=synchronous.value[i],b=background.value[i];
        const cost=path=>path?.reduce((sum,p,j)=>sum+syncGraph.segmentCost(j?path[j-1]:start,p),0);
        return {sameReachability:!!a===!!b,costBefore:cost(a),costWorker:cost(b),identicalPath:JSON.stringify(a)===JSON.stringify(b)};
      });
      let cancelledCallback=0;
      const [start,target]=fixture.queries[0];
      const first=requestPath(graph,start,target,()=>{});
      const cancelled=requestPath(graph,start,target,()=>cancelledCallback++);cancelled.cancel();
      await get(graph,start,target);
      const invalid=requestPath(graph,{x:NaN,z:0},target,()=>{});
      while(invalid.status==='pending')await delay(10);
      const service=await import('/src/features/scene/ai/navigation/service.ts');
      const obstacles=await import('/src/features/scene/ai/navigation/obstacles.ts');
      const {walkableSurfaces}=await import('/src/features/scene/ai/navigation/architecture.ts');
      const {pointInRing,insideObstacle,distance,rectangle}=await import('/src/features/scene/ai/navigation/geometry.ts');
      const id='worker-integration';obstacles.setAgentProfile(id,{radius:10,height:173});
      const base=service.getNavigationGraph(obstacles.getAgentProfile(id));
      const valid=p=>walkableSurfaces.some(r=>pointInRing(p,r[0])&&!r.slice(1).some(h=>pointInRing(p,h)))&&!insideObstacle(p,base.obstacles);
      const from=base.vertices.find(valid);
      const to=base.vertices.find(p=>valid(p)&&distance(from,p)>20&&base.canReach(from,p));
      if(!from||!to)throw Error('No reachable integration fixture');
      const route=service.createRouteState();
      const firstPosition=service.followRoute(route,id,from,to,1);
      if(distance(firstPosition,from)!==0||route.error||route.search?.job.status!=='pending')throw Error('Pending route must wait without failing');
      const wait=async job=>{while(job.status==='pending')await delay(10);if(job.status==='error')throw job.error;};
      await wait(route.search.job);
      const moved=service.followRoute(route,id,from,to,1);
      if(distance(moved,from)===0||distance(moved,from)>1.000001||route.error)throw Error('Completed route must resume without teleporting');
      service.resetRoute(route,id);
      service.planRoute(route,id,from,to);
      const abandoned=route.search.job;
      service.resetRoute(route,id);
      await delay(30);
      if(abandoned.status!=='cancelled'||route.path.length||route.search)throw Error('Reset must discard old answers');
      service.planRoute(route,id,from,to);
      const obsolete=route.search.job;
      obstacles.registerObstacle({id:'worker-test-blocker',polygon:rectangle(to.x,to.z,4,4,0),yMin:0,yMax:200});
      service.planRoute(route,id,from,to);
      if(obsolete.status!=='cancelled'||route.search.job.graph===obsolete.graph)throw Error('Changed geometry must replace pending search');
      await wait(route.search.job);
      if(service.planRoute(route,id,from,to)||!route.error)throw Error('Newly obstructed target must be rejected');
      obstacles.unregisterObstacle('worker-test-blocker');service.resetRoute(route,id);obstacles.removeAgentProfile(id);
      const integration={waits:true,resumes:true,noTeleport:true,resetCancels:true,geometryChangeCancels:true,obstructedTargetRejected:true};
      const result={integration,synchronous:{...synchronous,value:undefined},background:{...background,value:undefined},validations,cancellation:{status:cancelled.status,callbacks:cancelledCallback,first:first.status},invalidInput:{status:invalid.status,message:invalid.error?.message},stats:{...pathfindingStats}};
      return result;
    },fixture);
    assert.deepEqual(errors,[]);
    for(const result of report.validations){assert.ok(result.sameReachability);assert.ok(result.identicalPath);if(result.costBefore!==undefined)assert.ok(Math.abs(result.costBefore-result.costWorker)<1e-7);}
    assert.equal(report.cancellation.status,'cancelled');assert.equal(report.cancellation.callbacks,0);assert.equal(report.cancellation.first,'ready');
    assert.equal(report.invalidInput.status,'error');assert.match(report.invalidInput.message,/Non-finite/);
    fs.writeFileSync(`${directory}/summary.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  }finally{await browser?.close();await server.close();}
}

async function traceNavigation() {
  const {createServer}=await import('vite');const path=require('node:path');const {execFileSync}=require('node:child_process');
  const option=name=>process.argv.find(arg=>arg.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
  const label=option('label')||'navigation-live',reference=option('baseline-ref');const directory=`/tmp/room-${label}`;fs.mkdirSync(directory,{recursive:true});
  const old=new Map();if(reference){for(const file of execFileSync('git',['diff','--diff-filter=M','--name-only',reference,'--','src'],{encoding:'utf8'}).trim().split('\n').filter(Boolean))old.set(path.resolve(file),execFileSync('git',['show',`${reference}:${file}`],{encoding:'utf8'}));}
  const server=await createServer({server:{host:'127.0.0.1',port:5193,strictPort:true},plugins:[{name:'navigation-reference',enforce:'pre',load(id){return old.get(id.split('?')[0]);}}]});let browser;
  try{
    await server.listen();browser=await launch({args:['--no-sandbox','--enable-gpu','--use-angle=vulkan','--enable-features=Vulkan,VulkanFromANGLE','--disable-vulkan-surface']});
    const page=await browser.newPage();await page.setViewport({width:1362,height:810,deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:5193/?skipIntro=1',{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(async()=>{const {cameraState}=await import('/src/features/scene/cameraState.ts');return cameraState.isSceneLaunched&&!cameraState.isIntroRunning&&!!window.__THREE_GL__;},{timeout:180000});
    await page.evaluate(async()=>{const {resetAppIdle}=await import('/src/features/scene/idleState.ts');setInterval(resetAppIdle,1000);const {useSceneStore}=await import('/src/features/scene/store/useSceneStore.ts');useSceneStore.getState().setCameraMovement('fix');useSceneStore.setState(s=>({layers:{...s.layers,groundType:'bermuda'}}));});
    await delay(12000);
    await page.evaluate(async()=>{
      const {VisibilityGraph}=await import('/src/features/scene/ai/navigation/geometry.ts');const original=VisibilityGraph.prototype.find;let depth=0;
      window.navTrace={queries:[],tasks:[],frames:[],worst:null};
      VisibilityGraph.prototype.find=function(start,target){const outer=depth++===0,began=performance.now();let result;try{return result=original.call(this,start,target);}finally{depth--;if(outer){const record={start:began,milliseconds:performance.now()-began,weighted:!!this.comfort,vertices:this.vertices.length,from:{...start},target:{...target},reachable:!!result};window.navTrace.queries.push(record);if(!window.navTrace.worst||record.milliseconds>window.navTrace.worst.milliseconds)window.navTrace.worst={...record,obstacles:this.obstacles,comfort:this.comfort,stack:new Error().stack};}}};
      new PerformanceObserver(list=>window.navTrace.tasks.push(...list.getEntries().map(t=>({start:t.startTime,milliseconds:t.duration})))).observe({type:'longtask'});
      const gl=window.__THREE_GL__,scene=window.__THREE_SCENE__,render=gl.render;
      gl.render=function(s,camera){if(s===scene&&this.getRenderTarget()===null)window.navTrace.frames.push(performance.now());return render.call(this,s,camera);};
    });
    console.log('Navigation capture started');await delay(60000);
    const trace=await page.evaluate(async()=>{const trace=window.navTrace;const {pathfindingStats}=await import('/src/features/scene/ai/navigation/pathfindingClient.ts');return {...trace,worker:{...pathfindingStats},intervals:trace.frames.slice(1).map((t,i)=>t-trace.frames[i])};});
    fs.writeFileSync(`${directory}/trace.json`,JSON.stringify({...trace,errors},null,2));
    if(trace.worst)fs.writeFileSync(`${directory}/worst-query.json`,JSON.stringify({obstacles:trace.worst.obstacles,comfort:trace.worst.comfort,queries:[[trace.worst.from,trace.worst.target]]},null,2));
    const summary={queries:trace.queries.length,weighted:trace.queries.filter(q=>q.weighted).length,worstQuery:trace.worst?{milliseconds:trace.worst.milliseconds,weighted:trace.worst.weighted,vertices:trace.worst.vertices,stack:trace.worst.stack}:null,worstFrame:Math.max(...trace.intervals),over500ms:trace.intervals.filter(t=>t>=500).length,over1000ms:trace.intervals.filter(t=>t>=1000).length,longTasks:trace.tasks.length,worstTask:Math.max(0,...trace.tasks.map(t=>t.milliseconds)),worker:trace.worker,errors};
    fs.writeFileSync(`${directory}/summary.json`,JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));if(errors.length)throw Error(errors.join('\n'));
  }finally{await browser?.close();await server.close();}
}


function inspectLaraAsset() {
  const bytes=fs.readFileSync('public/characters/lara/lara_native.glb');
  const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  console.log(JSON.stringify({skins:gltf.skins.map(s=>({joints:s.joints.length,inverseBindMatrices:s.inverseBindMatrices})),meshes:gltf.meshes.length,primitives:gltf.meshes.reduce((s,m)=>s+m.primitives.length,0),meshNodes:gltf.nodes.filter(n=>n.mesh!==undefined).map(n=>({name:n.name,skin:n.skin,mesh:n.mesh})),triangles:gltf.meshes.reduce((s,m)=>s+m.primitives.reduce((sum,p)=>sum+(gltf.accessors[p.indices??p.attributes.POSITION].count/3),0),0)},null,2));
}


async function profileLaraSkeletons() {
  const assert=require('node:assert/strict');
  const {createServer}=await import('vite');
  const label=process.argv.find(arg=>arg.startsWith('--label='))?.slice('--label='.length)||'lara-skeletons';
  const directory='/tmp/room-'+label;fs.mkdirSync(directory,{recursive:true});
  const server=await createServer({server:{host:'127.0.0.1',port:5194,strictPort:true}});
  let browser;
  try {
    await server.listen();
    browser=await launch({args:['--no-sandbox','--enable-gpu','--use-angle=vulkan','--enable-features=Vulkan,VulkanFromANGLE','--disable-vulkan-surface']});
    const system=await browser.target().createCDPSession();
    fs.writeFileSync(directory+'/gpu.json',JSON.stringify(await system.send('SystemInfo.getInfo'),null,2));
    const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.setViewport({width:1362,height:810,deviceScaleFactor:1});
    await page.goto('http://127.0.0.1:5194/?skipIntro=1',{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(async()=>{const {cameraState}=await import('/src/features/scene/cameraState.ts');return cameraState.isSceneLaunched&&!cameraState.isIntroRunning&&!!window.__THREE_GL__;},{timeout:180000});
    await page.evaluate(async()=>{
      const {resetAppIdle}=await import('/src/features/scene/idleState.ts');setInterval(resetAppIdle,1000);
      const {useSceneStore}=await import('/src/features/scene/store/useSceneStore.ts');useSceneStore.getState().setCameraMovement('fix');useSceneStore.setState(s=>({layers:{...s.layers,groundType:'bermuda'}}));
      const {cameraState}=await import('/src/features/scene/cameraState.ts');
      window.laraRecords=[];
      window.__THREE_SCENE__.traverse(o=>{if(o.isSkinnedMesh){let root=o;while(root&&!root.userData.gltfPath)root=root.parent;if(root?.userData.gltfPath?.includes('/lara/'))window.laraRecords.push({mesh:o,root,shared:o.skeleton,duplicate:o.skeleton.clone()});}});
      const roots=new Set(window.laraRecords.map(r=>r.root));if(!roots.size)throw Error('No Lara instances found');
      window.laraRoots=[...roots];
      const tick=()=>{cameraState.invalidate?.();requestAnimationFrame(tick);};tick();
    });
    await delay(12000);
    const structural=await page.evaluate(async()=>{
      const {clone}=await import('/node_modules/three/examples/jsm/utils/SkeletonUtils.js');
      const {shareSkeletons}=await import('/src/features/scene/utils/shareSkeletons.ts');
      const meshes=root=>{const result=[];root.traverse(o=>{if(o.isSkinnedMesh)result.push(o);});return result;};
      const source=window.laraRoots[0],copy=clone(source),other=clone(source);
      const before=meshes(copy),old=before.map(m=>m.skeleton);
      shareSkeletons(copy);shareSkeletons(other);
      if(before.some((m,i)=>m.skeleton.bones.some((b,j)=>b!==old[i].bones[j])||m.skeleton.boneInverses.some((b,j)=>!b.equals(old[i].boneInverses[j]))))throw Error('Skin binding changed');
      if(before.some(m=>meshes(other).some(n=>n.skeleton===m.skeleton||n.skeleton.bones[0]===m.skeleton.bones[0])))throw Error('Independent characters share bones');
      const Vector3=source.position.constructor;
      let checked=0,maxError=0;const a=new Vector3(),b=new Vector3();
      for(const angle of [0,.35,-.7]){
        const bone=before[0].skeleton.bones.find(b=>b.children.some(c=>c.isBone));bone.rotation.y=angle;copy.updateMatrixWorld(true);
        for(let i=0;i<before.length;i++){const mesh=before[i],shared=mesh.skeleton;
          for(let vertex=0;vertex<mesh.geometry.attributes.position.count;vertex++){
            mesh.getVertexPosition(vertex,a);mesh.skeleton=old[i];mesh.getVertexPosition(vertex,b);mesh.skeleton=shared;maxError=Math.max(maxError,a.distanceTo(b));checked++;
          }
        }
      }
      if(maxError!==0)throw Error('Skeleton sharing changed posed vertices');
      const counts=root=>{const m=meshes(root);return {meshes:m.length,skeletons:new Set(m.map(o=>o.skeleton)).size};};
      return {characters:window.laraRoots.length,sceneSkinnedMeshes:window.laraRecords.length,perCharacter:window.laraRoots.map(counts),cloneBefore:new Set(old).size,cloneAfter:counts(copy).skeletons,checkedVertices:checked,maxVertexError:maxError,independent:true};
    });
    console.log('STRUCTURE',JSON.stringify(structural));const results=[];
    for(const mode of ['duplicate','shared','shared','duplicate']){
      await page.evaluate(mode=>{for(const r of window.laraRecords)r.mesh.skeleton=r[mode];},mode);
      await delay(4000);
      const metrics=await page.evaluate(async()=>{
        const Skeleton=window.laraRecords[0].shared.constructor;
        const originals={update:Skeleton.prototype.update,render:window.__THREE_GL__.render};
        const scene=window.__THREE_SCENE__,gl=window.__THREE_GL__,frames=[],cpu=[],draws=[],triangles=[];
        let updates=0,skinMs=0,uploads=0,uploadMs=0;
        const ctx=gl.getContext(),upload=ctx.texSubImage2D;
        ctx.texSubImage2D=function(...args){const start=performance.now();try{return upload.apply(this,args);}finally{uploads++;uploadMs+=performance.now()-start;}};

        Skeleton.prototype.update=function(){const start=performance.now();try{return originals.update.call(this);}finally{skinMs+=performance.now()-start;updates++;}};
        gl.render=function(s,c){const main=s===scene&&this.getRenderTarget()===null,start=performance.now(),calls=this.info.render.calls,tris=this.info.render.triangles;if(main)frames.push(start);const result=originals.render.call(this,s,c);if(main){cpu.push(performance.now()-start);draws.push(this.info.render.calls-calls);triangles.push(this.info.render.triangles-tris);}return result;};
        try{await new Promise(r=>setTimeout(r,10000));}finally{gl.render=originals.render;Skeleton.prototype.update=originals.update;ctx.texSubImage2D=upload;}
        const summary=values=>{const sorted=[...values].sort((a,b)=>a-b);return {mean:values.reduce((s,v)=>s+v,0)/values.length,median:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)]};};
        const intervals=frames.slice(1).map((t,i)=>t-frames[i]);
        return {textureUploadsPerFrame:uploads/frames.length,textureUploadCpuMsPerFrame:uploadMs/frames.length,frames:frames.length,fps:1000*intervals.length/intervals.reduce((s,t)=>s+t,0),frameMs:summary(intervals),renderCpuMs:summary(cpu),drawCalls:summary(draws),triangles:summary(triangles),skeletonUpdatesPerFrame:updates/frames.length,skeletonMsPerFrame:skinMs/frames.length};
      });
      results.push({mode,...metrics});console.log(JSON.stringify(results.at(-1)));
      fs.writeFileSync(directory+'/summary.json',JSON.stringify({structural,results,errors},null,2));
    }
    assert.deepEqual(errors,[]);
    await page.screenshot({path:directory+'/scene.png'});
  }finally{await browser?.close();await server.close();}
}


async function checkRobotBatches() {
  const assert=require('node:assert/strict');const {createServer}=await import('vite');
  const directory='/tmp/room-robot-batches';fs.mkdirSync(directory,{recursive:true});
  const server=await createServer({server:{host:'127.0.0.1',port:5195,strictPort:true},plugins:[{name:'robot-test',resolveId(id){if(id==='/__robot_modules.js')return id;},load(id){if(id==='/__robot_modules.js')return "export {default as React} from 'react';export {createRoot} from 'react-dom/client';export {Canvas,useThree,useFrame} from '@react-three/fiber';export {useGLTF} from '@react-three/drei';export {UnitreeG1,UnitreeGo2} from '/src/features/scene/items/Unitree.tsx';export {Jumper} from '/src/features/scene/items/Jumper.tsx';export {CategoryLayerGroup} from '/src/features/scene/sceneLayer.tsx';";},configureServer(server){server.middlewares.use('/__robot-check',async(_,res,next)=>{try{res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml('/__robot-check','<!doctype html><html><body></body></html>'));}catch(error){next(error);}});}}]});let browser;
  try{
    await server.listen();browser=await launch({args:['--no-sandbox','--enable-gpu','--use-angle=vulkan','--enable-features=Vulkan,VulkanFromANGLE','--disable-vulkan-surface']});
    const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:5195/__robot-check',{waitUntil:'networkidle0'});
    const results=await page.evaluate(async()=>{
      const THREE=await import('/node_modules/three/build/three.module.js');
      const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
      const {DRACOLoader}=await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
      const {createRigidMeshBatches}=await import('/src/features/scene/utils/rigidMeshBatches.ts');
      const {createUnitreeMotion}=await import('/src/features/scene/items/unitreeMotion.ts');
      const {glbLocalBBox}=await import('/src/features/scene/glbUtils.ts');
      const {meshWorldBounds}=await import('/src/features/scene/utils/animatedFrustumCulling.ts');
      const loader=new GLTFLoader();loader.setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));
      const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});renderer.setSize(512,512);renderer.shadowMap.enabled=true;document.body.append(renderer.domElement);
      const multi=renderer.getContext().getExtension('WEBGL_multi_draw');const output=[];
      for(const name of ['unitree-g1','unitree-go2','jumper']){
        const gltf=await loader.loadAsync('/items/'+name+'/'+name+'.glb');
        const root=gltf.scene,world=new THREE.Scene(),parent=new THREE.Group(),target=new THREE.Group();world.background=new THREE.Color('#444444');world.add(parent);parent.add(root,target);
        root.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});
        const size=glbLocalBBox(root).getSize(new THREE.Vector3());
        const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(150,200,100);light.castShadow=true;Object.assign(light.shadow.camera,{left:-size.length(),right:size.length(),top:size.length(),bottom:-size.length(),near:1,far:1000});light.shadow.camera.updateProjectionMatrix();world.add(light,light.target,new THREE.HemisphereLight(0xffffff,0x333333,2));const floor=new THREE.Mesh(new THREE.PlaneGeometry(size.length()*4,size.length()*4),new THREE.MeshStandardMaterial({color:0x777777}));floor.rotation.x=-Math.PI/2;floor.position.y=-.1;floor.receiveShadow=true;world.add(floor);
        const camera=new THREE.PerspectiveCamera(40,1,1,2000);camera.position.set(size.length()*1.4,size.y*.8,size.length()*1.5);camera.lookAt(0,size.y/2,0);camera.updateMatrixWorld();
        const mixer=new THREE.AnimationMixer(root);const animate=name==='jumper'?null:createUnitreeMotion(root,name==='unitree-g1'?'g1':'go2');
        const controller=createRigidMeshBatches(root,target);
        const motions=name==='jumper'?gltf.animations.map(clip=>clip.name):name==='unitree-g1'?['idle','walk','wave','bow','dance']:['idle','trot','paw','bow','dance'];
        let maxMatrixError=0,poses=0,maxPixelError=0,changedPixels=0,squaredPixelError=0;const drawCounts=[];
        for(const motion of motions){
          let action;if(name==='jumper'){mixer.stopAllAction();action=mixer.clipAction(gltf.animations.find(c=>c.name===motion));action.play();}
          for(const time of [0,.3,1.1]){
            if(animate)animate(motion,time);else mixer.setTime(time);
            parent.position.set(100,-30,50);parent.rotation.y=.4;parent.scale.setScalar(1.2);controller.update();world.updateMatrixWorld(true);
            for(const r of controller.records){const actual=new THREE.Matrix4();if(r.batch.isInstancedMesh)r.batch.getMatrixAt(r.instance,actual);else actual.identity();actual.premultiply(r.batch.matrixWorld);for(let i=0;i<16;i++)maxMatrixError=Math.max(maxMatrixError,Math.abs(actual.elements[i]-r.mesh.matrixWorld.elements[i]));}
            if(maxMatrixError>1e-4)throw Error(name+': transformed geometry differs');const coverage=new THREE.Box3();for(const batch of controller.batches)coverage.union(meshWorldBounds(batch,new THREE.Box3()));coverage.expandByScalar(1e-4);const vertex=new THREE.Vector3();for(const r of controller.records){const positions=r.mesh.geometry.attributes.position;for(let i=0;i<positions.count;i++){vertex.fromBufferAttribute(positions,i).applyMatrix4(r.mesh.matrixWorld);if(!coverage.containsPoint(vertex))throw Error(name+': batch bounds miss '+r.mesh.name+' in '+motion+' '+time+' '+JSON.stringify({vertex,coverage}));}}poses++;
          }
        }
        parent.position.set(0,0,0);parent.rotation.set(0,0,0);parent.scale.setScalar(1);if(animate)animate('idle',0);else{mixer.stopAllAction();mixer.clipAction(gltf.animations.find(c=>c.name==='idle')).play();mixer.setTime(0);}controller.update();world.updateMatrixWorld(true);
        const gl=renderer.getContext(),pixels=()=>{const data=new Uint8Array(512*512*4);gl.readPixels(0,0,512,512,gl.RGBA,gl.UNSIGNED_BYTE,data);return data;};
        const measure=()=>{let submissions=0,subdraws=0;const restore=[];for(const method of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){const original=gl[method];gl[method]=function(...args){submissions++;subdraws++;return original.apply(this,args);};restore.push(()=>gl[method]=original);}if(multi){for(const method of ['multiDrawElementsWEBGL','multiDrawArraysWEBGL']){const original=multi[method];multi[method]=function(...args){submissions++;subdraws+=args.at(-1);return original.apply(this,args);};restore.push(()=>multi[method]=original);}}try{renderer.info.autoReset=false;renderer.info.reset();renderer.render(world,camera);return {submissions,subdraws,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}finally{for(const reset of restore)reset();}};
        for(const mode of ['original','batched']){
          target.visible=mode==='batched';for(const r of controller.records){r.mesh.layers.mask=r.mask;r.mesh.visible=mode==='original'&&r.originalVisible;r.mesh.raycast=mode==='original'?r.raycast:()=>{};}
          renderer.render(world,camera);renderer.render(world,camera);
          drawCounts.push({mode,...measure()});
          if(mode==='original')window.robotPixels=pixels();else{const image=pixels();for(let i=0;i<image.length;i++){const delta=Math.abs(image[i]-window.robotPixels[i]);maxPixelError=Math.max(maxPixelError,delta);squaredPixelError+=delta*delta;if(delta)changedPixels++;}}
        }
        const batchedBounds=new THREE.Box3();for(const batch of controller.batches){batchedBounds.union(meshWorldBounds(batch,new THREE.Box3()));}
        const ray=new THREE.Raycaster();ray.layers.enableAll();let rayHits=0;for(const r of controller.records){r.mesh.geometry.computeBoundingSphere();const point=r.mesh.geometry.boundingSphere.center.clone().applyMatrix4(r.mesh.matrixWorld);ray.set(camera.position,new THREE.Vector3().subVectors(point,camera.position).normalize());rayHits+=ray.intersectObject(target,true).length;}
        let sourceDisposals=0;for(const geometry of new Set(controller.records.map(r=>r.mesh.geometry)))geometry.addEventListener('dispose',()=>sourceDisposals++);for(const material of new Set(controller.records.map(r=>r.mesh.material)))material.addEventListener('dispose',()=>sourceDisposals++);controller.dispose();if(sourceDisposals)throw Error('Batch disposed shared source resources');if(controller.records.some(r=>r.mesh.layers.mask!==r.mask||r.mesh.visible!==r.originalVisible))throw Error('Dispose failed to restore originals');
        const again=createRigidMeshBatches(root,target);again.dispose();
        output.push({name,motions,renderMaterials:new Set(controller.batches.map(batch=>batch.material)).size,meshes:controller.records.length,batches:controller.batches.length,poses,maxMatrixError,maxPixelError,changedPixelChannels:changedPixels,pixelRms:Math.sqrt(squaredPixelError/(512*512*4)),rayHits,multiDraw:!!multi,drawCounts});
        mixer.stopAllAction();mixer.uncacheRoot(root);
      }
      renderer.dispose();return output;
    });
    const previews=await page.evaluate(async fixtures=>{
      const {React,createRoot,Canvas,useThree,useGLTF,CategoryLayerGroup}=await import('/__robot_modules.js');
      const components=await import('/__robot_modules.js');useGLTF.setDecoderPath('/draco/');
      const element=document.createElement('div');element.style.width='512px';element.style.height='512px';document.body.append(element);
      const root=createRoot(element),result=[];let scene,lastSize,committed;
      const onSize=size=>lastSize=size.toArray();
      function Probe({token}){scene=useThree(s=>s.scene);React.useLayoutEffect(()=>{committed=token;},[token]);return null;}
      const wait=async check=>{const start=performance.now();while(!check()){if(performance.now()-start>30000)throw Error('React robot preview timeout');await new Promise(r=>setTimeout(r,30));}};
      for(const fixture of fixtures){
        const Component=components[fixture.name==='unitree-g1'?'UnitreeG1':fixture.name==='unitree-go2'?'UnitreeGo2':'Jumper'];
        const motionKey=fixture.name==='jumper'?'jumper-motion':fixture.name+'-motion',replayKey=fixture.name==='jumper'?'jumper-replay':fixture.name+'-replay';
        let replay=0;lastSize=undefined;
        for(const motion of fixture.motions.flatMap(motion=>[motion,motion])){
          const token=fixture.name+motion+(++replay);
          root.render(React.createElement(React.StrictMode,null,React.createElement(Canvas,{dpr:1,onCreated:({camera})=>camera.layers.enableAll(),camera:{position:[200,200,200],near:1,far:2000}},React.createElement('ambientLight',{intensity:2}),React.createElement(Probe,{token}),React.createElement(CategoryLayerGroup,{layer:1,register:false},React.createElement(React.Suspense,{fallback:null},React.createElement(Component,{key:fixture.name,item:{},isPreview:true,onSize,actionState:{[motionKey]:motion,[replayKey]:replay}}))))));
          await wait(()=>{let count=0;scene?.traverse(o=>{if(o.userData.rigidRobotGroup&&o.parent?.userData.gltfPath==='items/'+fixture.name+'/'+fixture.name+'.glb')count++;});return committed===token&&count===fixture.batches;});
          await new Promise(r=>setTimeout(r,100));
          if(!lastSize||lastSize.some(n=>!Number.isFinite(n)||n<=0))throw Error('Invalid preview dimensions');
        }
        result.push({name:fixture.name,actions:fixture.motions.length,replayed:true,batches:fixture.batches});
      }
      root.unmount();await new Promise(r=>setTimeout(r,500));return result;
    },results);
    console.log(JSON.stringify({results,previews,errors},null,2));fs.writeFileSync(directory+'/checks.json',JSON.stringify({results,previews,errors},null,2));assert.deepEqual(errors,[]);
    for(const result of results){assert.ok(result.drawCounts[1].submissions<=result.drawCounts[0].submissions);assert.equal(result.drawCounts[1].triangles,result.drawCounts[0].triangles);assert.ok(result.rayHits>0);assert.ok(result.changedPixelChannels/(512*512*4)<.001 && result.pixelRms<.5,'Render differs beyond raster edge tolerance: '+result.name);}
  }finally{await browser?.close();await server.close();}
}


async function measureSceneFrames() {
          const gl = window.__THREE_GL__, scene = window.__THREE_SCENE__, ctx = gl.getContext();
          const extension = ctx.getExtension('EXT_disjoint_timer_query_webgl2');
          const originalRender = gl.render, originalShadow = gl.shadowMap.render;
          const frames = [], cpu = [], gpu = [], draws = [], triangles = [], passes = new Map(), pending = [];
          let depth = 0, shadowMs = 0, shadowCalls = 0, cameraPose;
          let activePass='outside';let submissions=0,subdraws=0;const nativeFrames=[],subdrawFrames=[],restoreNative=[];
          const multi=ctx.getExtension('WEBGL_multi_draw');
          for(const method of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){const original=ctx[method];ctx[method]=function(...args){submissions++;subdraws++;return original.apply(this,args);};restoreNative.push(()=>ctx[method]=original);}
          if(multi)for(const method of ['multiDrawElementsWEBGL','multiDrawArraysWEBGL']){const original=multi[method];multi[method]=function(...args){submissions++;subdraws+=args.at(-1);return original.apply(this,args);};restoreNative.push(()=>multi[method]=original);}
          const originalDirect=gl.renderBufferDirect,robotPasses=new Map(),robotNames=new WeakMap();
          gl.renderBufferDirect=function(camera,s,geometry,material,object,group){
            let robot=robotNames.get(object);if(robot===undefined){robot='';for(let p=object;p;p=p.parent){const match=p.userData?.gltfPath?.match(/items\/(unitree-g1|unitree-go2|jumper)\//);if(match){robot=match[1];break;}}robotNames.set(object,robot);}
            const before=submissions,beforeSubs=subdraws,beforeTris=this.info.render.triangles;
            const result=originalDirect.call(this,camera,s,geometry,material,object,group);
            if(robot){const pass=material.isMeshDepthMaterial||material.isMeshDistanceMaterial?'shadow':activePass;const key=robot+' | '+pass;const record=robotPasses.get(key)||{submissions:0,subdraws:0,triangles:0};record.submissions+=submissions-before;record.subdraws+=subdraws-beforeSubs;record.triangles+=this.info.render.triangles-beforeTris;robotPasses.set(key,record);}
            return result;
          };

          let laraRaycastMs=0,laraRaycastCalls=0;
          const laraRaycasts=new Map();
          scene.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;let root=mesh;while(root&&!root.userData.gltfPath)root=root.parent;if(!root?.userData.gltfPath?.includes('/lara/'))return;const original=mesh.raycast;laraRaycasts.set(mesh,original);mesh.raycast=function(...args){const start=performance.now();try{return original.apply(this,args);}finally{laraRaycastMs+=performance.now()-start;laraRaycastCalls++;}};});

          gl.shadowMap.render = function(...args) { const start = performance.now(); try { return originalShadow.apply(this,args); } finally { shadowMs += performance.now()-start; shadowCalls++; } };
          gl.render = function(s, camera) {
            const target = this.getRenderTarget(); const main = s === scene && target === null && depth === 0;
            const name = main ? 'main-inclusive' : target ? `target-${target.width}x${target.height}` : 'other';
            const previousPass=activePass;activePass=name;
            const start = performance.now(), calls = this.info.render.calls, tris = this.info.render.triangles, nativeStart=submissions,subdrawStart=subdraws;
            let query;
            if (main) { frames.push(start); cameraPose = { position: camera.position.toArray(), quaternion: camera.quaternion.toArray() }; if(extension) { query=ctx.createQuery(); ctx.beginQuery(extension.TIME_ELAPSED_EXT,query); } }
            depth++;
            try { return originalRender.call(this,s,camera); } finally {
              depth--;activePass=previousPass; const ms = performance.now()-start;
              const pass = passes.get(name) || { count:0, cpuMs:0, calls:0, triangles:0 };
              pass.count++;pass.cpuMs+=ms;pass.calls+=this.info.render.calls-calls;pass.triangles+=this.info.render.triangles-tris;passes.set(name,pass);
              if(main) { nativeFrames.push(submissions-nativeStart);subdrawFrames.push(subdraws-subdrawStart);cpu.push(ms); draws.push(this.info.render.calls-calls);triangles.push(this.info.render.triangles-tris); if(query) {ctx.endQuery(extension.TIME_ELAPSED_EXT);pending.push(query);} }
            }
          };
          const collect = () => { while(pending.length && ctx.getQueryParameter(pending[0],ctx.QUERY_RESULT_AVAILABLE)) { const q=pending.shift(); if(!ctx.getParameter(extension.GPU_DISJOINT_EXT)) gpu.push(ctx.getQueryParameter(q,ctx.QUERY_RESULT)/1e6);ctx.deleteQuery(q); } };
          const start = performance.now();
          try { await new Promise(resolve => { const tick=now=> { collect(); if(now-start<10000) requestAnimationFrame(tick); else resolve(); };requestAnimationFrame(tick); }); }
          finally {gl.renderBufferDirect=originalDirect;for(const restore of restoreNative)restore();for(const [mesh,original] of laraRaycasts)mesh.raycast=original;gl.render=originalRender;gl.shadowMap.render=originalShadow;collect();for(const q of pending)ctx.deleteQuery(q); }
          const summary = values => { if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b);return {mean:values.reduce((a,b)=>a+b,0)/values.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],p99:sorted[Math.floor(sorted.length*.99)]}; };
          const intervals=frames.slice(1).map((t,i)=>t-frames[i]);
          const debug=ctx.getExtension('WEBGL_debug_renderer_info');
          let robotVisibleOriginals=0,robotBatchCount=0;scene.traverse(o=>{if(!o.isMesh)return;for(let p=o;p;p=p.parent){if(/items\/(unitree-g1|unitree-go2|jumper)\//.test(p.userData?.gltfPath||'')){if(o.userData.rigidRobotGroup)robotBatchCount++;else if(o.visible)robotVisibleOriginals++;break;}}});
          return {robotVisibleOriginals,robotBatchCount,multiDraw:!!multi,nativeSubmissions:summary(nativeFrames),subdraws:summary(subdrawFrames),robotPassesPerFrame:Object.fromEntries([...robotPasses].map(([key,value])=>[key,Object.fromEntries(Object.entries(value).map(([k,v])=>[k,v/frames.length]))])),laraRaycastMsPerFrame:laraRaycastMs/frames.length,laraRaycastCallsPerFrame:laraRaycastCalls/frames.length,frames:frames.length,fps:intervals.length*1000/intervals.reduce((a,b)=>a+b,0),frameMs:summary(intervals),renderCpuMs:summary(cpu),gpuMs:summary(gpu),drawCalls:summary(draws),triangles:summary(triangles),passes:Object.fromEntries(passes),shadowMs,shadowCalls,cameraPose,renderer:debug?ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL):null,drawingBuffer:[ctx.drawingBufferWidth,ctx.drawingBufferHeight], layers:{...(await import('/src/features/scene/store/useSceneStore.ts')).useSceneStore.getState().layers}};
}


async function profileRobotPairs() {
  const {createServer}=await import('vite');const directory='/tmp/room-robot-paired';fs.mkdirSync(directory,{recursive:true});
  const server=await createServer({server:{host:'127.0.0.1',port:5196,strictPort:true}});let browser;
  try {
    await server.listen();browser=await launch({args:['--no-sandbox','--enable-gpu','--use-angle=vulkan','--enable-features=Vulkan,VulkanFromANGLE','--disable-vulkan-surface']});
    const system=await browser.target().createCDPSession();fs.writeFileSync(directory+'/gpu.json',JSON.stringify(await system.send('SystemInfo.getInfo'),null,2));
    const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width:1362,height:810,deviceScaleFactor:1});
    await page.goto('http://127.0.0.1:5196/?skipIntro=1&preset=mid&mode=orbit',{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(async()=>{const {cameraState}=await import('/src/features/scene/cameraState.ts');return cameraState.isSceneLaunched&&!cameraState.isIntroRunning&&!!window.__THREE_GL__;},{timeout:180000});
    await page.evaluate(async()=>{
      const {cameraState}=await import('/src/features/scene/cameraState.ts');const {useSceneStore}=await import('/src/features/scene/store/useSceneStore.ts');const {resetAppIdle}=await import('/src/features/scene/idleState.ts');setInterval(resetAppIdle,1000);useSceneStore.getState().setCameraMovement('fix');useSceneStore.setState(s=>({layers:{...s.layers,groundType:'bermuda'}}));
      const models=[];window.__THREE_SCENE__.traverse(o=>{if(o.children.some(child=>child.userData.rigidRobotGroup))models.push(o);});if(models.length!==3)throw Error('Expected three robot render roots');
      window.robotPairs=models.map(target=>{const parent=target.parent,source=parent.children.find(o=>o!==target&&o.userData.gltfPath===target.userData.gltfPath);if(!source)throw Error('Missing original robot');const originals=[];source.traverse(o=>{if(o.isMesh)originals.push(o);});const name=target.userData.gltfPath.split('/')[1];let placement=parent;while(placement&&!placement.userData.hoverAction)placement=placement.parent;if(!placement)throw Error('Missing robot placement');const config={'unitree-g1':{position:[50,0,-450],motion:'walk'},'unitree-go2':{position:[220,0,-620],motion:'trot'},jumper:{position:[430,0,-450],motion:'walk'}}[name];const key=name==='jumper'?'jumper':name;document.dispatchEvent(new CustomEvent('furniture-toggle',{detail:{key:key+'-motion',value:config.motion}}));document.dispatchEvent(new CustomEvent('furniture-toggle',{detail:{key:key+'-replay'}}));placement.position.set(...config.position);placement.rotation.set(0,0,0);return {target,parent,source,originals};});
      const tick=()=>{cameraState.invalidate?.();requestAnimationFrame(tick);};tick();
    });
    await delay(12000);const results=[];
    for(const mode of ['original','instanced','instanced','original']){
      await page.evaluate(mode=>{for(const pair of window.robotPairs){if(mode==='original')pair.parent.remove(pair.target);else pair.parent.add(pair.target);for(const mesh of pair.originals)mesh.visible=mode==='original';}},mode);
      await delay(3000);console.log('PAIR',mode);const metrics=await page.evaluate(measureSceneFrames);results.push({mode,...metrics});fs.writeFileSync(directory+'/summary.json',JSON.stringify({protocol:'Same page, robots walking in place at fixed initial positions; human activities unchanged',results,errors},null,2));console.log(JSON.stringify(results.at(-1)));
    }
    if(errors.length)throw Error(errors.join('\n'));
  }finally{await browser?.close();await server.close();}
}
