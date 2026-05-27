/**
 * Kallax2x2Spec.tsx — KALLAX 2×2 sans cloison verticale centrale dans la rangée haute.
 * Permet de loger le four à pizza dans l'espace supérieur pleine largeur (77cm).
 * GLB généré depuis "KALLAX etag 77x77 blanc.glb" en supprimant les 64 triangles
 * de la cloison centrale haute (centroïde X ≈ 0, Y > 0.388m).
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB = 'media/glb/KALLAX etag 77x77 open-top blanc.glb';

export function Kallax2x2Spec({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone(GLB);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.setScalar(100);
    scene.rotation.y = Math.PI;
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
