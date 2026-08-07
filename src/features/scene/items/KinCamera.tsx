import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useGLTFClone } from '../useGLTFClone';
import type { SceneItemProps } from '@shared/types';

export function KinCamera({ onSize }: SceneItemProps) {
  const { scene } = useGLTFClone('media/sandbox/kin-fine-camera.glb');

  useLayoutEffect(() => {
    // L'objet original fait 0.02 unités (soit 0.2mm si 1 = 1cm).
    // On le multiplie par 1000 pour qu'il fasse 20cm, 
    // puis on le réduit par 3 comme demandé par l'utilisateur (scale final: 333)
    scene.scale.set(333, 333, 333);
    
    // Positionnement sous le plafond (qui est à Y=250)
    // L'origine de l'objet est au centre, sa hauteur max est ~0.008 * 333 = 2.6cm
    scene.position.set(0, -3, 0); 

    // Appliquer les matériaux: blanc pour le corps, noir transparent pour le dôme
    scene.traverse((child: any) => {
      if (child.isMesh) {
        // Le dôme a moins de faces (mesh 1, 440 faces) que la base (mesh 0, 3600 faces)
        // L'attribut child.geometry.attributes.position.count donne le nombre de vertices
        const isDome = child.geometry.attributes.position.count < 1000;
        
        if (isDome) {
          child.material = new THREE.MeshPhysicalMaterial({
             color: 0x111111,
             transparent: true,
             opacity: 0.8,
             roughness: 0.1,
             transmission: 0.9, 
             thickness: 0.5,
          });
        } else {
          child.material = new THREE.MeshStandardMaterial({
             color: 0xffffff,
             roughness: 0.6,
          });
        }
      }
    });

    onSize?.(new THREE.Vector3(10, 5, 10));
  }, [scene, onSize]);

  return <primitive object={scene} />;
}
