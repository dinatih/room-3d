/**
 * useGLTFClone — useGLTF + SkeletonUtils.clone() par instance.
 *
 * useGLTF retourne le même Object3D partagé entre tous les consommateurs.
 * Pour les modèles riggés (SkinnedMesh), un .clone() standard ne suffit pas :
 * les os sont clonés mais le mesh reste lié aux os d'origine.
 *
 * SkeletonUtils.clone() s'assure que les SkinnedMesh du clone pointent vers
 * les os clonés correspondants.
 */
import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';

export function useGLTFClone(path: string): { scene: THREE.Group; animations: THREE.AnimationClip[] } {
  const gltf = useGLTF(path);
  const scene = useMemo(() => {
    const cloned = SkeletonUtils.clone(gltf.scene) as THREE.Group;
    const baseName = path.split('/').pop()?.replace(/\.glb$/i, '') || 'Model3D';
    if (!cloned.name || cloned.name === 'Scene' || cloned.name === 'Group') {
      cloned.name = baseName;
    }
    cloned.userData = { ...cloned.userData, gltfPath: path, itemName: cloned.userData.itemName || baseName };
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        if (!child.userData.itemName) {
          child.userData.itemName = baseName;
        }
      }
    });
    return cloned;
  }, [gltf.scene, path]);
  return { scene, animations: gltf.animations };
}
