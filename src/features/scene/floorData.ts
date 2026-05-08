/**
 * floorData.ts — segments 2D pour minimap et plan.
 *
 * SEG_WALLS / SEG_DOORS sont dérivés automatiquement de WALL_DEFS (wallData.ts).
 * Les segments manuels couvrent les cas non-axiaux :
 *   - mur C (WallC, reste dans Building.tsx)
 *   - coin de niche (connecteur géométrique, non issu d'un WZ/WX)
 *   - mur diagonal + portes spéciales
 *   - fenêtres (baie vitrée, vitrage douche)
 */
import {
  NICHE_DEPTH, NICHE_Z_START,
  GLASS_START, GLASS_END,
  DOOR_START,
  SDB_Z_END,
  DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ,
  ROOM_D, ROOM_W, KITCHEN_Z,
} from '@config';
import { WALL_DEFS, wallSeg, W } from './wallData';

// Points sur le mur diagonal pour la porte d'entrée
const _dLen = Math.sqrt((DIAG_CX - DIAG_AX) ** 2 + (DIAG_CZ - DIAG_AZ) ** 2);
const _dX   = (DIAG_CX - DIAG_AX) / _dLen;
const _dZ   = (DIAG_CZ - DIAG_AZ) / _dLen;
const DIAG_DOOR_S = { x: DIAG_AX + 10  * _dX, z: DIAG_AZ + 10  * _dZ };
const DIAG_DOOR_E = { x: DIAG_AX + 100 * _dX, z: DIAG_AZ + 100 * _dZ };

export type Seg = [number, number, number, number]; // x1, z1, x2, z2

// ── SEG_WALLS ─────────────────────────────────────────────────────────────────

export const SEG_WALLS: Seg[] = [
  // Auto-dérivés de WALL_DEFS (tous les segments de kind 'wall')
  ...WALL_DEFS
    .filter(d => (d.segKind ?? 'wall') === 'wall')
    .map(wallSeg),

  // ── Segments manuels ───────────────────────────────────────────────────────

  // Coin de niche : connecteur horizontal entre A1 (xc=-W/2) et A2a (xc=-NICHE_DEPTH-W/2)
  [-W / 2, NICHE_Z_START, -NICHE_DEPTH - W / 2, NICHE_Z_START],

  // Mur C (nord) — panneaux de WallC, non inclus dans WALL_DEFS
  [0,         0, GLASS_START, 0],
  [GLASS_END, 0, ROOM_W,      0],

  // Mur diagonal bâtiment
  [DIAG_AX,       DIAG_AZ,       DIAG_DOOR_S.x, DIAG_DOOR_S.z],
  [DIAG_DOOR_E.x, DIAG_DOOR_E.z, DIAG_CX,       DIAG_CZ      ],
];

// ── SEG_DOORS ─────────────────────────────────────────────────────────────────

export const SEG_DOORS: Seg[] = [
  // Auto-dérivés de WALL_DEFS (segments de kind 'door', skip3d ou non)
  ...WALL_DEFS
    .filter(d => d.segKind === 'door')
    .map(wallSeg),

  // ── Segments manuels ───────────────────────────────────────────────────────

  // Placard couloir (partition schématique)
  [DOOR_START, ROOM_D + 10, DOOR_START, KITCHEN_Z],
  // PC-SDB (porte couloir → salle de bain)
  [60, SDB_Z_END, DOOR_START, SDB_Z_END],
  // P3 — porte d'entrée diagonale
  [DIAG_DOOR_S.x, DIAG_DOOR_S.z, DIAG_DOOR_E.x, DIAG_DOOR_E.z],
];

// ── SEG_WINDOWS ───────────────────────────────────────────────────────────────

export const SEG_WINDOWS: Seg[] = [
  [GLASS_START,  0,          GLASS_END,    0],   // baie vitrée (mur C)
  [-NICHE_DEPTH, SDB_Z_END,  60,           SDB_Z_END], // vitrage douche
];
