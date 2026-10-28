/** Bake sampled official policies into the existing articulated GLB; see docs/microduck.md. */
import fs from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';
import { prune } from '@gltf-transform/functions';
import { Box3, Quaternion, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const samples = JSON.parse(await fs.readFile(process.argv[2], 'utf8'));
const path = 'public/models/microduck.glb';
const io = new NodeIO();
const document = await io.read(path);
const root = document.getRoot();
const buffer = root.listBuffers()[0];
// Original mesh/body name collisions made right-hip yaw bind to a bearing mesh.
// Keep official body names for joints and give every visual leaf a unique name.
root.listNodes().forEach((node, index) => {
  if (node.getMesh()) node.setName(`${String(node.getExtras().meshName).replace('.stl', '')}_mesh_${index}`);
});
const nodes = new Map(root.listNodes().map(node => [node.getName(), node]));
const original = await io.writeBinary(document);
const { scene } = await new GLTFLoader().parseAsync(original.buffer.slice(original.byteOffset, original.byteOffset + original.byteLength), '');
const plastic = new Set(['top_head_shell', 'bottom_head_shell', 'noenoeil', 'soft_mouth_top', 'jaw', 'jaw_soft', 'trunk_base', 'left_shell', 'right_shell', 'upper_leg_left', 'upper_leg_right', 'foot_left', 'foot_right', 'ankle_left', 'ankle_right', 'sole_left', 'sole_right']);
const red = document.createMaterial('Microduck red shells').setBaseColorFactor([0.65, 0.012, 0.02, 1]).setRoughnessFactor(0.5).setMetallicFactor(0.1);
for (const node of root.listNodes()) {
  if (plastic.has(String(node.getExtras().meshName ?? '').replace('.stl', ''))) {
    for (const primitive of node.getMesh().listPrimitives()) primitive.setMaterial(red);
  }
}
for (const animation of root.listAnimations()) animation.dispose();
const array = (name, type, values) => document.createAccessor(name).setType(type).setArray(new Float32Array(values)).setBuffer(buffer);
function track(animation, node, targetPath, times, values) {
  if (!node) throw new Error(`Missing animation node for ${targetPath}`);
  const sampler = document.createAnimationSampler().setInput(times).setOutput(array(`${node.getName()}-${targetPath}`, targetPath === 'rotation' ? 'VEC4' : 'VEC3', values)).setInterpolation('LINEAR');
  animation.addSampler(sampler).addChannel(document.createAnimationChannel().setTargetNode(node).setTargetPath(targetPath).setSampler(sampler));
}
const neutralTrunk = scene.getObjectByName('trunk_base').position.clone();
const quaternion = new Quaternion();
const turn = new Quaternion();
for (const [name, frames] of Object.entries(samples.clips)) {
  const animation = document.createAnimation(name);
  const times = array(`${name}-time`, 'SCALAR', frames.map((_, i) => i / samples.hz));
  const positions = [], rotations = [];
  const values = samples.joints.map(() => []);
  for (const frame of frames) {
    for (let j = 0; j < samples.joints.length; j++) {
      const joint = samples.joints[j];
      const [w, x, y, z] = joint.rotation;
      quaternion.set(x, y, z, w).multiply(turn.setFromAxisAngle(new Vector3(...joint.axis), frame[7 + j])).normalize();
      scene.getObjectByName(joint.node).quaternion.copy(quaternion);
      values[j].push(...quaternion.toArray());
    }
    const trunk = scene.getObjectByName('trunk_base');
    trunk.position.set(frame[0], frame[1], frame[2]);
    trunk.quaternion.set(frame[4], frame[5], frame[6], frame[3]);
    // CAD sole surfaces and physics collision hulls differ: ground the visible soles exactly.
    scene.updateMatrixWorld(true);
    const soles = new Box3();
    scene.traverse(node => { if (node.userData.meshName === 'sole_left.stl' || node.userData.meshName === 'sole_right.stl') soles.union(new Box3().setFromObject(node)); });
    if (soles.isEmpty()) throw new Error('Missing sole meshes');
    trunk.position.z -= soles.min.y;
    positions.push(...trunk.position.toArray());
    rotations.push(...trunk.quaternion.toArray());
  }
  for (let j = 0; j < samples.joints.length; j++) track(animation, nodes.get(samples.joints[j].node), 'rotation', times, values[j]);
  track(animation, nodes.get('trunk_base'), 'translation', times, positions);
  track(animation, nodes.get('trunk_base'), 'rotation', times, rotations);
  track(animation, nodes.get('jaw_pivot'), 'rotation', times, frames.flatMap(() => [0, 0, 0, 1]));
}
// A visual quack, independent of the 14-action policies: official mouth travel is -5°..30°.
// The CAD jaw was exported closed, so the relative opening is 35° about the inherited hinge.
const idle = root.listAnimations().find(animation => animation.getName() === 'idle');
const quack = idle.clone().setName('quack');
for (const channel of quack.listChannels()) {
  if (channel.getTargetNode().getName() === 'jaw_pivot') quack.removeChannel(channel);
}
const jaw = scene.getObjectByName('jaw_pivot');
// Its parent is head_roll. Derive the lateral hinge axis in the original standing frame.
for (const node of samples.joints) scene.getObjectByName(node.node).quaternion.fromArray(nodes.get(node.node).getRotation());
scene.getObjectByName('trunk_base').position.copy(neutralTrunk);
scene.getObjectByName('trunk_base').quaternion.identity();
scene.updateMatrixWorld(true);
const axis = new Vector3(0, 0, -1).applyQuaternion(jaw.parent.getWorldQuaternion(new Quaternion()).invert()).normalize();
const times = array('quack-time', 'SCALAR', [0, 0.12, 0.3, 0.42, 0.54, 0.72, 1]);
track(quack, nodes.get('jaw_pivot'), 'rotation', times, [0, 1, 0, 0, 1, 0, 0].flatMap(open => new Quaternion().setFromAxisAngle(axis, open * 35 * Math.PI / 180).toArray()));
root.setExtras({ ...root.getExtras(), microduckWalkSpeed: samples.speed, source: 'https://huggingface.co/pollen-robotics/microduck-policies', license: 'CC-BY-NC-SA-4.0', author: 'Pollen Robotics', modifications: 'Red plastic shells; policy animations sampled in CPU MuJoCo; visual jaw animation.' });
await document.transform(prune());
await io.write(path, document);
console.log('Imported clips:', root.listAnimations().map(animation => animation.getName()), 'walk cm/s:', samples.speed);
