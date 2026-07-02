import fs from 'fs';
import path from 'path';

const allLaraDir = 'public/media/all_lara';

const handBonesKeywords = [
  'wrist', 'hand', 'palm', 'weapon', 'gun', 'pistol', 'mp5', 'rifle', 'shotgun', 'holster'
];

function analyzeGLB(filePath) {
  const glb = fs.readFileSync(filePath);
  const jsonLength = glb.readUInt32LE(12);
  const jsonBuffer = glb.subarray(20, 20 + jsonLength);
  const json = JSON.parse(jsonBuffer.toString('utf8'));

  const nodes = json.nodes;
  const meshes = json.meshes || [];
  
  // Build parent mapping and child mapping
  const parentMap = new Map();
  nodes.forEach((node, idx) => {
    if (node.children) {
      node.children.forEach(cIdx => {
        parentMap.set(cIdx, idx);
      });
    }
  });

  // Traverse hierarchy upwards to check if a node is descendant of a hand/weapon bone
  function isDescendantOfHand(nodeIdx) {
    let curr = nodeIdx;
    while (parentMap.has(curr)) {
      const parentIdx = parentMap.get(curr);
      const parentNode = nodes[parentIdx];
      const nameLower = (parentNode.name || '').toLowerCase();
      
      // If the parent is a hand bone or weapon bone
      const isHandOrWeapon = handBonesKeywords.some(keyword => {
        // Exclude holsters from being classified as "in hand" (user said: "qui sont dans les mains, pas dans les holster")
        if (nameLower.includes('holster')) return false;
        return nameLower.includes(keyword);
      });

      if (isHandOrWeapon) {
        return { isHand: true, ancestorName: parentNode.name, ancestorIdx: parentIdx };
      }
      curr = parentIdx;
    }
    return { isHand: false };
  }

  const handMeshes = [];

  nodes.forEach((node, idx) => {
    // If it's a mesh node
    if (node.mesh !== undefined) {
      const meshData = meshes[node.mesh];
      const meshName = node.name || meshData.name || `mesh_${node.mesh}`;
      
      const { isHand, ancestorName } = isDescendantOfHand(idx);
      
      // Also check if the node name itself contains weapon keywords
      const nodeNameLower = (node.name || '').toLowerCase();
      const isWeaponNode = /gun|pistol|mp5|rifle|shotgun|weapon|uzi/i.test(nodeNameLower) && !nodeNameLower.includes('holster');
      
      if (isHand || isWeaponNode) {
        handMeshes.push({
          nodeIdx: idx,
          name: meshName,
          ancestor: ancestorName || 'Self/Direct'
        });
      }
    }
  });

  return handMeshes;
}

const files = fs.readdirSync(allLaraDir)
  .filter(f => f.endsWith('.glb'))
  .sort();

files.forEach(file => {
  const filePath = path.join(allLaraDir, file);
  try {
    const results = analyzeGLB(filePath);
    if (results.length > 0) {
      console.log(`\n=== File: ${file} ===`);
      results.forEach(m => {
        console.log(`  - Mesh: "${m.name}" (Parent/Ancestor: ${m.ancestor})`);
      });
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
});
