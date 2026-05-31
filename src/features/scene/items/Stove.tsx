/**
 * Stove.tsx — Plaque de cuisson VÄLBILDAD IKEA (GLB media/glb/VÄLBILDAD.glb).
 * Dimensions réelles : 29×5×52 cm (L×H×P) à ×100.
 * Le GLB officiel IKEA est en mètres → scale ×100 (1 unité = 1 cm).
 * Coordonnées locales : centré X/Z, Y=0 = dessous de la plaque.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB = 'media/glb/ikea-official/VÄLBILDAD.glb';

export function Stove({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone(GLB);

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
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
