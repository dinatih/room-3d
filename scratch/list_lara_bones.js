import fs from 'fs';

const glb = fs.readFileSync('/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb');
const jsonLength = glb.readUInt32LE(12);
const json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString());

console.log('--- Bones in lara_native.glb ---');
json.nodes.forEach((node, idx) => {
  // A node is a bone if it is referenced in a skin, or has typical bone names
  // Let's print all nodes that look like bones (have mixamorig in name)
  if (node.name && (node.name.includes('mixamorig') || node.name.includes('Bone') || node.name.includes('Bip'))) {
    console.log(`Node [${idx}]: "${node.name}"`);
  }
});
