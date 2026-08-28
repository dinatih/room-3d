import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

/**
 * HAVBÄCK / ORRSJÖN meuble avec tiroirs/vasque/mitigeur, blanc, 62x49x69 cm
 * Price: 
 * URL: https://www.ikea.com/fr/fr/p/havbaeck-orrsjoen-meuble-avec-tiroirs-vasque-mitigeur-blanc-s49514017/
 */
export function Havback49514017({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/items/havback49514017/Havback49514017.glb');

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

useGLTF.preload('/items/havback49514017/Havback49514017.glb');
