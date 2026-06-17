import os

file_path = 'lara_xbot_debug.html'
if os.path.exists(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    start_marker = "    // ── DYNAMIC RETARGETING CLIP MAKER ──"
    end_marker = "    // --- HELPERS ---"

    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)

    if start_idx != -1 and end_idx != -1:
        new_func = """    // ── DYNAMIC RETARGETING CLIP MAKER ──
    function getCleanRetargetedClip(rawClip, modelKey, animKey) {
      if (!rawClip) return null;

      const tracks = [];
      const isLara = (modelKey === 'lara');

      // Detection of unit ratio (meters to cm)
      let ratio = 1.0;
      const hipsPosTrack = rawClip.tracks.find(t => t.name.toLowerCase().includes('hips.position'));
      if (hipsPosTrack && Math.abs(hipsPosTrack.values[1]) < 5.0 && Math.abs(hipsPosTrack.values[1]) > 0.1) {
          ratio = 100.0;
      }

      for (const tr of rawClip.tracks) {
        const [boneFull, prop] = tr.name.split('.');
        
        let baseName = null;
        const match = boneFull.match(/mixamorig[:_]?(.+)/i);
        if (match) {
            baseName = match[1];
        } else if (boneFull === '_rootJoint') {
            baseName = '_rootJoint';
        } else {
            continue;
        }

        let targetBoneName = null;

        if (!isLara) {
          targetBoneName = boneFull;
        } else {
          // Lara mapping
          if (baseName === 'Hips') {
              targetBoneName = 'mixamorig_root_hips';
          } else {
              const keyName = `mixamorig:${baseName}`;
              targetBoneName = BONE_MAP[keyName] || getFingerLaraName(keyName);
          }
        }

        if (targetBoneName) {
          const checkKey = `mixamorig:${baseName}`;
          if (isLara && mappingActive[checkKey] === false) continue;
          if (prop === 'scale') continue;

          const isHips = targetBoneName.toLowerCase().includes('hips');
          if (prop === 'position' && !isHips) continue;

          const clone = tr.clone();
          clone.name = `${targetBoneName}.${prop}`;
          clone.values = new Float32Array(clone.values);

          const bone = MODELS_META[modelKey].instance ? MODELS_META[modelKey].instance.getObjectByName(targetBoneName) : null;

          // --- POSITION RETARGETING ---
          if (prop === 'position' && isHips && bone && bone.defaultPosition) {
              let P_src = null;
              if (animKey && animSkeletons[animKey] && animSkeletons[animKey][baseName]) {
                  P_src = animSkeletons[animKey][baseName].parentRestWorldQuaternion;
              } else {
                  const inst = MODELS_META.xbot.instance;
                  const srcBone = inst ? (inst.getObjectByName('mixamorig_' + baseName) || inst.getObjectByName('mixamorig:' + baseName) || inst.getObjectByName(baseName)) : null;
                  P_src = (srcBone && srcBone.parent && srcBone.parent.restWorldQuaternion) ? srcBone.parent.restWorldQuaternion : new THREE.Quaternion();
              }
              const P_tgt = (bone.parent && bone.parent.restWorldQuaternion) ? bone.parent.restWorldQuaternion : new THREE.Quaternion();
              const P_tgt_inv = P_tgt.clone().invert();

              const restX = tr.values[0], restY = tr.values[1], restZ = tr.values[2];
              
              // Simple movement for now, we'll fix external root motion separately
              for (let j = 0; j < clone.values.length / 3; j++) {
                const dx = (tr.values[3*j] - restX) * ratio;
                const dy = (tr.values[3*j+1] - restY) * ratio;
                const dz = (tr.values[3*j+2] - restZ) * ratio;

                const dP = new THREE.Vector3(dx, dy, dz).applyQuaternion(P_src).applyQuaternion(P_tgt_inv);
                const resPos = bone.defaultPosition.clone().add(dP);
                clone.values[3*j] = resPos.x;
                clone.values[3*j+1] = resPos.y;
                clone.values[3*j+2] = resPos.z;
              }
          }

          // --- QUATERNION RETARGETING ---
          if (prop === 'quaternion' && bone) {
            if (isLara && targetBoneName.includes('shoulder_1')) continue;
            if (bone.restLocalQuaternion && bone.restWorldQuaternion) {
                let B_src = null, P_src = null;
                if (animKey && animSkeletons[animKey] && animSkeletons[animKey][baseName]) {
                  const cached = animSkeletons[animKey][baseName];
                  B_src = cached.restWorldQuaternion;
                  P_src = cached.parentRestWorldQuaternion;
                } else {
                  const inst = MODELS_META.xbot.instance;
                  const srcBone = inst ? (inst.getObjectByName('mixamorig_' + baseName) || inst.getObjectByName('mixamorig:' + baseName) || inst.getObjectByName(baseName)) : null;
                  if (srcBone) {
                    B_src = srcBone.restWorldQuaternion;
                    P_src = (srcBone.parent && srcBone.parent.restWorldQuaternion) ? srcBone.parent.restWorldQuaternion : new THREE.Quaternion();
                  }
                }
                if (B_src && P_src) {
                  const B_tgt = bone.restWorldQuaternion;
                  const P_tgt = (bone.parent && bone.parent.restWorldQuaternion) ? bone.parent.restWorldQuaternion : new THREE.Quaternion();
                  const P_tgt_inv = P_tgt.clone().invert();
                  const B_src_inv = B_src.clone().invert();
                  for (let i = 0; i < clone.values.length; i += 4) {
                    const q = new THREE.Quaternion(clone.values[i], clone.values[i+1], clone.values[i+2], clone.values[i+3]);
                    const resQ = P_tgt_inv.clone().multiply(P_src).multiply(q).multiply(B_src_inv).multiply(B_tgt);
                    clone.values[i] = resQ.x;
                    clone.values[i+1] = resQ.y;
                    clone.values[i+2] = resQ.z;
                    clone.values[i+3] = resQ.w;
                  }
                }
            }
          }
          tracks.push(clone);
        }
      }

      return new THREE.AnimationClip(`${rawClip.name}_${modelKey}`, rawClip.duration, tracks);
    }
"""
        new_content = content[:start_idx] + new_func + content[end_idx:]
        with open(file_path, 'w') as f:
            f.write(new_content)
        print("SUCCESS")
    else:
        print("MARKERS NOT FOUND")
else:
    print("FILE NOT FOUND")
