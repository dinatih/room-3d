/**
 * GlbBridge.tsx — Pont logiciel universel pour normaliser les GLB.
 */
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { removeGlbLines, glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

interface GlbBridgeProps extends SceneItemProps {
  glbPath: string;
  /** Si true, force le bas du mesh à Y=0. Par défaut: true. */
  grounded?: boolean;
  /** Scale fixe (ex: 100 pour IKEA m->cm). Ignoré si targetHeight est fourni. */
  scale?: number;
  /** Si fourni, le modèle sera redimensionné pour que sa hauteur totale (Y) soit égale à cette valeur. */
  targetHeight?: number;
  /** Rotation initiale. */
  rotation?: [number, number, number];
}

export function GlbBridge({ 
  glbPath, onSize, 
  grounded = true, 
  scale = 100, 
  targetHeight, 
  rotation = [0, 0, 0]
}: GlbBridgeProps) {
  const { scene } = useGLTFClone(glbPath);

  useLayoutEffect(() => {
    // 1. Reset & Nettoyage
    removeGlbLines(scene);
    scene.rotation.set(...rotation);
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.updateMatrixWorld(true);
    
    // 2. Calcul du scale
    if (targetHeight) {
      const rawBox = glbLocalBBox(scene);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      if (rawSize.y > 0.001) {
        scene.scale.setScalar(targetHeight / rawSize.y);
      }
    } else {
      scene.scale.setScalar(scale);
    }
    scene.updateMatrixWorld(true);
    
    // 3. Optimisation
    mergeGlbByMaterial(scene);
    
    // 4. Mesure finale post-scale & post-rotation
    const box = glbLocalBBox(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // 5. Alignement horizontal (X/Z)
    scene.position.x = -center.x;
    scene.position.z = -center.z;

    // 6. Calage vertical (Base à 0)
    if (grounded) {
      scene.position.y = -box.min.y;
    }

    // 7. Rapport des dimensions
    onSize({ w: size.x, d: size.z, h: size.y } as any);
    
  }, [scene, glbPath, onSize, grounded, scale, targetHeight, rotation]);

  return <primitive object={scene} />;
}
