/**
 * Congélateur CHIQ CSD46D4E — géométrie procédurale fidèle à decor.js
 * La porte tourne en Y autour de sa charnière (côté -Z), animée en douceur.
 */
import { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const FRZ_W = 45;    // largeur Z
const FRZ_D = 47;    // profondeur X
const FRZ_H = 50;    // hauteur Y
const FRZ_T = 1.5;   // épaisseur parois
const INNER_H = FRZ_H - FRZ_T * 2;
const INNER_W = FRZ_W - FRZ_T * 2;

export function Freezer({ actionState, onSize }: SceneItemProps) {
  const doorRef = useRef<THREE.Group>(null!);
  const isOpen  = actionState['freezer-toggle'] ?? false;

  // Rapport la taille réelle au Controller pour le fit caméra
  useLayoutEffect(() => {
    onSize(new THREE.Vector3(FRZ_D / 10, FRZ_H / 10, FRZ_W / 10));
  }, []);

  // Animation fluide de la porte
  useFrame(() => {
    const target = isOpen ? Math.PI / 2 : 0;
    doorRef.current.rotation.y +=
      (target - doorRef.current.rotation.y) * 0.12;
  });

  return (
    // Centré horizontalement, assis sur Y=0
    <group>

      {/* ── Carcasse ── */}

      {/* Dos */}
      <Panel sx={FRZ_T}            sy={FRZ_H}  sz={FRZ_W}
             x={-FRZ_D/2+FRZ_T/2} y={FRZ_H/2} z={0}           col="#1a1a1a" />
      {/* Dessus */}
      <Panel sx={FRZ_D}  sy={FRZ_T}             sz={FRZ_W}
             x={0}       y={FRZ_H-FRZ_T/2}      z={0}           col="#1a1a1a" />
      {/* Dessous */}
      <Panel sx={FRZ_D}  sy={FRZ_T}  sz={FRZ_W}
             x={0}       y={FRZ_T/2} z={0}                       col="#1a1a1a" />
      {/* Côté gauche (Z-) */}
      <Panel sx={FRZ_D-FRZ_T} sy={INNER_H}      sz={FRZ_T}
             x={FRZ_T/2}      y={FRZ_H/2}       z={-FRZ_W/2+FRZ_T/2} col="#1a1a1a" />
      {/* Côté droit (Z+) */}
      <Panel sx={FRZ_D-FRZ_T} sy={INNER_H}      sz={FRZ_T}
             x={FRZ_T/2}      y={FRZ_H/2}       z={ FRZ_W/2-FRZ_T/2} col="#1a1a1a" />

      {/* ── Intérieur ── */}

      {/* Fond */}
      <Panel sx={0.5}    sy={INNER_H}  sz={INNER_W}
             x={-FRZ_D/2+FRZ_T+0.25} y={FRZ_H/2} z={0}         col="#dddddd" />
      {/* Étagère basse */}
      <Panel sx={FRZ_D-FRZ_T-1} sy={FRZ_T} sz={INNER_W}
             x={FRZ_T/2-0.5}    y={FRZ_H*0.35}  z={0}           col="#dddddd" />
      {/* Étagère haute */}
      <Panel sx={FRZ_D-FRZ_T-1} sy={FRZ_T} sz={INNER_W}
             x={FRZ_T/2-0.5}    y={FRZ_H*0.60}  z={0}           col="#dddddd" />

      {/* ── Pieds ── */}
      {([-1, 1] as const).flatMap(dz =>
        ([-1, 1] as const).map(dx => (
          <mesh key={`${dx}${dz}`}
                position={[dx*(FRZ_D/2-3), 1, dz*(FRZ_W/2-3)]}>
            <cylinderGeometry args={[1.5, 1.5, 2, 8]} />
            <meshStandardMaterial color="#111111" roughness={0.4} />
          </mesh>
        ))
      )}

      {/* ── Porte (charnière côté -Z) ── */}
      <group ref={doorRef} position={[FRZ_D/2, 0, -FRZ_W/2]}>
        {/* Panneau : s'étend depuis la charnière en +Z */}
        <mesh position={[0, FRZ_H/2, FRZ_W/2]}>
          <boxGeometry args={[FRZ_T, FRZ_H-2, FRZ_W-FRZ_T]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Poignée */}
        <mesh position={[FRZ_T/2+0.9, FRZ_H/2, FRZ_W-7]}>
          <boxGeometry args={[1.5, 25, 1.5]} />
          <meshStandardMaterial color="#111111" roughness={0.4} />
        </mesh>
      </group>

    </group>
  );
}

/** Panneau boîte réutilisable */
function Panel({
  sx, sy, sz, x, y, z, col,
}: {
  sx: number; sy: number; sz: number;
  x: number; y: number; z: number;
  col: string;
}) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[sx, sy, sz]} />
      <meshStandardMaterial color={col} roughness={0.3} metalness={0.1} />
    </mesh>
  );
}
