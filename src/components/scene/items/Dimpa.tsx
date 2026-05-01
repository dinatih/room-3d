/**
 * Dimpa.tsx — Sac de rangement IKEA DIMPA (GLB media/DIMPA.glb).
 * Dimensions réelles : 68×67×27 cm (L×H×P) à ×100.
 * Le GLB officiel IKEA est en mètres → scale ×100 (1 unité = 1 cm).
 * Coordonnées locales : centré X/Z, Y=0 = sol.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '../../../utils/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '../../../utils/glbUtils';
import type { SceneItemProps } from '../../../types';

const GLB = 'media/DIMPA.glb';

export function Dimpa({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone(GLB);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
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
