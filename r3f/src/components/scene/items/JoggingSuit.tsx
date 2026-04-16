/**
 * JoggingSuit.tsx — Jogging suit (GLB media/realistic_human_cloths.glb).
 * Coordonnées locales : centré par bbox, Y=0 = sol, hauteur normalisée 170cm.
 * Placement monde dans Garden.tsx.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { removeGlbLines } from '../../../utils/glbUtils';
import type { SceneItemProps } from '../../../types';

const TARGET_H = 170;
const red = new THREE.MeshStandardMaterial({ color: 0xcc2020, roughness: 0.6 });

export function JoggingSuit({ onSize }: SceneItemProps) {
  const { scene } = useGLTF('media/realistic_human_cloths.glb');

  useLayoutEffect(() => {
    const raw = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(TARGET_H / Math.max(raw.x, raw.y, raw.z));
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    removeGlbLines(scene);
    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (m.isMesh) { m.material = red; m.castShadow = true; m.receiveShadow = true; }
    });
    const size = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    onSize(size);
  }, [scene]);

  return <primitive object={scene} />;
}

useGLTF.preload('media/realistic_human_cloths.glb');
