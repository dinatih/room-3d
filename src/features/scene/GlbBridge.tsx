/**
 * GlbBridge.tsx — Pont logiciel universel pour normaliser les GLB.
 *
 * Détecte automatiquement les modèles IKEA officiels (dossier ikea-official)
 * pour appliquer le scale 100 (m -> cm) et le centrage au sol (Center -> Ground).
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
  /** Scale additionnel. Si glbPath contient "ikea-official", par défaut: 100. Sinon: 1. */
  scale?: number;
  /** Si fourni, le modèle sera redimensionné pour que sa hauteur totale (Y) soit égale à cette valeur. */
  targetHeight?: number;
  /** Rotation initiale. */
  rotation?: [number, number, number];
}

export function GlbBridge({ 
  glbPath, onSize, 
  grounded = true, 
  scale, 
  targetHeight, 
  rotation = [0, 0, 0]
}: GlbBridgeProps) {
  const { scene } = useGLTFClone(glbPath);

  useLayoutEffect(() => {
    // 1. Détection automatique du type de source
    const isIkeaOfficial = glbPath.includes('ikea-official');
    const defaultScale = isIkeaOfficial ? 100 : 1;
    const finalScale = scale ?? defaultScale;

    // 2. Reset & Nettoyage
    removeGlbLines(scene);
    scene.rotation.set(...rotation);
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.updateMatrixWorld(true);
    
    // 3. Calcul du scale (priorité targetHeight > scale param > default detected)
    if (targetHeight) {
      const rawBox = glbLocalBBox(scene);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      if (rawSize.y > 0.001) {
        scene.scale.setScalar(targetHeight / rawSize.y);
      }
    } else {
      scene.scale.setScalar(finalScale);
    }
    scene.updateMatrixWorld(true);
    
    // 4. Optimisation
    mergeGlbByMaterial(scene);
    
    // 5. Mesure finale post-scale & post-rotation
    const box = glbLocalBBox(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // 6. Alignement horizontal (X/Z)
    scene.position.x = -center.x;
    scene.position.z = -center.z;

    // 7. Calage vertical (Base à 0)
    if (grounded) {
      scene.position.y = -box.min.y;
    }

    // 8. Rapport des dimensions
    onSize({ w: size.x, d: size.z, h: size.y } as any);
    
  }, [scene, glbPath, onSize, grounded, scale, targetHeight, rotation]);

  return <primitive object={scene} />;
}
