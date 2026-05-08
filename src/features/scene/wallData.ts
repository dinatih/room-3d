/**
 * wallData.ts — source unique de vérité pour tous les segments de mur axiaux.
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
import {
  ROOM_W, ROOM_D, WALL_H,
  NICHE_DEPTH, NICHE_Z_START,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z,
  DOOR_START, DOOR_END, DOOR_H,
  CORR_DOOR_S, CORR_DOOR_E,
  SDB_Z_END,
  DIAG_AZ, DIAG_CZ,
} from '@config';

export const W      = 10; // épaisseur de mur (cm)
const CORR_E = 2;  // anti z-fighting dormant porte couloir

export const CORR_WALL_X = DOOR_START - 5; // 185 — centre du mur couloir gauche

export type WallMat  = 'west' | 'east' | 'north' | 'default';
export type SegKind  = 'wall' | 'door' | 'window';

export type WallDef = {
  segKind?: SegKind | 'none'; // défaut 'wall'
  mat?:     WallMat;          // défaut 'default'
  h?:       number;           // défaut WALL_H
  yBase?:   number;           // défaut 0
  skip3d?:  boolean;          // true → segment 2D uniquement
} & (
  | { axis: 'z'; xc: number; z1: number; z2: number }
  | { axis: 'x'; x1: number; x2: number; zc: number }
);

/** Segment 2D au centre de la paroi (±5 cm vs face intérieure, invisible à l'échelle minimap). */
export function wallSeg(d: WallDef): [number, number, number, number] {
  return d.axis === 'z'
    ? [d.xc, d.z1, d.xc, d.z2]
    : [d.x1, d.zc, d.x2, d.zc];
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
  { axis: 'z', xc: -NICHE_DEPTH - W / 2, z1: SDB_Z_END + 70 + W, z2: DIAG_CZ,        mat: 'west' },

  // ── MUR B (est) ────────────────────────────────────────────────────────────
  { axis: 'z', xc: ROOM_W + W / 2, z1: 0,    z2: ROOM_D,  mat: 'east' }, // B1 séjour
  { axis: 'z', xc: ROOM_W + W / 2, z1: -240, z2: -30,     mat: 'east' }, // B2 jardin
  { axis: 'z', xc: ROOM_W + W / 2, z1: ROOM_D + W, z2: DIAG_AZ, mat: 'east' }, // couloir droit

  // ── MUR D (sud, Z=400) ────────────────────────────────────────────────────
  { axis: 'x', x1: -NICHE_DEPTH,    x2: KITCHEN_X0 - W, zc: ROOM_D + W / 2 },
  { axis: 'x', x1: KITCHEN_X1 + W,  x2: DOOR_START,     zc: ROOM_D + W / 2 },
  // Linteau au-dessus de la porte principale (3D seulement)
  { axis: 'x', x1: DOOR_START,      x2: DOOR_END + 8,   zc: ROOM_D + W / 2, yBase: DOOR_H, h: WALL_H - DOOR_H, segKind: 'none' },
  { axis: 'x', x1: DOOR_END + 8,    x2: ROOM_W,         zc: ROOM_D + W / 2 },
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

  // ── Douche ─────────────────────────────────────────────────────────────────
  { axis: 'z', xc: -NICHE_DEPTH + 70 + W / 2, z1: SDB_Z_END + W,      z2: SDB_Z_END + 70 },
  { axis: 'x', x1: -NICHE_DEPTH,              x2: -NICHE_DEPTH + 70, zc: SDB_Z_END + 70 + W / 2 },

];
