// Isolated WebGL check: no Studio load and no external requests.
const assert = require('node:assert/strict');
const launch = require('./browser-test-options.cjs');
(async () => {
 const browser = await launch({args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try {
  const page = await browser.newPage(); const errors=[];
  page.on('pageerror', error=>errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request=> ['localhost','127.0.0.1'].includes(new URL(request.url()).hostname) ? request.continue() : request.abort());
  await page.setViewport({width:800,height:600});
  await page.goto((process.env.ROOM_TEST_URL || 'http://127.0.0.1:5191')+'/AGENTS.md');
  const result=await page.evaluate(async()=>{
   const T=await import('/node_modules/.vite/deps/three.js');
   const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
   const gltf=await new GLTFLoader().loadAsync('/characters/dachshund-sculpt/dog.glb');
   gltf.scene.traverse(object=>{
    if(!object.isSkinnedMesh)return;
    const weights=object.geometry.getAttribute('skinWeight');
    for(let i=0;i<weights.count;i++){
     const sum=weights.getX(i)+weights.getY(i)+weights.getZ(i)+weights.getW(i);
     if(!Number.isFinite(sum)||Math.abs(sum-1)>1e-5)throw Error('Unnormalized weights: '+object.name+' '+i);
    }
   });
   const scene=new T.Scene(); scene.background=new T.Color('#c5cbd1'); scene.add(gltf.scene);
   scene.add(new T.HemisphereLight(0xffffff,0x444444,3));
   const light=new T.DirectionalLight(0xffffff,3);light.position.set(2,3,2);scene.add(light);
   const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(800,600);document.body.replaceChildren(renderer.domElement);
   const mixer=new T.AnimationMixer(gltf.scene); const box=new T.Box3();const point=new T.Vector3();
   const restOffsets=new Map();
   gltf.scene.traverse(object=>{if(object.isBone)restOffsets.set(object.name,object.position.clone());});
   const bounds=[];
   const representative=new Set(['idle 50','walk_fwd 29','run_fwd 13']);
   for(const clip of gltf.animations){
    mixer.stopAllAction();const action=mixer.clipAction(clip).reset().setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();
    for(let sample=0;sample<=Math.ceil(clip.duration*24);sample++){
     mixer.setTime(Math.min(sample/24,clip.duration));scene.updateMatrixWorld(true);
     gltf.scene.traverse(object=>{
      if(!object.isSkinnedMesh)return;
      object.skeleton.update();
      for(const bone of object.skeleton.bones){
       if(bone.name!=='Hips' && restOffsets.has(bone.name) && bone.position.distanceTo(restOffsets.get(bone.name))>1e-5)throw Error('Changing joint offset '+clip.name+' '+bone.name);
       if(bone.scale.distanceTo(new T.Vector3(1,1,1))>1e-5)throw Error('Stretching bone '+bone.name);
      }
      const tail=Array.from({length:7},(_,i)=>gltf.scene.getObjectByName('Tail'+String(i+1).padStart(2,'0')).getWorldPosition(new T.Vector3()));
      for(let i=1;i<tail.length-1;i++)if(tail[i].clone().sub(tail[i-1]).dot(tail[i+1].clone().sub(tail[i]))<=0)throw Error('Reversing tail '+clip.name);
      if(object.skeleton.boneMatrices.some(value=>!Number.isFinite(value)))throw Error('Invalid skeleton '+clip.name);
     });
     if(representative.has(clip.name) && (sample===0 || sample===Math.floor(clip.duration*12) || sample===Math.ceil(clip.duration*24))){
      box.setFromObject(gltf.scene,true);
      if([...box.min,...box.max].some(v=>!Number.isFinite(v)))throw Error('Invalid bounds '+clip.name);
     }
    }
    bounds.push({name:clip.name,duration:clip.duration});
   }
   mixer.stopAllAction();mixer.clipAction(gltf.animations.find(c=>c.name==='idle 50')).play();mixer.setTime(0);scene.updateMatrixWorld(true);box.setFromObject(gltf.scene,true);
   const center=box.getCenter(point);const span=box.getSize(new T.Vector3()).length();
   const camera=new T.PerspectiveCamera(35,800/600,.01,100);camera.position.copy(center).add(new T.Vector3(span*.7,span*.35,span));camera.lookAt(center);renderer.render(scene,camera);
   window.review={T,gltf,mixer,scene,renderer,camera,center:center.clone(),span};
   return bounds;
  });
  assert.deepEqual(result.map(c=>c.name).sort(),['idle 50','run_fwd 13','walk_fwd 29']);
  const choices=require('../src/features/inventory/dogAnimationOptions.json')['dachshund-sculpt'];
  assert.deepEqual(result.map(c=>c.name).sort(),choices.map(c=>c.value).sort());assert.deepEqual(errors,[]);
  require('node:fs').writeFileSync('/tmp/dachshund-review/browser-clips.json',JSON.stringify(result,null,2));
  console.log('PASS: 3 clips sampled at 24 fps; fixed joint offsets and scales; continuous tail; WebGL rendering; no browser errors.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
