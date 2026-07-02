import fs from 'fs';

function findParents(filePath) {
  const glb = fs.readFileSync(filePath);
  const jsonLength = glb.readUInt32LE(12);
  const json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8'));
  
  const parentMap = {};
  if (json.nodes) {
    json.nodes.forEach((node, idx) => {
      if (node.children) {
        node.children.forEach(cIdx => {
          parentMap[cIdx] = idx;
        });
      }
    });
  }
  
  console.log(`\n=== Mesh Parents in ${filePath} ===`);
  if (json.nodes) {
    json.nodes.forEach((node, idx) => {
      if (node.mesh !== undefined) {
        const path = [];
        let curr = idx;
        while (curr !== undefined) {
          path.push(`${json.nodes[curr].name || 'Unnamed'} (idx ${curr})`);
          curr = parentMap[curr];
        }
        console.log(`  Mesh: "${node.name}" -> Hierarchy: ${path.reverse().join(' -> ')}`);
      }
    });
  }
}

findParents('public/media/all_lara/lara_croft_red_dress.glb');
findParents('scratch/test_red_dress_reexported.glb');
