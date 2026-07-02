import fs from 'fs';
import path from 'path';

const filePath = '/home/dinatih/Projects/room-3d/public/media/all_lara/lara_croft_43254_rigged.glb';
const glb = fs.readFileSync(filePath);
const jsonLength = glb.readUInt32LE(12);
const json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8'));

// Find Node [111] details
const node = json.nodes[111];
console.log('Node [111]:', JSON.stringify(node, null, 2));

if (node.mesh !== undefined) {
  const mesh = json.meshes[node.mesh];
  console.log('Mesh details:', JSON.stringify(mesh, null, 2));
}

// Also let's search if the string "boots", "shoes" or "foot" exists anywhere in the GLTF JSON
const jsonStr = glb.subarray(20, 20 + jsonLength).toString('utf8');
const regex = /foot|shoe|boot|gear/gi;
let match;
console.log('\nSearching for matches in GLTF JSON:');
while ((match = regex.exec(jsonStr)) !== null) {
  console.log(`Found "${match[0]}" at position ${match.index}: ...${jsonStr.substring(Math.max(0, match.index - 30), Math.min(jsonStr.length, match.index + 30))}...`);
}
