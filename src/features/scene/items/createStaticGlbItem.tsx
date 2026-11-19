import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '../glbUtils';
import { useGLTFClone, preloadSceneGLTF } from '../useGLTFClone';
import { useSceneGlass } from '../utils/useSceneGlass';
import type { SceneModelProps } from '@shared/types';

/** Static GLB items, converted to scene centimetres (source metres by default). */
export function createStaticGlbItem(path: string, { origin = 'bottom', rotationY, scale = 100 }: {
  origin?: 'bottom' | 'top';
  rotationY?: number;
  scale?: number;
} = {}) {
  preloadSceneGLTF(path);
  const preparedTemplates = new WeakMap<THREE.Group, THREE.Group>();
  const prepareSource = (source: THREE.Group): THREE.Group => {
    const cached = preparedTemplates.get(source);
    if (cached) return cached;
    const template = source.clone(true);
    template.scale.set(1, 1, 1);
    removeGlbLines(template);
    template.scale.setScalar(scale);
    if (rotationY !== undefined) template.rotation.y = rotationY;
    mergeGlbByMaterial(template);
    preparedTemplates.set(source, template);
    return template;
  };
  return function StaticGlbItem({ onSize }: SceneModelProps) {
    const { scene } = useGLTFClone(path, false, prepareSource);
    useLayoutEffect(() => {
      if (!scene.userData.merged) {
        scene.scale.set(1, 1, 1);
        removeGlbLines(scene);
        scene.scale.setScalar(scale);
        // The first merge bakes the rotation into the geometry.
        if (rotationY !== undefined) scene.rotation.y = rotationY;
        mergeGlbByMaterial(scene);
      } else {
        scene.scale.set(1, 1, 1);
      }
      const box = glbLocalBBox(scene);
      scene.position.set(-(box.min.x + box.max.x) / 2, origin === 'top' ? -box.max.y : -box.min.y, -(box.min.z + box.max.z) / 2);
      onSize?.(box.getSize(new THREE.Vector3()));
    }, [scene, onSize]);
    useSceneGlass(scene);
    return <group><primitive object={scene} /></group>;
  };
}
