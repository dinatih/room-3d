import fs from 'fs';

function dumpBones(filePath) {
  console.log(`=== Bones of ${filePath} ===`);
  const glb = fs.readFileSync(filePath);
  const jsonLength = glb.readUInt32LE(12);
  const jsonBuffer = glb.subarray(20, 20 + jsonLength);
  const json = JSON.parse(jsonBuffer.toString('utf8'));
  
  // Find nodes referenced as skins joints
  const jointIndices = new Set();
  if (json.skins) {
    json.skins.forEach(skin => {
      if (skin.joints) {
        skin.joints.forEach(j => jointIndices.add(j));
      }
    });
  }
  
  json.nodes.forEach((node, idx) => {
    const isJoint = jointIndices.has(idx);
    if (isJoint || (node.name && (node.name.includes('spine') || node.name.includes('thorax') || node.name.includes('hip')))) {
      console.log(`Node [${idx}]: name="${node.name}", isJoint=${isJoint}`);
    }
  });
}

dumpBones('public/media/all_lara/lara_croft_543i.glb');
