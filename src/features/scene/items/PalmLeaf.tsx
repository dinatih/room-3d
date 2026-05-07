/**
 * PalmLeaf.tsx — Plante artificielle feuille de palmier (GLB media/Palm_Leaf1.glb).
 * Coordonnées locales : X/Z centrés, Y=0 = sol.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/utils/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/utils/glbUtils';
import type { SceneItemProps } from '@shared/types';

const TARGET_H = 80; // cm — ajuster si trop grand/petit

export function PalmLeaf({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('media/Palm_Leaf1.glb');

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
    scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload('media/Palm_Leaf1.glb');
