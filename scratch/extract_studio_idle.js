import fs from 'fs';
import path from 'path';

const srcPath = 'public/media/all_lara/xbot_studio.glb';
const destPath = 'public/media/glb-animations/idle.glb';

const masterToMixamo = {
  'pelvis': 'mixamorigHips',
  'spine_1': 'mixamorigSpine',
  'spine_2': 'mixamorigSpine1',
  'spine_3': 'mixamorigSpine2',
  'head_neck_lower': 'mixamorigNeck',
  'head_neck_upper': 'mixamorigHead',
  'head_jaw': 'mixamorigJaw',
  'head_tongue': 'mixamorigTongue',
  
  'arm_left_shoulder_1': 'mixamorigLeftShoulder',
  'arm_left_shoulder_2': 'mixamorigLeftArm',
  'arm_left_elbow': 'mixamorigLeftForeArm',
  'arm_left_wrist': 'mixamorigLeftHand',
  
  'arm_right_shoulder_1': 'mixamorigRightShoulder',
  'arm_right_shoulder_2': 'mixamorigRightArm',
  'arm_right_elbow': 'mixamorigRightForeArm',
  'arm_right_wrist': 'mixamorigRightHand',
  
  'leg_left_thigh': 'mixamorigLeftUpLeg',
  'leg_left_knee': 'mixamorigLeftLeg',
  'leg_left_ankle': 'mixamorigLeftFoot',
  'leg_left_toes': 'mixamorigLeftToeBase',
  
  'leg_right_thigh': 'mixamorigRightUpLeg',
  'leg_right_knee': 'mixamorigRightLeg',
  'leg_right_ankle': 'mixamorigRightFoot',
  'leg_right_toes': 'mixamorigRightToeBase',
  
  'headtop_end': 'mixamorigHeadTop_End',
  'lefteye': 'mixamorigLeftEye',
  'righteye': 'mixamorigRightEye',
  'lefttoe_end': 'mixamorigLeftToe_End',
  'righttoe_end': 'mixamorigRightToe_End',
  
  'lefthandthumb4': 'mixamorigLeftHandThumb4',
  'lefthandindex4': 'mixamorigLeftHandIndex4',
  'lefthandmiddle4': 'mixamorigLeftHandMiddle4',
  'lefthandring4': 'mixamorigLeftHandRing4',
  'lefthandpinky4': 'mixamorigLeftHandPinky4',
  
  'righthandthumb4': 'mixamorigRightHandThumb4',
  'righthandindex4': 'mixamorigRightHandIndex4',
  'righthandmiddle4': 'mixamorigRightHandMiddle4',
  'righthandring4': 'mixamorigRightHandRing4',
  'righthandpinky4': 'mixamorigRightHandPinky4',
};

// Add fingers dynamically
const sides = ['left', 'right'];
const sidePrefixes = ['Left', 'Right'];
const fingerNames = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
const segments = ['a', 'b', 'c'];

sides.forEach((side, sIdx) => {
  const sidePref = sidePrefixes[sIdx];
  fingerNames.forEach((fName, fIdx) => {
    const fingerNum = fIdx + 1;
    segments.forEach((seg, segIdx) => {
      const segNum = segIdx + 1;
      const masterName = `arm_${side}_finger_${fingerNum}${seg}`;
      const mixamoName = `mixamorig${sidePref}Hand${fName}${segNum}`;
      masterToMixamo[masterName] = mixamoName;
    });
  });
});

function extractIdleAnimation() {
  const glb = fs.readFileSync(srcPath);
  
  const magic = glb.readUInt32LE(0);
  const version = glb.readUInt32LE(4);
  const totalLength = glb.readUInt32LE(8);
  
  if (magic !== 0x46546C67) {
    throw new Error('Source is not a valid GLB');
  }
  
  const chunks = [];
  let offset = 12;
  
  while (offset < glb.length) {
    const chunkLength = glb.readUInt32LE(offset);
    const chunkType = glb.readUInt32LE(offset + 4);
    const chunkData = glb.subarray(offset + 8, offset + 8 + chunkLength);
    chunks.push({ length: chunkLength, type: chunkType, data: chunkData });
    offset += 8 + chunkLength;
  }
  
  if (chunks[0].type !== 0x4E4F534A) {
    throw new Error('First chunk is not JSON');
  }
  
  const json = JSON.parse(chunks[0].data.toString('utf8'));
  
  if (!json.animations || json.animations.length === 0) {
    throw new Error('No animations found in source GLB');
  }
  
  let idleAnimIndex = json.animations.findIndex(a => (a.name || '').toLowerCase() === 'idle');
  if (idleAnimIndex === -1) {
    idleAnimIndex = 2;
  }
  
  console.log(`Found idle animation at index ${idleAnimIndex} (name: "${json.animations[idleAnimIndex].name}")`);
  
  // Replace animations array with only the idle animation
  const idleAnim = json.animations[idleAnimIndex];
  idleAnim.name = 'idle';
  json.animations = [idleAnim];
  
  // Rename nodes back to Mixamo standard
  let mappedBonesCount = 0;
  json.nodes.forEach(node => {
    if (node.name && masterToMixamo[node.name]) {
      const old = node.name;
      node.name = masterToMixamo[node.name];
      mappedBonesCount++;
    }
  });
  console.log(`Successfully mapped ${mappedBonesCount} bones back to mixamorig_* format.`);
  
  // Re-serialize JSON
  let jsonStr = JSON.stringify(json);
  while (Buffer.byteLength(jsonStr, 'utf8') % 4 !== 0) {
    jsonStr += ' ';
  }
  
  const newJsonBuffer = Buffer.from(jsonStr, 'utf8');
  chunks[0].data = newJsonBuffer;
  chunks[0].length = newJsonBuffer.length;
  
  // Re-calculate total size of GLB
  let newTotalLength = 12;
  chunks.forEach(c => {
    newTotalLength += 8 + c.length;
  });
  
  // Build new buffer
  const outBuffer = Buffer.alloc(newTotalLength);
  outBuffer.writeUInt32LE(0x46546C67, 0); // magic
  outBuffer.writeUInt32LE(2, 4); // version
  outBuffer.writeUInt32LE(newTotalLength, 8); // total length
  
  let outOffset = 12;
  chunks.forEach(c => {
    outBuffer.writeUInt32LE(c.length, outOffset);
    outBuffer.writeUInt32LE(c.type, outOffset + 4);
    c.data.copy(outBuffer, outOffset + 8);
    outOffset += 8 + c.length;
  });
  
  fs.writeFileSync(destPath, outBuffer);
  console.log(`Successfully wrote Mixamo-compliant idle animation to ${destPath}`);
}

try {
  extractIdleAnimation();
} catch (err) {
  console.error('Extraction failed:', err.message);
}
