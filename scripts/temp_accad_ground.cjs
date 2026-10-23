const fs = require('node:fs');
const T = require('three');
(async () => {
 const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
 const loader = new GLTFLoader(); loader.setDRACOLoader({preload(){}}); loader.register(()=>({name:'SkeletonOnly',loadMesh:()=>Promise.resolve(new T.Group())}));
 for (const file of fs.readdirSync('public/animations/npz/accad')) {
  const bytes=fs.readFileSync('public/animations/npz/accad/'+file);
  const {scene,animations:[clip]}=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  scene.updateMatrixWorld(true);
  const feet=['Left','Right'].map(side=>{const foot=scene.getObjectByName('mixamorig'+side+'Foot'),toe=scene.getObjectByName('mixamorig'+side+'ToeBase');const a=foot.getWorldPosition(new T.Vector3()),t=toe.getWorldPosition(new T.Vector3());return {foot,toe,heel:foot.worldToLocal(new T.Vector3(a.x,t.y,a.z))};});
  const mixer=new T.AnimationMixer(scene);const action=mixer.clipAction(clip).setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();
  const floor=time=>{action.reset().play();mixer.setTime(time);scene.updateMatrixWorld(true);return Math.min(...feet.flatMap(({foot,toe,heel})=>[foot.localToWorld(heel.clone()).y,toe.getWorldPosition(new T.Vector3()).y]))*100;};
  const times=clip.tracks.find(t=>t.name==='mixamorigHips.position').times,values=Array.from(times,floor);
  console.log(JSON.stringify({file,firstCm:floor(0),frame61Cm:floor(61/30),minCm:Math.min(...values),maxCm:Math.max(...values)}));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
