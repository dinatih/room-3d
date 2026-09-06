/**
 * Placard couloir — géométrie procédurale fidèle à js/structure/corridor.js.
 * Rendu en coordonnées locales : X/Z centrés sur le caisson, Y=0 = sol.
 * Porte pivotante animée en douceur (charnière coin CLOSET_X1 / CLOSET_Z0).
 * Utilisé dans Furniture.tsx (scène) et dans l'inventaire (SCENE_REGISTRY).
 *
 * Dimensions calculées depuis les constantes réelles :
 *   W = DOOR_START - (KITCHEN_X1 + PARTITION_THICKNESS)  ≈ 62.8 cm
 *   D = KITCHEN_Z  - (ROOM_D    + PARTITION_THICKNESS)   ≈ 52.8 cm
 */
import { useRef, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';
import { ROOM_D, KITCHEN_X1, KITCHEN_Z, DOOR_START, WALL_H } from '@config';
import { PARTITION_THICKNESS } from '../wallData';

const CLOSET_W = DOOR_START - (KITCHEN_X1 + PARTITION_THICKNESS);  // ≈ 62.8 cm
const CLOSET_D = KITCHEN_Z  - (ROOM_D    + PARTITION_THICKNESS);   // ≈ 52.8 cm

// Pivot porte : coin NE du caisson — charnière sur la face est, au ras du mur nord
// La face EXTÉRIEURE de la porte (côté couloir) doit être alignée sur le pivot en X,
// pas le centre du panneau. Ainsi, quand la porte s'ouvre (+π/2 vers l'Est),
// le 1 cm de matière qui était côté couloir pivote vers le NORD exactement jusqu'au
// mur nord (Z = -CLOSET_D/2), sans pénétrer dedans.
const DOOR_PIVOT_X =  CLOSET_W / 2;
const DOOR_PIVOT_Z = -CLOSET_D / 2;

// Jeu minimal entre porte et parois (0.2 cm de chaque côté)
const DOOR_GAP = 0.2;

const shelfMat  = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.4 });
const doorMat   = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
const handleMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.85, roughness: 0.15 });

export function CorridorCloset({ actionState, onSize }: SceneItemProps) {
  const doorRef = useRef<THREE.Group>(null!);
  const isOpen  = actionState['corr-doors-toggle'] ?? false;
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(CLOSET_W, WALL_H, CLOSET_D));
  }, []);

  useFrame(() => {
    // +π/2 CCW (vu d'en haut) : l'extrémité sud pivote vers l'Est (couloir) ✓
    const target = isOpen ? Math.PI / 2 : 0;
    const current = doorRef.current.rotation.y;
    if (current === target) return;
    const delta  = target - current;
    if (Math.abs(delta) > 0.001) {
      doorRef.current.rotation.y += delta * 0.12;
      invalidate();
    } else {
      doorRef.current.rotation.y = target;
      invalidate();
    }
  });

  return (
    <group>
      {/* Étagères — remplissent toute la largeur et profondeur du caisson */}
      {[60, 120, 180].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow receiveShadow material={shelfMat}>
          <boxGeometry args={[CLOSET_W, 3, CLOSET_D]} />
        </mesh>
      ))}

      {/* Porte pivotante — face extérieure (est) alignée sur le pivot en X.
          Centre décalé de -1 cm en X : face ext à x=0 (pivot), face int à x=-2.
          À l'ouverture +π/2, x=0 → z=0 et x=-2 → z=+2 : aucune pénétration nord. */}
      <group ref={doorRef} position={[DOOR_PIVOT_X, 0, DOOR_PIVOT_Z]}
        userData={{ hoverAction: { label: 'Placard couloir', actionId: 'corrDoors' } }}>
        <mesh position={[-1, WALL_H / 2, CLOSET_D / 2]} castShadow material={doorMat}>
          <boxGeometry args={[2, WALL_H - DOOR_GAP * 2, CLOSET_D - DOOR_GAP * 2]} />
        </mesh>
        <mesh position={[-1, WALL_H / 2, CLOSET_D - 6]} material={handleMat}>
          <boxGeometry args={[3, 20, 1.2]} />
        </mesh>
      </group>
    </group>
  );
}
