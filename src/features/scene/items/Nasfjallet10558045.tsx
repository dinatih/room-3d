import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

/**
 * NÄSFJÄLLET surmatelas, blanc, 80x200 cm
 * Price: 35
 * URL: https://www.ikea.com/fr/fr/p/naesfjaellet-surmatelas-blanc-10558045/
 */
export function Nasfjallet10558045({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/items/nasfjallet10558045/Nasfjallet10558045.glb');

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

useGLTF.preload('/items/nasfjallet10558045/Nasfjallet10558045.glb');
