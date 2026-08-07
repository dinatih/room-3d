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
    const meshes: any[] = [];
    scene.traverse((child: any) => {
      if (child.isMesh) {
        meshes.push(child);
      }
    });

    meshes.sort((a, b) => a.geometry.attributes.position.count - b.geometry.attributes.position.count);

    if (meshes.length >= 2) {
      // Le mesh avec le moins de vertices (meshes[0]) est le dôme
      meshes[0].material = new THREE.MeshStandardMaterial({
        color: 0x111111,
        transparent: true,
        opacity: 0.75,
        roughness: 0.1,
        metalness: 0.0,
      });

      // Le mesh avec le plus de vertices (meshes[1]) est la base
      meshes[1].material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.7,
      });
    }

    onSize?.(new THREE.Vector3(20, 3.3, 20));
  }, [scene, onSize]);

  return <primitive object={scene} />;
}
