const launchBrowser = require('./browser-test-options.cjs');
const puppeteer = require('puppeteer');
const assert = require('node:assert/strict');
if(process.argv.includes('--serve-tests')){
 (async()=>{
   const {createServer}=await import('vite');
   const server=await createServer({server:{host:'127.0.0.1',port:5175,strictPort:true,hmr:false}});
   await server.listen();server.printUrls();
 })().catch(e=>{console.error(e);process.exitCode=1;});
}
if(process.argv.includes('--build-storage')){
 (async()=>{
   const fs=require('node:fs'),THREE=require('three');
   const {GLTFLoader}=await import('three/examples/jsm/loaders/GLTFLoader.js');
   const {NodeIO}=await import('@gltf-transform/core');const io=new NodeIO();
   const sources=[
     {id:'care',source:'looking_through_files_low',time:3.6,height:70.25,lean:0},
     {id:'trousers',source:'opening',time:0,height:95.75,lean:.35},
     // Floor-level box: grip the upper rim, 3 cm below its 33 cm-high top.
     {id:'catchall2',source:'looking_through_files_low',time:10.8,height:20.5+33/2-3,lean:0},
     {id:'bath-box',source:'looking_through_files_low',time:3.6,height:60+33/2+.2,lean:0},
     {id:'bath-cabinet-west',source:'looking_through_files_low',time:3.6,height:54,lean:0,cabinet:'west'},
     {id:'bath-cabinet-east',source:'looking_through_files_low',time:3.6,height:54,lean:0,cabinet:'east'},
     {id:'kitchen-upper',source:'looking_through_files_low',time:10.8,height:56,lean:0,lift:.2},
     {id:'kitchen-diy',source:'looking_through_files_low',time:10.8,height:20.5+33/2-3,lean:0,approach:.65},
   ];
   // Geometry measurements from the actual DroneCell GLB (centred in X/Z).
   const bytes=fs.readFileSync('public/items/dröna/DRÖNA_high.glb');
   const glb=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
   const bounds=glb.accessors[glb.meshes[0].primitives[0].attributes.POSITION];
   const depth=(bounds.max[0]-bounds.min[0])*.995,travel=depth*2/3,approach=.5;
   for(const item of sources){
     const sourcePath=`public/animations/mixamo/anim_${item.source}.glb`,data=fs.readFileSync(sourcePath);
     const rig=await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
     const mixer=new THREE.AnimationMixer(rig.scene);mixer.clipAction(rig.animations[0]).play();mixer.setTime(item.time);
     const hips=rig.scene.getObjectByName('mixamorigHips');rig.scene.updateMatrixWorld(true);
     const hipWorld=hips.getWorldPosition(new THREE.Vector3());hipWorld.x=0;hipWorld.z=0;
     // The runtime removes initial root-joint translation as locomotion drift.
     // Bake the crouched root height into Hips so retargeting preserves it.
     hips.parent.position.set(0,0,0);rig.scene.updateMatrixWorld(true);
     hips.position.copy(hips.parent.worldToLocal(hipWorld));
     const spine=rig.scene.getObjectByName('mixamorigSpine');rig.scene.updateMatrixWorld(true);
     const spineWorld=spine.getWorldQuaternion(new THREE.Quaternion()),spineParent=spine.parent.getWorldQuaternion(new THREE.Quaternion());
     spine.quaternion.copy(spineParent.invert().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),item.lean)).multiply(spineWorld));
     rig.scene.updateMatrixWorld(true);
     const nodes=[];rig.scene.traverse(n=>{if(n.isBone)nodes.push(n);});
     const bases=new Map(nodes.map(n=>[n.name,{q:n.quaternion.clone(),p:n.position.clone()}]));
     const hands=['Left','Right'].map(side=>({side,hand:rig.scene.getObjectByName('mixamorig'+side+'Hand'),upper:rig.scene.getObjectByName('mixamorig'+side+'Arm'),lower:rig.scene.getObjectByName('mixamorig'+side+'ForeArm')}));
     const neutral=hands.map(({hand})=>hand.getWorldPosition(new THREE.Vector3()));
     function aim(bone,from,to){
       const world=bone.getWorldQuaternion(new THREE.Quaternion()),parent=bone.parent.getWorldQuaternion(new THREE.Quaternion());
       bone.quaternion.copy(parent.invert().multiply(new THREE.Quaternion().setFromUnitVectors(from.normalize(),to.normalize())).multiply(world));
       rig.scene.updateMatrixWorld(true);
     }
     function solve({upper,lower,hand},target){
       const shoulder=upper.getWorldPosition(new THREE.Vector3()),elbow=lower.getWorldPosition(new THREE.Vector3()),wrist=hand.getWorldPosition(new THREE.Vector3());
       const a=shoulder.distanceTo(elbow),b=elbow.distanceTo(wrist),direction=target.clone().sub(shoulder),distance=direction.length();
       if(distance>=a+b||distance<=Math.abs(a-b))throw new Error('Unreachable handle: '+JSON.stringify({id:item.id,target:target.toArray(),shoulder:shoulder.toArray(),distance,reach:a+b}));
       direction.normalize();
       const along=(a*a-b*b+distance*distance)/(2*distance),height=Math.sqrt(a*a-along*along);
       const bend=elbow.clone().sub(shoulder);bend.addScaledVector(direction,-bend.dot(direction)).normalize();
       const desiredElbow=shoulder.clone().addScaledVector(direction,along).addScaledVector(bend,height);
       aim(upper,elbow.clone().sub(shoulder),desiredElbow.clone().sub(shoulder));
       const newElbow=lower.getWorldPosition(new THREE.Vector3()),newWrist=hand.getWorldPosition(new THREE.Vector3());
       aim(lower,newWrist.sub(newElbow),target.clone().sub(newElbow));
       if(hand.getWorldPosition(new THREE.Vector3()).distanceTo(target)>1e-5)throw new Error('IK did not reach handle');
     }
     for(const phase of ['pull','search','push']){
       const doc=await io.read(sourcePath);doc.getRoot().listAnimations().forEach(a=>{
         const samplers=a.listSamplers(),accessors=new Set(samplers.flatMap(s=>[s.getInput(),s.getOutput()]));
         a.dispose();samplers.forEach(s=>s.dispose());accessors.forEach(a=>a.dispose());
       });
       const buffer=doc.getRoot().listBuffers()[0],duration=phase==='search'?9.766666412353516/2:4.833333492279053/2;
       const frames=Math.ceil(duration*30)+1,times=Float32Array.from({length:frames},(_,i)=>duration*i/(frames-1));
       const rotations=new Map(nodes.map(n=>[n.name,[]])),positions=new Map(nodes.map(n=>[n.name,[]]));
       for(let frame=0;frame<frames;frame++){
         nodes.forEach(n=>{n.quaternion.copy(bases.get(n.name).q);n.position.copy(bases.get(n.name).p);});rig.scene.updateMatrixWorld(true);
         let t=frame/(frames-1);if(phase==='push')t=1-t;
         const fraction=Math.max(0,Math.min(1,(t-.25)/.5));
         hands.forEach((arm,index)=>{
           if(item.cabinet&&index!==(item.cabinet==='west'?0:1))return;
           const target=new THREE.Vector3(index===0?.1:-.1,item.height/100,(item.approach??approach)-depth/2-travel*(phase==='search'?1:fraction));
           if(item.cabinet){
             // One hand follows the 40 cm door around its mirrored hinge.
             const swing=(phase==='search'?1:fraction)*Math.PI/2,sign=item.cabinet==='west'?1:-1;
             target.set(sign*(.2-.36*Math.cos(swing)),item.height/100,.6-.2-.36*Math.sin(swing));
             if(phase==='search'){
               const envelope=Math.sin(Math.PI*t)**2;
               target.lerp(new THREE.Vector3(0,.4,.48),envelope);
             }
           }else if(phase==='search'){
             // A single rummage, returning both hands to their grip before pushing.
             const envelope=Math.sin(Math.PI*t)**2;
             target.y+=(item.lift??.1)*envelope;target.z+=.07*envelope;target.x+=.04*Math.sin(2*Math.PI*t)*(index===0?1:-1);
           }
           if(phase!=='search'&&t<.25){
             const reach=t/.25;target.lerpVectors(neutral[index],target,reach*reach*(3-2*reach));
           }
           solve(arm,target);
         });
         nodes.forEach(n=>{rotations.get(n.name).push(...n.quaternion.toArray());positions.get(n.name).push(...n.position.toArray());});
       }
       const animation=doc.createAnimation(`drona-${item.id}-${phase}`),input=doc.createAccessor().setType('SCALAR').setArray(times).setBuffer(buffer);
       const heldInput=doc.createAccessor().setType('SCALAR').setArray(new Float32Array([0,duration])).setBuffer(buffer);
       for(const node of doc.getRoot().listNodes()){
         const name=node.getName().replace(/:/g,'');if(!rotations.has(name))continue;
         for(const [path,type,values] of [['rotation','VEC4',rotations.get(name)],['translation','VEC3',positions.get(name)]]){
           const size=type==='VEC4'?4:3,held=values.every((v,i)=>v===values[i%size]);
           const output=doc.createAccessor().setType(type).setArray(new Float32Array(held?[...values.slice(0,size),...values.slice(0,size)]:values)).setBuffer(buffer);
           const sampler=doc.createAnimationSampler().setInput(held?heldInput:input).setOutput(output).setInterpolation('LINEAR');
           animation.addSampler(sampler).addChannel(doc.createAnimationChannel().setTargetNode(node).setTargetPath(path).setSampler(sampler));
         }
       }
       fs.mkdirSync('public/animations/drona',{recursive:true});await io.write(`public/animations/drona/${item.id}_${phase}.glb`,doc);
       const written=fs.readFileSync(`public/animations/drona/${item.id}_${phase}.glb`);
       const check=await new GLTFLoader().parseAsync(written.buffer.slice(written.byteOffset,written.byteOffset+written.byteLength),'');
       const checkMixer=new THREE.AnimationMixer(check.scene);checkMixer.clipAction(check.animations[0]).play();checkMixer.setTime(duration/2);check.scene.updateMatrixWorld(true);
       for(const side of ['Left','Right']){
         const expected=rig.scene.getObjectByName('mixamorig'+side+'Foot').getWorldPosition(new THREE.Vector3());
         const actual=check.scene.getObjectByName('mixamorig'+side+'Foot').getWorldPosition(new THREE.Vector3());
         if(actual.distanceTo(expected)>1e-5)throw new Error('Export lost the authored posture: '+item.id);
       }
       console.log(`${item.id} ${phase}: ${duration}s, ${frames} frames`);
     }
   }
 })().catch(e=>{console.error(e);process.exitCode=1;});
}
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
   for(const id of ['kneeling_idle','male_crouch_pose','looking_through_files_low','opening']){
     const bytes=fs.readFileSync(`public/animations/mixamo/anim_${id}.glb`);
     const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
     const clip=gltf.animations[0],mixer=new THREE.AnimationMixer(gltf.scene);
     mixer.clipAction(clip).play();const samples=[];
     for(const fraction of [0,.25,.5,.75]){
       mixer.setTime(clip.duration*fraction);gltf.scene.updateMatrixWorld(true);
       samples.push({fraction,hands:['mixamorigLeftHand','mixamorigRightHand','mixamorigRightArm','mixamorigHips','mixamorigRightFoot'].map(name=>gltf.scene.getObjectByName(name).getWorldPosition(new THREE.Vector3()).multiplyScalar(100).toArray().map(v=>Math.round(v)))});
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
if(!process.argv.includes('--serve-tests')&&!process.argv.includes('--inspect-drona')&&!process.argv.includes('--build-linen')&&!process.argv.includes('--build-storage'))(async () => {
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
 const {KallaxNW}=await import('/src/features/scene/items/KallaxNW.tsx');
 const {KallaxCuisine,KallaxCuisineDrona}=await import('/src/features/scene/items/KallaxCuisine.tsx');
 const {KALLAX_CUISINE_POSITION,KALLAX_CUISINE_ROTATION}=await import('/src/features/scene/items/kallaxCuisineDrona.ts');
 const {BathroomCabinetWest,BathroomCabinetEast}=await import('/src/features/scene/items/BathroomCabinet.tsx');
 const {BATHROOM_STORAGE_ITEMS}=await import('/src/features/scene/items/bathroomStorage.ts');
 const {SlidingDrona}=await import('/src/features/scene/items/SlidingDrona.tsx');
 const {NavigationObstacle}=await import('/src/features/scene/ai/navigation/NavigationObstacle.tsx');
 const {Beds,Desks,DeskDecor,OfficeChair}=await import('/src/features/scene/placements/LivingRoomPlacements.tsx');
 const {MackaparGroup}=await import('/src/features/scene/items/MackaparGroup.tsx');
 const {TrashBin}=await import('/src/features/scene/items/TrashBin.tsx');
 const {ROOM_D,BATH_WEST_WALL}=await import('/src/features/scene/wallData.ts');
 const {Smorkull}=await import('/src/features/scene/items/Smorkull.tsx');
 const {getObjectTransform}=await import('/src/features/scene/objectTransforms.ts');
 const chairTransform=getObjectTransform('chair-office');
 const {useSceneStore}=await import('/src/features/scene/store/useSceneStore.ts');
 const f=window.fixture={THREE,store:useSceneStore,flushSync,time:0};
 document.body.innerHTML='';document.body.style.margin='0';
 const container=document.createElement('div');container.style.cssText='width:1200px;height:900px';document.body.append(container);
 const h=React.createElement;
 function Capture(){const state=useThree();React.useLayoutEffect(()=>{Object.assign(f,state);},[state]);return null;}
 function BathroomFixture(props){return h(React.Fragment,null,...Object.entries(BATHROOM_STORAGE_ITEMS).map(([id,item])=>
   h('group',{key:id,position:item.position,rotation:[0,item.rotationY,0]},item.kind==='cabinet'
     ?h(NavigationObstacle,{id},h(id.endsWith('west')?BathroomCabinetWest:BathroomCabinetEast,{item:{id},onSize:()=>{},...props}))
     :h(SlidingDrona,{objectId:id,label:item.label,actionId:item.action,duration:2.4,...props}))));}
 function KitchenFixture(props){return h('group',{position:KALLAX_CUISINE_POSITION,rotation:[0,KALLAX_CUISINE_ROTATION,0]},
   h(NavigationObstacle,{id:'kallax-cuisine'},h(KallaxCuisine,{item:{},onSize:()=>{},...props,noDrona:true})),
   h(KallaxCuisineDrona,props));}
 function App(){const [props,setProps]=React.useState({isPreview:false,actionState:{}});f.setProps=setProps;
 return h(Canvas,{frameloop:'never',shadows:true,camera:{position:[125,80,-95],near:.1,far:1500,fov:45}},
 h(Capture),h('ambientLight',{intensity:.85}),h('directionalLight',{position:[100,120,-80],intensity:2}),
 h(React.Suspense,{fallback:null},props.kitchenStorage?h(KitchenFixture,props):props.bathroom?h(BathroomFixture,props):props.layout?h(React.Fragment,null,h(Beds),h(Desks),h(DeskDecor)):h(props.dronaKitchen?KallaxCuisine:props.dronaNW?KallaxNW:props.dronaSE?KallaxSE:props.drona?KallaxNE:props.fridge?Fridge:Freezer,{item:{},onSize:s=>f.dimensions=s.toArray(),...props})),
 props.diyObstacles&&h(React.Suspense,{fallback:null},h(React.Fragment,null,
   h(Beds),h(OfficeChair),
   h('group',{position:[32,0,ROOM_D-75.5-16],rotation:[0,Math.PI/2,0]},h(NavigationObstacle,{id:'mackapar'},h(MackaparGroup,{item:{},actionState:{},onSize:()=>{},noDrona:true,noHangers:true}))),
   h('group',{position:[BATH_WEST_WALL+39+18,0,ROOM_D-75.5/2-22],rotation:[0,Math.PI/2,0]},h(NavigationObstacle,{id:'trash-bin'},h(TrashBin,{item:{},actionState:{},onSize:()=>{f.diyObstaclesReady=true;}}))))),
 props.chair&&h(React.Suspense,{fallback:null},h('group',{ref:g=>{f.chair=g;},position:chairTransform.position,rotation:[0,chairTransform.rotationY,0]},h(Smorkull,{item:{},actionState:{},onSize:()=>{f.chairReady=true;}}))),
 h('mesh',{rotation:[-Math.PI/2,0,0],position:[0,-.1,0]},h('planeGeometry',{args:[400,400]}),h('meshStandardMaterial',{color:'#777777'})) );}
 createRoot(container).render(h(App));
 f.tick=(seconds)=>{const render=f.gl.render;f.gl.render=()=>{};try{for(let t=0;t<seconds;t+=1/60){f.time+=1/60;f.advance(f.time,true);}}finally{f.gl.render=render;}f.scene.updateMatrixWorld(true);f.gl.render(f.scene,f.camera);};
 f.read=()=>{const door=f.scene.getObjectByName('door');
 return {door:door.quaternion.toArray(),pivot:door.position.toArray(),time:f.scene.getObjectByName('body').matrixWorld.toArray(),size:f.dimensions};};
 });
 await page.waitForFunction(()=>window.fixture.scene?.getObjectByName('motor_casing'),{timeout:60000});
 await page.evaluate(()=>{const f=window.fixture;f.camera.lookAt(0,25,0);f.tick(.01);});

 if(process.argv.includes('--diy-chair')){
   await page.evaluate(()=>window.fixture.setProps({kitchenStorage:true,diyObstacles:true,isPreview:false,actionState:{}}));
   await page.waitForFunction(()=>window.fixture.diyObstaclesReady&&window.fixture.scene.getObjectByName('drona-kitchen-diy'),{timeout:60000});
   await new Promise(r=>setTimeout(r,80));await page.evaluate(()=>window.fixture.tick(.1));
   const results=await page.evaluate(async()=>{
     const f=window.fixture,{default:React}=await import('/node_modules/.vite/deps/react.js'),{default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js');
     const {useAgentController}=await import('/src/features/scene/ai/useAgentController.ts');
     const {buildSmartObjectInstructionSequence,getSmartObject}=await import('/src/features/scene/ai/smartObjectRegistry.ts');
     const {currentFurnitureTransforms,movingFurniture,SMORKULL_POSITIONS}=await import('/src/features/scene/furniturePositions.ts');
     const {OccupancyManager}=await import('/src/features/scene/ai/occupancyManager.ts');
     const {getDiyChairParking}=await import('/src/features/scene/ai/diyChairClearance.ts');
     const {getAnimationDef}=await import('/src/features/scene/animations/animationResolver.ts');
     const {setAgentProfile,furnitureObstacles}=await import('/src/features/scene/ai/navigation/obstacles.ts');
     const {pointInRing,inflate}=await import('/src/features/scene/ai/navigation/geometry.ts');
     const {resolveInstructionCoords}=await import('/src/features/scene/ai/agent/agentInstructionCoords.ts');
     const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
     const object=getSmartObject('drona-kitchen-diy'),[gx,,gz]=object.slots[0].offset;
     const chair=[...furnitureObstacles.values()].find(o=>o.owner==='chair-office');
     if(!chair||!pointInRing({x:gx,z:gz},inflate(chair.polygon,15)))throw new Error('The real chair must reproduce the blocked Bricolage access');
     const clips={};let rig;
     for(const phase of ['pull','search','push']){
       const def=getAnimationDef('drona-kitchen-diy-'+phase),gltf=await new GLTFLoader().loadAsync('/'+def.path);clips[def.id]=gltf.animations[0];rig??=gltf.scene;
     }
     const render=f.gl.render;f.gl.render=()=>{};const results=[];
     try{for(const doubleBed of [false,true]){
       f.store.getState().triggerAction('bed-double',doubleBed);await new Promise(r=>setTimeout(r,80));f.tick(3);
       for(const interruptAt of ['occupied','approach','pull','search',null]){
         const id='diy-chair-'+doubleBed+'-'+interruptAt;setAgentProfile(id,{radius:15,height:170});
         if(interruptAt==='occupied')OccupancyManager.claimSlot('chair-office','sit','chair-occupant');
         const routine=buildSmartObjectInstructionSequence(object.id,'pick-item'),host=document.createElement('div');document.body.append(host);const root=ReactDOM.createRoot(host);
         let agent,complete=false,playing='',playback,parked=false,aligned=false,movingSeen=false;
         const mixer=new f.THREE.AnimationMixer(rig.clone(true));
         function Probe(){agent=useAgentController(id,routine,false,()=>({x:220,y:0,z:350,rotY:0}),()=>{complete=true;});return null;}
         f.flushSync(()=>root.render(React.createElement(Probe)));
         for(let time=0;time<80&&!complete;time+=.05){
           const state=agent.update(.05),parking=getDiyChairParking();
           if(clips[state.animation]){
             if(movingFurniture.has('smorkull-position'))throw new Error('Actor used Bricolage before chair clearance finished');
             if(!parking)throw new Error('Chair clearance released before the interaction finished');
             if(Math.abs(state.z-object.position[2])>33/2||state.x<object.position[0])throw new Error('Actor went behind Mackapar instead of facing Bricolage');
             const resolved=resolveInstructionCoords(routine.find(s=>s.animation===state.animation),null,id,state);
             if(Math.hypot(state.x-resolved.tx,state.z-resolved.tz)>1e-6)throw new Error('Actor did not use the reachable front point');
             for(const obstacle of furnitureObstacles.values())if(obstacle.owner!=='kallax-cuisine'&&pointInRing(state,inflate(obstacle.polygon,15)))throw new Error('Bricolage use overlaps '+obstacle.owner);
             parked=true;aligned=true;
             if(playing!==state.animation){playback?.stop();playing=state.animation;playback=mixer.clipAction(clips[playing]).reset().setLoop(f.THREE.LoopOnce,1);playback.clampWhenFinished=true;playback.play();}
             mixer.update(.05);const progress=Math.min(1,playback.time/playback.getClip().duration);agent.reportAnimationPlayback(playing,progress,progress>=1);
           }
           await new Promise(r=>setTimeout(r,0));f.tick(.05);
           movingSeen||=movingFurniture.has('smorkull-position');
           if(interruptAt==='occupied'&&time>.5){if(parking||movingSeen||f.store.getState().extraStates['drona-kitchen-diy-slide'])throw new Error('An occupied chair was moved');break;}
           if(interruptAt==='approach'&&movingSeen)break;
           if((interruptAt==='pull'||interruptAt==='search')&&playing==='drona-kitchen-diy-'+interruptAt&&playback.time>playback.getClip().duration/2)break;
         }
         root.unmount();host.remove();await new Promise(r=>setTimeout(r,80));f.tick(3);
         if(interruptAt==='occupied')OccupancyManager.releaseSlot('chair-office','sit','chair-occupant');
         if(getDiyChairParking())throw new Error('Chair clearance leaked after unmount');
         const restored=currentFurnitureTransforms['smorkull-position'];
         if(Math.hypot(restored.x-SMORKULL_POSITIONS[0].x,restored.z-SMORKULL_POSITIONS[0].z)>1e-6)throw new Error('Chair did not return to its original position');
         if(f.store.getState().extraStates['drona-kitchen-diy-slide'])throw new Error('Bricolage remained open');
         if(!interruptAt&&(!complete||!parked||!aligned))throw new Error('Full Bricolage routine did not finish in front of the box: '+JSON.stringify({complete,parked,aligned,status:agent.getStatus()}));
         results.push({doubleBed,interruptAt,complete,movingSeen,parked,aligned});
       }
     }}finally{f.gl.render=render;}
     return results;
   });
   console.log('Actual chair, trash bin, Mackapar, separate/double beds, front approach, restoration and interruption: PASS',results);assert.deepEqual(errors,[]);return;
 }

 if(process.argv.includes('--bathroom')||process.argv.includes('--kitchen')){
   const kitchen=process.argv.includes('--kitchen'),fixtureProps=kitchen?{kitchenStorage:true}:{bathroom:true};
   await page.evaluate(props=>window.fixture.setProps({...props,isPreview:false,actionState:{}}),fixtureProps);
   await page.waitForFunction(kitchen=>(kitchen?['drona-kitchen-diy','drona-kitchen-old-it','drona-kitchen-main','drona-kitchen-electronics']:['bathroom-cabinet-west','bathroom-cabinet-east','drona-bathroom-west','drona-bathroom-east']).every(id=>window.fixture.scene.getObjectByName(id)),{timeout:60000},kitchen);
   const items=await page.evaluate(async(kitchen)=>{
     const f=window.fixture,{BATHROOM_STORAGE_ITEMS}=await import('/src/features/scene/items/bathroomStorage.ts');
     const {getSmartObject,buildSmartObjectInstructionSequence}=await import('/src/features/scene/ai/smartObjectRegistry.ts');
     const {getObjectTransform}=await import('/src/features/scene/objectTransforms.ts');
     const {KITCHEN_DRONA_ITEMS,KALLAX_CUISINE_DRONA_POSITIONS}=await import('/src/features/scene/items/kallaxCuisineDrona.ts');
     const storageItems=kitchen?Object.fromEntries(Object.entries(KITCHEN_DRONA_ITEMS).map(([id,item])=>[id,{...item,kind:'box'}])):BATHROOM_STORAGE_ITEMS;
     if(getSmartObject('drona-west')||getSmartObject('drona-east'))throw new Error('Legacy storage objects still registered');
     f.readBath=id=>{
       const item=storageItems[id],node=f.scene.getObjectByName(id);let hover=node.userData.hoverAction;
       node.traverse(n=>{if(!hover&&n.userData.hoverAction)hover=n.userData.hoverAction;});
       let extension;
       if(item.kind==='cabinet')extension=f.scene.getObjectByName(id+'-door').rotation.y/(id.endsWith('west')?-Math.PI/2:Math.PI/2);
       else{const mesh=node.getObjectByProperty('isMesh',true);mesh.geometry.computeBoundingBox();extension=-node.position.z/((mesh.geometry.boundingBox.max.z-mesh.geometry.boundingBox.min.z)*2/3);}
       const laser=node.getObjectByName('drona-kitchen-old-it-laser');
       return {extension,actions:hover.actions,laserOffset:laser?node.worldToLocal(laser.getWorldPosition(new f.THREE.Vector3())).toArray():null};
     };
     f.tick(.1);
     return Object.entries(storageItems).map(([id,item])=>{
       const obj=getSmartObject(id),transform=getObjectTransform(id),node=f.scene.getObjectByName(id),world=node.getWorldPosition(new f.THREE.Vector3());
       if(world.distanceTo(new f.THREE.Vector3(...transform.position))>1e-6)throw new Error('Rendered storage differs from item transform');
       if(JSON.stringify(obj.position)!==JSON.stringify(transform.position))throw new Error('SmartObject must use itemId');
       if(kitchen){
         const expected={'drona-kitchen-diy':[-17.5,20.5,0],'drona-kitchen-old-it':[17.5,20.5,0],'drona-kitchen-main':[17.5,56,0],'drona-kitchen-electronics':[-17.5,56,0]}[id];
         if(JSON.stringify(node.parent.position.toArray())!==JSON.stringify(expected))throw new Error('Wrong kitchen row/column: '+id);
         if(JSON.stringify(expected)!==JSON.stringify(KALLAX_CUISINE_DRONA_POSITIONS[item.index]))throw new Error('Kitchen anchors drifted from cell geometry');
       }
       return {id,...item,slot:obj.slots[0],sequence:buildSmartObjectInstructionSequence(id,'pick-item')};
     });
   },kitchen);
   for(const item of items){
     assert.deepEqual((await page.evaluate(id=>window.fixture.readBath(id),item.id)).actions,[item.action,`smart-object:::${item.id}:::pick-item`]);
     for(const value of [true,false]){
       await page.evaluate(({action,value})=>window.fixture.store.getState().triggerAction(action,value),{action:item.action,value});
       await new Promise(r=>setTimeout(r,80));await page.evaluate(()=>window.fixture.tick(3));
       const states=await page.evaluate(ids=>ids.map(id=>window.fixture.readBath(id).extension),items.map(x=>x.id));
       for(let i=0;i<items.length;i++)assert(Math.abs(states[i]-(items[i].id===item.id&&value?1:0))<1e-6,'Actions must only move the selected storage');
       if(item.id==='drona-kitchen-old-it'){
         const read=await page.evaluate(id=>window.fixture.readBath(id),item.id);
         for(let i=0;i<3;i++)assert(Math.abs(read.laserOffset[i]-[0,6.25-20.5,-5][i])<1e-6,'The laser must stay inside Old IT');
       }
     }
     await page.evaluate(({props,action})=>window.fixture.setProps({...props,isPreview:true,actionState:{[action]:true}}),{props:fixtureProps,action:item.action});
     await new Promise(r=>setTimeout(r,80));await page.evaluate(()=>window.fixture.tick(3));
     assert.equal((await page.evaluate(id=>window.fixture.readBath(id),item.id)).extension,1);
     assert.deepEqual((await page.evaluate(id=>window.fixture.readBath(id),item.id)).actions,[item.action]);
     await page.evaluate(props=>window.fixture.setProps({...props,isPreview:false,actionState:{}}),fixtureProps);await new Promise(r=>setTimeout(r,80));await page.evaluate(()=>window.fixture.tick(3));
     const runs=await page.evaluate(async(item)=>{
       const f=window.fixture,{default:React}=await import('/node_modules/.vite/deps/react.js'),{default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js');
       const {useAgentController}=await import('/src/features/scene/ai/useAgentController.ts');
       const {setAgentProfile}=await import('/src/features/scene/ai/navigation/obstacles.ts');
       const {getAnimationDef}=await import('/src/features/scene/animations/animationResolver.ts');
       const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
       const clips={};let rig;
       for(const phase of ['pull','search','push']){
         const def=getAnimationDef(item.animationPrefix+'-'+phase);if(def.loop!=='once')throw new Error('Storage gestures must be one-shot');
         const gltf=await new GLTFLoader().loadAsync('/'+def.path);clips[def.id]=gltf.animations[0];rig??=gltf.scene;
       }
       const render=f.gl.render;f.gl.render=()=>{};const results=[];
       try{for(const interruptAt of [null,'pull','search']){
         const id=item.id+'-'+interruptAt;setAgentProfile(id,{radius:15,height:170});
         const host=document.createElement('div');document.body.append(host);const root=ReactDOM.createRoot(host);
         const routine=structuredClone(item.sequence),[x,y,z]=item.slot.offset;let agent,complete=false,playback,playing='';
         const finished={},mixer=new f.THREE.AnimationMixer(rig.clone(true));
         mixer.addEventListener('loop',()=>{throw new Error('Bathroom gesture looped');});
         mixer.addEventListener('finished',e=>{const name=e.action.getClip().name;finished[name]=(finished[name]??0)+1;});
         function Probe(){agent=useAgentController(id,routine,false,()=>({x,y,z,rotY:item.slot.rotY}),()=>{complete=true;});return null;}
         f.flushSync(()=>root.render(React.createElement(Probe)));
         for(let time=0;time<30&&!complete;time+=.05){
           const state=agent.update(.05);
           if(clips[state.animation]){
             if(playing!==state.animation){playback?.stop();playing=state.animation;playback=mixer.clipAction(clips[playing]).reset().setLoop(f.THREE.LoopOnce,1);playback.clampWhenFinished=true;playback.play();}
             mixer.update(.05);const progress=Math.min(1,playback.time/playback.getClip().duration);agent.reportAnimationPlayback(playing,progress,progress>=1);
           }
           await new Promise(r=>setTimeout(r,0));f.tick(.05);
           const motion=routine.find(step=>step.animation===state.animation)?.dronaMotion;
           if(motion){
             const progress=playback.time/playback.getClip().duration,fraction=Math.max(0,Math.min(1,(progress-motion.range[0])/(motion.range[1]-motion.range[0])));
             if(Math.abs(f.readBath(item.id).extension-(motion.from+(motion.to-motion.from)*fraction))>1e-6)throw new Error('Bathroom storage drifted from playback');
           }
           if(interruptAt&&playing===item.animationPrefix+'-'+interruptAt&&playback.time>playback.getClip().duration/2)break;
         }
         root.unmount();host.remove();await new Promise(r=>setTimeout(r,0));f.tick(3);
         if(f.readBath(item.id).extension!==0)throw new Error('Bathroom storage not closed after completion/interruption');
         if(!interruptAt){if(!complete)throw new Error('Bathroom routine did not finish');for(const phase of ['pull','search','push'])if(finished[item.animationPrefix+'-'+phase]!==1)throw new Error('Incomplete/repeated bathroom gesture');}
         results.push({interruptAt,complete,finished});
       }}finally{f.gl.render=render;}
       return results;
     },item);
     console.log(item.id,'itemId, real cabinets, independent actions/preview, one-shot sync and interruption cleanup: PASS',runs);
   }
   assert.deepEqual(errors,[]);return;
 }

 if(process.argv.includes('--clearance')){
   const measurements=[];
   for(const shelf of ['se','ne','nw','kitchen']){
     await page.evaluate(shelf=>{
       const f=window.fixture;f.dimensions=null;
       f.setProps({dronaSE:shelf==='se',drona:shelf==='ne',dronaNW:shelf==='nw',dronaKitchen:shelf==='kitchen',noCaps:true,noMannequins:true,actionState:{},isPreview:false});
     },shelf);
     await page.waitForFunction(()=>!!window.fixture.dimensions,{timeout:60000});
     const result=await page.evaluate(async(shelf)=>{
       const f=window.fixture,{ROOM_W,ROOM_D,BATH_WEST_WALL,FURNITURE_WALL_CLEARANCE}=await import('/src/features/scene/wallData.ts');
       const {getObjectTransform}=await import('/src/features/scene/objectTransforms.ts');
       const {KALLAX_NE_POSITION,KALLAX_NE_ROTATION}=await import('/src/features/scene/items/kallaxNeDrona.ts');
       const {KALLAX_NW_POSITION,KALLAX_NW_ROTATION}=await import('/src/features/scene/items/dronaStorage.ts');
       const {KALLAX_CUISINE_POSITION}=await import('/src/features/scene/items/kallaxCuisineDrona.ts');
       const freezer=getObjectTransform('freezer');
       const position=shelf==='se'?freezer.position:shelf==='ne'?KALLAX_NE_POSITION:shelf==='nw'?KALLAX_NW_POSITION:KALLAX_CUISINE_POSITION;
       const ry=shelf==='se'?freezer.rotationY-Math.PI/2:shelf==='ne'?KALLAX_NE_ROTATION:KALLAX_NW_ROTATION;
       const root=f.scene.children.find(n=>n.isGroup),matrix=new f.THREE.Matrix4().makeRotationY(ry).setPosition(...position);
       const box=new f.THREE.Box3().setFromObject(root).applyMatrix4(matrix);
       const gaps=shelf==='se'||shelf==='ne'?{east:ROOM_W-box.max.x}:{west:box.min.x-(shelf==='nw'?0:BATH_WEST_WALL)};
       if(shelf==='ne'||shelf==='nw')gaps.north=box.min.z;
       if(shelf==='kitchen'||shelf==='se')gaps.south=ROOM_D-box.max.z;
       return {shelf,gaps,bounds:{min:box.min.toArray(),max:box.max.toArray()}};
     },shelf);
     console.log('Measured model wall clearance:',result);
     measurements.push(result);
   }
   for(const result of measurements)for(const gap of Object.values(result.gaps))assert(gap>=3-.001,`${result.shelf} overlaps the 3 cm skirting zone: ${gap}`);
   assert.deepEqual(errors,[]);console.log('Actual GLB bounds clear the 3 cm skirting zone: PASS');return;
 }

 if(process.argv.includes('--storage')){
   const items=await page.evaluate(async()=>Object.entries((await import('/src/features/scene/items/dronaStorage.ts')).DRONA_SPECIAL_ITEMS));
   for(const [id,item] of items){
     const props={drona:item.shelf==='ne',dronaSE:item.shelf==='se',dronaNW:item.shelf==='nw',noMannequins:true,noCaps:true};
     await page.evaluate(props=>window.fixture.setProps({...props,isPreview:false}),props);
     await page.waitForFunction(id=>window.fixture.scene.getObjectByName(id)?.children.length,{timeout:60000},id);
     const geometry=await page.evaluate(async({id,item})=>{
       const f=window.fixture,node=f.scene.getObjectByName(id),mesh=node.getObjectByProperty('isMesh',true);mesh.geometry.computeBoundingBox();
       const {getSmartObject,buildSmartObjectInstructionSequence}=await import('/src/features/scene/ai/smartObjectRegistry.ts');
       const {getObjectTransform}=await import('/src/features/scene/objectTransforms.ts');
       const obj=getSmartObject(id),transform=getObjectTransform(id);
       if(JSON.stringify(obj.position)!==JSON.stringify(transform.position))throw new Error('Storage must follow itemId');
       if(node.parent.position.distanceTo(new f.THREE.Vector3(...item.position))>1e-6)throw new Error('Wrong cell');
       const neighbours=()=>node.parent.parent.children.filter(n=>n.name.startsWith('drona-')&&n!==node.parent).map(n=>[n.name,n.children[0].position.toArray()]);
       f.storageRead=()=>({z:node.position.z,actions:node.userData.hoverAction.actions,neighbours:neighbours()});
       return {depth:mesh.geometry.boundingBox.max.z-mesh.geometry.boundingBox.min.z,closed:f.storageRead(),slot:obj.slots[0],sequence:buildSmartObjectInstructionSequence(id,'pick-item')};
     },{id,item});
     assert.deepEqual(geometry.closed.actions,[item.action,`smart-object:::${id}:::pick-item`]);
     await page.evaluate(action=>window.fixture.flushSync(()=>window.fixture.store.getState().triggerAction(action,true)),item.action);
     await new Promise(r=>setTimeout(r,80));
     await page.evaluate(()=>window.fixture.tick(3));
     let read=await page.evaluate(()=>window.fixture.storageRead());assert(Math.abs(read.z+geometry.depth*2/3)<1e-6);assert.deepEqual(read.neighbours,geometry.closed.neighbours);
     await page.evaluate(action=>window.fixture.flushSync(()=>window.fixture.store.getState().triggerAction(action,false)),item.action);await new Promise(r=>setTimeout(r,80));await page.evaluate(()=>window.fixture.tick(3));
     await page.evaluate(({props,action})=>window.fixture.flushSync(()=>window.fixture.setProps({...props,isPreview:true,actionState:{[action]:true}})),{props,action:item.action});
     await new Promise(r=>setTimeout(r,80));
     await page.evaluate(()=>window.fixture.tick(3));read=await page.evaluate(()=>window.fixture.storageRead());
     assert(Math.abs(read.z+geometry.depth*2/3)<1e-6);assert.deepEqual(read.actions,[item.action]);
     assert.equal(await page.evaluate(action=>window.fixture.store.getState().extraStates[action],item.action),false);
     await page.evaluate(props=>window.fixture.flushSync(()=>window.fixture.setProps({...props,isPreview:false})),props);await new Promise(r=>setTimeout(r,80));await page.evaluate(()=>window.fixture.tick(3));
     const runs=await page.evaluate(async({id,item,geometry})=>{
       const f=window.fixture,{default:React}=await import('/node_modules/.vite/deps/react.js'),{default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js');
       const {useAgentController}=await import('/src/features/scene/ai/useAgentController.ts');
       const {setAgentProfile}=await import('/src/features/scene/ai/navigation/obstacles.ts');
       const {getAnimationDef}=await import('/src/features/scene/animations/animationResolver.ts');
       const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
       const clips={};let rig;
       for(const phase of ['pull','search','push']){
         const def=getAnimationDef(item.animationPrefix+'-'+phase);if(def.loop!=='once')throw new Error('Gesture must be one-shot');
         const gltf=await new GLTFLoader().loadAsync('/'+def.path);clips[def.id]=gltf.animations[0];rig??=gltf.scene;
       }
       const render=f.gl.render;f.gl.render=()=>{};const results=[];
       try{for(const interrupted of [false,true]){
         const agentId=id+'-'+interrupted;setAgentProfile(agentId,{radius:15,height:170});
         const host=document.createElement('div');document.body.append(host);const root=ReactDOM.createRoot(host);
         // Door physics lives outside this isolated fixture. Exercise the real
         // cabinet arrival and gestures; door approach/departure is shared with
         // the existing freezer and linen routines.
         const routine=structuredClone(item.shelf==='nw'?geometry.sequence:geometry.sequence.slice(2,-1)),[x,y,z]=geometry.slot.offset;
         let agent,complete=false,playing='',playback=null,lastState;const finished={},seen=new Set(),mixer=new f.THREE.AnimationMixer(rig.clone(true));
         mixer.addEventListener('loop',()=>{throw new Error('Gesture looped');});
         mixer.addEventListener('finished',e=>{const name=e.action.getClip().name;finished[name]=(finished[name]??0)+1;});
         function Probe(){agent=useAgentController(agentId,routine,false,()=>({x,y,z,rotY:geometry.slot.rotY}),()=>{complete=true;});return null;}
         f.flushSync(()=>root.render(React.createElement(Probe)));
         for(let time=0;time<45&&!complete;time+=.05){
           const state=agent.update(.05);lastState=state;seen.add(state.animation);
           if(clips[state.animation]){
             if(playing!==state.animation){playback?.stop();playing=state.animation;playback=mixer.clipAction(clips[playing]).reset().setLoop(f.THREE.LoopOnce,1);playback.clampWhenFinished=true;playback.play();}
             mixer.update(.05);const progress=Math.min(1,playback.time/playback.getClip().duration);agent.reportAnimationPlayback(playing,progress,progress>=1);
           }
           await new Promise(r=>setTimeout(r,0));f.tick(.05);
           const motion=routine.find(step=>step.animation===state.animation)?.dronaMotion;
           if(motion){
             const progress=playback.time/playback.getClip().duration,fraction=Math.max(0,Math.min(1,(progress-motion.range[0])/(motion.range[1]-motion.range[0])));
             if(Math.abs(f.storageRead().z+geometry.depth*2/3*(motion.from+(motion.to-motion.from)*fraction))>1e-6)throw new Error('Drawer motion drifted from clip');
           }
           if(state.animation===item.animationPrefix+'-search'){
             if(Math.abs(f.storageRead().z+geometry.depth*2/3)>1e-6)throw new Error('Search before box is open');
             if(interrupted)break;
           }
         }
         root.unmount();host.remove();await new Promise(r=>setTimeout(r,0));f.tick(3);
         if(!interrupted)for(const phase of ['pull','search','push'])if(finished['drona-'+item.animationPrefix.replace('drona-','')+'-'+phase]!==1)throw new Error('Gesture did not finish exactly once: '+JSON.stringify({id,phase,complete,finished,seen:[...seen]}));
         if(f.storageRead().z!==0||f.store.getState().extraStates[item.action])throw new Error('Storage was not closed on completion/interruption');
         results.push({complete,interrupted,animations:[...seen],status:agent.getStatus(),lastState});
       }}finally{f.gl.render=render;}
       return results;
     },{id,item,geometry});
     for(const run of runs)assert(run.complete||run.interrupted);
     console.log(id,'cell, itemId, two-thirds slide, neighbours, preview, one-shot playback, sync and cleanup: PASS',runs);
   }
   await page.evaluate(()=>window.fixture.flushSync(()=>window.fixture.setProps({layout:true})));
   await page.waitForFunction(async()=>{
     const {positionState}=await import('/src/features/scene/positionState.ts');return positionState['desk1-position']&&positionState['bed-double'];
   });
   const layout=await page.evaluate(async()=>{
     const f=window.fixture,{positionState}=await import('/src/features/scene/positionState.ts');
     const toggle=async(key,value)=>{f.flushSync(()=>f.store.getState().triggerAction(key,value));await new Promise(r=>setTimeout(r,80));};
     const desks=()=>[positionState['desk1-position'].idx,positionState['desk2-position'].idx];
     const initial=desks();await toggle('bed-double',true);const west=desks();
     await toggle('bed-position');await toggle('desk1-position');await toggle('desk2-position');const east=desks();
     await toggle('bed-position');const centred=desks();await toggle('bed-position');const westAgain=desks();
     await toggle('bed-double',false);await toggle('desk1-position');const separate=desks();
     await toggle('bed-position');const separateMoved=desks();await toggle('bed-double',true);const eastDouble=desks();
     return {initial,west,east,centred,westAgain,separate,separateMoved,eastDouble};
   });
   console.log('Desk layouts',layout);
   assert.deepEqual(layout.initial,[0,0]);assert.deepEqual(layout.west,[1,1]);assert.deepEqual(layout.westAgain,[1,1]);
   assert.deepEqual(layout.centred,layout.east);assert.deepEqual(layout.separateMoved,layout.separate);assert.deepEqual(layout.eastDouble,layout.separate);
   assert.deepEqual(errors,[]);console.log('Automatic desk position 2 only when entering west double-bed layout: PASS',layout);
   return;
 }

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
