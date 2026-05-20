/**
 * MannequinHead.tsx — Tête de mannequin (GLB media/wig_mannequin.glb).
 * Coordonnées locales : centré XZ, Y=0 = base épaules. Scale par hauteur (45 cm).
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const TARGET_H = 45;

export function MannequinHead({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('media/wig_mannequin.glb');

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);
    const raw = glbLocalBBox(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(TARGET_H / raw.y);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload('media/wig_mannequin.glb');
