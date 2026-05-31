/**
 * Lillhavet.tsx — IKEA LILLHAVET (GLB media/glb/LILLHAVET.glb).
 * GLB officiel IKEA en mètres → scale ×100 (1 unité = 1 cm).
 * Coordonnées locales : centré X/Z, Y=0 = base.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB = 'media/glb/ikea-official/LILLHAVET.glb';

export function Lillhavet({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone(GLB);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);
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
