/**
 * PizzaOven.tsx — Four à pizza (GLB media/pizza_oven.glb).
 * Fidèle à js/decor/decor.js : scale = 19×0.8 / rawHeight, rotation.y = -π/2.
 * Centré X/Z, Y=0 = sol (surface d'appui).
 * Placement monde dans GlbItems.tsx (Kallax SW spec, étagère supérieure).
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '../../../utils/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines } from '../../../utils/glbUtils';
import type { SceneItemProps } from '../../../types';

export function PizzaOven({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('media/pizza_oven.glb');

  useLayoutEffect(() => {
    const raw = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(19 * 0.8 / raw.y);
    scene.rotation.y = -Math.PI / 2;
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

useGLTF.preload('media/pizza_oven.glb');
