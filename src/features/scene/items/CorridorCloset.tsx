/**
 * Placard couloir — géométrie procédurale fidèle à js/structure/corridor.js.
 * Rendu en coordonnées locales : X/Z centrés sur le caisson, Y=0 = sol.
 * Porte pivotante animée en douceur (charnière coin CLOSET_X1 / CLOSET_Z0).
 * Utilisé dans Furniture.tsx (scène) et dans l'inventaire (SCENE_REGISTRY).
 */
import { useRef, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneItemProps } from '@shared/types';

const CLOSET_W = 60;   // DOOR_START - KITCHEN_X1  = 190 - 130
const CLOSET_D = 50;   // KITCHEN_Z  - (ROOM_D + W) = 460 - 410
const WALL_H   = 250;

// Pivot porte : coin CLOSET_X1 / CLOSET_Z0 en local
const DOOR_PIVOT_X =  CLOSET_W / 2;  //  30
const DOOR_PIVOT_Z = -CLOSET_D / 2;  // -25

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
    const target = isOpen ? Math.PI / 2 : 0;
    const delta  = target - doorRef.current.rotation.y;
    if (Math.abs(delta) > 0.001) {
      doorRef.current.rotation.y += delta * 0.12;
      invalidate();
    } else {
      doorRef.current.rotation.y = target;
    }
  });

  return (
    <group>
      {/* Étagères */}
      {[60, 120, 180].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow receiveShadow material={shelfMat}>
          <boxGeometry args={[CLOSET_W - 4, 3, CLOSET_D]} />
        </mesh>
      ))}

      {/* Porte pivotante */}
      <group ref={doorRef} position={[DOOR_PIVOT_X, 0, DOOR_PIVOT_Z]}
        userData={{ hoverAction: { label: 'Placard couloir', actionId: 'corrDoors' } }}>
        <mesh position={[0, (WALL_H - 10) / 2, CLOSET_D / 2]} castShadow material={doorMat}>
          <boxGeometry args={[2, WALL_H - 10, CLOSET_D - 2]} />
        </mesh>
        <mesh position={[2, WALL_H / 2, CLOSET_D - 6]} material={handleMat}>
          <boxGeometry args={[3, 20, 1.2]} />
        </mesh>
      </group>
    </group>
  );
}
