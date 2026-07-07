// Bone mapping dictionary between Mixamo and Lara 2026 Native
    const BONE_SYNONYMS = {
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

    function resolveTargetFingerBoneName(targetInstance, side, type, segment) {
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

      let foundName = null;
      targetInstance.traverse(node => {
        if (node.isBone && !foundName) {
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

    function getDepth(node) {
      let depth = 0;
      let curr = node;
      while (curr && curr.parent) {
        depth++;
        curr = curr.parent;
      }
      return depth;
    }

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

    function retargetMixamoClip(rawClip, targetInstance, animScene) {
      if (!rawClip || !targetInstance) return null;

      const animBones = {};
      const sourceHairMap = new Map();
      if (animScene) {
        animScene.updateMatrixWorld(true);

        const sourceHairBones = [];
        animScene.traverse(c => {
          if (c.isBone) {
            const nameLower = (c.name || '').toLowerCase();
            if (nameLower.includes('hair') || nameLower.includes('ponytail') || nameLower.includes('braid')) {
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

        animScene.traverse(c => {
          if (c.isBone) {
            const match = c.name.match(/mixamorig[:_]?(.+)/i);
            if (match) {
              animBones[match[1]] = {
                restWorldQuaternion: c.getWorldQuaternion(new THREE.Quaternion()),
                restLocalQuaternion: c.quaternion.clone(),
                parentRestWorldQuaternion: c.parent ? c.parent.getWorldQuaternion(new THREE.Quaternion()) : new THREE.Quaternion(),
                defaultPosition: c.position.clone()
              };
            }
          }
        });
      }

      const clonedTracks = [];
      for (const track of rawClip.tracks) {
        const cl = track.clone();
        cl.times = new Float32Array(track.times);
        cl.values = new Float32Array(track.values);
        clonedTracks.push(cl);
      }
      const workingClip = new THREE.AnimationClip(rawClip.name, rawClip.duration, clonedTracks);

      for (const track of workingClip.tracks) {
        if (track.name.endsWith('.position')) {
          const firstVal = new THREE.Vector3(track.values[0], track.values[1], track.values[2]);
          if (firstVal.length() > 5.0) {
            for (let i = 0; i < track.values.length; i++) {
              track.values[i] *= 0.01;
            }
          }
        }
      }

      const rootRotTrackIndex = workingClip.tracks.findIndex(t => t.name.toLowerCase().includes('rootjoint') && t.name.endsWith('.quaternion'));
      const hipsRotTrackIndex = workingClip.tracks.findIndex(t => (t.name.toLowerCase().includes('hips') || t.name.toLowerCase().endsWith('hips.quaternion')) && t.name.endsWith('.quaternion') && !t.name.toLowerCase().includes('rootjoint'));

      if (rootRotTrackIndex !== -1) {
        const rootRotTrack = workingClip.tracks[rootRotTrackIndex];
        if (hipsRotTrackIndex !== -1) {
          const hipsRotTrack = workingClip.tracks[hipsRotTrackIndex];
          const timesSet = new Set([...rootRotTrack.times, ...hipsRotTrack.times]);
          const times = Array.from(timesSet).sort((a, b) => a - b);
          
          const values = new Float32Array(times.length * 4);
          
          function evaluateQuaternionTrack(track, t) {
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
          }

          for (let i = 0; i < times.length; i++) {
            const t = times[i];
            const qRoot = evaluateQuaternionTrack(rootRotTrack, t);
            const qHips = evaluateQuaternionTrack(hipsRotTrack, t);
            const qCombined = qRoot.multiply(qHips);
            
            values[4*i] = qCombined.x;
            values[4*i+1] = qCombined.y;
            values[4*i+2] = qCombined.z;
            values[4*i+3] = qCombined.w;
          }
          
          hipsRotTrack.times = new Float32Array(times);
          hipsRotTrack.values = values;
          workingClip.tracks.splice(rootRotTrackIndex, 1);
        } else {
          const hipsPosTrack = workingClip.tracks.find(t => t.name.toLowerCase().includes('hips') && !t.name.toLowerCase().includes('rootjoint'));
          let hipsName = 'mixamorig:Hips.quaternion';
          if (hipsPosTrack) {
            hipsName = hipsPosTrack.name.split('.')[0] + '.quaternion';
          }
          rootRotTrack.name = hipsName;
        }
      }

      let srcHipsDefaultY = 0.991;
      let computedHipsRatio = 1.0; 
      
      const hipsBone = targetInstance.getObjectByName(resolveTargetBoneName(targetInstance, 'Hips', sourceHairMap));
      
      for (const tr of workingClip.tracks) {
        const [boneFull, prop] = tr.name.split('.');
        const match = boneFull.match(/mixamorig[:_]?(.+)/i);
        if (match) {
          const baseName = match[1];
          if (prop === 'position' && baseName.toLowerCase() === 'hips') {
            let refSrcY = 0.991;
            if (animBones[baseName]) {
              refSrcY = animBones[baseName].defaultPosition.y;
            }
            if (refSrcY > 5.0) {
              refSrcY *= 0.01;
            }
            srcHipsDefaultY = refSrcY;
            
            let targetHipsHeight = 0.991;
            if (hipsBone && hipsBone.defaultPosition) {
              const isLaraNative = targetInstance.getObjectByName('mixamorig_root_hips') !== undefined;
              targetHipsHeight = isLaraNative ? hipsBone.defaultPosition.z : hipsBone.defaultPosition.y;
            }
            
            if (refSrcY > 0) {
              computedHipsRatio = targetHipsHeight / refSrcY;
            }
          }
        }
      }

      const hasRootTranslation = workingClip.tracks.some(t => t.name.toLowerCase().includes('rootjoint') && t.name.endsWith('.position'));
      const tracks = [];

      for (const tr of workingClip.tracks) {
        const [boneFull, prop] = tr.name.split('.');
        const match = boneFull.match(/mixamorig[:_]?(.+)/i);
        if (!match) continue;
        let baseName = match[1];

        if (prop === 'position' && baseName.toLowerCase() === 'hips' && hasRootTranslation) {
          continue;
        }

        let isRootJointTranslation = false;
        if (prop === 'position' && baseName.toLowerCase().includes('rootjoint')) {
          baseName = 'Hips';
          isRootJointTranslation = true;
        }

        const targetBoneName = resolveTargetBoneName(targetInstance, baseName, sourceHairMap);
        if (targetBoneName) {
          if (prop === 'scale') continue;

          const isHips = targetBoneName.toLowerCase().endsWith('hips');
          if (prop === 'position' && !isHips) continue;

          const clone = tr.clone();
          clone.name = `${targetBoneName}.${prop}`;

          if (prop === 'position' && isHips) {
            const bone = targetInstance.getObjectByName(targetBoneName);
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
                srcRestPos = new THREE.Vector3(0, 0, 0);
              } else if (animBones[baseName]) {
                srcRestPos = animBones[baseName].defaultPosition.clone();
                if (srcRestPos.length() > 5.0) {
                  srcRestPos.multiplyScalar(0.01);
                }
              } else {
                srcRestPos = new THREE.Vector3(0, srcHipsDefaultY, 0);
              }

              const animNameLower = (rawClip.name || "").toLowerCase();
              const isWalk = (animNameLower.includes('walk') || 
                              animNameLower.includes('run') || 
                              animNameLower.includes('step') || 
                              animNameLower.includes('stairs')) &&
                             !animNameLower.includes('dance');

              if (isWalk) {
                for (let j = 0; j < clone.values.length / 3; j++) {
                  let yVal = clone.values[3*j+1];
                  const dx = (clone.values[3*j] - srcRestPos.x) * computedHipsRatio;
                  const dy = 0.0; // walking in-place
                  const dz = (clone.values[3*j+2] - srcRestPos.z) * computedHipsRatio;
                  
                  const dP = new THREE.Vector3(dx, dy, dz)
                    .applyQuaternion(P_src)
                    .applyQuaternion(P_tgt_inv);
                  const resPos = bone.defaultPosition.clone().add(dP);
                  
                  clone.values[3*j] = resPos.x;
                  clone.values[3*j+1] = resPos.y;
                  clone.values[3*j+2] = resPos.z;
                }
              } else {
                for (let j = 0; j < clone.values.length / 3; j++) {
                  let yVal = clone.values[3*j+1];
                  if (isRootJointTranslation && (animNameLower.includes('laying') || animNameLower.includes('sleeping'))) {
                    yVal = 0.12; 
                  }
                  const dx = (clone.values[3*j] - srcRestPos.x) * computedHipsRatio;
                  const dy = (yVal - srcRestPos.y) * computedHipsRatio;
                  const dz = (clone.values[3*j+2] - srcRestPos.z) * computedHipsRatio;
                  
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

          if (prop === 'quaternion') {
            const tgtLower = targetBoneName.toLowerCase();
            const isClavicle = tgtLower.includes('clavicle') || 
                               tgtLower.includes('shoulder_1') || 
                               tgtLower.includes('shoulder1') || 
                               (tgtLower.includes('shoulder') && 
                                !tgtLower.includes('shoulder_2') && 
                                !tgtLower.includes('shoulder2') && 
                                !tgtLower.includes('shoulder 2'));
            if (isClavicle) continue;

            const bone = targetInstance.getObjectByName(targetBoneName);
            if (bone) {
              if (bone.restLocalQuaternion && bone.restWorldQuaternion) {
                let B_src = null;
                let P_src = null;
                
                if (animBones[baseName]) {
                  const cached = animBones[baseName];
                  B_src = cached.restWorldQuaternion;
                  P_src = cached.parentRestWorldQuaternion;
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

                  for (let i = 0; i < clone.values.length; i += 4) {
                    const srcLocalQ = new THREE.Quaternion(clone.values[i], clone.values[i+1], clone.values[i+2], clone.values[i+3]);
                    const animWorldQ = P_src.clone().multiply(srcLocalQ);
                    const deltaQ = animWorldQ.clone().multiply(B_src_inv);
                    const tgtAnimWorldQ = deltaQ.clone().multiply(B_tgt);
                    const tgtLocalQ = P_tgt_inv.clone().multiply(tgtAnimWorldQ).normalize();

                    clone.values[i] = tgtLocalQ.x;
                    clone.values[i+1] = tgtLocalQ.y;
                    clone.values[i+2] = tgtLocalQ.z;
                    clone.values[i+3] = tgtLocalQ.w;
                  }
                } else {
                  // Fallback
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
      }

      const trackSample = tracks.find(t => t.name.includes('LeftArm') || t.name.includes('arm_left_shoulder_2') || t.name.includes('upper_arm'));
      if (trackSample) {
        console.log(`[TrackSample] model="${targetInstance.name}" name="${trackSample.name}" valuesSample="${Array.from(trackSample.values.slice(0, 8)).map(n => n.toFixed(4)).join(', ')}"`);
      }
      console.log(`[Retarget] model="${targetInstance.name}" rawTracks=${workingClip.tracks.length} retargetedTracks=${tracks.length} sampleHips="${resolveTargetBoneName(targetInstance, 'Hips', sourceHairMap)}" sampleLeftArm="${resolveTargetBoneName(targetInstance, 'LeftArm', sourceHairMap)}"`);
      return new THREE.AnimationClip(`${workingClip.name}_retargeted`, workingClip.duration, tracks);
    }

    const ANIMATION_FILES = [
      "idle.glb",
      "anim_back_flip_to_uppercut.glb",
      "walking.glb",
      "happy_walk.glb",
      "victory.glb",
      "jumping_jacks.glb",
      "t-pose.glb",
      "angry_gesture.glb",
      "ascending_stairs.glb",
      "asking_question.glb",
      "beckoning.glb",
      "catwalk_sequence_01.glb",
      "catwalk_sequence_02.glb",
      "catwalk_sequence_03.glb",
      "catwalk_sequence_04.glb",
      "catwalk_sequence_05.glb",
      "cheering_while_sitting.glb",
      "clapping.glb",
      "closing.glb",
      "crawl_backwards_in_prone.glb",
      "descending_stairs.glb",
      "dig_and_plant_seeds.glb",
      "disappointed.glb",
      "double_leg_takedown_-_attacker.glb",
      "drinking_fountain.glb",
      "finding.glb",
      "gaming.glb",
      "hanging_idle.glb",
      "having_a_meeting,_female.glb",
      "having_a_meeting,_male.glb",
      "laying_seizure.glb",
      "laying_severe_cough.glb",
      "left_turn.glb",
      "looking_through_files_low.glb",
      "martelo_do_chau_sem_mao.glb",
      "one_shoulder_lean.glb",
      "pick_fruit.glb",
      "plant_a_plant.glb",
      "plant_tree.glb",
      "pointing.glb",
      "pull_pilot_from_seat.glb",
      "pull_plant.glb",
      "pulled_from_seat.glb",
      "rapping.glb",
      "right_turn.glb",
      "rummaging.glb",
      "scared.glb",
      "searching_pockets.glb",
      "seated_idle.glb",
      "sitting_drinking.glb",
      "sitting_talking.glb",
      "skinning_test.glb",
      "stand_up.glb",
      "standing_arguing.glb",
      "surprised.glb",
      "swing_into_wall.glb",
      "talking.glb",
      "talking_at_watercooler.glb",
      "talking_on_a_cell_phone.glb",
      "talking_on_phone.glb",
      "telling_a_secret.glb",
      "tonic_seizure.glb",
      "tripping.glb",
      "watering.glb",
      "wheelbarrow_walk_turn.glb",
      "wheelchair.glb",
      "yelling.glb",
      "woman-solo.glb",
      "knee-push-up.glb"
    ];

    function formatName(fileName) {
      let name = fileName.replace('.glb', '');
      name = name.replace(/_/g, ' ');
      name = name.replace(/,/g, '');
      name = name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      return name;
    }

    let currentAnimFile = null;
    let rawAnimClip = null;
    let animScene = null;
    let isPaused = false;
    let playbackSpeed = 1.0;

    window.getCurrentAnimFile = () => currentAnimFile;
    window.getIsPaused = () => isPaused;
    window.getPlaybackSpeed = () => playbackSpeed;

    