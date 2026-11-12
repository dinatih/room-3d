/**
 * TradfriBulb.tsx — TRÅDFRI Ampoule LED E27 globe, suspendue tête en bas.
 * Coordonnées locales : centré X/Z, Y=0 = culot (socket).
 * Le wrapper parent est roté [Math.PI, 0, 0] pour que le culot pointe vers le plafond.
 */
import { useLayoutEffect } from 'react';
import { useGLTFClone, preloadSceneGLTF } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const GLB = 'items/trådfri ampoule led e27 1055 lumen connecté sans fil variateur intensité-spectre blanc globe/TRÅDFRI Ampoule LED E27 1055 lumen connecté sans fil variateur intensité-spectre blanc globe.glb';

export function TradfriBulb({ actionState = {}, onSize }: Partial<Omit<SceneItemProps, 'item'>>) {
  const { scene } = useGLTFClone(GLB, true);
  const isOn = actionState?.on !== undefined
    ? Boolean(actionState.on)
    : Boolean(actionState?.['lamp-bath-toggle'] || actionState?.['lamp-corridor-toggle'] || actionState?.['lamp-sdb-toggle'] || actionState?.['lamp-couloir-toggle']);

  useLayoutEffect(() => {
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);
    scene.scale.setScalar(100);
    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize?.(box.getSize(new THREE.Vector3()));
  }, [scene, onSize]);

  useLayoutEffect(() => {
    const targetColor = actionState?.lightColor ?? 0xffc266;
    const brightness = actionState?.brightness ?? 1;
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          if ('emissive' in m) {
            const stdMat = m as THREE.MeshStandardMaterial;
            if (isOn) {
              stdMat.color.set(targetColor);
              stdMat.emissive.set(targetColor);
              stdMat.emissiveIntensity = 1.2 * brightness;
            } else {
              stdMat.color.set(0xffffff);
              stdMat.emissive.set(0x000000);
              stdMat.emissiveIntensity = 0;
            }
          }
        });
      }
    });
  }, [scene, isOn, actionState?.lightColor, actionState?.brightness]);

  return <primitive object={scene} />;
}

preloadSceneGLTF(GLB);
