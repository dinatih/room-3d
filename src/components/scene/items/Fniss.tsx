/**
 * Fniss.tsx — Corbeille FNISS IKEA (GLB media/FNISS poubelle 10 l blanc.glb).
 * Dimensions réelles : 28×28×28 cm (L×H×P) à ×100.
 * Le GLB officiel IKEA est en mètres → scale ×100 (1 unité = 1 cm).
 * Coordonnées locales : centré X/Z, Y=0 = sol.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '../../../utils/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines } from '../../../utils/glbUtils';
import type { SceneItemProps } from '../../../types';

const GLB = 'media/FNISS poubelle 10 l blanc.glb';

export function Fniss({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone(GLB);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });
    onSize(new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3()));
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
