/**
 * Kallax1x1.tsx — KALLAX Étagère, blanc, 42x42 cm (203.015.54).
 * Dimensions réelles : 42×41×39 cm (L×H×P).
 * Le GLB officiel IKEA est en mètres → scale ×100 pour la scène (1 unité = 1 cm).
 * Coordonnées locales : centré X/Z, Y=0 = sol.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/kallax20301554/Kallax20301554.glb';

export function Kallax1x1({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone(GLB);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.rotation.y = Math.PI; // accrochages côté mur
    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);
    // Convention imposée par KallaxNW (stack pivoté rotZ=π/2) :
    // Y=0 = sommet de l'unité, Y=-H = bas — identique au composant Kallax procédural.
    // Le GLB officiel IKEA a X/Z déjà centrés et Y min ≈ 0 (bas) → on décale Y de -H.
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
