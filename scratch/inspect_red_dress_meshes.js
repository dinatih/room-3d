import fs from 'fs';
import path from 'path';

const filePath = 'public/media/all_lara/lara_croft_red_dress.glb';
const glb = fs.readFileSync(filePath);
const jsonLength = glb.readUInt32LE(12);
const json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8'));

console.log(`=== Inspecting Red Dress GLB: ${filePath} ===`);
console.log(`Total Meshes: ${json.meshes ? json.meshes.length : 0}`);

if (json.meshes) {
  json.meshes.forEach((mesh, mIdx) => {
    console.log(`\nMesh [${mIdx}]: "${mesh.name || 'Unnamed'}"`);
    if (mesh.primitives) {
      mesh.primitives.forEach((prim, pIdx) => {
        const mat = json.materials && prim.material !== undefined ? json.materials[prim.material] : null;
        const matName = mat ? mat.name : 'none';
        console.log(`  Primitive [${pIdx}]: Material "${matName}"`);
      });
    }
  });
}
