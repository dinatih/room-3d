/**
 * BaseballCap.tsx — Casquette baseball (GLB media/baseball_cap.glb).
 * Coordonnées locales : centré par bbox, Y=0 = sol, largeur normalisée 20cm, rouge.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/utils/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/utils/glbUtils';
import type { SceneItemProps } from '@shared/types';

const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.65 });

export function BaseballCap({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('media/baseball_cap.glb');

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);

    const rawSize = glbLocalBBox(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(20 / rawSize.x);

    scene.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        (obj as THREE.Mesh).material = redMat;
        (obj as THREE.Mesh).castShadow = true;
      }
    });

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

useGLTF.preload('media/baseball_cap.glb');
