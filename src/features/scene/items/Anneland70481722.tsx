import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

/**
 * ÅNNELAND matelas hybride, ferme/blanc, 80x200 cm
 * Price: 349
 * URL: https://www.ikea.com/fr/fr/p/anneland-matelas-hybride-ferme-blanc-70481722/
 */
export function Anneland70481722({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/items/anneland70481722/Anneland70481722.glb');

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

useGLTF.preload('/items/anneland70481722/Anneland70481722.glb');
