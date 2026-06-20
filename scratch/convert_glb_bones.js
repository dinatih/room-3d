import fs from 'fs';
import path from 'path';

// Define the name mapping normalizer
function normalizeBoneName(name) {
  if (!name) return name;
  
  const rawLower = name.toLowerCase().replace(/^mixamorig[_-]/i, '').replace(/^mixamorig:/i, '').trim();
  if (rawLower === 'spine_1_1') return 'spine_2';
  if (rawLower === 'thorax') return 'spine_3';
  if (rawLower === 'spine_2') return 'spine_2';
  if (rawLower === 'spine_1') return 'spine_1';
  if (rawLower === 'spine_3') return 'spine_3';
  if (rawLower === 'arm_left_shoulder_1' || rawLower === 'armleftshoulder1') return 'arm_left_shoulder_1';
  if (rawLower === 'arm_left_shoulder_2' || rawLower === 'armleftshoulder2') return 'arm_left_shoulder_2';
  if (rawLower === 'arm_right_shoulder_1' || rawLower === 'armrightshoulder1') return 'arm_right_shoulder_1';
  if (rawLower === 'arm_right_shoulder_2' || rawLower === 'armrightshoulder2') return 'arm_right_shoulder_2';

  let clean = name;
  
  // Clean prefix mixamorig_ or mixamorig:
  clean = clean.replace(/^mixamorig[_-]/i, '');
  clean = clean.replace(/^mixamorig:/i, '');
  
  // Clean index suffixes like _03, _085, _087 or .001
  clean = clean.replace(/[_-](0\d*|\d{2,})$/g, '');
  clean = clean.replace(/\.\d+$/g, '');
  
  // Clean space or multiple dashes/underscores to single underscore
  clean = clean.replace(/[ \-]/g, '_').toLowerCase().trim();
  
  // Apply specific key mappings (case-insensitive conversion)
  // Bassin/Pelvis
  if (clean === 'rootground' || clean === 'root_ground') return 'root_ground';
  if (clean === 'roothips' || clean === 'root_hips') return 'root_hips';
  if (clean === 'pelvis' || clean === 'hips' || clean === 'hip') return 'pelvis';
  
  // Spine
  if (clean === 'spine' || clean === 'spine0' || clean === 'spine01' || clean === 'spine_lower' || clean === 'spinelower') return 'spine_1';
  if (clean === 'spine1' || clean === 'spine02' || clean === 'spine_middle' || clean === 'spinemiddle') return 'spine_2';
  if (clean === 'spine2' || clean === 'spine03' || clean === 'spine_upper' || clean === 'spineupper') return 'spine_3';
  
  // Neck & Head
  if (clean === 'neck' || clean === 'headnecklower' || clean === 'neck_lower') return 'head_neck_lower';
  if (clean === 'head' || clean === 'headneckupper' || clean === 'neck_upper') return 'head_neck_upper';
  if (clean === 'jaw') return 'head_jaw';
  if (clean === 'tongue') return 'head_tongue';
  
  // Clavicles / Shoulders (Arm level 1)
  if (clean === 'leftshoulder' || clean === 'shoulder_l' || clean === 'clavicle_l' || clean === 'claviclel' || clean === 'shlder_l' || clean === 'shlderl' || clean === 'armleftshoulder') return 'arm_left_shoulder_1';
  if (clean === 'rightshoulder' || clean === 'shoulder_r' || clean === 'clavicle_r' || clean === 'clavicler' || clean === 'shlder_r' || clean === 'shlderr' || clean === 'armrightshoulder') return 'arm_right_shoulder_1';
  
  // Arms (Arm level 2)
  if (clean === 'leftarm' || clean === 'upperarm_l' || clean === 'armleftshoulder2' || clean === 'upperarm_left' || clean === 'bicep_l' || clean === 'bicepl') return 'arm_left_shoulder_2';
  if (clean === 'rightarm' || clean === 'upperarm_r' || clean === 'armrightshoulder2' || clean === 'upperarm_right' || clean === 'bicep_r' || clean === 'bicepr') return 'arm_right_shoulder_2';
  
  // Forearms
  if (clean === 'leftforearm' || clean === 'lowerarm_l' || clean === 'armleftelbow' || clean === 'forearm_l' || clean === 'forarm_l' || clean === 'forarml') return 'arm_left_elbow';
  if (clean === 'rightforearm' || clean === 'lowerarm_r' || clean === 'armrightelbow' || clean === 'forearm_r' || clean === 'forarm_r' || clean === 'forarmr') return 'arm_right_elbow';
  
  // Hands / Wrists
  if (clean === 'lefthand' || clean === 'hand_l' || clean === 'armleftwrist' || clean === 'wrist_l' || clean === 'wristl' || clean === 'palml') return 'arm_left_wrist';
  if (clean === 'righthand' || clean === 'hand_r' || clean === 'armrightwrist' || clean === 'wrist_r' || clean === 'wristr' || clean === 'palmr') return 'arm_right_wrist';
  
  // Legs Upper (Thighs)
  if (clean === 'leftupleg' || clean === 'thigh_l' || clean === 'legleftthigh' || clean === 'thighl') return 'leg_left_thigh';
  if (clean === 'rightupleg' || clean === 'thigh_r' || clean === 'legrightthigh' || clean === 'thighr') return 'leg_right_thigh';
  
  // Legs Lower (Knees/Calf)
  if (clean === 'leftleg' || clean === 'calf_l' || clean === 'shin_l' || clean === 'legleftknee' || clean === 'calfl' || clean === 'shinl') return 'leg_left_knee';
  if (clean === 'rightleg' || clean === 'calf_r' || clean === 'shin_r' || clean === 'legrightknee' || clean === 'calfr' || clean === 'shinr') return 'leg_right_knee';
  
  // Feet
  if (clean === 'leftfoot' || clean === 'foot_l' || clean === 'legleftankle' || clean === 'footl') return 'leg_left_ankle';
  if (clean === 'rightfoot' || clean === 'foot_r' || clean === 'legrightankle' || clean === 'footr') return 'leg_right_ankle';
  
  // Toes
  if (clean === 'lefttoebase' || clean === 'toe_l' || clean === 'leglefttoes' || clean === 'toel' || clean === 'balll') return 'leg_left_toes';
  if (clean === 'righttoebase' || clean === 'toe_r' || clean === 'legrighttoes' || clean === 'toer' || clean === 'ballr') return 'leg_right_toes';

  // Face features
  if (clean.startsWith('head_eyebrow_left_')) return clean;
  if (clean.startsWith('head_eyebrow_right_')) return clean;
  if (clean.startsWith('head_eyelid_left_')) return clean;
  if (clean.startsWith('head_eyelid_right_')) return clean;
  if (clean.startsWith('head_lip_lower_')) return clean;
  if (clean.startsWith('head_lip_upper_')) return clean;
  
  if (clean.startsWith('eyebrow_l_')) return clean.replace('eyebrow_l_', 'head_eyebrow_left_');
  if (clean.startsWith('eyebrow_r_')) return clean.replace('eyebrow_r_', 'head_eyebrow_right_');
  if (clean.startsWith('eyelid_l_')) return clean.replace('eyelid_l_', 'head_eyelid_left_');
  if (clean.startsWith('eyelid_r_')) return clean.replace('eyelid_r_', 'head_eyelid_right_');
  if (clean.startsWith('lip_lower_')) return clean.replace('lip_lower_', 'head_lip_lower_');
  if (clean.startsWith('lip_upper_')) return clean.replace('lip_upper_', 'head_lip_upper_');
  
  if (clean === 'eyeball_l' || clean === 'head_eyeball_left' || clean === 'eyeball_left') return 'head_eyeball_left';
  if (clean === 'eyeball_r' || clean === 'head_eyeball_right' || clean === 'eyeball_right') return 'head_eyeball_right';
  if (clean === 'cheek_l' || clean === 'head_cheek_left' || clean === 'cheek_left') return 'head_cheek_left';
  if (clean === 'cheek_r' || clean === 'head_cheek_right' || clean === 'cheek_right') return 'head_cheek_right';
  if (clean === 'nostril_l' || clean === 'head_nostril_left' || clean === 'nostril_left') return 'head_nostril_left';
  if (clean === 'nostril_r' || clean === 'head_nostril_right' || clean === 'nostril_right') return 'head_nostril_right';

  // Hair / Ponytail
  if (clean.includes('ponytail') || clean.includes('pony')) {
    const num = clean.match(/\d+/);
    if (num) return `head_hair_ponytail_${num[0]}`;
  }

  // Fingers parsing
  const side = name.toLowerCase().includes('left') || name.toLowerCase().includes('_l') || name.toLowerCase().endsWith('l') ? 'left' : 'right';
  
  let fingerIndex = null;
  if (/thumb/i.test(name)) fingerIndex = '1';
  else if (/index/i.test(name)) fingerIndex = '2';
  else if (/middle/i.test(name)) fingerIndex = '3';
  else if (/ring/i.test(name)) fingerIndex = '4';
  else if (/pinky|little/i.test(name)) fingerIndex = '5';
  
  let segmentLetter = null;
  const segMatch = name.match(/(\d)(a|b|c)?$/i);
  if (segMatch) {
    const num = parseInt(segMatch[1]);
    if (num === 1) segmentLetter = 'a';
    else if (num === 2) segmentLetter = 'b';
    else if (num === 3) segmentLetter = 'c';
    else if (segMatch[2]) segmentLetter = segMatch[2].toLowerCase();
  } else {
    const letMatch = name.match(/(a|b|c|1|2|3)[_-]?[lr]?$/i);
    if (letMatch) {
      const val = letMatch[1].toLowerCase();
      if (val === 'a' || val === '1') segmentLetter = 'a';
      else if (val === 'b' || val === '2') segmentLetter = 'b';
      else if (val === 'c' || val === '3') segmentLetter = 'c';
    }
  }

  if (fingerIndex && segmentLetter) {
    return `arm_${side}_finger_${fingerIndex}${segmentLetter}`;
  }

  return clean;
}

function convertGLB(srcPath, destPath) {
  console.log(`Converting skeleton bones: ${srcPath} -> ${destPath}`);
  const glb = fs.readFileSync(srcPath);
  const magic = glb.readUInt32LE(0);
  const version = glb.readUInt32LE(4);
  const totalLength = glb.readUInt32LE(8);

  if (magic !== 0x46546C67) {
    throw new Error('Not a GLB file');
  }

  // Chunk 0
  const chunk0Length = glb.readUInt32LE(12);
  const chunk0Type = glb.readUInt32LE(16);
  if (chunk0Type !== 0x4E4F534A) {
    throw new Error('First chunk is not JSON');
  }

  const jsonBuffer = glb.subarray(20, 20 + chunk0Length);
  const jsonStr = jsonBuffer.toString('utf8');
  const json = JSON.parse(jsonStr);

  // Collect joint nodes for safety
  const jointNodes = new Set();
  if (json.skins) {
    json.skins.forEach(skin => {
      skin.joints.forEach(j => jointNodes.add(j));
    });
  }

  let renameCount = 0;
  json.nodes.forEach((node, idx) => {
    if (jointNodes.has(idx) && node.name) {
      const oldName = node.name;
      const newName = normalizeBoneName(oldName);
      if (oldName !== newName) {
        node.name = newName;
        renameCount++;
      }
    }
  });

  console.log(`Renamed ${renameCount} bones inside JSON nodes.`);

  // Serialize JSON back
  let newJsonStr = JSON.stringify(json);
  // Pad JSON string with spaces (0x20) to a multiple of 4 bytes
  let newJsonLength = Buffer.byteLength(newJsonStr, 'utf8');
  const remainder = newJsonLength % 4;
  if (remainder !== 0) {
    newJsonStr += ' '.repeat(4 - remainder);
    newJsonLength = Buffer.byteLength(newJsonStr, 'utf8');
  }

  const newJsonBuffer = Buffer.from(newJsonStr, 'utf8');

  // Compute total file length
  const oldChunk0Length = chunk0Length;
  const oldTotalLength = totalLength;
  const lengthDiff = newJsonLength - oldChunk0Length;
  const newTotalLength = oldTotalLength + lengthDiff;

  // Create new GLB buffer
  const headerBuffer = Buffer.alloc(12);
  headerBuffer.writeUInt32LE(0x46546C67, 0);
  headerBuffer.writeUInt32LE(2, 4);
  headerBuffer.writeUInt32LE(newTotalLength, 8);

  const chunk0Header = Buffer.alloc(8);
  chunk0Header.writeUInt32LE(newJsonLength, 0);
  chunk0Header.writeUInt32LE(0x4E4F534A, 4);

  const chunk1Start = 20 + oldChunk0Length;
  const chunk1Buffer = glb.subarray(chunk1Start);

  const finalGLB = Buffer.concat([
    headerBuffer,
    chunk0Header,
    newJsonBuffer,
    chunk1Buffer
  ]);

  fs.writeFileSync(destPath, finalGLB);
  console.log(`Success: Converted GLB saved.`);
}

const targets = [
  { src: 'public/media/all_lara/lara_croft_324_rigged.glb', dest: 'public/media/all_lara/lara_croft_324_rigged.glb' },
  { src: 'public/media/all_lara/lara_croft_3254_rigged.glb', dest: 'public/media/all_lara/lara_croft_3254_rigged.glb' },
  { src: 'public/media/all_lara/lara_croft_4259.glb', dest: 'public/media/all_lara/lara_croft_4259.glb' },
  { src: 'public/media/all_lara/lara_croft_43254_rigged.glb', dest: 'public/media/all_lara/lara_croft_43254_rigged.glb' },
  { src: 'public/media/all_lara/lara_croft_4543.glb', dest: 'public/media/all_lara/lara_croft_4543.glb' },
  { src: 'public/media/all_lara/lara_croft_543i.glb', dest: 'public/media/all_lara/lara_croft_543i.glb' },
  { src: 'public/media/all_lara/lara_croft_black_tank_top.glb', dest: 'public/media/all_lara/lara_croft_black_tank_top.glb' },
  { src: 'public/media/all_lara/lara_croft_brown_jacket.glb', dest: 'public/media/all_lara/lara_croft_brown_jacket.glb' },
  { src: 'public/media/all_lara/lara_croft_dress_345.glb', dest: 'public/media/all_lara/lara_croft_dress_345.glb' },
  { src: 'public/media/all_lara/lara_croft_gold_shades.glb', dest: 'public/media/all_lara/lara_croft_gold_shades.glb' },
  { src: 'public/media/all_lara/lara_croft_just_dont_stare_into_the_eyes.glb', dest: 'public/media/all_lara/lara_croft_just_dont_stare_into_the_eyes.glb' },
  { src: 'public/media/all_lara/lara_croft_motorcycle_gear.glb', dest: 'public/media/all_lara/lara_croft_motorcycle_gear.glb' },
  { src: 'public/media/all_lara/lara_croft_red_dress.glb', dest: 'public/media/all_lara/lara_croft_red_dress.glb' },
  { src: 'public/media/all_lara/lara_croft_spy_gear.glb', dest: 'public/media/all_lara/lara_croft_spy_gear.glb' },
  { src: 'public/media/all_lara/lara_croft_suit.glb', dest: 'public/media/all_lara/lara_croft_suit.glb' },
  { src: 'public/media/all_lara/lara_croft_swim_gear.glb', dest: 'public/media/all_lara/lara_croft_swim_gear.glb' },
  { src: 'public/media/all_lara/lara_croft_swim_gear_1.glb', dest: 'public/media/all_lara/lara_croft_swim_gear_1.glb' },
  { src: 'public/media/all_lara/lara_croft_swim_gear_243.glb', dest: 'public/media/all_lara/lara_croft_swim_gear_243.glb' },
  { src: 'public/media/all_lara/lara_croft_zip.glb', dest: 'public/media/all_lara/lara_croft_zip.glb' },
  
  // Custom target: Lara Native (lara_officiel) -> create a new file instead of overwriting!
  { src: 'public/media/sandbox/lara_native.glb', dest: 'public/media/all_lara/lara_original_88_bones.glb' },
  
  // Custom target: X-Bot du Studio
  { src: 'public/media/sandbox/Xbot_official.glb', dest: 'public/media/all_lara/xbot_studio.glb' }
];

targets.forEach(t => {
  try {
    convertGLB(t.src, t.dest);
  } catch (err) {
    console.error(`Error processing ${t.src}:`, err.message);
  }
});
