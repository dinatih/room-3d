/**
 * Douche — géométrie procédurale fidèle à js/structure/bathroom.js.
 * Rendu en coordonnées locales : X centré, Z=0 = face avant vitrage, Y=0 = sol.
 * Utilisé dans Furniture.tsx (scène) et dans l'inventaire (SCENE_REGISTRY).
 */
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const SHOWER_W = 70;
const SHOWER_D = 70;
const BASE_H   = 20;
const GLASS_H  = 180;

const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0x88ccff, transparent: true, opacity: 0.2,
  roughness: 0.05, side: THREE.DoubleSide,
});
const frameMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3 });
const baseMat  = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });

export function Shower({ onSize }: SceneItemProps) {
  useLayoutEffect(() => {
    onSize(new THREE.Vector3(SHOWER_W, BASE_H + GLASS_H, SHOWER_D));
  }, []);

  return (
    <group>
      {/* Cuve */}
      <mesh position={[0, BASE_H / 2, SHOWER_D / 2]} castShadow receiveShadow material={baseMat}>
        <boxGeometry args={[SHOWER_W, BASE_H, SHOWER_D]} />
      </mesh>
      {/* Vitrage frontal (face Z=0) */}
      <mesh position={[0, BASE_H + GLASS_H / 2, 0]} material={glassMat}>
        <planeGeometry args={[SHOWER_W, GLASS_H]} />
      </mesh>
      {/* Barre cadre haut */}
      <mesh position={[0, BASE_H + GLASS_H, 0]} material={frameMat}>
        <boxGeometry args={[SHOWER_W, 3, 1.5]} />
      </mesh>
    </group>
  );
}
