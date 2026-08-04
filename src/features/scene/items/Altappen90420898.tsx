import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

/**
 * ALTAPPEN Caillebotis, gris clair, 0
 * Price: 9
 * URL: https://www.ikea.com/fr/fr/p/altappen-caillebotis-gris-clair-90420898/
 */
export function Altappen90420898({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/media/glb/ikea-official/Altappen90420898.glb');

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

useGLTF.preload('/media/glb/ikea-official/Altappen90420898.glb');
