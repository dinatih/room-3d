import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

/**
 * METOD Élément mural, blanc, 40x37x100 cm
 * Price: 30 €
 * URL: https://www.ikea.com/fr/fr/p/metod-rangement-mural-blanc-50205532/
 */
export function Metod50205532({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/items/metod50205532/Metod50205532.glb');

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.rotation.set(-Math.PI / 2, 0, 0); // Z-up GLB → debout
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

useGLTF.preload('/items/metod50205532/Metod50205532.glb');
