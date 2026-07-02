import fs from 'fs';

function analyzeGLB(filePath) {
  console.log(`\n=== Analyzing GLB: ${filePath} ===`);
  const glb = fs.readFileSync(filePath);
  const jsonLength = glb.readUInt32LE(12);
  const jsonBuffer = glb.subarray(20, 20 + jsonLength);
  const json = JSON.parse(jsonBuffer.toString('utf8'));

  // A bone node is usually referenced by a skin, or we can look at the hierarchy.
  // In glTF, skins list the joint nodes. Let's inspect the skins.
  let jointNodes = new Set();
  if (json.skins) {
    json.skins.forEach(skin => {
      skin.joints.forEach(j => jointNodes.add(j));
    });
  }

  console.log(`Total nodes: ${json.nodes.length}`);
  console.log(`Total skins: ${json.skins ? json.skins.length : 0}`);
  console.log(`Total joints in skins: ${jointNodes.size}`);

  const bones = [];
  jointNodes.forEach(jIdx => {
    const node = json.nodes[jIdx];
    if (node) {
      bones.push(node.name || `Node_${jIdx}`);
    }
  });

  console.log(`Joint Node names sample (first 20):`);
  console.log(bones.slice(0, 20));

  console.log(`Joint Node names sample (last 20):`);
  console.log(bones.slice(-20));

  // Check if we can find pelvis, hips, or suffix patterns
  const numericSuffixPattern = /_[0-9]+$/;
  let numericSuffixCount = 0;
  bones.forEach(name => {
    if (numericSuffixPattern.test(name)) {
      numericSuffixCount++;
    }
  });
  console.log(`Bones with numeric suffix like _03 or _085: ${numericSuffixCount}`);
}

analyzeGLB('/home/dinatih/Projects/room-3d/public/media/all_lara/lara_croft_gold_shades.glb');
analyzeGLB('/home/dinatih/Projects/room-3d/public/media/all_lara/lara_croft_3254_rigged.glb');
analyzeGLB('/home/dinatih/Projects/room-3d/public/media/all_lara/lara_croft_543i.glb');
