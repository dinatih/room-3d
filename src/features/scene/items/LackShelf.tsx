/**
 * LackShelf.tsx — Étagère murale LACK IKEA (GLB media/glb/LACK étagère murale 110x26 blanc.glb).
 * Dimensions réelles : 110×5×26 cm (L×H×P) à ×100.
 * Le GLB officiel IKEA est en mètres → scale ×100 (1 unité = 1 cm).
 * Le GLB est orienté depth-en-Y, thickness-en-Z → rotation.x = -π/2 pour
 * retrouver l'orientation horizontale (depth→Z, thickness→Y).
 * Coordonnées locales : centré X/Z, Y=0 = dessous de l'étagère.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/LACK étagère murale 110x26 blanc.glb';

export function LackShelf({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone(GLB);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.rotation.x = Math.PI / 2; // depth(Y)→Z, thickness(Z)→Y
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
