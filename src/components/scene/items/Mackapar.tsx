/**
 * Mackapar.tsx — Portant IKEA MACKAPÄR (GLB media/mackapar_ikea.glb).
 * Coordonnées locales : centré par bbox, Y=0 = sol, scale Y→200cm.
 * Placement scène (avec vêtements) dans GlbItems.tsx.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '../../../utils/useGLTFClone';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

export function Mackapar({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('media/mackapar_ikea.glb');

  useLayoutEffect(() => {
    const rawBox = new THREE.Box3().setFromObject(scene);
    const scaleY = 200 / (rawBox.max.y - rawBox.min.y);
    scene.scale.set(100, scaleY, 100);
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });
    onSize(new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3()));
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload('media/mackapar_ikea.glb');
