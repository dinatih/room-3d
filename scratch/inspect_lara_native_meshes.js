import fs from 'fs';

const filePath = 'public/media/sandbox/lara_native.glb';
const glb = fs.readFileSync(filePath);
const jsonLength = glb.readUInt32LE(12);
const jsonBuffer = glb.subarray(20, 20 + jsonLength);
const json = JSON.parse(jsonBuffer.toString('utf8'));

console.log(`=== Meshes in ${filePath} ===`);
if (json.meshes) {
  json.meshes.forEach((mesh, idx) => {
    console.log(`  [${idx}]: "${mesh.name || ''}"`);
  });
} else {
  console.log('No meshes found');
}
