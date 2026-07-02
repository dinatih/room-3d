import fs from 'fs';

function compareBones(origPath, reexpPath) {
  const origGLB = fs.readFileSync(origPath);
  const reexpGLB = fs.readFileSync(reexpPath);
  
  const origJSON = JSON.parse(origGLB.subarray(20, 20 + origGLB.readUInt32LE(12)).toString('utf8'));
  const reexpJSON = JSON.parse(reexpGLB.subarray(20, 20 + reexpGLB.readUInt32LE(12)).toString('utf8'));
  
  const origBones = {};
  origJSON.nodes.forEach((n, idx) => {
    origBones[n.name || `Node_${idx}`] = n;
  });
  
  console.log("=== BONE ROTATION DIFFERENCES ===");
  reexpJSON.nodes.forEach((rn, idx) => {
    const name = rn.name || `Node_${idx}`;
    const on = origBones[name];
    if (on) {
      const or = on.rotation || [0, 0, 0, 1];
      const rr = rn.rotation || [0, 0, 0, 1];
      
      const diffX = Math.abs(or[0] - rr[0]) > 0.01;
      const diffY = Math.abs(or[1] - rr[1]) > 0.01;
      const diffZ = Math.abs(or[2] - rr[2]) > 0.01;
      const diffW = Math.abs(or[3] - rr[3]) > 0.01;
      
      if (diffX || diffY || diffZ || diffW) {
        console.log(`Node "${name}":`);
        console.log(`  Orig:  ${JSON.stringify(or)}`);
        console.log(`  Reexp: ${JSON.stringify(rr)}`);
      }
    }
  });
}

compareBones('public/media/all_lara/lara_croft_red_dress.glb', 'scratch/test_red_dress_reexported.glb');
