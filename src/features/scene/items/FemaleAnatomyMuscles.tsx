/**
 * FemaleAnatomyMuscles.tsx — Modèle anatomique féminin (muscles).
 * Échelle : hauteur humaine standard (170 cm).
 * Coordonnées locales : centré en X/Z, base au sol à Y=0.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const TARGET_H = 170; // 170 cm

export function FemaleAnatomyMuscles({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('models/anatomy/female_anatomy_muscles.glb');

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);
    const raw = glbLocalBBox(scene).getSize(new THREE.Vector3());
    const s = TARGET_H / Math.max(raw.x, raw.y, raw.z);
    scene.scale.setScalar(s);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  return <primitive object={scene} />;
}

useGLTF.preload('models/anatomy/female_anatomy_muscles.glb');
