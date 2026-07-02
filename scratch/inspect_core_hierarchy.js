import fs from 'fs';

function inspectTopHierarchy(filePath) {
  console.log(`\n=== Core Hierarchy of ${filePath} ===`);
  const glb = fs.readFileSync(filePath);
  const jsonLength = glb.readUInt32LE(12);
  const jsonBuffer = glb.subarray(20, 20 + jsonLength);
  const json = JSON.parse(jsonBuffer.toString('utf8'));

  // Find root node indices
  const hipIndices = [];
  json.nodes.forEach((node, idx) => {
    if (node.name && node.name.includes('CC_Base_Hip')) {
      hipIndices.push(idx);
    }
  });

  function printNode(nodeIdx, depth = 0) {
    if (depth > 6) return; // limit depth
    const node = json.nodes[nodeIdx];
    const indent = '  '.repeat(depth);
    console.log(`${indent}- Node [${nodeIdx}] "${node.name}"`);
    if (node.children) {
      node.children.forEach(childIdx => {
        printNode(childIdx, depth + 1);
      });
    }
  }

  hipIndices.forEach(idx => {
    printNode(idx);
  });
}

inspectTopHierarchy('/home/dinatih/Projects/room-3d/public/media/sandbox/CChomme.glb');
inspectTopHierarchy('/home/dinatih/Projects/room-3d/public/media/sandbox/CCFemme.glb');
