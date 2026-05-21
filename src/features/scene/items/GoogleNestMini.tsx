/**
 * GoogleNestMini.tsx — Google Nest Mini 2 (GLB media/google_nest_mini_2.glb).
 * Coordonnées locales : centré XYZ par bbox. Diamètre normalisé 10 cm
 * (réf : Nest Mini ≈ Ø9,8 × 4,2 cm).
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const TARGET_W = 10; // diamètre cible (X)

export function GoogleNestMini({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('media/google_nest_mini_2.glb');

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);
    const raw = glbLocalBBox(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(TARGET_W / raw.x);
    const box = glbLocalBBox(scene);
    // Centré bbox
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -(box.min.y + box.max.y) / 2,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload('media/google_nest_mini_2.glb');
