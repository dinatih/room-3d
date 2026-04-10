/**
 * Meuble sous évier cuisine — géométrie procédurale fidèle à kitchen.js
 * Porte articulée (charnière gauche -X), animée en douceur.
 */
import { useRef, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const W     = 40;    // largeur X (CABINET_W)
const D     = 60;    // profondeur Z (KITCHEN_DEPTH)
const H     = 90;    // hauteur Y (COUNTER_H)
const T     = 1.5;   // épaisseur parois
const CAB_DT = 1.5;  // épaisseur porte

export function KitchenCabinet({ actionState, onSize }: SceneItemProps) {
  const doorRef = useRef<THREE.Group>(null!);
  const isOpen  = actionState['cabinet-toggle'] ?? false;
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
      <Box sx={W}   sy={H}     sz={T}      x={0}            y={H / 2}  z={D/2 - T/2}  col="#ffffff" />
      {/* Dessous (pas de dessus — trou évier) */}
      <Box sx={W}   sy={T}     sz={D}      x={0}            y={T / 2}  z={0}           col="#ffffff" />
      {/* Côté gauche (-X) */}
      <Box sx={T}   sy={H-T*2} sz={D - T}  x={-W/2 + T/2}  y={H / 2}  z={-T / 2}     col="#ffffff" />
      {/* Côté droit (+X) */}
      <Box sx={T}   sy={H-T*2} sz={D - T}  x={ W/2 - T/2}  y={H / 2}  z={-T / 2}     col="#ffffff" />

      {/* ── Intérieur ── */}

      {/* Fond visible quand porte ouverte */}
      <Box sx={W-T*2}   sy={H-T*2}  sz={0.5}    x={0}  y={H/2}     z={D/2-T-0.3}   col="#eeeeee" />
      {/* Tablette basse (séparation tuyaux) */}
      <Box sx={W-T*2-2} sy={T}      sz={D-T*2}  x={0}  y={H*0.3}   z={-T/2}         col="#eeeeee" />

      {/* ── Porte (pivot charnière côté gauche -X, face -Z) ── */}
      <group ref={doorRef} position={[-W / 2, 0, -D / 2]}>

        {/* Panneau */}
        <Box sx={W-2} sy={H-2} sz={CAB_DT} x={W/2} y={H/2} z={CAB_DT/2} col="#ffffff" />

        {/* Poignée (face extérieure, côté libre +X) */}
        <mesh position={[W - 8, H / 2, -1.5]}>
          <boxGeometry args={[1.5, 15, 2]} />
          <meshStandardMaterial color="#999999" metalness={0.5} roughness={0.2} />
        </mesh>

      </group>

    </group>
  );
}

/** Panneau boîte interne */
function Box({
  sx, sy, sz, x, y, z, col,
}: {
  sx: number; sy: number; sz: number;
  x: number; y: number; z: number;
  col: string;
}) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[sx, sy, sz]} />
      <meshStandardMaterial color={col} roughness={0.35} metalness={0} />
    </mesh>
  );
}
