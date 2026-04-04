/**
 * Porte-fenêtre double battant PVC blanc — 160×210cm total (seuil 20cm).
 * Inclut : sections murales latérales + linteau.
 * Battant gauche fixe, battant droit ouvrant (pivot charnière droite, +90°).
 */
import { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneItemProps } from '../../../types';

const W_TOTAL   = 160;   // largeur totale des deux battants
const PANEL_W   = W_TOTAL / 2;  // 80cm par battant
const SILL_H    = 20;    // seuil maçonné
const GLASS_H   = 190;   // hauteur vitrage
const GLASS_TOP = SILL_H + GLASS_H;  // 210
const FRAME     = 8;     // largeur cadre PVC
const FRAME_D   = 5;     // profondeur cadre

const PANE_H    = GLASS_H - FRAME * 2;
const PANE_W    = PANEL_W - FRAME * 2;

const WW  = 10;   // épaisseur mur
const WH  = 250;  // hauteur totale mur
const PL  = 20;   // largeur sections murales latérales

const TOTAL_W   = W_TOTAL + PL * 2;
const LINTEAU_H = WH - GLASS_TOP;   // 40cm

/** Un battant : cadre PVC + vitrage, centré sur cx */
function DoorPanel({ cx, baseY }: { cx: number; baseY: number }) {
  const pvc   = <meshStandardMaterial color="#f0f0f0" roughness={0.3} />;
  const glass = (
    <meshPhysicalMaterial
      color="#88ccff" transparent opacity={0.25}
      roughness={0.05} metalness={0.1}
      side={THREE.DoubleSide}
    />
  );
  return (
    <>
      <mesh position={[cx, baseY + GLASS_H - FRAME / 2, 0]}>
        <boxGeometry args={[PANEL_W, FRAME, FRAME_D]} />{pvc}
      </mesh>
      <mesh position={[cx, baseY + FRAME / 2, 0]}>
        <boxGeometry args={[PANEL_W, FRAME, FRAME_D]} />{pvc}
      </mesh>
      <mesh position={[cx - PANEL_W / 2 + FRAME / 2, baseY + FRAME + PANE_H / 2, 0]}>
        <boxGeometry args={[FRAME, PANE_H, FRAME_D]} />{pvc}
      </mesh>
      <mesh position={[cx + PANEL_W / 2 - FRAME / 2, baseY + FRAME + PANE_H / 2, 0]}>
        <boxGeometry args={[FRAME, PANE_H, FRAME_D]} />{pvc}
      </mesh>
      <mesh position={[cx, baseY + FRAME + PANE_H / 2, 0]}>
        <planeGeometry args={[PANE_W, PANE_H]} />{glass}
      </mesh>
    </>
  );
}

/** Sections murales : gauche, droit, linteau */
function WallSurround() {
  const wallMat = <meshStandardMaterial color="#e0dbd4" roughness={0.9} />;
  return (
    <>
      {/* Mur latéral gauche */}
      <mesh position={[-(W_TOTAL / 2 + PL / 2), WH / 2, 0]}>
        <boxGeometry args={[PL, WH, WW]} />{wallMat}
      </mesh>
      {/* Mur latéral droit */}
      <mesh position={[ (W_TOTAL / 2 + PL / 2), WH / 2, 0]}>
        <boxGeometry args={[PL, WH, WW]} />{wallMat}
      </mesh>
      {/* Linteau au-dessus de la baie */}
      <mesh position={[0, GLASS_TOP + LINTEAU_H / 2, 0]}>
        <boxGeometry args={[TOTAL_W, LINTEAU_H, WW]} />{wallMat}
      </mesh>
      {/* Seuil maçonné */}
      <mesh position={[0, SILL_H / 2, -4]}>
        <boxGeometry args={[W_TOTAL, SILL_H, WW + 4]} />{wallMat}
      </mesh>
    </>
  );
}

export function GlassDoor({ actionState, onSize }: SceneItemProps) {
  const doorRef = useRef<THREE.Group>(null!);
  const isOpen  = actionState['door-toggle'] ?? false;

  useLayoutEffect(() => {
    onSize(new THREE.Vector3(TOTAL_W, WH, WW));
  }, []);

  useFrame(() => {
    const target = isOpen ? Math.PI / 2 : 0;
    doorRef.current.rotation.y += (target - doorRef.current.rotation.y) * 0.12;
  });

  const handleMat = <meshStandardMaterial color="#888888" metalness={0.6} roughness={0.3} />;
  const HANDLE_LX = -PANEL_W + FRAME + 4;

  return (
    <group position={[0, -WH / 2, 0]}>

      <WallSurround />

      {/* Battant gauche — fixe */}
      <DoorPanel cx={-W_TOTAL / 4} baseY={SILL_H} />

      {/* Battant droit — ouvrant, pivot charnière droite */}
      <group ref={doorRef} position={[W_TOTAL / 2, 0, 0]}>
        <DoorPanel cx={-PANEL_W / 2} baseY={SILL_H} />
        {/* Poignée */}
        <mesh position={[HANDLE_LX, SILL_H + GLASS_H * 0.5, FRAME_D / 2 + 0.5]}>
          <boxGeometry args={[3, 20, 1]} />{handleMat}
        </mesh>
        <mesh position={[HANDLE_LX - 1, SILL_H + GLASS_H * 0.5, FRAME_D / 2 + 4]}>
          <boxGeometry args={[1.5, 1.5, 8]} />{handleMat}
        </mesh>
      </group>

    </group>
  );
}
