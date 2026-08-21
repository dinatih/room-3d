import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

/**
 * VESTMARKA matelas à ressorts, ferme/bleu clair, 80x200 cm
 * Price: 99
 * URL: https://www.ikea.com/fr/fr/p/vestmarka-matelas-a-ressorts-ferme-bleu-clair-90470195/
 */
export function Vestmarka90470195({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/items/Vestmarka90470195.glb');

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

useGLTF.preload('/items/Vestmarka90470195.glb');
