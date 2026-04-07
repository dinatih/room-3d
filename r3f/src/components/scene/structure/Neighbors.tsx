/**
 * Neighbors.tsx — appartements voisins ouest et est (fantômes semi-transparents).
 * Port de js/structure/neighborWest.js.
 */
import { useMemo } from 'react';
import * as THREE from 'three';

// @ts-ignore
import {
  ROOM_W, ROOM_D, WALL_H,
  NICHE_DEPTH,
  NICHE_Z_START,
  GLASS_START, GLASS_END,
  DOOR_START, DOOR_END, DOOR_H,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_DEPTH, KITCHEN_Z,
  SDB_Z_END,
  DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ,
} from '@config';

const DOOR_W = 83;
const W = 10;

const neighborMat = new THREE.MeshStandardMaterial({
  color: 0xa8c8e8, roughness: 0.85,
  transparent: true, opacity: 0.35, depthWrite: false,
  side: THREE.DoubleSide,
});

// ── Geometry builder (shared between West and East) ───────────────────────────

function buildNeighborGeos(): THREE.BufferGeometry[] {
  const geos: THREE.BufferGeometry[] = [];

  function box(w: number, h: number, d: number, x: number, y: number, z: number) {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, y, z);
    geos.push(g);
  }

  function trapWall(pts: [number, number][], height: number, yBase = 0) {
    const shape = new THREE.Shape();
    shape.moveTo(pts[0][0], -pts[0][1]);
    for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], -pts[i][1]);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    if (yBase > 0) g.translate(0, yBase, 0);
    geos.push(g);
  }

  // Mur A (ouest)
  box(W, WALL_H, 310,               -W / 2,          WALL_H / 2, (-30 + NICHE_Z_START) / 2);
  box(W, WALL_H, DIAG_CZ + 30,      -NICHE_DEPTH - W / 2, WALL_H / 2, (-30 + DIAG_CZ) / 2);
  box(NICHE_DEPTH, WALL_H, W,        -NICHE_DEPTH / 2, WALL_H / 2, NICHE_Z_START - W / 2);

  // Mur B (est)
  box(W, WALL_H, ROOM_D + 10 + 30,  ROOM_W + W / 2,  WALL_H / 2, (-30 + ROOM_D + 10) / 2);
  box(W, WALL_H, 200,                ROOM_W + W / 2,  WALL_H / 2, (-230 + -30) / 2);

  // Mur C (nord) — trapèze + vitrage
  {
    const WALL_DEPTH = 30, NW_EXT = 20, NE_EXT = 10, GLASS_TOP_Y = 210;
    trapWall([
      [0,           0          ],
      [GLASS_START, 0          ],
      [GLASS_START, -WALL_DEPTH],
      [-NW_EXT,     -WALL_DEPTH],
    ], WALL_H);
    trapWall([
      [GLASS_END,       0          ],
      [ROOM_W,          0          ],
      [ROOM_W + NE_EXT, -WALL_DEPTH],
      [GLASS_END,       -WALL_DEPTH],
    ], WALL_H);
    const linteauH = WALL_H - GLASS_TOP_Y;
    box(
      GLASS_END - GLASS_START, linteauH, WALL_DEPTH,
      (GLASS_START + GLASS_END) / 2, GLASS_TOP_Y + linteauH / 2, -WALL_DEPTH / 2,
    );
  }

  // Mur D (sud)
  box(NICHE_DEPTH, WALL_H, W,                   -NICHE_DEPTH / 2,              WALL_H / 2, ROOM_D + W / 2);
  box(KITCHEN_X0, WALL_H, W,                     KITCHEN_X0 / 2,               WALL_H / 2, ROOM_D + W / 2);
  box(DOOR_START - 10 - KITCHEN_X1, WALL_H, W,  (KITCHEN_X1 + DOOR_START - 10) / 2, WALL_H / 2, ROOM_D + W / 2);
  box(10, WALL_H, W,                             DOOR_START - 5,               WALL_H / 2, ROOM_D + W / 2);
  box(10, WALL_H, W,                             DOOR_END + 5,                 WALL_H / 2, ROOM_D + W / 2);
  box(DOOR_END - DOOR_START, WALL_H - DOOR_H, W,(DOOR_START + DOOR_END) / 2,  DOOR_H + (WALL_H - DOOR_H) / 2, ROOM_D + W / 2);
  box(ROOM_W - DOOR_END - 10, WALL_H, W,         (DOOR_END + 10 + ROOM_W) / 2, WALL_H / 2, ROOM_D + W / 2);

  // Cuisine
  box(W, WALL_H, KITCHEN_DEPTH, KITCHEN_X0 - W / 2, WALL_H / 2, ROOM_D + KITCHEN_DEPTH / 2);
  box(W, WALL_H, KITCHEN_DEPTH, KITCHEN_X1 + W / 2, WALL_H / 2, ROOM_D + KITCHEN_DEPTH / 2);
  {
    const SDB_LEN = DOOR_START + NICHE_DEPTH;
    box(SDB_LEN, WALL_H, W, (DOOR_START - NICHE_DEPTH) / 2, WALL_H / 2, KITCHEN_Z + W / 2);
  }

  // Mur gauche couloir
  {
    const WALL_X = DOOR_START - 5;
    const LEFT_WALL_Z0 = KITCHEN_Z;
    const LEFT_WALL_LEN = SDB_Z_END - KITCHEN_Z;
    const C_DOOR_START = LEFT_WALL_LEN - 10 - DOOR_W;
    const C_DOOR_END = C_DOOR_START + DOOR_W;
    const C_DOOR_START_ABS = LEFT_WALL_Z0 + C_DOOR_START;
    const C_DOOR_END_ABS   = LEFT_WALL_Z0 + C_DOOR_END;
    box(W, WALL_H, C_DOOR_START_ABS - LEFT_WALL_Z0, WALL_X, WALL_H / 2, (LEFT_WALL_Z0 + C_DOOR_START_ABS) / 2);
    box(W, WALL_H, SDB_Z_END - C_DOOR_END_ABS,       WALL_X, WALL_H / 2, (C_DOOR_END_ABS + SDB_Z_END) / 2);
    box(W, WALL_H - DOOR_H, DOOR_W,                  WALL_X, DOOR_H + (WALL_H - DOOR_H) / 2, (C_DOOR_START_ABS + C_DOOR_END_ABS) / 2);
  }

  // Mur droit couloir
  {
    const WALL_Z0 = ROOM_D + W;
    box(W, WALL_H, DIAG_AZ - WALL_Z0, ROOM_W + W / 2, WALL_H / 2, (WALL_Z0 + DIAG_AZ) / 2);
  }

  // Mur diagonal
  {
    const diagDX = DIAG_CX - DIAG_AX;
    const diagDZ = DIAG_CZ - DIAG_AZ;
    const diagLen = Math.sqrt(diagDX * diagDX + diagDZ * diagDZ);
    const sinθ = diagDX / diagLen;
    const cosθ = diagDZ / diagLen;
    const DIAG_DEPTH = 10;
    const pX = cosθ, pZ = -sinθ;

    const E_DOOR_START = 10, E_DOOR_W = 90, E_DOOR_END = E_DOOR_START + E_DOOR_W;

    function iP(dist: number): [number, number] {
      return [DIAG_AX + dist * sinθ, DIAG_AZ + dist * cosθ];
    }
    function eP(dist: number): [number, number] {
      return [DIAG_AX + dist * sinθ + DIAG_DEPTH * pX, DIAG_AZ + dist * cosθ + DIAG_DEPTH * pZ];
    }

    function diagSection(pts: [number, number][], height: number, yBase = 0) {
      const shape = new THREE.Shape();
      shape.moveTo(pts[0][0], -pts[0][1]);
      for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], -pts[i][1]);
      shape.closePath();
      const g = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
      g.rotateX(-Math.PI / 2);
      if (yBase > 0) g.translate(0, yBase, 0);
      geos.push(g);
    }

    const B_EXT_X = ROOM_W + W;
    const d_start_cut = (B_EXT_X - DIAG_AX - DIAG_DEPTH * pX) / sinθ;
    const A_EXT_X = -NICHE_DEPTH - W;
    const d_ext_cut = (A_EXT_X - DIAG_AX - DIAG_DEPTH * pX) / sinθ;

    diagSection([iP(0), iP(E_DOOR_START), eP(E_DOOR_START), eP(d_start_cut)], WALL_H);
    diagSection([iP(E_DOOR_START), iP(E_DOOR_END), eP(E_DOOR_END), eP(E_DOOR_START)], WALL_H - DOOR_H, DOOR_H);
    diagSection([iP(E_DOOR_END), iP(diagLen), eP(d_ext_cut), eP(E_DOOR_END)], WALL_H);

    {
      const A2_Z_EXT = DIAG_AZ + d_ext_cut * cosθ + DIAG_DEPTH * pZ;
      diagSection([[-NICHE_DEPTH, DIAG_CZ], [A_EXT_X, DIAG_CZ], [A_EXT_X, A2_Z_EXT]], WALL_H);
    }
    {
      const Z_se_ext = DIAG_AZ + d_start_cut * cosθ + DIAG_DEPTH * pZ;
      diagSection([[ROOM_W, DIAG_AZ], [ROOM_W + W, DIAG_AZ], [ROOM_W + W, Z_se_ext]], WALL_H);
    }
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
