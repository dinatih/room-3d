import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '../glbUtils';
import { useGLTFClone } from '../useGLTFClone';
import type { SceneItemProps } from '@shared/types';

/** Official IKEA GLB exports in metres: convert to centimetres, centre horizontally and place the base at Y=0. */
export function createStaticGlbItem(path: string) {
  useGLTF.preload(path);
  return function StaticGlbItem({ onSize, ...props }: SceneItemProps) {
    const { scene } = useGLTFClone(path);
    useLayoutEffect(() => {
      scene.scale.set(1, 1, 1);
      removeGlbLines(scene);
      scene.scale.setScalar(100);
      mergeGlbByMaterial(scene);
      const box = glbLocalBBox(scene);
      scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
      onSize(box.getSize(new THREE.Vector3()));
    }, [scene, onSize]);
    return <group {...props}><primitive object={scene} /></group>;
  };
}
