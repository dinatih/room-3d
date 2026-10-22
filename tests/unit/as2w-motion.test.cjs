const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
require('../support/load-ts.cjs');
const THREE = require('three');
const { createAs2wMotion } = require('../../src/features/scene/items/as2wMotion.ts');

it('As2-W officiel : dimensions, 16 moteurs rigides, roulage sans glissement et virages différentiels', async () => {
  const { NodeIO } = await import('@gltf-transform/core');
  const { KHRDracoMeshCompression } = await import('@gltf-transform/extensions');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const io = new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({ 'draco3d.decoder': await require('draco3d').createDecoderModule() });
  const document = await io.read('public/items/unitree-as2w/unitree-as2w.glb');
  document.getRoot().listExtensionsUsed().forEach(extension => extension.dispose());
  const data = await io.writeBinary(document);
  const { scene } = await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '');
  const dims = JSON.parse(fs.readFileSync('public/items/unitree-as2w/dimensions.json'));
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  for (const [axis, dim] of [['x', 'w'], ['y', 'h'], ['z', 'd']]) assert(Math.abs(size[axis] - dims[dim]) < 0.02, `${dim}: échelle en cm`);
  assert(Math.abs(box.min.y) < 0.01, 'modèle au sol');
  assert(Math.abs(box.min.x + box.max.x) < 0.01 && Math.abs(box.min.z + box.max.z) < 0.01, 'centré en X/Z');
  const joints = [], wheels = [], geometry = [];
  scene.traverse(node => {
    if (node.userData.jointAxis) joints.push(node);
    if (node.userData.jointType === 'continuous') wheels.push(node);
    if (node.isMesh) { assert(!node.isSkinnedMesh, 'pièces rigides'); geometry.push([node, node.geometry, node.scale.clone()]); }
  });
  assert.equal(joints.length, 16);
  assert.equal(wheels.length, 4);
  const rest = new Map(joints.map(node => [node, node.quaternion.clone()]));
  const animate = createAs2wMotion(scene);
  animate('roll', 1, 30, 0);
  for (const wheel of wheels) {
    const expected = rest.get(wheel).clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...wheel.userData.jointAxis), 30 / wheel.userData.wheelRadius));
    assert(wheel.quaternion.angleTo(expected) < 1e-7, 'angle = distance / rayon');
  }
  scene.updateMatrixWorld(true);
  const inverse = scene.matrixWorld.clone().invert();
  const lateral = new Map(wheels.map(wheel => [wheel, wheel.getWorldPosition(new THREE.Vector3()).applyMatrix4(inverse).x]));
  animate('roll', 2, 0, 0.4);
  for (const wheel of wheels) {
    const angle = (30 - 0.4 * lateral.get(wheel)) / wheel.userData.wheelRadius;
    const expected = rest.get(wheel).clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...wheel.userData.jointAxis), angle));
    assert(wheel.quaternion.angleTo(expected) < 1e-7, 'virage : roues intérieures et extérieures différenciées');
  }
  for (const motion of ['idle', 'crouch', 'bow', 'dance']) {
    animate(motion, 2, 0, 0);
    scene.updateMatrixWorld(true);
    const bottom = Math.min(...wheels.map(wheel => wheel.getWorldPosition(new THREE.Vector3()).y - wheel.userData.wheelRadius));
    assert(Math.abs(bottom) < 1e-5, `${motion}: pneus au sol indépendamment de leur rotation`);
    for (const [mesh, original, scale] of geometry) {
      assert.equal(mesh.geometry, original);
      assert(mesh.scale.equals(scale), 'aucun étirement de pièce');
    }
  }
  assert.throws(() => animate('unknown', 0, 0, 0), /Unknown/);
});
