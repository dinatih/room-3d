import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

/**
 * VÄLBILDAD Table de cuisson induction, IKEA 300 noir, 29 cm
 * Price: 
 * URL: https://www.ikea.com/fr/fr/p/vaelbildad-plaque-de-cuisson-a-induction-ikea-300-noir-20467592/
 */
export function Valbildad20467592({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/items/valbildad20467592/Valbildad20467592.glb');

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

useGLTF.preload('/items/valbildad20467592/Valbildad20467592.glb');
