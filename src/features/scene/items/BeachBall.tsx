/**
 * BeachBall.tsx — Ballon de plage gonflable 3D (beach_ball.glb)
 * Conforme aux directives du projet (SceneItemProps, scale 1 unité = 1 cm).
 */
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { removeGlbLines, glbLocalBBox } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

export function BeachBall({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('items/beach_ball.glb');

  useLayoutEffect(() => {
    if (!scene) return;
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);

    const box = glbLocalBBox(scene);
    const rawSize = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z) || 2.0;

    // Échelle : ballon de plage de 35 cm de diamètre (1 unité = 1 cm)
    const targetDiameter = 35.0;
    scene.scale.setScalar(targetDiameter / maxDim);

    // Centrage en X/Z, base posée à Y=0
    const scaledBox = glbLocalBBox(scene);
    scene.position.set(
      -(scaledBox.min.x + scaledBox.max.x) / 2,
      -scaledBox.min.y,
      -(scaledBox.min.z + scaledBox.max.z) / 2
    );

    scene.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    onSize?.(new THREE.Vector3(targetDiameter, targetDiameter, targetDiameter));
  }, [scene, onSize]);

  return <primitive object={scene} />;
}
