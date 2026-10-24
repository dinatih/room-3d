const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
require('../support/load-ts.cjs');
const THREE = require('three');
const { createRaphMotion } = require('../../src/features/scene/items/raphMotion.ts');

it('Raph : six articulations rigides, distance/rayon, direction arrière et remise au repos', async () => {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const bytes = fs.readFileSync('public/items/raph-rover/raph-rover.glb');
  const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  scene.updateMatrixWorld(true);
  const joints = [], wheels = [], meshes = [];
  scene.traverse(node => {
    if (node.userData.jointAxis) joints.push(node);
    if (node.userData.wheelRadius) wheels.push(node);
    if (node.isMesh) meshes.push([node, node.geometry, node.scale.clone()]);
  });
  assert.equal(joints.length, 6);
  assert.equal(wheels.length, 4);
  const rest = new Map(joints.map(node => [node, node.quaternion.clone()]));
  const heights = new Map(wheels.map(node => [node, node.getWorldPosition(new THREE.Vector3()).y]));
  const animate = createRaphMotion(scene);
  animate('roll', 1, 9.1 * Math.PI / 2, 0);
  for (const wheel of wheels) {
    const expected = rest.get(wheel).clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...wheel.userData.jointAxis), -Math.PI / 2));
    assert(wheel.quaternion.angleTo(expected) < 1e-7, 'roues synchronisées à la distance parcourue');
  }
  animate('roll', 2, 10, 0.2);
  assert(scene.getObjectByName('servo_l_joint').quaternion.angleTo(rest.get(scene.getObjectByName('servo_l_joint'))) > 0);
  const left = scene.getObjectByName('wheel_fl_joint'), right = scene.getObjectByName('wheel_fr_joint');
  assert(left.quaternion.angleTo(rest.get(left)) !== right.quaternion.angleTo(rest.get(right)), 'roues intérieures/extérieures différenciées');
  for (const motion of ['idle', 'roll', 'turn-left', 'turn-right', 'scan', 'dance']) {
    animate(motion, 0, 0, 0);
    for (const seconds of [0.25, 0.75, 1.25]) {
      animate(motion, seconds, 0, 0);
      scene.updateMatrixWorld(true);
      for (const wheel of wheels) assert(Math.abs(wheel.getWorldPosition(new THREE.Vector3()).y - heights.get(wheel)) < 1e-6, `${motion}: roues à la hauteur du sol`);
      for (const joint of joints) assert(joint.quaternion.toArray().every(Number.isFinite));
      for (const [mesh, geometry, scale] of meshes) { assert.equal(mesh.geometry, geometry); assert(mesh.scale.equals(scale)); }
    }
  }
  animate('idle', 0, 0, 0);
  for (const joint of joints) assert(joint.quaternion.angleTo(rest.get(joint)) < 1e-7);
  assert.throws(() => animate('unknown', 0, 0, 0), /Unknown Raph motion/);
  assert.throws(() => createRaphMotion(new THREE.Group()), /Missing Raph joint/);
});
