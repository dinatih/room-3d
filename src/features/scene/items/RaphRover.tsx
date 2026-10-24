import { useLayoutEffect } from 'react';
import { Vector3 } from 'three';
import type { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '../useGLTFClone';
import { glbLocalBBox } from '../glbUtils';

export function RaphRover({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('items/raph-rover/raph-rover.glb');
  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.traverse(node => {
      if ('isMesh' in node && node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    onSize(glbLocalBBox(scene).getSize(new Vector3()));
  }, [scene, onSize]);
  return <primitive object={scene} />;
}
