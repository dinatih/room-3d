const fs = require('node:fs');
const launch = require('./browser-test-options.cjs');
const directory = process.env.ROOM_PROFILE_OUT || '/tmp/room-npc-profile';
const baselineRef = process.argv.find(arg => arg.startsWith('--baseline-ref='))?.slice('--baseline-ref='.length);
const profilePort = Number(process.env.ROOM_PROFILE_PORT || 5197);
const base = process.env.ROOM_TEST_URL || (process.argv.includes('--serve') ? `http://127.0.0.1:${profilePort}` : 'http://127.0.0.1:5186');
const hardware = process.argv.includes('--hardware-gpu');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function processMemory(rootPid) {
  const processes = [];
  for (const name of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(name)) continue;
    try {
      const status = fs.readFileSync(`/proc/${name}/status`, 'utf8');
      processes.push({ pid: +name, ppid: +status.match(/^PPid:\s+(\d+)/m)[1], rss: +(status.match(/^VmRSS:\s+(\d+)/m)?.[1] || 0) * 1024, swap: +(status.match(/^VmSwap:\s+(\d+)/m)?.[1] || 0)*1024, command: fs.readFileSync(`/proc/${name}/cmdline`, 'utf8').replaceAll('\0', ' ') });
    } catch {}
  }
  const ids = new Set([rootPid]);
  let changed;
  do { changed = false; for (const p of processes) if (ids.has(p.ppid) && !ids.has(p.pid)) { ids.add(p.pid); changed = true; } } while (changed);
  return processes.filter(p => ids.has(p.pid)).map(p => {
    let pss;
    try { pss = +fs.readFileSync(`/proc/${p.pid}/smaps_rollup`, 'utf8').match(/^Pss:\s+(\d+)/m)[1] * 1024; } catch {}
    return { ...p, pss };
  });
}
function topCpu(profile) {
  const nodes = new Map(profile.nodes.map(n => [n.id, n]));
  const self = new Map(), inclusive = new Map();
  const parents = new Map();
  for (const node of profile.nodes) for (const child of node.children || []) parents.set(child, node.id);
  for (let i = 0; i < (profile.samples || []).length; i++) {
    let id = profile.samples[i]; const us = profile.timeDeltas[i] || 0;
    self.set(id, (self.get(id) || 0) + us);
    while (id !== undefined) { inclusive.set(id, (inclusive.get(id) || 0) + us); id = parents.get(id); }
  }
  const list = map => [...map].sort((a,b) => b[1]-a[1]).slice(0,40).map(([id,us]) => ({...nodes.get(id).callFrame, ms:us/1000}));
  const targetNames=new Set(['useDronaGeoFromGlb','prepareDronaGeometry','measure','getContainingObjectOwner','inflate','furnitureFootprint','getObjectApproach']);const targets=new Map();
  for(const [id,us] of inclusive){const frame=nodes.get(id).callFrame;if(!frame.url.includes('/src/')||!targetNames.has(frame.functionName))continue;const key=frame.url.split('?')[0]+' '+frame.functionName;const entry=targets.get(key)||{name:frame.functionName,url:frame.url,inclusiveMs:0,selfMs:0};entry.inclusiveMs+=us/1000;entry.selfMs+=(self.get(id)||0)/1000;targets.set(key,entry);}
  return { self:list(self), inclusive:list(inclusive), targets:[...targets.values()], projectInclusive:[...inclusive].filter(([id])=>nodes.get(id).callFrame.url.includes('/src/')).sort((a,b)=>b[1]-a[1]).slice(0,40).map(([id,us])=>({...nodes.get(id).callFrame,ms:us/1000})) };
}
if (process.argv.includes('--inspect')) {
  (async () => {
    const log=fs.readFileSync(process.env.ROOM_PROFILE_LOG || '/tmp/room-npc-hardware.log','utf8');
    const endpoint=[...log.matchAll(/DevTools listening on (ws:\/\/\S+)/g)].at(-1)[1];
    const browser=await require('puppeteer').connect({browserWSEndpoint:endpoint});
    try {
      const system=await browser.target().createCDPSession();
      const info=await system.send('SystemInfo.getInfo');
      console.log('GPU',JSON.stringify(info.gpu.devices),info.gpu.auxAttributes.glRenderer);
      const processes=await system.send('SystemInfo.getProcessInfo');const root=processes.processInfo.find(p=>p.type==='browser');
      if(root)console.log('PROCESSES',JSON.stringify(processMemory(root.id).map(p=>({...p,command:p.command.match(/--type=([^ ]+)/)?.[1]||'browser'}))));
      const pages=await browser.pages();const page=pages.find(p=>p.url().startsWith(base));
      const client=await page.createCDPSession();
      client.on('Runtime.consoleAPICalled',e=>{if(e.type==='error'||e.type==='warning')console.log('CONSOLE',e.type,e.args.map(a=>a.value||a.description).join(' ').slice(0,1000));});
      client.on('Runtime.exceptionThrown',e=>console.log('EXCEPTION',JSON.stringify(e.exceptionDetails).slice(0,1500)));
      await client.send('Runtime.enable');
      if(process.argv.includes('--capture')){
        await client.send('Profiler.enable');const {profile}=await client.send('Profiler.stop');
        fs.writeFileSync(`${directory}/stalled-startup.cpuprofile`,JSON.stringify(profile));
        console.log('STALLED CPU',JSON.stringify(topCpu(profile)));await client.send('Profiler.start');
      }
      console.log('HEAP',await client.send('Runtime.getHeapUsage'));
      const models=await page.evaluate(()=>{
        const models=[];window.__THREE_SCENE__?.traverse(root=>{if(!root.userData.gltfPath?.includes('characters/lara/'))return;
          const skeletons=new Set(),geometries=new Set();let meshes=0;root.traverse(o=>{if(o.isSkinnedMesh){meshes++;skeletons.add(o.skeleton);geometries.add(o.geometry);}});
          models.push({path:root.userData.gltfPath,meshes,skeletons:skeletons.size,geometries:geometries.size});
        });return models;
      });console.log('LARA SHARING',JSON.stringify(models));
      console.log('PAGE',await page.evaluate(async()=>{
        const {useProgress}=await import('/node_modules/.vite/deps/@react-three_drei.js');
        return {url:location.href,text:document.body.innerText.slice(0,1200),loading:useProgress.getState(),renderer:window.__THREE_GL__?.info.memory,sceneChildren:window.__THREE_SCENE__?.children.length,resources:performance.getEntriesByType('resource').slice(-12).map(r=>r.name),frames:window.profileFrames?.length};
      }));
    }finally{browser.disconnect();}
  })().catch(e=>{console.error(e);process.exitCode=1;});
} else if (process.argv.includes('--report')) {
  const summary=JSON.parse(fs.readFileSync(`${directory}/summary.json`));
  for(const run of summary.runs){
    for(const phase of ['startup','steady']){const path=`${directory}/${run.count}-${phase}.cpuprofile`;if(fs.existsSync(path))run[phase+'Cpu']=topCpu(JSON.parse(fs.readFileSync(path)));}
    console.log('RUN',run.count,'GPU',run.system?.gpu.devices,'ERRORS',run.errors);
    for(const s of run.samples)console.log(s.label,s.elapsed,'heapMB',s.heap.usedSize/1e6,'buffersMB',s.heap.backingStorageSize/1e6,'PSSMB',s.processPss/1e6,'swapMB',s.processes.reduce((n,p)=>n+(p.swap||0),0)/1e6,'worstTask',Math.max(0,...s.page.longTasks.map(t=>t.ms)));
    for(const phase of ['startup','steady'])if(run[phase+'Cpu'])for(const kind of ['self','inclusive','projectInclusive'])console.log(phase,kind,JSON.stringify(run[phase+'Cpu'][kind].slice(0,15)));
    for(const phase of ['startup','steady'])if(run[phase+'Cpu'])console.log(phase,'TARGETS',JSON.stringify(run[phase+'Cpu'].targets));
    const last=run.samples.at(-1);if(last){
      const warm=run.samples.find(s=>s.label==='steady');const since=warm?warm.page.seconds*1000:0;
      const frames=last.page.frames.filter(f=>f.start>=since).map(f=>f.ms).sort((a,b)=>a-b);
      console.log('STEADY FRAMES',JSON.stringify({count:frames.length,p50:frames[Math.floor(frames.length*.5)],p95:frames[Math.floor(frames.length*.95)],p99:frames[Math.floor(frames.length*.99)],max:frames.at(-1),over100ms:frames.filter(f=>f>100).length,over1000ms:frames.filter(f=>f>1000).length}));
      if(last.page.retargets?.length)console.log('RETARGET',JSON.stringify(last.page.retargets.sort((a,b)=>b.ms-a.ms).slice(0,20)));
    }
    if(run.resources){const counts={};for(const m of run.resources.models)counts[m.path]=(counts[m.path]||0)+1;console.log('RESOURCES',JSON.stringify({meshes:run.resources.meshes,geometries:run.resources.geometries,geometryBytes:run.resources.geometryBytes,materials:run.resources.materials,skeletons:run.resources.skeletons,textures:run.resources.textures.length,textureRgbaBaseEstimate:run.resources.textures.reduce((n,t)=>n+(t.width||0)*(t.height||0)*4,0),characterModels:Object.fromEntries(Object.entries(counts).filter(([key])=>/lara\/|xbot/i.test(key))),pathfindingStats:run.resources.pathfindingStats}));}
    const allocationPath=`${directory}/${run.count}-allocations.json`;
    if(fs.existsSync(allocationPath)){
      const allocation=JSON.parse(fs.readFileSync(allocationPath));const nodes=[];
      function visit(node){let total=node.selfSize;for(const child of node.children||[])total+=visit(child);nodes.push({frame:node.callFrame,self:node.selfSize,total});return total;}
      visit(allocation.head);console.log('RETAINED ALLOCATION SAMPLES',JSON.stringify(nodes.sort((a,b)=>b.self-a.self).slice(0,15)));
    }
  }
} else (async () => {
  let server;
  if (process.argv.includes('--serve')) {
    const {createServer}=await import('vite');
    const {execFileSync}=require('node:child_process');const path=require('node:path');
    const historical=new Map();
    if(baselineRef)for(const file of execFileSync('git',['diff','--name-only','--diff-filter=M',baselineRef,'--','src'],{encoding:'utf8'}).trim().split('\n').filter(Boolean)){
      historical.set(path.resolve(file),execFileSync('git',['show',`${baselineRef}:${file}`],{encoding:'utf8'}));
    }
    server=await createServer({server:{host:'127.0.0.1',port:profilePort,strictPort:true},plugins:[{name:'npc-profile-baseline',enforce:'pre',load(id){return historical.get(id.split('?')[0]);}}]});
    await server.listen();
  }
  fs.mkdirSync(directory, { recursive:true });
  const summary = { date:new Date().toISOString(), baselineRef, headless:true, gpu:hardware?'hardware-requested':'software', viewport:[1362,810], runs:[] };
  const counts = (process.env.ROOM_PROFILE_COUNTS || '0,15').split(',').map(Number);
  for (const count of counts) {
    let browser;
    const run = { count, samples:[], errors:[], requests:[] };
    summary.runs.push(run);
    const save = () => fs.writeFileSync(`${directory}/summary.json`, JSON.stringify(summary,null,2));
    try {
      browser = await launch({ args:['--no-sandbox', ...(hardware ? ['--enable-gpu','--use-angle=vulkan','--enable-features=Vulkan,VulkanFromANGLE','--render-node-override=/dev/dri/renderD128','--disable-vulkan-surface'] : ['--enable-unsafe-swiftshader'])], defaultViewport:{width:1362,height:810,deviceScaleFactor:1} });
      const page = await browser.newPage();
      const client = await page.createCDPSession();
      const system = await browser.target().createCDPSession();
      run.system = await system.send('SystemInfo.getInfo');
      fs.writeFileSync(`${directory}/${count}-gpu.json`, JSON.stringify(run.system, null, 2));
      console.log('GPU', JSON.stringify(run.system.gpu.devices), run.system.gpu.auxAttributes.glRenderer);
      page.on('pageerror', e => {run.errors.push(String(e)); console.log('PAGE ERROR',String(e));});
      page.on('requestfinished', request => {if (/\.(glb|gltf|png|jpg|webp)(\?|$)/.test(request.url())) run.requests.push({url:request.url(),time:Date.now(),size:request.response()?.headers()['content-length']});});
      await page.evaluateOnNewDocument(() => {
        window.profileLongTasks=[]; window.profileFrames=[];
        performance.setResourceTimingBufferSize(10000);
        new PerformanceObserver(list => { for(const e of list.getEntries()) window.profileLongTasks.push({start:e.startTime,ms:e.duration}); }).observe({type:'longtask',buffered:true});
        let previous; function tick(now) { if(previous!==undefined) window.profileFrames.push({start:now,ms:now-previous});previous=now;requestAnimationFrame(tick); } requestAnimationFrame(tick);
      });
      await client.send('Profiler.enable'); await client.send('Profiler.start');
      await client.send('HeapProfiler.enable'); await client.send('HeapProfiler.startSampling',{samplingInterval:32768});
      const started = Date.now();
      await page.goto(`${base}/?characterCount=${count}&skipIntro=1&preset=low&target=studio&projection=ortho&cameraPos=west&cameraElevation=90&perfGraph=1`,{waitUntil:'domcontentloaded',timeout:180000});
      async function sample(label) {
        const heap = await client.send('Runtime.getHeapUsage');
        const pageData = await page.evaluate(async () => {
          const gl=window.__THREE_GL__, scene=window.__THREE_SCENE__;
          const {cameraState} = await import('/src/features/scene/cameraState.ts');
          return {seconds:performance.now()/1000,ready:cameraState.isSceneLaunched,heap:performance.memory?.usedJSHeapSize,renderer:gl?{memory:gl.info.memory,programs:gl.info.programs.length,render:gl.info.render}:null,longTasks:window.profileLongTasks,frames:window.profileFrames,text:scene?undefined:document.body.innerText.slice(0,300)};
        });
        const memory = processMemory(browser.process().pid);
        const s = {label,elapsed:(Date.now()-started)/1000,heap,processRss:memory.reduce((n,p)=>n+p.rss,0),processPss:memory.reduce((n,p)=>n+(p.pss||0),0),processes:memory,page:pageData};
        run.samples.push(s);save();console.log('SAMPLE',count,label,JSON.stringify({elapsed:s.elapsed,heap,processRss:s.processRss,processPss:s.processPss,ready:pageData.ready,longTasks:pageData.longTasks.length,worstTask:Math.max(0,...pageData.longTasks.map(t=>t.ms))}));return pageData;
      }
      let ready=false;
      for(let step=0;step<18;step++) { await sleep(10000); const s=await sample('startup');if(s.ready){ready=true;break;} }
      let result=await client.send('Profiler.stop');fs.writeFileSync(`${directory}/${count}-startup.cpuprofile`,JSON.stringify(result.profile));run.startupCpu=topCpu(result.profile);
      if(!ready) throw Error('Scene not ready after startup observation');
      await page.evaluate(async () => {const {resetAppIdle}=await import('/src/features/scene/idleState.ts');setInterval(resetAppIdle,1000);});
      await client.send('Profiler.start');
      for(let step=0;step<6;step++) {await sleep(10000);await sample('steady');}
      result=await client.send('Profiler.stop');fs.writeFileSync(`${directory}/${count}-steady.cpuprofile`,JSON.stringify(result.profile));run.steadyCpu=topCpu(result.profile);
      const allocation=await client.send('HeapProfiler.stopSampling');fs.writeFileSync(`${directory}/${count}-allocations.json`,JSON.stringify(allocation.profile));
      await client.send('HeapProfiler.collectGarbage');await sample('after-gc');
      run.resources=await page.evaluate(async () => {
        const scene=window.__THREE_SCENE__;const geometries=new Set(),materials=new Set(),textures=new Set(),skeletons=new Set(),models=[];let meshes=0;
        scene.traverse(o=>{if(o.userData.gltfPath)models.push({path:o.userData.gltfPath,name:o.name});if(o.isMesh){meshes++;geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}if(o.skeleton)skeletons.add(o.skeleton);}});
        let geometryBytes=0;const arrays=new Set();for(const g of geometries)for(const a of [...Object.values(g.attributes),...(g.index?[g.index]:[])]){const data=a.array||a.data?.array;if(data&&!arrays.has(data.buffer)){arrays.add(data.buffer);geometryBytes+=data.buffer.byteLength;}}
        const textureInfo=[...textures].map(t=>({name:t.name,url:t.image?.src,width:t.image?.width,height:t.image?.height,mipmaps:t.generateMipmaps,type:t.type,format:t.format}));
        const {useSceneStore}=await import('/src/features/scene/store/useSceneStore.ts');const {pathfindingStats}=await import('/src/features/scene/ai/navigation/pathfindingClient.ts');
        return {models,meshes,geometries:geometries.size,geometryBytes,materials:materials.size,skeletons:skeletons.size,textures:textureInfo,layers:useSceneStore.getState().layers,pathfindingStats,resources:performance.getEntriesByType('resource').map(r=>({url:r.name,duration:r.duration,transfer:r.transferSize,decoded:r.decodedBodySize}))};
      });
      await page.screenshot({path:`${directory}/${count}-scene.png`});
      if(process.argv.includes('--validate-optimizations')){
        const {execFileSync}=require('node:child_process');const ts=require('typescript');
        const legacy=execFileSync('git',['show','becb2030:src/features/scene/birdPerches.ts'],{encoding:'utf8'});
        const code=ts.transpileModule("import * as THREE from 'three';const ROBIN_HEIGHT=15;\n"+legacy.slice(legacy.indexOf('export class RobinFootContact')),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
        const bird=await page.evaluate(async code=>{
          const THREE=await import('/node_modules/.vite/deps/three.js');const {RobinFootContact}=await import('/src/features/scene/birdPerches.ts');
          const exports={};new Function('exports','require',code)(exports,name=>{if(name!=='three')throw Error('Unexpected bird dependency');return THREE;});
          let root;window.__THREE_SCENE__.traverse(o=>{if(o.userData.gltfPath?.includes('/robin/'))root=o;});if(!root)throw Error('Robin not present');
          const saved=[];root.traverse(o=>{if(o.isBone)saved.push({bone:o,quaternion:o.quaternion.clone()});});
          const original=new exports.RobinFootContact(root),current=new RobinFootContact(root);let maxError=0;
          try{for(let pose=0;pose<20;pose++){
            for(const {bone,quaternion} of saved){bone.quaternion.copy(quaternion);if(/^[LR]_Digit/.test(bone.name))bone.rotateX(.1*Math.sin(pose));}
            const a=original.measure(root),b=current.measure(root);maxError=Math.max(maxError,a.left.distanceTo(b.left),a.right.distanceTo(b.right),Math.abs(a.thickness-b.thickness));
          }}finally{for(const {bone,quaternion} of saved)bone.quaternion.copy(quaternion);root.updateMatrixWorld(true);}
          if(maxError>1e-8)throw Error(`Real Robin feet changed: ${maxError}`);return {poses:20,maxError};
        },code);
        run.validation={bird};console.log('OPTIMIZATION CHECKS',JSON.stringify(run.validation));
      }
      if(run.errors.length)throw Error(run.errors.join('\n'));
      save();console.log('RUN COMPLETE',count);
    } catch(e) {run.errors.push(String(e));save();console.error(e);process.exitCode=1;}
    finally {await browser?.close();save();}
  }
  await server?.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
