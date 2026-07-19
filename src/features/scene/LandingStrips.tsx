/**
 * LandingStrips.tsx — 3 pistes d'atterrissage dans et autour du studio.
 * 1 unité = 1 cm.
 */

import { ROOM_W, ROOM_D } from '@config';

const CX = ROOM_W / 2; // 150
const CZ = ROOM_D / 2; // ~200

// ── Données partagées (minimap + 3D) ─────────────────────────────────────────

export interface StripData {
  cx:     number;
  cz:     number;
  length: number;
  width:  number;
  angleY: number; // rotation autour de Y (rad)
}

export const LANDING_STRIPS: StripData[] = [
  // 1 — Piste principale E-O, traverse le séjour
  { cx: CX,  cz: CZ,    length: 300, width: 30, angleY: Math.PI / 2 },
  // 2 — Piste N-S, traverse séjour + jardin
  { cx: CX,  cz: 30,    length: 400, width: 28, angleY: 0 },
  // 3 — Piste diagonale dans le jardin
  { cx: 200, cz: -100,  length: 240, width: 26, angleY: Math.PI / 5 },
];

// ── Composant piste individuelle ──────────────────────────────────────────────

function LandingStrip({ cx, cz, length, width, angleY }: StripData) {
  const halfL = length / 2;

  const thresholdBars = (sign: 1 | -1) =>
    [-1.5, -0.5, 0.5, 1.5].map(xOff => (
      <mesh
        key={xOff}
        position={[xOff * (width * 0.22), 1.2, sign * halfL * 0.88]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[width * 0.15, length * 0.06]} />
        <meshStandardMaterial color="white" roughness={0.5} />
      </mesh>
    ));

  return (
    <group position={[cx, 0, cz]} rotation={[0, angleY, 0]}>
      {/* Base asphaltée */}
      <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color="#2e2e2e" roughness={0.95} />
      </mesh>

      {/* Ligne centrale jaune */}
      <mesh position={[0, 0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, length * 0.88]} />
        <meshStandardMaterial color="#eeee00" roughness={0.4} />
      </mesh>

      {/* Barres de seuil */}
      {thresholdBars(1)}
      {thresholdBars(-1)}
    </group>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function LandingStrips() {
  return (
    <group>
      {LANDING_STRIPS.map((s, i) => <LandingStrip key={i} {...s} />)}
    </group>
  );
}
