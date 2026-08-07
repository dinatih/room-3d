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
    // Sa moitié de hauteur vaut ~2.83cm. On décale de -2.83 pour qu'il affleure exactement.
    scene.position.set(0, -2.83, 0);

    scene.traverse((child: any) => {
      if (child.isMesh) {
        // Le convertisseur a nommé les matériaux "lambert1" et "lambert2"
        // On se fie au nom du matériau ou on teste simplement s'il s'agit du dôme.
        const isDome = child.material?.name === 'lambert2' || child.geometry?.attributes?.position?.count < 1000;
        
        if (isDome) {
          child.material = new THREE.MeshStandardMaterial({
             color: 0x111111,
             transparent: true,
             opacity: 0.75,
             roughness: 0.2,
             metalness: 0.8,
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
