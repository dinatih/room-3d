import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

/**
 * KOPPLA Prise quadruple 2 ports USB, blanc, 3
 * Price: 17
 * URL: https://www.ikea.com/fr/fr/p/koppla-prise-quadruple-2-ports-usb-blanc-00314741/
 */
export function Koppla({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/media/glb/ikea-official/Koppla00314741.glb');

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

useGLTF.preload('/media/glb/ikea-official/Koppla00314741.glb');
