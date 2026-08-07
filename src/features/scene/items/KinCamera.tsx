import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import type { SceneItemProps } from '@shared/types';

export function KinCamera({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('media/sandbox/kin-fine-camera.glb');

  useLayoutEffect(() => {
    // Les matériaux, l'échelle et la rotation ont été "bakes" directement dans le fichier GLB.
    // L'objet est maintenant à la bonne taille (20cm de diamètre, hauteur écrasée / 3) 
    // et possède les bons matériaux (dome noir transparent, base blanche).

    // Positionnement sous le plafond
    // L'objet est placé à Y=250 dans Placements.tsx.
    // S'il est encore trop enfoncé, on le descend de 3 cm.
    scene.position.set(0, -3, 0);

    scene.traverse((child: any) => {
      if (child.isMesh) {
        // meshId1 (283 vertices) = dome, meshId0 (1993 vertices) = base
        if (child.geometry.attributes.position.count < 1000) {
          child.material = new THREE.MeshPhysicalMaterial({
             color: 0x050505,
             transparent: true,
             opacity: 0.8,
             roughness: 0.05,
             transmission: 0.9, 
             thickness: 1.0,
          });
        } else {
          child.material = new THREE.MeshStandardMaterial({
             color: 0xffffff,
             roughness: 0.7,
          });
        }
      }
    });

    onSize?.(new THREE.Vector3(20, 3.3, 20));
  }, [scene, onSize]);

  return <primitive object={scene} />;
}
