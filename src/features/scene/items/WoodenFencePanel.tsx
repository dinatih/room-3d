import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Panneau de clôture bois utilisant le nouveau modèle GLB optimisé.
 * Remplace l'ancienne palissade procédurale.
 */
export function WoodenFencePanel({ w, h, d }: { w: number, h: number, d: number }) {
  const { scene } = useGLTF('media/glb/fence_panel.glb');
  
  const clone = useMemo(() => {
    const c = scene.clone(true);
    // Le modèle original semble être en mètres et orienté différemment.
    // On calcule le scale pour matcher les dimensions cibles (w, h, d).
    const box = new THREE.Box3().setFromObject(c);
    const size = box.getSize(new THREE.Vector3());
    
    // Scale pour matcher w (X), h (Y), d (Z)
    // On suppose que le panneau est orienté vers l'avant (Z) ou le côté (X)
    // D'après wallData: w=10 (épaisseur), h=190 (hauteur), d=90 (largeur le long de Z)
    c.scale.set(w / size.x, h / size.y, d / size.z);
    
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

useGLTF.preload('media/glb/fence_panel.glb');
