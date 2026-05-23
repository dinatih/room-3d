/**
 * floorData.ts — segments 2D pour minimap et plan.
 *
 * SEG_WALLS / SEG_DOORS sont dérivés automatiquement de WALL_DEFS (wallData.ts).
 * Les segments manuels couvrent les cas non-axiaux :
 *   - coin de niche (connecteur géométrique, non issu d'un WZ/WX)
 *   - mur diagonal + portes spéciales
 *   - fenêtres (baie vitrée, vitrage douche)
 */
import {
  NICHE_X, NICHE_Z_START,
  DOOR_START,
  BATH_Z_END,
  DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ,
  DIAG_SIN, DIAG_COS, DIAG_ENTRY_S, DIAG_ENTRY_E,
  ROOM_D, KITCHEN_Z,
} from '@config';
import { GLASS_OPENING_X1, GLASS_OPENING_X2, WALL_DEFS, wallSeg, W } from './wallData';

// Points sur le mur diagonal pour la porte d'entrée
const DIAG_DOOR_S = { x: DIAG_AX + DIAG_ENTRY_S * DIAG_SIN, z: DIAG_AZ + DIAG_ENTRY_S * DIAG_COS };
const DIAG_DOOR_E = { x: DIAG_AX + DIAG_ENTRY_E * DIAG_SIN, z: DIAG_AZ + DIAG_ENTRY_E * DIAG_COS };

export type Seg = [number, number, number, number]; // x1, z1, x2, z2

// ── SEG_WALLS ─────────────────────────────────────────────────────────────────

export const SEG_WALLS: Seg[] = [
  // Auto-dérivés de WALL_DEFS (tous les segments de kind 'wall')
  ...WALL_DEFS
    .filter(d => (d.segKind ?? 'wall') === 'wall')
    .map(wallSeg),

  // ── Segments manuels ───────────────────────────────────────────────────────

  // Coin de niche : connecteur horizontal entre Ouest 1 (xc=-W/2) et Ouest Niche (xc=NICHE_X-W/2)
  [-W / 2, NICHE_Z_START, NICHE_X - W / 2, NICHE_Z_START],

  // Mur diagonal bâtiment
  [DIAG_AX,       DIAG_AZ,       DIAG_DOOR_S.x, DIAG_DOOR_S.z],
  [DIAG_DOOR_E.x, DIAG_DOOR_E.z, DIAG_CX,       DIAG_CZ      ],
];

// ── SEG_DOORS ─────────────────────────────────────────────────────────────────

export const SEG_DOORS: Seg[] = [
  // Auto-dérivés de WALL_DEFS (segments de kind 'door')
  ...WALL_DEFS
    .filter(d => d.segKind === 'door')
    .map(wallSeg),

  // ── Segments manuels ───────────────────────────────────────────────────────

  // Placard couloir (partition schématique)
  [DOOR_START, ROOM_D + 10, DOOR_START, KITCHEN_Z],
  // PC-SDB (porte couloir → salle de bain)
  [60, BATH_Z_END, DOOR_START, BATH_Z_END],
  // P3 — porte d'entrée diagonale
  [DIAG_DOOR_S.x, DIAG_DOOR_S.z, DIAG_DOOR_E.x, DIAG_DOOR_E.z],
];

// ── SEG_WINDOWS ───────────────────────────────────────────────────────────────

export const SEG_WINDOWS: Seg[] = [
  [GLASS_OPENING_X1, 0, GLASS_OPENING_X2, 0], // baie vitrée (mur C)
  [NICHE_X, BATH_Z_END,  60,           BATH_Z_END], // vitrage douche
];
