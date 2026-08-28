import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

/**
 * BOHOLMEN évier intégré, 1 bac, acier inoxydable, 47x30 cm
 * Price: 
 * URL: https://www.ikea.com/fr/fr/p/boholmen-evier-integre-1-bac-acier-inoxydable-s99157501/
 */
export function Boholmen99157501({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/items/boholmen99157501/Boholmen99157501.glb');

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

useGLTF.preload('/items/boholmen99157501/Boholmen99157501.glb');
