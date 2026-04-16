/**
 * useGLTFClone — useGLTF + clone(true) par instance.
 *
 * useGLTF retourne le même Object3D partagé entre tous les consommateurs
 * d'un même GLB. Quand deux canvases (scène principale + inventaire) rendent
 * le même composant simultanément, l'objet est "volé" de l'un vers l'autre
 * (un Object3D ne peut avoir qu'un seul parent en Three.js).
 *
 * Ce hook crée un clone indépendant par instance de composant, éliminant
 * le conflit sans modifier le cache useGLTF.
 */
import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export function useGLTFClone(path: string): { scene: THREE.Group } {
  const gltf = useGLTF(path);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  return { scene };
}
