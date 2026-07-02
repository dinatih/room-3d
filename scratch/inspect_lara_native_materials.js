import fs from 'fs';

const filePath = 'public/media/sandbox/lara_native.glb';
const glb = fs.readFileSync(filePath);
const jsonLength = glb.readUInt32LE(12);
const jsonBuffer = glb.subarray(20, 20 + jsonLength);
const json = JSON.parse(jsonBuffer.toString('utf8'));

console.log(`=== Materials in ${filePath} ===`);
if (json.materials) {
  json.materials.forEach((mat, idx) => {
    console.log(`  Material [${idx}]: "${mat.name || ''}"`);
  });
} else {
  console.log('No materials found');
}

if (json.meshes && json.meshes[0] && json.meshes[0].primitives) {
  console.log('\n=== Primitives in Mesh 0 ===');
  json.meshes[0].primitives.forEach((prim, idx) => {
    const matName = json.materials && json.materials[prim.material] ? json.materials[prim.material].name : 'none';
    console.log(`  Primitive [${idx}]: Material "${matName}" (material index: ${prim.material})`);
  });
}
