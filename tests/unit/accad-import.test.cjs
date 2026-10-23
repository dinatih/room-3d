const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
require('../support/load-ts.cjs');
const T = require('three');
const { ACCAD_ANIMATION_DEFINITIONS: definitions } = require('../../src/features/scene/animations/accadManifest.ts');
const { retargetClip } = require('../../src/features/scene/retargeting/retargetClip.ts');
const { captureAnimationRig, restoreAnimationRig } = require('../../src/features/scene/character/animationSerialization.ts');

it('les 26 imports ACCAD sont traçables, hors combat et conservent leur échantillonnage dans le worker', async () => {
 const metadata = JSON.parse(fs.readFileSync('public/animations/npz/_metadata/accad_actions.json'));
 assert.equal(definitions.length, 26);
 assert.equal(new Set(definitions.map(item => item.id)).size, 26);
 const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
 const loader = new GLTFLoader(); loader.setDRACOLoader({ preload() {} });
 loader.register(() => ({ name: 'SkeletonOnly', loadMesh: () => Promise.resolve(new T.Group()) }));
 const read = async file => {
  const bytes = fs.readFileSync(file);
  return { bytes, gltf: await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '') };
 };
 for (const definition of definitions) {
  const item = metadata.find(item => item.id === definition.id);
  assert.ok(item);
  assert.ok(!['combat', 'locomotion'].includes(definition.category));
  assert.ok(!/Running|Walking|MartialArts|Crawl|Calibration/.test(item.source));
  const { bytes, gltf } = await read('public/' + definition.path);
  const document = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)));
  assert.equal(document.asset.extras.accadSource, item.source);
  assert.ok(Math.abs(gltf.animations[0].duration - definition.duration) < .051);
  assert.ok(gltf.animations[0].tracks.every(track => [...track.values].every(Number.isFinite)));
  if (gltf.scene.userData.animationSampling !== 'source') continue;
  const target = (await read('public/characters/xbot/Xbot_official.glb')).gltf.scene;
  target.updateMatrixWorld(true);
  target.traverse(node => {
   node.defaultPosition = node.position.clone(); node.restLocalQuaternion = node.quaternion.clone();
   node.restWorldQuaternion = node.getWorldQuaternion(new T.Quaternion());
  });
  gltf.animations[0].name = definition.id;
  const clip = retargetClip(gltf.animations[0], target, gltf.scene);
  const worker = retargetClip(gltf.animations[0], restoreAnimationRig(captureAnimationRig(target)), restoreAnimationRig(captureAnimationRig(gltf.scene)));
  const sourcePosition = gltf.animations[0].tracks.find(track => track.name.endsWith('.position'));
  const position = clip.tracks.find(track => track.name.endsWith('.position'));
  assert.deepEqual(position.times, sourcePosition.times, 'Authored support sampling must survive retargeting');
  for (let i = 0; i < clip.tracks.length; i++) {
   assert.deepEqual(worker.tracks[i].times, clip.tracks[i].times);
   assert.deepEqual(worker.tracks[i].values, clip.tracks[i].values);
  }
 }
});
