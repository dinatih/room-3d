const launchBrowser = require('./browser-test-options.cjs');
const puppeteer = require('puppeteer');
const assert = require('node:assert/strict');
(async () => {
 const browser = await launchBrowser({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--disable-background-timer-throttling']});
 const errors=[];
 try {
 const page=await browser.newPage();await page.setViewport({width:1200,height:900});
 page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
 await page.goto((process.env.ROOM_TEST_URL || 'http://127.0.0.1:5175')+'/AGENTS.md');
 await page.evaluate(async()=>{
 window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
 const THREE=await import('/node_modules/.vite/deps/three.js');
 const {default:React}=await import('/node_modules/.vite/deps/react.js');
 const {default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js'); const {createRoot}=ReactDOM;const {default:DOM}=await import('/node_modules/.vite/deps/react-dom.js');const flushSync=DOM.flushSync;
 const {Canvas,useThree}=await import('/node_modules/.vite/deps/@react-three_fiber.js');
 const {useGLTF}=await import('/node_modules/.vite/deps/@react-three_drei.js');useGLTF.setDecoderPath('/draco/');
 const {Freezer}=await import('/src/features/scene/items/Freezer.tsx');
 const {useSceneStore}=await import('/src/features/scene/store/useSceneStore.ts');
 const f=window.fixture={THREE,store:useSceneStore,flushSync,time:0};
 document.body.innerHTML='';document.body.style.margin='0';
 const container=document.createElement('div');container.style.cssText='width:1200px;height:900px';document.body.append(container);
 const h=React.createElement;
 function Capture(){const state=useThree();React.useLayoutEffect(()=>{Object.assign(f,state);},[state]);return null;}
 function App(){const [props,setProps]=React.useState({isPreview:false,actionState:{}});f.setProps=setProps;
 return h(Canvas,{frameloop:'never',shadows:true,camera:{position:[125,80,-95],near:.1,far:1500,fov:45}},
 h(Capture),h('ambientLight',{intensity:.85}),h('directionalLight',{position:[100,120,-80],intensity:2}),
 h(React.Suspense,{fallback:null},h(Freezer,{item:{},onSize:s=>f.dimensions=s.toArray(),...props})),
 h('mesh',{rotation:[-Math.PI/2,0,0],position:[0,-.1,0]},h('planeGeometry',{args:[400,400]}),h('meshStandardMaterial',{color:'#777777'})) );}
 createRoot(container).render(h(App));
 f.tick=(seconds)=>{const render=f.gl.render;f.gl.render=()=>{};try{for(let t=0;t<seconds;t+=1/60){f.time+=1/60;f.advance(f.time,true);}}finally{f.gl.render=render;}f.scene.updateMatrixWorld(true);f.gl.render(f.scene,f.camera);};
 f.read=()=>{const door=f.scene.getObjectByName('door');
 return {door:door.quaternion.toArray(),pivot:door.position.toArray(),time:f.scene.getObjectByName('body').matrixWorld.toArray(),size:f.dimensions};};
 });
 await page.waitForFunction(()=>window.fixture.scene?.getObjectByName('motor_casing'),{timeout:60000});
 await page.evaluate(()=>{const f=window.fixture;f.camera.lookAt(0,25,0);f.tick(.01);});

 const closed=await page.evaluate(()=>window.fixture.read());console.log('closed',closed);
 await page.screenshot({path:'/tmp/freezer-closed.png'});
 const toggle=async(value)=>{await page.evaluate(v=>window.fixture.flushSync(()=>window.fixture.store.getState().triggerAction('freezer',v)),value);await new Promise(r=>setTimeout(r,80));};
 const tick=async(t)=>page.evaluate(t=>window.fixture.tick(t),t);
 await toggle(true);await tick(.5);const halfway=await page.evaluate(()=>window.fixture.read());
 console.log('Half-open door:',halfway.door);assert(Math.abs(halfway.door[1])>.3);await toggle(false);await tick(.1);
 const reversed=await page.evaluate(()=>window.fixture.read());assert(Math.abs(reversed.door[1])<Math.abs(halfway.door[1]));
 await toggle(true);await tick(1.1);const opened=await page.evaluate(()=>window.fixture.read());
 assert(Math.abs(opened.door[1])>.8);assert.deepEqual(opened.time,closed.time);assert.deepEqual(opened.pivot,closed.pivot);
 await page.screenshot({path:'/tmp/freezer-open.png'});
 await toggle(false);await tick(1.1);assert.deepEqual((await page.evaluate(()=>window.fixture.read())).door,closed.door);
 // Independent preview state and another instance's immutable shared materials.
 await page.evaluate(()=>window.fixture.setProps({isPreview:true,actionState:{'freezer':true}}));
 await new Promise(r=>setTimeout(r,80));await tick(1.1);assert(Math.abs((await page.evaluate(()=>window.fixture.read())).door[1])>.8);
 assert.equal(await page.evaluate(()=>window.fixture.store.getState().furniture.freezerOpen),false);
 await toggle(true);await page.evaluate(()=>window.fixture.setProps({isPreview:true,actionState:{'freezer':false}}));
 await new Promise(r=>setTimeout(r,80));await tick(1.1);assert.deepEqual((await page.evaluate(()=>window.fixture.read())).door,closed.door);

 const sequence = await page.evaluate(async () => {
   const {buildSmartObjectInstructionSequence} = await import('/src/features/scene/ai/smartObjectRegistry.ts');
   return buildSmartObjectInstructionSequence('freezer', 'open-pick');
 });
 assert.deepEqual(sequence.map(s=>s.type), ['MOVE_TO','WAIT','WAIT','USE_OBJECT','WAIT','WAIT','MOVE_TO']);
 assert.equal(sequence[3].animation,'kneeling-inspecting');
 assert.equal(sequence[2].triggerEventValue,true);
 assert.equal(sequence[5].triggerEventValue,false);
 assert(sequence.slice(2).every(s=>s.closedDoor==='living'));
 const clips=await page.evaluate(async()=>{
   const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
   const {DRACOLoader}=await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
   const loader=new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));
   const door=await loader.loadAsync('/items/tillreda_anim/TILLREDA_anim.glb');
   const kneel=await loader.loadAsync('/animations/mixamo/anim_kneeling_inspecting.glb');
   const rise=await loader.loadAsync('/animations/mixamo/anim_crouch_to_stand.glb');
   const f=window.fixture, THREE=f.THREE;
   const actor=kneel.scene;actor.scale.setScalar(100);actor.position.x=85;actor.rotation.y=-Math.PI/2;
   f.scene.add(actor);
   const mixer=new THREE.AnimationMixer(actor);mixer.clipAction(kneel.animations[0]).play();mixer.update(2);
   actor.updateMatrixWorld(true);
   const bones=[];actor.traverse(o=>{if(o.isBone)bones.push({name:o.name,pos:o.getWorldPosition(new THREE.Vector3()).toArray()});});
   const helper=new THREE.SkeletonHelper(actor);f.scene.add(helper);
   f.camera.position.set(180,100,-180);f.camera.lookAt(30,45,0);f.gl.render(f.scene,f.camera);
   return {door:door.animations.find(c=>c.name==='door_open').duration,kneel:kneel.animations[0].duration,rise:rise.animations[0].duration,
     bones:bones.filter(b=>/Hips$|Head$|Leg$|Foot$|Hand$/.test(b.name))};
 });
 console.log('Source clips and kneeling pose:',JSON.stringify(clips));
 assert.equal(sequence[2].duration,clips.door);
 assert.equal(sequence[5].duration,clips.door);
 assert(Math.abs(sequence[4].duration-clips.rise)<0.1);
 await page.evaluate(()=>window.fixture.setProps({isPreview:false,actionState:{}}));
 await new Promise(r=>setTimeout(r,80));
 for(const initiallyOpen of [false,true,false]){
   await toggle(initiallyOpen);await tick(clips.door);
   for(const step of [sequence[2],sequence[5]]){
     await page.evaluate(s=>window.fixture.store.getState().triggerAction(s.triggerEventKey,s.triggerEventValue),step);
     await new Promise(r=>setTimeout(r,80));await tick(step.duration);
     const current=await page.evaluate(()=>window.fixture.read());
     if(step.triggerEventValue){assert(Math.abs(current.door[1])>.8);}
     else assert.deepEqual(current.door,closed.door);
   }
 }
 await toggle(true);await tick(clips.door);
 await page.screenshot({path:'/tmp/freezer-kneeling-inspecting.png'});
 // Run the real controller through the interaction, including its rise step.
 const controller=await page.evaluate(async(sequence)=>{
   const {default:React}=await import('/node_modules/.vite/deps/react.js');
   const {default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js');
   const {useAgentController}=await import('/src/features/scene/ai/useAgentController.ts');
   const {setAgentProfile}=await import('/src/features/scene/ai/navigation/obstacles.ts');
   const f=window.fixture, results=[];
   for(const [index,initiallyOpen] of [false,true,false].entries()){
     f.store.getState().triggerAction('freezer',initiallyOpen);
     const id='freezer-check-'+index;
     setAgentProfile(id,{radius:15,height:170});
     const container=document.createElement('div');document.body.append(container);
     const root=ReactDOM.createRoot(container);
     let agent,complete=false;
     const routine=structuredClone(sequence.slice(2,-1));
     function Probe(){agent=useAgentController(id,routine,false,
       ()=>({x:210,y:0,z:320,rotY:Math.PI/2}),()=>{complete=true;});return null;}
     f.flushSync(()=>root.render(React.createElement(Probe)));
     if(!agent)throw new Error('Agent hook failed to mount');
     const animations=new Set();
     for(let time=0;time<20&&!complete;time+=0.1){
       let state;f.flushSync(()=>{state=agent.update(0.1);});animations.add(state.animation);
       // Yield to both the R3F reconciler and asynchronous navigation jobs.
       await new Promise(r=>setTimeout(r,0));
       f.tick(0.1);
       if(state.animation==='kneeling-inspecting'&&!f.store.getState().furniture.freezerOpen)
         throw new Error('Controller inspected with a closed freezer');
     }
     results.push({complete,status:agent.getStatus(),animations:[...animations],open:f.store.getState().furniture.freezerOpen,door:f.read().door});
     root.unmount();container.remove();
   }
   return results;
 },sequence);
 console.log('Controller results:',controller);
 for(const result of controller){
   assert(result.complete,'controller must finish');
   assert(result.animations.some(a=>a.includes('kneeling_inspecting')||a==='kneeling-inspecting'));
   assert(result.animations.some(a=>a.includes('crouch_to_stand')||a==='crouch-to-stand'));
   assert.equal(result.open,false);assert.deepEqual(result.door,closed.door);
 }
 console.log('Real controller interaction, rise and close, repeated three times: PASS');
 console.log('SmartObject explicit door states, source durations, repeated uses and preview: PASS');
 // Every retained source triangle exists unchanged in the rebuilt closed GLB.
 const geometry=await page.evaluate(async()=>{
 const {THREE}=window.fixture;
 const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
 const {DRACOLoader}=await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
 const loader=new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));
 const source=await loader.loadAsync('/items/tillreda réfrigérateur indépendant-blanc 43 l/TILLREDA Réfrigérateur indépendant-blanc 43 l.glb');
 const result=await loader.loadAsync('/items/tillreda_anim/TILLREDA_anim.glb');
 const triangles=root=>{const counts=new Map();root.updateMatrixWorld(true);root.traverse(o=>{if(!o.isMesh)return;
 const p=o.geometry.attributes.position,index=o.geometry.index;
 for(let i=0;i<index.count;i+=3){const vertices=[];for(let j=0;j<3;j++){const idx=index.getX(i+j),v=new THREE.Vector3().fromBufferAttribute(p,idx).applyMatrix4(o.matrixWorld);
 vertices.push(v.toArray().map(x=>String(Math.round(x*1e5)/1e5)).join(','));}
 const key=vertices.sort().join('/');counts.set(key,(counts.get(key)||0)+1);}});return counts;};
 const original=triangles(source.scene);
 const retained=new THREE.Group();for(const name of ['body','door_surface','door_gasket','interior_floor']){
 const obj=result.scene.getObjectByName(name);obj.updateWorldMatrix(true,false);const copy=obj.clone();copy.matrix.copy(obj.matrixWorld);copy.matrixAutoUpdate=false;retained.add(copy);}
 const rebuilt=triangles(retained);let removed=0,added=0;
 for(const[k,v]of original)removed+=Math.max(0,v-(rebuilt.get(k)||0));
 for(const[k,v]of rebuilt)added+=Math.max(0,v-(original.get(k)||0));
 const box=o=>new THREE.Box3().setFromObject(o,true);
 const casing=box(result.scene.getObjectByName('motor_casing')),shelf=box(result.scene.getObjectByName('shelf'));
 const pivot=result.scene.getObjectByName('door');
 return {removed,added,pivot:pivot.position.toArray(),doorParent:result.scene.getObjectByName('door_surface').parent.name,innerParent:result.scene.getObjectByName('interior_door').parent.name,
 casingTop:casing.max.y,shelfBottom:shelf.min.y,sourceTriangles:[...original.values()].reduce((a,b)=>a+b,0),retainedTriangles:[...rebuilt.values()].reduce((a,b)=>a+b,0)};
 });console.log('geometry',geometry);assert.equal(geometry.removed,84);assert.equal(geometry.added,0);assert.equal(geometry.sourceTriangles,4591);
 assert.equal(geometry.retainedTriangles,4507);assert.equal(geometry.doorParent,'door');assert.equal(geometry.innerParent,'door');assert(geometry.shelfBottom>geometry.casingTop);
 assert.deepEqual(errors,[]);console.log('Freezer geometry, hinge, animation reversal and preview isolation: PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
