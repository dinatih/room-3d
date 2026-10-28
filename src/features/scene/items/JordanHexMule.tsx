import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial, removeGlbLines } from '@features/scene/glbUtils';
import type { SceneModelProps } from '@shared/types';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { useGLTF } from '@react-three/drei';

const GLB_PATH = '/items/jordan-hex-mule/JordanHexMule.glb';

/**
 * JordanHexMule.tsx — Jordan Hex Mule SP (University Red, FJ0603-600), paire complète GLB.
 */
export function JordanHexMule({ onSize }: SceneModelProps) {
  const { scene } = useGLTFClone(GLB_PATH);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    removeGlbLines(scene);
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              m.side = THREE.DoubleSide;
            });
          } else {
            mesh.material.side = THREE.DoubleSide;
          }
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
    <group>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(GLB_PATH);
