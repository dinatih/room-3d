import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { glbLocalBBox } from '@features/scene/glbUtils';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import type { SceneItemProps } from '@shared/types';

const GLB = '/items/ikea36590066708/Ikea36590066708.glb';

export function Ikea36590066708({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone(GLB);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.scale.setScalar(100);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
