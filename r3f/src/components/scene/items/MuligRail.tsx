/**
 * MuligRail.tsx — Tringle MULIG IKEA avec 3 pantalons (procédural).
 * Coordonnées locales : centré XZ, Y=0 = sol.
 */
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const mulMat      = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
const bracketMat  = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.3 });
const pantMat     = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.7 });
const pantClipMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.3 });

const MUL_W  = 80;   // longueur barre
const MUL_D  = 26;   // profondeur depuis mur
const RAIL_Y = 60;   // hauteur de la barre (rail centré XZ → Y relatif)

export function MuligRail({ onSize }: SceneItemProps) {
  const groupRef = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    groupRef.current.updateMatrixWorld(true);
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()));
  }, []);

  const pantsZ = [-25, 0, 25] as const;

  return (
    <group ref={groupRef}>
      {/* Barre horizontale */}
      <mesh position={[0, RAIL_Y, 0]} rotation={[Math.PI / 2, 0, 0]} material={mulMat}>
        <cylinderGeometry args={[1.5, 1.5, MUL_W, 8]} />
      </mesh>
      {/* 2 supports */}
      {([-MUL_W / 2 + 5, MUL_W / 2 - 5] as const).map((dz) => (
        <group key={dz}>
          <mesh position={[-MUL_D / 2, RAIL_Y, dz]} material={bracketMat}>
            <boxGeometry args={[MUL_D, 2, 2]} />
          </mesh>
          <mesh position={[-MUL_D + 0.75, RAIL_Y, dz]} material={bracketMat}>
            <boxGeometry args={[1.5, 10, 8]} />
          </mesh>
        </group>
      ))}
      {/* 3 pantalons */}
      {pantsZ.map((pz) => (
        <group key={pz}>
          <mesh position={[0, RAIL_Y + 1.5, pz]} material={pantClipMat}>
            <boxGeometry args={[3, 5, 4]} />
          </mesh>
          {([-7, 7] as const).map((dx) => (
            <mesh key={dx} position={[dx, RAIL_Y - 30, pz]} castShadow material={pantMat}>
              <boxGeometry args={[16.5, 60, 2.5]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
