import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

/**
 * ANNONS Faitout avec couvercle, verre, acier inoxydable
 * Price: 
 * URL: https://www.ikea.com/fr/fr/p/annons-faitout-avec-couvercle-verre-acier-inoxydable-80298474/
 */
export function Annons80298474({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/items/annons80298474/Annons80298474.glb');

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

useGLTF.preload('/items/annons80298474/Annons80298474.glb');
