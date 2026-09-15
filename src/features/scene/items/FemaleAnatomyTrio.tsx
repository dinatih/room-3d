/**
 * FemaleAnatomyTrio.tsx — Trio anatomique féminin (corps, squelette, muscles).
 * Modèle GLB : models/humans/female_body__skeleton_muscles__base_mesh.glb
 * Coordonnées locales : centré en X/Z, base au sol à Y=0.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const TARGET_H = 170; // 170 cm

export function FemaleAnatomyTrio({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('models/humans/female_body__skeleton_muscles__base_mesh.glb');

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);
    const raw = glbLocalBBox(scene).getSize(new THREE.Vector3());
    const s = TARGET_H / (raw.y || 1);
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

useGLTF.preload('models/humans/female_body__skeleton_muscles__base_mesh.glb');
