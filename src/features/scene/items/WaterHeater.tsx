/**
 * Ballon d'eau chaude 100L — géométrie procédurale fidèle à js/structure/bathroom.js.
 * Rendu en coordonnées locales : centre du cylindre à l'origine.
 * Utilisé dans Furniture.tsx (scène) et dans l'inventaire (SCENE_REGISTRY).
 */
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

const HW_R = 28;
const HW_H = 65;

// Bracket : la fixation murale est côté -X (mur A).
// En coordonnées locales, le centre du bracket X = -(HW_R - 5) / 2
const BRACKET_X = -(HW_R - 5) / 2; // -11.5

const hwMat      = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.3 });
const hwCapMat   = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.4 });
const bracketMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.3 });

export function WaterHeater({ onSize }: SceneItemProps) {
  useLayoutEffect(() => {
    onSize(new THREE.Vector3(HW_R * 2, HW_H, HW_R * 2));
  }, []);

  return (
    <group>
      {/* Corps cylindrique */}
      <mesh castShadow receiveShadow material={hwMat}>
        <cylinderGeometry args={[HW_R, HW_R, HW_H, 16]} />
      </mesh>
      {/* Calotte haute */}
      <mesh position={[0, HW_H / 2 + 1, 0]} material={hwCapMat}>
        <cylinderGeometry args={[HW_R + 0.5, HW_R + 0.5, 2, 16]} />
      </mesh>
      {/* Calotte basse */}
      <mesh position={[0, -(HW_H / 2 + 1), 0]} material={hwCapMat}>
        <cylinderGeometry args={[HW_R + 0.5, HW_R + 0.5, 2, 16]} />
      </mesh>
      {/* Fixations murales */}
      {([-20, 20] as const).map((dy) => (
        <mesh key={dy} position={[BRACKET_X, dy, 0]} material={bracketMat}>
          <boxGeometry args={[HW_R + 5, 4, 5]} />
        </mesh>
      ))}
    </group>
  );
}
