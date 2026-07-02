import fs from 'fs';

function getCharacterGenderFromBoneName(name) {
  const match = name.match(/_0?(\d+)/);
  if (match) {
    const val = parseInt(match[1], 10);
    return val >= 100 ? 'male' : 'female';
  }
  return null;
}

const stripCCPrefixSuffix = name => name.replace(/_\d+$/, '');

const CC_TO_LARA = {
  'CC_Base_Hip':        'mixamorig_root_hips',
  'CC_Base_Waist':      'mixamorig_spine_lower',
  'CC_Base_Spine01':    'mixamorig_spine_upper',
  'CC_Base_Spine02':    'mixamorig_spine_upper',
  'CC_Base_Head':       'mixamorig_head_neck_upper',
  'CC_Base_NeckTwist01': 'mixamorig_head_neck_lower',
  'CC_Base_NeckTwist02': 'mixamorig_head_neck_upper',
  'CC_Base_L_Thigh':    'mixamorig_leg_left_thigh',
  'CC_Base_L_Calf':     'mixamorig_leg_left_knee',
  'CC_Base_L_Foot':     'mixamorig_leg_left_ankle',
  'CC_Base_L_ToeBase':  'mixamorig_leg_left_toes',
  'CC_Base_R_Thigh':    'mixamorig_leg_right_thigh',
  'CC_Base_R_Calf':     'mixamorig_leg_right_knee',
  'CC_Base_R_Foot':     'mixamorig_leg_right_ankle',
  'CC_Base_R_ToeBase':  'mixamorig_leg_right_toes',
  'CC_Base_L_Clavicle': 'mixamorig_arm_left_shoulder_1',
  'CC_Base_L_Upperarm': 'mixamorig_arm_left_shoulder_2',
  'CC_Base_L_Forearm':  'mixamorig_arm_left_elbow',
  'CC_Base_L_Hand':     'mixamorig_arm_left_wrist',
  'CC_Base_R_Clavicle': 'mixamorig_arm_right_shoulder_1',
  'CC_Base_R_Upperarm': 'mixamorig_arm_right_shoulder_2',
  'CC_Base_R_Forearm':  'mixamorig_arm_right_elbow',
  'CC_Base_R_Hand':     'mixamorig_arm_right_wrist',
};

function main() {
  const glb = fs.readFileSync('/home/dinatih/Projects/room-3d/public/media/sandbox/CCFemme_anim.glb');
  const chunkLength = glb.readUInt32LE(12);
  const jsonBuffer = glb.subarray(20, 20 + chunkLength);
  const json = JSON.parse(jsonBuffer.toString('utf8'));
  
  const anim = json.animations[0];
  console.log(`Original animation: "${anim.name}"`);
  console.log(`Tracks count: ${anim.channels.length}`);
  
  let femaleCount = 0;
  let maleCount = 0;
  let mappedFemaleCount = 0;
  let skippedFemaleCount = 0;
  
  const skippedList = new Set();
  
  anim.channels.forEach(ch => {
    const node = json.nodes[ch.target.node];
    if (!node || !node.name) return;
    
    const prop = ch.target.path;
    if (prop !== 'translation' && prop !== 'rotation') return;
    
    const gender = getCharacterGenderFromBoneName(node.name);
    if (gender === 'female') {
      femaleCount++;
      const baseName = stripCCPrefixSuffix(node.name);
      const targetBoneName = CC_TO_LARA[baseName];
      if (targetBoneName) {
        mappedFemaleCount++;
      } else {
        skippedFemaleCount++;
        skippedList.add(node.name);
      }
    } else if (gender === 'male') {
      maleCount++;
    }
  });
  
  console.log(`Female channels: ${femaleCount}`);
  console.log(`Male channels: ${maleCount}`);
  console.log(`Successfully mapped to Lara: ${mappedFemaleCount}`);
  console.log(`Skipped female channels: ${skippedFemaleCount}`);
  
  console.log('\nSkipped female bones sample:');
  console.log(Array.from(skippedList).slice(0, 20));
}

main();
