/**
 * Salopette.tsx — Salopette noire (GLB characters/clothing/salopette-noir.glb).
 * Coordonnées locales : centré par bbox, Y=0 = sol, hauteur normalisée 150cm.
 * Placement scène (sur portant MACKAPÄR) dans GlbItems.tsx.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

export function Salopette({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('characters/clothing/salopette-noir.glb');

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    const rawSize = glbLocalBBox(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(150 / rawSize.y);
    removeGlbLines(scene);
    mergeGlbByMaterial(scene);
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

useGLTF.preload('characters/clothing/salopette-noir.glb');
