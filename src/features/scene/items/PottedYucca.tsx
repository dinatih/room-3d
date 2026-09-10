/**
 * PottedYucca.tsx — Yucca Elephantipes en pot (IKEA).
 * Modèle : /home/dinatih/3D Resources/city/i_kea_yucca_elephantipes_planta.glb
 * Coordonnées locales : X/Z centrés, Y=0 = sol.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const TARGET_H = 140; // Hauteur en cm (échelle 1 unité = 1 cm)

export function PottedYucca({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('items/plant-yucca/yucca_elephantipes.glb');

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

useGLTF.preload('items/plant-yucca/yucca_elephantipes.glb');
