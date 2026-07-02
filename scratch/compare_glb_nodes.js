import fs from 'fs';

function inspectGLB(filePath) {
  const glb = fs.readFileSync(filePath);
  const jsonLength = glb.readUInt32LE(12);
  const json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8'));
  
  console.log(`\n=== Nodes in ${filePath} ===`);
  if (json.nodes) {
    json.nodes.forEach((node, idx) => {
      // Print nodes with non-default rotation, scale, or translation
      const hasR = node.rotation !== undefined;
      const hasS = node.scale !== undefined;
      const hasT = node.translation !== undefined;
      if (hasR || hasS || hasT || node.name === 'Armature' || idx < 5) {
        console.log(`  Node [${idx}]: "${node.name || ''}"`);
        if (hasT) console.log(`    Translation: ${JSON.stringify(node.translation)}`);
        if (hasR) console.log(`    Rotation: ${JSON.stringify(node.rotation)}`);
        if (hasS) console.log(`    Scale: ${JSON.stringify(node.scale)}`);
      }
    });
  }
}

inspectGLB('public/media/all_lara/lara_croft_red_dress.glb');
inspectGLB('scratch/test_red_dress_reexported.glb');
