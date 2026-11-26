/**
 * MeubleT.tsx — Meuble bibliothèque en T (étagère excentrée : 40 cm gauche, 18 cm droite).
 * Coordonnées locales : X/Z centrés sur le caisson, Y=0 = base du meuble.
 */
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { SceneModelProps } from '@shared/types';
import { glbLocalBBox, mergeGlbByMaterial } from '../glbUtils';
import { useGLTFClone, preloadSceneGLTF } from '../useGLTFClone';

const PATH = '/items/meuble-t/meuble-t.glb';
preloadSceneGLTF(PATH);

export function MeubleT({ onSize }: SceneModelProps) {
  const { scene } = useGLTFClone(PATH);

  useLayoutEffect(() => {
    if (!scene.userData.merged) {
      scene.scale.setScalar(100);
      mergeGlbByMaterial(scene);
    } else {
      scene.scale.set(1, 1, 1);
    }
    const box = glbLocalBBox(scene);
    // Conserve X=0, Z=0 au centre du caisson (l'étagère est volontairement excentrée)
    scene.position.set(0, -box.min.y, 0);
    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  return <primitive object={scene} />;
}
