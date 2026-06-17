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

      for (const tr of rawClip.tracks) {
        const [boneFull, prop] = tr.name.split('.');
        
        let baseName = null;
        const match = boneFull.match(/mixamorig[:_]?(.+)/i);
        if (match) baseName = match[1];
        else if (boneFull === '_rootJoint') baseName = '_rootJoint';
        else continue;

        let targetBoneName = null;
        if (!isLara) {
          targetBoneName = boneFull; 
        } else {
          if (baseName === 'Hips') targetBoneName = 'mixamorig_root_hips';
          else if (baseName === '_rootJoint') targetBoneName = 'mixamorig_root_ground';
          else {
              const keyName = `mixamorig:${baseName}`;
              targetBoneName = BONE_MAP[keyName] || getFingerLaraName(keyName);
          }
        }

        if (targetBoneName) {
          const checkKey = `mixamorig:${baseName}`;
          if (isLara && mappingActive[checkKey] === false) continue;
          if (prop === 'scale') continue;

          const isHips = targetBoneName.toLowerCase().includes('hips');
          const isRoot = targetBoneName.toLowerCase().includes('ground');
          if (prop === 'position' && !isHips && !isRoot) continue;

          const clone = tr.clone();
          clone.name = `${targetBoneName}.${prop}`;
          
          // CRITICAL: We DO NOT mutate the track values anymore.
          // Let Three.js handle the interpolation.
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
