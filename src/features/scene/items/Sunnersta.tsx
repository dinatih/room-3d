/**
 * Sunnersta.tsx — Desserte roulante IKEA SUNNERSTA (GLB media/sunnersta_trolley_ikea.glb).
 * Coordonnées locales : centré par bbox, Y=0 = sol, normalisé 90cm max dim.
 * Placement monde dans GlbItems.tsx.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

export function Sunnersta({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('media/sunnersta_trolley_ikea.glb');

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    const rawSize = glbLocalBBox(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(90 / Math.max(rawSize.x, rawSize.y, rawSize.z));
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

useGLTF.preload('media/sunnersta_trolley_ikea.glb');
