const launchBrowser = require('./browser-test-options.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
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
    await page.evaluate(casesTest => { window.casesTest = casesTest; }, process.argv.includes('--cases-only'));
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
      window.steer = (await import('/src/features/scene/ai/agent/agentAvoidance.ts')).computeSteeringVector;
      const scenarios = await import('/src/features/scene/ai/scenarios.ts');
      window.autonomousAgents = new Map();
      function AutonomousProbe({ id }) {
        const scenario = React.useMemo(() => scenarios.buildAutonomousScenario(id), [id]);
        const agent = useAgentController(id, scenario, true, () => ({ x: 160, y: 0, z: 300, rotY: 0 }));
        window.autonomousAgents.set(id, { agent, scenario });
        return null;
      }
      const regressionCases = [
        ['desk-bollsidan-1', 'work-sitting'], ['desk-bollsidan-2', 'work-standing'],
        ['cuisine-group', 'cook-oven'], ['freezer', 'open-pick'], ['kallax-ne', 'inspect'],
        ['drona-west', 'pick-item'], ['sofa-garden-west', 'seat-2'], ['building-b-corridor', 'trash'],
      ];
      function RegressionProbe({ index }) {
        const id = `regression-${index}`;
        const scenario = React.useMemo(() => [{ type: 'MOVE_TO', targetPos: [160, 0, 300] },
          ...window.smartObjects.buildSmartObjectInstructionSequence(...regressionCases[index]).map(instruction => instruction.type === 'USE_OBJECT' ? { ...instruction, duration: 0.1, repeatCount: 1, animation: 'idle' } : instruction),
          { type: 'MOVE_TO', targetPos: [200, 0, -50] }], []);
        const agent = useAgentController(id, scenario, false, () => ({ x: 160, y: 0, z: 300, rotY: 0 }));
        window.autonomousAgents.set(id, { agent, scenario, label: regressionCases[index].join(':') });
        return null;
      }
      const e = React.createElement;
      document.body.innerHTML = '<div id="fixture" style="height:100vh"></div>';
      const native = CHARACTERS.find(c => c.id === 'native');
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
        e(React.Suspense, { fallback: null }, e(placements.Equipment), e(placements.Furniture), e(placements.Furnishings), e(placements.Decor), e(DoorsPlacement),
          e(Character, { ...native, modelPath: native.path, targetHeight: native.height, isLara: true, isActive: false, isNPC: false, scenario: null }))));
    });
    await page.waitForFunction(() => window.nav?.furnitureObstacles.size > 25 && window.nav.hasAgentProfile('native'), { timeout: 60000 }).catch(async error => { console.log('Readiness:', await page.evaluate(() => ({ ids: [...window.nav.furnitureObstacles.keys()], native: window.nav.hasAgentProfile('native'), scene: window.fixtureScene.children.map(c => c.name), agent: window.agent.getStatus() }))); throw error; });
    console.log('Scene assets ready:', await page.evaluate(() => ({ profile: window.nav.getAgentProfile('native'), obstacles: window.nav.furnitureObstacles.size })));
    if (process.argv.includes('--profile')) {
      fs.writeFileSync('/tmp/room-navigation-benchmark.json', JSON.stringify(await page.evaluate(() => ({
        obstacles: window.nav.getNavigationGraph(window.nav.getAgentProfile('native')).obstacles,
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
    if (process.argv.includes('--cases-only')) {
      const cases = await page.evaluate(async () => {
        const profile = window.nav.getAgentProfile('native'), results = [];
        for (const [id, { agent, label }] of window.autonomousAgents) {
          window.nav.setAgentProfile(id, profile);
          const deadline = performance.now() + 30000;
          let state, status;
          while (performance.now() < deadline) {
            state = { ...agent.update(0.1) }; status = agent.getStatus();
            window.cameraState.positions[id] = { ...state, yaw: state.rotY };
            if (status === 'FINISHED' || status === 'BLOCKED') break;
            await new Promise(resolve => requestAnimationFrame(resolve));
          }
          results.push({ label, status, state, route: window.nav.navigationDebug.get(id) });
          console.log('Agent trace:', JSON.stringify(results[results.length - 1]));
          delete window.cameraState.positions[id];
          if (status !== 'FINISHED') break;
        }
        return results;
      });
      assert.equal(cases.length, 8);
      assert.ok(cases.every(c => c.status === 'FINISHED'), JSON.stringify(cases));
      console.log('Interaction regressions passed with all three animation options OFF.');
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
          [[160,260,84,4],[160,340,84,4],[120,300,4,84],[200,300,4,84]].forEach(([x,z,w,d],i) =>
            nav.registerObstacle({ id:`blocked-ring-${i}`, polygon:g.rectangle(x,z,w,d), yMin:0, yMax:200 }));
          const graph = nav.getNavigationGraph(nav.getAgentProfile('blocked-probe'));
          if (g.insideObstacle(start,graph.obstacles) || graph.find(target,start)) throw new Error('Fixture must contain a free but unreachable destination');
          const approach = nav.getObjectApproach('free-target',start,'blocked-probe',target,false,undefined,undefined,true);
          if (!approach || !graph.find(target,approach)) throw new Error('Approach must be reachable from the actor');
          return { firstSearches, repeatedSearches, repeatedApproachSearches, recoverySearches, moved, approach, error:recoveredError };
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
    if (process.argv.includes('--doors-only')) {
      const doors = await page.evaluate(async () => {
        const nav = window.nav, g = window.geom;
        const profile = nav.getAgentProfile('native');
        nav.useSceneStore.setState(s => ({ layers: { ...s.layers, npcCollisions: true } }));
        const results = [];
        const scenarios = [
          [180, 200, 220].map(x => [{ x, z: -50 }, { x: 160, z: 300 }]),
          [140, 150, 160].map(x => [{ x, z: 300 }, { x: 200, z: -50 }]),
          [[{ x: 180, z: -50 }, { x: 160, z: 300 }], [{ x: 160, z: 300 }, { x: 200, z: -50 }]],
        ];
        for (const [scenarioIndex, destinations] of scenarios.entries()) {
        const actors = destinations.map(([position, target], i) => ({ id: `door-${i}`, position, target, route: nav.createRouteState() }));
        actors.forEach(a => nav.setAgentProfile(a.id, profile));
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
              if (g.distance(before, a.position) > 0 && !g.segmentFree(before, a.position, leaf)) throw new Error(`Crowd crossed ${key}`);
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
