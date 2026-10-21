const fs = require('node:fs');
const launch = require('./browser-test-options.cjs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
if (process.argv.includes('--report')) {
  for (const phase of ['playing','paused','hover']) {
    const path = `/tmp/room-animation-${phase}-trace.json`;
    if (!fs.existsSync(path)) continue;
    const totals = new Map();
    for (const e of JSON.parse(fs.readFileSync(path)).traceEvents) if (e.ph==='X' && e.dur) {
      const v=totals.get(e.name)||{ms:0,count:0,max:0};v.ms+=e.dur/1000;v.count++;v.max=Math.max(v.max,e.dur/1000);totals.set(e.name,v);
    }
    console.log(phase, [...totals].sort((a,b)=>b[1].ms-a[1].ms).slice(0,25));
  }
} else (async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 5198, strictPort: true } });
  await server.listen();
  let browser;
  try {
    browser = await launch({args:['--no-sandbox','--enable-gpu','--use-angle=vulkan','--enable-features=Vulkan,VulkanFromANGLE','--render-node-override=/dev/dri/renderD128','--disable-vulkan-surface'],defaultViewport:{width:1362,height:810}});
    const page = await browser.newPage();
    page.on('pageerror', e => console.log('PAGE ERROR', String(e)));
    const client = await page.createCDPSession();
    await page.goto('http://127.0.0.1:5198/?inventory=animations&animation=miley-armature-h4-attack-rising-kick&animationMode=solo&skipIntro=1', {waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(async () => {const {useAnimPreviewStore:s}=await import('/src/features/inventory/useAnimPreviewStore.ts');return s.getState().duration>7;},{timeout:120000});
    await sleep(45000);
    const assert = require('node:assert/strict');
    const rowCount = await page.$$eval('.animation-studio__row', rows => rows.length);
    const capacity = await page.$eval('.animation-studio__results', list => Math.ceil(list.clientHeight / (parseFloat(getComputedStyle(list).getPropertyValue('--animation-row-height')) * parseFloat(getComputedStyle(document.documentElement).fontSize))) * 3 + 2);
    assert(rowCount > 0 && rowCount <= capacity, 'Only viewport rows should be mounted');
    await page.evaluate(() => { const list=document.querySelector('.animation-studio__results');list.scrollTop=list.scrollHeight; });
    await page.waitForFunction(() => document.querySelector('.animation-studio__row:last-of-type')?.getAttribute('aria-posinset') === document.querySelector('.animation-studio__row:last-of-type')?.getAttribute('aria-setsize'));
    await page.click('[aria-label="Animation suivante"]');
    await page.waitForFunction(() => !!document.querySelector('.animation-studio__row[aria-selected="true"]'));
    await page.type('[aria-label="Rechercher une animation"]','h4 attack rising kick');
    await page.waitForFunction(() => document.querySelectorAll('.animation-studio__row').length===1);
    await page.click('[aria-label="Effacer la recherche d’animation"]');
    await page.waitForFunction(() => document.querySelector('.animation-studio__row')?.getAttribute('aria-setsize')==='3528');
    console.log('VALIDATED viewport rows, last row, navigation, search and reset', rowCount);
    console.log('PAGE',await page.evaluate(()=>document.body.innerText.slice(-1800)));
    const system=await browser.target().createCDPSession(); console.log('GPU',JSON.stringify((await system.send('SystemInfo.getInfo')).gpu.devices));
    await client.send('Profiler.enable');
    for(const phase of ['playing','paused','hover']) {
      await page.evaluate(async phase=>{const {useAnimPreviewStore:s}=await import('/src/features/inventory/useAnimPreviewStore.ts');phase.startsWith('playing')?s.getState().play():s.getState().pause();},phase);
      await sleep(1000);
      await page.evaluate(()=>{window.frameTimes=[];window.frameRecording=true;let prev;function tick(t){if(!window.frameRecording)return;if(prev)window.frameTimes.push(t-prev);prev=t;requestAnimationFrame(tick);}requestAnimationFrame(tick);});
      await page.tracing.start({path:`/tmp/room-animation-${phase}-trace.json`,categories:['devtools.timeline']});
      await client.send('Profiler.start');
      if(phase==='hover')for(let i=0;i<20;i++){await page.mouse.move(i%2?100:1000,400);await sleep(100);}
      else await sleep(5000);
      console.log('FRAMES',phase,await page.evaluate(()=>{window.frameRecording=false;const a=window.frameTimes.sort((a,b)=>a-b);return {count:a.length,p50:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)};}));
      await page.tracing.stop();
      const {profile}=await client.send('Profiler.stop');fs.writeFileSync(`/tmp/room-animation-${phase}.cpuprofile`,JSON.stringify(profile));
      const nodes=new Map(profile.nodes.map(n=>[n.id,n])),parents=new Map(),times=new Map();for(const n of profile.nodes)for(const c of n.children||[])parents.set(c,n.id);
      for(let i=0;i<profile.samples.length;i++){let id=profile.samples[i];while(id!==undefined){times.set(id,(times.get(id)||0)+profile.timeDeltas[i]);id=parents.get(id);}}
      console.log('GLOBAL',phase,JSON.stringify([...times].sort((a,b)=>b[1]-a[1]).slice(0,18).map(([id,t])=>({...nodes.get(id).callFrame,ms:t/1000}))));
      console.log('PROFILE',phase,JSON.stringify([...times].sort((a,b)=>b[1]-a[1]).filter(([id])=>nodes.get(id).callFrame.url.includes('/src/')).slice(0,22).map(([id,t])=>({...nodes.get(id).callFrame,ms:t/1000}))));
    }
    await page.screenshot({path:'/tmp/room-animation-profile.png'});
  } finally {await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
