const launchBrowser = require('./browser-test-options.cjs');
const puppeteer = require('puppeteer');
const assert = require('node:assert/strict');
if(process.argv.includes('--build-linen')){
 (async()=>{
   const fs=require('node:fs');const {NodeIO}=await import('@gltf-transform/core');const io=new NodeIO();
   fs.mkdirSync('public/animations/drona',{recursive:true});const durations={};
   for(const [name,source,reverse] of [['pull','opening',false],['search','searching_files_high',false],['push','opening',true]]){
     const doc=await io.read(`public/animations/mixamo/anim_${source}.glb`),animation=doc.getRoot().listAnimations()[0];
     const duration=Math.max(...animation.listSamplers().map(s=>s.getInput().getMax([])[0]));durations[name]=duration;
     animation.setName('drona-linen-'+name);
     if(reverse)for(const sampler of animation.listSamplers()){
       const input=sampler.getInput(),output=sampler.getOutput(),times=input.getArray(),values=output.getArray(),size=output.getElementSize();
       if(sampler.getInterpolation()==='STEP'){
         // A reversed step changes just AFTER the mirrored key. Use the next
         // representable float so the source's held poses and endpoints survive.
         const reversedTimes=new Float32Array(times.length+1),reversedValues=new Float32Array((times.length+1)*size);
         const bits=new DataView(new ArrayBuffer(4));let frame=0;
         const write=(time,index)=>{reversedTimes[frame]=time;for(let j=0;j<size;j++)reversedValues[frame*size+j]=values[index*size+j];frame++;};
         write(0,times.length-1);
         for(let i=times.length-1;i>0;i--){
           bits.setFloat32(0,duration-times[i],true);bits.setUint32(0,bits.getUint32(0,true)+1,true);
           write(bits.getFloat32(0,true),i-1);
         }
         write(duration,0);
         sampler.setInput(input.clone().setArray(reversedTimes));sampler.setOutput(output.clone().setArray(reversedValues));
         continue;
       }
       if(sampler.getInterpolation()!=='LINEAR')throw new Error('Unsupported source interpolation: '+sampler.getInterpolation());
       // Some source tracks start after zero. Keep their held endpoint when
       // reversing, so the full clip duration and all poses remain identical.
       const leading=times[times.length-1]<duration?1:0,trailing=times[0]>0?1:0;
       const count=times.length+leading+trailing;
       const reversedTimes=new Float32Array(count),reversedValues=new Float32Array(count*size);
       for(let i=0;i<times.length;i++){
         reversedTimes[i+leading]=duration-times[times.length-1-i];
         for(let j=0;j<size;j++)reversedValues[(i+leading)*size+j]=values[(times.length-1-i)*size+j];
       }
       if(leading)for(let j=0;j<size;j++)reversedValues[j]=values[(times.length-1)*size+j];
       if(trailing){reversedTimes[count-1]=duration;for(let j=0;j<size;j++)reversedValues[(count-1)*size+j]=values[j];}
       sampler.setInput(input.clone().setArray(reversedTimes));sampler.setOutput(output.clone().setArray(reversedValues));
     }
     await io.write(`public/animations/drona/linen_${name}.glb`,doc);
   }
   console.log(JSON.stringify(durations));
 })().catch(e=>{console.error(e);process.exitCode=1;});
}
if(process.argv.includes('--inspect-drona')){
 (async()=>{
   const THREE=require('three'),fs=require('node:fs');
   const {GLTFLoader}=await import('three/examples/jsm/loaders/GLTFLoader.js');
   for(const id of ['looking_through_files_low','searching_files_high','opening','pick_fruit']){
     const bytes=fs.readFileSync(`public/animations/mixamo/anim_${id}.glb`);
     const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
     const clip=gltf.animations[0],mixer=new THREE.AnimationMixer(gltf.scene);
     mixer.clipAction(clip).play();const samples=[];
     for(const fraction of [0,.25,.5,.75]){
       mixer.setTime(clip.duration*fraction);gltf.scene.updateMatrixWorld(true);
       samples.push({fraction,hands:['mixamorigLeftHand','mixamorigRightHand'].map(name=>gltf.scene.getObjectByName(name).getWorldPosition(new THREE.Vector3()).multiplyScalar(100).toArray().map(v=>Math.round(v)))});
     }
     console.log(JSON.stringify({id,duration:clip.duration,samples}));
   }
 })().catch(e=>{console.error(e);process.exitCode=1;});
}
if(process.argv.includes('--inspect-fridge')){
 const bytes=require('node:fs').readFileSync('public/items/lagan_anim/LAGAN_anim.glb');
 const glb=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
 console.log(JSON.stringify(Object.fromEntries(glb.animations.map(a=>[a.name,Math.max(...a.samplers.map(s=>glb.accessors[s.input].max[0]))]))));
 process.exit(0);
}
if(!process.argv.includes('--inspect-drona')&&!process.argv.includes('--build-linen'))(async () => {
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
 const {Fridge}=await import('/src/features/scene/items/Fridge.tsx');
 const {KallaxNE}=await import('/src/features/scene/items/KallaxNE.tsx');
 const {KallaxSE}=await import('/src/features/scene/items/KallaxSE.tsx');
 const {Smorkull}=await import('/src/features/scene/items/Smorkull.tsx');
 const {getObjectTransform}=await import('/src/features/scene/objectTransforms.ts');
 const chairTransform=getObjectTransform('chair-office');
 const {useSceneStore}=await import('/src/features/scene/store/useSceneStore.ts');
 const f=window.fixture={THREE,store:useSceneStore,flushSync,time:0};
 document.body.innerHTML='';document.body.style.margin='0';
 const container=document.createElement('div');container.style.cssText='width:1200px;height:900px';document.body.append(container);
 const h=React.createElement;
 function Capture(){const state=useThree();React.useLayoutEffect(()=>{Object.assign(f,state);},[state]);return null;}
 function App(){const [props,setProps]=React.useState({isPreview:false,actionState:{}});f.setProps=setProps;
 return h(Canvas,{frameloop:'never',shadows:true,camera:{position:[125,80,-95],near:.1,far:1500,fov:45}},
 h(Capture),h('ambientLight',{intensity:.85}),h('directionalLight',{position:[100,120,-80],intensity:2}),
 h(React.Suspense,{fallback:null},h(props.dronaSE?KallaxSE:props.drona?KallaxNE:props.fridge?Fridge:Freezer,{item:{},onSize:s=>f.dimensions=s.toArray(),...props})),
 props.chair&&h(React.Suspense,{fallback:null},h('group',{ref:g=>{f.chair=g;},position:chairTransform.position,rotation:[0,chairTransform.rotationY,0]},h(Smorkull,{item:{},actionState:{},onSize:()=>{f.chairReady=true;}}))),
 h('mesh',{rotation:[-Math.PI/2,0,0],position:[0,-.1,0]},h('planeGeometry',{args:[400,400]}),h('meshStandardMaterial',{color:'#777777'})) );}
 createRoot(container).render(h(App));
 f.tick=(seconds)=>{const render=f.gl.render;f.gl.render=()=>{};try{for(let t=0;t<seconds;t+=1/60){f.time+=1/60;f.advance(f.time,true);}}finally{f.gl.render=render;}f.scene.updateMatrixWorld(true);f.gl.render(f.scene,f.camera);};
 f.read=()=>{const door=f.scene.getObjectByName('door');
 return {door:door.quaternion.toArray(),pivot:door.position.toArray(),time:f.scene.getObjectByName('body').matrixWorld.toArray(),size:f.dimensions};};
 });
 await page.waitForFunction(()=>window.fixture.scene?.getObjectByName('motor_casing'),{timeout:60000});
 await page.evaluate(()=>{const f=window.fixture;f.camera.lookAt(0,25,0);f.tick(.01);});

 const closed=await page.evaluate(()=>window.fixture.read());console.log('closed',closed);
 const readHoverActions=()=>page.evaluate(()=>{
   let actions;window.fixture.scene.traverse(o=>{if(o.userData.hoverAction?.label==='Congélateur CHIQ')actions=o.userData.hoverAction.actions;});
   return actions;
 });
 assert.deepEqual(await readHoverActions(),['freezer','smart-object:::freezer:::open-pick']);
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
 assert.deepEqual(await readHoverActions(),['freezer']);
 await toggle(true);await page.evaluate(()=>window.fixture.setProps({isPreview:true,actionState:{'freezer':false}}));
 await new Promise(r=>setTimeout(r,80));await tick(1.1);assert.deepEqual((await page.evaluate(()=>window.fixture.read())).door,closed.door);

 const sequence = await page.evaluate(async () => {
   const {buildSmartObjectInstructionSequence,SMART_OBJECTS,getSmartObject} = await import('/src/features/scene/ai/smartObjectRegistry.ts');
   const {getObjectTransform} = await import('/src/features/scene/objectTransforms.ts');
   const base=SMART_OBJECTS.freezer, transform=getObjectTransform('freezer'), resolved=getSmartObject('freezer');
   if(base.itemId!=='freezer'||base.position!==undefined||!base.slots[0].relative)
     throw new Error('Freezer must use its item transform and a local interaction slot');
   if(JSON.stringify(resolved.position)!==JSON.stringify(transform.position))throw new Error('Freezer item position mismatch');
   const [x,y,z]=base.slots[0].offset,c=Math.cos(transform.rotationY),s=Math.sin(transform.rotationY);
   const expected=[transform.position[0]+x*c+z*s,transform.position[1]+y,transform.position[2]-x*s+z*c];
   if(resolved.slots[0].offset.some((value,i)=>Math.abs(value-expected[i])>1e-6))throw new Error('Freezer slot must follow the item rotation');
   window.fixture.freezer=resolved;
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
 assert.deepEqual(await readHoverActions(),['freezer','smart-object:::freezer:::open-pick']);
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
   const render=f.gl.render;f.gl.render=()=>{};
   for(const [index,initiallyOpen] of [false,true,false].entries()){
     f.store.getState().triggerAction('freezer',initiallyOpen);
     const id='freezer-check-'+index;
     setAgentProfile(id,{radius:15,height:170});
     const container=document.createElement('div');document.body.append(container);
     const root=ReactDOM.createRoot(container);
     let agent,complete=false;
     const routine=structuredClone(sequence.slice(2,-1));
     const [x,y,z]=f.freezer.slots[0].offset;
     function Probe(){agent=useAgentController(id,routine,false,
       ()=>({x,y,z,rotY:f.freezer.slots[0].rotY}),()=>{complete=true;});return null;}
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
   f.gl.render=render;return results;
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
 await page.evaluate(()=>window.fixture.setProps({fridge:true,isPreview:false,actionState:{}}));
 await page.waitForFunction(()=>{
   let found=false;window.fixture.scene.traverse(o=>{if(o.userData.hoverAction?.label==='Réfrigérateur LAGAN')found=true;});return found;
 },{timeout:60000});
 const fridge=await page.evaluate(async()=>{
   const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
   const {DRACOLoader}=await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
   const {getSmartObject,SMART_OBJECTS,buildSmartObjectInstructionSequence}=await import('/src/features/scene/ai/smartObjectRegistry.ts');
   const {getObjectTransform}=await import('/src/features/scene/objectTransforms.ts');
   const f=window.fixture;
   const glb=await new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/')).loadAsync('/items/lagan_anim/LAGAN_anim.glb');
   let root;f.scene.traverse(o=>{if(o.userData.hoverAction?.label==='Réfrigérateur LAGAN')root=o;});
   const doorClip=glb.animations.find(c=>c.name==='door_open');
   const binding=f.THREE.PropertyBinding.parseTrackName(doorClip.tracks.find(t=>t.name.endsWith('.quaternion')).name);
   f.readFridge=()=>({door:root.getObjectByName(binding.nodeName).quaternion.toArray(),light:root.getObjectByName('FridgeInteriorLight').intensity,actions:root.userData.hoverAction.actions});
   f.fridgeObject=getSmartObject('fridge');
   const base=SMART_OBJECTS.fridge,transform=getObjectTransform('fridge');
   if(base.itemId!=='fridge'||base.position!==undefined||!base.slots[0].relative)throw new Error('Fridge must be linked to its item');
   if(JSON.stringify(transform.position)!==JSON.stringify(f.fridgeObject.position))throw new Error('Fridge item transform mismatch');
   const sequence=buildSmartObjectInstructionSequence('fridge','open-pick');
   return {closed:f.readFridge(),sequence,doorDuration:doorClip.duration,drawerDuration:glb.animations.find(c=>c.name==='crisper_slide').duration};
 });
 assert.deepEqual(fridge.closed.actions,['fridge','fridge-crisper-toggle','smart-object:::fridge:::open-pick']);
 assert.equal(fridge.sequence[1].duration,fridge.drawerDuration);
 assert.equal(fridge.sequence[2].duration,fridge.doorDuration);
 assert.equal(fridge.sequence[5].duration,fridge.doorDuration);
 await page.evaluate(()=>window.fixture.setProps({fridge:true,isPreview:true,actionState:{fridge:true}}));
 await new Promise(r=>setTimeout(r,80));await tick(fridge.doorDuration);
 const preview=await page.evaluate(()=>window.fixture.readFridge());
 assert.deepEqual(preview.actions,['fridge','fridge-crisper-toggle']);
 assert.notDeepEqual(preview.door,fridge.closed.door);
 assert.equal(await page.evaluate(()=>window.fixture.store.getState().furniture.fridge),false);
 await page.evaluate(()=>window.fixture.setProps({fridge:true,isPreview:false,actionState:{}}));
 await new Promise(r=>setTimeout(r,80));await tick(fridge.doorDuration);
 await page.evaluate(()=>window.fixture.setProps({fridge:true,chair:true,isPreview:false,actionState:{}}));
 await page.waitForFunction(()=>window.fixture.chairReady,{timeout:60000});
 const fridgeRuns=await page.evaluate(async(sequence)=>{
   const {default:React}=await import('/node_modules/.vite/deps/react.js');
   const {default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js');
   const {useAgentController}=await import('/src/features/scene/ai/useAgentController.ts');
   const {setAgentProfile,registerObstacle}=await import('/src/features/scene/ai/navigation/obstacles.ts');
   const {resolveInstructionCoords}=await import('/src/features/scene/ai/agent/agentInstructionCoords.ts');
   const {SMART_OBJECTS}=await import('/src/features/scene/ai/smartObjectRegistry.ts');
   const {pointInRing,inflate}=await import('/src/features/scene/ai/navigation/geometry.ts');
   const f=window.fixture,results=[];
   const render=f.gl.render;f.gl.render=()=>{};
   f.chair.updateWorldMatrix(true,true);
   const box=new f.THREE.Box3().setFromObject(f.chair);
   const polygon=[{x:box.min.x,z:box.min.z},{x:box.max.x,z:box.min.z},{x:box.max.x,z:box.max.z},{x:box.min.x,z:box.max.z}];
   registerObstacle({id:'fridge-chair-test',owner:'chair-office',polygon,yMin:box.min.y,yMax:box.max.y});
   const [gx,,gz]=f.fridgeObject.slots[0].offset;
   if(!pointInRing({x:gx,z:gz},inflate(polygon,15)))throw new Error('The actual chair must obstruct the nominal fridge slot in this regression');
   for(const [index,initial] of [[false,false],[true,false],[true,true],[false,false]].entries()){
     f.store.getState().triggerAction('fridge',initial[0]);
     f.store.getState().triggerAction('fridge-crisper-toggle',initial[1]);
     await new Promise(r=>setTimeout(r,0));f.tick(2);
     const id='fridge-check-'+index;setAgentProfile(id,{radius:15,height:170});
     const move=resolveInstructionCoords(sequence[0],null,id);
     const use=resolveInstructionCoords(sequence[3],null,id,{x:move.tx,z:move.tz});
     if(Math.hypot(move.tx-use.tx,move.tz-use.tz)>1e-6)throw new Error('Arrival and inspection must use the same reachable point');
     if(pointInRing({x:use.tx,z:use.tz},inflate(polygon,15)))throw new Error('Inspection must stay clear of the chair');
     if(index===0){
       const slot=SMART_OBJECTS.fridge.slots[0],arrival=slot.arrival;
       try{
         delete slot.arrival;
         const old=resolveInstructionCoords(sequence[3],null,id,{x:move.tx,z:move.tz});
         if(!pointInRing({x:old.tx,z:old.tz},inflate(polygon,15)))throw new Error('The previous exact target must reproduce the chair collision');
       }finally{slot.arrival=arrival;}
     }
     const container=document.createElement('div');document.body.append(container);
     const root=ReactDOM.createRoot(container),routine=structuredClone(sequence);
     const [x,y,z]=f.fridgeObject.slots[0].offset;
     let agent,complete=false;
     function Probe(){agent=useAgentController(id,routine,false,()=>({x,y,z,rotY:0}),()=>{complete=true;});return null;}
     f.flushSync(()=>root.render(React.createElement(Probe)));
     const animations=new Set();
     for(let time=0;time<20&&!complete;time+=0.1){
       const state=agent.update(0.1);animations.add(state.animation);
       await new Promise(r=>setTimeout(r,0));f.tick(0.1);
       if(state.animation==='kneeling-inspecting'&&(!f.store.getState().furniture.fridge||f.store.getState().extraStates['fridge-crisper-toggle']))
         throw new Error('Fridge inspection requires an open door and retracted drawer');
       if(index===3&&state.animation==='kneeling-inspecting')break;
     }
     root.unmount();container.remove();
     await new Promise(r=>setTimeout(r,0));f.tick(2);
     results.push({complete,interrupted:index===3,animations:[...animations],open:f.store.getState().furniture.fridge,drawer:f.store.getState().extraStates['fridge-crisper-toggle'],...f.readFridge()});
   }
   f.gl.render=render;return results;
 },fridge.sequence);
 for(const result of fridgeRuns){
   assert(result.complete||result.interrupted,'fridge controller must finish');
   assert(result.animations.includes('kneeling-inspecting'));
   if(!result.interrupted)assert(result.animations.includes('crouch-to-stand'));
   assert.equal(result.open,false);assert.equal(result.drawer,false);
   assert.deepEqual(result.door,fridge.closed.door);assert.equal(result.light,0);
 }
 assert.deepEqual(errors,[]);
 console.log('Fridge itemId, hover action, preview, actual chair collision, inspection and interruption cleanup: PASS');
 await page.evaluate(()=>window.fixture.setProps({drona:true,isPreview:false,actionState:{}}));
 await page.waitForFunction(()=>window.fixture.scene.getObjectByName('drona-ne-catchall')?.children.length,{timeout:60000});
 const drona=await page.evaluate(async()=>{
   const f=window.fixture,node=f.scene.getObjectByName('drona-ne-catchall');
   const mesh=node.getObjectByProperty('isMesh',true);mesh.geometry.computeBoundingBox();
   f.readDrona=()=>({z:node.position.z,parent:node.parent.name,position:node.parent.position.toArray(),actions:node.userData.hoverAction.actions,
     cells:Array.from({length:7},(_,i)=>{const cell=f.scene.getObjectByName('drona-ne-cell-'+i);return [cell.position.toArray(),cell.children[0].position.toArray()];})});
   const {buildSmartObjectInstructionSequence,getSmartObject}=await import('/src/features/scene/ai/smartObjectRegistry.ts');
   const {getObjectTransform}=await import('/src/features/scene/objectTransforms.ts');
   const {DRONA_CATCHALL_POSITION,DRONA_CATCHALL_SLIDE_DURATION,KALLAX_NE_POSITION,KALLAX_NE_ROTATION}=await import('/src/features/scene/items/kallaxNeDrona.ts');
   f.dronaObject=getSmartObject('drona-ne-catchall');
   const transform=getObjectTransform('drona-ne-catchall');
   if(JSON.stringify(transform.position)!==JSON.stringify(f.dronaObject.position))throw new Error('Drona must follow its itemId');
   const {registerObstacle}=await import('/src/features/scene/ai/navigation/obstacles.ts');
   const matrix=new f.THREE.Matrix4().makeRotationY(KALLAX_NE_ROTATION).setPosition(...KALLAX_NE_POSITION);
   const box=new f.THREE.Box3().setFromObject(node.parent.parent).applyMatrix4(matrix);
   registerObstacle({id:'kallax-ne-test',owner:'kallax-ne',yMin:box.min.y,yMax:box.max.y,
     polygon:[{x:box.min.x,z:box.min.z},{x:box.max.x,z:box.min.z},{x:box.max.x,z:box.max.z},{x:box.min.x,z:box.max.z}]});
   return {closed:f.readDrona(),position:DRONA_CATCHALL_POSITION,duration:DRONA_CATCHALL_SLIDE_DURATION,
     depth:mesh.geometry.boundingBox.max.z-mesh.geometry.boundingBox.min.z,sequence:buildSmartObjectInstructionSequence('drona-ne-catchall','pick-item')};
 });
 assert.equal(drona.closed.parent,'drona-ne-cell-2');
 assert.deepEqual(drona.closed.position,drona.position);
 assert.deepEqual(drona.closed.actions,['drona-ne-catchall-slide','smart-object:::drona-ne-catchall:::pick-item']);
 const slide=async(value)=>{await page.evaluate(v=>window.fixture.store.getState().triggerAction('drona-ne-catchall-slide',v),value);await new Promise(r=>setTimeout(r,80));};
 await slide(true);await tick(drona.duration/2);
 const halfDrona=await page.evaluate(()=>window.fixture.readDrona());
 assert(Math.abs(halfDrona.z+drona.depth/3)<drona.depth/100);
 await tick(drona.duration/2);
 const openDrona=await page.evaluate(()=>window.fixture.readDrona());
 assert(Math.abs(openDrona.z+drona.depth*2/3)<1e-6);
 for(const i of [0,1,3,4,5,6])assert.deepEqual(openDrona.cells[i],drona.closed.cells[i]);
 await page.evaluate(async()=>{
   const f=window.fixture,{GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
   const actor=await new GLTFLoader().loadAsync('/animations/mixamo/anim_searching_files_high.glb');
   actor.scene.scale.setScalar(100);actor.scene.position.set(-17.5,0,-80);f.scene.add(actor.scene);
   const mixer=new f.THREE.AnimationMixer(actor.scene);mixer.clipAction(actor.animations[0]).play();mixer.update(4.8);
   f.scene.add(new f.THREE.SkeletonHelper(actor.scene));
   f.camera.position.set(-150,160,-190);f.camera.lookAt(0,90,0);f.tick(0.01);
 });
 await page.screenshot({path:'/tmp/drona-ne-catchall-open.png'});
 await slide(false);await tick(drona.duration);
 assert.equal((await page.evaluate(()=>window.fixture.readDrona())).z,0);
 await page.evaluate(()=>window.fixture.setProps({drona:true,isPreview:true,actionState:{'drona-ne-catchall-slide':true}}));
 await new Promise(r=>setTimeout(r,80));await tick(drona.duration);
 assert.deepEqual((await page.evaluate(()=>window.fixture.readDrona())).actions,['drona-ne-catchall-slide']);
 assert.equal(await page.evaluate(()=>window.fixture.store.getState().extraStates['drona-ne-catchall-slide']),false);
 await page.evaluate(()=>window.fixture.setProps({drona:true,isPreview:false,actionState:{}}));
 await new Promise(r=>setTimeout(r,80));await tick(drona.duration);
 const dronaRuns=await page.evaluate(async(data)=>{
   const {default:React}=await import('/node_modules/.vite/deps/react.js');
   const {default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js');
   const {useAgentController}=await import('/src/features/scene/ai/useAgentController.ts');
   const {setAgentProfile}=await import('/src/features/scene/ai/navigation/obstacles.ts');
   const f=window.fixture,results=[],render=f.gl.render;f.gl.render=()=>{};
   for(const interrupted of [false,true]){
     const id='drona-check-'+interrupted;setAgentProfile(id,{radius:15,height:170});
     const container=document.createElement('div');document.body.append(container);
     const root=ReactDOM.createRoot(container),routine=structuredClone(data.sequence);
     const [x,y,z]=f.dronaObject.slots[0].offset;
     let agent,complete=false;
     function Probe(){agent=useAgentController(id,routine,false,()=>({x,y,z,rotY:Math.PI/2}),()=>{complete=true;});return null;}
     f.flushSync(()=>root.render(React.createElement(Probe)));
     const animations=new Set();
     for(let time=0;time<40&&!complete;time+=0.1){
       const state=agent.update(.1);animations.add(state.animation);
       await new Promise(r=>setTimeout(r,0));f.tick(.1);
       if(state.animation==='searching-files-high'){
         if(Math.abs(f.readDrona().z+data.depth*2/3)>1e-6)throw new Error('NPC must finish pulling the Drona before searching');
         if(interrupted)break;
       }
     }
     root.unmount();container.remove();await new Promise(r=>setTimeout(r,0));f.tick(data.duration);
     results.push({complete,interrupted,animations:[...animations],z:f.readDrona().z,open:f.store.getState().extraStates['drona-ne-catchall-slide']});
   }
   f.gl.render=render;return results;
 },drona);
 console.log('Drona controller results:',dronaRuns);
 for(const result of dronaRuns){
   assert(result.complete||result.interrupted);assert(result.animations.includes('opening'));
   assert(result.animations.includes('searching-files-high'));assert.equal(result.z,0);assert.equal(result.open,false);
 }
 assert.deepEqual(errors,[]);
 console.log('Right upper Drona, exact two-thirds slide, untouched neighbours, hover, preview, NPC and interruption: PASS');
 await page.evaluate(()=>window.fixture.setProps({dronaSE:true,noCaps:true,isPreview:false,actionState:{}}));
 await page.waitForFunction(()=>window.fixture.scene.getObjectByName('drona-se-pyjama')?.children.length&&window.fixture.scene.getObjectByName('drona-se-linen')?.children.length,{timeout:60000});
 const south=await page.evaluate(async()=>{
   const f=window.fixture;
   const {DRONA_SE_ITEMS,KALLAX_SE_DRONA_POSITIONS}=await import('/src/features/scene/items/kallaxSeDrona.ts');
   const {buildSmartObjectInstructionSequence,getSmartObject}=await import('/src/features/scene/ai/smartObjectRegistry.ts');
   const {getObjectTransform}=await import('/src/features/scene/objectTransforms.ts');
   const {registerObstacle}=await import('/src/features/scene/ai/navigation/obstacles.ts');
   f.readSouth=id=>{
     const node=f.scene.getObjectByName(id),mesh=node.getObjectByProperty('isMesh',true);mesh.geometry.computeBoundingBox();
     return {z:node.position.z,position:node.parent.position.toArray(),parent:node.parent.name,actions:node.userData.hoverAction.actions,
       depth:mesh.geometry.boundingBox.max.z-mesh.geometry.boundingBox.min.z,
       cells:Array.from({length:4},(_,i)=>{const cell=f.scene.getObjectByName('drona-se-cell-'+i);return [cell.position.toArray(),cell.children[0].position.toArray()];})};
   };
   const freezer=getObjectTransform('freezer'),ry=freezer.rotationY-Math.PI/2;
   const matrix=new f.THREE.Matrix4().makeRotationY(ry).setPosition(...freezer.position);
   const root=f.scene.getObjectByName('drona-se-pyjama').parent.parent;
   root.children.filter(child=>!child.name.startsWith('drona-se-cell-')).forEach((child,i)=>{
     const box=new f.THREE.Box3().setFromObject(child).applyMatrix4(matrix);
     registerObstacle({id:'kallax-se-test-'+i,owner:'kallax-se',yMin:box.min.y,yMax:box.max.y,
       polygon:[{x:box.min.x,z:box.min.z},{x:box.max.x,z:box.min.z},{x:box.max.x,z:box.max.z},{x:box.min.x,z:box.max.z}]});
   });
   return Object.entries(DRONA_SE_ITEMS).map(([id,item])=>{
     const obj=getSmartObject(id),transform=getObjectTransform(id);
     if(JSON.stringify(obj.position)!==JSON.stringify(transform.position))throw new Error('SE Drona must follow its item transform');
     const expected=new f.THREE.Vector3(...KALLAX_SE_DRONA_POSITIONS[item.index]).applyMatrix4(matrix);
     if(expected.distanceTo(new f.THREE.Vector3(...obj.position))>1e-6)throw new Error('SE Drona world position must match its rendered cell');
     return {id,...item,position:KALLAX_SE_DRONA_POSITIONS[item.index],closed:f.readSouth(id),slot:obj.slots[0],sequence:buildSmartObjectInstructionSequence(id,'pick-item')};
   });
 });
 assert.equal(south.find(x=>x.id==='drona-se-pyjama').index,2);
 assert.equal(south.find(x=>x.id==='drona-se-linen').index,1);
 for(const item of south){
   assert.deepEqual(item.closed.position,item.position);
   assert.deepEqual(item.closed.actions,[item.action,'smart-object:::'+item.id+':::pick-item']);
   await page.evaluate(action=>window.fixture.store.getState().triggerAction(action,true),item.action);
   await new Promise(r=>setTimeout(r,80));await tick(item.duration);
   const opened=await page.evaluate(id=>window.fixture.readSouth(id),item.id);
   assert(Math.abs(opened.z+opened.depth*2/3)<1e-6);
   for(let i=0;i<4;i++)if(i!==item.index)assert.deepEqual(opened.cells[i],item.closed.cells[i]);
   await page.evaluate(action=>window.fixture.store.getState().triggerAction(action,false),item.action);
   await new Promise(r=>setTimeout(r,80));await tick(item.duration);
   assert.equal((await page.evaluate(id=>window.fixture.readSouth(id),item.id)).z,0);
   await page.evaluate(action=>window.fixture.setProps({dronaSE:true,noCaps:true,isPreview:true,actionState:{[action]:true}}),item.action);
   await new Promise(r=>setTimeout(r,80));await tick(item.duration);
   assert.deepEqual((await page.evaluate(id=>window.fixture.readSouth(id),item.id)).actions,[item.action]);
   assert.equal(await page.evaluate(action=>window.fixture.store.getState().extraStates[action],item.action),false);
   await page.evaluate(()=>window.fixture.setProps({dronaSE:true,noCaps:true,isPreview:false,actionState:{}}));
   await new Promise(r=>setTimeout(r,80));await tick(item.duration);
 }
 const southRuns=await page.evaluate(async(items)=>{
   const {default:React}=await import('/node_modules/.vite/deps/react.js');
   const {default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js');
   const {useAgentController}=await import('/src/features/scene/ai/useAgentController.ts');
   const {setAgentProfile}=await import('/src/features/scene/ai/navigation/obstacles.ts');
   const {getAnimationDef}=await import('/src/features/scene/animations/animationResolver.ts');
   const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
   const linenClips={};let linenRig;
   for(const phase of ['pull','search','push']){
     const gltf=await new GLTFLoader().loadAsync('/animations/drona/linen_'+phase+'.glb');
     linenClips['drona-linen-'+phase]=gltf.animations[0];linenRig??=gltf.scene;
   }
   const sourceOpening=await new GLTFLoader().loadAsync('/animations/mixamo/anim_opening.glb');
   const original=sourceOpening.animations[0],pushed=linenClips['drona-linen-push'];
   for(const track of original.tracks){
     const reversed=pushed.tracks.find(t=>t.name===track.name);
     if(!reversed)throw new Error('Push must retain every source track');
     const a=track.createInterpolant(),b=reversed.createInterpolant();
     for(const fraction of [0,.25,.5,.75,1]){
       const source=a.evaluate(original.duration*(1-fraction)),reverse=b.evaluate(pushed.duration*fraction);
       if(Array.from(source).some((v,i)=>Math.abs(v-reverse[i])>1e-5))throw new Error('Push reversal mismatch: '+JSON.stringify({track:track.name,fraction,source:Array.from(source),reverse:Array.from(reverse)}));
     }
   }
   const f=window.fixture,results=[],render=f.gl.render;f.gl.render=()=>{};
   for(const item of items)for(const interrupted of [false,true]){
     const id=item.id+'-check-'+interrupted;setAgentProfile(id,{radius:15,height:170});
     const container=document.createElement('div');document.body.append(container);
     const root=ReactDOM.createRoot(container),routine=structuredClone(item.sequence);
     const mixer=item.id==='drona-se-linen'?new f.THREE.AnimationMixer(linenRig.clone(true)):null;
     let playback=null,playing='',loading=0;const finishedCounts={};
     if(mixer){
       mixer.addEventListener('loop',()=>{throw new Error('A linen gesture must never loop');});
       mixer.addEventListener('finished',e=>{const name=e.action.getClip().name;finishedCounts[name]=(finishedCounts[name]??0)+1;});
     }
     const [x,y,z]=item.slot.offset;
     let agent,complete=false,pulled=false;
     function Probe(){agent=useAgentController(id,routine,false,()=>({x,y,z,rotY:item.slot.rotY}),()=>{complete=true;});return null;}
     f.flushSync(()=>root.render(React.createElement(Probe)));
     const animations=new Set();
     for(let time=0;time<45&&!complete;time+=.1){
       const state=agent.update(.1);animations.add(state.animation);
       if(mixer&&linenClips[state.animation]){
         if(playing!==state.animation){
           if(playback)playback.stop();playing=state.animation;
           const clip=linenClips[playing];
           if(getAnimationDef(playing).loop!=='once')throw new Error('Linen clips must be explicitly one-shot');
           playback=mixer.clipAction(clip).reset().setLoop(f.THREE.LoopOnce,1);playback.clampWhenFinished=true;
           // Delay the initial clip beyond its nominal duration: the box must
           // stay still and the controller must wait for real playback.
           loading=playing==='drona-linen-pull'?clip.duration+.5:0;
         }
         if(loading>0){
           loading-=.1;
           if(f.readSouth(item.id).z!==0)throw new Error('The drawer moved before its clip was loaded');
         }else{
           playback.play();mixer.update(.1);
           const progress=Math.min(1,playback.time/playback.getClip().duration);
           agent.reportAnimationPlayback(playing,progress,progress>=1);
         }
       }
       await new Promise(r=>setTimeout(r,0));f.tick(.1);
       if(mixer&&playback&&loading<=0){
         const motion=routine.find(step=>step.animation===playing)?.dronaMotion;
         if(motion){
           const progress=playback.time/playback.getClip().duration;
           const fraction=Math.max(0,Math.min(1,(progress-motion.range[0])/(motion.range[1]-motion.range[0])));
           const expected=-item.closed.depth*2/3*(motion.from+(motion.to-motion.from)*fraction);
           if(Math.abs(f.readSouth(item.id).z-expected)>1e-6)throw new Error('Drawer drifted from the actual hand motion');
         }
       }
       if(state.animation===item.animation&&Math.abs(f.readSouth(item.id).z+item.closed.depth*2/3)<1e-6){
         pulled=true;if(interrupted)break;
       }
     }
     root.unmount();container.remove();await new Promise(r=>setTimeout(r,0));f.tick(item.duration);
     if(mixer&&!interrupted)for(const phase of ['pull','search','push'])if(finishedCounts['drona-linen-'+phase]!==1)throw new Error('Each linen gesture must finish exactly once');
     results.push({id:item.id,interrupted,complete,pulled,animations:[...animations],z:f.readSouth(item.id).z,open:f.store.getState().extraStates[item.action],finishedCounts});
   }
   f.gl.render=render;return results;
 },south);
 console.log('South-east Drona controller results:',southRuns);
 for(const result of southRuns){assert(result.complete||result.interrupted);assert(result.pulled);assert.equal(result.z,0);assert.equal(result.open,false);}
 assert.deepEqual(errors,[]);
 console.log('SE pyjama second from top and linen third: exact slide, itemId, independent preview, real cabinet navigation, NPC and interruption: PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
