import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

/**
 * FÖRNUFT fourchette, acier inoxydable, 19 cm
 * Price: 2,49
 * URL: https://www.ikea.com/fr/fr/p/foernuft-fourchette-acier-inoxydable-40428482/
 */
export function Fornuft40428482({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/items/fornuft40428482/Fornuft40428482.glb');

  useLayoutEffect(() => {
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

useGLTF.preload('/items/fornuft40428482/Fornuft40428482.glb');
