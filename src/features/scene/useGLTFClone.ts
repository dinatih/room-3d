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
    return SkeletonUtils.clone(gltf.scene) as THREE.Group;
  }, [gltf.scene]);
  return { scene, animations: gltf.animations };
}
