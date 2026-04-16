/**
 * PottedPalm.tsx — Palmier en pot (GLB media/potted_palm.glb).
 * Coordonnées locales : X/Z centrés, Y=0 = sol.
 * Placement monde dans Garden.tsx.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { removeGlbLines } from '../../../utils/glbUtils';
import type { SceneItemProps } from '../../../types';

const TARGET_H = 150;

export function PottedPalm({ onSize }: SceneItemProps) {
  const { scene } = useGLTF('media/potted_palm.glb');

  useLayoutEffect(() => {
    const raw = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    const s = TARGET_H / Math.max(raw.x, raw.y, raw.z);
    scene.scale.setScalar(s);
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
    const size = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    onSize(size);
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload('media/potted_palm.glb');
