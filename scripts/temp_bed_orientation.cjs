const fs = require('node:fs');
const assert = require('node:assert/strict');
const THREE = require('three');
require('../tests/support/load-ts.cjs');
const { getAnimationsByTags, getAnimationOriginTransform } = require('../src/features/scene/animations/animationResolver.ts');
const { resolveTargetBoneName } = require('../src/features/scene/retargeting/boneResolver.ts');
const { retargetClip } = require('../src/features/scene/retargeting/retargetClip.ts');

(async () => {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  loader.setDRACOLoader({ preload() {} });
  loader.register(() => ({ name: 'SkeletonOnly', loadMesh: () => Promise.resolve(new THREE.Group()) }));
  for (const def of getAnimationsByTags('laying-front')) {
    const bytes = fs.readFileSync(`public/${def.path}`);
    const source = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
    const targetBytes = fs.readFileSync('public/animations/mixamo/anim_laying_sleeping.glb');
    const { scene } = await loader.parseAsync(targetBytes.buffer.slice(targetBytes.byteOffset, targetBytes.byteOffset + targetBytes.byteLength), '');
    scene.updateMatrixWorld(true);
    scene.traverse(n => {
      n.defaultPosition = n.position.clone();
      n.restLocalQuaternion = n.quaternion.clone();
      n.restWorldQuaternion = n.getWorldQuaternion(new THREE.Quaternion());
    });
    source.animations[0].name = def.id;
    const animations = [retargetClip(source.animations[0], scene, source.scene)];
    const mixer = new THREE.AnimationMixer(scene);
    mixer.clipAction(animations[0]).play();
    const bones = Object.fromEntries(['Head', 'Hips'].map(name => [name, scene.getObjectByName(resolveTargetBoneName(scene, name))]));
    const samples = [0, 0.25, 0.5, 0.75].map(fraction => {
      mixer.setTime(animations[0].duration * fraction);
      scene.updateMatrixWorld(true);
      const axis = bones.Head.getWorldPosition(new THREE.Vector3()).sub(bones.Hips.getWorldPosition(new THREE.Vector3()));
      axis.applyAxisAngle(new THREE.Vector3(0, 1, 0), getAnimationOriginTransform(def.id).rotY);
      assert(axis.z < 0 && Math.abs(axis.z) > Math.abs(axis.x), `${def.id}: tête hors de l'axe du lit à ${fraction}`);
      return axis.toArray().map(v => Number(v.toFixed(2)));
    });
    console.log(def.id, JSON.stringify(samples));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
