const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
require('../support/load-ts.cjs');
const T = require('three');
const { DUO_ANIMATIONS } = require('../../src/features/scene/animations/duoAnimations.ts');
const { ANIMATION_DEFINITIONS } = require('../../src/features/scene/animations/animationRegistry.ts');
const { retargetClip } = require('../../src/features/scene/retargeting/retargetClip.ts');
const { ANIMATION_WALK_SPEEDS } = require('../../src/features/scene/ai/agent/agentWalkAnimations.ts');
const { captureAnimationRig, restoreAnimationRig } = require('../../src/features/scene/character/animationSerialization.ts');

it('les clips Miley préservent la source CC et les marches gardent leur transfert de poids et leurs appuis, y compris dans le worker', async t => {
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
   const ungrounded=retargetClip(raw,target,source.scene,undefined,'Foot');
   const result=retargetClip(raw,target,source.scene), worker=retargetClip(raw,restoreAnimationRig(captureAnimationRig(target)),restoreAnimationRig(captureAnimationRig(source.scene)));
   const position=ungrounded.tracks.find(tr=>tr.name===`${targetHip.name}.position`);
   const correctedPosition=result.tracks.find(tr=>tr.name===position.name);
   const workerPosition=worker.tracks.find(tr=>tr.name===position.name);
   assert.deepEqual(workerPosition.values,correctedPosition.values,id+' worker');
   const bindings=raw.tracks.map(tr=>({node:source.scene.getObjectByName(tr.name.split('.')[0]),prop:tr.name.split('.')[1],interp:tr.createInterpolant()}));
   const sample=time=>{for(const {node,prop,interp} of bindings)node[prop].fromArray(interp.evaluate(time));source.scene.updateMatrixWorld(true);};
   sample(0);const rootStart=root.position.clone().applyMatrix4(root.parent.matrixWorld);
   const sourceHip = time => { sample(time); return hips.getWorldPosition(new T.Vector3()).sub(rootStart).sub(sourceRest).multiplyScalar(ratio).add(targetRest); };
   const start=sourceHip(position.times[0]), end=sourceHip(position.times[position.times.length-1]);
   for(const index of [0,Math.floor(position.times.length/4),Math.floor(position.times.length/2),position.times.length-1]) {
    sample(position.times[index]);
    const expected=sourceHip(position.times[index]);
    if(Object.hasOwn(ANIMATION_WALK_SPEEDS,id)) {
     const phase=(position.times[index]-position.times[0])/(position.times[position.times.length-1]-position.times[0]);
     expected.x -= T.MathUtils.lerp(start.x-targetRest.x,end.x-targetRest.x,phase);
     expected.z -= T.MathUtils.lerp(start.z-targetRest.z,end.z-targetRest.z,phase);
    }
    targetHip.position.fromArray(position.values,index*3);target.updateMatrixWorld(true);
    const error=targetHip.getWorldPosition(new T.Vector3()).distanceTo(expected);maximum=Math.max(maximum,error);
    assert.ok(error<.001,`${id}: root error ${error} cm`);
   }
   if(Object.hasOwn(ANIMATION_WALK_SPEEDS,id) && !id.includes('run')) {
    const rig=restoreAnimationRig(captureAnimationRig(target));
    const hip=rig.getObjectByName(targetHip.name);
    // The FK checks above changed the hip; restore the standing bind pose before measuring sole offsets.
    hip.position.copy(hip.defaultPosition); rig.updateMatrixWorld(true);
    const soles=['Left','Right'].flatMap(side=>['Foot','ToeBase'].map(part=>{
     const bone=rig.getObjectByName('mixamorig'+side+part), rest=bone.getWorldPosition(new T.Vector3());
     return {bone,local:bone.worldToLocal(rest.clone().setY(0))};
    }));
    const mixer=new T.AnimationMixer(rig), action=mixer.clipAction(result).setLoop(T.LoopOnce,1).play(); action.clampWhenFinished=true;
    const authored=position.createInterpolant();
    try {
     for(const index of [0,Math.floor(correctedPosition.times.length/4),Math.floor(correctedPosition.times.length/2),correctedPosition.times.length-1]) {
      const time=correctedPosition.times[index]; mixer.setTime(time); rig.updateMatrixWorld(true);
      const expected=new T.Vector3().fromArray(authored.evaluate(time));
      const actual=hip.position;
      assert.ok(Math.abs(actual.x-expected.x)<.001 && Math.abs(actual.z-expected.z)<.001,id+' preserves horizontal weight transfer');
      const floor=Math.min(...soles.map(({bone,local})=>bone.localToWorld(local.clone()).y));
      assert.ok(Math.abs(floor)<.001,`${id}: sole height ${floor} cm`);
     }
    } finally { mixer.stopAllAction(); mixer.uncacheRoot(rig); }
   }
   assert.ok(result.tracks.every(tr=>[...tr.values].every(Number.isFinite)),id);
   assert.equal(result.duration,raw.duration);
  }
  if(duo.animB) assert.ok(Math.abs(durations[0]-durations[1]) <= 2 ** -23 * Math.max(...durations), duo.id+' source sync (Float32 precision)');
 }
 t.diagnostic(`Maximum pelvis trajectory error against source FK: ${maximum.toFixed(6)} cm`);
});
