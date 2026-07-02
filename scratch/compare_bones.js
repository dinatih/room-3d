import fs from 'fs';

function getBonesFromGLB(filePath) {
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
  return bones;
}

function getAnimationNodes(filePath) {
  const glb = fs.readFileSync(filePath);
  const jsonLength = glb.readUInt32LE(12);
  const jsonBuffer = glb.subarray(20, 20 + jsonLength);
  const json = JSON.parse(jsonBuffer.toString('utf8'));

  const nodeNames = new Set();
  if (json.animations) {
    json.animations.forEach(anim => {
      anim.channels.forEach(chan => {
        const nodeIdx = chan.target.node;
        if (nodeIdx !== undefined && json.nodes[nodeIdx]) {
          nodeNames.add(json.nodes[nodeIdx].name);
        }
      });
    });
  }
  return Array.from(nodeNames);
}

const nativeBones = getBonesFromGLB('/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb');
// Clean the mixamorig_ prefix for comparison
const cleanNativeBones = nativeBones.map(b => b.replace(/^mixamorig_/, ''));

// List of typical standard Mixamo bones (the standard skeleton joints)
const standardBones = [
  "Hips",
  "Spine",
  "Spine1",
  "Spine2",
  "Neck",
  "Head",
  "LeftShoulder",
  "LeftArm",
  "LeftForeArm",
  "LeftHand",
  "RightShoulder",
  "RightArm",
  "RightForeArm",
  "RightHand",
  "LeftUpLeg",
  "LeftLeg",
  "LeftFoot",
  "LeftToeBase",
  "RightUpLeg",
  "RightLeg",
  "RightFoot",
  "RightToeBase"
];

console.log("Checking standard bones compatibility...");
const missing = [];
standardBones.forEach(sb => {
  // Let's see if any of our native bones (cleaned) match the standard bone names (case-insensitive, ignore underscore/space)
  const sbNorm = sb.toLowerCase().replace(/_/g, '').replace(/ /g, '');
  const found = cleanNativeBones.some(nb => {
    const nbNorm = nb.toLowerCase().replace(/_/g, '').replace(/ /g, '');
    return nbNorm === sbNorm || nbNorm.includes(sbNorm) || sbNorm.includes(nbNorm);
  });
  if (!found) {
    missing.push(sb);
  }
});

console.log("Standard Mixamo bones missing from Lara Officiel:", missing);

// Let's also check all anim nodes from standard mixamo walking to see what is missing
const animNodes = getAnimationNodes('/home/dinatih/Projects/room-3d/public/media/glb-animations/walking.glb');
const cleanAnimNodes = animNodes.map(n => n.replace(/^mixamorig_/, '').replace(/^mixamorig:/, ''));

const missingAnimBones = [];
cleanAnimNodes.forEach(an => {
  // Check if this anim bone exists in cleanNativeBones
  const anNorm = an.toLowerCase().replace(/_/g, '').replace(/ /g, '');
  const found = cleanNativeBones.some(nb => {
    const nbNorm = nb.toLowerCase().replace(/_/g, '').replace(/ /g, '');
    return nbNorm === anNorm || nbNorm.includes(anNorm) || anNorm.includes(nbNorm);
  });
  if (!found && !an.includes('Finger') && !an.includes('End')) {
    missingAnimBones.push(an);
  }
});
console.log("Cleaned animation nodes (non-finger/end) missing in Lara Officiel:", missingAnimBones);
