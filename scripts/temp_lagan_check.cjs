const puppeteer = require('puppeteer');
const assert = require('node:assert/strict');
(async () => {
 const browser = await puppeteer.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const errors=[];
 try {
 const page=await browser.newPage();await page.setViewport({width:1200,height:900});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.ROOM_TEST_URL || 'http://127.0.0.1:5175')+'/AGENTS.md');
 await page.evaluate(async()=>{
 window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
 const THREE=await import('/node_modules/.vite/deps/three.js');
 const {default:React}=await import('/node_modules/.vite/deps/react.js');
 const {default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js'); const {createRoot}=ReactDOM;
 const {Canvas,useThree}=await import('/node_modules/.vite/deps/@react-three_fiber.js');
 const {useGLTF}=await import('/node_modules/.vite/deps/@react-three_drei.js');useGLTF.setDecoderPath('/draco/');
 const {Fridge}=await import('/src/features/scene/items/Fridge.tsx');
 const {useSceneStore}=await import('/src/features/scene/store/useSceneStore.ts');
 const f=window.fixture={THREE,store:useSceneStore,time:0};
 document.body.innerHTML='';document.body.style.margin='0';
 const container=document.createElement('div');container.style.cssText='width:1200px;height:900px';document.body.append(container);
 const h=React.createElement;
 function Capture(){const state=useThree();React.useLayoutEffect(()=>{Object.assign(f,state);},[state]);return null;}
 function App(){const [props,setProps]=React.useState({isPreview:false,actionState:{}});f.setProps=setProps;
 return h(Canvas,{frameloop:'never',shadows:true,camera:{position:[110,95,-145],near:.1,far:1500,fov:45}},
 h(Capture),h('ambientLight',{intensity:.35}),h('directionalLight',{position:[80,130,-100],intensity:2}),
 h(React.Suspense,{fallback:null},h(Fridge,{item:{},onSize:s=>f.size=s.toArray(),...props})),
 h('mesh',{rotation:[-Math.PI/2,0,0],position:[0,-.1,0]},h('planeGeometry',{args:[400,400]}),h('meshStandardMaterial',{color:'#777777'})) );}
 createRoot(container).render(h(App));
 f.tick=(seconds)=>{const render=f.gl.render;f.gl.render=()=>{};try{for(let t=0;t<seconds;t+=1/60){f.time+=1/60;f.advance(f.time,true);}}finally{f.gl.render=render;}f.scene.updateMatrixWorld(true);f.gl.render(f.scene,f.camera);};
 f.read=()=>{const door=f.scene.getObjectByName('door'),crisper=f.scene.getObjectByName('crisper'),lamp=f.scene.getObjectByName('FridgeInteriorLight');
 return {door:door.quaternion.toArray(),drawer:crisper.position.toArray(),light:lamp.intensity,bins:[1,2,3].map(i=>f.scene.getObjectByName('door_bin_'+i).parent.name)};};
 });
 await page.waitForFunction(()=>window.fixture.scene?.getObjectByName('FridgeInteriorLight'),{timeout:60000});
 await page.evaluate(()=>{const f=window.fixture;f.camera.lookAt(0,40,0);f.tick(.01);});
 const closed=await page.evaluate(()=>window.fixture.read());console.log('closed',closed);assert.equal(closed.light,0);assert.deepEqual(closed.bins,['door','door','door']);
 await page.screenshot({path:'/tmp/lagan-closed.png'});
 await page.evaluate(()=>window.fixture.store.getState().triggerAction('fridge-crisper-toggle',true));
 await page.waitForFunction(()=>window.fixture.store.getState().furniture.fridge);
 await new Promise(r=>setTimeout(r,80));
 await page.evaluate(()=>window.fixture.tick(.5));
 const halfway=await page.evaluate(()=>window.fixture.read());console.log('halfway',halfway);assert(halfway.light>0);assert.equal(halfway.drawer[2],0);
 await page.evaluate(()=>window.fixture.tick(.55));
 const open=await page.evaluate(()=>window.fixture.read());console.log('open',open);
 await page.evaluate(()=>window.fixture.tick(1.1));
 const out=await page.evaluate(()=>window.fixture.read());console.log('out',out);assert(out.drawer[2]>.18);assert(Math.abs(out.door[1])>.7);
 await page.screenshot({path:'/tmp/lagan-open-drawer.png'});
 await page.evaluate(()=>window.fixture.store.getState().triggerAction('fridge',false));await new Promise(r=>setTimeout(r,80));
 await page.evaluate(()=>window.fixture.tick(.5));
 const retracting=await page.evaluate(()=>window.fixture.read());assert.deepEqual(retracting.door,out.door);assert(retracting.drawer[2]<out.drawer[2]);assert(retracting.light>0);
 await page.evaluate(()=>window.fixture.tick(1.7));const shut=await page.evaluate(()=>window.fixture.read());assert.equal(shut.light,0);assert.deepEqual(shut.drawer,closed.drawer);assert.deepEqual(shut.door,closed.door);
 // Reverse twice while opening: latest request wins, no snap to start/end.
 await page.evaluate(()=>window.fixture.store.getState().triggerAction('fridge',true));await new Promise(r=>setTimeout(r,80));await page.evaluate(()=>window.fixture.tick(.3));
 const beforeReverse=await page.evaluate(()=>window.fixture.read());
 await page.evaluate(()=>window.fixture.store.getState().triggerAction('fridge',false));await new Promise(r=>setTimeout(r,80));await page.evaluate(()=>window.fixture.tick(.1));
 const afterReverse=await page.evaluate(()=>window.fixture.read());assert(Math.abs(afterReverse.door[1])<Math.abs(beforeReverse.door[1]));
 await page.evaluate(()=>window.fixture.store.getState().triggerAction('fridge-crisper-toggle',true));await new Promise(r=>setTimeout(r,80));await page.evaluate(()=>window.fixture.tick(2.2));assert((await page.evaluate(()=>window.fixture.read())).drawer[2]>.18);
 // Preview remains independent of main-scene state.
 await page.evaluate(()=>window.fixture.setProps({isPreview:true,actionState:{'fridge-toggle':false,'fridge-crisper-toggle':false}}));await new Promise(r=>setTimeout(r,80));await page.evaluate(()=>window.fixture.tick(2.2));assert.equal((await page.evaluate(()=>window.fixture.read())).light,0);
 await page.evaluate(()=>window.fixture.setProps({isPreview:true,actionState:{'fridge-toggle':true,'fridge-crisper-toggle':true}}));await new Promise(r=>setTimeout(r,80));await page.evaluate(()=>window.fixture.tick(2.2));assert((await page.evaluate(()=>window.fixture.read())).drawer[2]>.18);
 // Validate the exported hierarchy, exact triangle preservation and clearance.
 const geometry=await page.evaluate(async()=>{
 const f=window.fixture,{THREE}=f;
 const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
 const {DRACOLoader}=await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
 const loader=new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));
 const source=await loader.loadAsync('/items/lagan réfrigérateur av comp congélateur indépendant-blanc 97-16 l/LAGAN Réfrigérateur av comp congélateur indépendant-blanc 97-16 l.glb');
 const result=await loader.loadAsync('/items/lagan_anim/LAGAN_anim.glb');
 const triangles=root=>{const counts=new Map();root.updateMatrixWorld(true);root.traverse(o=>{if(!o.isMesh)return;
 const p=o.geometry.attributes.position,index=o.geometry.index;for(let i=0;i<index.count;i+=3){const keys=[];for(let j=0;j<3;j++){const v=new THREE.Vector3().fromBufferAttribute(p,index.getX(i+j)).applyMatrix4(o.matrixWorld);keys.push(v.toArray().map(x=>String(Math.round(x*1e5)/1e5)).join(','));}const key=keys.sort().join('/');counts.set(key,(counts.get(key)||0)+1);}});return counts;};
 const original=triangles(source.scene),rebuilt=triangles(result.scene);let mismatch=0;for(const [k,v]of original)if(rebuilt.get(k)!==v)mismatch++;
 const mixer=new THREE.AnimationMixer(result.scene);const openAction=mixer.clipAction(result.animations.find(c=>c.name==='door_open'));openAction.setLoop(THREE.LoopOnce,1);openAction.clampWhenFinished=true;openAction.play();mixer.setTime(1);result.scene.updateMatrixWorld(true);
 const crisper=new THREE.Box3().setFromObject(result.scene.getObjectByName('crisper'));let binsMin=Infinity;
 for(let i=1;i<=3;i++) binsMin=Math.min(binsMin,new THREE.Box3().setFromObject(result.scene.getObjectByName('door_bin_'+i),true).min.x);
 return {mismatch,sourceTriangles:[...original.values()].reduce((a,b)=>a+b,0),rebuiltTriangles:[...rebuilt.values()].reduce((a,b)=>a+b,0),binsMin,drawerMax:crisper.max.x,pivot:result.scene.getObjectByName('door').position.toArray()};
 });console.log('geometry',geometry);assert.equal(geometry.sourceTriangles,17020);assert.equal(geometry.rebuiltTriangles,17020);assert.equal(geometry.mismatch,0);assert(geometry.pivot[0]>0);assert(geometry.binsMin>=geometry.drawerMax-1e-6);
 assert.deepEqual(errors,[]);console.log('LAGAN sequences, reversal, preview isolation, source geometry, clearance and light: PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
