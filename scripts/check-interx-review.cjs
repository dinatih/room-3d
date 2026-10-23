// Numeric review against independently read NPZ sources, one frozen batch.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const T = require('three');
require('../tests/support/load-ts.cjs');
const { retargetClip } = require('../src/features/scene/retargeting/retargetClip.ts');
const { captureAnimationRig, restoreAnimationRig } = require('../src/features/scene/character/animationSerialization.ts');
(async () => {
 const batchIndex=process.argv.indexOf('--batch');
 const batch=Number(batchIndex<0?1:process.argv[batchIndex+1]);
 assert.ok(Number.isInteger(batch)&&batch>0,'Expected a positive --batch number');
 const reference=JSON.parse(fs.readFileSync(`/tmp/interx-review-batch-${String(batch).padStart(3,'0')}-reference.json`));
 const { GLTFLoader }=await import('three/examples/jsm/loaders/GLTFLoader.js');
 const loader=new GLTFLoader();loader.setDRACOLoader({preload(){}});loader.register(()=>({name:'SkeletonOnly',loadMesh:()=>Promise.resolve(new T.Group())}));
 const read=async file=>{const b=fs.readFileSync('public/'+file);return loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
 const report=[];
 for(const entry of reference.duos) {
  const actors=[];
  for(const actor of entry.actors) {
   const {scene:source,animations:[raw]}=await read(actor.path);raw.name=`${entry.id}-${actor.person}`;
   const measurements=[];
   for(const scale of [75,100,150]) {
    const {scene:target}=await read('characters/xbot/Xbot_official.glb');target.scale.multiplyScalar(scale);target.updateMatrixWorld(true);
    target.traverse(n=>{n.defaultPosition=n.position.clone();n.restLocalQuaternion=n.quaternion.clone();n.restWorldQuaternion=n.getWorldQuaternion(new T.Quaternion());});
    const hips=target.getObjectByName('mixamorigHips'), rest=hips.getWorldPosition(new T.Vector3());
    const result=retargetClip(raw,target,source,'world-meters');
    const position=result.tracks.find(t=>t.name===`${hips.name}.position`), rotation=result.tracks.find(t=>t.name===`${hips.name}.quaternion`).createInterpolant();
    assert.equal(position.times.length,actor.trans.length,raw.name+' frame count');
    assert.equal(result.duration,raw.duration,raw.name+' duration');
    assert.ok(result.tracks.every(t=>[...t.values].every(Number.isFinite)),raw.name+' finite');
    if(scale===100) {
     const worker=retargetClip(raw,restoreAnimationRig(captureAnimationRig(target)),restoreAnimationRig(captureAnimationRig(source)),'world-meters');
     for(let i=0;i<result.tracks.length;i++)assert.deepEqual(worker.tracks[i].values,result.tracks[i].values,raw.name+' worker');
    }
    let maximum=0, orientationError=0;
    const first=new T.Vector3().fromArray(position.values).applyMatrix4(hips.parent.matrixWorld);
    assert.ok(first.distanceTo(rest)<.001,raw.name+' unexpected first-frame pelvis offset');
    for(let frame=0;frame<position.times.length;frame++) {
     const actual=new T.Vector3().fromArray(position.values,frame*3).applyMatrix4(hips.parent.matrixWorld).sub(first);
     const expected=new T.Vector3(...actor.trans[frame]).sub(new T.Vector3(...actor.trans[0])).multiplyScalar(100);
     maximum=Math.max(maximum,actual.distanceTo(expected));
     assert.ok(actual.distanceTo(expected)<(100+actual.length()+expected.length())*2**-19,`${raw.name}: metric root frame ${frame}`);
     const vector=new T.Vector3(...actor.root[frame]), q=new T.Quaternion().setFromAxisAngle(vector.clone().normalize(),vector.length()).multiply(hips.restWorldQuaternion);
     const actualQ=hips.parent.getWorldQuaternion(new T.Quaternion()).multiply(new T.Quaternion().fromArray(rotation.evaluate(position.times[frame])));
     orientationError=Math.max(orientationError,actualQ.normalize().angleTo(q.normalize()));
     assert.ok(orientationError<.0002,raw.name+' root orientation');
    }
    measurements.push({scale,maxRootErrorCm:maximum,maxOrientationErrorRadians:orientationError,initialPelvisBiasCm:first.clone().sub(rest).toArray()});
   }
   actors.push({person:actor.person,measurements});
  }
  report.push({id:entry.id,actionCode:entry.actionCode,actors});
  console.log(`${report.length}/${reference.duos.length} ${entry.id}`);
 }
 const output=`/tmp/interx-review-batch-${String(batch).padStart(3,'0')}-numeric.json`;
 fs.writeFileSync(output,JSON.stringify(report,null,2));
 const biased=report.flatMap(d=>d.actors.filter(a=>Math.abs(a.measurements[1].initialPelvisBiasCm[1])>.0001).map(a=>({id:d.id,action:d.actionCode,person:a.person,biasY:a.measurements[1].initialPelvisBiasCm[1]})));
 console.log(JSON.stringify({duos:report.length,clips:report.length*2,maximumRootErrorCm:Math.max(...report.flatMap(d=>d.actors.flatMap(a=>a.measurements.map(m=>m.maxRootErrorCm)))),biased,output}));
})().catch(e=>{console.error(e);process.exitCode=1});
