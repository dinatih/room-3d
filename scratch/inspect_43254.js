import fs from 'fs';
import path from 'path';

const filePath = '/home/dinatih/Projects/room-3d/public/media/all_lara/lara_croft_43254_rigged.glb';
const glb = fs.readFileSync(filePath);
const jsonLength = glb.readUInt32LE(12);
const json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8'));

console.log('Meshes in 43254:');
if (json.nodes) {
  json.nodes.forEach((node, nodeIdx) => {
    if (node.mesh !== undefined) {
      const mesh = json.meshes[node.mesh];
      const meshName = node.name || mesh.name || 'Unnamed';
      
      const firstPrim = mesh.primitives ? mesh.primitives[0] : null;
      const matIdx = firstPrim ? firstPrim.material : undefined;
      const mat = json.materials && matIdx !== undefined ? json.materials[matIdx] : null;
      const matName = mat ? mat.name : '';
      
      console.log(`Node [${nodeIdx}]: "${meshName}"`);
      console.log(`  Mesh Index: ${node.mesh}`);
      console.log(`  Material: "${matName}"`);
      if (mesh.primitives) {
        mesh.primitives.forEach((prim, primIdx) => {
          console.log(`  Primitive [${primIdx}]: Material Index: ${prim.material}`);
        });
      }
    }
  });
}
