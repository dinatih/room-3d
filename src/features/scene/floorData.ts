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

const SH_HALF = PARTITION_THICKNESS / 2; // 3.6 cm

// ── 1. MURS BÉTON / PORTEURS (Structure extérieure) ─────────────────────────
export const SEG_CONCRETE_WALLS: Seg[] = [
  // ── Mur Ouest béton (épaisseur 10cm, X in [-20, -10]) ─────────────────────
  // Face extérieure
  [EXT_WEST_X, EXT_NORTH_Z, EXT_WEST_X, DIAG_EXT_END.z],
  // Face intérieure béton
  [NICHE_X, EXT_NORTH_Z, NICHE_X, DIAG_INT_END.z],
  // Fermeture / about Nord
  [EXT_WEST_X, EXT_NORTH_Z, NICHE_X, EXT_NORTH_Z],

  // ── Mur Nord béton (panneau ouest, épaisseur 20cm, Z in [-30, -10]) ───────
  // Face Nord (extérieure)
  [EXT_WEST_X, EXT_NORTH_Z, pEast('glass-west'), EXT_NORTH_Z],
  // Face Sud (côté jardin)
  [NICHE_X, -10, pEast('glass-west'), -10],
  // Tableau ouest baie vitrée
  [pEast('glass-west'), EXT_NORTH_Z, pEast('glass-west'), 0],

  // ── Mur Nord béton (panneau est, épaisseur 20cm, Z in [-30, -10]) ─────────
  // Face Nord (extérieure)
  [pWest('glass-east'), EXT_NORTH_Z, EXT_EAST_X, EXT_NORTH_Z],
  // Face Sud (côté jardin/placo)
  [pWest('glass-east'), -10, ROOM_W, -10],
  // Tableau est baie vitrée
  [pWest('glass-east'), EXT_NORTH_Z, pWest('glass-east'), 0],

  // ── Mur Est béton (épaisseur 10cm, X in [316, 326]) ───────────────────────
  // Face extérieure (du fond du jardin Z=-220 à la diagonale Z=542)
  [EXT_EAST_X, -220, EXT_EAST_X, DiagWall.A.z],
  // Face intérieure jardin (du fond du jardin Z=-220 au mur C Z=0)
  [ROOM_W, -220, ROOM_W, 0],
  // Face intérieure séjour & couloir (de Z=0 à la diagonale Z=542)
  [ROOM_W, 0, ROOM_W, DiagWall.A.z],
  // About Nord au fond du jardin
  [ROOM_W, -220, EXT_EAST_X, -220],

  // ── Mur diagonal bâtiment (structure extérieure) ─────────────────────────
  // Face extérieure (segment 1 avant porte, segment 2 après porte)
  [DIAG_EXT_START.x, DIAG_EXT_START.z, DIAG_EXT_DOOR_S.x, DIAG_EXT_DOOR_S.z],
  [DIAG_EXT_DOOR_E.x, DIAG_EXT_DOOR_E.z, DIAG_EXT_END.x, DIAG_EXT_END.z],
  // Face intérieure (segment 1 avant porte, segment 2 après porte)
  [DIAG_INT_START.x, DIAG_INT_START.z, DIAG_INT_DOOR_S.x, DIAG_INT_DOOR_S.z],
  [DIAG_INT_DOOR_E.x, DIAG_INT_DOOR_E.z, DIAG_INT_END.x, DIAG_INT_END.z],
  // Encadrements porte d'entrée
  [DIAG_INT_DOOR_S.x, DIAG_INT_DOOR_S.z, DIAG_EXT_DOOR_S.x, DIAG_EXT_DOOR_S.z],
  [DIAG_INT_DOOR_E.x, DIAG_INT_DOOR_E.z, DIAG_EXT_DOOR_E.x, DIAG_EXT_DOOR_E.z],
  // Jonctions d'angles diagonale
  [EXT_EAST_X, DiagWall.A.z, DIAG_EXT_START.x, DIAG_EXT_START.z],
  [ROOM_W, DiagWall.A.z, DIAG_INT_START.x, DIAG_INT_START.z],
  [EXT_WEST_X, DIAG_EXT_END.z, DIAG_EXT_END.x, DIAG_EXT_END.z],
  [NICHE_X, DIAG_INT_END.z, DIAG_INT_END.x, DIAG_INT_END.z],
];

// ── 2. CLOISONS & DOUBLAGES PLACO (Compartimentage intérieur) ────────────────
export const SEG_PARTITIONS: Seg[] = [
  // ── Doublage placo séjour Mur Ouest (épaisseur 10cm, X in [-10, 0]) ───────
  // Face intérieure séjour (s'arrête à la niche à Z=280)
  [0, 0, 0, NICHE_Z_START],
  // Retour placo à la niche
  [0, NICHE_Z_START, NICHE_X, NICHE_Z_START],
  // Retour placo au Nord
  [0, 0, NICHE_X, 0],

  // ── Doublage placo séjour Mur Nord (Z=0) ──────────────────────────────────
  [0, 0, pEast('glass-west'), 0],
  [pWest('glass-east'), 0, ROOM_W, 0],
  // Retour placo Est à Z=0
  [ROOM_W, -10, ROOM_W, 0],

  // ── Cloison de séparation Séjour / Cuisine-Couloir (Z=400, épaisseur 7.2) ──
  // À gauche de la cuisine
  [NICHE_X, ROOM_D, KITCHEN_X0 - PARTITION_THICKNESS, ROOM_D],
  [NICHE_X, ROOM_D + PARTITION_THICKNESS, KITCHEN_X0 - PARTITION_THICKNESS, ROOM_D + PARTITION_THICKNESS],
  // Entre cuisine et porte séjour
  [KITCHEN_X1 + PARTITION_THICKNESS, ROOM_D, DOOR_START, ROOM_D],
  [KITCHEN_X1 + PARTITION_THICKNESS, ROOM_D + PARTITION_THICKNESS, DOOR_START, ROOM_D + PARTITION_THICKNESS],
  // À droite de la porte séjour
  [DOOR_END, ROOM_D, ROOM_W, ROOM_D],
  [DOOR_END, ROOM_D + PARTITION_THICKNESS, ROOM_W, ROOM_D + PARTITION_THICKNESS],
  // Encadrements de porte séjour
  [DOOR_START, ROOM_D, DOOR_START, ROOM_D + PARTITION_THICKNESS],
  [DOOR_END, ROOM_D, DOOR_END, ROOM_D + PARTITION_THICKNESS],

  // ── Cloisons Cuisine (épaisseur 7.2cm) ─────────────────────────────────────
  // Cloison Ouest
  [KITCHEN_X0, ROOM_D, KITCHEN_X0, KITCHEN_Z],
  [KITCHEN_X0 - PARTITION_THICKNESS, ROOM_D, KITCHEN_X0 - PARTITION_THICKNESS, KITCHEN_Z],
  [KITCHEN_X0 - PARTITION_THICKNESS, ROOM_D, KITCHEN_X0, ROOM_D],
  // Cloison Est
  [KITCHEN_X1, ROOM_D, KITCHEN_X1, KITCHEN_Z],
  [KITCHEN_X1 + PARTITION_THICKNESS, ROOM_D, KITCHEN_X1 + PARTITION_THICKNESS, KITCHEN_Z],
  [KITCHEN_X1, ROOM_D, KITCHEN_X1 + PARTITION_THICKNESS, ROOM_D],
  // Fond cuisine (Z=460) & cloison Nord SDB (Z=467.2)
  [KITCHEN_X0 - PARTITION_THICKNESS, KITCHEN_Z, KITCHEN_X1 + PARTITION_THICKNESS, KITCHEN_Z],
  [NICHE_X, KITCHEN_Z + PARTITION_THICKNESS, CORR_WALL_X - SH_HALF, KITCHEN_Z + PARTITION_THICKNESS],
  [CORR_WALL_X - SH_HALF, KITCHEN_Z, CORR_WALL_X - SH_HALF, KITCHEN_Z + PARTITION_THICKNESS],

  // ── Cloison Couloir / SDB (X=195.6, épaisseur 7.2cm) ──────────────────────
  // Face couloir (Est)
  [CORR_WALL_X + SH_HALF, KITCHEN_Z, CORR_WALL_X + SH_HALF, 513.4],
  [CORR_WALL_X + SH_HALF, 606.6, CORR_WALL_X + SH_HALF, BATH_Z_END],
  // Face SDB (Ouest)
  [CORR_WALL_X - SH_HALF, KITCHEN_Z + PARTITION_THICKNESS, CORR_WALL_X - SH_HALF, 513.4],
  [CORR_WALL_X - SH_HALF, 606.6, CORR_WALL_X - SH_HALF, BATH_Z_END],
  // Encadrements porte SDB
  [CORR_WALL_X - SH_HALF, 513.4, CORR_WALL_X + SH_HALF, 513.4],
  [CORR_WALL_X - SH_HALF, 606.6, CORR_WALL_X + SH_HALF, 606.6],

  // ── Cloisons Douche (2 faces complètes, épaisseur 7.2cm) ───────────────────
  // Cloison verticale Est (axe X=65)
  [65 - SH_HALF, BATH_Z_END, 65 - SH_HALF, 680 - SH_HALF], // face intérieure douche
  [65 + SH_HALF, BATH_Z_END, 65 + SH_HALF, 680 + SH_HALF], // face extérieure SDB
  [65 - SH_HALF, BATH_Z_END, 65 + SH_HALF, BATH_Z_END],    // nez de cloison au Nord
  // Cloison horizontale Sud (axe Z=680)
  [NICHE_X, 680 - SH_HALF, 65 - SH_HALF, 680 - SH_HALF],   // face intérieure douche
  [NICHE_X, 680 + SH_HALF, 65 + SH_HALF, 680 + SH_HALF],   // face Sud vers WC/diag
];

// ── SEG_WALLS (tous les segments combinés) ────────────────────────────────────
export const SEG_WALLS: Seg[] = [
  ...SEG_CONCRETE_WALLS,
  ...SEG_PARTITIONS,
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
  [pEast('glass-west'), 0, pWest('glass-east'), 0],       // baie vitrée (mur C)
  [NICHE_X, BATH_Z_END, 65 - SH_HALF, BATH_Z_END],        // vitrage douche
];
