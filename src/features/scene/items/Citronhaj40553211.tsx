import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { CitronhajFill, type CitronhajContents } from './CitronhajFill';

/**
 * CITRONHAJ salière/poivrière, verre transparent/acier inoxydable, 8 cm
 * Price: 2,99
 * URL: https://www.ikea.com/fr/fr/p/citronhaj-saliere-poivriere-verre-transparent-acier-inoxydable-40553211/
 */
export function Citronhaj40553211({ onSize, contents = 'salt', ...props }: Partial<SceneItemProps> & { contents?: CitronhajContents }) {
  const { scene } = useGLTFClone('/items/citronhaj40553211/Citronhaj40553211.glb');

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
      <CitronhajFill contents={contents} height={5.0} />
    </group>
  );
}

useGLTF.preload('/items/citronhaj40553211/Citronhaj40553211.glb');
