const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
require('../support/load-ts.cjs');
const T = require('three');
const { DUO_ANIMATIONS } = require('../../src/features/scene/animations/duoAnimations.ts');
const { ANIMATION_DEFINITIONS } = require('../../src/features/scene/animations/animationRegistry.ts');
const { retargetClip } = require('../../src/features/scene/retargeting/retargetClip.ts');
const { captureAnimationRig, restoreAnimationRig } = require('../../src/features/scene/character/animationSerialization.ts');

it('les 172 clips Miley (duos et solos) respectent la source CC, y compris dans le worker', async t => {
 const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
 const loader = new GLTFLoader(); loader.setDRACOLoader({preload(){}}); loader.register(()=>({name:'SkeletonOnly',loadMesh:()=>Promise.resolve(new T.Group())}));
 const read = async path => {const b=fs.readFileSync('public/'+path);return loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
 const duos=DUO_ANIMATIONS.filter(d=>d.animA.startsWith('miley-')&&d.animB.startsWith('miley-'));
 assert.equal(duos.length,29);
 const paired=new Set(DUO_ANIMATIONS.flatMap(d=>[d.animA,d.animB]));
 const solos=ANIMATION_DEFINITIONS.filter(d=>d.path.startsWith('animations/miley/')&&!paired.has(d.id));
 assert.equal(solos.length,114);
 const entries=[...duos,...solos.map(def=>({id:def.id,animA:def.id}))];
 let maximum=0;
 for(const duo of entries) {
  const durations=[];
  for(const id of [duo.animA,...(duo.animB?[duo.animB]:[])]) {
   const def=ANIMATION_DEFINITIONS.find(d=>d.id===id), source=await read(def.path), raw=source.animations[0];raw.name=id;durations.push(raw.duration);
   const target=(await read('characters/xbot/Xbot_official.glb')).scene;target.scale.multiplyScalar(100);target.updateMatrixWorld(true);
   target.traverse(n=>{n.defaultPosition=n.position.clone();n.restLocalQuaternion=n.quaternion.clone();n.restWorldQuaternion=n.getWorldQuaternion(new T.Quaternion());});
   source.scene.updateMatrixWorld(true);
   const hips=source.scene.getObjectByName('CC_Base_Hip'), root=source.scene.getObjectByName('CC_Base_BoneRoot'), targetHip=target.getObjectByName('mixamorigHips');
   const sourceRest=hips.getWorldPosition(new T.Vector3()), targetRest=targetHip.getWorldPosition(new T.Vector3()), ratio=targetRest.length()/sourceRest.length();
   const result=retargetClip(raw,target,source.scene), worker=retargetClip(raw,restoreAnimationRig(captureAnimationRig(target)),restoreAnimationRig(captureAnimationRig(source.scene)));
   const position=result.tracks.find(tr=>tr.name===`${targetHip.name}.position`);
   const workerPosition=worker.tracks.find(tr=>tr.name===position.name);
   assert.deepEqual(workerPosition.values,position.values,id+' worker');
   const bindings=raw.tracks.map(tr=>({node:source.scene.getObjectByName(tr.name.split('.')[0]),prop:tr.name.split('.')[1],interp:tr.createInterpolant()}));
   const sample=time=>{for(const {node,prop,interp} of bindings)node[prop].fromArray(interp.evaluate(time));source.scene.updateMatrixWorld(true);};
   sample(0);const rootStart=root.position.clone().applyMatrix4(root.parent.matrixWorld);
   for(const index of [0,Math.floor(position.times.length/4),Math.floor(position.times.length/2),position.times.length-1]) {
    sample(position.times[index]);
    const expected=hips.getWorldPosition(new T.Vector3()).sub(rootStart).sub(sourceRest).multiplyScalar(ratio).add(targetRest);
    targetHip.position.fromArray(position.values,index*3);target.updateMatrixWorld(true);
    const error=targetHip.getWorldPosition(new T.Vector3()).distanceTo(expected);maximum=Math.max(maximum,error);
    assert.ok(error<.001,`${id}: root error ${error} cm`);
   }
   assert.ok(result.tracks.every(tr=>[...tr.values].every(Number.isFinite)),id);
   assert.equal(result.duration,raw.duration);
  }
  if(duo.animB) assert.ok(Math.abs(durations[0]-durations[1]) <= 2 ** -23 * Math.max(...durations), duo.id+' source sync (Float32 precision)');
 }
 t.diagnostic(`Maximum pelvis trajectory error against source FK: ${maximum.toFixed(6)} cm`);
});
