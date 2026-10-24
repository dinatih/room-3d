// Run after converting upstream DAE meshes to /tmp/raph-{base,wheel,servo}.glb with assimp.
import fs from 'node:fs/promises';
import { Box3, Group, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(result => { this.result = result; this.onloadend(); });
  }
};
const root = new Group();
root.name = 'Raph Rover';
// ROS Z-up meters to glTF Y-up centimeters; forward becomes +Z.
root.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
root.scale.setScalar(100);
const loader = new GLTFLoader();
const models = {};
for (const name of ['base', 'wheel', 'servo']) {
  const bytes = await fs.readFile(`/tmp/raph-${name}.glb`);
  models[name] = (await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')).scene;
}
function part(model, name, position, yaw = 0, parent = root) {
  const joint = new Group();
  joint.name = name;
  joint.position.set(...position);
  joint.rotation.z = yaw;
  const mesh = models[model].clone(true);
  mesh.rotation.z = Math.PI / 2;
  joint.add(mesh);
  parent.add(joint);
  return joint;
}
part('base', 'base_link', [-0.074211, 0, -0.031076]);
part('wheel', 'wheel_fl_joint', [0, 0.19402, -0.144756]);
part('wheel', 'wheel_fr_joint', [0, -0.19402, -0.144756], Math.PI);
for (const [side, y, yaw] of [['l', 0.1899, 0], ['r', -0.1899, Math.PI]]) {
  const servo = part('servo', `servo_${side}_joint`, [-0.37943, y, -0.022433], yaw);
  part('wheel', `wheel_r${side}_joint`, [0, 0, -0.12392], 0, servo);
}
const box = new Box3().setFromObject(root);
const center = box.getCenter(new Vector3());
root.position.set(-center.x, -box.min.y, -center.z);
const output = 'public/items/raph-rover';
await fs.mkdir(output, { recursive: true });
await fs.writeFile(`${output}/raph-rover.glb`, Buffer.from(await new GLTFExporter().parseAsync(root, { binary: true })));
const size = new Box3().setFromObject(root).getSize(new Vector3());
await fs.writeFile(`${output}/dimensions.json`, JSON.stringify({ w: size.x, d: size.z, h: size.y }, null, 2) + '\n');
await fs.copyFile('/tmp/raph_common-main/LICENSE', `${output}/LICENSE`);
console.log('Dimensions (cm):', size);
