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
  ROOM_W, ROOM_D,
  NICHE_X, NICHE_Z_START,
  DOOR_START, DOOR_END,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z,
  BATH_Z_END,
  DiagWall,
} from '@config';
import {
  pEast, pWest,
  WALL_THICKNESS, PARTITION_THICKNESS,
  CORR_WALL_X,
} from './wallData';

export type Seg = [number, number, number, number]; // x1, z1, x2, z2

// ── Points remarquables ──────────────────────────────────────────────────────
const EXT_WEST_X = NICHE_X - WALL_THICKNESS; // X=-20 : face extérieure continue mur Ouest
const EXT_EAST_X = ROOM_W + WALL_THICKNESS;  // X=326 : face extérieure mur Est
const EXT_NORTH_Z = -30;                     // Z=-30 : face extérieure mur Nord (béton 20cm)

// DiagWall faces
const DIAG_EXT_START = DiagWall.p(0, 5);
const DIAG_EXT_DOOR_S = DiagWall.p(DiagWall.door.start, 5);
const DIAG_EXT_DOOR_E = DiagWall.p(DiagWall.door.end, 5);
const DIAG_EXT_END = DiagWall.p(DiagWall.len, 5);

const DIAG_INT_START = DiagWall.p(0, -5);
const DIAG_INT_DOOR_S = DiagWall.p(DiagWall.door.start, -5);
const DIAG_INT_DOOR_E = DiagWall.p(DiagWall.door.end, -5);
const DIAG_INT_END = DiagWall.p(DiagWall.len, -5);

// ── SEG_WALLS (2 faces par mur/cloison) ────────────────────────────────────────

export const SEG_WALLS: Seg[] = [
  // ── 1. ENVELOPPE EXTÉRIEURE DU BÂTIMENT ─────────────────────────────────────
  // Mur Ouest extérieur (continu du coin Nord-Ouest à l'angle Sud Diagonale)
  [EXT_WEST_X, EXT_NORTH_Z, EXT_WEST_X, DIAG_EXT_END.z],

  // Mur Nord extérieur (panneau béton ouest, de X=-20 à la baie vitrée X=95)
  [EXT_WEST_X, EXT_NORTH_Z, pEast('glass-west'), EXT_NORTH_Z],

  // Mur Nord extérieur (panneau béton est, de la baie vitrée X=260 à X=326)
  [pWest('glass-east'), EXT_NORTH_Z, EXT_EAST_X, EXT_NORTH_Z],

  // Mur Est extérieur (du jardin Z=-220 jusqu'à l'angle Sud Diagonale Z=542)
  [EXT_EAST_X, -220, EXT_EAST_X, DiagWall.A.z],

  // Mur diagonal extérieur (segment 1 avant porte, segment 2 après porte)
  [DIAG_EXT_START.x, DIAG_EXT_START.z, DIAG_EXT_DOOR_S.x, DIAG_EXT_DOOR_S.z],
  [DIAG_EXT_DOOR_E.x, DIAG_EXT_DOOR_E.z, DIAG_EXT_END.x, DIAG_EXT_END.z],

  // Fermeture extérieure angle Est avec mur diagonal
  [EXT_EAST_X, DiagWall.A.z, DIAG_EXT_START.x, DIAG_EXT_START.z],
  // Fermeture extérieure angle Ouest avec mur diagonal
  [EXT_WEST_X, DIAG_EXT_END.z, DIAG_EXT_END.x, DIAG_EXT_END.z],

  // ── 2. BAIE VITRÉE : RETOURS DE MAÇONNERIE (TABLEAUX) ──────────────────────
  [pEast('glass-west'), EXT_NORTH_Z, pEast('glass-west'), 0],
  [pWest('glass-east'), EXT_NORTH_Z, pWest('glass-east'), 0],

  // ── 3. PANNEAUX NORD INTÉRIEURS (PLACO) & MARCHE BÉTON JARDIN ───────────────
  // Marche / décrochement béton côté jardin (sans dépasser vers le haut !)
  [-10, EXT_NORTH_Z, -10, -10],
  [-10, -10, pEast('glass-west'), -10],
  [pWest('glass-east'), -10, ROOM_W, -10],
  [ROOM_W, -10, ROOM_W, 0],

  // Face intérieure séjour Mur Nord (placo)
  [0, 0, pEast('glass-west'), 0],
  [pWest('glass-east'), 0, ROOM_W, 0],

  // ── 4. SÉJOUR : FACES INTÉRIEURES ───────────────────────────────────────────
  // Mur Est intérieur
  [ROOM_W, 0, ROOM_W, ROOM_D],

  // Mur Ouest intérieur (avant niche)
  [0, 0, 0, NICHE_Z_START],
  // Décrochement niche (retour horizontal)
  [0, NICHE_Z_START, NICHE_X, NICHE_Z_START],
  // Mur Ouest fond de niche
  [NICHE_X, NICHE_Z_START, NICHE_X, ROOM_D],

  // Face Nord de la cloison de séparation Séjour / Cuisine-Couloir (Z=400)
  [NICHE_X, ROOM_D, DOOR_START, ROOM_D],
  [DOOR_END, ROOM_D, ROOM_W, ROOM_D],

  // ── 5. PORTE DU SÉJOUR : ENCADREMENTS ───────────────────────────────────────
  [DOOR_START, ROOM_D, DOOR_START, ROOM_D + PARTITION_THICKNESS],
  [DOOR_END, ROOM_D, DOOR_END, ROOM_D + PARTITION_THICKNESS],

  // ── 6. CLOISONS CUISINE & COULOIR ──────────────────────────────────────────
  // Face Sud de la cloison de séparation Séjour (Z=ROOM_D + PARTITION_THICKNESS)
  [NICHE_X, ROOM_D + PARTITION_THICKNESS, KITCHEN_X0 - PARTITION_THICKNESS, ROOM_D + PARTITION_THICKNESS],
  [KITCHEN_X1 + PARTITION_THICKNESS, ROOM_D + PARTITION_THICKNESS, DOOR_START, ROOM_D + PARTITION_THICKNESS],
  [DOOR_END, ROOM_D + PARTITION_THICKNESS, ROOM_W, ROOM_D + PARTITION_THICKNESS],

  // Cloison Ouest cuisine (épaisseur 7.2)
  [KITCHEN_X0, ROOM_D + PARTITION_THICKNESS, KITCHEN_X0, KITCHEN_Z],
  [KITCHEN_X0 - PARTITION_THICKNESS, ROOM_D + PARTITION_THICKNESS, KITCHEN_X0 - PARTITION_THICKNESS, KITCHEN_Z],

  // Cloison Est cuisine (épaisseur 7.2)
  [KITCHEN_X1, ROOM_D + PARTITION_THICKNESS, KITCHEN_X1, KITCHEN_Z],
  [KITCHEN_X1 + PARTITION_THICKNESS, ROOM_D + PARTITION_THICKNESS, KITCHEN_X1 + PARTITION_THICKNESS, KITCHEN_Z],

  // Fond cuisine / Cloison Nord SDB (Z=KITCHEN_Z et Z=KITCHEN_Z + PARTITION_THICKNESS)
  [KITCHEN_X0, KITCHEN_Z, KITCHEN_X1, KITCHEN_Z],
  [NICHE_X, KITCHEN_Z + PARTITION_THICKNESS, CORR_WALL_X - PARTITION_THICKNESS / 2, KITCHEN_Z + PARTITION_THICKNESS],

  // ── 7. CLOISON COULOIR / SDB (X=195.6, épaisseur 7.2) ──────────────────────
  // Face couloir (Est)
  [CORR_WALL_X + PARTITION_THICKNESS / 2, KITCHEN_Z, CORR_WALL_X + PARTITION_THICKNESS / 2, 513.4],
  [CORR_WALL_X + PARTITION_THICKNESS / 2, 606.6, CORR_WALL_X + PARTITION_THICKNESS / 2, BATH_Z_END],

  // Face SDB (Ouest)
  [CORR_WALL_X - PARTITION_THICKNESS / 2, KITCHEN_Z + PARTITION_THICKNESS, CORR_WALL_X - PARTITION_THICKNESS / 2, 513.4],
  [CORR_WALL_X - PARTITION_THICKNESS / 2, 606.6, CORR_WALL_X - PARTITION_THICKNESS / 2, BATH_Z_END],

  // Encadrements porte SDB
  [CORR_WALL_X - PARTITION_THICKNESS / 2, 513.4, CORR_WALL_X + PARTITION_THICKNESS / 2, 513.4],
  [CORR_WALL_X - PARTITION_THICKNESS / 2, 606.6, CORR_WALL_X + PARTITION_THICKNESS / 2, 606.6],

  // Mur Est du couloir (face intérieure)
  [ROOM_W, ROOM_D + PARTITION_THICKNESS, ROOM_W, DiagWall.A.z],

  // ── 8. SALLE DE BAIN, DOUCHE & WC ──────────────────────────────────────────
  // Mur Ouest intérieur SDB / WC
  [NICHE_X, ROOM_D + PARTITION_THICKNESS, NICHE_X, DIAG_INT_END.z],

  // Cloison Douche
  [65, BATH_Z_END, 65, BATH_Z_END + 70],
  [NICHE_X, BATH_Z_END + 70, 65, BATH_Z_END + 70],

  // ── 9. MUR DIAGONAL INTÉRIEUR & PORTE D'ENTRÉE ──────────────────────────────
  // Segment Est avant porte
  [DIAG_INT_START.x, DIAG_INT_START.z, DIAG_INT_DOOR_S.x, DIAG_INT_DOOR_S.z],
  // Segment Ouest après porte
  [DIAG_INT_DOOR_E.x, DIAG_INT_DOOR_E.z, DIAG_INT_END.x, DIAG_INT_END.z],

  // Encadrements porte d'entrée diagonale
  [DIAG_INT_DOOR_S.x, DIAG_INT_DOOR_S.z, DIAG_EXT_DOOR_S.x, DIAG_EXT_DOOR_S.z],
  [DIAG_INT_DOOR_E.x, DIAG_INT_DOOR_E.z, DIAG_EXT_DOOR_E.x, DIAG_EXT_DOOR_E.z],

  // Jonctions intérieures angles Diagonale
  [ROOM_W, DiagWall.A.z, DIAG_INT_START.x, DIAG_INT_START.z],
  [NICHE_X, DIAG_INT_END.z, DIAG_INT_END.x, DIAG_INT_END.z],
];

// ── SEG_DOORS ─────────────────────────────────────────────────────────────────

export const SEG_DOORS: Seg[] = [
  // Porte séjour (Z=400)
  [DOOR_START, ROOM_D, DOOR_END, ROOM_D],
  // Placard couloir (partition schématique)
  [DOOR_START, ROOM_D + PARTITION_THICKNESS, DOOR_START, KITCHEN_Z],
  // PC-SDB (porte couloir → salle de bain)
  [CORR_WALL_X, 513.4, CORR_WALL_X, 606.6],
  // P3 — porte d'entrée diagonale
  [DIAG_INT_DOOR_S.x, DIAG_INT_DOOR_S.z, DIAG_INT_DOOR_E.x, DIAG_INT_DOOR_E.z],
];

// ── SEG_WINDOWS ───────────────────────────────────────────────────────────────

export const SEG_WINDOWS: Seg[] = [
  [pEast('glass-west'), 0, pWest('glass-east'), 0], // baie vitrée (mur C)
  [NICHE_X, BATH_Z_END, 60, BATH_Z_END],            // vitrage douche
];
