/**
 * TradfriBulb.tsx — TRÅDFRI Ampoule LED E27 globe, suspendue tête en bas.
 * Coordonnées locales : centré X/Z, Y=0 = culot (socket).
 * Le wrapper parent est roté [Math.PI, 0, 0] pour que le culot pointe vers le plafond.
 */
import { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/trådfri ampoule led e27 1055 lumen connecté sans fil variateur intensité-spectre blanc globe/TRÅDFRI Ampoule LED E27 1055 lumen connecté sans fil variateur intensité-spectre blanc globe.glb';

export function TradfriBulb({ actionState, onSize }: SceneItemProps) {
  const { scene } = useGLTFClone(GLB);
  const isOn = actionState?.on !== undefined
    ? Boolean(actionState.on)
    : Boolean(actionState?.['lamp-bath-toggle'] || actionState?.['lamp-corridor-toggle'] || actionState?.['lamp-sdb-toggle'] || actionState?.['lamp-couloir-toggle']);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);
    scene.scale.setScalar(100);
    mergeGlbByMaterial(scene);
    // Clone materials per instance so toggling one bulb doesn't affect other instances
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(m => m.clone());
        } else {
          mesh.material = mesh.material.clone();
        }
      }
    });
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  useLayoutEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          if ('emissive' in m) {
            const stdMat = m as THREE.MeshStandardMaterial;
            if (isOn) {
              stdMat.emissive.set(0xfff2d6);
              stdMat.emissiveIntensity = 2.0;
            } else {
              stdMat.emissive.set(0x000000);
              stdMat.emissiveIntensity = 0;
            }
          }
        });
      }
    });
  }, [scene, isOn]);

  return <primitive object={scene} />;
}

useGLTF.preload(GLB);
