/**
 * wallData.ts — source unique de vérité pour tous les segments de mur axiaux.
 * wallDefToBoxGeo() permet de convertir un WallDef en BoxGeometry Three.js.
 *
 * PILLAR_DEFS est la source primaire pour les jonctions structurelles.
 * WALL_DEFS décrit surtout les pans entre arêtes de piliers, plus les ouvertures.
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
  BATH_Z_END,
  DIAG_AZ, DIAG_CZ,
} from '@config';

export const W        = 10; // épaisseur de mur standard (cm)
export const WALL_C_T = 30; // épaisseur mur C (nord, baie vitrée)
const CORR_E = 2;  // anti z-fighting dormant porte couloir
const CORR_DOOR_S = KITCHEN_Z + 60;
const CORR_DOOR_E = KITCHEN_Z + 140;

export const CORR_WALL_X = 195; // centre du mur couloir gauche (SDB = 200cm intérieur)

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

// ── Piliers box ───────────────────────────────────────────────────────────────
export type PillarDef = { id: string; x: number; z: number; w?: number; d?: number };

export const PILLAR_DEFS = [
  { id: 'corner-nw',   x: -10,                    z: -WALL_C_T / 2, w: 20, d: WALL_C_T },
  { id: 'corner-ne',   x: ROOM_W + W / 2,         z: -WALL_C_T / 2,        d: WALL_C_T },
  { id: 'corner-sw',   x: -NICHE_DEPTH - W / 2,  z: ROOM_D + W / 2 },
  { id: 'diag-ne',     x: ROOM_W + W / 2,          z: DIAG_AZ - W / 2 },
  { id: 'diag-sw',     x: -NICHE_DEPTH - W / 2,   z: DIAG_CZ - 5 },
  { id: 'kitchen-sw',  x: KITCHEN_X0 - W / 2,     z: ROOM_D + W / 2 },
  { id: 'kitchen-se',  x: KITCHEN_X1 + W / 2,     z: ROOM_D + W / 2 },
  { id: 'corner-se',   x: ROOM_W + W / 2,          z: ROOM_D + W / 2 },
  { id: 'niche-beam',  x: -10,                      z: NICHE_Z_START,   w: 20, d: NICHE_DEPTH },
  { id: 'bath-nw',     x: -NICHE_DEPTH - W / 2,   z: KITCHEN_Z + W / 2 },
  { id: 'kitchen-nw',  x: KITCHEN_X0 - W / 2,     z: KITCHEN_Z + W / 2 },
  { id: 'kitchen-ne',  x: KITCHEN_X1 + W / 2,     z: KITCHEN_Z + W / 2 },
  { id: 'shower-nw',   x: -NICHE_DEPTH - W / 2,   z: BATH_Z_END - W / 2 + 10 },
  { id: 'shower-ne',   x: 65,                      z: BATH_Z_END - W / 2 + 10 },
  { id: 'corr-n',      x: CORR_WALL_X,             z: KITCHEN_Z + W / 2 },
  { id: 'corr-s',      x: CORR_WALL_X,             z: ROOM_D + W / 2 },
  { id: 'corr-bath',   x: CORR_WALL_X,             z: BATH_Z_END - W / 2 + 10 },
  { id: 'shower-sw',   x: -NICHE_DEPTH - W / 2,   z: BATH_Z_END + 70 + W / 2 },
  { id: 'shower-se',   x: 65,                      z: BATH_Z_END + 70 + W / 2 },
  { id: 'garden-e',    x: ROOM_W + W / 2,           z: -230 - W / 2 },
] as const satisfies readonly PillarDef[];

type PillarId = typeof PILLAR_DEFS[number]['id'];
const PILLAR_BY_ID = new Map(PILLAR_DEFS.map(p => [p.id, p] as const));

function pillar(id: PillarId) {
  const def = PILLAR_BY_ID.get(id);
  if (!def) throw new Error(`Unknown pillar id: ${id}`);
  return def;
}

const pX = (id: PillarId) => pillar(id).x;
const pZ = (id: PillarId) => pillar(id).z;
const pW = (id: PillarId) => {
  const p = pillar(id);
  return 'w' in p ? p.w : W;
};
const pD = (id: PillarId) => {
  const p = pillar(id);
  return 'd' in p ? p.d : W;
};

const pWest  = (id: PillarId) => pX(id) - pW(id) / 2;
const pEast  = (id: PillarId) => pX(id) + pW(id) / 2;
const pNorth = (id: PillarId) => pZ(id) - pD(id) / 2;
const pSouth = (id: PillarId) => pZ(id) + pD(id) / 2;

export const WALL_DEFS: WallDef[] = [

  // ── MUR A (ouest) ──────────────────────────────────────────────────────────
  // A1 : face intérieure séjour.
  { axis: 'z', xc: pEast('corner-nw') - W / 2, z1: pSouth('corner-nw'), z2: pNorth('niche-beam'), mat: 'west' },
  // A2a-outer : paroi arrière niche (3D uniquement, masquée par A1 en 2D)
  { axis: 'z', xc: pX('corner-sw'), z1: pSouth('corner-nw'), z2: pNorth('niche-beam'), mat: 'west', segKind: 'none' },
  // A2a : face intérieure niche
  { axis: 'z', xc: pX('corner-sw'), z1: pSouth('niche-beam'), z2: pNorth('corner-sw'), mat: 'west' },
  // A2b : SDB + couloir (saute les piliers)
  { axis: 'z', xc: pX('corner-sw'), z1: pSouth('corner-sw'), z2: pNorth('bath-nw'), mat: 'west' },
  { axis: 'z', xc: pX('corner-sw'), z1: pSouth('bath-nw'), z2: pNorth('shower-nw'), mat: 'west' },
  { axis: 'z', xc: pX('corner-sw'), z1: pSouth('shower-nw'), z2: pNorth('shower-sw'), mat: 'west' },
  { axis: 'z', xc: pX('corner-sw'), z1: pSouth('shower-sw'), z2: pNorth('diag-sw'), mat: 'west' },

  // ── MUR B (est) ────────────────────────────────────────────────────────────
  { axis: 'z', xc: pX('corner-ne'), z1: pSouth('corner-ne'), z2: pNorth('corner-se'), mat: 'east' }, // B1 séjour
  { axis: 'z', xc: pX('corner-ne'), z1: pSouth('garden-e'), z2: pNorth('corner-ne'), mat: 'east' }, // B2 jardin
  { axis: 'z', xc: pX('corner-ne'), z1: pSouth('corner-se'), z2: pNorth('diag-ne'), mat: 'east' }, // couloir droit

  // ── MUR D (sud, Z=400) ────────────────────────────────────────────────────
  { axis: 'x', x1: pEast('corner-sw'), x2: pWest('kitchen-sw'), zc: pZ('corner-sw') },
  { axis: 'x', x1: pEast('kitchen-se'), x2: pWest('corr-s'), zc: pZ('corner-sw') },
  // Linteau au-dessus de la porte principale (3D seulement)
  { axis: 'x', x1: DOOR_START, x2: DOOR_END + 4, zc: pZ('corner-sw'), yBase: DOOR_H, h: WALL_H - DOOR_H, segKind: 'none' },
  { axis: 'x', x1: DOOR_END + 4, x2: pWest('corner-se'), zc: pZ('corner-sw') },
  // Porte principale (2D uniquement)
  { axis: 'x', x1: DOOR_START, x2: DOOR_END, zc: ROOM_D, segKind: 'door', skip3d: true },

  // ── Cuisine ────────────────────────────────────────────────────────────────
  { axis: 'z', xc: pX('kitchen-sw'), z1: pSouth('kitchen-sw'), z2: pNorth('kitchen-nw') },
  { axis: 'z', xc: pX('kitchen-se'), z1: pSouth('kitchen-se'), z2: pNorth('kitchen-ne') },
  // Mur nord SDB / fond cuisine (3 morceaux, saute les piliers)
  { axis: 'x', x1: pEast('bath-nw'), x2: pWest('kitchen-nw'), zc: pZ('bath-nw') },
  { axis: 'x', x1: pEast('kitchen-nw'), x2: pWest('kitchen-ne'), zc: pZ('bath-nw') },
  { axis: 'x', x1: pEast('kitchen-ne'), x2: pWest('corr-n'), zc: pZ('bath-nw') },

  // ── Couloir gauche (X=185, Z=460→600) ────────────────────────────────────
  // Segment avant porte (avec offset CORR_E pour éviter z-fighting dormant)
  { axis: 'z', xc: pX('corr-n'), z1: pSouth('corr-n'), z2: CORR_DOOR_S - CORR_E },
  // Segment après porte
  { axis: 'z', xc: pX('corr-n'), z1: CORR_DOOR_E + CORR_E, z2: pNorth('corr-bath') },
  // Linteau au-dessus de la porte couloir (3D seulement)
  { axis: 'z', xc: pX('corr-n'), z1: CORR_DOOR_S - CORR_E, z2: CORR_DOOR_E + CORR_E,
    yBase: DOOR_H, h: WALL_H - DOOR_H, segKind: 'none' },
  // Porte couloir SDB (2D uniquement)
  { axis: 'z', xc: pX('corr-n'), z1: CORR_DOOR_S, z2: CORR_DOOR_E, segKind: 'door', skip3d: true },

  // ── Mur C (nord, Z=0) ────────────────────────────────────────────────────────
  // Panneau ouest (fixe)
  { axis: 'x', x1: pEast('corner-nw'), x2: GLASS_START, zc: pZ('corner-nw'), t: WALL_C_T, mat: 'north' },
  // Panneau est — 2D plan uniquement (3D inline dans Walls, skip3d car pas de skip3d pour ROOM_W)
  { axis: 'x', x1: GLASS_END, x2: pWest('corner-ne'), zc: pZ('corner-nw'), t: WALL_C_T, mat: 'north', skip3d: true },
  // Linteau au-dessus de la baie (3D uniquement)
  { axis: 'x', x1: GLASS_START, x2: GLASS_END, zc: pZ('corner-nw'), t: WALL_C_T, mat: 'north', yBase: GLASS_TOP_Y, h: WALL_H - GLASS_TOP_Y, segKind: 'none' },

  // ── Douche ─────────────────────────────────────────────────────────────────
  { axis: 'z', xc: pX('shower-ne'), z1: pSouth('shower-ne'), z2: pNorth('shower-se') },
  { axis: 'x', x1: pEast('shower-sw'), x2: pWest('shower-se'), zc: pZ('shower-sw') },

];
