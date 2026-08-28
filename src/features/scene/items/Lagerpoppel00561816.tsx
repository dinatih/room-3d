import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

/**
 * LAGERPOPPEL housse de coussin, fuchsia, 40x58 cm
 * Price: 3,99
 * URL: https://www.ikea.com/fr/fr/p/lagerpoppel-housse-de-coussin-fuchsia-00561816/
 */
export function Lagerpoppel00561816({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/items/lagerpoppel00561816/Lagerpoppel00561816.glb');

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

useGLTF.preload('/items/lagerpoppel00561816/Lagerpoppel00561816.glb');
