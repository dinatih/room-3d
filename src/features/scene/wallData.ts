/**
 * wallData.ts — Source unique de vérité pour l'architecture des murs et piliers.
 *
 * Architecture :
 *  - PILLAR_DEFS : Poteaux structurels, huisseries et jonctions (source primaire).
 *  - Helpers pWest/pEast/pNorth/pSouth : Arêtes déduites des piliers.
 *  - WALL_DEFS   : Pans de murs 3D discrétisés entre les piliers (consommé par Walls.tsx).
 *  - Segments 2D : Dérivations directes pour Minimap et FloorPlan (floorData.ts / floorDraw.ts).
 */
import * as THREE from 'three';
import {
  ROOM_W, ROOM_D, WALL_H,
  NICHE_X, NICHE_Z_START,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z,
  DOOR_START, DOOR_END,
  BATH_Z_END,
  DiagWall,
} from '@config';

// ── Épaisseurs et repères axiaux ──────────────────────────────────────────────
export const WALL_THICKNESS      = 10;   // Épaisseur murs porteurs / extérieurs (cm)
export const PARTITION_THICKNESS = 7.2;  // Épaisseur cloisons intérieures placo (cm)

const WT = WALL_THICKNESS;
const PT = PARTITION_THICKNESS;

const GLASS_START = 95;   // Début baie vitrée mur C (Nord)
const GLASS_END   = 260;  // Fin baie vitrée mur C (Nord)

export const CORR_WALL_X = 192 + PT / 2; // Axe X de la cloison couloir gauche (195.6 cm)

// Repères calculés de la douche
const SHOWER_Z_N = KITCHEN_Z + PT + 140 + PT / 2; // Z=610.8 (aligné avec BATH_Z_END)
const SHOWER_Z_S = SHOWER_Z_N + 70;              // Z=680.8

// ── Types ─────────────────────────────────────────────────────────────────────
export type WallMat = 'west' | 'east' | 'north' | 'default';
export type SegKind = 'wall' | 'door' | 'window';

export type PillarDef = {
  id: string;
  x: number;
  z: number;
  w?: number;
  d?: number;
  rot?: number;
};

export type WallDef = {
  segKind?: SegKind | 'none'; // Défaut 'wall'
  mat?:     WallMat;          // Défaut 'default'
  h?:       number;           // Défaut WALL_H
  yBase?:   number;           // Défaut 0
  t?:       number;           // Épaisseur (défaut WT)
} & (
  | { axis: 'z'; xc: number; z1: number; z2: number }
  | { axis: 'x'; x1: number; x2: number; zc: number }
);

// ── PILLAR_DEFS : Poteaux structurels et huisseries ───────────────────────────
export const PILLAR_DEFS = [
  // ── Façade Nord (Mur C) : Béton 20cm + Placo 10cm ─────────────────────────
  { id: 'corner-nw',      x: -5,                    z: -5 },
  { id: 'corner-nw-ext',  x: -15,                   z: -20,                 d: 20 },
  { id: 'glass-west',     x: GLASS_START - WT / 2,  z: -5 },
  { id: 'glass-west-ext', x: GLASS_START - WT / 2,  z: -20,                 d: 20 },
  { id: 'glass-east',     x: GLASS_END + WT / 2,    z: -5 },
  { id: 'glass-east-ext', x: GLASS_END + WT / 2,    z: -20,                 d: 20 },
  { id: 'corner-ne',      x: ROOM_W + WT / 2,       z: -5 },
  { id: 'corner-ne-ext',  x: ROOM_W + WT / 2,       z: -20,                 d: 20 },

  // ── Séjour & Niche Ouest ──────────────────────────────────────────────────
  { id: 'niche-beam',     x: -5,                    z: NICHE_Z_START },
  { id: 'corner-sw',      x: NICHE_X - WT / 2,      z: ROOM_D + PT / 2,     w: WT, d: PT },
  { id: 'corner-se',      x: ROOM_W + WT / 2,       z: ROOM_D + PT / 2,     w: WT, d: PT },

  // ── Cuisine ───────────────────────────────────────────────────────────────
  { id: 'kitchen-sw',     x: KITCHEN_X0 - PT / 2,   z: ROOM_D + PT / 2,     w: PT, d: PT },
  { id: 'kitchen-se',     x: KITCHEN_X1 + PT / 2,   z: ROOM_D + PT / 2,     w: PT, d: PT },
  { id: 'kitchen-nw',     x: KITCHEN_X0 - PT / 2,   z: KITCHEN_Z + PT / 2, w: PT, d: PT },
  { id: 'kitchen-ne',     x: KITCHEN_X1 + PT / 2,   z: KITCHEN_Z + PT / 2, w: PT, d: PT },

  // ── Huisseries et Jambages de portes ──────────────────────────────────────
  { id: 'door-living-w',  x: DOOR_START - PT / 2,   z: ROOM_D + PT / 2,     w: PT, d: PT },
  { id: 'door-living-e',  x: DOOR_END + PT / 2,     z: ROOM_D + PT / 2,     w: PT, d: PT },
  { id: 'door-bath-n',    x: CORR_WALL_X,           z: 513.4,               w: PT, d: PT },
  { id: 'door-bath-s',    x: CORR_WALL_X,           z: 606.6,               w: PT, d: PT },

  // ── Salle de Bain & Douche ────────────────────────────────────────────────
  { id: 'bath-nw',        x: NICHE_X - WT / 2,      z: KITCHEN_Z + PT / 2, w: WT, d: PT },
  { id: 'bath-ne',        x: CORR_WALL_X,           z: KITCHEN_Z + PT / 2, w: PT, d: PT },
  { id: 'bath-se',        x: CORR_WALL_X,           z: BATH_Z_END + PT / 2, w: PT, d: PT },
  { id: 'shower-nw',      x: NICHE_X - WT / 2,      z: SHOWER_Z_N,          w: WT, d: PT },
  { id: 'shower-ne',      x: 65,                    z: SHOWER_Z_N,          w: PT, d: PT },
  { id: 'shower-sw',      x: NICHE_X - WT / 2,      z: SHOWER_Z_S,          w: WT, d: PT },
  { id: 'shower-se',      x: 65,                    z: SHOWER_Z_S,          w: PT, d: PT },

  // ── Extrémités et Porte Mur Diagonal ──────────────────────────────────────
  { id: 'diag-ne',        x: ROOM_W + WT / 2,       z: DiagWall.A.z - WT / 2 },
  { id: 'diag-sw',        x: NICHE_X - WT / 2,      z: DiagWall.C.z - 5 },
  { id: 'diag-ne-end',    ...DiagWall.p(WT / 2, DiagWall.depth / 2),                  d: DiagWall.depth, rot: DiagWall.rotY },
  { id: 'diag-sw-end',    ...DiagWall.p(DiagWall.len - WT / 2, DiagWall.depth / 2),   d: DiagWall.depth, rot: DiagWall.rotY },
  { id: 'door-entry-w',   ...DiagWall.p(DiagWall.door.end + WT / 2, DiagWall.depth / 2), rot: DiagWall.rotY },

  // ── Jardin Extérieur ──────────────────────────────────────────────────────
  { id: 'garden-e',       x: ROOM_W + WT / 2,       z: -220 - WT / 2 },
] as const satisfies readonly PillarDef[];

// ── Helpers spatiaux indexés sur les piliers ─────────────────────────────────
export type PillarId = typeof PILLAR_DEFS[number]['id'];
const PILLAR_BY_ID = new Map(PILLAR_DEFS.map(p => [p.id, p]));

function pillar(id: PillarId): PillarDef {
  const def = PILLAR_BY_ID.get(id);
  if (!def) throw new Error(`Unknown pillar id: ${id}`);
  return def;
}

export const pX     = (id: PillarId) => pillar(id).x;
export const pZ     = (id: PillarId) => pillar(id).z;
export const pW     = (id: PillarId) => pillar(id).w ?? WT;
export const pD     = (id: PillarId) => pillar(id).d ?? WT;
export const pWest  = (id: PillarId) => pX(id) - pW(id) / 2;
export const pEast  = (id: PillarId) => pX(id) + pW(id) / 2;
export const pNorth = (id: PillarId) => pZ(id) - pD(id) / 2;
export const pSouth = (id: PillarId) => pZ(id) + pD(id) / 2;

// ── Mur diagonal : repères et segments 2D ─────────────────────────────────────
export { DiagWall };
const { door: dDoor, len: dLen, p: dP } = DiagWall;
const pExt = (d: number) => dP(d, WT);
const pInt = (d: number) => dP(d, 0);
const seg  = (p1: { x: number; z: number }, p2: { x: number; z: number }): [number, number, number, number] =>
  [p1.x, p1.z, p2.x, p2.z];

export const GARDEN_JC_Z = -140 + DiagWall.slope * 320;

// Calcul des apex des coins extérieurs (intersection des faces orthogonales et de la face diagonale)
const eP0 = dP(0, WT);
const tC = (WT - (eP0.x - DiagWall.A.x)) / DiagWall.sin;
export const CORNER_NE_APEX = { x: DiagWall.A.x + WT, z: eP0.z + tC * DiagWall.cos };

const ePLen = dP(dLen, WT);
const tC_sw = ((DiagWall.C.x - WT) - ePLen.x) / DiagWall.sin;
export const CORNER_SW_APEX = { x: DiagWall.C.x - WT, z: ePLen.z + tC_sw * DiagWall.cos };

export const DIAG_EXT_Z_END = CORNER_SW_APEX.z;

// Piliers d'angle biseautés (kites) correspondant à diag-ne-kite et diag-sw-kite
export const PILLAR_KITE_NE: [number, number][] = [
  [eP0.x, eP0.z],
  [CORNER_NE_APEX.x, CORNER_NE_APEX.z],
  [CORNER_NE_APEX.x, DiagWall.A.z],
  [DiagWall.A.x, DiagWall.A.z],
];

export const PILLAR_KITE_SW: [number, number][] = [
  [DiagWall.C.x, DiagWall.C.z],
  [CORNER_SW_APEX.x, DiagWall.C.z],
  [CORNER_SW_APEX.x, CORNER_SW_APEX.z],
  [ePLen.x, ePLen.z],
];

export const SEG_DIAG_CONCRETE_WALLS: [number, number, number, number][] = [
  seg(pExt(0),           pExt(dDoor.start)),
  seg(pExt(dDoor.end),   pExt(dLen)),
  seg(pInt(0),           pInt(dDoor.start)),
  seg(pInt(dDoor.end),   pInt(dLen)),
  seg(pInt(dDoor.start), pExt(dDoor.start)),
  seg(pInt(dDoor.end),   pExt(dDoor.end)),
];

export const SEG_DIAG_ENTRY_DOOR: [number, number, number, number] =
  seg(pInt(dDoor.start), pInt(dDoor.end));

// ── Générateurs de tranches de murs 3D ────────────────────────────────────────
function splitSpan(min: number, max: number, maxLen = 100): [number, number][] {
  const len = max - min;
  if (len <= maxLen) return [[min, max]];
  const count = Math.ceil(len / maxLen);
  const step = len / count;
  return Array.from({ length: count }, (_, i) => [
    min + i * step - (i > 0 ? 0.1 : 0),
    min + (i + 1) * step + (i < count - 1 ? 0.1 : 0),
  ]);
}

function wallZ(xc: number, z1: number, z2: number, mat: WallMat = 'default', t = WT): WallDef[] {
  return splitSpan(z1, z2).map(([a, b]) => ({ axis: 'z', xc, z1: a, z2: b, mat, t }));
}

function wallX(
  zc: number,
  x1: number,
  x2: number,
  mat: WallMat = 'default',
  t = WT,
  extra?: { h?: number; yBase?: number; segKind?: SegKind | 'none' },
): WallDef[] {
  return splitSpan(x1, x2).map(([a, b]) => ({
    axis: 'x' as const,
    zc,
    x1: a,
    x2: b,
    mat,
    t,
    ...extra,
  }));
}

// ── WALL_DEFS : Spans de murs 3D entre piliers ────────────────────────────────
export const WALL_DEFS: WallDef[] = [
  // ── Mur Ouest ───────────────────────────────────────────────────────────────
  // Face arrière continue niche (extérieur) & face avant séjour
  ...wallZ(pEast('corner-nw') - 1.5 * WT, pNorth('corner-nw-ext'), pNorth('corner-sw'),   'west'),
  ...wallZ(pEast('corner-nw') - WT / 2,   pSouth('corner-nw'),     pNorth('niche-beam'),  'west'),
  // Mur béton Ouest SDB & Couloir (saute les poteaux)
  ...wallZ(pX('corner-sw'), pSouth('corner-sw'),  pNorth('bath-nw'),   'west'),
  ...wallZ(pX('corner-sw'), pSouth('bath-nw'),    pNorth('shower-nw'), 'west'),
  ...wallZ(pX('corner-sw'), pSouth('shower-nw'),  pNorth('shower-sw'), 'west'),
  ...wallZ(pX('corner-sw'), pSouth('shower-sw'),  pNorth('diag-sw'),   'west'),

  // ── Mur Est ─────────────────────────────────────────────────────────────────
  ...wallZ(pX('corner-ne'), pSouth('corner-ne'),  pNorth('corner-se'), 'east'), // Séjour
  ...wallZ(pX('corner-ne'), pSouth('garden-e'),   pNorth('corner-ne'), 'east'), // Jardin (brique)
  ...wallZ(pX('corner-ne'), pSouth('corner-se'),  pNorth('diag-ne'),   'east'), // Couloir droit

  // ── Mur Sud Séjour (Z=400) ──────────────────────────────────────────────────
  ...wallX(pZ('corner-sw'), pEast('corner-sw'),   pWest('kitchen-sw'),   'default', PT),
  ...wallX(pZ('corner-sw'), pEast('kitchen-se'),  pWest('door-living-w'), 'default', PT),
  ...wallX(pZ('corner-sw'), pEast('door-living-e'), pWest('corner-se'),  'default', PT),
  { axis: 'x', x1: pEast('door-living-w'), x2: pWest('door-living-e'), zc: ROOM_D, segKind: 'door', t: PT },

  // ── Cuisine ─────────────────────────────────────────────────────────────────
  ...wallZ(pX('kitchen-sw'), pSouth('kitchen-sw'), pNorth('kitchen-nw'), 'default', PT),
  ...wallZ(pX('kitchen-se'), pSouth('kitchen-se'), pNorth('kitchen-ne'), 'default', PT),
  ...wallX(pZ('bath-nw'),    pEast('bath-nw'),     pWest('kitchen-nw'),  'default', PT),
  ...wallX(pZ('bath-nw'),    pEast('kitchen-nw'),  pWest('kitchen-ne'),  'default', PT),
  ...wallX(pZ('bath-nw'),    pEast('kitchen-ne'),  pWest('bath-ne'),     'default', PT),

  // ── Cloison Couloir / SDB ───────────────────────────────────────────────────
  ...wallZ(pX('bath-ne'), pSouth('bath-ne'),     pNorth('door-bath-n'), 'default', PT),
  ...wallZ(pX('bath-ne'), pSouth('door-bath-s'), pNorth('bath-se'),     'default', PT),
  { axis: 'z', xc: pX('bath-ne'), z1: pNorth('door-bath-n'), z2: pNorth('door-bath-s'), segKind: 'door', t: PT },

  // ── Mur Nord (Façade baie vitrée) ───────────────────────────────────────────
  ...wallX(pZ('corner-nw'),     pEast('corner-nw'),     pWest('glass-west'),     'north'),
  ...wallX(pZ('corner-nw-ext'), pEast('corner-nw-ext'), pWest('glass-west-ext'), 'north', 20, { h: WALL_H - 0.1 }),
  ...wallX(pZ('corner-ne'),     pEast('glass-east'),     pWest('corner-ne'),      'north'),
  ...wallX(pZ('corner-ne-ext'), pEast('glass-east-ext'), pWest('corner-ne-ext'),  'north', 20, { h: WALL_H - 0.1 }),

  // ── Douche ──────────────────────────────────────────────────────────────────
  ...wallZ(pX('shower-ne'), pSouth('shower-ne'), pNorth('shower-se'), 'default', PT),
  ...wallX(pZ('shower-sw'), pEast('shower-sw'),  pWest('shower-se'),  'default', PT),
];

// ── Panneaux occultants bois jardin (côté Est) ────────────────────────────────
export type GardenPanelDef = { cx: number; cy: number; cz: number; w: number; h: number; d: number };
export const GARDEN_PANEL_DEFS: readonly GardenPanelDef[] = Array.from({ length: 6 }).map((_, i) => ({
  cx: ROOM_W + 5,
  cy: 95,
  cz: -220 - WT - i * 30 - 15,
  w: 10,
  h: 190,
  d: 30,
}));

// ── Utilitaires géométriques ──────────────────────────────────────────────────
export function wallSeg(d: WallDef): [number, number, number, number] {
  return d.axis === 'z'
    ? [d.xc, d.z1, d.xc, d.z2]
    : [d.x1, d.zc, d.x2, d.zc];
}

export function wallDefToBoxGeo(d: WallDef): THREE.BufferGeometry {
  const h     = d.h     ?? WALL_H;
  const yBase = d.yBase ?? 0;
  const t     = d.t     ?? WT;
  let g: THREE.BufferGeometry;
  if (d.axis === 'z') {
    g = new THREE.BoxGeometry(t, h, d.z2 - d.z1);
    g.translate(d.xc, yBase + h / 2, (d.z1 + d.z2) / 2);
  } else {
    g = new THREE.BoxGeometry(d.x2 - d.x1, h, t);
    g.translate((d.x1 + d.x2) / 2, yBase + h / 2, d.zc);
  }
  return g;
}
