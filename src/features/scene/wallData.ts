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

// =============================================
// MESURES RÉELLES (Télémètre laser / Mètre ruban)
// =============================================
/** Largeur / profondeur Z du placard couloir entre le retour porte séjour (door-living-w) et le mur SDB (bath-ne) : 52 cm */
export const MEASURED_DIST_CORRIDOR_CLOSET_Z        = 52;
/** Distance Z entre le mur nord de la SDB (Z de bath-nw/kitchen-sw) et shower-ne : 141 cm */
export const MEASURED_DIST_BATH_N_TO_SHOWER_NE      = 141;
/** Distance X entre le mur ouest SDB et la porte sdb nord (door-bath-n) / largeur intérieure SDB : 202 cm */
export const MEASURED_DIST_BATH_W_TO_DOOR_BATH_N    = 202;
/** Largeur de l'ouverture cuisine entre kitchen-nw et kitchen-ne : 102 cm */
export const MEASURED_DIST_KITCHEN_NW_TO_NE         = 102;
/** Profondeur du séjour le long du mur Est entre corner-ne et corner-se : 405 cm */
export const MEASURED_DIST_CORNER_NE_TO_SE          = 405;
/** Largeur de la douche entre shower-nw et shower-ne : 71 cm */
export const MEASURED_DIST_SHOWER_NW_TO_NE = 71;

export const MEASURED_DIST_SHOWER_NW_TO_SW = 73; // env 3cm + 70cm du bac
/** Largeur du couloir entre la porte SDB (door-bath-e) et le mur Est couloir (corner-se.x / diag-ne.x) : 116 cm */
export const MEASURED_DIST_DOOR_BATH_E_TO_CORR_E    = 116;
/** Largeur de la pièce entre niche-beam (poutre/niche) et le mur Est (corner-ne.x / corner-se.x) : 316 cm */
export const MEASURED_DIST_NICHE_BEAM_TO_EAST_WALL  = 316;
/** Hauteur sous plafond mesurée entre parquet et plafond : 250 cm */
export const MEASURED_HEIGHT_FLOOR_TO_CEILING       = 250;
/** Distance entre le mur Ouest de la niche de la pièce principale et le mur Ouest de la cuisine : 41,5 cm */
export const MEASURED_DIST_ROOM_WEST_NICHE_WALL_TO_KITCHEN_WEST_WALL = 41.5;

export const MEASURED_KITCHEN_DEPTH = 60; // 60cm
// =============================================
// DIMENSIONS DU MODÈLE 3D
// =============================================

export const ROOM_W = MEASURED_DIST_NICHE_BEAM_TO_EAST_WALL; // 3,16m — largeur réelle du séjour
export const ROOM_D = MEASURED_DIST_CORNER_NE_TO_SE; // 400; // 4m TODO : true value is MEASURED_DIST_CORNER_NE_TO_SE
export const WALL_H = MEASURED_HEIGHT_FLOOR_TO_CEILING; // 2.5m

// ── Épaisseurs et repères axiaux ──────────────────────────────────────────────
export const WALL_THICKNESS      = 10;   // Épaisseur murs porteurs / extérieurs (cm)
export const PARTITION_THICKNESS = 7.2;  // Épaisseur cloisons intérieures placo (cm)



// ── Types ─────────────────────────────────────────────────────────────────────
export type WallMat = 'west' | 'east' | 'north' | 'south' | 'default';
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

const WT = WALL_THICKNESS;
const PT = PARTITION_THICKNESS;

const _ROOM_NORTH_WALL = 0;
const _ROOM_WEST_WALL = 0;
const _ROOM_EAST_WALL = _ROOM_WEST_WALL + ROOM_W;
const _ROOM_EAST_WALL_X = _ROOM_EAST_WALL + WT / 2;
const _ROOM_SOUTH_WALL = _ROOM_NORTH_WALL + ROOM_D;

const _BATH_WEST_WALL = -10;
const _BATH_WEST_WALL_X = _BATH_WEST_WALL - WT / 2;
const _KITCHEN_SOUTH_WALL = _ROOM_SOUTH_WALL + MEASURED_KITCHEN_DEPTH;
const _BATH_NORTH_WALL = _KITCHEN_SOUTH_WALL + PT;

const _CORRIDOR_NORTH_WALL = _ROOM_SOUTH_WALL + PT;
const _KITCHEN_WEST_WALL = _BATH_WEST_WALL + MEASURED_DIST_ROOM_WEST_NICHE_WALL_TO_KITCHEN_WEST_WALL; // TODO : MEASURED_DIST_ROOM_WEST_NICHE_WALL_TO_KITCHEN_WEST_WALL 41,5
const _KITCHEN_WEST_WALL_X = _KITCHEN_WEST_WALL - PT / 2;
const _KITCHEN_EAST_WALL = _KITCHEN_WEST_WALL + MEASURED_DIST_KITCHEN_NW_TO_NE;
const _KITCHEN_EAST_WALL_X = _KITCHEN_EAST_WALL + PT / 2;
const _BATH_KITCHEN_WALL_Z = _KITCHEN_SOUTH_WALL + PT / 2;
const _ROOM_CORRIDOR_WALL_Z = _ROOM_SOUTH_WALL + PT / 2;
const _BATH_CORRIDOR_WALL_X = _BATH_WEST_WALL + MEASURED_DIST_BATH_W_TO_DOOR_BATH_N + PT / 2;

// Repères calculés de la douche
const _BATH_SOUTH_WALL = _BATH_NORTH_WALL + MEASURED_DIST_BATH_N_TO_SHOWER_NE;
const _BATH_SOUTH_WALL_Z = _BATH_SOUTH_WALL + PT / 2;
const _SHOWER_SOUTH_WALL_Z = _BATH_SOUTH_WALL_Z + MEASURED_DIST_SHOWER_NW_TO_SW + PT / 2;
const _SHOWER_EAST_WALL_X = _BATH_WEST_WALL + MEASURED_DIST_SHOWER_NW_TO_NE + PT / 2;

// Porte : 80cm d'ouverture, alignée après mur couloir (X=200)
export const DOOR_START = 200; // cm 200
export const DOOR_END = 286; // cm 286
export const DOOR_H = 204;      // hauteur standard française (panneaux de porte)

const GLASS_START = 95;   // Début baie vitrée mur C (Nord)
const GLASS_END   = 260;  // Fin baie vitrée mur C (Nord)

// Mur diagonal bâtiment — paramètre physique unique : angle intérieur au coin Est (NE)
// (angle entre mur Est et le mur diagonal, mesuré à l'intérieur de la pièce)
// Mesure sur place : 118–120°  |  modèle actuel : 122.5°
export const DIAG_ANGLE_DEG = 120;
const _diagAngle = DIAG_ANGLE_DEG * (Math.PI / 180);
const _AX = _ROOM_EAST_WALL;
const _AZ = _CORRIDOR_NORTH_WALL + 134.8; // TODO : true value for 134.8 is MEASURED_DIST_CORRIDOR_NORTH_EAST_ANGLE_TO_CORRIDOR_EAST_WALL_DIAGONAL_WALL_ANGLE
const _CX = _BATH_WEST_WALL;
const _CZ = _AZ - (_AX - _CX) / Math.tan(_diagAngle);
const _DX = _CX - _AX;
const _DZ = _CZ - _AZ;
const _LEN = Math.sqrt(_DX * _DX + _DZ * _DZ);
const _SIN = _DX / _LEN;
const _COS = _DZ / _LEN;

/** Centralise la logique du mur diagonal (trigonométrie, positions, porte). */
export const DiagWall = {
  A: { x: _AX, z: _AZ },
  C: { x: _CX, z: _CZ },
  depth: 10,
  len: _LEN,
  sin: _SIN,
  cos: _COS,
  rotY: Math.atan2(_DX, _DZ),
  slope: (_CZ - _AZ) / (_CX - _AX),
  door: { start: 10, width: 90, end: 100 },
  /**
   * Calcule un point (x, z) le long du mur diagonal.
   * @param d Distance depuis le point A (Est) vers C (Ouest)
   * @param off Offset perpendiculaire. Positif = extérieur, Négatif = intérieur.
   */
  p(d: number, off: number = 0) {
    return {
      x: _AX + d * _SIN + off * _COS,
      z: _AZ + d * _COS - off * _SIN
    };
  }
};

// ── PILLAR_DEFS : Poteaux structurels et huisseries ───────────────────────────
export const PILLAR_DEFS = [
  // ── Façade Nord (Mur C) : Béton 20cm + Placo 10cm ─────────────────────────
  { id: 'corner-nw',      x: -5,                    z: -5 },
  { id: 'corner-nw-ext',  x: -15,                   z: -20,                 d: 20 },
  { id: 'glass-west',     x: GLASS_START - WT / 2,  z: -5 },
  { id: 'glass-west-ext', x: GLASS_START - WT / 2,  z: -20,                 d: 20 },
  { id: 'glass-east',     x: GLASS_END + WT / 2,    z: -5 },
  { id: 'glass-east-ext', x: GLASS_END + WT / 2,    z: -20,                 d: 20 },
  { id: 'corner-ne',      x: _ROOM_EAST_WALL_X,       z: -5 },
  { id: 'corner-ne-ext',  x: _ROOM_EAST_WALL_X,       z: -20,                 d: 20 },

  // ── Séjour & Niche Ouest ──────────────────────────────────────────────────
  { id: 'niche-beam',     x: -5,                    z: ROOM_D - 120 - PT / 2, w: WT, d: WT },
  { id: 'corner-sw',      x: _BATH_WEST_WALL_X,      z: _ROOM_CORRIDOR_WALL_Z,     w: WT, d: PT },
  { id: 'corner-se',      x: _ROOM_EAST_WALL_X,       z: _ROOM_CORRIDOR_WALL_Z,     w: WT, d: PT },

  // ── Cuisine ───────────────────────────────────────────────────────────────
  { id: 'kitchen-nw',     x: _KITCHEN_WEST_WALL_X,   z: _ROOM_CORRIDOR_WALL_Z,     w: PT, d: PT },
  { id: 'kitchen-ne',     x: _KITCHEN_EAST_WALL_X,   z: _ROOM_CORRIDOR_WALL_Z,     w: PT, d: PT },
  { id: 'kitchen-sw',     x: _KITCHEN_WEST_WALL_X,   z: _BATH_KITCHEN_WALL_Z, w: PT, d: PT },
  { id: 'kitchen-se',     x: _KITCHEN_EAST_WALL_X,   z: _BATH_KITCHEN_WALL_Z, w: PT, d: PT },

  // ── Huisseries et Jambages de portes ──────────────────────────────────────
  { id: 'door-living-w',  x: _BATH_CORRIDOR_WALL_X,   z: _ROOM_CORRIDOR_WALL_Z,     w: PT, d: PT },
  { id: 'door-living-e',  x: DOOR_END + PT / 2,     z: _ROOM_CORRIDOR_WALL_Z,     w: PT, d: PT },
  { id: 'door-bath-n',    x: _BATH_CORRIDOR_WALL_X, z: _CORRIDOR_NORTH_WALL + 109 + 3 - PT / 2, w: PT, d: PT },
  { id: 'door-bath-s',    x: _BATH_CORRIDOR_WALL_X, z: _CORRIDOR_NORTH_WALL + 109 + 89 + PT / 2, w: PT, d: PT },

  // ── Salle de Bain & Douche ────────────────────────────────────────────────
  { id: 'bath-nw',        x: _BATH_WEST_WALL_X,      z: _BATH_KITCHEN_WALL_Z, w: WT, d: PT },
  { id: 'bath-ne',        x: _BATH_CORRIDOR_WALL_X,  z: _BATH_KITCHEN_WALL_Z, w: PT, d: PT },
  { id: 'bath-se',        x: _BATH_CORRIDOR_WALL_X,  z: _BATH_SOUTH_WALL_Z,          w: PT, d: PT },
  { id: 'shower-nw',      x: _BATH_WEST_WALL_X,      z: _BATH_SOUTH_WALL_Z,          w: WT, d: PT },
  { id: 'shower-ne',      x: _SHOWER_EAST_WALL_X,    z: _BATH_SOUTH_WALL_Z,          w: PT, d: PT },
  { id: 'shower-sw',      x: _BATH_WEST_WALL_X,      z: _SHOWER_SOUTH_WALL_Z,          w: WT, d: PT },
  { id: 'shower-se',      x: _SHOWER_EAST_WALL_X,    z: _SHOWER_SOUTH_WALL_Z,          w: PT, d: PT },

  // ── Extrémités et Porte Mur Diagonal ──────────────────────────────────────
  { id: 'diag-ne',        x: _ROOM_EAST_WALL_X,       z: DiagWall.A.z - WT / 2 },
  { id: 'diag-sw',        x: _BATH_WEST_WALL_X,      z: DiagWall.C.z - 5 },
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

// ── Huisseries et repères de portes ──────────────────────────────────────────
export const DOOR_BATH_START = pNorth('door-bath-n');
export const DOOR_BATH_END   = DOOR_BATH_START + (DOOR_END - DOOR_START);

// ── Faces internes des murs (repères de placement) ─────────────────────────

// Séjour (Living Room)
export const ROOM_NORTH_WALL     = pSouth('corner-nw');        // Z = 0      (face intérieure façade vitrée)
export const ROOM_SOUTH_WALL     = pNorth('corner-sw');        // Z ≈ 396.6  (face séjour de la partition sud)
export const ROOM_EAST_WALL      = pWest('corner-ne');         // X = 316    (face intérieure mur est)
export const ROOM_WEST_WALL      = pEast('corner-nw');         // X = 0      (face intérieure mur ouest)

// Cuisine (Kitchen) — alvéole au sud du séjour, ouvert au nord
export const KITCHEN_SOUTH_WALL  = pNorth('kitchen-sw');       // Z ≈ 460.0  (face cuisine de la partition cuisine/sdb)
export const KITCHEN_EAST_WALL   = pWest('kitchen-ne');        // X ≈ 126.4
export const KITCHEN_WEST_WALL   = pEast('kitchen-nw');        // X ≈ 33.6
// KITCHEN_NORTH_WALL : pas de mur (ouvert sur le séjour)

// Salle de bain (Bathroom)
export const BATH_NORTH_WALL     = pSouth('bath-nw');          // Z ≈ 463.6  (face sdb de la partition cuisine/sdb)
export const BATH_SOUTH_WALL     = pNorth('shower-nw');        // Z ≈ 610.8
export const BATH_EAST_WALL      = pWest('bath-ne');           // X ≈ 192.0  (face sdb de la cloison couloir)
export const BATH_WEST_WALL      = pEast('corner-sw');         // X ≈ -10    (face intérieure mur ouest béton)
export const SHOWER_SOUTH_WALL   = pNorth('shower-sw');        // Z ≈ 683.8  (face douche de la cloison sud douche)

// Couloir (Corridor)
export const CORRIDOR_NORTH_WALL = pSouth('door-living-w');    // Z ≈ 403.8  (face couloir de la partition séjour)
export const CORRIDOR_EAST_WALL  = pWest('corner-se');         // X = 316    (face intérieure mur est)
export const CORRIDOR_WEST_WALL  = pEast('bath-ne');           // X ≈ 199.2  (face couloir de la cloison sdb)
// CORRIDOR_SOUTH_WALL : mur diagonal, exclu volontairement

// ── Mur diagonal : repères et segments 2D ─────────────────────────────────────
const { door: dDoor, len: dLen, p: dP } = DiagWall;
const pExt = (d: number) => dP(d, WT);
const pInt = (d: number) => dP(d, 0);
const seg  = (p1: { x: number; z: number }, p2: { x: number; z: number }): [number, number, number, number] =>
  [p1.x, p1.z, p2.x, p2.z];

export const GARDEN_JC_Z = -140 + DiagWall.slope * (pWest('corner-ne-ext') - pEast('corner-nw-ext'));

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

function wallX(zc: number, x1: number, x2: number, mat: WallMat = 'default', t = WT,
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
  ...wallX(pZ('corner-sw'), pEast('corner-sw'),   pWest('kitchen-nw'),   'default', PT),
  ...wallX(pZ('corner-sw'), pEast('kitchen-ne'),  pWest('door-living-w'), 'default', PT),
  ...wallX(pZ('corner-sw'), pEast('door-living-e'), pWest('corner-se'),  'default', PT),
  { axis: 'x', x1: pEast('door-living-w'), x2: pWest('door-living-e'), zc: pEast('corner-ne'), segKind: 'door', t: PT },

  // ── Cuisine ─────────────────────────────────────────────────────────────────
  ...wallZ(pX('kitchen-nw'), pSouth('kitchen-nw'), pNorth('kitchen-sw'), 'default', PT),
  ...wallZ(pX('kitchen-ne'), pSouth('kitchen-ne'), pNorth('kitchen-se'), 'default', PT),
  ...wallX(pZ('bath-nw'),    pEast('bath-nw'),     pWest('kitchen-sw'),  'default', PT),
  ...wallX(pZ('bath-nw'),    pEast('kitchen-sw'),  pWest('kitchen-se'),  'default', PT),
  ...wallX(pZ('bath-nw'),    pEast('kitchen-se'),  pWest('bath-ne'),     'default', PT),

  // ── Cloison Couloir / SDB ───────────────────────────────────────────────────
  ...wallZ(pX('bath-ne'), pSouth('bath-ne'), pNorth('door-bath-n'), 'default', PT),
  { axis: 'z', xc: pX('bath-ne'), z1: pSouth('door-bath-n'), z2: pNorth('door-bath-s'), segKind: 'door', t: PT },

  // ── Mur Nord (Façade baie vitrée) ───────────────────────────────────────────
  ...wallX(pZ('corner-nw'),     pEast('corner-nw'),     pWest('glass-west'),     'north'),
  ...wallX(pZ('corner-nw-ext'), pEast('corner-nw-ext'), pWest('glass-west-ext'), 'north', 20, { h: WALL_H - 0.1 }),
  ...wallX(pZ('corner-ne'),     pEast('glass-east'),     pWest('corner-ne'),      'north'),
  ...wallX(pZ('corner-ne-ext'), pEast('glass-east-ext'), pWest('corner-ne-ext'),  'north', 20, { h: WALL_H - 0.1 }),

  // ── Douche ──────────────────────────────────────────────────────────────────
  ...wallZ(pX('shower-ne'), pSouth('shower-ne'), pNorth('shower-se'), 'default', PT),
  ...wallX(pZ('shower-sw'), pEast('shower-sw'),  pWest('shower-se'),  'south', PT),
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
