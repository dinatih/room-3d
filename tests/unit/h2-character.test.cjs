const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
require('../support/load-ts.cjs');
const THREE = require('three');
const { retargetClip } = require('../../src/features/scene/retargeting/retargetClip.ts');
const { measureHumanProfile } = require('../../src/features/scene/ai/navigation/profiles.ts');
const { getWalkCycleSpeed } = require('../../src/features/scene/character/walkCadence.ts');
const { resolveTargetBoneName } = require('../../src/features/scene/retargeting/boneResolver.ts');
const { captureAnimationRig, restoreAnimationRig } = require('../../src/features/scene/character/animationSerialization.ts');

it('anime le H2 avec ses 31 moteurs URDF, face au nord, sans déplacer ni déformer ses pièces', async t => {
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
  const motors = [];
  scene.traverse(node => {
    node.defaultPosition = node.position.clone();
    node.restLocalQuaternion = node.quaternion.clone();
    node.restWorldQuaternion = node.getWorldQuaternion(new THREE.Quaternion());
    node.restWorldPosition = node.getWorldPosition(new THREE.Vector3());
    if (node.userData.robotJoint) motors.push(node);
    if (!node.isMesh) return;
    assert(node.isSkinnedMesh);
    meshes++;
    const weights = node.geometry.getAttribute('skinWeight');
    const indices = node.geometry.getAttribute('skinIndex');
    for (let i = 0; i < weights.count; i++) {
      assert.equal(weights.getX(i), 1, 'chaque pièce reste rigide');
      assert.equal(weights.getY(i) + weights.getZ(i) + weights.getW(i), 0);
      assert.equal(indices.getX(i), indices.getX(0), 'un moteur unique par pièce');
    }
  });
  assert.equal(meshes, 34);
  assert.equal(motors.length, 31);
  const urdf = fs.readFileSync('public/items/unitree-h2/H2.urdf', 'utf8');
  for (const motor of motors) {
    const xml = urdf.match(new RegExp(`<joint name="${motor.name}"[^>]*>([\\s\\S]*?)</joint>`))[1];
    const axis = xml.match(/<axis xyz="([^"]+)"/)[1].split(' ').map(Number);
    assert.equal(new THREE.Vector3().fromArray(motor.userData.robotJoint.axis).distanceTo(new THREE.Vector3(...axis)), 0);
    const limits = xml.match(/<limit lower="([^"]+)" upper="([^"]+)"/);
    assert.equal(motor.userData.robotJoint.lower, Number(limits[1]));
    assert.equal(motor.userData.robotJoint.upper, Number(limits[2]));
    const origin = xml.match(/<origin xyz="([^"]+)" rpy="([^"]+)"/);
    assert(motor.defaultPosition.distanceTo(new THREE.Vector3(...origin[1].split(' ').map(Number))) < 1e-6, `${motor.name}: origine URDF`);
    const rest = new THREE.Quaternion().setFromEuler(new THREE.Euler(...origin[2].split(' ').map(Number), 'XYZ'));
    assert(motor.restLocalQuaternion.clone().normalize().angleTo(rest) < 1e-6, `${motor.name}: repère URDF`);
  }
  const head = scene.getObjectByName(resolveTargetBoneName(scene, 'Head'));
  const forward = new THREE.Vector3().fromArray(head.userData.lookForward).transformDirection(head.matrixWorld);
  assert(forward.z < -0.999, 'avant du robot orienté nord (-Z)');
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
  const transferred = restoreAnimationRig(structuredClone(captureAnimationRig(scene)));
  const workerClip = retargetClip(source.animations[0], transferred, source.scene);
  assert.deepEqual(workerClip.tracks.map(track => [...track.values]), clip.tracks.map(track => [...track.values]), 'axes conservés après transfert au worker');
  for (const motor of motors) {
    assert(clip.tracks.some(track => track.name === `${motor.name}.quaternion`), motor.name);
  }
  assert(clip.tracks.every(track => track.name.endsWith('.quaternion') || track.name === 'pelvis.position'));
  const speed = getWalkCycleSpeed(clip, scene);
  assert(speed > 0 && Number.isFinite(speed));
  const mixer = new THREE.AnimationMixer(scene);
  mixer.clipAction(clip).play();
  for (let frame = 0; frame < 60; frame++) {
    mixer.update(clip.duration / 60);
    scene.updateMatrixWorld(true);
    scene.traverse(node => assert(node.matrixWorld.elements.every(Number.isFinite)));
    assert(new THREE.Vector3().fromArray(head.userData.lookUp).transformDirection(head.matrixWorld).y > 0.8, 'la marche reste debout');
    for (const motor of motors) {
      assert(motor.position.equals(motor.defaultPosition), `${motor.name}: pivot URDF fixe`);
      const delta = motor.restLocalQuaternion.clone().invert().multiply(motor.quaternion);
      const axis = new THREE.Vector3().fromArray(motor.userData.robotJoint.axis);
      assert(new THREE.Vector3(delta.x, delta.y, delta.z).cross(axis).length() < 1e-6, `${motor.name}: axe moteur respecté`);
      const angle = 2 * Math.atan2(new THREE.Vector3(delta.x, delta.y, delta.z).dot(axis), delta.w);
      const { lower, upper } = motor.userData.robotJoint;
      assert([-1, 0, 1].some(turn => angle + turn * 2 * Math.PI >= lower - 1e-6 && angle + turn * 2 * Math.PI <= upper + 1e-6), `${motor.name}: limites respectées`);
    }
  }
  t.diagnostic(`H2 : ${height.toFixed(2)} cm, rayon ${profile.radius.toFixed(2)} cm, marche ${speed.toFixed(2)} cm/s`);
});
