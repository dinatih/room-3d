const fs = require('node:fs');
const file = 'src/features/scene/animations/interx_manifest.json';
const text = fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(text);
require('node:assert/strict').equal(manifest.duos.find(d => d.id === 'interx-g059t000a009r030').seatedParticipant, 'p2');
require('../tests/support/load-ts.cjs');
const assert = require('node:assert/strict');
const THREE = require('three');
const { retargetClip } = require('../src/features/scene/retargeting/retargetClip.ts');
const { captureAnimationRig, restoreAnimationRig } = require('../src/features/scene/character/animationSerialization.ts');
(async () => {
 const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
 const loader = new GLTFLoader(); loader.setDRACOLoader({preload(){}});
 loader.register(() => ({name:'SkeletonOnly',loadMesh:()=>Promise.resolve(new THREE.Group())}));
 const read = async path => { const b = fs.readFileSync('public/'+path); return loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),''); };
 for (const person of ['p1','p2']) {
  const source = await read(`animations/npz/interx/g059t000a009r030-${person}.glb`);
  const target = (await read('characters/lara/lara_native.glb')).scene;
  target.scale.setScalar(100); target.updateMatrixWorld(true);
  target.traverse(n=>{n.defaultPosition=n.position.clone();n.restLocalQuaternion=n.quaternion.clone();n.restWorldQuaternion=n.getWorldQuaternion(new THREE.Quaternion());});
  const toes = []; target.traverse(n=>{if(/toe/i.test(n.name) && n.isBone)toes.push(n);});
  assert(toes.length);
  const support=()=>Math.min(...toes.map(n=>n.getWorldPosition(new THREE.Vector3()).y));
  const floor = support(); const raw=source.animations[0]; raw.name=`interx-g059t000a009r030-${person}`;
  const clip=retargetClip(raw,target,source.scene,'world-meters');
  const worker=retargetClip(raw,restoreAnimationRig(captureAnimationRig(target)),restoreAnimationRig(captureAnimationRig(source.scene)),'world-meters');
  assert.deepEqual(clip.tracks.map(t=>[...t.values]),worker.tracks.map(t=>[...t.values]));
  const mixer = new THREE.AnimationMixer(target);mixer.clipAction(clip).play();mixer.setTime(0);target.updateMatrixWorld(true);
  assert(Math.abs(support()-floor)<0.001,`${person}: support ${support()} vs ${floor}`);
  console.log(person, 'initial toe support error (cm):', support()-floor);
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
