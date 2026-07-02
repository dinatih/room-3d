import fs from 'fs';

function findAncestry(filePath) {
  console.log(`\n=== Ancestry in ${filePath} ===`);
  const glb = fs.readFileSync(filePath);
  const jsonLength = glb.readUInt32LE(12);
  const jsonBuffer = glb.subarray(20, 20 + jsonLength);
  const json = JSON.parse(jsonBuffer.toString('utf8'));

  // Build parent map
  const parentMap = {};
  json.nodes.forEach((node, idx) => {
    if (node.children) {
      node.children.forEach(childIdx => {
        parentMap[childIdx] = idx;
      });
    }
  });

  // Find Node with "CC_Base_Hip"
  let hipIdx = -1;
  json.nodes.forEach((node, idx) => {
    if (node.name && node.name.includes('CC_Base_Hip')) {
      hipIdx = idx;
    }
  });

  if (hipIdx === -1) {
    console.log('No CC_Base_Hip found!');
    return;
  }

  // Trace back to root
  let curr = hipIdx;
  const path = [];
  while (curr !== undefined) {
    path.unshift(curr);
    curr = parentMap[curr];
  }

  path.forEach(idx => {
    const node = json.nodes[idx];
    console.log(`Node [${idx}] "${node.name}":`);
    if (node.translation) console.log(`  Translation: [${node.translation.map(v => v.toFixed(5))}]`);
    if (node.rotation) console.log(`  Rotation: [${node.rotation.map(v => v.toFixed(5))}]`);
    if (node.scale) console.log(`  Scale: [${node.scale.map(v => v.toFixed(5))}]`);
  });
}

findAncestry('/home/dinatih/Projects/room-3d/public/media/sandbox/CChomme.glb');
findAncestry('/home/dinatih/Projects/room-3d/public/media/sandbox/CCFemme.glb');
