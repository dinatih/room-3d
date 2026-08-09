import { useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SceneItemProps } from '@shared/types';
import { glbLocalBBox } from '@features/scene/glbUtils';
import { useGLTFClone } from '@features/scene/useGLTFClone';

export function ElectricRacket({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('/models/electric_racket.glb');
  const group = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.updateMatrixWorld(true);

    const size = glbLocalBBox(scene);

    if (size.max.x - size.min.x > 0 && size.max.y - size.min.y > 0 && size.max.z - size.min.z > 0) {
      // Deform to 24 wide, 43 high. We'll scale Z proportionally to Y or X.
      // Let's use 2 as a fixed depth or scale it proportionally to the height.
      const scaleZ = 2 / (size.max.z - size.min.z); 
      scene.scale.set(24 / (size.max.x - size.min.x), 43 / (size.max.y - size.min.y), scaleZ);
    }

    scene.updateMatrixWorld(true);
    const finalSize = glbLocalBBox(scene);

    scene.position.set(0, -finalSize.min.y, 0);

    scene.traverse((c) => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
    });

    if (onSize) {
      onSize(finalSize.getSize(new THREE.Vector3()));
    }
  }, [scene, onSize]);

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/electric_racket.glb');
