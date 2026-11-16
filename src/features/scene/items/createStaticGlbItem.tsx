import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '../glbUtils';
import { useGLTFClone, preloadSceneGLTF } from '../useGLTFClone';
import type { SceneModelProps } from '@shared/types';

/** Static GLB items, converted to scene centimetres (source metres by default). */
export function createStaticGlbItem(path: string, { origin = 'bottom', rotationY, scale = 100 }: {
  origin?: 'bottom' | 'top';
  rotationY?: number;
  scale?: number;
} = {}) {
  preloadSceneGLTF(path);
  return function StaticGlbItem({ onSize }: SceneModelProps) {
    const { scene } = useGLTFClone(path);
    useLayoutEffect(() => {
      scene.scale.set(1, 1, 1);
      removeGlbLines(scene);
      scene.scale.setScalar(scale);
      // The first merge bakes the rotation into the geometry.
      if (rotationY !== undefined && !scene.userData.merged) scene.rotation.y = rotationY;
      mergeGlbByMaterial(scene);
      const box = glbLocalBBox(scene);
      scene.position.set(-(box.min.x + box.max.x) / 2, origin === 'top' ? -box.max.y : -box.min.y, -(box.min.z + box.max.z) / 2);
      onSize?.(box.getSize(new THREE.Vector3()));
    }, [scene, onSize]);
    return <group><primitive object={scene} /></group>;
  };
}
