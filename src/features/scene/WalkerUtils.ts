import * as THREE from 'three';

/**
 * Normalise les noms des os Mixamo.
 * On utilise l'underscore (_) partout.
 */
export function normalizeMixamoBoneNames(root: THREE.Object3D): void {
  root.traverse(c => { 
    if ((c as THREE.Bone).isBone) {
      c.name = c.name.replace(/[ :]/g, '_'); 
    }
  });
}

/**
 * Trouve un os par son nom (supporte les variantes).
 */
export function findBone(root: THREE.Object3D, name: string): THREE.Bone | null {
  const norm = name.replace(/[ :]/g, '_');
  let found: THREE.Bone | null = null;
  root.traverse(c => { 
    if ((c as THREE.Bone).isBone && !found) {
      if (c.name.replace(/[ :]/g, '_') === norm) found = c as THREE.Bone;
    }
  });
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
 * Adapte une animation Mixamo au squelette.
 * Cible mixamorig_Name (Underscore Standard).
 */
export function retargetMixamoClip(clip: THREE.AnimationClip, restPos?: THREE.Vector3): THREE.AnimationClip {
  const retargeted: THREE.KeyframeTrack[] = [];
  
  for (const track of clip.tracks) {
    let tname = track.name;
    const dotIdx = tname.lastIndexOf('.'); if (dotIdx < 0) continue;
    let bonePart = tname.substring(0, dotIdx);
    const propPart = tname.substring(dotIdx);
    
    // Nettoyage préfixes Armature| ou Mixamo_
    const sepIdx = Math.max(bonePart.lastIndexOf('|'), bonePart.lastIndexOf(':'), bonePart.lastIndexOf('/'));
    if (sepIdx >= 0) bonePart = bonePart.substring(sepIdx + 1);
    
    // On veut le nom pur sans mixamorig_ ni mixamorig:
    let pureName = bonePart.replace('mixamorig_', '').replace('mixamorig:', '').replace('mixamorig', '').replace(/ /g, '_');
    
    // CAS SPÉCIAL : rootJoint ou Armature name
    // Si c'est le root, on l'ignore car on gère la translation nous-mêmes, 
    // SAUF si c'est de la rotation (le perso qui penche)
    if (pureName.toLowerCase().includes('rootjoint') || pureName.toLowerCase().includes('armature')) {
        if (propPart === '.quaternion') {
            // On peut appliquer la rotation du root aux Hips pour que le perso penche !
            pureName = 'Hips';
        } else {
            continue; 
        }
    }
    
    if (pureName === '' || pureName.toLowerCase() === 'hips') pureName = 'Hips';
    
    // Cible UNDERSCORE
    const targetBoneName = 'mixamorig_' + pureName;
    const finalTrackName = targetBoneName + propPart;

    // Skip SCALE tracks
    if (propPart === '.scale') continue;
    
    const cloned = track.clone(); 
    cloned.name = finalTrackName;
    
    // FLUID MOVEMENT: Allow Hips to sway
    if (pureName === 'Hips' && propPart === '.position') {
      const vals = cloned.values;
      const rx = restPos?.x ?? 0, ry = restPos?.y ?? 90, rz = restPos?.z ?? 0;
      const isCM = ry > 20;

      const startX = vals[0], startY = vals[1], startZ = vals[2];
      
      for (let i = 0; i < vals.length; i += 3) {
        const dx = vals[i] - startX;
        const dy = vals[i + 1] - startY;
        const dz = vals[i + 2] - startZ;

        vals[i] = rx + (isCM ? dx * 100 : dx);
        vals[i + 1] = ry + (isCM ? dy * 100 : dy);
        
        // Bloque la translation longue mais garde le balancement local
        if (Math.abs(dz) < 0.4) {
            vals[i + 2] = rz + (isCM ? dz * 100 : dz);
        } else {
            vals[i + 2] = rz;
        }
      }
    }
    
    // ON NE TORD PLUS LES HANCHES (Pas de e.x = 0)
    // On laisse l'animation originale dicter l'inclinaison.

    retargeted.push(cloned);
  }
  return new THREE.AnimationClip(clip.name || 'walk-mixamo', clip.duration, retargeted);
}
