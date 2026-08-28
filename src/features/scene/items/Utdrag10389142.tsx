import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

/**
 * UTDRAG Hotte aspirante intégrée, acier inoxydable
 * Price: 
 * URL: https://www.ikea.com/fr/fr/p/utdrag-hotte-aspirante-integree-acier-inoxydable-10389142/
 */
export function Utdrag10389142({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/items/utdrag10389142/Utdrag10389142.glb');

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.rotation.x = Math.PI / 2;
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

useGLTF.preload('/items/utdrag10389142/Utdrag10389142.glb');
