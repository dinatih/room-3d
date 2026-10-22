const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
require('../support/load-ts.cjs');
const THREE = require('three');
const { retargetClip } = require('../../src/features/scene/retargeting/retargetClip.ts');
const { measureHumanProfile } = require('../../src/features/scene/ai/navigation/profiles.ts');
const { getWalkCycleSpeed } = require('../../src/features/scene/character/walkCadence.ts');

it('anime le H2 rigide avec la marche classique et mesure son profil de personnage', async t => {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const { NodeIO } = await import('@gltf-transform/core');
  const { KHRDracoMeshCompression } = await import('@gltf-transform/extensions');
  const io = new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({
    'draco3d.decoder': await require('draco3d').createDecoderModule(),
  });
  const document = await io.read('public/items/unitree-h2/unitree-h2.glb');
  document.getRoot().listExtensionsUsed().forEach(extension => extension.dispose());
  const data = await io.writeBinary(document);
  const { scene } = await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '');
  scene.scale.setScalar(100);
  scene.updateMatrixWorld(true);
  let meshes = 0;
  scene.traverse(node => {
    node.defaultPosition = node.position.clone();
    node.restLocalQuaternion = node.quaternion.clone();
    node.restWorldQuaternion = node.getWorldQuaternion(new THREE.Quaternion());
    node.restWorldPosition = node.getWorldPosition(new THREE.Vector3());
    if (!node.isMesh) return;
    assert(node.isSkinnedMesh);
    meshes++;
    const weights = node.geometry.getAttribute('skinWeight');
    for (let i = 0; i < weights.count; i++) {
      assert.equal(weights.getX(i), 1, 'chaque pièce reste rigide');
      assert.equal(weights.getY(i) + weights.getZ(i) + weights.getW(i), 0);
    }
  });
  assert.equal(meshes, 34);
  const profile = measureHumanProfile(scene, 183.23);
  assert(profile.radius > 0 && Number.isFinite(profile.radius));
  const height = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3()).y;
  assert(Math.abs(height - 183.23) < 0.1);
  const sourceLoader = new GLTFLoader();
  sourceLoader.setDRACOLoader({ preload() {} });
  sourceLoader.register(() => ({ name: 'SkeletonOnly', loadMesh: () => Promise.resolve(new THREE.Group()) }));
  const bytes = fs.readFileSync('public/animations/mixamo/anim_walking.glb');
  const source = await sourceLoader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  source.animations[0].name = 'walking';
  const clip = retargetClip(source.animations[0], scene, source.scene);
  clip.name = 'walking';
  for (const bone of ['Hips', 'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg', 'LeftArm', 'RightArm']) {
    assert(clip.tracks.some(track => track.name === `mixamorig${bone}.quaternion` || track.name === `mixamorig:${bone}.quaternion`), bone);
  }
  const speed = getWalkCycleSpeed(clip, scene);
  assert(speed > 0 && Number.isFinite(speed));
  const mixer = new THREE.AnimationMixer(scene);
  mixer.clipAction(clip).play();
  for (let frame = 0; frame < 60; frame++) {
    mixer.update(clip.duration / 60);
    scene.updateMatrixWorld(true);
    scene.traverse(node => assert(node.matrixWorld.elements.every(Number.isFinite)));
  }
  t.diagnostic(`H2 : ${height.toFixed(2)} cm, rayon ${profile.radius.toFixed(2)} cm, marche ${speed.toFixed(2)} cm/s`);
});
