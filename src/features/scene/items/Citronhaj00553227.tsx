import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

/**
 * CITRONHAJ salière/poivrière, verre transparent/acier inoxydable, 12 cm
 * Price: 3,99
 * URL: https://www.ikea.com/fr/fr/p/citronhaj-saliere-poivriere-verre-transparent-acier-inoxydable-00553227/
 */
export function Citronhaj00553227({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/items/citronhaj00553227/Citronhaj00553227.glb');

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

useGLTF.preload('/items/citronhaj00553227/Citronhaj00553227.glb');
