/**
 * Sunnersta.tsx — Desserte roulante IKEA SUNNERSTA (GLB media/sunnersta_trolley_ikea.glb).
 * Coordonnées locales : centré par bbox, Y=0 = sol, normalisé 90cm max dim.
 * Placement monde dans GlbItems.tsx.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '../../../utils/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines } from '../../../utils/glbUtils';
import type { SceneItemProps } from '../../../types';

export function Sunnersta({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('media/sunnersta_trolley_ikea.glb');

  useLayoutEffect(() => {
    const rawSize = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(90 / Math.max(rawSize.x, rawSize.y, rawSize.z));
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    removeGlbLines(scene);
    scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });
    onSize(new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3()));
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload('media/sunnersta_trolley_ikea.glb');
