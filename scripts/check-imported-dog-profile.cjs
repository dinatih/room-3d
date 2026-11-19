const assert = require('node:assert/strict');
const launch = require('./browser-test-options.cjs');
(async () => {
 const browser = await launch({args:['--no-sandbox']});
 try {
  const page = await browser.newPage(), errors=[];
  page.on('pageerror', e=>{errors.push(e.message);console.error(e.stack);});
  await page.setRequestInterception(true);
  page.on('request', r=>{const url=new URL(r.url());const file=url.pathname.split('/').pop();if(['localhost','127.0.0.1'].includes(url.hostname)||['data:','blob:'].includes(url.protocol))return r.continue();if(['draco_wasm_wrapper.js','draco_decoder.wasm','draco_decoder.js'].includes(file))return r.continue({url:(process.env.ROOM_TEST_URL||'http://127.0.0.1:5197')+'/draco/'+file});return r.abort();});
  await page.goto((process.env.ROOM_TEST_URL||'http://127.0.0.1:5197')+'/AGENTS.md');
  await page.evaluate(async()=>{
   (await import('/@react-refresh')).default.injectIntoGlobalHook(window);
   window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;
   const React=(await import('/node_modules/.vite/deps/react.js')).default;
   const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
   const {Canvas,useFrame}=await import('/node_modules/.vite/deps/@react-three_fiber.js');
   const {ImportedDog}=await import('/src/features/scene/items/ImportedDog.tsx');
   const {getAgentProfile}=await import('/src/features/scene/ai/navigation/obstacles.ts');
   const {cameraState}=await import('/src/features/scene/cameraState.ts');
   const metadata=await(await fetch('/node_modules/.vite/deps/_metadata.json')).json();
   (await import('/node_modules/.vite/deps/@react-three_drei.js?v='+metadata.browserHash)).useGLTF.setDecoderPath('/draco/');
   const e=React.createElement,container=document.createElement('div');container.style.cssText='width:400px;height:300px';document.body.replaceChildren(container);
   function Probe(){useFrame(()=>{if(window.reported)window.result={without:getAgentProfile('profile-without-callback'),with:getAgentProfile('profile-with-callback'),reported:window.reported};});return null;}
   const props={path:'/characters/bloodhund-from-cotw-game-ears-has-animglitch/dog.glb',height:65,clip:'idle drop',walkClip:'walk fwd',runClip:'run fwd',heading:-Math.PI/2};
   createRoot(container).render(e(Canvas,{},e(React.Suspense,{fallback:null},e('group',{position:[230,0,-200]},e(ImportedDog,{...props,agentId:'profile-without-callback'})),e('group',{position:[50,0,-200]},e(ImportedDog,{...props,agentId:'profile-with-callback',onSize:size=>{window.reported=size.toArray();}})),e(Probe))));
  });
  await page.waitForFunction(()=>window.result?.reported,{timeout:60000});
  const result=await page.evaluate(()=>window.result);
  assert.equal(result.without.height,result.with.height);
  // Independently evaluated Float32 skinned bounds agree to 0.01 mm.
  assert(Math.abs(result.without.radius-result.with.radius)<0.001);
  assert(Math.abs(result.with.radius-Math.min(result.reported[0],result.reported[2])/2)<1e-5);
  assert(Math.abs(result.reported[1]-65)<1e-6);
  assert.deepEqual(errors,[]);
  console.log('PASS Bloodhound navigation profile uses displayed dimensions with and without onSize:',result);
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
