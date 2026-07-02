import fs from 'fs';

function inspectRestPose(filePath) {
  console.log(`\n=== Rest Pose of ${filePath} ===`);
  const glb = fs.readFileSync(filePath);
  const jsonLength = glb.readUInt32LE(12);
  const jsonBuffer = glb.subarray(20, 20 + jsonLength);
  const json = JSON.parse(jsonBuffer.toString('utf8'));
  
  // Find CC_Base_Hip
  json.nodes.forEach((node, idx) => {
    if (node.name && node.name.includes('CC_Base_Hip')) {
      console.log(`Node [${idx}] "${node.name}":`);
      if (node.translation) console.log(`  Translation: [${node.translation.map(v => v.toFixed(5))}]`);
      if (node.rotation) console.log(`  Rotation: [${node.rotation.map(v => v.toFixed(5))}]`);
      if (node.scale) console.log(`  Scale: [${node.scale.map(v => v.toFixed(5))}]`);
    }
  });
}

inspectRestPose('/home/dinatih/Projects/room-3d/public/media/sandbox/CCFemme_cleared.glb');
inspectRestPose('/home/dinatih/Projects/room-3d/public/media/sandbox/CChomme_cleared.glb');
inspectRestPose('/home/dinatih/Projects/room-3d/public/media/sandbox/CCFemme.glb');
inspectRestPose('/home/dinatih/Projects/room-3d/public/media/sandbox/CChomme.glb');
