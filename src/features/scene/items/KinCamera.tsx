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

    // Identifier le dôme de façon robuste : c'est la partie avec le moins de sommets
    // Identifier les meshes par leur nom de matériau (car ils ont tous le même nombre de vertices dans le nouveau GLB)
    scene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        if (child.material.name.includes('lambert8')) {
          // Le dôme (lambert8 était en mode BLEND)
          child.material = new THREE.MeshStandardMaterial({
            color: 0x111111,
            transparent: true,
            opacity: 0.75,
            roughness: 0.1,
            metalness: 0.0,
            side: THREE.DoubleSide,
          });
        } else if (child.material.name.includes('lambert1') || child.material.name.includes('lambert9')) {
          // La base et la lentille interne (on les met en blanc opaque)
          // Note: On pourrait garder lambert9 noir si c'est la lentille, mais la demande est "base en blanche"
          child.material = new THREE.MeshStandardMaterial({
            color: child.material.name.includes('lambert9') ? 0x222222 : 0xffffff,
            roughness: 0.7,
            side: THREE.DoubleSide,
          });
        }
      }
    });

    onSize?.(new THREE.Vector3(20, 3.3, 20));
  }, [scene, onSize]);

  return <primitive object={scene} />;
}
