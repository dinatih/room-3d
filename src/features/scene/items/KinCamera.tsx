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
    // Sa hauteur locale max (la base) s'étend à Y=+2.83, on décale de -2.83 pour affleurer parfaitement.
    scene.position.set(0, -2.83, 0);

    onSize?.(new THREE.Vector3(20, 6, 20));
  }, [scene, onSize]);

  return <primitive object={scene} />;
}
