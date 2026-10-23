const fs = require('node:fs');
require('../tests/support/load-ts.cjs');
const THREE = require('three');
const { retargetClip } = require('../src/features/scene/retargeting/retargetClip.ts');
const { resolveTargetBoneName } = require('../src/features/scene/retargeting/boneResolver.ts');
(async()=>{
 const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
 const loader = new GLTFLoader(); loader.setDRACOLoader({preload(){}}); loader.register(()=>({name:'SkeletonOnly',loadMesh:()=>Promise.resolve(new THREE.Group())}));
 async function read(path){const b=fs.readFileSync(path);return loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
 const rows=[];
 for(const variant of ['a','b','c']) {
  const source=await read(variant === 'a' && process.argv[2] ? process.argv[2] : `public/animations/npz/moyo/anim_yoga_bharadvajas_twist_pose_or_bharadvajasana_i_${variant}.glb`);
  source.animations[0].name=`yoga-bharadvajas-twist-pose-or-bharadvajasana-i-${variant}`;
  for(const model of ['source','lara/lara_native','ybot/ybot']) {
   const target=model==='source'?source.scene:(await read(`public/characters/${model}.glb`)).scene;
   target.updateMatrixWorld(true);target.traverse(n=>{n.defaultPosition=n.position.clone();n.restLocalQuaternion=n.quaternion.clone();n.restWorldQuaternion=n.getWorldQuaternion(new THREE.Quaternion());});
   const bones=['Hips','LeftFoot','LeftToeBase','RightFoot','RightToeBase'].map(name=>target.getObjectByName(resolveTargetBoneName(target,name)));
   const clip=model==='source'?source.animations[0]:retargetClip(source.animations[0],target,source.scene);
   const mixer=new THREE.AnimationMixer(target);mixer.clipAction(clip).setLoop(THREE.LoopOnce,1).play().clampWhenFinished=true;
   const frames=[];
   for(let f=0;f<=Math.floor(clip.duration*30);f++) {mixer.setTime(f/30);target.updateMatrixWorld(true);frames.push(bones.map(b=>b.getWorldPosition(new THREE.Vector3()).toArray()));}
   rows.push({variant,model,frames});
   const drift = Math.hypot(frames[39][4][0]-frames[0][4][0], frames[39][4][2]-frames[0][4][2]);
   if (frames.flat(2).some(value => !Number.isFinite(value))) throw Error(`Invalid trajectory: ${variant} / ${model}`);
   if (variant === 'a' && model === 'source' && !process.argv[2]) {
    const hold = require('./correct-yoga-foot-support.cjs').CONTACT.hold;
    for (let i = 0; i <= Math.round(hold * 30); i++) if (Math.hypot(frames[i][4][0]-frames[0][4][0], frames[i][4][2]-frames[0][4][2]) > 1e-6) throw Error('Initial right toe support is sliding');
   }
   console.log(variant,model,'initial right toe drift cm:',(drift*100).toFixed(3));
   mixer.stopAllAction();mixer.uncacheRoot(target);
  }
 }
 fs.writeFileSync(process.env.YOGA_FOOT_REPORT || '/tmp/yoga-foot-slip.json',JSON.stringify(rows));
})().catch(e=>{console.error(e);process.exitCode=1;});
