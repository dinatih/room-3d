/**
 * floorData.ts — segments 2D pour minimap et plan.
 *
 * Tous les segments axiaux et encadrements sont indexés sur le système de piliers
 * (PILLAR_DEFS / helpers pEast, pWest, pNorth, pSouth, pX, pZ de wallData.ts)
 * comme source unique de vérité géométrique, éliminant les constantes redondantes.
 */
import {
  pEast, pWest, pNorth, pSouth, pZ,
  SEG_DIAG_CONCRETE_WALLS,
  SEG_DIAG_ENTRY_DOOR,
  DIAG_EXT_Z_END,
  CORNER_NE_APEX,
  DiagWall,
} from './wallData';

export type Seg = [number, number, number, number]; // x1, z1, x2, z2

// ── 1. MURS BÉTON / PORTEURS (Structure extérieure) ─────────────────────────
export const SEG_CONCRETE_WALLS: Seg[] = [
  // ── Mur Ouest béton (corner-nw-ext / corner-nw) ───────────────────────────
  // Face extérieure continue
  [pWest('corner-nw-ext'), pNorth('corner-nw-ext'), pWest('corner-nw-ext'), DIAG_EXT_Z_END],
  // Face intérieure béton continue
  [pEast('corner-nw-ext'), pSouth('corner-nw-ext'), pEast('corner-nw-ext'), pSouth('diag-sw')],
  // ── Mur Nord béton (panneau ouest & est, baie vitrée) ─────────────────────
  // Face extérieure continue nord à Z=-30 (du coin ouest au coin est via seuil baie vitrée)
  [pWest('corner-nw-ext'), pNorth('corner-nw-ext'), pEast('corner-ne-ext'), pNorth('corner-nw-ext')],
  // Face intérieure béton ouest à Z=-10 (mur porteur 20cm de profondeur)
  [pWest('corner-nw-ext'), pSouth('corner-nw-ext'), pEast('glass-west-ext'), pSouth('corner-nw-ext')],
  // Face intérieure béton est à Z=-10 (mur porteur 20cm de profondeur)
  [pWest('glass-east-ext'), pSouth('corner-ne-ext'), pEast('corner-ne-ext'), pSouth('corner-ne-ext')],
  // Tableaux baie vitrée (de la façade extérieure Z=-30 au nu intérieur Z=0)
  [pEast('glass-west'), pNorth('corner-nw-ext'), pEast('glass-west'), pSouth('glass-west')],
  [pWest('glass-east'), pNorth('corner-ne-ext'), pWest('glass-east'), pSouth('glass-east')],

  // ── Mur Est béton (garden-e, corner-ne, diag-ne) ──────────────────────────
  // Face extérieure (du fond du jardin à la diagonale via l'apex)
  [pEast('garden-e'), pSouth('garden-e'), CORNER_NE_APEX.x, CORNER_NE_APEX.z],
  // Face intérieure jardin (du fond du jardin au mur C)
  [pWest('garden-e'), pSouth('garden-e'), pWest('corner-ne'), pSouth('corner-ne-ext')],
  // Face intérieure séjour & couloir (du mur C à la diagonale)
  [pWest('corner-ne'), pSouth('corner-ne'), pWest('diag-ne'), pSouth('diag-ne')],
  // About Nord au fond du jardin
  [pWest('garden-e'), pSouth('garden-e'), pEast('garden-e'), pSouth('garden-e')],

  // ── Mur diagonal bâtiment (centralisé dans wallData.ts) ───────────────────
  ...SEG_DIAG_CONCRETE_WALLS,
];

// ── 2. CLOISONS & DOUBLAGES PLACO (Compartimentage intérieur) ────────────────
export const SEG_PARTITIONS: Seg[] = [
  // ── Doublage placo séjour Mur Ouest (corner-nw -> niche-beam) ─────────────
  // Face intérieure séjour (s'arrête à la niche)
  [pEast('corner-nw'), pSouth('corner-nw'), pEast('niche-beam'), pZ('niche-beam')],
  // Retour placo à la niche
  [pEast('niche-beam'), pZ('niche-beam'), pWest('niche-beam'), pZ('niche-beam')],
  // Retour placo au Nord
  [pEast('corner-nw'), pSouth('corner-nw'), pWest('corner-nw'), pSouth('corner-nw')],

  // ── Doublage placo séjour Mur Nord ────────────────────────────────────────
  [pEast('corner-nw'), pSouth('corner-nw'), pEast('glass-west'), pSouth('glass-west')],
  [pWest('glass-east'), pSouth('glass-east'), pWest('corner-ne'), pSouth('corner-ne')],
  // Retour placo Est à Z=0
  [pWest('corner-ne'), pSouth('corner-ne-ext'), pWest('corner-ne'), pSouth('corner-ne')],

  // ── Mur Sud de séparation Séjour (corner-sw -> corner-se) ─────────────────
  // Face Nord (séjour)
  [pEast('corner-sw'), pNorth('corner-sw'), pWest('kitchen-sw'), pNorth('kitchen-sw')],
  [pEast('kitchen-se'), pNorth('kitchen-se'), pEast('door-living-w'), pNorth('door-living-w')],
  [pWest('door-living-e'), pNorth('door-living-e'), pWest('corner-se'), pNorth('corner-se')],
  // Face Sud couloir droit
  [pWest('door-living-e'), pSouth('door-living-e'), pWest('corner-se'), pSouth('corner-se')],
  // Encadrements de porte séjour
  [pEast('door-living-w'), pNorth('door-living-w'), pEast('door-living-w'), pSouth('door-living-w')],
  [pWest('door-living-e'), pNorth('door-living-e'), pWest('door-living-e'), pSouth('door-living-e')],

  // ── Gaine technique à gauche de la cuisine (corner-sw -> kitchen-nw) ──────
  // Face Nord
  [pEast('corner-sw'), pSouth('corner-sw'), pWest('kitchen-sw'), pSouth('kitchen-sw')],
  // Face Est (cloison ouest cuisine extérieure)
  [pWest('kitchen-sw'), pSouth('kitchen-sw'), pWest('kitchen-nw'), pNorth('kitchen-nw')],
  // Face Sud (cloison nord SDB extérieure)
  [pEast('corner-sw'), pNorth('kitchen-nw'), pWest('kitchen-nw'), pNorth('kitchen-nw')],
  // Face Ouest (interface avec mur porteur)
  [pEast('corner-sw'), pSouth('corner-sw'), pEast('corner-sw'), pNorth('kitchen-nw')],

  // ── Cloisons Cuisine (kitchen-sw / se / nw / ne) ──────────────────────────
  // Cloison Ouest (face intérieure cuisine)
  [pEast('kitchen-sw'), pNorth('kitchen-sw'), pEast('kitchen-nw'), pNorth('kitchen-nw')],
  // Nez de cloison Ouest séjour
  [pWest('kitchen-sw'), pNorth('kitchen-sw'), pEast('kitchen-sw'), pNorth('kitchen-sw')],
  // Cloison Est (face intérieure cuisine)
  [pWest('kitchen-se'), pNorth('kitchen-se'), pWest('kitchen-ne'), pNorth('kitchen-ne')],
  // Nez de cloison Est séjour
  [pWest('kitchen-se'), pNorth('kitchen-se'), pEast('kitchen-se'), pNorth('kitchen-se')],
  // Fond de cuisine (face intérieure cuisine)
  [pEast('kitchen-nw'), pNorth('kitchen-nw'), pWest('kitchen-ne'), pNorth('kitchen-ne')],

  // ── Placard Couloir (kitchen-se / ne -> door-living-w / bath-ne) ──────────
  // Face Nord (séparateur séjour)
  [pEast('kitchen-se'), pSouth('kitchen-se'), pEast('door-living-w'), pSouth('door-living-w')],
  // Face Ouest (cloison est cuisine extérieure)
  [pEast('kitchen-se'), pSouth('kitchen-se'), pEast('kitchen-ne'), pNorth('kitchen-ne')],
  // Face Sud / Fond du placard
  [pEast('kitchen-ne'), pNorth('kitchen-ne'), pEast('door-living-w'), pNorth('bath-ne')],
  // Raccord jambage porte placard vers cloison couloir
  [pWest('bath-ne'), pNorth('bath-ne'), pEast('door-living-w'), pNorth('bath-ne')],
  [pEast('door-living-w'), pNorth('bath-ne'), pEast('door-living-w'), pSouth('bath-ne')],

  // ── Cloison Nord SDB (face continue sous gaine, cuisine et placard) ───────
  [pEast('corner-sw'), pSouth('bath-nw'), pWest('bath-ne'), pSouth('bath-ne')],

  // ── Cloison Couloir / SDB (bath-ne -> bath-se via door-bath-n / s) ────────
  // Face couloir (Est)
  [pEast('bath-ne'), pSouth('bath-ne'), pEast('bath-ne'), pNorth('door-bath-n')],
  [pEast('door-bath-s'), pSouth('door-bath-s'), pEast('bath-se'), pNorth('bath-se')],
  // Face SDB (Ouest)
  [pWest('bath-ne'), pSouth('bath-ne'), pWest('bath-ne'), pNorth('door-bath-n')],
  [pWest('door-bath-s'), pSouth('door-bath-s'), pWest('bath-se'), pNorth('bath-se')],
  // Encadrements porte SDB
  [pWest('door-bath-n'), pNorth('door-bath-n'), pEast('door-bath-n'), pNorth('door-bath-n')],
  [pWest('door-bath-s'), pSouth('door-bath-s'), pEast('door-bath-s'), pSouth('door-bath-s')],

  // ── Cloisons Douche (shower-nw / ne / sw / se) ────────────────────────────
  // Cloison verticale Est
  [pWest('shower-ne'), pNorth('shower-ne'), pWest('shower-se'), pSouth('shower-se')], // face intérieure douche
  [pEast('shower-ne'), pNorth('shower-ne'), pEast('shower-se'), pSouth('shower-se')], // face extérieure SDB
  [pWest('shower-ne'), pNorth('shower-ne'), pEast('shower-ne'), pNorth('shower-ne')], // nez de cloison au Nord
  // Cloison horizontale Sud
  [pEast('shower-sw'), pNorth('shower-sw'), pWest('shower-se'), pNorth('shower-se')], // face intérieure douche
  [pEast('shower-sw'), pSouth('shower-sw'), pEast('shower-se'), pSouth('shower-se')], // face Sud vers WC/diag
];

// ── SEG_WALLS (tous les segments combinés) ────────────────────────────────────
export const SEG_WALLS: Seg[] = [
  ...SEG_CONCRETE_WALLS,
  ...SEG_PARTITIONS,
];

// ── SEG_DOORS ─────────────────────────────────────────────────────────────────
export const SEG_DOORS: Seg[] = [
  // Porte séjour
  [pEast('door-living-w'), pNorth('door-living-w'), pWest('door-living-e'), pNorth('door-living-e')],
  // Porte placard couloir
  [pEast('door-living-w'), pSouth('door-living-w'), pEast('door-living-w'), pNorth('bath-ne')],
  // PC-SDB (porte couloir → salle de bain, alignée à droite côté couloir)
  [pEast('door-bath-n'), pNorth('door-bath-n'), pEast('door-bath-s'), pSouth('door-bath-s')],
  // Porte placard SDB (double porte coulissante en façade Sud)
  [pEast('shower-ne'), pNorth('shower-ne'), pWest('bath-se'), pNorth('bath-se')],
  // P3 — porte d'entrée diagonale
  SEG_DIAG_ENTRY_DOOR,
];

// ── SEG_WINDOWS ───────────────────────────────────────────────────────────────
export const SEG_WINDOWS: Seg[] = [
  // Baie vitrée (mur C)
  [pEast('glass-west'), pSouth('glass-west'), pWest('glass-east'), pSouth('glass-east')],
  // Vitrage douche
  [pEast('shower-nw'), pNorth('shower-ne'), pWest('shower-ne'), pNorth('shower-ne')],
];

// ── DÉBATTEMENT DES PORTES À BATTANT (DOOR_SWINGS) ───────────────────────────
// Définit le pivot, le rayon et l'arc de rotation (quart de cercle) pour chaque
// porte à battant. Exclut le placard SDB qui est une double porte coulissante.
export type DoorSwingDef = {
  pivot: { x: number; z: number };
  radius: number;
  startAngle: number;
  endAngle: number;
  anticlockwise: boolean;
};

export const DOOR_SWINGS: DoorSwingDef[] = [
  // 1. Porte séjour — pivot côté Est (door-living-e), s'ouvre vers le séjour (Nord)
  {
    pivot: { x: pWest('door-living-e'), z: pNorth('door-living-e') },
    radius: pWest('door-living-e') - pEast('door-living-w'),
    startAngle: Math.PI,
    endAngle: Math.PI * 1.5,
    anticlockwise: false,
  },
  // 2. Porte placard couloir — pivot côté Nord (door-living-w), s'ouvre vers le couloir (Est)
  {
    pivot: { x: pEast('door-living-w'), z: pSouth('door-living-w') },
    radius: pNorth('bath-ne') - pSouth('door-living-w'),
    startAngle: Math.PI / 2,
    endAngle: 0,
    anticlockwise: true,
  },
  // 3. Porte SDB (PC-SDB) — pivot côté Sud (door-bath-s), s'ouvre vers l'intérieur SDB (Ouest)
  {
    pivot: { x: pEast('door-bath-s'), z: pSouth('door-bath-s') },
    radius: pSouth('door-bath-s') - pNorth('door-bath-n'),
    startAngle: Math.PI * 1.5,
    endAngle: Math.PI,
    anticlockwise: true,
  },
  // 4. Porte d'entrée diagonale (P3) — pivot côté Est/haut (dDoor.start), s'ouvre vers l'intérieur (couloir)
  (() => {
    const p1 = DiagWall.p(DiagWall.door.start, 0);
    const p2 = DiagWall.p(DiagWall.door.end, 0);
    const startAngle = Math.atan2(p2.z - p1.z, p2.x - p1.x);
    return {
      pivot: p1,
      radius: DiagWall.door.end - DiagWall.door.start,
      startAngle,
      endAngle: startAngle + Math.PI / 2,
      anticlockwise: false,
    };
  })(),
];

