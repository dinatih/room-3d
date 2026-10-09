const puppeteer = require('puppeteer');
const assert = require('node:assert/strict');
(async () => {
 const browser = await puppeteer.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try {
 const page = await browser.newPage();
 await page.setViewport({width:1400,height:1000});
 page.on('pageerror',e=>console.log('PAGE ERROR',e.message));
 await page.goto((process.env.ROOM_TEST_URL || 'http://127.0.0.1:5175')+'/AGENTS.md');
 await page.evaluate(async()=>{
 window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
 const THREE = await import('/node_modules/.vite/deps/three.js');
 const {GLTFLoader} = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
 const {DRACOLoader}=await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
 const loader=new GLTFLoader();loader.setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));
 window.robinFixture={THREE,models:{}};
 for(const [id,path] of Object.entries({bird:'/characters/robin/robin.glb',palm:'/items/plant-monstera/potted_palm.glb',yucca:'/items/yucca10329308/Yucca10329308.glb',feeder:'/items/bird_feeder/bird_feeder.glb',box:'/items/vatterso20562909/Vatterso20562909.glb',fence:'/items/fence-panel/fence-panel.glb'})){
  window.robinFixture.models[id]=await loader.loadAsync(path);
 }
 });
 await page.evaluate(async()=>{
 const {default:React}=await import('/node_modules/.vite/deps/react.js');
 const {default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js');
 const {createRoot}=ReactDOM;
 const {Canvas,useThree}=await import('/node_modules/.vite/deps/@react-three_fiber.js');
 const {useGLTF}=await import('/node_modules/.vite/deps/@react-three_drei.js');
 useGLTF.setDecoderPath('/draco/');
 const {GardenFurniture}=await import('/src/features/scene/placements/GardenPlacements.tsx');
 const {PottedPalm}=await import('/src/features/scene/items/PottedPalm.tsx');
 const {PottedYucca}=await import('/src/features/scene/items/PottedYucca.tsx');
 const {BirdFeeder}=await import('/src/features/scene/items/BirdFeeder.tsx');
 const {WoodenFencePanel}=await import('/src/features/scene/items/WoodenFencePanel.tsx');
 const {RobinBird}=await import('/src/features/scene/items/RobinBird.tsx');
 const perches=await import('/src/features/scene/birdPerches.ts');
 const {GARDEN_PANEL_DEFS}=await import('/src/features/scene/wallData.ts');
 const {cameraState}=await import('/src/features/scene/cameraState.ts');
 const {isAppIdle}=await import('/src/features/scene/idleState.ts');
 Object.assign(window.robinFixture,{perches,cameraState,isAppIdle});
 document.body.innerHTML='';document.body.style.margin='0';
 const container=document.createElement('div');container.style.cssText='width:1400px;height:1000px';document.body.append(container);
 const h=React.createElement;
 function Capture(){ const state=useThree(); React.useLayoutEffect(()=>{Object.assign(window.robinFixture,state)},[state]);return null; }
 const stub={item:{},actionState:{},onSize:()=>{}};
 function support(id,kind,position,rotation,Component){return h('group',{position,rotation,userData:{birdSupport:{id,kind},skipMerge:true}},h(Component,stub));}
 const root=createRoot(container);
 root.render(h(Canvas,{frameloop:'never',camera:{position:[520,390,80],near:1,far:2000,fov:48},shadows:true},
 h(Capture),h('ambientLight',{intensity:1.6}),h('directionalLight',{position:[100,400,50],intensity:3,castShadow:true}),
 h(React.Suspense,{fallback:null},h(GardenFurniture),
 support('palm','plant',[100,0,-145],[0,0,0],PottedPalm),
 support('yucca','plant',[155,0,-355],[0,Math.PI,0],PottedYucca),
 support('feeder','feeder',[95,214,-165],[0,0,0],BirdFeeder),
 ...GARDEN_PANEL_DEFS.map((p,i)=>h('group',{key:i,position:[p.cx,p.cy,p.cz],userData:{birdSupport:{id:`fence-${i}`,kind:'fence'}}},h(WoodenFencePanel,{w:p.w,h:p.h,d:p.d}))),
 h('mesh',{position:[150,-3.6,-220],rotation:[-Math.PI/2,0,0],userData:{birdSupport:{id:'garden-ground',kind:'ground'}}},h('planeGeometry',{args:[600,700]}),h('meshStandardMaterial',{color:'#52733d'})),
 h('group',{name:'test-robin'},h(RobinBird))
 )));
 });
 await page.waitForFunction(()=>window.robinFixture.scene?.getObjectByName('test-robin')?.children[0]?.children.length===1,{timeout:60000});
 console.log('SCENE LOADED');
 const result=await page.evaluate(()=>{
 const f=window.robinFixture,{THREE,scene,perches}=f;
 scene.updateMatrixWorld(true);
 const group=scene.getObjectByName('test-robin').children[0];
 const content=group.children[0];
 group.visible=true;
 const contact=new perches.RobinFootContact(content);
 const feet=contact.ground(group,content);
 f.feet=feet;f.contact=contact;f.bird=group;
 const ids=[];scene.traverse(o=>{if(o.userData.birdSupport)ids.push(o.userData.birdSupport.id)});
 const report=[];
 f.chosen=[];
 for(const id of ids){
 const start=performance.now();
 const perch=perches.chooseBirdPerch(scene,feet,null,id);
 const position=new THREE.Vector3(),rotation=new THREE.Quaternion();
 if(!perch || perch.descriptor.id!==id){report.push({id,error:'No support',chosen:perch?.descriptor.id,ms:performance.now()-start});continue;}
 if(!perches.resolveBirdPerch(perch,scene,feet,position,rotation))throw Error(id+' invalid');
 f.chosen.push(perch);
 report.push({id,position:position.toArray(),ms:performance.now()-start});
 }
 return report;
 });
 console.log(JSON.stringify(result,null,2));
 assert(result.every(r=>!r.error),'every support must have an actual perch');
 await page.evaluate(()=>{
 const f=window.robinFixture;f.camera.lookAt(150,75,-220);f.advance(0,true);
 f.perches.resolveBirdPerch(f.chosen.find(p=>p.descriptor.id==='chest'),f.scene,f.feet,f.bird.position,f.bird.quaternion);f.bird.visible=true;f.contact.ground(f.bird,f.bird.children[0]);f.gl.render(f.scene,f.camera);
 });
 await page.screenshot({path:'/tmp/robin-garden-perches.png'});
 for(const id of ['chest','sofa-west','sofa-east','bathtub','palm','yucca','storage','feeder','fence-0','garden-ground']){
 await page.evaluate(id=>{const f=window.robinFixture;const perch=f.chosen.find(p=>p.descriptor.id===id);
 f.perches.resolveBirdPerch(perch,f.scene,f.feet,f.bird.position,f.bird.quaternion);f.contact.ground(f.bird,f.bird.children[0]);f.bird.visible=true;
 const p=f.bird.position;f.camera.position.copy(p).add(new f.THREE.Vector3(32,19,32));f.camera.lookAt(p.clone().add(new f.THREE.Vector3(0,5,0)));f.gl.render(f.scene,f.camera);
 },id);
 await page.screenshot({path:`/tmp/robin-${id}-contact.png`});
 }
 const animated = await page.evaluate(() => {
   const f=window.robinFixture,{THREE,perches,scene,bird,contact}=f;
   const perch=f.chosen.find(p=>p.descriptor.id==='chest');
   const mixer=new THREE.AnimationMixer(bird.children[0]);
   let maxGap=0;
   for(const name of ['Robin_Bird_Idle','Robin_Bird_Idle2','Robin_Bird_Call','Robin_Bird_Eat']) {
     const clip=f.models.bird.animations.find(a=>a.name===name);
     mixer.stopAllAction();mixer.clipAction(clip).play();
     for(const fraction of [0,0.25,0.5,0.75]) {
       mixer.setTime(clip.duration*fraction);
       const feet=contact.ground(bird,bird.children[0]);
       if(!perches.resolveBirdPerch(perch,scene,feet,bird.position,bird.quaternion)) throw Error(name+' does not fit');
       contact.ground(bird,bird.children[0]);bird.updateMatrixWorld(true);
       const min={L:Infinity,R:Infinity};
       bird.traverse(mesh=>{
         if(!mesh.isSkinnedMesh)return;mesh.skeleton.update();
         const indices=mesh.geometry.attributes.skinIndex,weights=mesh.geometry.attributes.skinWeight;
         for(let i=0;i<indices.count;i++) {
           const total={L:0,R:0};
           for(let k=0;k<4;k++) {
             const name=mesh.skeleton.bones[indices.getComponent(i,k)].name;
             if(/^[LR]_Digit/.test(name))total[name[0]]+=weights.getComponent(i,k);
           }
           for(const side of ['L','R']) if(total[side]>0.5) {
             const p=mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld);
             min[side]=Math.min(min[side],p.y);
           }
         }
       });
       maxGap=Math.max(maxGap,Math.abs(min.L-62),Math.abs(min.R-62));
     }
   }
   mixer.stopAllAction();
   const roots=[];scene.traverse(o=>{if(o.userData.birdSupport)roots.push(o)});
   roots.forEach(o=>o.visible=false);
   const unavailable=perches.chooseBirdPerch(scene,f.feet)===null;
   roots.forEach(o=>o.visible=true);
   return {maxGap,unavailable};
 });
 assert(animated.maxGap<0.05,`animated toes contact the bench: ${animated.maxGap}cm`);
 assert(animated.unavailable,'hidden supports cannot be selected');
 console.log('Animated foot contact and hidden-support checks passed:',animated);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
