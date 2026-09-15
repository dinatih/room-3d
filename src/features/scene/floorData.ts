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
  pEast, pWest, pNorth, pSouth, pX,
  WALL_THICKNESS, PARTITION_THICKNESS,
  CORR_WALL_X,
} from './wallData';

export type Seg = [number, number, number, number]; // x1, z1, x2, z2

// ── Points remarquables ──────────────────────────────────────────────────────
const EXT_WEST_X = NICHE_X - WALL_THICKNESS; // X=-20 : face extérieure continue mur Ouest
const EXT_EAST_X = ROOM_W + WALL_THICKNESS;  // X=326 : face extérieure mur Est
const EXT_NORTH_Z = -30;                     // Z=-30 : face extérieure mur Nord (béton 20cm)

// DiagWall faces (off=0 est la face intérieure de la diagonale, off=10 est la face extérieure)
const DIAG_EXT_START  = DiagWall.p(0, WALL_THICKNESS);
const DIAG_EXT_DOOR_S = DiagWall.p(DiagWall.door.start, WALL_THICKNESS);
const DIAG_EXT_DOOR_E = DiagWall.p(DiagWall.door.end, WALL_THICKNESS);
const DIAG_EXT_END    = DiagWall.p(DiagWall.len, WALL_THICKNESS);

const DIAG_INT_START  = DiagWall.p(0, 0);
const DIAG_INT_DOOR_S = DiagWall.p(DiagWall.door.start, 0);
const DIAG_INT_DOOR_E = DiagWall.p(DiagWall.door.end, 0);
const DIAG_INT_END    = DiagWall.p(DiagWall.len, 0);

const SH_HALF = PARTITION_THICKNESS / 2; // 3.6 cm
const CORR_W_X = CORR_WALL_X - SH_HALF;   // 192.0 cm (face Ouest / SDB de la cloison couloir)

// ── 1. MURS BÉTON / PORTEURS (Structure extérieure) ─────────────────────────
export const SEG_CONCRETE_WALLS: Seg[] = [
  // ── Mur Ouest béton (épaisseur 10cm, X in [-20, -10]) ─────────────────────
  // Face extérieure continue
  [EXT_WEST_X, EXT_NORTH_Z, EXT_WEST_X, DIAG_EXT_END.z],
  // Face intérieure béton continue
  [NICHE_X, EXT_NORTH_Z, NICHE_X, DIAG_INT_END.z],
  // About Nord (fermeture angle Nord-Ouest)
  [EXT_WEST_X, EXT_NORTH_Z, NICHE_X, EXT_NORTH_Z],

  // ── Mur Nord béton (panneau ouest, épaisseur 20cm, Z in [-30, -10]) ───────
  // Face Nord extérieure
  [EXT_WEST_X, EXT_NORTH_Z, pEast('glass-west'), EXT_NORTH_Z],
  // Face Sud côté jardin
  [NICHE_X, -10, pEast('glass-west'), -10],
  // Tableau ouest baie vitrée
  [pEast('glass-west'), EXT_NORTH_Z, pEast('glass-west'), 0],

  // ── Mur Nord béton (panneau est, épaisseur 20cm, Z in [-30, -10]) ─────────
  // Face Nord extérieure
  [pWest('glass-east'), EXT_NORTH_Z, EXT_EAST_X, EXT_NORTH_Z],
  // Face Sud côté jardin / placo
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
  // Face extérieure
  [DIAG_EXT_START.x, DIAG_EXT_START.z, DIAG_EXT_DOOR_S.x, DIAG_EXT_DOOR_S.z],
  [DIAG_EXT_DOOR_E.x, DIAG_EXT_DOOR_E.z, DIAG_EXT_END.x, DIAG_EXT_END.z],
  // Face intérieure
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
  // Retour placo à la niche (Z=280)
  [0, NICHE_Z_START, NICHE_X, NICHE_Z_START],
  // Retour placo au Nord (Z=0)
  [0, 0, NICHE_X, 0],

  // ── Doublage placo séjour Mur Nord (Z=0) ──────────────────────────────────
  [0, 0, pEast('glass-west'), 0],
  [pWest('glass-east'), 0, ROOM_W, 0],
  // Retour placo Est à Z=0
  [ROOM_W, -10, ROOM_W, 0],

  // ── Mur Sud de séparation Séjour (Z=400, épaisseur 7.2) ───────────────────
  // Face Nord (séjour)
  [NICHE_X, ROOM_D, KITCHEN_X0 - PARTITION_THICKNESS, ROOM_D],
  [KITCHEN_X1 + PARTITION_THICKNESS, ROOM_D, DOOR_START, ROOM_D],
  [DOOR_END, ROOM_D, ROOM_W, ROOM_D],
  // Face Sud couloir droit
  [DOOR_END, ROOM_D + PARTITION_THICKNESS, ROOM_W, ROOM_D + PARTITION_THICKNESS],
  // Encadrements de porte séjour
  [DOOR_START, ROOM_D, DOOR_START, ROOM_D + PARTITION_THICKNESS],
  [DOOR_END, ROOM_D, DOOR_END, ROOM_D + PARTITION_THICKNESS],

  // ── Gaine technique à gauche de la cuisine (caisson fermé 4 côtés) ────────
  // Face Nord
  [NICHE_X, ROOM_D + PARTITION_THICKNESS, KITCHEN_X0 - PARTITION_THICKNESS, ROOM_D + PARTITION_THICKNESS],
  // Face Est (cloison ouest cuisine extérieure)
  [KITCHEN_X0 - PARTITION_THICKNESS, ROOM_D + PARTITION_THICKNESS, KITCHEN_X0 - PARTITION_THICKNESS, KITCHEN_Z],
  // Face Sud (cloison nord SDB extérieure)
  [NICHE_X, KITCHEN_Z, KITCHEN_X0 - PARTITION_THICKNESS, KITCHEN_Z],
  // Face Ouest (interface avec mur porteur)
  [NICHE_X, ROOM_D + PARTITION_THICKNESS, NICHE_X, KITCHEN_Z],

  // ── Cloisons Cuisine (épaisseur 7.2cm) ─────────────────────────────────────
  // Cloison Ouest (face intérieure cuisine)
  [KITCHEN_X0, ROOM_D, KITCHEN_X0, KITCHEN_Z],
  // Nez de cloison Ouest séjour
  [KITCHEN_X0 - PARTITION_THICKNESS, ROOM_D, KITCHEN_X0, ROOM_D],
  // Cloison Est (face intérieure cuisine)
  [KITCHEN_X1, ROOM_D, KITCHEN_X1, KITCHEN_Z],
  // Nez de cloison Est séjour
  [KITCHEN_X1, ROOM_D, KITCHEN_X1 + PARTITION_THICKNESS, ROOM_D],
  // Fond de cuisine (face intérieure cuisine)
  [KITCHEN_X0, KITCHEN_Z, KITCHEN_X1, KITCHEN_Z],

  // ── Placard Couloir (caisson fermé 4 côtés avec porte) ────────────────────
  // Face Nord (séparateur séjour)
  [KITCHEN_X1 + PARTITION_THICKNESS, ROOM_D + PARTITION_THICKNESS, DOOR_START, ROOM_D + PARTITION_THICKNESS],
  // Face Ouest (cloison est cuisine extérieure)
  [KITCHEN_X1 + PARTITION_THICKNESS, ROOM_D + PARTITION_THICKNESS, KITCHEN_X1 + PARTITION_THICKNESS, KITCHEN_Z],
  // Face Sud / Fond du placard (séparation SDB à Z=460)
  [KITCHEN_X1 + PARTITION_THICKNESS, KITCHEN_Z, DOOR_START, KITCHEN_Z],
  // Raccord jambage porte placard vers cloison couloir
  [CORR_W_X, KITCHEN_Z, DOOR_START, KITCHEN_Z],
  [DOOR_START, KITCHEN_Z, DOOR_START, KITCHEN_Z + PARTITION_THICKNESS],

  // ── Cloison Nord SDB (Z=467.2, épaisseur 7.2cm) ───────────────────────────
  // Face SDB continue sous la gaine, la cuisine et le placard
  [NICHE_X, KITCHEN_Z + PARTITION_THICKNESS, CORR_W_X, KITCHEN_Z + PARTITION_THICKNESS],

  // ── Cloison Couloir / SDB (épaisseur 7.2cm, indexée sur piliers) ──────────
  // Face couloir (Est)
  [pEast('bath-ne'), pSouth('bath-ne'), pEast('bath-ne'), pNorth('door-bath-n')],
  [pEast('door-bath-s'), pSouth('door-bath-s'), pEast('bath-se'), pNorth('bath-se')],
  // Face SDB (Ouest)
  [pWest('bath-ne'), pSouth('bath-ne'), pWest('bath-ne'), pNorth('door-bath-n')],
  [pWest('door-bath-s'), pSouth('door-bath-s'), pWest('bath-se'), pNorth('bath-se')],
  // Encadrements porte SDB
  [pWest('door-bath-n'), pNorth('door-bath-n'), pEast('door-bath-n'), pNorth('door-bath-n')],
  [pWest('door-bath-s'), pSouth('door-bath-s'), pEast('door-bath-s'), pSouth('door-bath-s')],

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
  // Porte placard couloir (en façade Est à X=200)
  [DOOR_START, ROOM_D + PARTITION_THICKNESS, DOOR_START, KITCHEN_Z],
  // PC-SDB (porte couloir → salle de bain)
  [pX('door-bath-n'), pNorth('door-bath-n'), pX('door-bath-s'), pSouth('door-bath-s')],
  // Porte placard SDB (double porte coulissante en façade Sud à Z=BATH_Z_END)
  [pEast('shower-ne'), BATH_Z_END, pWest('bath-se'), BATH_Z_END],
  // P3 — porte d'entrée diagonale
  [DIAG_INT_DOOR_S.x, DIAG_INT_DOOR_S.z, DIAG_INT_DOOR_E.x, DIAG_INT_DOOR_E.z],
];

// ── SEG_WINDOWS ───────────────────────────────────────────────────────────────
export const SEG_WINDOWS: Seg[] = [
  [pEast('glass-west'), 0, pWest('glass-east'), 0],       // baie vitrée (mur C)
  [NICHE_X, BATH_Z_END, 65 - SH_HALF, BATH_Z_END],        // vitrage douche
];
