// Render the 29 pairs using the application's clips, offsets and orientation.
const fs = require('node:fs');
const launchBrowser = require('./browser-test-options.cjs');
(async () => {
 const solo=process.argv.includes('--solo'), batchIndex=process.argv.indexOf('--interx-batch');
 const batch=batchIndex<0?null:JSON.parse(fs.readFileSync(`scripts/interx-review-batch-${String(Number(process.argv[batchIndex+1])).padStart(3,'0')}.json`));
 const stem=batch?`interx-review-batch-${String(batch.batch).padStart(3,'0')}`:solo?'miley-solos':'miley-duos';
 const browser = await launchBrowser({args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try {
  const page = await browser.newPage(); await page.setViewport({width:1800,height:1500});
  page.on('pageerror',e=>console.error(e));
  await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5173'}/AGENTS.md`);
  const report = await page.evaluate(async ({solo,batch}) => {
   const T=await import('/node_modules/three/build/three.module.js');
   const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
   const {DUO_ANIMATIONS}=await import('/src/features/scene/animations/duoAnimations.ts');
   const {ANIMATION_DEFINITIONS}=await import('/src/features/scene/animations/animationRegistry.ts');
   const {retargetClip}=await import('/src/features/scene/retargeting/retargetClip.ts');
   const duos=DUO_ANIMATIONS.filter(d=>d.animA.startsWith('miley-')&&d.animB.startsWith('miley-'));
   const paired=new Set(DUO_ANIMATIONS.flatMap(d=>[d.animA,d.animB]));
   const entries=batch?batch.ids.map(id=>{const duo=DUO_ANIMATIONS.find(d=>d.id===id);if(!duo)throw Error(`Missing duo ${id}`);return duo;}):solo?ANIMATION_DEFINITIONS.filter(d=>d.path.startsWith('animations/miley/')&&!paired.has(d.id)).map(d=>({id:d.id,label:d.label,animA:d.id})):duos;
   const height=Math.ceil(entries.length/6)*300;
   const loader=new GLTFLoader(), sourceLoader=new GLTFLoader(); sourceLoader.register(()=>({name:'SkeletonOnly',loadMesh:()=>Promise.resolve(new T.Group())}));
   const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1800,height);renderer.setScissorTest(true);
   document.body.replaceChildren(renderer.domElement);document.body.style.margin='0';
   const scene=new T.Scene();scene.background=new T.Color(0xdddddd);scene.add(new T.HemisphereLight(0xffffff,0x777777,3));
   const sun=new T.DirectionalLight(0xffffff,3);sun.position.set(200,300,200);scene.add(sun);scene.add(new T.GridHelper(2000,100));
   const camera=new T.OrthographicCamera(-200,200,200,-200,1,5000), rows=[];
   for(const [index,duo] of entries.entries()) {
    const group=new T.Group(), actors=[];
    for(const [role,id] of [duo.animA,...(duo.animB?[duo.animB]:[])].entries()) {
     const def=ANIMATION_DEFINITIONS.find(d=>d.id===id),source=await sourceLoader.loadAsync('/'+def.path);
     const model=(await loader.loadAsync('/characters/xbot/Xbot_official.glb')).scene;
     model.scale.multiplyScalar(100);model.updateMatrixWorld(true);
     model.traverse(n=>{n.defaultPosition=n.position.clone();n.restLocalQuaternion=n.quaternion.clone();n.restWorldQuaternion=n.getWorldQuaternion(new T.Quaternion());});
     source.animations[0].name=id;const clip=retargetClip(source.animations[0],model,source.scene,def.rootMotionSpace);
     if(!clip.tracks.every(tr=>[...tr.values].every(Number.isFinite)))throw Error(`Invalid clip: ${id}`);
     const bindings=clip.tracks.map(tr=>({node:model.getObjectByName(tr.name.split('.')[0]),prop:tr.name.split('.')[1],interp:tr.createInterpolant()}));
     const sample=time=>{for(const {node,prop,interp}of bindings)node[prop].fromArray(interp.evaluate(time));model.updateMatrixWorld(true);model.traverse(n=>{if(n.isSkinnedMesh){n.skeleton.update();n.computeBoundingSphere();}});};
     const root=new T.Group(),origin=new T.Group();origin.rotation.y=def.defaultRotYOffset || 0;origin.add(model);root.add(origin);
     if(role){root.position.fromArray(duo.offsetB || [0,0,0]);root.rotation.y=duo.rotB || 0;model.traverse(n=>{if(n.isMesh){n.material=n.material.clone();n.material.color.set(0x68a6cc);}});}
     group.add(root);actors.push({sample,clip});
    }
    const duration=actors[0].clip.duration;
    for(const fraction of [0,.25,.5,.75,1])for(const actor of actors)actor.sample(Math.min(duration*fraction,actor.clip.duration));
    for(const actor of actors)actor.sample(Math.min(duration/2,actor.clip.duration));
    scene.add(group);group.updateMatrixWorld(true);
    const bounds=new T.Box3().setFromObject(group,true),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
    const span=Math.max(size.x,size.y,size.z);camera.left=-span*.7;camera.right=span*.7;camera.top=span*.7;camera.bottom=-span*.7;camera.updateProjectionMatrix();camera.position.copy(center).add(new T.Vector3(500,250,500));camera.lookAt(center);
    const x=index%6*300,y=height-300-Math.floor(index/6)*300;renderer.setViewport(x,y,300,300);renderer.setScissor(x,y,300,300);renderer.render(scene,camera);scene.remove(group);
    const label=document.createElement('div');label.textContent=solo?duo.label.replace(/^\[MILEY\]\s*/,'').replace(/\s*\(\d+f.*$/,''):duo.label;label.style.cssText=`position:absolute;left:${x+5}px;top:${height-y-295}px;width:${300-10}px;font:14px sans-serif`;document.body.append(label);
    rows.push({id:duo.id,durations:actors.map(a=>a.clip.duration),boundsCm:size.toArray()});
   }
   return rows;
  }, {solo,batch});
  fs.writeFileSync(`/tmp/${stem}-browser.json`,JSON.stringify(report,null,2));
  await page.screenshot({path:`/tmp/${stem}-contact-sheet.png`,fullPage:true});
  console.log(`${report.length} ${solo?'solo':'paired'} playbacks: /tmp/${stem}-contact-sheet.png`);
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
