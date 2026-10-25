/**
 * floorData.ts — segments 2D pour minimap et plan.
 *
 * Les contours des murs sont projetés depuis WALL_DEFS, utilisés par Walls.tsx.
 * Les piliers sont dessinés depuis PILLAR_DEFS par floorDraw.ts.
 */
import {
  pEast, pWest, pNorth, pSouth, pZ,
  WALL_DEFS, DIAG_WALL_DEFS, wallPlanSegments,
  SEG_DIAG_ENTRY_DOOR,
  DiagWall,
} from './wallData';

export type Seg = [number, number, number, number]; // x1, z1, x2, z2

// Les ouvertures et les linteaux ne ferment pas les passages sur le plan.
const wallsAtFloor = WALL_DEFS.filter(d => d.segKind !== 'door' && (d.yBase ?? 0) === 0);
export const SEG_CONCRETE_WALLS: Seg[] = [
  ...wallsAtFloor.filter(d => d.construction === 'concrete').flatMap(wallPlanSegments),
  ...DIAG_WALL_DEFS.flatMap(({ d1, d2 }) => [0, DiagWall.depth].map(offset => {
    const a = DiagWall.p(d1, offset), b = DiagWall.p(d2, offset);
    return [a.x, a.z, b.x, b.z] as Seg;
  })),
];
export const SEG_PARTITIONS: Seg[] = wallsAtFloor.filter(d => d.construction === 'partition').flatMap(wallPlanSegments);

// ── SEG_DOORS (portes battantes principales) ─────────────────────────────────
export const SEG_DOORS: Seg[] = [
  // Porte séjour
  [pEast('door-living-w'), pNorth('door-living-w'), pWest('door-living-e'), pNorth('door-living-e')],
  // PC-SDB (porte couloir → salle de bain, alignée à droite côté couloir)
  [pEast('door-bath-n'), pSouth('door-bath-n'), pEast('door-bath-s'), pNorth('door-bath-s')],
  // P3 — porte d'entrée diagonale
  SEG_DIAG_ENTRY_DOOR,
];

// ── SEG_CLOSETS (portes de placards / rangements, en gris clair plus discret) ─
export const SEG_CLOSETS: Seg[] = [
  // Porte placard couloir
  [pEast('door-living-w'), pSouth('door-living-w'), pEast('door-living-w'), pNorth('bath-ne')],
  // Porte placard SDB (double porte coulissante centrée dans l'axe de la poutre/piliers)
  [pEast('shower-ne'), pZ('shower-ne'), pWest('bath-se'), pZ('bath-se')],
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
  color?: string;
  fillColor?: string;
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
    color: '#94a3b8',
    fillColor: 'rgba(148, 163, 184, 0.08)',
  },
  // 3. Porte SDB (PC-SDB) — pivot côté Sud (face interne door-bath-s), s'ouvre vers l'intérieur SDB (Ouest)
  {
    pivot: { x: pEast('door-bath-s'), z: pNorth('door-bath-s') },
    radius: pNorth('door-bath-s') - pSouth('door-bath-n'),
    startAngle: Math.PI * 1.5,
    endAngle: Math.PI,
    anticlockwise: true,
  },
  // 4. Porte d'entrée diagonale (P3) — pivot côté Est/haut (dDoor.start), s'ouvre vers l'intérieur (couloir)
  // Ouverte à 120° (Math.PI * 1.5) pour être strictement parallèle au mur Est vertical (X=ROOM_W)
  (() => {
    const p1 = DiagWall.p(DiagWall.door.start, 0);
    const p2 = DiagWall.p(DiagWall.door.end, 0);
    const startAngle = Math.atan2(p2.z - p1.z, p2.x - p1.x);
    return {
      pivot: p1,
      radius: DiagWall.door.end - DiagWall.door.start,
      startAngle,
      endAngle: Math.PI * 1.5,
      anticlockwise: false,
    };
  })(),
  // 5. Porte de douche — pivot à 20cm du mur Ouest (shower-nw), s'ouvre vers la SDB (Nord)
  {
    pivot: { x: pEast('shower-nw') + 20, z: pNorth('shower-ne') + 3 },
    radius: pWest('shower-ne') - (pEast('shower-nw') + 20),
    startAngle: 0,
    endAngle: Math.PI * 1.5,
    anticlockwise: true,
    color: '#3b82f6',
    fillColor: 'rgba(59, 130, 246, 0.05)',
  },
  // 6. Porte-fenêtre double vitrée (battant Ouest) — pivot Ouest, s'ouvre vers le séjour (Sud)
  {
    pivot: { x: pEast('glass-west'), z: pSouth('glass-west') },
    radius: (pWest('glass-east') - pEast('glass-west')) / 2,
    startAngle: 0,
    endAngle: Math.PI / 2,
    anticlockwise: false,
    color: '#3b82f6',
    fillColor: 'rgba(59, 130, 246, 0.05)',
  },
  // 7. Porte-fenêtre double vitrée (battant Est) — pivot Est, s'ouvre vers le séjour (Sud)
  {
    pivot: { x: pWest('glass-east'), z: pSouth('glass-east') },
    radius: (pWest('glass-east') - pEast('glass-west')) / 2,
    startAngle: Math.PI,
    endAngle: Math.PI / 2,
    anticlockwise: true,
    color: '#3b82f6',
    fillColor: 'rgba(59, 130, 246, 0.05)',
  },
];

