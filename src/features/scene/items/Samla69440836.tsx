import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

/**
 * SAMLA boîte avec couvercle, transparent, 39x28x14 cm/11 l
 * Price: 4,99
 * URL: https://www.ikea.com/fr/fr/p/samla-boite-avec-couvercle-transparent-s69440836/
 */
export function Samla69440836({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/items/samla69440836/Samla69440836.glb');

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  return (
    <group {...props}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/items/samla69440836/Samla69440836.glb');
