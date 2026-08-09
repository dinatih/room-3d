import { useGLTF } from '@react-three/drei';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import { SceneItemProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';

/**
 * BLÅSKATA coussin, cylindrique/gris clair, 80 cm
 * Price: 24,99
 * URL: https://www.ikea.com/fr/fr/p/blaskata-coussin-cylindrique-gris-clair-50569513/
 */
export function Blaskata50569513({ onSize, ...props }: SceneItemProps) {
  const { scene } = useGLTFClone('/media/glb/ikea-official/Blaskata50569513.glb');

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    
    // Override material to red
    scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) {
        const m = c as THREE.Mesh;
        if (m.material) {
          const mat = m.material as THREE.MeshStandardMaterial;
          mat.color = new THREE.Color(0xff2222); // Rouge vif
          mat.roughness = 0.8;
        }
      }
    });

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

useGLTF.preload('/media/glb/ikea-official/Blaskata50569513.glb');
