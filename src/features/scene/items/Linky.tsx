import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/compteur-linky/compteur-linky.glb';

export function Linky({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone(GLB);

  useLayoutEffect(() => {
    // 1. Reset scale et nettoyage des arêtes parasites
    scene.scale.set(1, 1, 1);
    removeGlbLines(scene);
    mergeGlbByMaterial(scene);

    // 2. Mesure locale
    const box = glbLocalBBox(scene);
    const center = box.getCenter(new THREE.Vector3());

    // 3. Centrage local en X/Z et base à Y=0
    scene.position.set(-center.x, -box.min.y, -center.z);

    // 4. Notification des dimensions réelles
    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  return (
    <group {...props}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(GLB);
