const assert = require('node:assert/strict');
const fs = require('node:fs');
const launch = require('./browser-test-options.cjs');
(async () => {
  const browser = await launch({ args:['--no-sandbox'] });
  try {
    const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.setViewport({width:800,height:900});await page.setRequestInterception(true);
    page.on('request',r=>['localhost','127.0.0.1'].includes(new URL(r.url()).hostname)?r.continue():r.abort());
    await page.goto(`${process.env.ROOM_TEST_URL||'http://127.0.0.1:5174'}/AGENTS.md`);
    await page.evaluate(async()=>{
      window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;
      const React=(await import('/node_modules/.vite/deps/react.js')).default;
      const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const {Canvas}=await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const THREE=await import('/node_modules/.vite/deps/three.js');await import('/src/dracoSetup.ts');
      const {MaillotInyeong}=await import('/src/features/scene/items/MaillotInyeong.tsx');
      const {INVENTORY}=await import('/src/features/inventory/inventoryData.ts');
      window.item=INVENTORY.find(i=>i.id==='maillot-coreen-inyeong');window.THREE=THREE;
      const h=React.createElement;document.body.innerHTML='<div id="fixture" style="width:800px;height:900px"></div>';
      createRoot(document.querySelector('#fixture')).render(h(Canvas,{camera:{position:[15,-25,130],fov:40},onCreated:({scene,camera})=>{window.scene=scene;camera.lookAt(0,-30,0);}},
        h('color',{attach:'background',args:['#62666c']}),h('ambientLight',{intensity:2}),h('directionalLight',{position:[30,70,80],intensity:3}),
        h(React.Suspense,{fallback:null},h('group',{name:'jersey'},h(MaillotInyeong)))));
    });
    await page.waitForFunction(()=>{let ready=false;window.scene?.getObjectByName('jersey')?.traverse(o=>{if(o.isMesh)ready=true;});return ready;},{timeout:60000});
    const result=await page.evaluate(()=>{
      const o=window.scene.getObjectByName('jersey');o.updateWorldMatrix(true,true);
      const box=new window.THREE.Box3().setFromObject(o);let meshes=0;o.traverse(m=>{if(m.isMesh)meshes++;});
      return {size:box.getSize(new window.THREE.Vector3()).toArray(),top:box.max.y,meshes,item:window.item};
    });
    assert(result.item.glbPath.endsWith('Korea2022Inyeong.glb'));
    for(const p of [result.item.glbPath,...result.item.photos])assert(fs.existsSync(`public/${p}`),p);
    const {w,h,d}=result.item.dims;[w,h,d].forEach((v,i)=>assert(Math.abs(result.size[i]-v)<.05,'inventory dimensions'));
    assert(Math.abs(result.top)<.01,'hook crown is the scene attachment origin');assert.deepEqual(errors,[]);
    await page.screenshot({path:'/tmp/korea-2022-browser.png'});console.log('PASS',JSON.stringify(result));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
