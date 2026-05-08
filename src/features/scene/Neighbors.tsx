/**
 * Neighbors.tsx — appartements voisins ouest et est (fantômes semi-transparents).
 *
 * Utilise les mêmes données que Building.tsx :
 *   - WALL_DEFS  → murs axiaux (via wallDefToBoxGeo)
 *   - PILLAR_DEFS → piliers box
 *   - makeExtrudeGeo → mur C + mur diagonal (kites inclus)
 */
import { useMemo } from 'react';
import * as THREE from 'three';

import {
  ROOM_W, WALL_H,
  NICHE_DEPTH,
  GLASS_START, GLASS_END,
  DOOR_H,
  DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ,
} from '@config';
import { WALL_DEFS, PILLAR_DEFS, W, wallDefToBoxGeo } from './wallData';
import { makeExtrudeGeo } from './Building';

const neighborMat = new THREE.MeshStandardMaterial({
  color: 0xa8c8e8, roughness: 0.85,
  transparent: true, opacity: 0.35, depthWrite: false,
  side: THREE.DoubleSide,
});

function buildNeighborGeos(): THREE.BufferGeometry[] {
  const geos: THREE.BufferGeometry[] = [];

  function box(w: number, h: number, d: number, x: number, y: number, z: number) {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, y, z);
    geos.push(g);
  }

  // ── Murs axiaux (WALL_DEFS) ──────────────────────────────────────────────────
  for (const d of WALL_DEFS) {
    if (d.skip3d) continue;
    geos.push(wallDefToBoxGeo(d));
  }

  // ── Piliers box (PILLAR_DEFS) ─────────────────────────────────────────────────
  for (const { x, z, w = W, d = W } of PILLAR_DEFS) {
    box(w, WALL_H, d, x, WALL_H / 2, z);
  }

  // ── Mur C (nord) — panneaux rectangulaires + piliers NW/NE + linteau ──────────
  {
    const WALL_DEPTH = 30, GLASS_TOP_Y = 210;
    const linteauH = WALL_H - GLASS_TOP_Y;
    // Pilier NW (intersection Mur A × Mur C)
    box(20, WALL_H, WALL_DEPTH, -10,            WALL_H / 2,              -WALL_DEPTH / 2);
    // Pilier NE (intersection Mur B × Mur C)
    box(W,  WALL_H, WALL_DEPTH, ROOM_W + W / 2, WALL_H / 2,              -WALL_DEPTH / 2);
    // Panneau ouest
    box(GLASS_START,       WALL_H,    WALL_DEPTH, GLASS_START / 2,                WALL_H / 2,              -WALL_DEPTH / 2);
    // Panneau est
    box(ROOM_W - GLASS_END, WALL_H,   WALL_DEPTH, (GLASS_END + ROOM_W) / 2,       WALL_H / 2,              -WALL_DEPTH / 2);
    // Linteau baie vitrée
    box(GLASS_END - GLASS_START, linteauH, WALL_DEPTH, (GLASS_START + GLASS_END) / 2, GLASS_TOP_Y + linteauH / 2, -WALL_DEPTH / 2);
  }

  // ── Mur diagonal — même logique que Building.tsx (sections + kites) ───────────
  {
    const diagDX  = DIAG_CX - DIAG_AX;
    const diagDZ  = DIAG_CZ - DIAG_AZ;
    const diagLen = Math.sqrt(diagDX * diagDX + diagDZ * diagDZ);
    const sinθ    = diagDX / diagLen;
    const cosθ    = diagDZ / diagLen;
    const DIAG_DEPTH = 10;
    const pX = cosθ, pZ = -sinθ;

    const E_DOOR_START = 10, E_DOOR_W = 90, E_DOOR_END = E_DOOR_START + E_DOOR_W;

    const iP = (d: number): [number, number] => [DIAG_AX + d * sinθ, DIAG_AZ + d * cosθ];
    const eP = (d: number): [number, number] => [
      DIAG_AX + d * sinθ + DIAG_DEPTH * pX,
      DIAG_AZ + d * cosθ + DIAG_DEPTH * pZ,
    ];

    // Sections NE, linteau, SW
    geos.push(makeExtrudeGeo([iP(0), iP(E_DOOR_START), eP(E_DOOR_START), eP(0)], WALL_H));
    geos.push(makeExtrudeGeo([iP(E_DOOR_START), iP(E_DOOR_END), eP(E_DOOR_END), eP(E_DOOR_START)], WALL_H - DOOR_H, DOOR_H));
    geos.push(makeExtrudeGeo([iP(E_DOOR_END), iP(diagLen), eP(diagLen), eP(E_DOOR_END)], WALL_H));

    // Kite NE (coin Mur B × diagonal)
    const tC  = (W - DIAG_DEPTH * pX) / sinθ;
    const cX  = DIAG_AX + W;
    const cZ  = DIAG_AZ + DIAG_DEPTH * pZ + tC * cosθ;
    geos.push(makeExtrudeGeo([
      [DIAG_AX + DIAG_DEPTH * pX, DIAG_AZ + DIAG_DEPTH * pZ] as [number, number],
      [cX, cZ]                                                 as [number, number],
      [DIAG_AX + W,               DIAG_AZ]                    as [number, number],
      [DIAG_AX,                   DIAG_AZ]                    as [number, number],
    ], WALL_H));

    // Kite SW (coin Mur A × diagonal)
    const tC_sw = (-W - DIAG_DEPTH * pX) / sinθ;
    const cX_sw = DIAG_CX - W;
    const cZ_sw = DIAG_CZ + DIAG_DEPTH * pZ + tC_sw * cosθ;
    geos.push(makeExtrudeGeo([
      [DIAG_CX,                        DIAG_CZ]                    as [number, number],
      [DIAG_CX - W,                    DIAG_CZ]                    as [number, number],
      [cX_sw, cZ_sw]                                               as [number, number],
      [DIAG_CX + DIAG_DEPTH * pX, DIAG_CZ + DIAG_DEPTH * pZ]     as [number, number],
    ], WALL_H));
  }

  return geos;
}

// ── Composant ─────────────────────────────────────────────────────────────────

function NeighborApartment({ offsetX, offsetZ }: { offsetX: number; offsetZ: number }) {
  const geos = useMemo(() => buildNeighborGeos(), []);
  return (
    <group position={[offsetX, 0, offsetZ]}>
      {geos.map((geo, i) => (
        <mesh key={i} geometry={geo} material={neighborMat} />
      ))}
    </group>
  );
}

export function Neighbors() {
  return (
    <>
      <NeighborApartment offsetX={-ROOM_W - 30.5} offsetZ={210} />
      <NeighborApartment offsetX={ROOM_W + 30.5}  offsetZ={-210} />
    </>
  );
}
