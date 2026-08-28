import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

/**
 * IKEA 365+ bouteille à eau, gris foncé, 0.5 l
 * Price: 
 * URL: https://www.ikea.com/fr/fr/p/ikea-365-bouteille-a-eau-gris-fonce-20480013/
 */
export function Ikea20480013({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/items/ikea20480013/Ikea20480013.glb');

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

useGLTF.preload('/items/ikea20480013/Ikea20480013.glb');
