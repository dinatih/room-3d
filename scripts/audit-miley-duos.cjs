// Reproducible source/retargeting audit; reports remain in /tmp.
const fs = require('node:fs');
const T = require('three');
require('../tests/support/load-ts.cjs');
const { DUO_ANIMATIONS } = require('../src/features/scene/animations/duoAnimations.ts');
const { ANIMATION_DEFINITIONS } = require('../src/features/scene/animations/animationRegistry.ts');
const { retargetClip } = require('../src/features/scene/retargeting/retargetClip.ts');
const { resolveTargetBoneName } = require('../src/features/scene/retargeting/boneResolver.ts');
(async () => {
 const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
 const loader = new GLTFLoader(); loader.setDRACOLoader({preload(){}}); loader.register(()=>({name:'SkeletonOnly',loadMesh:()=>Promise.resolve(new T.Group())}));
 const read = async file => { const b=fs.readFileSync('public/'+file); return loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),''); };
 const duos=DUO_ANIMATIONS.filter(d=>d.animA.startsWith('miley-')&&d.animB.startsWith('miley-'));
 const report=[];
 for(const duo of duos){
  const actors=[];
  for(const id of [duo.animA,duo.animB]){
   const def=ANIMATION_DEFINITIONS.find(d=>d.id===id), source=await read(def.path), raw=source.animations[0];raw.name=id;
   const target=(await read('characters/xbot/Xbot_official.glb')).scene;target.scale.multiplyScalar(100);target.updateMatrixWorld(true);
   target.traverse(n=>{n.defaultPosition=n.position.clone();n.restLocalQuaternion=n.quaternion.clone();n.restWorldQuaternion=n.getWorldQuaternion(new T.Quaternion());});
   source.scene.updateMatrixWorld(true);
   const describe=scene=>['Hips','LeftFoot','RightFoot'].map(part=>{const cc={Hips:'CC_Base_Hip',LeftFoot:'CC_Base_L_Foot',RightFoot:'CC_Base_R_Foot'};const n=scene.getObjectByName(cc[part]) || scene.getObjectByName(resolveTargetBoneName(scene,part));return {part,name:n?.name,rest:n?.getWorldPosition(new T.Vector3()).toArray()};});
   const sourceRest=describe(source.scene);
   const clip=retargetClip(raw,target,source.scene,def.rootMotionSpace);
   const sample=(scene,clip,time)=>{for(const tr of clip.tracks){const [name,prop]=tr.name.split('.');scene.getObjectByName(name)[prop].fromArray(tr.createInterpolant().evaluate(time));}scene.updateMatrixWorld(true);return describe(scene).map(({part,rest})=>({part,position:rest}));};
   const samples=[0,.25,.5,.75,.999].map(f=>({time:raw.duration*f,source:sample(source.scene,raw,raw.duration*f),target:sample(target,clip,raw.duration*f)}));
   if (duo.id === 'ko3' && id === duo.animA) {
    const partner = await read(ANIMATION_DEFINITIONS.find(d=>d.id===duo.animB).path);
    const end = partner.animations[0].duration;
    const deviations = raw.tracks.map(tr=>{const at=[...tr.createInterpolant().evaluate(end)],width=tr.getValueSize();let maximum=0;for(let i=0;i<tr.times.length;i++){if(tr.times[i]<=end)continue;const values=tr.values.slice(i*width,(i+1)*width);const error=tr.name.endsWith('.quaternion')?new T.Quaternion().fromArray(at).normalize().angleTo(new T.Quaternion().fromArray(values).normalize())*180/Math.PI:Math.hypot(...values.map((v,j)=>v-at[j]));maximum=Math.max(maximum,error);}return {name:tr.name,maximum};}).sort((a,b)=>b.maximum-a.maximum);
    console.log('KO3 tail deviations after '+end+' s: '+JSON.stringify(deviations.slice(0,8)));
   }
   actors.push({id,path:def.path,duration:raw.duration,registeredDuration:def.duration,rootMotionSpace:def.rootMotionSpace,sourceRest,translations:raw.tracks.filter(t=>t.name.endsWith('.position')).map(t=>({name:t.name,count:t.times.length,maxAbs:t.values.reduce((m,v)=>Math.max(m,Math.abs(v)),0),first:[...t.values.slice(0,3)],last:[...t.values.slice(-3)]})),samples});
  }
  report.push({id:duo.id,label:duo.label,offsetB:duo.offsetB,rotB:duo.rotB,actors});
 }
 fs.writeFileSync('/tmp/miley-duos-audit.json',JSON.stringify(report,null,2));
 for (const duo of report) { const [a,b]=duo.actors.map(a=>a.duration); if(Math.abs(a-b)>2**-23*Math.max(a,b)) console.log(`UNRESOLVED TIMING ${duo.id}: ${a.toFixed(3)} / ${b.toFixed(3)} s`); }
 console.log(`${report.length} duos / ${report.length*2} clips: /tmp/miley-duos-audit.json`);
 for(const d of report) console.log(JSON.stringify({id:d.id,offset:d.offsetB,durations:d.actors.map(a=>a.duration),hips:d.actors.map(a=>a.samples.map(s=>s.target[0].position.map(v=>+v.toFixed(1))))}));
})().catch(e=>{console.error(e);process.exitCode=1});
