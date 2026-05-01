/**
 * Scooter.tsx — Trottinette Xiaomi 4 (GLB media/xiaomi_electric_scooter_4.glb).
 * Coordonnées locales : centré par bbox, Y=0 = sol, hauteur normalisée 113cm.
 * Placement monde dans GlbItems.tsx.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@shared/utils/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@shared/utils/glbUtils';
import type { SceneItemProps } from '@shared/types';

export function Scooter({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('media/xiaomi_electric_scooter_4.glb');

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    const raw = glbLocalBBox(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(113 / raw.y);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    removeGlbLines(scene);
    scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload('media/xiaomi_electric_scooter_4.glb');
