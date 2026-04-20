/**
 * Réfrigérateur cuisine — géométrie procédurale fidèle à kitchen.js
 * Porte articulée (charnière gauche -X), animée en douceur.
 */
import { useRef, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const W  = 60;    // largeur X
const D  = 60;    // profondeur Z (KITCHEN_DEPTH)
const H  = 90;    // hauteur Y (COUNTER_H)
const T  = 1.5;   // épaisseur parois
const FDT = 8;    // épaisseur porte (avec balconnets)

const SHELF_D = 10;
const SHELF_T = 1.2;
const GUARD_H = 6;
const OJ_Y    = 5 + SHELF_T + 1;   // base bouteille OJ sur tablette basse

export function Fridge({ actionState, onSize }: SceneItemProps) {
  const doorRef = useRef<THREE.Group>(null!);
  const isOpen  = actionState['fridge-toggle'] ?? false;
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(W, H, D));
  }, []);

  useFrame(() => {
    const target = isOpen ? Math.PI / 2 : 0;
    const delta = target - doorRef.current.rotation.y;
    if (Math.abs(delta) > 0.001) {
      doorRef.current.rotation.y += delta * 0.12;
      invalidate();
    } else {
      doorRef.current.rotation.y = target;
    }
  });

  return (
    // Centré en X/Z, centré verticalement
    <group position={[0, -H / 2, 0]}>

      {/* ── Carcasse ── */}

      {/* Dos (+Z, contre le mur cuisine) */}
      <Box sx={W}   sy={H}     sz={T}       x={0}             y={H / 2}       z={D / 2 - T / 2}     col="#f5f5f5" m={0.05} r={0.2} />
      {/* Dessus */}
      <Box sx={W}   sy={T}     sz={D}       x={0}             y={H - T / 2}   z={0}                  col="#f5f5f5" m={0.05} r={0.2} />
      {/* Dessous */}
      <Box sx={W}   sy={T}     sz={D}       x={0}             y={T / 2}       z={0}                  col="#f5f5f5" m={0.05} r={0.2} />
      {/* Côté gauche (-X) */}
      <Box sx={T}   sy={H-T*2} sz={D - T}   x={-W/2 + T/2}   y={H / 2}       z={-T / 2}             col="#f5f5f5" m={0.05} r={0.2} />
      {/* Côté droit (+X) */}
      <Box sx={T}   sy={H-T*2} sz={D - T}   x={ W/2 - T/2}   y={H / 2}       z={-T / 2}             col="#f5f5f5" m={0.05} r={0.2} />

      {/* ── Intérieur ── */}

      {/* Fond visible quand porte ouverte */}
      <Box sx={W-T*2}     sy={H-T*2}    sz={0.5}         x={0}  y={H/2}      z={D/2-T-0.3}    col="#e0e0e0" />
      {/* Étagère basse */}
      <Box sx={W-T*2-2}   sy={T}        sz={D-T*2}       x={0}  y={H*0.35}   z={-T/2}          col="#e0e0e0" />
      {/* Étagère haute */}
      <Box sx={W-T*2-2}   sy={T}        sz={D-T*2}       x={0}  y={H*0.62}   z={-T/2}          col="#e0e0e0" />
      {/* Bac à légumes */}
      <Box sx={W-T*2-4}   sy={10}       sz={D-T*2-4}     x={0}  y={T + 5}    z={-T/2}          col="#e0e0e0" />

      {/* ── Porte (pivot charnière côté gauche -X, face -Z) ── */}
      <group ref={doorRef} position={[-W / 2, 0, -D / 2]}>

        {/* Panneau principal */}
        <Box sx={W-2} sy={H-2} sz={FDT} x={W/2} y={H/2} z={FDT/2} col="#f5f5f5" m={0.05} r={0.2} />

        {/* Poignée (face extérieure, côté libre +X) */}
        <mesh position={[W - 10, H * 0.6, -1.5]}>
          <boxGeometry args={[1.5, 30, 2.5]} />
          <meshStandardMaterial color="#999999" metalness={0.5} roughness={0.2} />
        </mesh>

        {/* ── Balconnets porte ── */}

        {/* Tablette basse */}
        <mesh position={[W/2, OJ_Y + SHELF_T/2, FDT + SHELF_D/2]}>
          <boxGeometry args={[W - 8, SHELF_T, SHELF_D]} />
          <meshStandardMaterial color="#dddddd" roughness={0.4} transparent opacity={0.85} />
        </mesh>
        {/* Garde-fou bas */}
        <mesh position={[W/2, OJ_Y + SHELF_T + GUARD_H/2, FDT + 0.6]}>
          <boxGeometry args={[W - 8, GUARD_H, 1.2]} />
          <meshStandardMaterial color="#dddddd" roughness={0.4} transparent opacity={0.85} />
        </mesh>

        {/* Tablette haute */}
        <mesh position={[W/2, 56 + SHELF_T/2, FDT + SHELF_D/2]}>
          <boxGeometry args={[W - 8, SHELF_T, SHELF_D]} />
          <meshStandardMaterial color="#dddddd" roughness={0.4} transparent opacity={0.85} />
        </mesh>
        {/* Garde-fou haut */}
        <mesh position={[W/2, 56 + SHELF_T + 2, FDT + 0.6]}>
          <boxGeometry args={[W - 8, 4, 1.2]} />
          <meshStandardMaterial color="#dddddd" roughness={0.4} transparent opacity={0.85} />
        </mesh>

        {/* ── Bouteille de jus d'orange ── */}
        {/* Corps */}
        <mesh position={[W/2, OJ_Y + 22, FDT + 5]}>
          <cylinderGeometry args={[3.8, 4.5, 44, 20]} />
          <meshStandardMaterial color="#ff6600" roughness={0.3} transparent opacity={0.88} />
        </mesh>
        {/* Étiquette */}
        <mesh position={[W/2, OJ_Y + 22, FDT + 5]}>
          <cylinderGeometry args={[4.51, 4.51, 20, 20]} />
          <meshStandardMaterial color="#ff8c00" roughness={0.3} />
        </mesh>
        {/* Goulot */}
        <mesh position={[W/2, OJ_Y + 44 + 2, FDT + 5]}>
          <cylinderGeometry args={[2, 3.5, 4, 16]} />
          <meshStandardMaterial color="#ff6600" roughness={0.3} transparent opacity={0.88} />
        </mesh>
        {/* Bouchon */}
        <mesh position={[W/2, OJ_Y + 44 + 4 + 1, FDT + 5]}>
          <cylinderGeometry args={[2.2, 2.2, 2, 16]} />
          <meshStandardMaterial color="#ffcc00" roughness={0.4} />
        </mesh>

      </group>

    </group>
  );
}

/** Panneau boîte interne */
function Box({
  sx, sy, sz, x, y, z, col,
  r = 0.3, m = 0.1,
}: {
  sx: number; sy: number; sz: number;
  x: number; y: number; z: number;
  col: string; r?: number; m?: number;
}) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[sx, sy, sz]} />
      <meshStandardMaterial color={col} roughness={r} metalness={m} />
    </mesh>
  );
}
