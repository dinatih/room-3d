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

export function LampOla({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('items/lamp-ola/lamp-ola.glb');

  useLayoutEffect(() => {
    scene.scale.setScalar(100);
    removeGlbLines(scene);
    scene.traverse(c => {
      const mesh = c as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat?.color) return;
      const hsl = { h: 0, s: 0, l: 0 };
      mat.color.getHSL(hsl);
      if (hsl.h > 0.08 && hsl.h < 0.20 && hsl.s > 0.2) {
        mesh.material = mat.clone();
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
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload('items/lamp-ola/lamp-ola.glb');
