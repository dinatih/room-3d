import fs from 'fs';
import path from 'path';

const filePath = '/home/dinatih/Projects/room-3d/public/media/all_lara/lara_croft_black_tank_top.glb';
const glb = fs.readFileSync(filePath);
const chunkLength = glb.readUInt32LE(12);
const jsonBuffer = glb.subarray(20, 20 + chunkLength);
const json = JSON.parse(jsonBuffer.toString('utf8'));

console.log('=== LARA CROFT BLACK TANK TOP GLTF DETAILS ===');
console.log(`Bones in skin: ${json.skins ? json.skins[0].joints.length : 'No skin'}`);
console.log(`Total nodes in GLTF: ${json.nodes.length}`);
console.log(`Total meshes in GLTF: ${json.meshes.length}`);

json.nodes.forEach((node, idx) => {
  if (node.mesh !== undefined) {
    const mesh = json.meshes[node.mesh];
    console.log(`Node [${idx}] "${node.name || 'unnamed'}":`);
    console.log(`  Mesh index: ${node.mesh}, name: "${mesh.name || 'unnamed'}"`);
    console.log(`  Skin index: ${node.skin}`);
    console.log(`  Primitives count: ${mesh.primitives.length}`);
    mesh.primitives.forEach((prim, pIdx) => {
      // Find material name
      const matName = prim.material !== undefined ? (json.materials[prim.material]?.name || `Mat_${prim.material}`) : 'No Material';
      console.log(`    - Prim [${pIdx}]: Material: "${matName}"`);
    });
  }
});
