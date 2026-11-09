const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { withBrowser } = require('../tests/support/browser.cjs');
const fixture = {...require('../tests/fixtures/cases.cjs').performance['studio-9-mid-day'], id:'cpu-profile'};
process.env.ROOM_TEST_SUITE='perf';
process.env.ROOM_TEST_RESULTS=fs.mkdtempSync('/tmp/room-cpu-profile-');
process.env.ROOM_TEST_COMMIT=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
process.env.ROOM_TEST_OPTIONS='{}';
withBrowser(fixture, async (page) => {
 await new Promise(resolve=>setTimeout(resolve,15000));
 const client=await page.createCDPSession();
 await client.send('Profiler.enable'); await client.send('Profiler.start');
 console.log('CPU PROFILE START');
 await new Promise(resolve=>setTimeout(resolve,20000));
 const {profile}=await client.send('Profiler.stop');
 fs.writeFileSync(path.join(process.env.ROOM_TEST_RESULTS,'cpu.json'),JSON.stringify(profile));
 const nodes=new Map(profile.nodes.map(node=>[node.id,node]));
 const parents=new Map(); for(const node of profile.nodes) for(const child of node.children??[])parents.set(child,node.id);
 const times=new Map();
 for(let i=0;i<profile.samples.length;i++) {
  let id=profile.samples[i];
  while(id!==undefined){times.set(id,(times.get(id)??0)+(profile.timeDeltas[i]??0));id=parents.get(id);}
 }
 console.log([...times].map(([id,us])=>({ms:us/1000,...nodes.get(id).callFrame})).filter(x=>x.url.includes('/src/')).sort((a,b)=>b.ms-a.ms).slice(0,30));
 console.log('Artifacts:',process.env.ROOM_TEST_RESULTS);
}).catch(error=>{console.error(error);process.exitCode=1;});
