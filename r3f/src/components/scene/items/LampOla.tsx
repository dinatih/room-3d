/**
 * LampOla.tsx — Lampe IKEA OLA (GLB media/ikea_lamp_ola.glb).
 * Coordonnées locales : centré par bbox, Y=0 = sol, scale ×100, teintes jaunes → blanc.
 * Placement monde dans GlbItems.tsx.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { removeGlbLines } from '../../../utils/glbUtils';
import type { SceneItemProps } from '../../../types';

export function LampOla({ onSize }: SceneItemProps) {
  const { scene } = useGLTF('media/ikea_lamp_ola.glb');

  useLayoutEffect(() => {
    scene.scale.setScalar(100);
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
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    removeGlbLines(scene);
    onSize(new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3()));
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload('media/ikea_lamp_ola.glb');
