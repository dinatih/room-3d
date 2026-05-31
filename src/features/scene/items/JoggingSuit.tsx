/**
 * JoggingSuit.tsx — Jogging suit (GLB media/glb/realistic_human_cloths.glb).
 * Coordonnées locales : centré par bbox, Y=0 = sol, hauteur normalisée 170cm.
 * Placement monde dans Garden.tsx.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const TARGET_H = 170;
const red = new THREE.MeshStandardMaterial({ color: 0xcc2020, roughness: 0.6 });

export function JoggingSuit({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('media/glb/realistic_human_cloths.glb');

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    const raw = glbLocalBBox(scene).getSize(new THREE.Vector3());
    scene.scale.setScalar(TARGET_H / Math.max(raw.x, raw.y, raw.z));
    removeGlbLines(scene);
    scene.traverse(c => {
      const m = c as THREE.Mesh;
      if (m.isMesh) { m.material = red; }
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

useGLTF.preload('media/glb/realistic_human_cloths.glb');
