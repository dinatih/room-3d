import * as THREE from 'three';

export const CC3_TO_MIXAMO: Record<string, string> = {
  'CC_Base_Waist': 'Spine',
  'CC_Base_Spine01': 'Spine1',
  'CC_Base_Spine02': 'Spine2',
  'CC_Base_NeckTwist01': 'Neck',
  'CC_Base_NeckTwist02': 'Neck',
  'CC_Base_Head': 'Head',
  'CC_Base_L_Clavicle': 'LeftShoulder',
  'CC_Base_L_Upperarm': 'LeftArm',
  'CC_Base_L_Forearm': 'LeftForeArm',
  'CC_Base_L_Hand': 'LeftHand',
  'CC_Base_R_Clavicle': 'RightShoulder',
  'CC_Base_R_Upperarm': 'RightArm',
  'CC_Base_R_Forearm': 'RightForeArm',
  'CC_Base_R_Hand': 'RightHand',
  'CC_Base_L_Thigh': 'LeftUpLeg',
  'CC_Base_L_Calf': 'LeftLeg',
  'CC_Base_L_Foot': 'LeftFoot',
  'CC_Base_L_ToeBase': 'LeftToeBase',
  'CC_Base_R_Thigh': 'RightUpLeg',
  'CC_Base_R_Calf': 'RightLeg',
  'CC_Base_R_Foot': 'RightFoot',
  'CC_Base_R_ToeBase': 'RightToeBase',
  'CC_Base_L_Thumb1': 'LeftHandThumb1',
  'CC_Base_L_Thumb2': 'LeftHandThumb2',
  'CC_Base_L_Thumb3': 'LeftHandThumb3',
  'CC_Base_L_Index1': 'LeftHandIndex1',
  'CC_Base_L_Index2': 'LeftHandIndex2',
  'CC_Base_L_Index3': 'LeftHandIndex3',
  'CC_Base_L_Mid1': 'LeftHandMiddle1',
  'CC_Base_L_Mid2': 'LeftHandMiddle2',
  'CC_Base_L_Mid3': 'LeftHandMiddle3',
  'CC_Base_L_Ring1': 'LeftHandRing1',
  'CC_Base_L_Ring2': 'LeftHandRing2',
  'CC_Base_L_Ring3': 'LeftHandRing3',
  'CC_Base_L_Pinky1': 'LeftHandPinky1',
  'CC_Base_L_Pinky2': 'LeftHandPinky2',
  'CC_Base_L_Pinky3': 'LeftHandPinky3',
  'CC_Base_R_Thumb1': 'RightHandThumb1',
  'CC_Base_R_Thumb2': 'RightHandThumb2',
  'CC_Base_R_Thumb3': 'RightHandThumb3',
  'CC_Base_R_Index1': 'RightHandIndex1',
  'CC_Base_R_Index2': 'RightHandIndex2',
  'CC_Base_R_Index3': 'RightHandIndex3',
  'CC_Base_R_Mid1': 'RightHandMiddle1',
  'CC_Base_R_Mid2': 'RightHandMiddle2',
  'CC_Base_R_Mid3': 'RightHandMiddle3',
  'CC_Base_R_Ring1': 'RightHandRing1',
  'CC_Base_R_Ring2': 'RightHandRing2',
  'CC_Base_R_Ring3': 'RightHandRing3',
  'CC_Base_R_Pinky1': 'RightHandPinky1',
  'CC_Base_R_Pinky2': 'RightHandPinky2',
  'CC_Base_R_Pinky3': 'RightHandPinky3'
};

export const BONE_SYNONYMS: Record<string, string[]> = {
  'Hips': ['hips', 'pelvis', 'cog', 'roothips', 'rootground', 'hip'],
  'Spine': ['spine01', 'spinelower', 'spine0', 'spine1', 'spine'],
  'Spine2': ['spine02', 'spineupper', 'spine2', 'spine03', 'spine', 'spine3'],
  'Neck': ['neck', 'headnecklower'],
  'Head': ['head', 'headneckupper'],
  'LeftShoulder': ['leftshoulder', 'shoulderl', 'claviclel', 'armleftshoulder', 'larmclavicle', 'shlderl', 'armleftshoulder1'],
  'LeftArm': ['armleftshoulder2', 'upperarml', 'larmhumerus', 'upperarm.l', 'upper_arm.l', 'leftarm', 'armleftelbow', 'arm.l', 'bicepl'],
  'LeftForeArm': ['lowerarml', 'larmradius', 'forearm.l', 'forearm_l', 'leftforearm', 'armleftelbow', 'armleftwrist', 'forarml', 'forearml'],
  'LeftHand': ['handl', 'larmwrist', 'hand.l', 'hand_l', 'wrist.l', 'wrist_l', 'lefthand', 'armleftwrist', 'palml'],
  'RightShoulder': ['rightshoulder', 'shoulderr', 'clavicler', 'armrightshoulder', 'rarmclavicle', 'shlderr', 'armrightshoulder1'],
  'RightArm': ['rightarm', 'armrightshoulder2', 'upperarmr', 'armrightelbow', 'rarmhumerus', 'upperarm.r', 'upper_arm.r', 'arm.r', 'bicepr'],
  'RightForeArm': ['lowerarmr', 'rarmradius', 'forearm.r', 'forearm_r', 'rightforearm', 'armrightelbow', 'armrightwrist', 'forarmr', 'forearmr'],
  'RightHand': ['handr', 'rarmwrist', 'hand.r', 'hand_r', 'wrist.r', 'wrist_r', 'righthand', 'armrightwrist', 'palmr'],
  'LeftUpLeg': ['legleftthigh', 'thighl', 'llegfemur', 'thigh.l', 'thigh_l', 'leftupleg'],
  'LeftLeg': ['legleftknee', 'calfl', 'shinl', 'llegtibia', 'shin.l', 'shin_l', 'calf.l', 'calf_l', 'leftleg'],
  'LeftFoot': ['legleftankle', 'footl', 'llegankle', 'foot.l', 'foot_l', 'ankle.l', 'ankle_l', 'leftfoot'],
  'LeftToeBase': ['leglefttoes', 'balll', 'toel', 'llegball', 'toe.l', 'toe_l', 'ball.l', 'ball_l', 'lefttoebase'],
  'RightUpLeg': ['legrightthigh', 'thighr', 'rlegfemur', 'thigh.r', 'thigh_r', 'rightupleg'],
  'RightLeg': ['legrightknee', 'calfr', 'shinr', 'rlegtibia', 'shin.r', 'shin_r', 'calf.r', 'calf_r', 'rightleg'],
  'RightFoot': ['legrightankle', 'footr', 'rlegankle', 'foot.r', 'foot_r', 'ankle.r', 'ankle_r', 'rightfoot'],
  'RightToeBase': ['legrighttoes', 'ballr', 'toer', 'rlegball', 'toe.r', 'toe_r', 'ball.r', 'ball_r', 'righttoebase']
};

export function resolveTargetFingerBoneName(targetInstance: THREE.Object3D, side: string, type: string, segment: string): string | null {
  const sideChar = side.charAt(0).toLowerCase();
  const segmentIndex = parseInt(segment) - 1;
  const segmentLetter = ['a', 'b', 'c'][segmentIndex] || 'a';

  const candidates = [
    new RegExp(`^${type}${segment}_${sideChar}$`, 'i'),
    new RegExp(`arm.*${side}.*finger.*${type === 'thumb' ? 1 : type === 'index' ? 2 : type === 'middle' ? 3 : type === 'ring' ? 4 : 5}${segmentLetter}`, 'i'),
    new RegExp(`${type}_0${segment}_${sideChar}`, 'i'),
    new RegExp(`${type === 'thumb' ? 'thumb' : 'f_' + type}\\.0${segment}\\.${sideChar}`, 'i'),
    new RegExp(`${sideChar}.*hand.*${type}.*${segmentIndex}`, 'i'),
    new RegExp(`mixamorig.*${side}.*hand.*${type}.*${segment}`, 'i'),
    new RegExp(`mixamorig_${side}_hand_${type}_${segment}`, 'i'),
    new RegExp(`${side}_hand_${type}_${segment}`, 'i')
  ];

  let foundName: string | null = null;
  targetInstance.traverse(node => {
    if ((node as any).isBone && !foundName) {
      for (const rx of candidates) {
        if (rx.test(node.name)) {
          foundName = node.name;
          break;
        }
      }
    }
  });
  return foundName;
}

export function getDepth(node: THREE.Object3D): number {
  let depth = 0;
  let curr: THREE.Object3D | null = node;
  while (curr && curr.parent) {
    depth++;
    curr = curr.parent;
  }
  return depth;
}

export function buildHairChain(hairBones: THREE.Bone[]) {
  const hairChain: any[] = [];
  const bones = [...hairBones].sort((a, b) => getDepth(a) - getDepth(b));

  if (bones.length > 0) {
    const baseParent = bones[0].parent;
    if (baseParent) {
      baseParent.updateMatrixWorld(true);
      const baseParentRestQuat = baseParent.getWorldQuaternion(new THREE.Quaternion());

      let prevAxis = new THREE.Vector3(0, -1, 0);
      for (const bone of bones) {
        let axis = prevAxis.clone();
        let length = 8.0;
        const child = bone.children.find(x => bones.includes(x as THREE.Bone));
        if (child && child.position.lengthSq() > 1e-8) {
          length = child.position.length();
          axis = child.position.clone().normalize();
        }
        prevAxis = axis.clone();
        bone.updateMatrixWorld(true);
        const jointWorld = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
        const worldScale = new THREE.Vector3().setFromMatrixScale(bone.matrixWorld);
        const tipDirWorld = axis.clone().transformDirection(bone.matrixWorld).normalize();

        let worldLength = length * worldScale.y;
        if (child) {
          const p1 = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
          const p2 = new THREE.Vector3().setFromMatrixPosition(child.matrixWorld);
          worldLength = p1.distanceTo(p2);
        }
        if (worldLength < 0.1) worldLength = 0.1;

        const tipWorld = jointWorld.clone().addScaledVector(tipDirWorld, worldLength);
        const boneRestQuat = bone.getWorldQuaternion(new THREE.Quaternion());
        const relQuat = baseParentRestQuat.clone().invert().multiply(boneRestQuat);

        hairChain.push({
          bone,
          restQuat: bone.quaternion.clone(),
          relQuat,
          axis,
          length,
          worldLength,
          tipWorld: tipWorld.clone(),
          tipPrev: tipWorld.clone(),
        });
      }
    } else {
      console.log(`[buildHairChain] baseParent is null for bone ${bones[0].name}`);
    }
  } else {
    console.log(`[buildHairChain] bones array is empty`);
  }
  console.log(`[buildHairChain] Returning chain of length ${hairChain.length}`);
  return hairChain;
}

export const _retargetCache: Record<string, THREE.AnimationClip> = {};

export function resolveTargetBoneName(targetInstance: THREE.Object3D, baseName: string, sourceHairMap: Map<string, string> | null = null): string | null {
  const baseNameLower = baseName.toLowerCase();
  if (baseNameLower.includes('hair') || baseNameLower.includes('ponytail')) {
    if (sourceHairMap && sourceHairMap.has(baseNameLower)) {
      const targetName = sourceHairMap.get(baseNameLower);
      if (targetName && targetInstance.getObjectByName(targetName)) {
        return targetName;
      }
    }
    const numMatch = baseName.match(/(\d+)/);
    if (numMatch) {
      const N = numMatch[1];
      const targetName = `hair_${N}`;
      if (targetInstance.getObjectByName(targetName)) {
        return targetName;
      }
    }
  }

  // Support for both mixamo format (HandIndex1) and CharacterCreator format (L_Index1)
  const fingerMatch = baseName.match(/(?:Hand)?(Thumb|Index|Middle|Mid|Ring|Pinky)(\d)/i);
  if (fingerMatch && !baseName.toLowerCase().includes('toe')) {
    let side = baseName.toLowerCase().includes('left') ? 'left' : 'right';
    if (baseName.includes('_L_')) side = 'left';
    if (baseName.includes('_R_')) side = 'right';
    let type = fingerMatch[1].toLowerCase();
    if (type === 'mid') type = 'middle';
    const segment = fingerMatch[2];
    const resolvedFinger = resolveTargetFingerBoneName(targetInstance, side, type, segment);
    if (resolvedFinger) {
      // console.log(`[FINGER] Mapped ${baseName} -> ${resolvedFinger}`);
      return resolvedFinger;
    }
    // console.log(`[FINGER_FAIL] Could not map ${baseName} (${side}, ${type}, ${segment})`);
  }

  const synonyms = BONE_SYNONYMS[baseName];
  if (synonyms) {
    for (const syn of synonyms) {
      let foundName: string | null = null;
      targetInstance.traverse(node => {
        if ((node as any).isBone && !foundName) {
          const nameNormalized = node.name.toLowerCase().replace(/[:_ .\-]/g, '');
          if (nameNormalized === syn || (nameNormalized.includes(syn) &&
              !nameNormalized.includes(syn + '1') &&
              !nameNormalized.includes(syn + '2') &&
              !nameNormalized.includes(syn + '3') &&
              !nameNormalized.includes(syn + '4'))) {
            if (!nameNormalized.includes('twist') && !nameNormalized.includes('muscle') && !nameNormalized.includes('offset')) {
              foundName = node.name;
            }
          }
        }
      });
      if (foundName) return foundName;
    }
  }

  const candidates = [
    'mixamorig:' + baseName,
    'mixamorig_' + baseName,
    'mixamorig' + baseName,
    baseName,
    'mixamorig:' + baseName.charAt(0).toLowerCase() + baseName.slice(1),
    'mixamorig_' + baseName.charAt(0).toLowerCase() + baseName.slice(1),
    'mixamorig' + baseName.charAt(0).toLowerCase() + baseName.slice(1),
    baseName.charAt(0).toLowerCase() + baseName.slice(1)
  ];

  for (const cand of candidates) {
    if (targetInstance.getObjectByName(cand)) {
      return cand;
    }
  }
  return null;
}

export function retargetClip(rawClip: THREE.AnimationClip, targetInstance: THREE.Object3D, animScene: THREE.Object3D | undefined): THREE.AnimationClip {
  const animBones: Record<string, any> = {};
  const sourceHairMap = new Map<string, string>();

  if (animScene) {
    animScene.updateMatrixWorld(true);

    // Auto T-pose correction for A-pose models (like CC3/CC4)
    // We adjust the rest pose of the arms in animScene so it aligns with standard Mixamo T-pose.
    animScene.traverse((c: any) => {
      if (c.isBone) {
        let name = c.name;
        if (CC3_TO_MIXAMO[name]) name = CC3_TO_MIXAMO[name];
        if (name === 'LeftArm' || name === 'RightArm') {
          const wQ = c.getWorldQuaternion(new THREE.Quaternion());
          const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(wQ);
          // If the arm is pointing downwards (dir.y < -0.1), it's an A-pose.
          if (dir.y < -0.1) {
            const targetDir = name === 'LeftArm' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-1, 0, 0);
            const offsetQ = new THREE.Quaternion().setFromUnitVectors(dir.normalize(), targetDir);
            const pWQ = c.parent ? c.parent.getWorldQuaternion(new THREE.Quaternion()) : new THREE.Quaternion();
            const newWorldQ = offsetQ.clone().multiply(wQ);
            c.quaternion.copy(pWQ.invert().multiply(newWorldQ));
          }
        }
      }
    });
    // Update matrices again after our corrections
    animScene.updateMatrixWorld(true);

    const sourceHairBones: Array<{ bone: THREE.Object3D; baseName: string; depth: number }> = [];
    animScene.traverse(c => {
      if ((c as any).isBone) {
        const nameLower = (c.name || '').toLowerCase();
        if (nameLower.includes('hair') || nameLower.includes('ponytail')) {
          const match = c.name.match(/mixamorig[:_]?(.+)/i);
          const base = match ? match[1] : c.name;
          sourceHairBones.push({ bone: c, baseName: base, depth: getDepth(c) });
        }
      }
    });
    sourceHairBones.sort((a, b) => a.depth - b.depth);
    sourceHairBones.forEach((hb, idx) => {
      sourceHairMap.set(hb.baseName.toLowerCase(), `hair_${idx + 1}`);
    });

    animScene.traverse((c: any) => {
      if (c.isBone) {
        let name = c.name;
        if (CC3_TO_MIXAMO[name]) name = 'mixamorig:' + CC3_TO_MIXAMO[name];
        const match = name.match(/mixamorig[:_]?(.+)/i);
        if (match) {
          animBones[match[1]] = {
            restWorldQuaternion: c.getWorldQuaternion(new THREE.Quaternion()),
            restLocalQuaternion: c.quaternion.clone(),
            parentRestWorldQuaternion: c.parent ? c.parent.getWorldQuaternion(new THREE.Quaternion()) : new THREE.Quaternion(),
            defaultPosition: c.position.clone(),
            bone: c
          };
          if (match[1] === 'Hips' || match[1] === 'Spine') {
            const eW = new THREE.Euler().setFromQuaternion(animBones[match[1]].restWorldQuaternion, 'XYZ');
            const ePW = new THREE.Euler().setFromQuaternion(animBones[match[1]].parentRestWorldQuaternion, 'XYZ');
            console.log(`[ANIM BONES] model=${rawClip.name} bone=${match[1]} worldQ=(${Math.round(eW.x*180/Math.PI)},${Math.round(eW.y*180/Math.PI)},${Math.round(eW.z*180/Math.PI)}) pWorldQ=(${Math.round(ePW.x*180/Math.PI)},${Math.round(ePW.y*180/Math.PI)},${Math.round(ePW.z*180/Math.PI)})`);
          }
        } else if (name.toLowerCase() === 'cc_base_boneroot' || name.toLowerCase() === 'rootjoint') {
          animBones['RootJoint'] = {
            restWorldQuaternion: c.getWorldQuaternion(new THREE.Quaternion()),
            restLocalQuaternion: c.quaternion.clone(),
            parentRestWorldQuaternion: c.parent ? c.parent.getWorldQuaternion(new THREE.Quaternion()) : new THREE.Quaternion(),
            defaultPosition: c.position.clone(),
            bone: c
          };
        }
      }
    });
  }

  // Deep clone of rawClip tracks to avoid mutating the source clip
  const clonedTracks: THREE.KeyframeTrack[] = [];
  for (const track of rawClip.tracks) {
    const cl = track.clone();
    cl.times = new Float32Array(track.times);
    cl.values = new Float32Array(track.values);
    clonedTracks.push(cl);
  }
  const workingClip = new THREE.AnimationClip(rawClip.name, rawClip.duration, clonedTracks);

  // Detect and fix centimeter positions (scale to meters)
  for (const track of workingClip.tracks) {
    if (track.name.endsWith('.position')) {
      // Find the maximum absolute value in the track to determine if it's in cm
      let maxVal = 0;
      for (let i = 0; i < track.values.length; i++) {
        if (Math.abs(track.values[i]) > maxVal) {
          maxVal = Math.abs(track.values[i]);
        }
      }
      
      // If the track has values > 5.0, it's almost certainly in centimeters
      if (maxVal > 5.0) {
        for (let i = 0; i < track.values.length; i++) {
          track.values[i] *= 0.01;
        }
      }
    }
  }

  // Combine rootjoint and hips rotations
  const rootRotTrackIndex = workingClip.tracks.findIndex(t => (t.name.toLowerCase().includes('rootjoint') || t.name.toLowerCase().includes('cc_base_boneroot')) && t.name.endsWith('.quaternion'));
  const hipsRotTrackIndex = workingClip.tracks.findIndex(t => (t.name.toLowerCase().includes('hips') || t.name.toLowerCase().includes('hip') || t.name.toLowerCase().includes('pelvis')) && t.name.endsWith('.quaternion') && !(t.name.toLowerCase().includes('rootjoint') || t.name.toLowerCase().includes('cc_base_boneroot')));

  const evaluateQuaternionTrack = (track: THREE.KeyframeTrack, t: number): THREE.Quaternion => {
    const trackTimes = track.times;
    const trackValues = track.values;
    if (t <= trackTimes[0]) {
      return new THREE.Quaternion(trackValues[0], trackValues[1], trackValues[2], trackValues[3]);
    }
    if (t >= trackTimes[trackTimes.length - 1]) {
      const idx = (trackTimes.length - 1) * 4;
      return new THREE.Quaternion(trackValues[idx], trackValues[idx+1], trackValues[idx+2], trackValues[idx+3]);
    }
    let i = 0;
    while (i < trackTimes.length - 1 && trackTimes[i+1] < t) {
      i++;
    }
    const t0 = trackTimes[i];
    const t1 = trackTimes[i+1];
    const alpha = (t - t0) / (t1 - t0);
    const q0 = new THREE.Quaternion(trackValues[4*i], trackValues[4*i+1], trackValues[4*i+2], trackValues[4*i+3]);
    const q1 = new THREE.Quaternion(trackValues[4*(i+1)], trackValues[4*(i+1)+1], trackValues[4*(i+1)+2], trackValues[4*(i+1)+3]);
    return q0.slerp(q1, alpha);
  };

  if (rootRotTrackIndex !== -1) {
    const rootRotTrack = workingClip.tracks[rootRotTrackIndex];
    if (hipsRotTrackIndex !== -1) {
      const hipsRotTrack = workingClip.tracks[hipsRotTrackIndex];
      const timesSet = new Set<number>([...rootRotTrack.times, ...hipsRotTrack.times]);
      const times = Array.from(timesSet).sort((a, b) => a - b);
      const values = new Float32Array(times.length * 4);


      for (let i = 0; i < times.length; i++) {
        const t = times[i];
        const qRoot = evaluateQuaternionTrack(rootRotTrack, t);
        const qHips = evaluateQuaternionTrack(hipsRotTrack, t);
        
        // The true world rotation of the hips is the parent's world rotation * local rotation
        const qCombined = qRoot.clone().multiply(qHips);
        
        values[4*i] = qCombined.x;
        values[4*i+1] = qCombined.y;
        values[4*i+2] = qCombined.z;
        values[4*i+3] = qCombined.w;
      }
      
      const newHipsRotTrack = new THREE.QuaternionKeyframeTrack('mixamorig:Hips.quaternion', new Float32Array(times), values);
      workingClip.tracks.splice(hipsRotTrackIndex, 1, newHipsRotTrack);
      
      const updatedRootRotTrackIndex = workingClip.tracks.indexOf(rootRotTrack);
      if (updatedRootRotTrackIndex !== -1) {
        workingClip.tracks.splice(updatedRootRotTrackIndex, 1);
      }
    } else {
      rootRotTrack.name = 'mixamorig:Hips.quaternion';
    }
  }

  // Combine rootjoint and hips positions
  const rootPosTrackIndex = workingClip.tracks.findIndex(t => (t.name.toLowerCase().includes('rootjoint') || t.name.toLowerCase().includes('cc_base_boneroot')) && t.name.endsWith('.position'));
  const hipsPosTrackIndex = workingClip.tracks.findIndex(t => (t.name.toLowerCase().includes('hips') || t.name.toLowerCase().includes('hip') || t.name.toLowerCase().includes('pelvis') || t.name.toLowerCase().endsWith('hips.position')) && t.name.endsWith('.position') && !(t.name.toLowerCase().includes('rootjoint') || t.name.toLowerCase().includes('cc_base_boneroot')));

  if (rootPosTrackIndex !== -1) {
    const rootPosTrack = workingClip.tracks[rootPosTrackIndex];
    let hipsPosTrack = hipsPosTrackIndex !== -1 ? workingClip.tracks[hipsPosTrackIndex] : null;
    
    // If the animation doesn't have a hips position track (e.g. Miley animations where all translation is on root),
    // create a static one from the default position so we can still combine them.
    if (!hipsPosTrack && animBones['Hips']) {
      const defPos = animBones['Hips'].defaultPosition.clone();
      // Ensure it's in meters if it came from CC4 (centimeters)
      if (defPos.length() > 5.0) defPos.multiplyScalar(0.01);
      hipsPosTrack = new THREE.VectorKeyframeTrack(
        'mixamorig:Hips.position',
        [0],
        [defPos.x, defPos.y, defPos.z]
      );
    }

    if (hipsPosTrack) {
      const rootRotTrack = rawClip.tracks.find(t => (t.name.toLowerCase().includes('rootjoint') || t.name.toLowerCase().includes('cc_base_boneroot')) && t.name.endsWith('.quaternion'));
      if (rootRotTrack) {
        const posTimes = rootPosTrack.times;
        const posValues = new Float32Array(posTimes.length * 3);

        const evaluateVectorTrack = (track: THREE.KeyframeTrack, t: number): THREE.Vector3 => {
          const trackTimes = track.times;
          const trackValues = track.values;
          if (t <= trackTimes[0]) return new THREE.Vector3(trackValues[0], trackValues[1], trackValues[2]);
          if (t >= trackTimes[trackTimes.length - 1]) {
            const idx = (trackTimes.length - 1) * 3;
            return new THREE.Vector3(trackValues[idx], trackValues[idx+1], trackValues[idx+2]);
          }
          let i = 0;
          while (i < trackTimes.length - 1 && trackTimes[i+1] < t) i++;
          const alpha = (t - trackTimes[i]) / (trackTimes[i+1] - trackTimes[i]);
          const v0 = new THREE.Vector3(trackValues[3*i], trackValues[3*i+1], trackValues[3*i+2]);
          const v1 = new THREE.Vector3(trackValues[3*(i+1)], trackValues[3*(i+1)+1], trackValues[3*(i+1)+2]);
          return v0.lerp(v1, alpha);
        };
        const evaluateQuaternionTrack = (track: THREE.KeyframeTrack, t: number): THREE.Quaternion => {
          const trackTimes = track.times;
          const trackValues = track.values;
          if (t <= trackTimes[0]) return new THREE.Quaternion(trackValues[0], trackValues[1], trackValues[2], trackValues[3]);
          if (t >= trackTimes[trackTimes.length - 1]) {
            const idx = (trackTimes.length - 1) * 4;
            return new THREE.Quaternion(trackValues[idx], trackValues[idx+1], trackValues[idx+2], trackValues[idx+3]);
          }
          let i = 0;
          while (i < trackTimes.length - 1 && trackTimes[i+1] < t) i++;
          const alpha = (t - trackTimes[i]) / (trackTimes[i+1] - trackTimes[i]);
          const q0 = new THREE.Quaternion(trackValues[4*i], trackValues[4*i+1], trackValues[4*i+2], trackValues[4*i+3]);
          const q1 = new THREE.Quaternion(trackValues[4*(i+1)], trackValues[4*(i+1)+1], trackValues[4*(i+1)+2], trackValues[4*(i+1)+3]);
          return q0.slerp(q1, alpha);
        };

        const pRootRest = evaluateVectorTrack(rootPosTrack, posTimes[0]);


        for (let i = 0; i < posTimes.length; i++) {
          const t = posTimes[i];
          const pRoot = evaluateVectorTrack(rootPosTrack, t);
          const pHips = evaluateVectorTrack(hipsPosTrack, t);
          const qRoot = evaluateQuaternionTrack(rootRotTrack, t);
          
          // pRoot is in CC4 world space (Y-up). pHips is in CC4 root space (Z-up).
          // 1. Convert hips to Y-up world space:
          const pHipsWorld = pHips.clone().applyQuaternion(qRoot);
          
          // 2. Add root motion delta (also in Y-up world space)
          const pRootDelta = pRoot.clone().sub(pRootRest);
          const pFinalWorld = pRootDelta.add(pHipsWorld);
          
          // We leave it in world space because the generic loop will apply P_src (Identity) and P_tgt_inv (+90 X) 
          // to correctly project it onto the target bone.
          
          posValues[3*i] = pFinalWorld.x;
          posValues[3*i+1] = pFinalWorld.y;
          posValues[3*i+2] = pFinalWorld.z;
        }
        
        const newHipsPosTrack = new THREE.VectorKeyframeTrack('mixamorig:Hips.position', new Float32Array(posTimes), posValues);
        if (hipsPosTrackIndex !== -1) {
          workingClip.tracks.splice(hipsPosTrackIndex, 1, newHipsPosTrack);
        } else {
          workingClip.tracks.push(newHipsPosTrack);
        }
        
        const updatedRootPosTrackIndex = workingClip.tracks.indexOf(rootPosTrack);
        if (updatedRootPosTrackIndex !== -1) {
          workingClip.tracks.splice(updatedRootPosTrackIndex, 1);
        }
      }
    }
  }

  // Determine height translations scale multiplier dynamically
  let srcHipsDefaultY = 0.991;
  let computedHipsRatio = 100.0;
  for (const tr of workingClip.tracks) {
    const [boneFull, prop] = tr.name.split('.');
    const match = boneFull.match(/mixamorig[:_]?(.+)/i);
    if (match) {
      const baseName = match[1];
      if (prop === 'position' && baseName.toLowerCase() === 'hips') {
        const resolvedHipsName = resolveTargetBoneName(targetInstance, 'Hips', sourceHairMap);
        const bone = resolvedHipsName ? targetInstance.getObjectByName(resolvedHipsName) as any : null;
        let refSrcY = 0.991;
        if (animBones[baseName] && animBones[baseName].defaultPosition) {
          refSrcY = animBones[baseName].defaultPosition.length();
        } else {
          refSrcY = 0.991;
        }
        if (refSrcY > 5.0) {
          refSrcY *= 0.01;
        }
        srcHipsDefaultY = refSrcY;

        let targetHipsHeight = 99.1;
        if (bone && bone.defaultPosition) {
          targetHipsHeight = bone.defaultPosition.length();
        }
        if (Math.abs(refSrcY) > 0) {
          computedHipsRatio = targetHipsHeight / Math.abs(refSrcY);
        }
      }
    }
  }

  const tracks: THREE.KeyframeTrack[] = [];



  for (const tr of workingClip.tracks) {
    const [boneFull, prop] = tr.name.split('.');
    
    let mappedBoneFull = boneFull;
    if (CC3_TO_MIXAMO[boneFull]) mappedBoneFull = 'mixamorig:' + CC3_TO_MIXAMO[boneFull];
    
    let match = mappedBoneFull.match(/mixamorig[:_]?(.+)/i);
    let baseName = match ? match[1] : '';
    
    if (mappedBoneFull.toLowerCase() === 'cc_base_boneroot' || mappedBoneFull.toLowerCase() === 'rootjoint') {
      baseName = 'Hips';
      match = ['Hips', 'Hips'];
    }

    if (!match) continue;

    let isRootJointTranslation = false;
    if (prop === 'position' && (boneFull.toLowerCase().includes('rootjoint') || boneFull.toLowerCase().includes('cc_base_boneroot'))) {
      baseName = 'Hips';
      isRootJointTranslation = true;
    }

    const targetBoneName = resolveTargetBoneName(targetInstance, baseName, sourceHairMap);
    if (!targetBoneName) continue;

    if (prop === 'scale') continue;
    const isHips = targetBoneName.toLowerCase().endsWith('hips') || targetBoneName.toLowerCase().includes('pelvis');
    if (prop === 'position' && !isHips) continue;

    const clone = tr.clone();
    clone.name = `${targetBoneName}.${prop}`;

    // Retarget position for hips
    if (prop === 'position' && isHips) {
      const bone = targetInstance.getObjectByName(targetBoneName) as any;
      if (bone && bone.defaultPosition) {
        let P_src = null;
        if (isRootJointTranslation) {
          P_src = new THREE.Quaternion();
        } else if (animBones[baseName]) {
          P_src = animBones[baseName].parentRestWorldQuaternion;
        } else {
          P_src = new THREE.Quaternion();
        }

        const P_tgt = (bone.parent && bone.parent.restWorldQuaternion)
          ? bone.parent.restWorldQuaternion
          : new THREE.Quaternion();
        const P_tgt_inv = P_tgt.clone().invert();

        let srcRestPos = null;
        if (isRootJointTranslation) {
          srcRestPos = new THREE.Vector3(0, srcHipsDefaultY, 0);
        } else if (animBones[baseName]) {
          srcRestPos = animBones[baseName].defaultPosition.clone();
          if (srcRestPos.length() > 5.0) {
            srcRestPos.multiplyScalar(0.01);
          }
        } else {
          srcRestPos = new THREE.Vector3(0, srcHipsDefaultY * 100, 0);
          if (srcRestPos.length() > 5.0) {
            srcRestPos.multiplyScalar(0.01);
          }
        }

        const restX = clone.values[0];
        const restY = clone.values[1];
        const restZ = clone.values[2];

        let isFlat = true;
        for (let j = 1; j < clone.values.length / 3; j++) {
          if (Math.abs(clone.values[3*j] - restX) > 0.001 ||
              Math.abs(clone.values[3*j+1] - restY) > 0.001 ||
              Math.abs(clone.values[3*j+2] - restZ) > 0.001) {
            isFlat = false;
            break;
          }
        }

        const animNameLower = rawClip.name.toLowerCase();
        const isWalk = (animNameLower.includes('walk') ||
                        animNameLower.includes('run') ||
                        animNameLower.includes('step') ||
                        animNameLower.includes('stairs')) &&
                       !animNameLower.includes('dance');

        if (isFlat && isWalk) {
          const duration = workingClip.duration;
          const fps = 30;
          const numFrames = Math.ceil(duration * fps) + 1;
          const newTimes = new Float32Array(numFrames);
          const newValues = new Float32Array(numFrames * 3);

          for (let f = 0; f < numFrames; f++) {
            const t = Math.min(f / fps, duration);
            newTimes[f] = t;
            const phase = (t / duration) * 2.0 * Math.PI;
            const dx = 0.8 * Math.cos(phase);
            const dy = 0.0;
            const dz = -1.6 * Math.sin(phase * 2.0);

            const dP = new THREE.Vector3(dx, dy, dz)
              .applyQuaternion(P_src)
              .applyQuaternion(P_tgt_inv);
            const resPos = bone.defaultPosition.clone().add(dP);

            newValues[3*f] = resPos.x;
            newValues[3*f+1] = resPos.y;
            newValues[3*f+2] = resPos.z;
          }
          clone.times = newTimes;
          clone.values = newValues;
        } else {
          let yMinDelta = 0;
          if (animNameLower.includes('takedown')) {
            let minY = Infinity;
            for (let j = 0; j < clone.values.length / 3; j++) {
              if (clone.values[3*j+1] < minY) minY = clone.values[3*j+1];
            }
            if (minY < 0) {
              yMinDelta = -minY;
            }
          }

          for (let j = 0; j < clone.values.length / 3; j++) {
            let yVal = clone.values[3*j+1] + yMinDelta;
            if (isRootJointTranslation && (animNameLower.includes('laying') || animNameLower.includes('sleeping'))) {
              yVal = 0.12; 
            }
            const isTPose = animNameLower.includes('t-pose') || animNameLower.includes('t_pose') || animNameLower.includes('tpose');
            const dy = (isWalk || isTPose) ? 0.0 : (yVal - srcRestPos.y) * computedHipsRatio;
            const dx = (isWalk || isTPose) ? 0.0 : (clone.values[3*j] - srcRestPos.x) * computedHipsRatio;
            const dz = (isWalk || isTPose) ? 0.0 : (clone.values[3*j+2] - srcRestPos.z) * computedHipsRatio;

            const dP = new THREE.Vector3(dx, dy, dz)
              .applyQuaternion(P_src)
              .applyQuaternion(P_tgt_inv);
            const resPos = bone.defaultPosition.clone().add(dP);

            clone.values[3*j] = resPos.x;
            clone.values[3*j+1] = resPos.y;
            clone.values[3*j+2] = resPos.z;
          }
        }
      }
    }

    // Retarget rotations
    if (prop === 'quaternion') {
      const bone = targetInstance.getObjectByName(targetBoneName) as any;
      if (bone) {
        if (bone.restLocalQuaternion && bone.restWorldQuaternion) {
          let B_src = null;
          let P_src = null;
          let clavicleTrack: THREE.KeyframeTrack | null = null;
          let clavicleParentRestWorld = new THREE.Quaternion();
          if (animBones[baseName]) {
            B_src = animBones[baseName].restWorldQuaternion.clone();
            P_src = animBones[baseName].parentRestWorldQuaternion.clone();
            if (isHips) {
              // Hips world rest rotation must be neutralized so the character stands up (for Mixamo +90X rest poses)
              B_src = new THREE.Quaternion();
            }


            // Check if we need to bake clavicle animation into the arm (if target lacks a clavicle)
            if (baseName === 'LeftArm' || baseName === 'RightArm') {
              const clavicleBaseName = baseName === 'LeftArm' ? 'LeftShoulder' : 'RightShoulder';
              const clavicleSynonyms = BONE_SYNONYMS[clavicleBaseName] || [];
              let targetHasClavicle = false;
              targetInstance.traverse(node => {
                if ((node as any).isBone && !targetHasClavicle) {
                  if (clavicleSynonyms.some(s => node.name.toLowerCase().includes(s))) {
                    targetHasClavicle = true;
                  }
                }
              });
              
              if (!targetHasClavicle) {
                // Target lacks clavicle. Find the clavicle track in the source animation.
                const clavicleSourceNode = animBones[baseName].bone.parent;
                if (clavicleSourceNode) {
                  const clavicleTrackName = `${clavicleSourceNode.name}.quaternion`;
                  clavicleTrack = rawClip.tracks.find(t => t.name === clavicleTrackName) || null;
                  if (clavicleTrack) {
                    const clavicleRestLocal = clavicleSourceNode.quaternion.clone(); // Rest local rotation
                    clavicleParentRestWorld = P_src.clone().multiply(clavicleRestLocal.invert());
                  }
                }
              }
            }
          } else {
            B_src = new THREE.Quaternion();
            P_src = new THREE.Quaternion();
          }

          if (B_src && P_src) {
            const B_tgt = bone.restWorldQuaternion;
            const P_tgt = (bone.parent && bone.parent.restWorldQuaternion)
              ? bone.parent.restWorldQuaternion
              : new THREE.Quaternion();
            const P_tgt_inv = P_tgt.clone().invert();
            const B_src_inv = B_src.clone().invert();

            for (let j = 0; j < clone.values.length / 4; j++) {
              const srcLocalQ = new THREE.Quaternion(
                clone.values[4*j],
                clone.values[4*j+1],
                clone.values[4*j+2],
                clone.values[4*j+3]
              );
              
              let currentP_src = P_src.clone();
              if (clavicleTrack) {
                // Evaluate clavicle animation at this frame
                const t = clone.times[j];
                const clavicleAnimatedLocal = evaluateQuaternionTrack(clavicleTrack, t);
                currentP_src = clavicleParentRestWorld.clone().multiply(clavicleAnimatedLocal);
              }

              if (isHips && j === 0) {
                console.log(`[DEBUG_HIPS] clip=${rawClip.name} P_src=`, currentP_src.toArray(), `srcLocalQ=`, clone.values.slice(0, 4));
              }

              const animWorldQ = currentP_src.multiply(srcLocalQ);
              const deltaQ = animWorldQ.clone().multiply(B_src_inv);
              const tgtAnimWorldQ = deltaQ.clone().multiply(B_tgt);
              const tgtLocalQ = P_tgt_inv.clone().multiply(tgtAnimWorldQ).normalize();

              clone.values[4*j]   = tgtLocalQ.x;
              clone.values[4*j+1] = tgtLocalQ.y;
              clone.values[4*j+2] = tgtLocalQ.z;
              clone.values[4*j+3] = tgtLocalQ.w;
            }
          } else {
            const parentRestWorldQ = (bone.parent && bone.parent.restWorldQuaternion)
              ? bone.parent.restWorldQuaternion
              : new THREE.Quaternion();
            const parentInv = parentRestWorldQ.clone().invert();
            const boneRestLocalQ = bone.restLocalQuaternion.clone();

            for (let i = 0; i < clone.values.length; i += 4) {
              const q = new THREE.Quaternion(clone.values[i], clone.values[i+1], clone.values[i+2], clone.values[i+3]);
              const resQ = parentInv.clone()
                .multiply(q)
                .multiply(parentRestWorldQ)
                .multiply(boneRestLocalQ);

              clone.values[i] = resQ.x;
              clone.values[i+1] = resQ.y;
              clone.values[i+2] = resQ.z;
              clone.values[i+3] = resQ.w;
            }
          }
        }
      }
    }

    tracks.push(clone);
  }

  return new THREE.AnimationClip(`${workingClip.name}_retargeted`, workingClip.duration, tracks);
}
