/**
 * BirdFeeder.tsx — Mangeoire à oiseaux suspendue (GLB items/bird_feeder/bird_feeder.glb).
 * Coordonnées locales : X/Z centrés, Y=0 au sol de la mangeoire (ou suspendue).
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const TARGET_H = 35; // Hauteur ~35 cm

export function BirdFeeder({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('/items/bird_feeder/bird_feeder.glb');

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);

    // Corriger les matériaux : le GLB original contient alphaMode: 'BLEND' et transmission: 1 par erreur
    scene.traverse(child => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach(mat => {
          mat.transparent = false;
          mat.depthWrite = true;
          mat.depthTest = true;
          mat.alphaTest = 0;
          if ('transmission' in mat) (mat as any).transmission = 0;
          if ('opacity' in mat) mat.opacity = 1;
        });
      }
    });

    const raw = glbLocalBBox(scene).getSize(new THREE.Vector3());
    const s = TARGET_H / Math.max(raw.x, raw.y, raw.z);
    scene.scale.setScalar(s);
    mergeGlbByMaterial(scene);
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

useGLTF.preload('/items/bird_feeder/bird_feeder.glb');
