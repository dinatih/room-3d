/**
 * LampOla.tsx — Lampe IKEA OLA (GLB items/lamp-ola/lamp-ola.glb).
 * Coordonnées locales : centré par bbox, Y=0 = sol, scale ×100, teintes jaunes → blanc.
 * Placement monde dans GlbItems.tsx.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

export function LampOla({ actionState, onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('items/lamp-ola/lamp-ola.glb');
  const isOn = actionState?.on !== undefined
    ? Boolean(actionState.on)
    : Boolean(actionState?.['lamp-toggle'] || actionState?.lampOn);

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.scale.setScalar(100);
    removeGlbLines(scene);
    scene.traverse(c => {
      const mesh = c as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat?.color) return;
      mesh.material = mat.clone();
      const hsl = { h: 0, s: 0, l: 0 };
      (mesh.material as THREE.MeshStandardMaterial).color.getHSL(hsl);
      if (hsl.h > 0.08 && hsl.h < 0.20 && hsl.s > 0.2) {
        (mesh.material as THREE.MeshStandardMaterial).color.set(0xffffff);
      }
    });
    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  useLayoutEffect(() => {
    scene.traverse((c) => {
      const mesh = c as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          if ('emissive' in m) {
            const stdMat = m as THREE.MeshStandardMaterial;
            if (stdMat.color && (stdMat.color.r > 0.5 && stdMat.color.g > 0.5 && stdMat.color.b > 0.5)) {
              if (isOn) {
                stdMat.emissive.set(0xffeedd);
                stdMat.emissiveIntensity = 1.5;
              } else {
                stdMat.emissive.set(0x000000);
                stdMat.emissiveIntensity = 0;
              }
            }
          }
        });
      }
    });
  }, [scene, isOn]);

  return <primitive object={scene} />;
}

useGLTF.preload('items/lamp-ola/lamp-ola.glb');
