import * as THREE from 'three';

/**
 * Normalise les noms des os Mixamo pour éviter les espaces et caractères spéciaux.
 */
export function normalizeMixamoBoneNames(root: THREE.Object3D): void {
  root.traverse(c => { if ((c as THREE.Bone).isBone) c.name = c.name.replace(/[ :]/g, '_'); });
}

/**
 * Trouve un os par son nom dans la hiérarchie.
 */
export function findBone(root: THREE.Object3D, name: string): THREE.Bone | null {
  let found: THREE.Bone | null = null;
  root.traverse(c => { if ((c as THREE.Bone).isBone && c.name === name && !found) found = c as THREE.Bone; });
  return found;
}

/**
 * Enregistre les positions/rotations de repos des os.
 */
export function cacheRestStates(root: THREE.Object3D): void {
  root.traverse(c => {
    if ((c as THREE.Bone).isBone) {
      (c as THREE.Bone).userData.restQuat = (c as THREE.Bone).quaternion.clone();
      (c as THREE.Bone).userData.restPos = (c as THREE.Bone).position.clone();
    }
  });
}

/**
 * Adapte une animation Mixamo au squelette de Lara.
 * Supprime les échelles, verrouille la position Hips (sauf Y), et corrige le pivot.
 */
export function retargetMixamoClip(clip: THREE.AnimationClip, restPos?: THREE.Vector3): THREE.AnimationClip {
  const retargeted: THREE.KeyframeTrack[] = [];
  for (const track of clip.tracks) {
    let name = track.name;
    const slashIdx = name.lastIndexOf('/'); if (slashIdx >= 0) name = name.substring(slashIdx + 1);
    const dotIdx = name.lastIndexOf('.'); if (dotIdx < 0) continue;
    const bonePart = name.substring(0, dotIdx).replace(/[ :]/g, '_'), propPart = name.substring(dotIdx);
    name = bonePart + propPart;
    if (bonePart === '_rootJoint' || (propPart === '.position' && !bonePart.includes('Hips')) || propPart === '.scale') continue;
    const cloned = track.clone(); cloned.name = name;
    
    // Verrouillage STRICT des hanches X/Z et scale Y (m -> cm)
    if (name === 'mixamorig_Hips.position') {
      const vals = cloned.values;
      // Force exact centering on rest position
      const rx = restPos?.x ?? 0, rz = restPos?.z ?? 0;
      for (let i = 0; i < vals.length; i += 3) {
        vals[i] = rx;
        vals[i + 1] *= 100; // m to cm
        vals[i + 2] = rz;
      }
    }
    
    // Correction de rotation Hips (YXZ)
    if (name === 'mixamorig_Hips.quaternion') {
      const vals = cloned.values, q = new THREE.Quaternion(), e = new THREE.Euler();
      for (let i = 0; i < vals.length; i += 4) {
        q.set(vals[i], vals[i+1], vals[i+2], vals[i+3]); e.setFromQuaternion(q, 'YXZ');
        e.z = 0; e.y *= 0.1; q.setFromEuler(e);
        vals[i] = q.x; vals[i+1] = q.y; vals[i+2] = q.z; vals[i+3] = q.w;
      }
    }
    retargeted.push(cloned);
  }
  return new THREE.AnimationClip(clip.name || 'walk-mixamo', clip.duration, retargeted);
}
