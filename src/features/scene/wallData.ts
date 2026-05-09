/**
 * wallData.ts — source unique de vérité pour tous les segments de mur axiaux.
 * wallDefToBoxGeo() permet de convertir un WallDef en BoxGeometry Three.js.
 *
 * Building.tsx consomme WALL_DEFS pour le rendu 3D (WZ / WX).
 * floorData.ts en dérive automatiquement SEG_WALLS / SEG_DOORS / SEG_WINDOWS.
 *
 * Conventions :
 *  - axe Z (WZ) : xc = centre du mur (horizontal), z1/z2 = étendue
 *  - axe X (WX) : x1/x2 = étendue, zc = centre du mur (vertical)
 *  - segKind 'none'  → 3D seulement (linteaux, paroi arrière niche…)
 *  - skip3d true     → 2D seulement (baie de porte / fenêtre schématique)
 */
import * as THREE from 'three';
import {
  ROOM_W, ROOM_D, WALL_H,
  NICHE_DEPTH, NICHE_Z_START,
  GLASS_START, GLASS_END, GLASS_TOP_Y,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z,
  DOOR_START, DOOR_END, DOOR_H,
  SDB_Z_END,
  DIAG_AZ, DIAG_CZ,
} from '@config';

export const W        = 10; // épaisseur de mur standard (cm)
export const WALL_C_T = 30; // épaisseur mur C (nord, baie vitrée)
const CORR_E = 2;  // anti z-fighting dormant porte couloir
const CORR_DOOR_S = KITCHEN_Z + 50;
const CORR_DOOR_E = KITCHEN_Z + 130;

export const CORR_WALL_X = DOOR_START - 5; // 185 — centre du mur couloir gauche

export type WallMat  = 'west' | 'east' | 'north' | 'default';
export type SegKind  = 'wall' | 'door' | 'window';

export type WallDef = {
  segKind?: SegKind | 'none'; // défaut 'wall'
  mat?:     WallMat;          // défaut 'default'
  h?:       number;           // défaut WALL_H
  yBase?:   number;           // défaut 0
  skip3d?:  boolean;          // true → segment 2D uniquement
  t?:       number;           // épaisseur (défaut W)
} & (
  | { axis: 'z'; xc: number; z1: number; z2: number }
  | { axis: 'x'; x1: number; x2: number; zc: number }
);

/** Segment 2D au centre de la paroi. */
export function wallSeg(d: WallDef): [number, number, number, number] {
  return d.axis === 'z'
    ? [d.xc, d.z1, d.xc, d.z2]
    : [d.x1, d.zc, d.x2, d.zc];
}

/** BoxGeometry Three.js centrée sur la paroi décrite par un WallDef. */
export function wallDefToBoxGeo(d: WallDef): THREE.BufferGeometry {
  const h     = d.h     ?? WALL_H;
  const yBase = d.yBase ?? 0;
  let g: THREE.BufferGeometry;
  const t = d.t ?? W;
  if (d.axis === 'z') {
    g = new THREE.BoxGeometry(t, h, d.z2 - d.z1);
    g.translate(d.xc, yBase + h / 2, (d.z1 + d.z2) / 2);
  } else {
    g = new THREE.BoxGeometry(d.x2 - d.x1, h, t);
    g.translate((d.x1 + d.x2) / 2, yBase + h / 2, d.zc);
  }
  return g;
}

export const WALL_DEFS: WallDef[] = [

  // ── MUR A (ouest) ──────────────────────────────────────────────────────────
  // A1 : face intérieure séjour (xc = -W/2)
  { axis: 'z', xc: -W / 2,              z1: 0,                            z2: NICHE_Z_START - NICHE_DEPTH / 2, mat: 'west' },
  // A2a-outer : paroi arrière niche (3D uniquement, masquée par A1 en 2D)
  { axis: 'z', xc: -NICHE_DEPTH - W / 2, z1: 0,                            z2: NICHE_Z_START - NICHE_DEPTH / 2, mat: 'west', segKind: 'none' },
  // A2a : face intérieure niche
  { axis: 'z', xc: -NICHE_DEPTH - W / 2, z1: NICHE_Z_START + NICHE_DEPTH / 2, z2: ROOM_D,     mat: 'west' },
  // A2b : SDB + couloir (saute les piliers)
  { axis: 'z', xc: -NICHE_DEPTH - W / 2, z1: ROOM_D + W,      z2: KITCHEN_Z,         mat: 'west' },
  { axis: 'z', xc: -NICHE_DEPTH - W / 2, z1: KITCHEN_Z + W,   z2: SDB_Z_END,         mat: 'west' },
  { axis: 'z', xc: -NICHE_DEPTH - W / 2, z1: SDB_Z_END + W,   z2: SDB_Z_END + 70,    mat: 'west' },
  { axis: 'z', xc: -NICHE_DEPTH - W / 2, z1: SDB_Z_END + 70 + W, z2: DIAG_CZ - W,    mat: 'west' },

  // ── MUR B (est) ────────────────────────────────────────────────────────────
  { axis: 'z', xc: ROOM_W + W / 2, z1: 0,    z2: ROOM_D,  mat: 'east' }, // B1 séjour
  { axis: 'z', xc: ROOM_W + W / 2, z1: -230, z2: -30,     mat: 'east' }, // B2 jardin
  { axis: 'z', xc: ROOM_W + W / 2, z1: ROOM_D + W, z2: DIAG_AZ - W, mat: 'east' }, // couloir droit

  // ── MUR D (sud, Z=400) ────────────────────────────────────────────────────
  { axis: 'x', x1: -NICHE_DEPTH,    x2: KITCHEN_X0 - W, zc: ROOM_D + W / 2 },
  { axis: 'x', x1: KITCHEN_X1 + W,  x2: CORR_WALL_X - W / 2, zc: ROOM_D + W / 2 },
  // Linteau au-dessus de la porte principale (3D seulement)
  { axis: 'x', x1: DOOR_START,      x2: DOOR_END + 4,   zc: ROOM_D + W / 2, yBase: DOOR_H, h: WALL_H - DOOR_H, segKind: 'none' },
  { axis: 'x', x1: DOOR_END + 4,    x2: ROOM_W,         zc: ROOM_D + W / 2 },
  // Porte principale (2D uniquement)
  { axis: 'x', x1: DOOR_START, x2: DOOR_END, zc: ROOM_D, segKind: 'door', skip3d: true },

  // ── Cuisine ────────────────────────────────────────────────────────────────
  { axis: 'z', xc: KITCHEN_X0 - W / 2, z1: ROOM_D + W, z2: KITCHEN_Z },
  { axis: 'z', xc: KITCHEN_X1 + W / 2, z1: ROOM_D + W, z2: KITCHEN_Z },
  // Mur nord SDB / fond cuisine (3 morceaux, saute les piliers)
  { axis: 'x', x1: -NICHE_DEPTH,    x2: KITCHEN_X0 - W,        zc: KITCHEN_Z + W / 2 },
  { axis: 'x', x1: KITCHEN_X0,      x2: KITCHEN_X1,             zc: KITCHEN_Z + W / 2 },
  { axis: 'x', x1: KITCHEN_X1 + W,  x2: CORR_WALL_X - W / 2,   zc: KITCHEN_Z + W / 2 },

  // ── Couloir gauche (X=185, Z=460→600) ────────────────────────────────────
  // Segment avant porte (avec offset CORR_E pour éviter z-fighting dormant)
  { axis: 'z', xc: CORR_WALL_X, z1: KITCHEN_Z + W,             z2: CORR_DOOR_S - CORR_E },
  // Segment après porte
  { axis: 'z', xc: CORR_WALL_X, z1: CORR_DOOR_E + CORR_E,     z2: SDB_Z_END },
  // Linteau au-dessus de la porte couloir (3D seulement)
  { axis: 'z', xc: CORR_WALL_X, z1: CORR_DOOR_S - CORR_E, z2: CORR_DOOR_E + CORR_E,
    yBase: DOOR_H, h: WALL_H - DOOR_H, segKind: 'none' },
  // Porte couloir SDB (2D uniquement)
  { axis: 'z', xc: CORR_WALL_X, z1: CORR_DOOR_S, z2: CORR_DOOR_E, segKind: 'door', skip3d: true },

  // ── Mur C (nord, Z=0) ────────────────────────────────────────────────────────
  // Panneau ouest (fixe)
  { axis: 'x', x1: 0,          x2: GLASS_START, zc: -WALL_C_T / 2, t: WALL_C_T, mat: 'north' },
  // Panneau est — 2D plan uniquement (3D inline dans Walls, largeur suit roomWDelta)
  { axis: 'x', x1: GLASS_END,  x2: ROOM_W,      zc: -WALL_C_T / 2, t: WALL_C_T, mat: 'north', skip3d: true },
  // Linteau au-dessus de la baie (3D uniquement)
  { axis: 'x', x1: GLASS_START, x2: GLASS_END,  zc: -WALL_C_T / 2, t: WALL_C_T, mat: 'north', yBase: GLASS_TOP_Y, h: WALL_H - GLASS_TOP_Y, segKind: 'none' },

  // ── Douche ─────────────────────────────────────────────────────────────────
  { axis: 'z', xc: -NICHE_DEPTH + 70 + W / 2, z1: SDB_Z_END + W,      z2: SDB_Z_END + 70 },
  { axis: 'x', x1: -NICHE_DEPTH,              x2: -NICHE_DEPTH + 70, zc: SDB_Z_END + 70 + W / 2 },

];

// ── Piliers box ───────────────────────────────────────────────────────────────
export type PillarDef = { id: string; x: number; z: number; w?: number; d?: number };

export const PILLAR_DEFS: PillarDef[] = [
  { id: 'nw',           x: -10,                    z: -WALL_C_T / 2, w: 20, d: WALL_C_T },
  { id: 'sw',           x: -NICHE_DEPTH - W / 2,  z: ROOM_D + W / 2 },
  { id: 'ne-diag',     x: ROOM_W + W / 2,          z: DIAG_AZ - W / 2 },
  { id: 'sw-diag',     x: -NICHE_DEPTH - W / 2,   z: DIAG_CZ - 5 },
  { id: 'kitchen-l',   x: KITCHEN_X0 - W / 2,     z: ROOM_D + W / 2 },
  { id: 'kitchen-r',   x: KITCHEN_X1 + W / 2,     z: ROOM_D + W / 2 },
  { id: 'se',           x: ROOM_W + W / 2,          z: ROOM_D + W / 2 },
  { id: 'beam-niche',  x: -10,                      z: NICHE_Z_START,   w: 20, d: NICHE_DEPTH },
  { id: 'nw-sdb',      x: -NICHE_DEPTH - W / 2,   z: KITCHEN_Z + W / 2 },
  { id: 'kitchen-l-n', x: KITCHEN_X0 - W / 2,     z: KITCHEN_Z + W / 2 },
  { id: 'kitchen-r-n', x: KITCHEN_X1 + W / 2,     z: KITCHEN_Z + W / 2 },
  { id: 'shower-door-w', x: -NICHE_DEPTH - W / 2, z: SDB_Z_END - W / 2 + 10 },
  { id: 'shower-door-e', x: 65,                    z: SDB_Z_END - W / 2 + 10 },
  { id: 'corr-n',       x: CORR_WALL_X,             z: KITCHEN_Z + W / 2 },
  { id: 'corr-s',       x: CORR_WALL_X,             z: ROOM_D + W / 2 },
  { id: 'corr-m',       x: CORR_WALL_X,             z: SDB_Z_END - W / 2 + 10 },
  { id: 'nw-shower',   x: -NICHE_DEPTH - W / 2,   z: SDB_Z_END + 70 + W / 2 },
  { id: 'se-shower',   x: 65,                      z: SDB_Z_END + 70 + W / 2 },
  { id: 'garden-e',    x: ROOM_W + W / 2,           z: -230 - W / 2 },
];
