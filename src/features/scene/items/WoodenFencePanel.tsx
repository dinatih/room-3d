import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Panneau de clôture bois utilisant le nouveau modèle GLB optimisé.
 * Remplace l'ancienne palissade procédurale.
 */
export function WoodenFencePanel({ w, h, d }: { w: number, h: number, d: number }) {
  const { scene } = useGLTF('/items/fence-panel/model.glb');
  
  const clone = useMemo(() => {
    const c = scene.clone(true);
    c.position.set(0, 0, 0); c.scale.set(1, 1, 1); c.rotation.set(0, 0, 0);
    c.updateMatrixWorld(true);
    
    const box = new THREE.Box3().setFromObject(c);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // On centre le modèle localement
    c.position.x = -center.x;
    c.position.z = -center.z;
    c.position.y = -box.min.y;
    
    // Si le modèle est plus large en X qu'en Z, on le pivote de 90°
    // car dans le projet, la largeur du panneau est portée par l'axe Z (profondeur).
    if (size.x > size.z) {
      c.rotation.y = Math.PI / 2;
      // Après rotation 90°, les dimensions X et Z sont inversées pour le scale
      c.scale.set(w / size.z, h / size.y, d / size.x);
    } else {
      c.scale.set(w / size.x, h / size.y, d / size.z);
    }
    
    c.traverse(o => {
      if ((o as THREE.Mesh).isMesh) {
        (o as THREE.Mesh).castShadow = true;
        (o as THREE.Mesh).receiveShadow = true;
      }
    });
    return c;
  }, [scene, w, h, d]);

  return <primitive object={clone} />;
}

useGLTF.preload('/items/fence-panel/model.glb');
