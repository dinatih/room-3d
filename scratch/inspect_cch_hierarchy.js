import fs from 'fs';

function inspectHierarchy(filePath) {
  console.log(`\n=== Bone Hierarchy of ${filePath} ===`);
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

  // Find root bones (nodes with translation/rotation/scale or referenced as joint, but let's check name contains 'CC_Base_Hip')
  const hipIndices = [];
  json.nodes.forEach((node, idx) => {
    if (node.name && node.name.includes('CC_Base_Hip')) {
      hipIndices.push(idx);
    }
  });

  function printNode(nodeIdx, depth = 0) {
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

inspectHierarchy('/home/dinatih/Projects/room-3d/public/media/sandbox/CChomme.glb');
