/**
 * TruckerCap.tsx — Casquette camionneur rouge (GLB items/trucker-cap-red/TruckerCapRed.glb).
 * Coordonnées locales : centré par bbox, Y=0 = sol, largeur réelle 18,5 cm.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneModelProps } from '@shared/types';

export const GLB_TRUCKER_CAP = 'items/trucker-cap-red/TruckerCapRed.glb';

export function TruckerCap({ onSize }: SceneModelProps) {
  const { scene } = useGLTFClone(GLB_TRUCKER_CAP);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);

    const rawSize = glbLocalBBox(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(18.5 / rawSize.x);

    scene.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );

    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  return <primitive object={scene} />;
}

useGLTF.preload(GLB_TRUCKER_CAP);
