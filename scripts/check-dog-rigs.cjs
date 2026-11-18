// One isolated browser load: donor catalog, both new skins, then scene component.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const launch = require('./browser-test-options.cjs');
const catalog = require('../src/features/inventory/dogAnimationOptions.json');
(async () => {
 const browser=await launch({args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try {
  const page=await browser.newPage();const errors=[];const blocked=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request',request=>{
   const u=new URL(request.url());
   if(['data:','blob:'].includes(u.protocol)||['localhost','127.0.0.1'].includes(u.hostname))return request.continue();
   blocked.push(u.origin+u.pathname);return request.abort();
  });
  await page.setViewport({width:800,height:600});
  await page.goto((process.env.ROOM_TEST_URL||'http://127.0.0.1:5191')+'/AGENTS.md');
  const results=await page.evaluate(async()=>{
   const T=await import('/node_modules/.vite/deps/three.js');
   const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
   const results=[];
   const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(800,600);document.body.replaceChildren(renderer.domElement);
   for(const [id,file] of [['dachshund-sculpt','dog.glb'],['ushiro','ushiro.glb']]){
    const gltf=await new GLTFLoader().loadAsync('/characters/'+id+'/'+file);
    const skinned=[];const offsets=new Map();
    gltf.scene.traverse(o=>{
     if(o.isBone)offsets.set(o.name,o.position.clone());
     if(!o.isSkinnedMesh)return;
     skinned.push(o);const weights=o.geometry.getAttribute('skinWeight');
     for(let i=0;i<weights.count;i++){
      const sum=weights.getX(i)+weights.getY(i)+weights.getZ(i)+weights.getW(i);
      if(!Number.isFinite(sum)||Math.abs(sum-1)>1e-5)throw Error(id+': invalid weights '+i);
     }
    });
    if(!gltf.scene.getObjectByName('Head')||!gltf.scene.getObjectByName('Muzzle'))throw Error('Camera markers missing: '+id);
    if(id==='ushiro'&&gltf.scene.getObjectByName('head_jnt40'))throw Error('Old rig retained');
    const mixer=new T.AnimationMixer(gltf.scene);const box=new T.Box3();const clips=[];
    const referenceHeight=new T.Box3().setFromObject(gltf.scene,true).getSize(new T.Vector3()).y;
    const groundTolerance=referenceHeight*(.01/(id==='ushiro'?40:30));
    for(const clip of gltf.animations){
     let minimumGround=Infinity;
     mixer.stopAllAction();const a=mixer.clipAction(clip).reset().setLoop(T.LoopOnce,1);a.clampWhenFinished=true;a.play();
     for(let sample=0;sample<=Math.ceil(clip.duration*24);sample++){
      mixer.setTime(Math.min(sample/24,clip.duration));gltf.scene.updateMatrixWorld(true);
      for(const mesh of skinned){
       mesh.skeleton.update();
       if(mesh.skeleton.boneMatrices.some(x=>!Number.isFinite(x)))throw Error('Invalid skeleton: '+id+' '+clip.name);
       for(const bone of mesh.skeleton.bones){
        if(bone.name!=='Hips'&&offsets.has(bone.name)&&bone.position.distanceTo(offsets.get(bone.name))>1e-5)throw Error('Changing joint length: '+id+' '+clip.name+' '+bone.name);
        if(bone.scale.distanceTo(new T.Vector3(1,1,1))>1e-5)throw Error('Stretching: '+id+' '+clip.name);
       }
      }
      if(['idle_sit_pose 2','idle_lay_pose 2','jump 22','idle_sit_one_off_scratch 176'].includes(clip.name)){
       box.setFromObject(gltf.scene,true);minimumGround=Math.min(minimumGround,box.min.y);
       if(box.min.y < -groundTolerance)throw Error('Skin below ground: '+id+' '+clip.name+' '+box.min.y+' tolerance '+groundTolerance);
      }
      if(id==='dachshund-sculpt'&&['idle 50','walk_fwd 29','run_fwd 13'].includes(clip.name)){
       const tail=Array.from({length:7},(_,i)=>gltf.scene.getObjectByName('Tail'+String(i+1).padStart(2,'0')).getWorldPosition(new T.Vector3()));
       for(let i=1;i<tail.length-1;i++)if(tail[i].clone().sub(tail[i-1]).dot(tail[i+1].clone().sub(tail[i]))<=0)throw Error('Tail folds: '+clip.name);
      }
     }
     if(['idle 50','walk_fwd 29','run_fwd 13','idle_sit_pose 2','idle_lay_pose 2','jump 22'].includes(clip.name)){
      box.setFromObject(gltf.scene,true);if([...box.min,...box.max].some(x=>!Number.isFinite(x)))throw Error('Invalid skin bounds');
     }
     clips.push({name:clip.name,duration:clip.duration,minimumGround:Number.isFinite(minimumGround)?minimumGround:undefined});
    }
    mixer.stopAllAction();mixer.clipAction(gltf.animations.find(c=>c.name==='idle 50')).reset().play();mixer.setTime(0);gltf.scene.updateMatrixWorld(true);
    const scene=new T.Scene();scene.add(gltf.scene,new T.HemisphereLight(0xffffff,0x444444,3));scene.background=new T.Color('#c5cbd1');
    const light=new T.DirectionalLight(0xffffff,3);light.position.set(2,3,2);scene.add(light);
    box.setFromObject(gltf.scene,true);const center=box.getCenter(new T.Vector3());const span=box.getSize(new T.Vector3()).length();
    const camera=new T.PerspectiveCamera(35,800/600,.01,100);camera.position.copy(center).add(new T.Vector3(span*.7,span*.35,span));camera.lookAt(center);renderer.render(scene,camera);
    results.push({id,clips,bones:offsets.size});
    gltf.scene.traverse(o=>{if(o.isMesh)o.geometry.dispose();});
   }
   renderer.dispose();return results;
  });
  for(const result of results){
   assert.deepEqual(result.clips.map(c=>c.name).sort(),catalog['animated-pitbull-dog'].map(c=>c.value).sort());
   assert.deepEqual(result.clips.map(c=>c.name).sort(),catalog[result.id].map(c=>c.value).sort());
   console.log('PASS',result.id,result.clips.length,'clips at 24 fps;',result.bones,'new bones; normalized skin, fixed offsets/scales.');
  }
  // Mount Ushiro's actual scene component so idle/rest mapping and FPV skin
  // discovery are exercised too, without loading the Studio or its layers.
  await page.evaluate(async()=>{
   (await import('/@react-refresh')).default.injectIntoGlobalHook(window);
   window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
   const React=(await import('/node_modules/.vite/deps/react.js')).default;
   const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
   const {Canvas,useFrame}=await import('/node_modules/.vite/deps/@react-three_fiber.js');
   const metadata=await (await fetch('/node_modules/.vite/deps/_metadata.json')).json();
   const {useGLTF}=await import('/node_modules/.vite/deps/@react-three_drei.js?v='+metadata.browserHash);
   useGLTF.setDecoderPath('/draco/');
   const {ShibaInu}=await import('/src/features/scene/items/ShibaInu.tsx');
   const {NavigationEnabledContext}=await import('/src/features/scene/ai/navigation/NavigationContext.ts');
   const {cameraState}=await import('/src/features/scene/cameraState.ts');
   function Ready(){useFrame(()=>{if(cameraState.animalViews.shiba)window.__shibaReady=true;});return null;}
   const container=document.createElement('div');container.style.cssText='width:800px;height:600px';document.body.replaceChildren(container);
   const e=React.createElement;
   createRoot(container).render(e(Canvas,{camera:{position:[180,60,80],far:2000}},e(React.Suspense,{fallback:null},e(NavigationEnabledContext.Provider,{value:false},e(ShibaInu),e(Ready)))));
  });
  await page.waitForFunction(()=>window.__shibaReady,{timeout:30000});
  fs.writeFileSync('/tmp/dog-rig-blocked.json',JSON.stringify(blocked,null,2));
  assert.deepEqual(errors,[]);
  fs.mkdirSync('/tmp/dog-rig-review',{recursive:true});fs.writeFileSync('/tmp/dog-rig-review/browser-report.json',JSON.stringify(results,null,2));
  console.log('PASS Ushiro scene component, default animation and animal camera; no browser errors.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
