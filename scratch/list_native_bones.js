import fs from 'fs';

function getBones(filePath) {
  const glb = fs.readFileSync(filePath);
  const jsonLength = glb.readUInt32LE(12);
  const jsonBuffer = glb.subarray(20, 20 + jsonLength);
  const json = JSON.parse(jsonBuffer.toString('utf8'));

  let jointNodes = new Set();
  if (json.skins) {
    json.skins.forEach(skin => {
      skin.joints.forEach(j => jointNodes.add(j));
    });
  }

  const bones = [];
  jointNodes.forEach(jIdx => {
    const node = json.nodes[jIdx];
    if (node) {
      bones.push(node.name || `Node_${jIdx}`);
    }
  });
  return bones.sort();
}

const nativeBones = getBones('/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb');
console.log(`Lara Native (Officiel) total bones: ${nativeBones.length}`);
console.log("Lara Native Bones:");
console.log(nativeBones);
