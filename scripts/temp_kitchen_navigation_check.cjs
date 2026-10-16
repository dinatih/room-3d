const launchBrowser = require('./browser-test-options.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
if (process.argv.includes('--bed-patch')) {
  const diff=require('node:child_process').execFileSync('git',['diff','--','src/features/scene/ai/smartObjectRegistry.ts'],{encoding:'utf8'});
  const [header,...hunks]=diff.split(/(?=^@@)/m);
  const own=hunks.filter(h=>h.includes("+import { positionState }") || h.includes("+  'bed-double': {") || h.includes('export function getAllSmartObjectIds()') || h.includes("+  if (objectId === 'bed-double'"));
  assert.equal(own.length,4,'Only the double-bed definition, import, availability and interaction sequence belong to this task');
  fs.writeFileSync('/tmp/room-double-bed.patch',header+own.join(''));return;
}
if (process.argv.includes('--duo-patch')) {
  const diff = require('node:child_process').execFileSync('git',['diff','--','src/features/scene/ai/smartObjectRegistry.ts'],{encoding:'utf8'});
  const [header,...hunks] = diff.split(/(?=^@@)/m);
  const own = hunks.filter(hunk=>hunk.includes('INYEONG_CHA_DUO_IDS') || hunk.includes("+        arrival: 'approach'"));
  assert.equal(own.length,2,'The duo patch must contain only its imports / geometry and its SmartObject placement');
  const patch = (header+own.join('')).replace('-        offset: [0, 0, 0],\n+        offset: [0, 0, 60],\n','         offset: [0, 0, 0],\n');
  fs.writeFileSync('/tmp/room-duo-placement.patch',patch);
  console.log('Duo-only registry patch written; pre-existing slot edits excluded.');
  return;
}
if (process.argv.includes('--bearhug-data')) {
  for (const role of ['m','f']) {
    const bytes = fs.readFileSync(`public/animations/miley/miley_armature_date_bearhug_${role}.glb`);
    const jsonLength = bytes.readUInt32LE(12), gltf = JSON.parse(bytes.subarray(20,20+jsonLength).toString());
    const tracks = gltf.animations[0].channels.filter(channel => channel.target.path === 'translation' && /root|hips|pelvis/i.test(gltf.nodes[channel.target.node].name)).map(channel => {
      const accessor = gltf.accessors[gltf.animations[0].samplers[channel.sampler].output], view = gltf.bufferViews[accessor.bufferView];
      assert.equal(accessor.componentType,5126);
      const offset = 28+jsonLength+(view.byteOffset||0)+(accessor.byteOffset||0), stride = view.byteStride||12;
      const points = Array.from({length:accessor.count},(_,i)=>[0,1,2].map(axis=>bytes.readFloatLE(offset+i*stride+axis*4)));
      return {node:gltf.nodes[channel.target.node].name,first:points[0],last:points.at(-1),min:[0,1,2].map(axis=>Math.min(...points.map(p=>p[axis]))),max:[0,1,2].map(axis=>Math.max(...points.map(p=>p[axis])))};
    });
    console.log(role,JSON.stringify(tracks));
  }
  return;
}
if (process.argv.includes('--scooter-data')) {
  const bytes = fs.readFileSync('public/items/xiaomi-scooter4/xiaomi-scooter4.glb');
  const gltf = JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  console.log(JSON.stringify({ materials:gltf.materials.map(m=>m.name), nodes:gltf.nodes, meshes:gltf.meshes.map(mesh => ({name:mesh.name, bounds:mesh.primitives.map(p => ({material:gltf.materials[p.material].name, position:gltf.accessors[p.attributes.POSITION]}))})) },null,2));
  return;
}
if (process.argv.includes('--plant-data')) {
  for (const path of ['public/items/plant-monstera/potted_palm.glb', 'public/items/yucca10329308/Yucca10329308.glb']) {
    const buffer = fs.readFileSync(path);
    const json = JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString());
    console.log(path, JSON.stringify({ materials: json.materials.map(m=>({name:m.name,alphaMode:m.alphaMode})), nodes: json.nodes.map(n=>({name:n.name,mesh:n.mesh})), meshes: json.meshes.map(m=>({name:m.name,materials:m.primitives.map(p=>p.material)})) }));
  }
  process.exit(0);
}
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }, fileName: filename,
  });
  module._compile(outputText, filename);
};
const g = require('../src/features/scene/ai/navigation/geometry.ts');
if (process.argv.includes('--startup-url')) {
  (async () => {
    const studio = fs.readFileSync('src/features/scene/Studio.tsx','utf8');
    const loadingSource = studio.slice(studio.indexOf('function LoadingProgress('),studio.indexOf('function SceneAmbientLight('));
    const loadingJS = ts.transpileModule(loadingSource,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
    const revealSource = studio.split('const revealScene = useCallback(() => {')[1].split('\n  }, []);')[0];
    const revealJS = ts.transpileModule(`function revealScene() {${revealSource}\n}`,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
    const browser = await launchBrowser({args:['--no-sandbox']});
    try {
      const page = await browser.newPage();
      await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5187'}/AGENTS.md`);
      const results = await page.evaluate(async ({loadingJS,revealJS}) => {
        const params = await import('/src/features/scene/camera/cameraUrlParams.ts');
        const THREE = await import('/node_modules/.vite/deps/three.js');
        const {CameraIntroController,getIntroTargetPose} = await import('/src/features/scene/camera/cameraIntroTransition.ts');
        const {cameraState} = await import('/src/features/scene/cameraState.ts');
        const React = (await import('/node_modules/.vite/deps/react.js')).default;
        const {createRoot} = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
        const {flushSync} = (await import('/node_modules/.vite/deps/react-dom.js')).default;
        const setURL = query => history.replaceState(null,'',`/AGENTS.md${query}`);
        const modes = ['orbit','fpv','follow','top','ortho'];
        setURL(''); if (params.parseUrlSkipIntro() || params.parseUrlCameraMode() !== 'fpv') throw new Error('Startup defaults changed');
        for (const mode of modes) {
          setURL(`?skipIntro=1&mode=${mode}`);
          if (!params.parseUrlSkipIntro() || params.parseUrlCameraMode() !== mode) throw new Error(`Invalid startup mode ${mode}`);
          params.updateUrlCameraMode(mode);
          if (params.parseUrlCameraMode() !== mode || !params.parseUrlSkipIntro()) throw new Error(`Mode ${mode} was lost when the URL was updated`);
        }
        setURL('?skipIntro=0'); if (params.parseUrlSkipIntro()) throw new Error('skipIntro=0 must keep the intro');
        setURL('#/?skipIntro=1&mode=orbit'); if (!params.parseUrlSkipIntro() || params.parseUrlCameraMode() !== 'orbit') throw new Error('Hash startup parameters failed');
        params.updateUrlCameraMode('orbit'); if (!params.parseUrlSkipIntro()) throw new Error('Updating the mode lost the hash skip flag');
        setURL('?skipIntro=1&mode=orbit');
        let frames = 0, launches = 0, countdowns = 0, assets = 0;
        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = callback => {frames++;return originalRAF(callback);};
        const camera = new THREE.PerspectiveCamera();
        const controls = {target:new THREE.Vector3(),enabled:true,update:()=>{}};
        const intro = new CameraIntroController(camera,controls);
        const reveal = new Function('cameraState','parseUrlSkipIntro',`${revealJS};return revealScene;`)(cameraState,params.parseUrlSkipIntro);
        const onStart = event => intro.start('orbit',()=>{launches++;},event.detail.skip);
        document.addEventListener('start-camera-intro',onStart);
        document.body.innerHTML = '<div id="loading"><div id="loading-envelope"></div></div><div id="startup-test"></div>';
        const root = createRoot(document.getElementById('startup-test'));
        const Loading = new Function('useProgress','useRef','useEffect',`${loadingJS};return LoadingProgress;`)(()=>({progress:100,active:false,item:''}),React.useRef,React.useEffect);
        const render = ready => flushSync(()=>root.render(React.createElement(Loading,{skipIntro:true,sceneReady:ready,onAssetsLoaded:()=>{assets++;},onCountdownStart:()=>{countdowns++;},onCountdownTick:()=>{},onLaunch:reveal})));
        render(false);
        if (launches || countdowns) throw new Error('Debug startup must wait for scene readiness');
        render(true);
        if (launches !== 1 || countdowns || !assets || document.getElementById('loading') || !cameraState.isSceneLaunched || cameraState.isIntroRunning) throw new Error('Direct startup did not complete immediately: '+JSON.stringify({launches,countdowns,assets,cover:!!document.getElementById('loading'),launched:cameraState.isSceneLaunched,intro:cameraState.isIntroRunning}));
        if (frames !== 0 || camera.position.distanceTo(getIntroTargetPose('orbit').pos) !== 0) throw new Error('Skipped intro scheduled a flight or left the camera in the sky');
        root.unmount(); document.removeEventListener('start-camera-intro',onStart);
        intro.start('orbit',()=>{});
        if (!cameraState.isIntroRunning || frames !== 1) throw new Error('Normal intro no longer animates');
        intro.destroy(); window.requestAnimationFrame = originalRAF;
        return {modes,launches,countdowns,assets,skippedFlightFrames:0};
      },{loadingJS,revealJS});
      console.log('Startup URL and actual loading / intro checks:',JSON.stringify(results));
    } finally { await browser.close(); }
  })().catch(error=>{console.error(error);process.exitCode=1;});
  return;
}
if (process.argv.includes('--animation-asset-stats')) {
  const sources=[];
  for (const name of fs.readdirSync('public/animations',{recursive:true}).filter(name=>name.endsWith('.glb'))) {
    const fd=fs.openSync(`public/animations/${name}`,'r'),header=Buffer.alloc(20);fs.readSync(fd,header,0,20,0);
    const jsonBytes=Buffer.alloc(header.readUInt32LE(12));fs.readSync(fd,jsonBytes,0,jsonBytes.length,20);fs.closeSync(fd);
    const json=JSON.parse(jsonBytes.toString());
    if (json.meshes?.length) sources.push({name,meshes:json.meshes.length,vertices:json.meshes.reduce((sum,mesh)=>sum+mesh.primitives.reduce((sum,p)=>sum+json.accessors[p.attributes.POSITION].count,0),0)});
  }
  console.log('Animation files with unused source meshes:',JSON.stringify(sources));
  return;
}
if (process.argv.includes('--animation-source')) {
  (async () => {
    const THREE = require('three'), { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader.js');
    const { animationSourcePlugin, extractAnimationSource } = require('../src/features/scene/character/animationSource.ts');
    if (!global.ProgressEvent) global.ProgressEvent = class extends Event { constructor(type, options) { super(type); Object.assign(this,options); } };
    const data = Buffer.from(new Float32Array([0,1, 0,100,0, 100,100,0]).buffer);
    const json = {asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],
      nodes:[{name:'Root',mesh:0,skin:0,translation:[2,3,4],scale:[0.01,0.01,0.01],children:[1]}, {name:'Hips',translation:[0,100,0]}],
      skins:[{joints:[1]}],meshes:[{primitives:[{attributes:{POSITION:1},material:0}]}],
      materials:[{pbrMetallicRoughness:{baseColorTexture:{index:0}}}],textures:[{source:0}],images:[{uri:'unused-character-texture.png'}],
      buffers:[{byteLength:data.length,uri:'data:application/octet-stream;base64,'+data.toString('base64')}],
      bufferViews:[{buffer:0,byteOffset:0,byteLength:8},{buffer:0,byteOffset:8,byteLength:24}],
      accessors:[{bufferView:0,componentType:5126,count:2,type:'SCALAR',min:[0],max:[1]}, {bufferView:1,componentType:5126,count:2,type:'VEC3'}],
      animations:[{name:'walk',samplers:[{input:0,output:1}],channels:[{sampler:0,target:{node:1,path:'translation'}}]}]};
    const loader = new GLTFLoader().register(animationSourcePlugin);
    const source = extractAnimationSource(await loader.parseAsync(JSON.stringify(json),''));
    source.scene.updateMatrixWorld(true);
    const bone = source.scene.getObjectByName('Hips');
    assert.ok(bone.isBone);
    assert.deepEqual(bone.getWorldPosition(new THREE.Vector3()).toArray(),[2,4,4]);
    assert.equal(source.animations[0].duration,1);
    assert.deepEqual([...source.animations[0].tracks[0].values],[0,100,0,100,100,0]);
    source.scene.traverse(node => { assert.equal(node.isMesh, undefined); assert.equal(node.geometry, undefined); assert.equal(node.material, undefined); });
    console.log('Skeletal GLTF loading preserves transforms and animation tracks without loading the unused character mesh or texture.');
  })().catch(error=>{console.error(error);process.exitCode=1;});
  return;
}
if (process.argv.includes('--app-profile')) {
  (async () => {
    const hardware = process.argv.includes('--hardware-gpu') || process.argv.includes('--hardware-headless');
    const browser = await launchBrowser({ args: ['--no-sandbox', ...(hardware ? ['--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan,VulkanFromANGLE', '--render-node-override=/dev/dri/renderD128', ...(process.argv.includes('--headed') ? ['--ozone-platform=wayland'] : ['--disable-vulkan-surface'])] : ['--enable-unsafe-swiftshader'])] });
    try {
      const page = await browser.newPage(), client = await page.createCDPSession();
      const navigationAudit = process.argv.includes('--navigation-cost');
      if (navigationAudit) {
        await page.setRequestInterception(true);
        page.on('request', async request => {
          const agent = request.url().includes('/ai/useAgentController.ts');
          const obstacle = request.url().includes('/navigation/NavigationObstacle.tsx');
          if (!agent && !obstacle) { await request.continue(); return; }
          console.log('Instrumenting:', request.url());
          const response = await fetch(request.url());
          let body = await response.text();
          if (agent) {
            assert.ok(body.includes('return { update,'), 'Controller interception no longer matches');
            body = body.replace('return { update,', `return { update: (dt) => {
              if (window.pauseNavigationAudit) return stateRef.current;
              const started = performance.now();
              try { return update(dt); } finally {
                const stats = window.navigationAudit.controller;
                stats.calls++; stats.ms += performance.now() - started;
              }
            },`);
          } else {
            assert.ok(body.includes('useFrame(update, -1)'), 'Obstacle interception no longer matches');
            body = body.replace('useFrame(update, -1)', `useFrame(() => {
              if (window.pauseNavigationAudit) return;
              const started = performance.now();
              try { update(); } finally {
                const stats = window.navigationAudit.obstacles;
                stats.calls++; stats.ms += performance.now() - started;
              }
            }, -1)`);
          }
          await request.respond({ status:200, contentType:'application/javascript', body });
        });
      }
      if (process.argv.includes('--baseline-assets')) {
        await page.setRequestInterception(true);
        page.on('request', async request => {
          if (request.url().includes('/character/useCharacterAnimations.ts')) {
            const response = await fetch(request.url()), body = await response.text();
            assert.ok(body.includes('resolve(extractAnimationSource(gltf))'));
            await request.respond({ status:200, contentType:'application/javascript', body:body.replace('resolve(extractAnimationSource(gltf))','resolve(gltf)').replace('loader.register(animationSourcePlugin);','') });
          } else await request.continue();
        });
      }
      page.on('pageerror', error => console.log('App error:', error.message));
      await page.evaluateOnNewDocument(() => {
        window.freezeSamples = [];
        window.navigationAudit = { controller: { calls:0, ms:0 }, obstacles: { calls:0, ms:0 } };
        new PerformanceObserver(list => { for (const entry of list.getEntries()) window.freezeSamples.push({ start: entry.startTime, duration: entry.duration }); }).observe({ type: 'longtask', buffered: true });
        window.frameSamples = [];
        let previous;
        function frame(time) { if (previous !== undefined) window.frameSamples.push(time - previous); previous = time; requestAnimationFrame(frame); }
        requestAnimationFrame(frame);
      });
      await client.send('Profiler.enable');
      await client.send('Profiler.start');
      await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5186'}/?${process.env.ROOM_APP_QUERY || 'characterCount=15'}&animOriginLerp=false&animCrossfade=false&exitTransitions=false`, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.evaluate(async () => {
        const idle = await import('/src/features/scene/idleState.ts');
        setInterval(idle.resetAppIdle, 1000);
      });
      let pointerTick = 0;
      const keepActiveFor = async milliseconds => {
        const until = Date.now() + milliseconds;
        while (Date.now() < until) {
          await page.mouse.move(100 + pointerTick++ % 2, 100);
          await new Promise(resolve => setTimeout(resolve, Math.min(1000, Math.max(0, until - Date.now()))));
        }
      };
      if (navigationAudit) {
        await page.bringToFront();
        const readyDeadline = Date.now() + 120000;
        let nextReadyLog = Date.now();
        while (!await page.evaluate(() => window.navigationAudit.controller.calls > 0)) {
          assert.ok(Date.now() < readyDeadline, 'Navigation never became active');
          if (Date.now() >= nextReadyLog) {
            console.log('Waiting for scene:', JSON.stringify(await page.evaluate(() => ({
              navigation:window.navigationAudit, drawCalls:window.__DEV_STATE__?.drawCalls,
              programs:window.__THREE_GL__?.info.programs.length,
              text:document.body.innerText.slice(0, 600),
            }))));
            nextReadyLog = Date.now() + 10000;
          }
          await keepActiveFor(1000);
        }
        await keepActiveFor(20000);
        if (process.argv.includes('--sky-view')) await page.evaluate(async () => {
          const THREE = await import('/node_modules/.vite/deps/three.js');
          const renderer = window.__THREE_GL__, render = renderer.render;
          const saved = new THREE.Quaternion(), target = new THREE.Vector3();
          renderer.render = function(scene, camera) {
            if (this.getRenderTarget() !== null || !camera.isPerspectiveCamera) return render.call(this, scene, camera);
            saved.copy(camera.quaternion);
            target.copy(camera.position); target.y += 1;
            camera.lookAt(target);
            try { return render.call(this, scene, camera); }
            finally { camera.quaternion.copy(saved); camera.updateMatrixWorld(); }
          };
        });
      }
      const phases = process.argv.includes('--long-profile') ? 6 : 3;
      for (let phase = 0; phase < phases; phase++) {
        if (navigationAudit) await page.evaluate(paused => {
          window.pauseNavigationAudit = paused;
          window.navigationAudit = { controller: { calls:0, ms:0 }, obstacles: { calls:0, ms:0 } };
          window.frameSamples = [];
          window.freezeSamples = [];
        }, phase === 1);
        await page.bringToFront();
        await page.mouse.move(100 + phase,100 + phase);
        await keepActiveFor(20000);
        if (navigationAudit) console.log('Navigation cost:', JSON.stringify(await page.evaluate(() => ({
          paused:!!window.pauseNavigationAudit, ...window.navigationAudit,
          frameCount:window.frameSamples.length,
          meanFrameMs:window.frameSamples.reduce((sum,ms)=>sum+ms,0)/window.frameSamples.length,
        }))));
        console.log('App sample:', JSON.stringify(await page.evaluate(() => {
          const renderer = window.__THREE_GL__, context = renderer?.getContext(), debug = context?.getExtension('WEBGL_debug_renderer_info');
          return { seconds: performance.now() / 1000, visibility:document.visibilityState, gpu: debug && context.getParameter(debug.UNMASKED_RENDERER_WEBGL), programs: renderer?.info.programs.length, drawCalls:window.__DEV_STATE__?.drawCalls, triangles:window.__DEV_STATE__?.triangles, heap: performance.memory?.usedJSHeapSize, frames: window.frameSamples.length, worstFrame: Math.max(0, ...window.frameSamples), longTasks: window.freezeSamples.sort((a,b) => b.duration-a.duration).slice(0, 8), recentLongTasks: window.freezeSamples.filter(t => t.start >= performance.now()-20000).sort((a,b)=>b.duration-a.duration).slice(0, 5) };
        })));
      }
      const { profile } = await client.send('Profiler.stop');
      fs.writeFileSync(process.argv.includes('--baseline-assets') ? '/tmp/room-app-cpu-baseline.json' : '/tmp/room-app-cpu-profile.json', JSON.stringify(profile));
      await client.send('HeapProfiler.collectGarbage');
      console.log('Collected app memory:', JSON.stringify(await client.send('Runtime.getHeapUsage')));
      const nodes = new Map(profile.nodes.map(node => [node.id, node])), totals = new Map();
      profile.samples.forEach((id, i) => { const frame = nodes.get(id).callFrame, key = `${frame.functionName} ${frame.url}:${frame.lineNumber + 1}`; totals.set(key, (totals.get(key) || 0) + profile.timeDeltas[i]); });
      console.log('CPU self time (ms):', JSON.stringify([...totals].sort((a,b)=>b[1]-a[1]).slice(0, 30).map(([frame, us])=>({ frame, ms: us/1000 })), null, 2));
    } finally { await browser.close(); }
  })().catch(error => { console.error(error); process.exitCode = 1; });
  return;
}
if (process.argv.includes('--benchmark') || process.argv.includes('--benchmark-audit')) {
  const Module = require('node:module');
  const source = require('node:child_process').execFileSync('git', ['show', `${process.env.ROOM_NAV_BASELINE || 'HEAD'}:src/features/scene/ai/navigation/geometry.ts`], { encoding: 'utf8' });
  const baseline = new Module(__filename, module);
  baseline.paths = module.paths;
  baseline._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, __filename);
  const fixture = process.argv.includes('--benchmark-audit') ? JSON.parse(fs.readFileSync('/tmp/room-navigation-audit.json', 'utf8')).blocked[0] : JSON.parse(fs.readFileSync('/tmp/room-navigation-benchmark.json', 'utf8'));
  const { obstacles } = fixture;
  const queries = fixture.queries ?? [[fixture.state, fixture.route.target]];
  const results = [];
  for (const [start, target] of queries) {
    const compare = implementation => {
      const graph = new implementation.VisibilityGraph(obstacles);
      const started = performance.now(), route = graph.find(start, target);
      return { ms: performance.now() - started, length: route ? route.reduce((sum, p, i) => sum + g.distance(i ? route[i - 1] : start, p), 0) : null };
    };
    const before = compare(baseline.exports), after = compare(g);
    assert.ok(before.length === after.length || (before.length !== null && after.length !== null && Math.abs(before.length - after.length) < 1e-6), 'Scene shortest path changed');
    results.push({ start, target, before, after });
  }
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}
const { requestDoor, releaseDoor, releaseAgentDoors, doorRequested } = require('../src/features/scene/ai/navigation/doorRequests.ts');
const square = g.rectangle(0, 0, 10, 10);
const obstacles = g.union([square]);
const graph = new g.VisibilityGraph(obstacles);
const start = { x: -10, z: 0 }, target = { x: 10, z: 0 };
const route = graph.find(start, target);
assert.ok(route);
const length = [start, ...route].slice(1).reduce((sum, p, i) => sum + g.distance([start, ...route][i], p), 0);
assert.ok(Math.abs(length - (10 + 2 * Math.sqrt(50))) < 1e-6, `Shortest route length ${length}`);
assert.equal(graph.find({ x: 0, z: 0 }, target), null);
assert.deepEqual(graph.find({ x: -10, z: 10 }, { x: 10, z: 10 }), [{ x: 10, z: 10 }]);
assert.equal(g.segmentFree(start, target, obstacles), false);
assert.equal(g.segmentFree({ x: -10, z: -5 }, { x: 10, z: -5 }, obstacles), true);
assert.throws(() => graph.find({ x: NaN, z: 0 }, target));
const inflated = g.inflate(square, 2);
assert.ok(g.pointInRing({ x: 6.9, z: 0 }, inflated));
assert.equal(g.pointInRing({ x: 7.2, z: 0 }, inflated), false);
const rotated = new g.VisibilityGraph(g.union([g.inflate(g.rectangle(0, 0, 20, 5, Math.PI / 4), 2)]));
const rotatedRoute = rotated.find({ x: -30, z: 0 }, { x: 30, z: 0 });
assert.ok(rotatedRoute);
let previous = { x: -30, z: 0 };
for (const p of rotatedRoute) { assert.ok(g.segmentFree(previous, p, rotated.obstacles)); previous = p; }
const overlap = g.union([g.rectangle(-2, 0, 10, 10), g.rectangle(2, 0, 10, 10)]);
assert.equal(overlap.length, 1);
const holed = g.union([g.rectangle(0, -10, 30, 4), g.rectangle(0, 10, 30, 4), g.rectangle(-13, 0, 4, 20), g.rectangle(13, 0, 4, 20)]);
assert.equal(g.insideObstacle({ x: 0, z: 0 }, holed), false);
assert.ok(new g.VisibilityGraph(holed).find({ x: 0, z: 0 }, { x: 5, z: 5 }));
// Independent Dijkstra oracle keeps every visible edge, including non-tangents.
function completeVisibilityDistance(obstacles, start, target) {
  if (g.insideObstacle(start, obstacles) || g.insideObstacle(target, obstacles)) return Infinity;
  const nodes = [start, target, ...obstacles.flat(2)];
  const costs = nodes.map(() => Infinity), visited = new Set();
  costs[0] = 0;
  while (visited.size < nodes.length) {
    let current = -1;
    for (let i = 0; i < nodes.length; i++) if (!visited.has(i) && (current < 0 || costs[i] < costs[current])) current = i;
    if (current === 1 || costs[current] === Infinity) return costs[1];
    visited.add(current);
    for (let i = 0; i < nodes.length; i++) {
      if (visited.has(i) || !g.segmentFree(nodes[current], nodes[i], obstacles, true)) continue;
      costs[i] = Math.min(costs[i], costs[current] + g.distance(nodes[current], nodes[i]));
    }
  }
  return costs[1];
}
const fixtures = [
  g.union([g.inflate(g.rectangle(-6, 0, 4, 18, Math.PI / 5), 1), g.inflate(g.rectangle(7, 0, 4, 14, -Math.PI / 7), 1)]),
  g.union([g.rectangle(-4, 0, 8, 20), g.rectangle(3, 6, 14, 8)]),
  g.union([g.rectangle(0, -20, 50, 4), g.rectangle(0, 20, 50, 4), g.rectangle(-23, 0, 4, 40), g.rectangle(23, 0, 4, 40), g.rectangle(0, 0, 8, 16)]),
];
const endpoints = [{x:-18,z:-15}, {x:18,z:15}, {x:0,z:15}, {x:0,z:-15}, {x:-30,z:0}, {x:30,z:0}];
for (const obstacles of fixtures) {
  const graph = new g.VisibilityGraph(obstacles);
  for (let i = 0; i < endpoints.length; i++) for (let j = i + 1; j < endpoints.length; j++) {
    const start = endpoints[i], target = endpoints[j], route = graph.find(start, target);
    const actual = route ? route.reduce((sum, p, i) => sum + g.distance(i ? route[i - 1] : start, p), 0) : Infinity;
    const expected = completeVisibilityDistance(obstacles, start, target);
    assert.ok(actual === expected || Math.abs(actual - expected) < 1e-6, `Tangent graph changed shortest distance: ${actual} vs ${expected}`);
    if (route) route.forEach((p, i) => assert.ok(g.segmentFree(i ? route[i - 1] : start, p, obstacles)));
  }
}
console.log('Tangent graph matches complete visibility Dijkstra on 45 routes: rounded, rotated, concave, enclosed and disconnected obstacles.');
requestDoor('bath', 'a'); assert.equal(requestDoor('bath', 'b'), false);
releaseDoor('bath', 'a'); assert.equal(requestDoor('bath', 'b'), true);
releaseAgentDoors('b'); assert.equal(doorRequested('bath'), false);
assert.equal(requestDoor('glassRight', 'a'), true);
assert.equal(requestDoor('glassLeft', 'b'), false);
assert.equal(doorRequested('glassLeft'), true);
releaseAgentDoors('a');
assert.equal(requestDoor('glassRight', 'b'), true);
releaseAgentDoors('b');
assert.equal(requestDoor('glassRight', 'a', 'closed'), true);
assert.equal(requestDoor('glassLeft', 'b'), false);
assert.equal(doorRequested('glassRight'), false);
releaseAgentDoors('a');
assert.equal(doorRequested('glassLeft'), true);
releaseAgentDoors('b');
console.log('Geometry checks passed: shortest route, direct routes, inflation, rotation, overlaps, holes, invalid targets, FIFO door reservations.');

if (process.argv.includes('--browser')) (async () => {
  const puppeteer = require('puppeteer');
  const browser = await launchBrowser({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    if (process.argv.includes('--physical-baseline')) {
      await page.setRequestInterception(true);
      page.on('request', async request => {
        if (!request.url().includes('/navigation/service.ts')) { await request.continue(); return; }
        const response = await fetch(request.url()), body = await response.text();
        const graph = /new VisibilityGraph\(union\(obstacles\),[^;]+\);/;
        assert.ok(graph.test(body), 'Physical baseline interception no longer matches');
        await request.respond({ status: 200, contentType: 'application/javascript', body: body.replace(graph, 'new VisibilityGraph(union(obstacles));') });
      });
    }
    if (process.argv.includes('--shower-only')) {
      await page.setRequestInterception(true);
      page.on('request',async request => {
        if (!request.url().includes('/agent/agentInstructionCoords.ts')) { await request.continue(); return; }
        const response = await fetch(request.url()), body = await response.text();
        const declaration = /export function resolveInstructionCoords\([^)]*\) \{/;
        assert.ok(declaration.test(body),'Coordinate instrumentation no longer matches');
        await request.respond({status:200,contentType:'application/javascript',body:body.replace(declaration,'$&\nwindow.coordinateResolveCalls = (window.coordinateResolveCalls || 0) + 1;')});
      });
    }
    if (process.argv.includes('--profile')) {
      const client = await page.createCDPSession();
      await page.exposeFunction('measureHeap', async () => {
        await client.send('HeapProfiler.collectGarbage');
        return client.send('Runtime.getHeapUsage');
      });
    }
    const errors = [];
    page.on('console', message => { if (message.text().startsWith('Controlled exit:') || message.text().startsWith('Agent trace:') || message.type() === 'error') console.log('CONSOLE:', message.text()); });
    page.on('requestfailed', request => console.log('REQUEST:', request.url(), request.failure()?.errorText));
    page.on('pageerror', error => { errors.push(error.message); console.error('PAGE:', error.message); });
    await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5186'}/AGENTS.md`);
    if (process.argv.includes('--mirror-resources')) {
      await page.evaluate(async () => {
        (await import('/@react-refresh')).default.injectIntoGlobalHook(window);
        window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
        const React=(await import('/node_modules/.vite/deps/react.js')).default;
        const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
        const {Canvas} = await import('/node_modules/.vite/deps/@react-three_fiber.js');
        const {MirrorsA,MirrorBath}=await import('/src/features/scene/building/Mirrors.tsx');
        document.body.innerHTML='<div id="mirror-test" style="height:100vh"></div>';
        const e=React.createElement,root=createRoot(document.getElementById('mirror-test'));
        window.renderMirrors=visible=>root.render(e(Canvas,{frameloop:'never',onCreated:({scene,gl,camera})=>{window.mirrorContext={scene,gl,camera};}}, visible&&e(React.Fragment,null,e(MirrorsA,{showReflection:true,reflectorOnly:true}),e(MirrorBath,{showReflection:true}))));
        window.renderMirrors(true);
      });
      await page.waitForFunction(()=>{let n=0;window.mirrorContext?.scene.traverse(node=>{if(node.isReflector)n++;});return n===2;});
      const matrices=await page.evaluate(()=>{
        const {scene,gl,camera}=window.mirrorContext;
        camera.position.set(180,100,300);camera.lookAt(5.5,100,100);camera.layers.enableAll();
        const update=scene.updateMatrixWorld.bind(scene),render=gl.render.bind(gl);let calls=0,renders=0;
        scene.updateMatrixWorld=(...args)=>{calls++;return update(...args);};
        gl.render=(...args)=>{renders++;return render(...args);};
        gl.render(scene,camera);
        window.mirrorDisposed={target:0,geometry:0};
        scene.traverse(node=>{if(node.isReflector){node.getRenderTarget().addEventListener('dispose',()=>window.mirrorDisposed.target++);node.geometry.addEventListener('dispose',()=>window.mirrorDisposed.geometry++);}});
        return {calls,renders,autoUpdate:scene.matrixWorldAutoUpdate};
      });
      assert.ok(matrices.renders>1,'Test must actually render a reflection');assert.equal(matrices.calls,1,'Reflection passes must reuse the main render matrices');assert.equal(matrices.autoUpdate,true);
      await page.evaluate(()=>window.renderMirrors(false));
      await page.waitForFunction(()=>window.mirrorDisposed.target===2);
      assert.deepEqual(await page.evaluate(()=>window.mirrorDisposed),{target:2,geometry:2});
      assert.equal(errors.length,0);
      console.log('Mirror regressions passed: one world-matrix update per frame; both reflector targets and geometries released on unmount.');
      return;
    }
    if (process.argv.includes('--animation-real')) {
      const report = await page.evaluate(async () => {
        const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
        const { DRACOLoader } = await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
        const { animationSourcePlugin } = await import('/src/features/scene/character/animationSource.ts');
        const { retargetClip } = await import('/src/features/scene/retargeting/retargetClip.ts');
        const { clone } = await import('/node_modules/three/examples/jsm/utils/SkeletonUtils.js');
        const draco = new DRACOLoader().setDecoderPath('/draco/'), results=[];
        for (const path of ['/animations/mixamo/anim_walking.glb','/animations/npz/sports/anim_soccer_kick.glb','/animations/mixamo/anim_female_locomotion_pose.glb']) {
          const full = await new GLTFLoader().setDRACOLoader(draco).loadAsync(path);
          const lean = await new GLTFLoader().setDRACOLoader(draco).register(animationSourcePlugin).loadAsync(path);
          full.scene.updateMatrixWorld(true); lean.scene.updateMatrixWorld(true);
          const fullBones=[], leanBones=[];
          full.scene.traverse(node=>{if(node.isBone)fullBones.push({name:node.name,matrix:node.matrixWorld.elements});});
          lean.scene.traverse(node=>{if(node.isBone)leanBones.push({name:node.name,matrix:node.matrixWorld.elements});});
          const target=clone(full.scene);
          target.updateMatrixWorld(true);
          target.traverse(node=>{if(node.isBone){node.restLocalQuaternion=node.quaternion.clone();node.restWorldQuaternion=node.getWorldQuaternion(node.quaternion.clone());node.restWorldPosition=node.getWorldPosition(node.position.clone());node.defaultPosition=node.position.clone();}});
          const before=retargetClip(full.animations[0],target,full.scene), after=retargetClip(lean.animations[0],target,lean.scene);
          const tracks=clip=>clip.tracks.map(track=>({name:track.name,times:[...track.times],values:[...track.values]}));
          let meshes=0,fullMeshes=0;const geometryBuffers=new Set();
          lean.scene.traverse(node=>{if(node.isMesh)meshes++;});
          full.scene.traverse(node=>{if(node.isMesh){fullMeshes++;for(const attribute of Object.values(node.geometry.attributes))geometryBuffers.add(attribute.array.buffer);if(node.geometry.index)geometryBuffers.add(node.geometry.index.array.buffer);}});
          results.push({path,bonesIdentical:JSON.stringify(fullBones)===JSON.stringify(leanBones),retargetIdentical:JSON.stringify(tracks(before))===JSON.stringify(tracks(after)),meshes,fullMeshes,unusedGeometryBytes:[...geometryBuffers].reduce((sum,buffer)=>sum+buffer.byteLength,0),tracks:after.tracks.length});
        }
        draco.dispose(); return results;
      });
      assert.ok(report.every(result=>result.bonesIdentical&&result.retargetIdentical&&result.meshes===0),JSON.stringify(report));
      assert.equal(errors.length,0);
      console.log('Actual animation GLTF regressions:',JSON.stringify(report));
      return;
    }
    if (process.argv.includes('--wig-resources')) {
      await page.evaluate(async () => {
        (await import('/@react-refresh')).default.injectIntoGlobalHook(window);
        window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;
        const React = (await import('/node_modules/.vite/deps/react.js')).default;
        const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
        const { Canvas } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
        const { useGLTF } = await import('/node_modules/.vite/deps/@react-three_drei.js');
        useGLTF.setDecoderPath('/draco/');
        const { Wig } = await import('/src/features/scene/items/Wig.tsx');
        document.body.innerHTML = '<div id="wig-test" style="height:100vh"></div>';
        const root = createRoot(document.getElementById('wig-test')), e = React.createElement;
        window.renderWigs = (color, first = true) => root.render(e(Canvas, {frameloop:'never', onCreated: ({scene}) => {window.wigScene=scene;}}, e(React.Suspense, {fallback:null}, first && e(Wig, {key:'first',id:'100',color}), e(Wig, {key:'second',id:'100',color:'blond'}))));
        window.renderWigs('brun');
      });
      await page.waitForFunction(() => { let count=0; window.wigScene?.traverse(node=>{if(node.userData.__ownedWigSkeleton)count++;}); return count>=2; }, {timeout:60000});
      const before = await page.evaluate(() => {
        window.wigMeshes=[];
        const roots=[];
        window.wigScene.traverse(node=>{if(node.name==='lara_custom_hair_attachment')roots.push(node);});
        roots[0].traverse(node=>{if(node.userData.__ownedWigSkeleton)window.wigMeshes.push(node);});
        const first=window.wigMeshes[0];
        let second;
        roots[1].traverse(node=>{if(node.geometry===first.geometry)second=node;});
        window.wigDisposed={geometry:0,texture:0,material:0,skeleton:0};
        first.geometry.addEventListener('dispose',()=>window.wigDisposed.geometry++);
        const material=Array.isArray(first.material)?first.material[0]:first.material;
        material.addEventListener('dispose',()=>window.wigDisposed.material++);
        material.map?.addEventListener('dispose',()=>window.wigDisposed.texture++);
        first.skeleton.computeBoneTexture();
        first.skeleton.boneTexture.addEventListener('dispose',()=>window.wigDisposed.skeleton++);
        window.wigMaterial=material;
        return { sharedGeometry:first.geometry===second.geometry, material:material.uuid };
      });
      assert.equal(before.sharedGeometry,true);
      await page.evaluate(() => window.renderWigs('rouge'));
      await page.waitForFunction(() => window.wigMaterial.color.r>0.5);
      const afterColor=await page.evaluate(()=>{const m=window.wigMeshes[0].material; return (Array.isArray(m)?m[0]:m).uuid;});
      assert.equal(afterColor,before.material,'Colour changes must reuse the instance material');
      await page.evaluate(() => window.renderWigs('rouge',false));
      await page.waitForFunction(()=>window.wigDisposed.material>0);
      assert.deepEqual(await page.evaluate(()=>window.wigDisposed),{geometry:0,texture:0,material:1,skeleton:1});
      assert.equal(errors.length,0);
      console.log('Wig ownership passed: colours reuse materials; unmount frees owned material and preserves shared GLTF geometry / textures.');
      return;
    }
    await page.evaluate(idleTest => { window.idleTest = idleTest; }, process.argv.includes('--idle-only'));
    await page.evaluate(casesTest => { window.casesTest = casesTest; }, process.argv.includes('--cases-only') || process.argv.includes('--shower-only') || process.argv.includes('--spawn-objects') || process.argv.includes('--bathroom-cases'));
    await page.evaluate(bathroomTest => { window.bathroomTest = bathroomTest; }, process.argv.includes('--bathroom-cases'));
    await page.evaluate(spawnTest => { window.spawnTest = spawnTest; }, process.argv.includes('--spawn-objects'));
    await page.evaluate(showerTest => { window.showerTest = showerTest; }, process.argv.includes('--shower-only'));
    await page.evaluate(duoTest => { window.duoTest = duoTest; }, process.argv.includes('--duo-navigation') || process.argv.includes('--all-duos') || process.argv.includes('--skydrop-invite'));
    await page.evaluate(skyTest => { window.skyTest = skyTest; }, process.argv.includes('--skydrop-invite'));
    await page.evaluate(showerSpawnTest => { window.showerSpawnTest = showerSpawnTest; }, process.argv.includes('--shower-spawn'));
    await page.evaluate(nativeSpawnTest => { window.nativeSpawnTest = nativeSpawnTest; }, process.argv.includes('--native-spawn'));
    await page.evaluate(doubleBedTest => { window.doubleBedTest = doubleBedTest; }, process.argv.includes('--double-bed-cases'));
    await page.evaluate(bedReservationTest => { window.bedReservationTest = bedReservationTest; }, process.argv.includes('--bed-occupancy') || process.argv.includes('--blocked-retry'));
    await page.evaluate(xbotTest => { window.xbotTest = xbotTest; }, process.argv.includes('--xbot-tour'));
    await page.evaluate(async () => {
      (await import('/@react-refresh')).default.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { Canvas, useFrame, useThree } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const { useGLTF } = await import('/node_modules/.vite/deps/@react-three_drei.js');
      useGLTF.setDecoderPath('/draco/');
      const placements = await import('/src/features/scene/Placements.tsx');
      const { DoorsPlacement } = await import('/src/features/scene/building/DoorsPlacement.tsx');
      const { Character } = await import('/src/features/scene/character/Character.tsx');
      const { CHARACTERS } = await import('/src/features/scene/characterConfig.ts');
      const nav = await import('/src/features/scene/ai/navigation/service.ts');
      const registry = await import('/src/features/scene/ai/navigation/obstacles.ts');
      const { doorCollisionState, DOOR_CONFIGS, computeDoorAllowedAngle, getDoorContactAngle } = await import('/src/features/scene/doorObstacles.ts');
      const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
      useSceneStore.setState(s => ({ layers: { ...s.layers, animOriginLerp: false, animCrossfade: false, exitTransitions: false } }));
      const { useAgentController } = await import('/src/features/scene/ai/useAgentController.ts');
      const { resetAppIdle } = await import('/src/features/scene/idleState.ts');
      window.resolveCoords = (await import('/src/features/scene/ai/agent/agentInstructionCoords.ts')).resolveInstructionCoords;
      window.smartObjects = await import('/src/features/scene/ai/smartObjectRegistry.ts');
      window.furnitureState = await import('/src/features/scene/furniturePositions.ts');
      window.positionState = (await import('/src/features/scene/positionState.ts')).positionState;
      window.cameraState = (await import('/src/features/scene/cameraState.ts')).cameraState;
      window.avoidance = await import('/src/features/scene/ai/agent/agentAvoidance.ts');
      window.steer = window.avoidance.computeSteeringVector;
      const scenarios = await import('/src/features/scene/ai/scenarios.ts');
      window.autonomousAgents = new Map();
      window.duoManager = (await import('/src/features/scene/ai/duoSessionManager.ts')).duoSessionManager;
      window.occupancy = (await import('/src/features/scene/ai/occupancyManager.ts')).OccupancyManager;
      window.duoAnimations = (await import('/src/features/scene/animations/duoAnimations.ts')).DUO_ANIMATIONS;
      window.duoTransform = (await import('/src/features/scene/animations/duoWorldTransform.ts')).computeWorldTransform;
      function DuoProbe({id,x}) {
        const scenario = React.useMemo(()=>[{type:'WAIT',duration:1000,animation:'idle'}],[]);
        const agent = useAgentController(id,scenario,false,()=>({x,y:0,z:-600,rotY:0}));
        window.autonomousAgents.set(id,{agent,scenario});
        return null;
      }
      function XbotProbe() {
        const scenario = React.useMemo(()=>scenarios.XBOT_CONCIERGE_TOUR.map(i=>({...i,duration:i.duration ? 0.1 : undefined})),[]);
        const agent = useAgentController('xbot-probe',scenario,false,()=>({x:288,y:0,z:603,rotY:0}));
        window.autonomousAgents.set('xbot-probe',{agent,scenario});
        return null;
      }
      function SkyProbe({id}) {
        const scenario = React.useMemo(()=>[{type:'USE_OBJECT',smartObjectId:'bed-west',slotId:'seat-middle',duration:0.1,animation:'idle'},{type:'MOVE_TO',targetPos:id==='sabira' ? [200,0,-50] : [160,0,-150]}],[id]);
        const agent = useAgentController(id,scenario,false,()=>({x:90,y:0,z:150,rotY:0}),undefined,0,true);
        window.autonomousAgents.set(id,{agent,scenario}); return null;
      }
      window.showerRerenders=new Map();
      function ShowerSpawnProbe({id,slotId}) {
        const [,rerender]=React.useState(0);
        const scenario=React.useMemo(()=>[...window.smartObjects.buildSmartObjectInstructionSequence('shower',slotId).map(i=>i.type==='USE_OBJECT' ? {...i,duration:0.1,animation:'idle'} : i),{type:'MOVE_TO',targetPos:[200,0,-50]}],[slotId]);
        const agent=useAgentController(id,scenario,false,()=>({x:25,y:0,z:645,rotY:0}),undefined,0,true);
        window.autonomousAgents.set(id,{agent,scenario}); window.showerRerenders.set(id,()=>rerender(v=>v+1)); return null;
      }
      function NativeSpawnProbe() {
        const scenario=React.useMemo(()=>[{type:'USE_OBJECT',smartObjectId:'desk-bollsidan-2',slotId:'work-standing',duration:0.1,animation:'idle'},{type:'MOVE_TO',targetPos:[200,0,-50]}],[]);
        const agent=useAgentController('native-spawn',scenario,false,()=>({x:240,y:0,z:270,rotY:0}),undefined,0,true);
        window.autonomousAgents.set('native-spawn',{agent,scenario}); return null;
      }
      function DoubleBedProbe({config,slotId}) {
        const id=`double-${config}-${slotId}`;
        const scenario=React.useMemo(()=>[{type:'MOVE_TO',targetPos:[200,0,-50]},...window.smartObjects.buildSmartObjectInstructionSequence('bed-double',slotId).map(i=>i.type==='USE_OBJECT' ? {...i,duration:0.1,animation:'idle'} : i),{type:'MOVE_TO',targetPos:[200,0,-200]}],[slotId]);
        const agent=useAgentController(id,scenario,false,()=>({x:200,y:0,z:-50,rotY:0}));
        window.autonomousAgents.set(id,{agent,scenario});return null;
      }
      function DoubleBedProbes() {
        const [config,setConfig]=React.useState(null);window.mountDoubleProbes=setConfig;
        return config===null ? null : window.smartObjects.SMART_OBJECTS['bed-double'].slots.map(slot=>React.createElement(DoubleBedProbe,{config,slotId:slot.slotId,key:`${config}-${slot.slotId}`}));
      }
      function BedReservationProbe({id}) {
        const scenario=React.useMemo(()=>[...window.smartObjects.buildSmartObjectInstructionSequence('bed-west','lie-down'),{type:'MOVE_TO',targetPos:[200,0,-50]}],[]);
        const agent=useAgentController(id,scenario,false,()=>({x:160,y:0,z:300,rotY:0}));
        window.autonomousAgents.set(id,{agent,scenario});return null;
      }
      function AutonomousProbe({ id }) {
        const scenario = React.useMemo(() => scenarios.buildAutonomousScenario(id), [id]);
        const agent = useAgentController(id, scenario, true, () => ({ x: 160, y: 0, z: 300, rotY: 0 }));
        window.autonomousAgents.set(id, { agent, scenario });
        return null;
      }
      const regressionCases = window.bathroomTest ? ['drona-west','drona-east','sdb-closet'].flatMap(id => window.smartObjects.SMART_OBJECTS[id].slots.map(slot => [id,slot.slotId])) : window.spawnTest ? ['bed-west','bed-east','desk-bollsidan-1','desk-bollsidan-2','chair-office'].flatMap(id => window.smartObjects.SMART_OBJECTS[id].slots.map(slot => [id,slot.slotId])) : window.showerTest ? window.smartObjects.SMART_OBJECTS.shower.slots.map(slot => ['shower',slot.slotId]) : [
        ['desk-bollsidan-1', 'work-sitting'], ['desk-bollsidan-2', 'work-standing'],
        ['cuisine-group', 'cook-oven'], ['freezer', 'open-pick'], ['kallax-ne', 'inspect'],
        ['drona-west', 'pick-item'], ['sofa-garden-west', 'seat-2'], ['building-b-corridor', 'trash'],
      ];
      function RegressionProbe({ index }) {
        const id = `regression-${index}`;
        const scenario = React.useMemo(() => [...(window.spawnTest ? [] : [{ type: 'MOVE_TO', targetPos: [160, 0, 300] }]),
          ...window.smartObjects.buildSmartObjectInstructionSequence(...regressionCases[index]).map(instruction => instruction.type === 'USE_OBJECT' ? { ...instruction, duration: 0.1, repeatCount: 1, animation: 'idle' } : instruction),
          { type: 'MOVE_TO', targetPos: [200, 0, -50] }], []);
        const agent = useAgentController(id, scenario, false, () => ({ x: 160, y: 0, z: 300, rotY: 0 }));
        window.autonomousAgents.set(id, { agent, scenario, label: regressionCases[index].join(':') });
        return null;
      }
      const e = React.createElement;
      document.body.innerHTML = '<div id="fixture" style="height:100vh"></div>';
      const native = CHARACTERS.find(c => c.id === 'native');
      const xbot = CHARACTERS.find(c => c.id === 'xbot');
      window.geom = await import('/src/features/scene/ai/navigation/geometry.ts');
      window.nav = { ...nav, ...registry, doorCollisionState, DOOR_CONFIGS, computeDoorAllowedAngle, getDoorContactAngle, useSceneStore };
      function Probe() {
        window.fixtureScene = useThree().scene;
        window.fixtureScene.visible = false;
        const scenario = React.useMemo(() => [
          { type: 'USE_OBJECT', smartObjectId: 'cuisine-group', slotId: 'cook-stove', duration: 0.05 },
          { type: 'MOVE_TO', targetPos: [140, 0, 560] },
        ], []);
        const agent = useAgentController('probe', scenario, false, () => ({ x: 80, y: 0, z: 400, rotY: 0 }));
        window.agent = agent;
        useFrame((_, dt) => {
          resetAppIdle();
          if (window.runAgent) { window.agentState = { ...agent.update(dt) }; window.agentStatus = agent.getStatus(); }
        });
        return null;
      }
      window.root = createRoot(document.getElementById('fixture'));
      window.root.render(e(Canvas, { camera: { position: [600, 900, 900], far: 5000 } }, e('ambientLight', { intensity: 2 }), e(Probe),
        ...(window.idleTest ? Object.keys(scenarios.INITIAL_SMART_OBJECT_BY_CHAR).slice(0, 15).map(id => e(AutonomousProbe, { key: id, id })) : []),
        ...(window.casesTest ? regressionCases.map((_, index) => e(RegressionProbe, { key: index, index })) : []),
        ...(window.duoTest ? [e(DuoProbe,{key:'sara',id:'sara',x:-300}),e(DuoProbe,{key:'marissa',id:'marissa',x:100})] : []),
        ...(window.xbotTest ? [e(XbotProbe),e(React.Suspense,{fallback:null},e(Character,{...xbot,modelPath:xbot.path,targetHeight:xbot.height,isActive:false,isNPC:false,scenario:null}))] : []),
        ...(window.skyTest ? ['sabira','sabira-order'].map(id=>e(SkyProbe,{id,key:id})) : []),
        ...(window.showerSpawnTest ? window.smartObjects.SMART_OBJECTS.shower.slots.flatMap(slot=>['closed','open'].map(door=>e(ShowerSpawnProbe,{id:`delphina-${slot.slotId}-${door}`,slotId:slot.slotId,key:`${slot.slotId}-${door}`}))) : []),
        ...(window.nativeSpawnTest ? [e(NativeSpawnProbe)] : []),
        ...(window.doubleBedTest ? [e(DoubleBedProbes)] : []),
        ...(window.bedReservationTest ? ['bed-alternative-north','bed-alternative-south','bed-full','bed-reserved'].map(id=>e(BedReservationProbe,{id,key:id})) : []),
        e(React.Suspense, { fallback: null }, e(placements.Equipment), e(placements.Furniture), e(placements.Furnishings), e(placements.Decor), e(DoorsPlacement),
          e(Character, { ...native, modelPath: native.path, targetHeight: native.height, isLara: true, isActive: false, isNPC: false, scenario: null }))));
    });
    await page.waitForFunction(() => window.nav?.furnitureObstacles.size > 25 && window.nav.hasAgentProfile('native'), { timeout: 60000 }).catch(async error => { console.log('Readiness:', await page.evaluate(() => ({ ids: [...window.nav.furnitureObstacles.keys()], native: window.nav.hasAgentProfile('native'), scene: window.fixtureScene.children.map(c => c.name), agent: window.agent.getStatus() }))); throw error; });
    console.log('Scene assets ready:', await page.evaluate(() => ({ profile: window.nav.getAgentProfile('native'), obstacles: window.nav.furnitureObstacles.size })));
    if(process.argv.includes('--bed-occupancy') || process.argv.includes('--blocked-retry')) {
      const audit=await page.evaluate(async()=>{
        const nav=window.nav, manager=window.occupancy, profile=nav.getAgentProfile('native'),results=[];
        const smart=window.smartObjects;
        const durations=smart.SMART_OBJECTS['bed-west'].slots.map(slot=>slot.duration);
        smart.SMART_OBJECTS['bed-west'].slots.forEach(slot=>slot.duration=0.1);
        for(const bed of ['bed-west','bed-east','bed-double']) {
          const slots=smart.SMART_OBJECTS[bed].slots;
          for(const lying of slots.filter(slot=>slot.slotId.startsWith('lie-down'))) {
            for(const sitting of slots.filter(slot=>slot.slotId.startsWith('seat-'))) {
              if(!manager.claimSlot(bed,sitting.slotId,'bed-holder'))throw new Error('Cannot reserve bed fixture');
              if(manager.claimSlot(bed,lying.slotId,'bed-contender'))throw new Error(`${bed}: sleeping overlaps a sitter`);
              if(manager.getOccupant(bed,lying.slotId)!=='bed-holder')throw new Error('Conflicting occupant missing from diagnostic');
              manager.releaseAllForCharacter('bed-holder');
              manager.claimSlot(bed,lying.slotId,'bed-holder');
              if(manager.claimSlot(bed,sitting.slotId,'bed-contender'))throw new Error(`${bed}: sitting overlaps a sleeper`);
              manager.releaseAllForCharacter('bed-holder');
            }
            const sequence=smart.buildSmartObjectInstructionSequence(bed,lying.slotId);
            if(sequence.some(i=>i.smartObjectId===bed&&i.slotId!==lying.slotId))throw new Error(`${bed}: an entry or exit changes its reservation`);
          }
        }
        if(!manager.claimSlot('bed-double','lie-down-left','bed-holder')||!manager.claimSlot('bed-double','lie-down-right','bed-contender'))throw new Error('Two separate sleeping places must remain usable');
        manager.releaseAllForCharacter('bed-holder');manager.releaseAllForCharacter('bed-contender');
        for(const [id,{agent,scenario}] of window.autonomousAgents) {
          nav.setAgentProfile(id,profile);agent.setPosition(160,0,300);
          if(id!=='bed-reserved') {
            const slot=id==='bed-full'?'lie-down':'seat-middle';
            manager.claimSlot('bed-west',slot,'sabira');nav.setAgentProfile('sabira',profile);
            const coords=window.resolveCoords({type:'USE_OBJECT',smartObjectId:'bed-west',slotId:slot},null);
            window.cameraState.positions.sabira={x:coords.tx,y:coords.ty,z:coords.tz,yaw:0};
            if(id.startsWith('bed-alternative-')) manager.claimSlot('bed-west',id.endsWith('north')?'seat-south':'seat-north','bed-seat-reservation');
          }
          const deadline=performance.now()+30000;let state,interactions=0,climbed=false;
          while(performance.now()<deadline) {
            state={...agent.update(0.1)};window.cameraState.positions[id]={...state,yaw:state.rotY};
            if(agent.getStatus()==='BLOCKED')throw new Error(`${id}: ${nav.navigationDebug.get(id)?.error}`);
            if(state.y>0)climbed=true;
            if(agent.getStatus()==='INTERACTING') {
              interactions++;
              if(id==='bed-reserved'&&manager.claimSlot('bed-west','seat-middle','late-arrival'))throw new Error('Reservation was lost during bed entry');
            }
            if(agent.getStatus()==='FINISHED')break;
            await new Promise(resolve=>requestAnimationFrame(resolve));
          }
          if(agent.getStatus()!=='FINISHED')throw new Error(`${id} never finished: ${JSON.stringify({state,status:agent.getStatus(),route:nav.navigationDebug.get(id),scenario})}`);
          const action=scenario.find(i=>i.type==='USE_OBJECT');
          if(id.startsWith('bed-alternative-')&&(action.slotId!==`seat-${id.split('-').at(-1)}`||!interactions||climbed))throw new Error('An alternative seat retained the sleeping climb');
          if(id==='bed-full'&&interactions)throw new Error('A fully occupied bed was entered');
          if(id==='bed-reserved'&&(!interactions||!climbed||manager.getOccupant('bed-west','lie-down')===id))throw new Error('Bed routine did not hold and release its sleeping place');
          results.push({id,slot:action?.slotId,interactions,climbed,status:agent.getStatus()});
          manager.releaseAllForCharacter(id);manager.releaseAllForCharacter('sabira');manager.releaseAllForCharacter('bed-seat-reservation');delete window.cameraState.positions[id];delete window.cameraState.positions.sabira;
        }
        smart.SMART_OBJECTS['bed-west'].slots.forEach((slot,i)=>slot.duration=durations[i]);
        return results;
      });
      console.log('Bed reservations:',JSON.stringify(audit));
      if(process.argv.includes('--bed-occupancy'))return;
    }
    if(process.argv.includes('--double-bed-cases')) {
      const audit=await page.evaluate(async()=>{
        const nav=window.nav,g=window.geom,profile=nav.getAgentProfile('native'),results=[];
        if(window.smartObjects.getAllSmartObjectIds().includes('bed-double')) throw new Error('Separate beds must not offer the combined SmartObject');
        nav.useSceneStore.getState().triggerAction('bed-double',true);
        const configs=(await import('/src/features/scene/furniturePositions.ts')).DOUBLE_BED_POSITIONS;
        for(let config=0;config<configs.length;config++) {
          if(config) nav.useSceneStore.getState().triggerAction('bed-position');
          const deadline=performance.now()+15000;
          do {await new Promise(resolve=>requestAnimationFrame(resolve));}
          while((window.furnitureState.movingFurniture.size || window.positionState['bed-double']?.idx!==1 || window.positionState['bed-position']?.idx!==config) && performance.now()<deadline);
          if(!window.smartObjects.getAllSmartObjectIds().includes('bed-double')) throw new Error('Combined bed must expose its SmartObject');
          window.autonomousAgents.clear();window.mountDoubleProbes(config);
          await new Promise(resolve=>requestAnimationFrame(resolve));
          for(const [id,{agent,scenario}] of window.autonomousAgents) {
            nav.setAgentProfile(id,profile);
            const deadline=performance.now()+30000;let state,interaction;
            while(performance.now()<deadline) {
              state={...agent.update(0.1)};window.cameraState.positions[id]={...state,yaw:state.rotY};
              if(agent.getStatus()==='INTERACTING') {
                interaction={...state};const target=window.resolveCoords(scenario.find(i=>i.type==='USE_OBJECT'),null,id);
                if(state.y!==target.ty || g.insideObstacle(state,nav.getNavigationGraph(profile,'bed-double').obstacles)) throw new Error(`${id}: invalid bed surface pose`);
              }
              if(['FINISHED','BLOCKED'].includes(agent.getStatus())) break;
              await new Promise(resolve=>requestAnimationFrame(resolve));
            }
            results.push({id,status:agent.getStatus(),interaction,state,route:nav.navigationDebug.get(id)});delete window.cameraState.positions[id];
            if(agent.getStatus()!=='FINISHED' || !interaction) throw new Error(JSON.stringify(results));
          }
        }
        return results;
      });
      assert.equal(audit.length,12);console.log('Double bed interactions:',JSON.stringify(audit));return;
    }
    if(process.argv.includes('--native-spawn')) {
      const audit=await page.evaluate(async()=>{
        const nav=window.nav,g=window.geom,{agent}=window.autonomousAgents.get('native-spawn'),profile=nav.getAgentProfile('native');
        nav.setAgentProfile('native-spawn',profile);window.cameraState.isSceneLaunched=false;
        const late=[...nav.furnitureObstacles.values()].filter(o=>['bed-east','desk-bollsidan-2'].includes(o.owner));
        late.forEach(o=>nav.unregisterObstacle(o.id));
        const early={...agent.update(0)};
        late.forEach(o=>nav.registerObstacle(o));
        window.cameraState.isSceneLaunched=true;
        const adjusted={...agent.update(0.1)};
        if(g.insideObstacle(adjusted,nav.getNavigationGraph(profile).obstacles)) throw new Error(`Spawn ignored furniture registered after the body profile: ${JSON.stringify({early,adjusted})}`);
        const deadline=performance.now()+30000;let state;
        while(performance.now()<deadline) {
          state={...agent.update(0.1)};window.cameraState.positions['native-spawn']={...state,yaw:state.rotY};
          if(['FINISHED','BLOCKED'].includes(agent.getStatus())) break;
          await new Promise(resolve=>requestAnimationFrame(resolve));
        }
        if(agent.getStatus()!=='FINISHED') throw new Error(JSON.stringify({state,status:agent.getStatus(),route:nav.navigationDebug.get('native-spawn')}));
        return {early,adjusted,state,status:agent.getStatus()};
      });
      console.log('Native late-furniture spawn:',JSON.stringify(audit));return;
    }
    if(process.argv.includes('--shower-spawn')) {
      const result=await page.evaluate(async()=>{
        const nav=window.nav,g=window.geom,profile=nav.getAgentProfile('native'),requests=await import('/src/features/scene/ai/navigation/doorRequests.ts');
        window.cameraState.isSceneLaunched=true;
        const results=[];
        for(const [id,entry] of window.autonomousAgents) {
          if(id.endsWith('-open')) requests.requestDoor('shower','shower-test-holder');
          else requests.releaseAgentDoors('shower-test-holder');
          await new Promise(resolve=>requestAnimationFrame(resolve));
          nav.setAgentProfile(id,profile); entry.agent.update(0);
          window.showerRerenders.get(id)();
          await new Promise(resolve=>requestAnimationFrame(resolve));
          const {agent}=window.autonomousAgents.get(id), spawn=agent.initialPos;
          const leaf=[[g.inflate(nav.doorPolygon('shower',0),profile.radius+nav.DOOR_CONFIGS.shower.margin)]];
          if(g.insideObstacle(spawn,leaf)) throw new Error(`Rendered spawn intersects the closed shower door: ${JSON.stringify({id,spawn,state:agent.update(0)})}`);
          requests.releaseAgentDoors('shower-test-holder');
          const deadline=performance.now()+30000;
          let state;
          while(performance.now()<deadline) {
            state={...agent.update(0.1)};
            window.cameraState.positions[id]={...state,yaw:state.rotY};
            if(agent.getStatus()==='LANDING' && g.insideObstacle(state,[[g.inflate(nav.doorPolygon('shower',nav.doorCollisionState.shower.angle),profile.radius+nav.DOOR_CONFIGS.shower.margin)]])) throw new Error(`${id}: landed in the actual door`);
            if(['FINISHED','BLOCKED'].includes(agent.getStatus())) break;
            await new Promise(resolve=>requestAnimationFrame(resolve));
          }
          results.push({id,spawn,state,status:agent.getStatus(),route:nav.navigationDebug.get(id)});
          delete window.cameraState.positions[id];
          if(agent.getStatus()!=='FINISHED') throw new Error(JSON.stringify(results));
        }
        return results;
      });
      console.log('Shower spawn:',JSON.stringify(result)); return;
    }
    if (process.argv.includes('--skydrop-invite')) {
      const result=await page.evaluate(async()=>{
        const nav=window.nav, manager=window.duoManager, profile=nav.getAgentProfile('native');
        window.cameraState.isSceneLaunched=true;
        for(const [id,{agent}] of window.autonomousAgents) { nav.setAgentProfile(id,profile); if(!id.startsWith('sabira')) agent.update(0); }
        const {agent:sabira}=window.autonomousAgents.get('sabira');
        const before={...sabira.update(3.2)};
        const session=manager.startDuoSession('inyeong-cha-hugs-point','hugs-6','sara','sabira','kiss_man_woman');
        if(!session || sabira.getStatus()!=='FALLING') throw new Error('A duo invitation must wait for the sky drop to finish');
        document.dispatchEvent(new CustomEvent('npc-invite-duo',{detail:{targetId:'sara',fromId:'SmartObject',objectId:'inyeong-cha-hugs-point',slotId:'hugs-6:roleA',forceRole:'roleA',targetPos:session.posA,targetRotY:session.rotA}}));
        const {agent:ordered}=window.autonomousAgents.get('sabira-order'); ordered.update(3.2);
        document.dispatchEvent(new CustomEvent('agent-force-smartobject',{detail:{targetId:'sabira-order',objectId:'drona-west',slotId:'pick-item'}}));
        if(ordered.getStatus()!=='FALLING') throw new Error('A furniture order must wait for landing');
        const deadline=performance.now()+30000;
        let reachedDuo=false;
        while(performance.now()<deadline && (!reachedDuo || ordered.getStatus()!=='FINISHED')) {
          for(const id of ['sara','sabira','sabira-order']) {
            const {agent}=window.autonomousAgents.get(id), state=agent.update(0.1);
            window.cameraState.positions[id]={...state,yaw:state.rotY};
            if(agent.getStatus()==='BLOCKED') throw new Error(`${id}: ${nav.navigationDebug.get(id)?.error}`);
          }
          reachedDuo ||= manager.isPlaying('sabira');
          await new Promise(resolve=>requestAnimationFrame(resolve));
        }
        const after={...sabira.update(0)};
        if(after.y!==0 || !reachedDuo || ordered.getStatus()!=='FINISHED') throw new Error(`Sky drop did not land and complete its pending orders: ${JSON.stringify({after,reachedDuo,ordered:ordered.getStatus(),route:nav.navigationDebug.get('sabira-order')})}`);
        manager.leaveAllSessions(); return {before,after,reachedDuo,ordered:ordered.getStatus()};
      });
      console.log('Sky drop interruption:',JSON.stringify(result)); return;
    }
    if (process.argv.includes('--xbot-tour')) {
      await page.waitForFunction(()=>window.nav.hasAgentProfile('xbot'));
      const audit = await page.evaluate(async()=>{
        const nav=window.nav, {agent}=window.autonomousAgents.get('xbot-probe');
        const profile=nav.getAgentProfile('xbot'); nav.setAgentProfile('xbot-probe',profile);
        const occupantProfile=nav.getAgentProfile('native'); nav.setAgentProfile('bath-occupant',occupantProfile);
        const occupied=window.resolveCoords({type:'MOVE_TO',targetZoneId:'bathroom'},null,'bath-occupant');
        window.cameraState.positions['bath-occupant']={x:occupied.tx,y:0,z:occupied.tz,yaw:0};
        const alternative=window.resolveCoords({type:'MOVE_TO',targetZoneId:'bathroom'},null,'xbot-probe');
        if(Math.hypot(alternative.tx-occupied.tx,alternative.tz-occupied.tz)<profile.radius+occupantProfile.radius) throw new Error('Xbot must inspect a free place in an occupied bathroom');
        const deadline=performance.now()+60000;
        let state, previous;
        while(performance.now()<deadline) {
          state={...agent.update(0.1)};
          if(previous && window.geom.distance(previous,state)>0) for(const key of nav.doorKeys) {
            const leaf=[[window.geom.inflate(nav.doorPolygon(key,nav.doorCollisionState[key].angle),profile.radius+nav.DOOR_CONFIGS[key].margin)]];
            if(!window.geom.segmentFree(previous,state,leaf)) throw new Error(`Xbot crossed the actual ${key} door`);
          }
          previous=state;
          window.cameraState.positions['xbot-probe']={...state,yaw:state.rotY};
          if(['FINISHED','BLOCKED'].includes(agent.getStatus())) break;
          await new Promise(resolve=>requestAnimationFrame(resolve));
        }
        delete window.cameraState.positions['bath-occupant'];
        return {profile,occupied,alternative,status:agent.getStatus(),state,route:nav.navigationDebug.get('xbot-probe')};
      });
      console.log('Xbot tour:',JSON.stringify(audit)); assert.equal(audit.status,'FINISHED'); return;
    }
    if (process.argv.includes('--duo-audit') || process.argv.includes('--spawn-objects')) {
      console.log('Duo obstacle audit:', JSON.stringify(await page.evaluate(() => {
        const nav = window.nav, g = window.geom, profile = nav.getAgentProfile('native');
        const obj = window.smartObjects.getSmartObject('inyeong-cha-hugs-point'), slot = obj.slots[0];
        const solids = [...nav.architectureObstacles,...nav.furnitureObstacles.values()].filter(o=>o.yMin<profile.height && o.yMax>0);
        return slot.duoPool.map(id => {
          const def = window.duoAnimations.find(d=>d.id===id);
          const pose = window.duoTransform(slot.offset,slot.rotY,def.offsetB,def.rotB);
          const blockers = pos => solids.filter(o=>g.pointInRing({x:pos[0],z:pos[2]},g.inflate(o.polygon,profile.radius))).map(o=>o.id);
          const a = {x:pose.posA[0],z:pose.posA[2]}, b = {x:pose.posB[0],z:pose.posB[2]};
          return {id,...pose,blockersA:blockers(pose.posA),blockersB:blockers(pose.posB),crossings:solids.filter(o=>!g.segmentFree(a,b,[[g.inflate(o.polygon,profile.radius)]])).map(o=>o.id),reachableA:Boolean(nav.getNavigationGraph(profile).find({x:-300,z:-600},a)),reachableB:Boolean(nav.getNavigationGraph(profile).find({x:100,z:-600},b))};
        });
      })));
      if (process.argv.includes('--duo-audit')) return;
    }
    if (process.argv.includes('--profile')) {
      fs.writeFileSync('/tmp/room-navigation-benchmark.json', JSON.stringify(await page.evaluate(() => ({
        obstacles: window.nav.getNavigationGraph(window.nav.getAgentProfile('native')).obstacles,
        comfort: window.nav.getNavigationGraph(window.nav.getAgentProfile('native')).comfort,
        queries: [
          [{x:80,z:380}, {x:140,z:560}], [{x:160,z:300}, {x:200,z:-50}],
          [{x:500,z:-100}, {x:169,z:535}], [{x:-100,z:-170}, {x:14.13891,z:535}],
          [{x:37.19498,z:269.58378000000005}, {x:-300,z:-200}],
        ],
      }))));
      await page.evaluate(() => {
        window.navigationTimings = { calls: 0, totalMs: 0, longest: [] };
        const find = window.geom.VisibilityGraph.prototype.find;
        window.geom.VisibilityGraph.prototype.find = function (...args) {
          const started = performance.now();
          const result = find.apply(this, args);
          const ms = performance.now() - started, timings = window.navigationTimings;
          timings.calls++; timings.totalMs += ms;
          timings.longest.push({ ms, vertices: this.vertices.length, start: { x: args[0].x, z: args[0].z }, target: { x: args[1].x, z: args[1].z }, found: !!result });
          timings.longest.sort((a, b) => b.ms - a.ms);
          timings.longest.length = Math.min(timings.longest.length, 12);
          return result;
        };
      });
    }
    if (process.argv.includes('--profile-only')) {
      const { queries } = JSON.parse(fs.readFileSync('/tmp/room-navigation-benchmark.json', 'utf8'));
      const samples = await page.evaluate(async queries => {
        const graph = window.nav.getNavigationGraph(window.nav.getAgentProfile('native'));
        const samples = [{ batch: 0, ...await window.measureHeap() }];
        for (let batch = 1; batch <= 3; batch++) {
          for (let repetition = 0; repetition < 100; repetition++) for (const [start, target] of queries) graph.find(start, target);
          await new Promise(resolve => requestAnimationFrame(resolve));
          samples.push({ batch, ...await window.measureHeap() });
        }
        return { samples, timings: window.navigationTimings };
      }, queries);
      console.log('Repeated navigation / collected heap:', JSON.stringify(samples));
      assert.equal(errors.length, 0);
      return;
    }
    if (process.argv.includes('--duo-navigation') || process.argv.includes('--all-duos')) {
      const audit = await page.evaluate(async allDuos => {
        const nav = window.nav, g = window.geom, manager = window.duoManager;
        const profile = nav.getAgentProfile('native'), graph = nav.getNavigationGraph(profile);
        const obj = window.smartObjects.getSmartObject('inyeong-cha-hugs-point');
        const slot = obj.slots[0];
        manager.leaveAllSessions();
        const firstSession=manager.startDuoSession(obj.id,slot.slotId,'sara','marissa','slow_dance');
        if(!firstSession) throw new Error('Initial lifecycle test session failed');
        manager.markReady('sara');manager.markReady('marissa');
        manager.tickSession('sara',window.duoAnimations.find(d=>d.id==='slow_dance').duration+0.1);
        if(!manager.isCompletedFor('sara')) throw new Error('Lifecycle fixture did not finish its first session');
        const replacement=manager.startDuoSession(obj.id,slot.slotId,'sabira','sara','slow_dance');
        if(!replacement || window.occupancy.getOccupant(obj.id,`${slot.slotId}:roleB`)!=='sara') throw new Error('The previous partner retained the replacement duo slot');
        manager.leaveDuoZone('marissa');
        if(!manager.getSessionFor('sara') || manager.getSessionFor('sara')!==manager.getSessionFor('sabira')) throw new Error('Late cleanup of the previous duo removed its replacement');
        manager.leaveDuoZone('sabira');
        if(window.occupancy.isSlotOccupied(obj.id,`${slot.slotId}:roleB`)) throw new Error('Leaving the leader must also release the actual partner slot');
        if (graph.find({x:-300,z:-600},{x:0,z:210})) throw new Error('Old Bearhug destination must reproduce the wall collision');
        const placements = slot.duoPool.map(id => {
          const def = window.duoAnimations.find(def=>def.id===id);
          const pose = window.duoTransform(slot.offset,slot.rotY,def.offsetB,def.rotB);
          const a = {x:pose.posA[0],z:pose.posA[2]}, b = {x:pose.posB[0],z:pose.posB[2]};
          if (!graph.find({x:-300,z:-600},a) || !graph.find({x:100,z:-600},b) || !g.segmentFree(a,b,graph.obstacles)) throw new Error(`Duo ${id} crosses an obstacle or has an unreachable participant`);
          return {id,...pose};
        });
        const bearhugDef = window.duoAnimations.find(d=>d.id==='date_bearhug');
        const bearhug = window.duoTransform(slot.offset,slot.rotY,bearhugDef.offsetB,bearhugDef.rotB);
        if (Math.abs(g.distance({x:bearhug.posA[0],z:bearhug.posA[2]},{x:bearhug.posB[0],z:bearhug.posB[2]})-610)>g.GEOMETRY_EPSILON) throw new Error('Bearhug alignment was changed');
        if (slot.duoPool.includes('date_bearhug') || slot.duoPool.includes('p2')) throw new Error('Duos which collide with this zone must not be selected for its playlist');
        manager.leaveAllSessions();
        for (const [id,{agent}] of window.autonomousAgents) {nav.setAgentProfile(id,profile);agent.update(0);}
        const sessions=[];
        for (const animationId of (allDuos ? slot.duoPool : ['kiss_man_woman'])) {
        manager.leaveAllSessions();
        for (const [id,{agent}] of window.autonomousAgents) {
          agent.setPosition(id==='sara' ? -300 : 100,0,-600);
          window.cameraState.positions[id]={x:id==='sara' ? -300 : 100,y:0,z:-600,yaw:0};
        }
        const session = manager.startDuoSession(obj.id,slot.slotId,'sara','marissa',animationId);
        if (!session) throw new Error('Kiss session failed to start');
        document.dispatchEvent(new CustomEvent('npc-invite-duo',{detail:{targetId:'sara',fromId:'SmartObject',objectId:obj.id,slotId:slot.slotId,forceRole:'roleA',targetPos:session.posA,targetRotY:session.rotA}}));
        const deadline = performance.now()+30000;
        while (!manager.isPlaying('sara') && performance.now()<deadline) {
          for (const [id,{agent}] of window.autonomousAgents) {
            const state = agent.update(0.1);
            window.cameraState.positions[id] = {...state,yaw:state.rotY};
            if (agent.getStatus()==='BLOCKED') throw new Error(`${id}: ${nav.navigationDebug.get(id)?.error}`);
          }
          await new Promise(resolve=>requestAnimationFrame(resolve));
        }
        if (!manager.isPlaying('sara')) throw new Error('The two participants never reached their duo positions');
        sessions.push({animationId,playing:manager.isPlaying('sara'),roles:[{...manager.getParticipantA('sara')},{...manager.getParticipantB('sara')}]});
        }
        manager.leaveAllSessions();
        return {placements,sessions};
      },process.argv.includes('--all-duos'));
      console.log('Outdoor duo navigation:',JSON.stringify(audit));
      assert.equal(errors.length,0);
      return;
    }
    if (process.argv.includes('--crowd-collisions') || process.argv.includes('--bathroom-cases')) {
      const results = await page.evaluate(async () => {
        const nav=window.nav,g=window.geom,a=window.avoidance,profile=nav.getAgentProfile('native');
        nav.useSceneStore.setState(s=>({layers:{...s.layers,npcCollisions:true}}));
        const results=[], ids=['crowd-a','crowd-b'];
        ids.forEach(id=>nav.setAgentProfile(id,profile));
        const base=nav.getNavigationGraph(profile);
        const left={x:-300,z:-600},right={x:100,z:-600};
        if(!base.find(left,right)) throw new Error('Crowd fixture needs a reachable ground path');
        for(const stationary of [true,false]) {
          const actors=[{id:ids[0],position:{...left},target:right,route:nav.createRouteState()},
            {id:ids[1],position:stationary?{x:-100,z:-600}:{...right},target:left,route:nav.createRouteState()}];
          actors.forEach(p=>window.cameraState.positions[p.id]={...p.position,y:0,yaw:0});
          let minimum=Infinity,frames=0,searches=0;
          const find=g.VisibilityGraph.prototype.find;
          g.VisibilityGraph.prototype.find=function(...args){searches++;return find.apply(this,args);};
          try {
            for(;frames<3000;frames++) {
              if(actors.every((p,i)=>stationary&&i===1||g.distance(p.position,p.target)<1e-6)) break;
              for(const [i,p] of actors.entries()) {
                if(stationary&&i===1||g.distance(p.position,p.target)<1e-6)continue;
                const before=p.position;
                p.position=nav.followRoute(p.route,p.id,before,p.target,1,(dir,remaining)=>{
                  const s=window.steer(p.id,before.x,before.z,dir.x,dir.z,remaining);return {x:s.steerX,z:s.steerZ};
                });
                if(!g.segmentFree(before,p.position,base.obstacles))throw new Error('Actor bypass crossed static geometry');
                window.cameraState.positions[p.id]={...p.position,y:0,yaw:0};
                minimum=Math.min(minimum,g.distance(actors[0].position,actors[1].position));
              }
            }
          } finally {g.VisibilityGraph.prototype.find=find;}
          results.push({stationary,frames,minimum,searches,actors:actors.map(p=>({remaining:g.distance(p.position,p.target),error:p.route.error,position:p.position}))});
          if(minimum<profile.radius*2-1e-6)throw new Error('Actor bodies penetrated');
          if(frames===3000)throw new Error(`Crowd did not clear: ${JSON.stringify(results.at(-1))}`);
          actors.forEach(p=>{nav.resetRoute(p.route,p.id);delete window.cameraState.positions[p.id];});
        }
        // A touching body must remain a planner obstacle after the sweep stops.
        window.cameraState.positions[ids[1]]={x:-100,y:0,z:-600,yaw:0};
        const before={x:-200,z:-600},contact=a.limitAgentMovement(ids[0],before,{x:-100,z:-600});
        if(!a.getAgentObstacles(ids[0],contact).length)throw new Error('Contact actor disappeared from the detour planner');
        // Failed approach dependencies retry only when the obstructing body moves.
        a.beginActorBlockCheck(ids[0]);
        if(a.isAgentDestinationFree(ids[0],{x:-100,z:-600}))throw new Error('Occupied point was accepted');
        const blockers=a.endActorBlockCheck(ids[0]);
        if(!a.actorBlocksUnchanged(blockers))throw new Error('Stable blocker changed');
        window.cameraState.positions[ids[1]].x=100;
        if(a.actorBlocksUnchanged(blockers))throw new Error('Departed blocker retained a cached failure');
        nav.useSceneStore.setState(s=>({layers:{...s.layers,npcCollisions:false}}));
        if(!a.isAgentDestinationFree(ids[0],{x:100,z:-600}))throw new Error('Disabled actor collisions still block destinations');
        delete window.cameraState.positions[ids[1]];
        return results;
      });
      console.log('Crowd collisions:',JSON.stringify(results));
      if (process.argv.includes('--crowd-collisions')) return;
    }
    if (process.argv.includes('--doors-only') || process.argv.includes('--bathroom-cases')) {
      const doors = await page.evaluate(async () => {
        const nav = window.nav, g = window.geom;
        const profile = nav.getAgentProfile('native');
        nav.useSceneStore.setState(s => ({ layers: { ...s.layers, npcCollisions: true } }));
        const results = [];
        const scenarios = [
          [180, 200, 220].map((x,i) => [{ x, z: -50-i*(profile.radius*2+g.CLEARANCE_ERROR*2) }, { x: 160, z: 300-i*(profile.radius*2+g.CLEARANCE_ERROR*2) }]),
          [0, 1, 2].map(i => [{ x:160, z: 300-i*(profile.radius*2+g.CLEARANCE_ERROR*2) }, { x: 200, z: -50-i*(profile.radius*2+g.CLEARANCE_ERROR*2) }]),
          [[{ x: 180, z: -50 }, { x: 160, z: 300 }], [{ x: 160, z: 300 }, { x: 200, z: -50 }]],
        ];
        for (const [scenarioIndex, destinations] of scenarios.entries()) {
        const actors = destinations.map(([position, target], i) => ({ id: `door-${i}`, position, target, route: nav.createRouteState() }));
        for (const a of actors) if (!nav.getNavigationGraph(profile).find(a.position,a.target)) throw new Error(`Door fixture contains an unreachable endpoint: ${JSON.stringify(a)}`);
        actors.forEach(a => { nav.setAgentProfile(a.id, profile); window.cameraState.positions[a.id]={...a.position,y:0,yaw:0}; });
        const deadline = performance.now() + 30000;
        let nextLog = 0;
        while (performance.now() < deadline && actors.some(a => g.distance(a.position, a.target) > 1e-6)) {
          for (const a of actors) {
            if (g.distance(a.position, a.target) <= 1e-6) continue;
            const before = a.position;
            a.position = nav.followRoute(a.route, a.id, a.position, a.target, 1, (direction, remaining) => {
              const s = window.steer(a.id, a.position.x, a.position.z, direction.x, direction.z, remaining);
              return { x: s.steerX, z: s.steerZ };
            });
            window.cameraState.positions[a.id] = { ...a.position, y: 0, yaw: 0 };
            for (const key of nav.doorKeys) {
              const leaf = [[g.inflate(nav.doorPolygon(key, nav.doorCollisionState[key].angle), profile.radius + nav.DOOR_CONFIGS[key].margin)]];
              if (g.distance(before, a.position) > 0 && !g.segmentFree(before, a.position, leaf)) throw new Error(`Crowd crossed ${key}: ${JSON.stringify({ id:a.id,before,after:a.position,angle:nav.doorCollisionState[key].angle,startInside:g.insideObstacle(before,leaf),endInside:g.insideObstacle(a.position,leaf),next:a.route.path[a.route.index],wait:a.route.waitReason })}`);
            }
          }
          if (performance.now() > nextLog) {
            console.log('Agent trace:', JSON.stringify({ actors: actors.map(a => ({ id: a.id, position: a.position, index: a.route.index, next: a.route.path[a.route.index], error: a.route.error, doors: [...a.route.doors] })), angles: nav.doorCollisionState }));
            nextLog = performance.now() + 5000;
          }
          await new Promise(resolve => requestAnimationFrame(resolve));
        }
        results.push(...actors.map(a => ({ scenarioIndex, id: a.id, position: a.position, remaining: g.distance(a.position, a.target), error: a.route.error })));
        for (const a of actors) { nav.resetRoute(a.route, a.id); delete window.cameraState.positions[a.id]; }
        }
        return results;
      });
      console.log('Door crowd:', JSON.stringify(doors));
      assert.ok(doors.every(a => a.remaining < 1e-6 && !a.error), 'Every actor must clear the glass doorway');
      if (process.argv.includes('--doors-only')) return;
    }
    if (process.argv.includes('--cases-only') || process.argv.includes('--shower-only') || process.argv.includes('--spawn-objects') || process.argv.includes('--bathroom-cases')) {
      if (process.argv.includes('--bathroom-cases')) {
        const recovery=await page.evaluate(()=>{
          const nav=window.nav, g=window.geom, profile=nav.getAgentProfile('native');
          nav.useSceneStore.setState(s=>({layers:{...s.layers,npcCollisions:true}}));
          nav.setAgentProfile('occupied-probe',profile); nav.setAgentProfile('occupied-robot',profile);
          const target={x:200,z:-100}, start={x:200,z:-200}, route=nav.createRouteState();
          window.cameraState.positions['occupied-robot']={...target,y:0,yaw:0};
          const find=g.VisibilityGraph.prototype.find; let calls=0;
          g.VisibilityGraph.prototype.find=function(...args){calls++;return find.apply(this,args);};
          try {
            const stopped=nav.followRoute(route,'occupied-probe',start,target,g.distance(start,target));
            if(route.error!=='Destination occupée par un autre acteur') throw new Error('The occupied target must report its blockage');
            const firstCalls=calls;
            for(let frame=0;frame<300;frame++) nav.followRoute(route,'occupied-probe',stopped,target,1);
            if(calls!==firstCalls) throw new Error('An unchanged occupied destination must not replan each frame');
            delete window.cameraState.positions['occupied-robot'];
            const resumed=nav.followRoute(route,'occupied-probe',stopped,target,g.distance(stopped,target));
            if(route.error || g.distance(resumed,target)>g.GEOMETRY_EPSILON) throw new Error('A target freed by an actor must resume without a geometry revision');
            return {stopped,resumed,repeatedSearches:0};
          } finally {g.VisibilityGraph.prototype.find=find; delete window.cameraState.positions['occupied-robot'];nav.resetRoute(route,'occupied-probe');}
        });
        console.log('Occupied destination recovery:',JSON.stringify(recovery));
      }
      if (process.argv.includes('--shower-only')) {
        const blocked = await page.evaluate(() => {
          const nav = window.nav, g = window.geom;
          const [id,{agent,scenario}] = window.autonomousAgents.entries().next().value;
          const profile = nav.getAgentProfile('native'); nav.setAgentProfile(id,profile);
          agent.update(0.1);
          const vertices = nav.getNavigationGraph(profile).vertices;
          const xs = vertices.map(p=>p.x), zs = vertices.map(p=>p.z);
          const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
          nav.registerObstacle({ id:'blocked-shower-test', polygon:g.rectangle((minX+maxX)/2,(minZ+maxZ)/2,maxX-minX,maxZ-minZ), yMin:0,yMax:profile.height });
          const find = g.VisibilityGraph.prototype.find;
          let calls = 0;
          g.VisibilityGraph.prototype.find = function(...args) { calls++; return find.apply(this,args); };
          try {
            agent.update(0.1);
            if (agent.getStatus() !== 'BLOCKED' || !nav.navigationDebug.get(id)?.error) throw new Error('An impossible shower approach must remain explicitly blocked');
            const firstCalls = calls;
            const firstCoordinates = window.coordinateResolveCalls;
            for (let frame=0;frame<300;frame++) agent.update(0.1);
            if (calls !== firstCalls) throw new Error('Blocked coordinates repeated path searches');
            if (window.coordinateResolveCalls !== firstCoordinates) throw new Error('Blocked coordinates were resolved again');
            const instruction = scenario[1];
            scenario[1] = { type:'MOVE_TO' };
            let invalidError;
            try { agent.update(0.1); } catch (error) { invalidError = error; }
            finally { scenario[1] = instruction; }
            if (!invalidError || invalidError.name === 'NavigationBlockedError') throw new Error('Invalid instruction data must still throw');
            nav.unregisterObstacle('blocked-shower-test');
            agent.update(0.1);
            if (agent.getStatus() === 'BLOCKED') throw new Error('Shower approach did not recover after the obstacle was removed');
            return { repeatedCoordinateResolutions:0, status:agent.getStatus(),invalidDataError:invalidError.message };
          } finally { g.VisibilityGraph.prototype.find = find; nav.unregisterObstacle('blocked-shower-test'); }
        });
        console.log('Shower blocked-coordinate recovery:',JSON.stringify(blocked));
      }
      const cases = await page.evaluate(async () => {
        const profile = window.nav.getAgentProfile('native'), results = [];
        for (const [id, { agent, label, scenario }] of window.autonomousAgents) {
          window.nav.setAgentProfile(id, profile);
          if(window.bathroomTest && label==='drona-west:pick-item') {
            const instruction=scenario.find(i=>i.type==='USE_OBJECT'), desired=window.resolveCoords(instruction,null,id);
            window.nav.setAgentProfile('laundry-occupant',profile);
            window.cameraState.positions['laundry-occupant']={x:desired.tx,y:0,z:desired.tz,yaw:0};
            const alternative=window.resolveCoords(instruction,null,id,{x:160,z:300});
            if(Math.hypot(alternative.tx-desired.tx,alternative.tz-desired.tz)<profile.radius*2) throw new Error('Laundry approach must leave room for the resting actor');
          }
          const deadline = performance.now() + 30000;
          let state, status;
          const spawn = window.spawnTest ? { ...agent.update(0) } : undefined;
          if (spawn) {
            const target = window.resolveCoords(scenario[0],null,id);
            if (spawn.y !== (target.ty ?? 0)) throw new Error(`${label}: spawn height differs from its resolved target`);
          }
          let interaction;
          const inspectInteraction = state => {
            interaction = { ...state };
            const instruction = scenario.find(i=>i.type==='USE_OBJECT');
            const target = window.resolveCoords(instruction,null,id,state);
            if (state.y !== (target.ty ?? 0)) throw new Error(`${label}: interaction height differs from its slot`);
            const graph = window.nav.getNavigationGraph(profile,target.owner);
            if (window.geom.insideObstacle(state,graph.obstacles)) throw new Error(`${label}: interaction starts inside an unrelated obstacle`);
          };
          if (spawn && agent.getStatus() === 'INTERACTING') inspectInteraction(spawn);
          while (performance.now() < deadline) {
            state = { ...agent.update(0.1) }; status = agent.getStatus();
            if (window.spawnTest && status === 'INTERACTING') {
              inspectInteraction(state);
            }
            window.cameraState.positions[id] = { ...state, yaw: state.rotY };
            if (status === 'FINISHED' || status === 'BLOCKED') break;
            await new Promise(resolve => requestAnimationFrame(resolve));
          }
          results.push({ label, status, spawn, interaction, state, route: window.nav.navigationDebug.get(id) });
          console.log('Agent trace:', JSON.stringify(results[results.length - 1]));
          delete window.cameraState.positions[id];
          delete window.cameraState.positions['laundry-occupant'];
          if (status !== 'FINISHED' && !window.spawnTest) break;
        }
        return results;
      });
      assert.equal(cases.length, process.argv.includes('--bathroom-cases') ? 3 : process.argv.includes('--spawn-objects') ? 10 : process.argv.includes('--shower-only') ? 2 : 8);
      assert.ok(cases.every(c => c.status === 'FINISHED'), JSON.stringify(cases));
      if (process.argv.includes('--spawn-objects')) assert.ok(cases.every(c=>c.interaction),'Each spawned agent must actually enter its interaction before departing');
      assert.equal(errors.length,0,'Interaction tests must not emit uncaught exceptions');
      console.log('Interaction regressions passed with all three animation options OFF.');
      return;
    }
    if (process.argv.includes('--route-recovery')) {
      const result = await page.evaluate(() => {
        const nav = window.nav, g = window.geom;
        nav.setAgentProfile('corner-probe',nav.getAgentProfile('native'));
        const graph = nav.getNavigationGraph(nav.getAgentProfile('corner-probe'));
        const oldObstacles = graph.obstacles, oldFind = graph.find;
        const square = new g.VisibilityGraph([[g.rectangle(160,300,20,20)]]);
        graph.obstacles = square.obstacles; graph.find = square.find.bind(square);
        try {
          const delta = 5 * g.GEOMETRY_EPSILON;
          const start = { x:150-delta,z:290+delta }, target = { x:171,z:290.5 };
          const path = graph.find(start,target);
          if (!path || g.distance(start,path[0]) >= 1e-6 || g.segmentFree(start,path[1],graph.obstacles)) throw new Error('Fixture must reproduce an unsafe shortcut past a nearby corner');
          const route = nav.createRouteState();
          const moved = nav.followRoute(route,'corner-probe',start,target,1);
          if (route.error || moved.x !== path[0].x || moved.z !== path[0].z) throw new Error('The nearby corner was skipped');
          const onward = nav.followRoute(route,'corner-probe',moved,target,1);
          if (onward.x <= moved.x || route.error) throw new Error('The actor did not continue past its corner');
          let calls = 0;
          graph.find = () => { calls++; return [{ x:160,z:300 },target]; };
          const invalid = nav.createRouteState();
          nav.followRoute(invalid,'corner-probe',start,target,1);
          const firstCalls = calls;
          for (let frame=0;frame<300;frame++) nav.followRoute(invalid,'corner-probe',start,target,1);
          if (!invalid.error || calls !== firstCalls) throw new Error('An invalid planned segment must report an error without recursive or repeated searches');
          return { moved,onward,firstCalls,repeatedCalls:calls-firstCalls,error:invalid.error };
        } finally { graph.obstacles = oldObstacles; graph.find = oldFind; nav.resetRoute(nav.createRouteState(),'corner-probe'); }
      });
      console.log('Corner and recursion regressions:',JSON.stringify(result));
      if (!process.argv.includes('--scooter-parking')) return;
    }
    if (process.argv.includes('--scooter-parking')) {
      const result = await page.evaluate(async () => {
        const THREE = await import('/node_modules/.vite/deps/three.js');
        const walls = await import('/src/features/scene/wallData.ts');
        window.fixtureScene.updateMatrixWorld(true);
        let scooter;
        window.fixtureScene.traverse(node => { if (node.userData.itemName === 'Trottinette Xiaomi') scooter = node; });
        const wheels = { front:[],rear:[] };
        scooter.traverse(mesh => {
          if (!mesh.isMesh || mesh.material.name !== 'Black.001') return;
          let parent = mesh;
          while (parent && parent.name !== 'SteeringAssembly' && parent.name !== 'ScooterBody') parent = parent.parent;
          if (!parent) throw new Error('Wheel is outside its expected scooter assembly');
          const points = wheels[parent.name === 'SteeringAssembly' ? 'front' : 'rear'];
          const positions = mesh.geometry.getAttribute('position');
          for (let i=0;i<positions.count;i++) points.push(new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld));
        });
        const frontEast = Math.max(...wheels.front.map(p=>p.x)), rearEast = Math.max(...wheels.rear.map(p=>p.x));
        const frontNorth = Math.min(...wheels.front.map(p=>p.z));
        if ([frontEast-walls.ROOM_EAST_WALL,rearEast-walls.ROOM_EAST_WALL,frontNorth-walls.CORRIDOR_NORTH_WALL].some(gap=>Math.abs(gap)>1e-7)) throw new Error('Scooter tires do not touch the specified walls');
        return { position:scooter.position.toArray(),angle:scooter.rotation.y,frontEast,rearEast,frontNorth,obstacle:window.nav.furnitureObstacles.get('scooter:0') };
      });
      console.log('Scooter parking:',JSON.stringify(result));
      return;
    }
    if (process.argv.includes('--blocked-retry')) {
      const result = await page.evaluate(async () => {
        const nav = window.nav, g = window.geom;
        const requests = await import('/src/features/scene/ai/navigation/doorRequests.ts');
        nav.setAgentProfile('blocked-probe', nav.getAgentProfile('native'));
        const start = { x:160, z:300 }, target = { x:200, z:-50 };
        const owner = 'blocked-owner';
        nav.registerObstacle({ id:owner, owner, polygon:g.rectangle(start.x,start.z,10,10), yMin:0, yMax:200 });
        nav.registerObstacle({ id:'blocked-cover', polygon:g.rectangle(start.x,start.z,200,200), yMin:0, yMax:200 });
        const route = nav.createRouteState(); route.owner = owner;
        requests.requestDoor('living','blocked-probe'); route.doors.add('living');
        const find = g.VisibilityGraph.prototype.find;
        let searches = 0;
        g.VisibilityGraph.prototype.find = function(...args) { searches++; return find.apply(this,args); };
        try {
          nav.followRoute(route,'blocked-probe',start,target,1);
          if (!route.error) throw new Error('Fixture must have an impossible object exit');
          if (requests.doorRequested('living')) throw new Error('An impossible route retained its door reservation');
          const firstSearches = searches, error = route.error;
          for (let frame=0; frame<300; frame++) nav.followRoute(route,'blocked-probe',start,target,1);
          const repeatedSearches = searches - firstSearches;
          if (route.error !== error) throw new Error('Cached failure lost its diagnostic');
          nav.unregisterObstacle('blocked-cover');
          const moved = nav.followRoute(route,'blocked-probe',start,target,1);
          const recoverySearches = searches - firstSearches;
          const recoveredError = route.error;
          nav.resetRoute(route,'blocked-probe'); route.owner = undefined;
          nav.registerObstacle({ id:'blocked-cover', polygon:g.rectangle(start.x,start.z,200,200), yMin:0, yMax:200 });
          nav.followRoute(route,'blocked-probe',target,start,1,undefined,owner,true);
          if (!route.error) throw new Error('Fixture must have an impossible object approach');
          const approachSearches = searches;
          for (let frame=0; frame<300; frame++) nav.followRoute(route,'blocked-probe',target,start,1,undefined,owner,true);
          const repeatedApproachSearches = searches - approachSearches;
          nav.followRoute(route,'blocked-probe',{ x:target.x+1,z:target.z },start,1,undefined,owner,true);
          if (searches === approachSearches) throw new Error('A changed departure must retry');
          nav.unregisterObstacle(owner); nav.unregisterObstacle('blocked-cover');
          // An actor spawned in another body must be able to separate while
          // leaving its furniture, without deepening the existing overlap.
          nav.registerObstacle({id:owner,owner,polygon:g.rectangle(-100,-600,10,10),yMin:0,yMax:200});
          nav.setAgentProfile('exit-occupant',{radius:nav.getAgentProfile('native').radius*2,height:200});
          window.cameraState.positions['exit-occupant']={x:-100,y:0,z:-600,yaw:0};
          const exitStart={x:-100,z:-600},exitTarget={x:100,z:-600};
          nav.resetRoute(route,'blocked-probe');route.owner=owner;
          let actorRecovery=exitStart;
          for(let frame=0;frame<300&&g.distance(actorRecovery,exitTarget)>g.GEOMETRY_EPSILON;frame++) {
            const before=actorRecovery;
            actorRecovery=nav.followRoute(route,'blocked-probe',before,exitTarget,1);
            if(route.error||g.distance(actorRecovery,exitStart)<g.distance(before,exitStart)-g.GEOMETRY_EPSILON)throw new Error('Furniture exit deepened an existing actor overlap');
          }
          if(g.distance(actorRecovery,exitTarget)>g.GEOMETRY_EPSILON)throw new Error('Overlapping actors could not separate during their furniture exit');
          delete window.cameraState.positions['exit-occupant'];nav.unregisterObstacle(owner);
          // Waiting on an occupied local exit must track that exit, not the
          // distant final destination, which is already free.
          nav.registerObstacle({id:owner,owner,polygon:g.rectangle(-100,-600,10,10),yMin:0,yMax:200});
          [[-120,-600,2,100],[-100,-620,100,2],[-100,-580,100,2]].forEach(([x,z,w,d],i)=>nav.registerObstacle({id:`exit-wall-${i}`,polygon:g.rectangle(x,z,w,d),yMin:0,yMax:200}));
          nav.setAgentProfile('exit-occupant',nav.getAgentProfile('native'));
          window.cameraState.positions['exit-occupant']={x:-60,y:0,z:-600,yaw:0};
          nav.resetRoute(route,'blocked-probe');route.owner=owner;
          let localPosition=exitStart;
          for(let frame=0;frame<100&&!route.error;frame++)localPosition=nav.followRoute(route,'blocked-probe',localPosition,exitTarget,1);
          if(route.error!=='Destination occupée par un autre acteur'||!route.occupiedTarget)throw new Error('Local exit fixture did not stop at its occupant');
          const localSearches=searches;
          for(let frame=0;frame<300;frame++)nav.followRoute(route,'blocked-probe',localPosition,exitTarget,1);
          if(searches!==localSearches)throw new Error('Waiting for a local exit rebuilt paths every frame');
          delete window.cameraState.positions['exit-occupant'];
          for(let frame=0;frame<300&&g.distance(localPosition,exitTarget)>g.GEOMETRY_EPSILON;frame++)localPosition=nav.followRoute(route,'blocked-probe',localPosition,exitTarget,1);
          if(route.error||g.distance(localPosition,exitTarget)>g.GEOMETRY_EPSILON)throw new Error('Local exit did not resume after its occupant left');
          nav.unregisterObstacle(owner);for(let i=0;i<3;i++)nav.unregisterObstacle(`exit-wall-${i}`);
          [[160,260,84,4],[160,340,84,4],[120,300,4,84],[200,300,4,84]].forEach(([x,z,w,d],i) =>
            nav.registerObstacle({ id:`blocked-ring-${i}`, polygon:g.rectangle(x,z,w,d), yMin:0, yMax:200 }));
          const graph = nav.getNavigationGraph(nav.getAgentProfile('blocked-probe'));
          if (g.insideObstacle(start,graph.obstacles) || graph.find(target,start)) throw new Error('Fixture must contain a free but unreachable destination');
          const approach = nav.getObjectApproach('free-target',start,'blocked-probe',target,false,undefined,undefined,true);
          if (!approach || !graph.find(target,approach)) throw new Error('Approach must be reachable from the actor');
          return { firstSearches, repeatedSearches, repeatedApproachSearches, recoverySearches, moved, approach, actorRecovery, localPosition, error:recoveredError };
        } finally {
          g.VisibilityGraph.prototype.find = find;
          nav.resetRoute(route,'blocked-probe');
          nav.unregisterObstacle(owner); nav.unregisterObstacle('blocked-cover');
          for (let i=0;i<4;i++) nav.unregisterObstacle(`blocked-ring-${i}`);
        }
      });
      console.log('Blocked route retry:', JSON.stringify(result));
      assert.ok(result.firstSearches > 0);
      assert.equal(result.repeatedSearches,0,'An unchanged impossible exit must not search again');
      assert.equal(result.repeatedApproachSearches,0,'An unchanged impossible approach must not search again');
      assert.ok(result.recoverySearches > 0,'Geometry changes must retry immediately');
      assert.equal(result.error,null,'Removing the obstruction must restore movement');
      assert.ok(result.moved.x !== 160 || result.moved.z !== 300);
      return;
    }
    if (process.argv.includes('--idle-only')) {
      const audit = await page.evaluate(async () => {
        const profile = window.nav.getAgentProfile('native');
        for (const id of window.autonomousAgents.keys()) window.nav.setAgentProfile(id, profile);
        const blocked = new Map(), failures = [];
        const heapSamples = [];
        const frames = window.measureHeap ? 3600 : 1200;
        let completedFrames = 0;
        for (let frame = 0; frame < frames; frame++) {
          if (window.measureHeap && frame % 1200 === 0) {
            const heap = await window.measureHeap();
            heapSamples.push({ frame, ...heap });
            console.log('Agent trace:', JSON.stringify({ heap: heapSamples[heapSamples.length - 1], timings: window.navigationTimings }));
          }
          for (const [id, { agent }] of window.autonomousAgents) {
            try {
              const state = { ...agent.update(0.1) };
              window.cameraState.positions[id] = { ...state, yaw: state.rotY };
              const status = agent.getStatus(), route = window.nav.navigationDebug.get(id);
              if (status === 'BLOCKED') blocked.set(id, { id, frame, state, route, obstacles: window.nav.getNavigationGraph(profile).obstacles,
                blockers: [...window.nav.architectureObstacles, ...window.nav.furnitureObstacles.values()].filter(o => window.geom.pointInRing(route.target, window.geom.inflate(o.polygon, profile.radius))).map(o => ({id:o.id,owner:o.owner,polygon:o.polygon})),
                startBlockers: [...window.nav.architectureObstacles, ...window.nav.furnitureObstacles.values()].filter(o => window.geom.pointInRing(state, window.geom.inflate(o.polygon, profile.radius))).map(o => ({id:o.id,owner:o.owner,polygon:o.polygon})),
              });
              if (!window.measureHeap && frame % 300 === 0) console.log('Agent trace:', JSON.stringify({ id, frame, status, state, target: route?.target, error: route?.error }));
            } catch (error) { failures.push({ id, frame, error: error.message }); }
          }
          completedFrames = frame + 1;
          if (blocked.size || failures.length) break;
          await new Promise(resolve => requestAnimationFrame(resolve));
        }
        if (window.measureHeap) heapSamples.push({ frame: completedFrames, ...await window.measureHeap() });
        return { blocked: [...blocked.values()], failures, heapSamples };
      });
      console.log('Autonomous audit:', JSON.stringify({ ...audit, blocked: audit.blocked.map(({ obstacles, ...result }) => result) }));
      fs.writeFileSync('/tmp/room-navigation-audit.json', JSON.stringify(audit, null, 2));
      if (process.argv.includes('--profile')) {
        console.log('Navigation profile:', JSON.stringify(await page.evaluate(() => window.navigationTimings)));
      }
      console.log('Plant geometry:', await page.evaluate(() => {
        const entries = [];
        window.fixtureScene.traverse(node => {
          if (node.userData.itemName?.match(/palm|palmier/i)) entries.push({name:node.name,label:node.userData.itemName,children:node.children.map(c=>({name:c.name,children:c.children.map(m=>({name:m.name,type:m.type}))}))});
        });
        return JSON.stringify(entries);
      }));
      assert.equal(audit.blocked.length, 0, 'Autonomous actors must not get permanently blocked');
      assert.equal(audit.failures.length, 0, 'Autonomous coordinates must resolve');
      return;
    }
    const result = await page.evaluate(() => {
      const nav = window.nav;
      const geometry = window.geom;
      const profile = nav.getAgentProfile('native');
      nav.setAgentProfile('probe', profile);
      const graph = nav.getNavigationGraph(profile);
      const fixtures = [
        [{ x: 80, z: 380 }, { x: 140, z: 560 }],
        [{ x: 140, z: 560 }, { x: 80, z: 380 }],
        [{ x: 160, z: 300 }, { x: 200, z: -50 }],
      ];
      const paths = fixtures.map(([from, to]) => graph.find(from, to));
      const exitRoute = nav.createRouteState();
      nav.followRoute(exitRoute, 'probe', {x:80,z:400}, {x:80,z:400}, 1, undefined, 'cuisine-group', true);
      nav.resetRoute(exitRoute, 'probe');
      const exited = nav.followRoute(exitRoute, 'probe', {x:80,z:400}, {x:140,z:560}, 1);
      console.log('Controlled exit:', JSON.stringify({exited, error: exitRoute.error, owner: exitRoute.owner}));
      window.agent.setPosition(80, 0, 400);
      window.runAgent = true;
      return { profile, count: nav.furnitureObstacles.size, vertices: graph.vertices.length, paths: paths.map(p => p ? ({ length: p.length, distance: [fixtures[paths.indexOf(p)][0], ...p].slice(1).reduce((sum, point, i) => sum + geometry.distance([fixtures[paths.indexOf(p)][0], ...p][i], point), 0) }) : null), blockers: [...nav.furnitureObstacles.values()].map(o => ({ id: o.id, angle: nav.getDoorContactAngle(nav.DOOR_CONFIGS.living, o.polygon), polygon: o.polygon })).filter(o => o.angle !== null && o.angle < 0.8), excludedStart: geometry.insideObstacle({x:80,z:400}, nav.getNavigationGraph(profile, 'cuisine-group').obstacles), startObstacles: [...nav.architectureObstacles, ...nav.furnitureObstacles.values()].filter(o => geometry.pointInRing({x:80,z:400}, geometry.inflate(o.polygon, profile.radius))), angles: Object.fromEntries(Object.entries(nav.DOOR_CONFIGS).map(([k, d]) => [k, nav.computeDoorAllowedAngle(d)])), furniture: [...nav.furnitureObstacles.values()].filter(o => ['kallax-se', 'corridor-closet', 'sdb-closet'].includes(o.owner)) };
    });
    console.log('Scene navigation:', JSON.stringify(result));
    assert.ok(result.profile.radius > 0 && result.profile.radius < 25.5, `Neutral body radius ${result.profile.radius}`);
    assert.ok(result.paths.every(Boolean), 'All main paths must be reachable');
    await page.evaluate(async () => {
      window.runAgent = false;
      const deadline = performance.now() + 60000;
      let previousLog = 0;
      while (performance.now() < deadline) {
        const tickStart = performance.now();
        window.agentState = { ...window.agent.update(0.1) };
        window.cameraState.positions.probe = { ...window.agentState, yaw: window.agentState.rotY };
        const tickDuration = performance.now() - tickStart;
        window.agentStatus = window.agent.getStatus();
        if (window.agentStatus === 'FINISHED' || window.agentStatus === 'BLOCKED') break;
        if (performance.now() - previousLog > 5000) {
          previousLog = performance.now();
          console.log('Agent trace:', JSON.stringify({ tickDuration, revision: window.nav.getObstacleRevision(), state: window.agentState, status: window.agentStatus, doors: window.nav.doorCollisionState }));
        }
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
    });
    const outcome = await page.evaluate(() => ({ state: window.agentState, status: window.agentStatus, debug: window.nav.navigationDebug.get('probe') }));
    console.log('Cooking -> bathroom:', JSON.stringify(outcome));
    assert.equal(outcome.status, 'FINISHED');
    const interactions = await page.evaluate(async () => {
      const nav = window.nav, geometry = window.geom;
      const profile = nav.getAgentProfile('probe');
      let position = { x: 140, z: 560 };
      const route = nav.createRouteState();
      const moves = [];
      async function move(target, owner, interaction = false) {
        nav.resetRoute(route, 'probe');
        const deadline = performance.now() + 30000;
        let steps = 0;
        while (geometry.distance(position, target) > 1e-6 && performance.now() < deadline) {
          const before = position;
          position = nav.followRoute(route, 'probe', position, target, 6, undefined, owner, interaction);
          window.cameraState.positions.probe = { ...position, y: 0, yaw: 0 };
          if (route.error) throw new Error(`${route.error}, from ${JSON.stringify(position)}, to ${JSON.stringify(target)}, blockers ${JSON.stringify([...nav.architectureObstacles, ...nav.furnitureObstacles.values()].filter(o => geometry.pointInRing(target, geometry.inflate(o.polygon, profile.radius))).map(o => o.id))}`);
          for (const key of nav.doorKeys) {
            const leaf = [[geometry.inflate(nav.doorPolygon(key, nav.doorCollisionState[key].angle), profile.radius + nav.DOOR_CONFIGS[key].margin)]];
            if (geometry.distance(before, position) > 0 && !geometry.segmentFree(before, position, leaf)) throw new Error(`Crossed closed ${key}`);
          }
          steps++;
          await new Promise(resolve => requestAnimationFrame(resolve));
        }
        if (geometry.distance(position, target) > 1e-6) throw new Error(`Route stalled at ${JSON.stringify(position)}, target ${JSON.stringify(target)}, doors ${JSON.stringify(nav.doorCollisionState)}`);
        moves.push({ target, steps });
      }
      const approach = window.resolveCoords({ type: 'MOVE_TO', smartObjectId: 'shower', slotId: 'take-shower-2' }, null, 'probe');
      const shower = window.resolveCoords({ type: 'USE_OBJECT', smartObjectId: 'shower', slotId: 'take-shower-2' }, null, 'probe');
      await move({ x: approach.tx, z: approach.tz });
      await move({ x: shower.tx, z: shower.tz }, 'shower', true);
      await move({ x: approach.tx, z: approach.tz });
      await move({ x: 80, z: 380 });
      const bedMoves = window.smartObjects.buildSmartObjectInstructionSequence('bed-west', 'lie-down');
      for (const instruction of bedMoves) {
        const p = window.resolveCoords(instruction, null, 'probe', instruction.navigation === 'interaction' || instruction.type === 'USE_OBJECT' ? undefined : position);
        await move({ x: p.tx, z: p.tz }, instruction.smartObjectId, instruction.type === 'USE_OBJECT' || instruction.navigation === 'interaction');
      }
      const bedConfigurations = [];
      nav.useSceneStore.getState().triggerAction('bed-double', true);
      for (let i = 0; i < window.furnitureState.DOUBLE_BED_POSITIONS.length; i++) {
        if (i) nav.useSceneStore.getState().triggerAction('bed-position');
        const expected = window.furnitureState.DOUBLE_BED_POSITIONS[i].west;
        const deadline = performance.now() + 10000;
        do { await new Promise(resolve => requestAnimationFrame(resolve)); }
        while ((window.positionState['bed-position']?.idx !== i || window.furnitureState.movingFurniture.size
          || Math.abs(window.smartObjects.getSmartObject('bed-west').position[0] - expected.x) > 1e-6
          || Math.abs(window.smartObjects.getSmartObject('bed-west').position[2] - expected.z) > 1e-6) && performance.now() < deadline);
        if (window.furnitureState.movingFurniture.size) throw new Error('Bed transition did not settle');
        const west = window.smartObjects.getSmartObject('bed-west');
        if (Math.abs(west.position[0] - expected.x) > 1e-6 || Math.abs(west.position[2] - expected.z) > 1e-6) throw new Error(`Stale bed anchor ${JSON.stringify(west.position)}`);
        const graph = nav.getNavigationGraph(profile);
        const path = graph.find({ x: 80, z: 380 }, { x: 140, z: 560 });
        if (!path) throw new Error(`Kitchen to bath inaccessible with bed config ${i}`);
        position = { x: 80, z: 380 };
        route.owner = undefined;
        for (const instruction of window.smartObjects.buildSmartObjectInstructionSequence('bed-west', 'lie-down')) {
          const p = window.resolveCoords(instruction, null, 'probe', instruction.navigation === 'interaction' || instruction.type === 'USE_OBJECT' ? undefined : position);
          await move({ x: p.tx, z: p.tz }, instruction.smartObjectId, instruction.type === 'USE_OBJECT' || instruction.navigation === 'interaction');
        }
        bedConfigurations.push({ index: i, anchor: west.position, points: path.length, revision: nav.getObstacleRevision() });
      }
      nav.resetRoute(route, 'probe');
      return { moves, bedConfigurations, finalPosition: position };
    });
    console.log('Shower / bed integration:', JSON.stringify(interactions));
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('Browser integration passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
