/**
 * Viggja.tsx — Desserte IKEA VIGGJA (GLB media/viggja.glb, déjà en cm).
 * Coordonnées locales : centré par bbox, Y=0 = sol.
 * Placement monde dans Garden.tsx.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@shared/utils/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@shared/utils/glbUtils';
import type { SceneItemProps } from '@shared/types';

export function Viggja({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('media/viggja.glb');

  useLayoutEffect(() => {
    removeGlbLines(scene);
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

useGLTF.preload('media/viggja.glb');
