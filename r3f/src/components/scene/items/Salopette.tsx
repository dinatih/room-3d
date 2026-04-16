/**
 * Salopette.tsx — Salopette noire (GLB media/salopette-noir.glb).
 * Coordonnées locales : centré par bbox, Y=0 = sol, hauteur normalisée 150cm.
 * Placement scène (sur portant MACKAPÄR) dans GlbItems.tsx.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { removeGlbLines } from '../../../utils/glbUtils';
import type { SceneItemProps } from '../../../types';

export function Salopette({ onSize }: SceneItemProps) {
  const { scene } = useGLTF('media/salopette-noir.glb');

  useLayoutEffect(() => {
    const rawSize = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(150 / rawSize.y);
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

useGLTF.preload('media/salopette-noir.glb');
