import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import type { SceneItemProps } from '@shared/types';

export function KinCamera({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('media/sandbox/kin-fine-camera.glb');

  useLayoutEffect(() => {
    // L'objet original fait 0.02 unités.
    // On le multiplie par 1000 pour X et Z pour avoir ~20cm.
    // L'utilisateur veut réduire la hauteur (Y) par 3, donc 1000 / 3 = 333.
    scene.scale.set(1000, 333, 1000);
    
    // Le dôme pointe vers le haut par défaut, on le pivote de 180° pour qu'il pointe vers le bas
    scene.rotation.x = Math.PI;

    // Positionnement sous le plafond
    scene.position.set(0, -2, 0); 

    // Appliquer les matériaux
    scene.traverse((child: any) => {
      if (child.isMesh) {
        // Le nom de la géométrie ou du mesh nous aide à identifier le dôme
        // En général, assimp exporte "pSphere8_0" et "pSphere8_1"
        // On va juste se baser sur le nombre de vertices (le dôme est souvent le plus petit)
        const isDome = child.geometry.attributes.position.count < 1500;
        
        if (isDome) {
          child.material = new THREE.MeshPhysicalMaterial({
             color: 0x000000,
             transparent: true,
             opacity: 0.7,
             roughness: 0.1,
             transmission: 0.9, 
             thickness: 0.5,
          });
        } else {
          child.material = new THREE.MeshStandardMaterial({
             color: 0xffffff,
             roughness: 0.5,
          });
        }
      }
    });

    onSize?.(new THREE.Vector3(20, 6, 20));
  }, [scene, onSize]);

  return <primitive object={scene} />;
}
