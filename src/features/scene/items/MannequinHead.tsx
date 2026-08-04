/**
 * MannequinHead.tsx — Tête de mannequin (GLB media/glb/wig_mannequin.glb).
 * Coordonnées locales : centré XZ, Y=0 = base épaules. Scale par hauteur (45 cm).
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const TARGET_H = 45;

export function MannequinHead({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('media/glb/wig_mannequin.glb');

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);
    const raw = glbLocalBBox(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(TARGET_H / raw.y);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(box.getSize(new THREE.Vector3()));

    // Ajouter une "perruque" aléatoire en teintant la matière
    const randomColor = new THREE.Color().setHSL(Math.random(), 0.8, 0.5);
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        // Cloner la matière pour ne pas affecter les autres instances
        mesh.material = (mesh.material as THREE.Material).clone();
        if ('color' in mesh.material) {
          (mesh.material as THREE.MeshStandardMaterial).color = randomColor;
        }
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload('media/glb/wig_mannequin.glb');
