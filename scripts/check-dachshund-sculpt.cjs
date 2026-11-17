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
   const bounds=[];
   const representative=new Set(['idle 50','walk_fwd 29','run_fwd 13','idle_sit_pose 2','idle_lay_pose 2','jump 22']);
   for(const clip of gltf.animations){
    mixer.stopAllAction();const action=mixer.clipAction(clip).reset().setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();
    for(const fraction of [0,.5,1]){
     mixer.setTime(clip.duration*fraction);scene.updateMatrixWorld(true);
     gltf.scene.traverse(object=>{
      if(!object.isSkinnedMesh)return;
      object.skeleton.update();
      if(object.skeleton.boneMatrices.some(value=>!Number.isFinite(value)))throw Error('Invalid skeleton '+clip.name);
     });
     if(representative.has(clip.name)){
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
  assert.equal(result.length,119);
  const choices=require('../src/features/inventory/dogAnimationOptions.json')['dachshund-sculpt'];
  assert.deepEqual(result.map(c=>c.name).sort(),choices.map(c=>c.value).sort());assert.deepEqual(errors,[]);
  for(const [name,offset] of [['front',[0,.15,1]],['three-quarter',[.7,.35,1]],['back',[-.7,.35,-1]]]){
   await page.evaluate(offset=>{const r=window.review;r.camera.position.copy(r.center).add(new r.T.Vector3(...offset).multiplyScalar(r.span));r.camera.lookAt(r.center);r.renderer.render(r.scene,r.camera);},offset);
   await page.screenshot({path:`public/characters/dachshund-sculpt/${name}.png`});
  }
  require('node:fs').writeFileSync('/tmp/dachshund-review/browser-clips.json',JSON.stringify(result,null,2));
  console.log('PASS: 119 clips sampled; finite skinned bounds; WebGL rendering; no browser errors.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
