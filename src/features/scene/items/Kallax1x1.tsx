/**
 * Kallax1x1.tsx — Étagère KALLAX 1×1 IKEA (GLB media/KALLAX etag 42x41 blanc.glb).
 * Dimensions réelles : 42×41×39 cm (L×H×P).
 * Le GLB officiel IKEA est en mètres → scale ×100 pour la scène (1 unité = 1 cm).
 * Coordonnées locales : centré X/Z, Y=0 = sol.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB = 'media/KALLAX etag 42x41 blanc.glb';

export function Kallax1x1({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone(GLB);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.rotation.y = Math.PI; // accrochages côté mur
    const box = glbLocalBBox(scene);
    // Convention imposée par KallaxNW (stack pivoté rotZ=π/2) :
    // Y=0 = sommet de l'unité, Y=-H = bas — identique au composant Kallax procédural.
    // Le GLB officiel IKEA a X/Z déjà centrés et Y min ≈ 0 (bas) → on décale Y de -H.
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.max.y,
      -(box.min.z + box.max.z) / 2,
    );
    scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
