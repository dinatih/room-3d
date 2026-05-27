/**
 * Kallax2x2.tsx — Étagère KALLAX 2×2 IKEA (GLB media/glb/KALLAX etag 77x77 blanc.glb).
 * Dimensions réelles : 77×77×39 cm (L×H×P).
 * Le GLB officiel IKEA est en mètres → scale ×100 pour la scène (1 unité = 1 cm).
 * Convention : Y=0 = sommet, Y=-H = bas (identique à Kallax1x1 et Kallax procédural).
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB = 'media/glb/KALLAX etag 77x77 blanc.glb';

export function Kallax2x2({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone(GLB);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.rotation.y = Math.PI; // accrochages côté mur
    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.max.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
