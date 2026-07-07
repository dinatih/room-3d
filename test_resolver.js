const BONE_SYNONYMS = {
      'Hips': ['spine', 'pelvis', 'hip', 'root', 'roothips'],
      'Spine': ['spine001', 'spine01', 'spinelower', 'spine0', 'spine1'],
      'Spine1': ['spine002', 'spine02', 'spine1'],
      'Spine2': ['spine003', 'spine02', 'spineupper', 'spine2', 'spine03', 'spine3'],
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
function resolveTargetBoneName(targetInstance, baseName, sourceHairMap = null) {
      const baseNameLower = baseName.toLowerCase();
      if (baseNameLower.includes('hair') || baseNameLower.includes('ponytail') || baseNameLower.includes('braid')) {
        if (sourceHairMap && sourceHairMap.has(baseNameLower)) {
          const targetName = sourceHairMap.get(baseNameLower);
          if (targetInstance.getObjectByName(targetName)) {
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

      const fingerMatch = baseName.match(/Hand(Thumb|Index|Middle|Ring|Pinky)(\d)/i);
      if (fingerMatch) {
        const side = baseName.toLowerCase().includes('left') ? 'left' : 'right';
        const type = fingerMatch[1].toLowerCase();
        const segment = fingerMatch[2];
        const resolvedFinger = resolveTargetFingerBoneName(targetInstance, side, type, segment);
        if (resolvedFinger) return resolvedFinger;
      }

      const synonyms = BONE_SYNONYMS[baseName];
      if (synonyms) {
        for (const syn of synonyms) {
          let foundName = null;
          targetInstance.traverse(node => {
            if (node.isBone && !foundName) {
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

const targetInstance = {
  traverse: (cb) => {
    const bones = ['spine', 'spine.001', 'spine.002', 'spine.003', 'spine.004', 'spine.005', 'spine.006'];
    bones.forEach(b => cb({isBone: true, name: b}));
  },
  getObjectByName: (name) => {
    const bones = ['spine', 'spine.001', 'spine.002', 'spine.003', 'spine.004', 'spine.005', 'spine.006'];
    return bones.includes(name) ? {name: name} : undefined;
  }
};

console.log('Hips ->', resolveTargetBoneName(targetInstance, 'Hips'));
console.log('Spine ->', resolveTargetBoneName(targetInstance, 'Spine'));
console.log('Spine1 ->', resolveTargetBoneName(targetInstance, 'Spine1'));
console.log('Spine2 ->', resolveTargetBoneName(targetInstance, 'Spine2'));
