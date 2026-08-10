/**
 * wallData.ts — source unique de vérité pour tous les segments de mur axiaux.
 * wallDefToBoxGeo() permet de convertir un WallDef en BoxGeometry Three.js.
 *
 * PILLAR_DEFS est la source primaire pour les jonctions structurelles.
 * WALL_DEFS décrit surtout les pans entre arêtes de piliers, plus les ouvertures.
 *
 * Building.tsx consomme WALL_DEFS pour le rendu 3D (WZ / WX).
 * floorData.ts en dérive automatiquement SEG_WALLS / SEG_DOORS / SEG_WINDOWS.
 *
 * Conventions :
 *  - axe Z (WZ) : xc = centre du mur (horizontal), z1/z2 = étendue
 *  - axe X (WX) : x1/x2 = étendue, zc = centre du mur (vertical)
 *  - segKind 'none'  → 3D seulement (linteaux, paroi arrière niche…)
 *  - segKind 'door'  → 2D seulement (ouverture schématique sur le plan)
 */
import * as THREE from 'three';
import {
  ROOM_W, ROOM_D, WALL_H,
  NICHE_X, NICHE_Z_START,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z,
  DOOR_START, DOOR_END, DOOR_H,
  BATH_Z_END,
  DiagWall,
} from '@config';

export const WALL_THICKNESS      = 10; // standard wall thickness (cm)
export const PARTITION_THICKNESS = 7.2; // internal partition thickness (cm)
const GLASS_START = 100;  // début baie vitrée mur C (aligné à 95cm + 5cm latte)
const GLASS_END   = 260; // fin baie vitrée mur C (aligné à 316 - 51cm - 5cm latte)
const GLASS_TOP_Y = 225; // hauteur du linteau de baie vitrée

export const CORR_WALL_X = 192 + PARTITION_THICKNESS / 2; // centre du mur couloir gauche (SDB = 202cm interior depuis X=-10)

// pDiag est maintenant centralisé dans DiagWall.p(d, off)

export type WallMat  = 'west' | 'east' | 'north' | 'default';
export type SegKind  = 'wall' | 'door' | 'window';

export type WallDef = {
  segKind?: SegKind | 'none'; // défaut 'wall'
  mat?:     WallMat;          // défaut 'default'
  h?:       number;           // défaut WALL_H
  yBase?:   number;           // défaut 0
  t?:       number;           // épaisseur (défaut WALL_THICKNESS)
} & (
  | { axis: 'z'; xc: number; z1: number; z2: number }
  | { axis: 'x'; x1: number; x2: number; zc: number }
);

/** Segment 2D au centre de la paroi. */
export function wallSeg(d: WallDef): [number, number, number, number] {
  return d.axis === 'z'
    ? [d.xc, d.z1, d.xc, d.z2]
    : [d.x1, d.zc, d.x2, d.zc];
}

/** BoxGeometry Three.js centrée sur la paroi décrite par un WallDef. */
export function wallDefToBoxGeo(d: WallDef): THREE.BufferGeometry {
  const h     = d.h     ?? WALL_H;
  const yBase = d.yBase ?? 0;
  let g: THREE.BufferGeometry;
  const t = d.t ?? WALL_THICKNESS;
  if (d.axis === 'z') {
    g = new THREE.BoxGeometry(t, h, d.z2 - d.z1);
    g.translate(d.xc, yBase + h / 2, (d.z1 + d.z2) / 2);
  } else {
    g = new THREE.BoxGeometry(d.x2 - d.x1, h, t);
    g.translate((d.x1 + d.x2) / 2, yBase + h / 2, d.zc);
  }
  return g;
}

// ── Piliers box ───────────────────────────────────────────────────────────────
export type PillarDef = { id: string; x: number; z: number; w?: number; d?: number; rot?: number };

export const PILLAR_DEFS = [
  // ── Coin Nord-Ouest (Béton 20cm + Placo 10cm) ──────────────────────────────
  { id: 'corner-nw',     x: -5,                     z: -5 },
  { id: 'corner-nw-ext', x: -15,                    z: -20,           d: 20 },
  { id: 'glass-west',    x: GLASS_START - WALL_THICKNESS / 2,    z: -5 },
  { id: 'glass-west-ext', x: GLASS_START - WALL_THICKNESS / 2,   z: -20,           d: 20 },

  // ── Coin Nord-Est (Béton 20cm + Placo 10cm) ────────────────────────────────
  { id: 'corner-ne',     x: ROOM_W + WALL_THICKNESS / 2,         z: -5 },
  { id: 'corner-ne-ext', x: ROOM_W + WALL_THICKNESS / 2,         z: -20,           d: 20 },
  { id: 'glass-east',    x: GLASS_END + WALL_THICKNESS / 2,      z: -5 },
  { id: 'glass-east-ext', x: GLASS_END + WALL_THICKNESS / 2,     z: -20,           d: 20 },

  // ── Séjour & Niche ─────────────────────────────────────────────────────────
  { id: 'corner-sw',     x: NICHE_X - WALL_THICKNESS / 2,        z: ROOM_D + PARTITION_THICKNESS / 2, w: WALL_THICKNESS, d: PARTITION_THICKNESS },
  { id: 'niche-beam',    x: -5,                     z: NICHE_Z_START },
  { id: 'corner-se',     x: ROOM_W + WALL_THICKNESS / 2,          z: ROOM_D + PARTITION_THICKNESS / 2, w: WALL_THICKNESS, d: PARTITION_THICKNESS },

  // ── Cuisine ────────────────────────────────────────────────────────────────
  { id: 'kitchen-sw',    x: KITCHEN_X0 - PARTITION_THICKNESS / 2,    z: ROOM_D + PARTITION_THICKNESS / 2,        w: PARTITION_THICKNESS, d: PARTITION_THICKNESS },
  { id: 'kitchen-se',    x: KITCHEN_X1 + PARTITION_THICKNESS / 2,    z: ROOM_D + PARTITION_THICKNESS / 2,        w: PARTITION_THICKNESS, d: PARTITION_THICKNESS },
  { id: 'kitchen-nw',    x: KITCHEN_X0 - PARTITION_THICKNESS / 2,    z: KITCHEN_Z + PARTITION_THICKNESS / 2,    w: PARTITION_THICKNESS, d: PARTITION_THICKNESS },
  { id: 'kitchen-ne',    x: KITCHEN_X1 + PARTITION_THICKNESS / 2,    z: KITCHEN_Z + PARTITION_THICKNESS / 2,    w: PARTITION_THICKNESS, d: PARTITION_THICKNESS },

  // ── Salle de Bain & Douche ────────────────────────────────────────────────
  { id: 'bath-nw',       x: NICHE_X - WALL_THICKNESS / 2,        z: KITCHEN_Z + PARTITION_THICKNESS / 2,    w: WALL_THICKNESS,  d: PARTITION_THICKNESS },
  { id: 'bath-ne',       x: CORR_WALL_X,            z: KITCHEN_Z + PARTITION_THICKNESS / 2,    w: PARTITION_THICKNESS, d: PARTITION_THICKNESS },
  { id: 'bath-se',       x: CORR_WALL_X,            z: BATH_Z_END + PARTITION_THICKNESS / 2, w: PARTITION_THICKNESS, d: PARTITION_THICKNESS },
  { id: 'shower-nw',     x: NICHE_X - WALL_THICKNESS / 2,        z: KITCHEN_Z + PARTITION_THICKNESS + 140 + PARTITION_THICKNESS / 2, w: WALL_THICKNESS,  d: PARTITION_THICKNESS },
  { id: 'shower-ne',     x: 65,                     z: KITCHEN_Z + PARTITION_THICKNESS + 140 + PARTITION_THICKNESS / 2, w: PARTITION_THICKNESS, d: PARTITION_THICKNESS },
  { id: 'shower-sw',     x: NICHE_X - WALL_THICKNESS / 2,        z: KITCHEN_Z + PARTITION_THICKNESS + 140 + PARTITION_THICKNESS / 2 + 70, w: WALL_THICKNESS,  d: PARTITION_THICKNESS },
  { id: 'shower-se',     x: 65,                     z: KITCHEN_Z + PARTITION_THICKNESS + 140 + PARTITION_THICKNESS / 2 + 70, w: PARTITION_THICKNESS, d: PARTITION_THICKNESS },

  // ── Extrémités mur diagonal (BoxGeometry) ──────────────────────────────────
  { id: 'diag-ne',       x: ROOM_W + WALL_THICKNESS / 2,          z: DiagWall.A.z - WALL_THICKNESS / 2 },
  { id: 'diag-sw',       x: NICHE_X - WALL_THICKNESS / 2,        z: DiagWall.C.z - 5 },
  { id: 'diag-ne-end',
    ...DiagWall.p(WALL_THICKNESS / 2, DiagWall.depth / 2),
    d: DiagWall.depth, rot: DiagWall.rotY },
  { id: 'diag-sw-end',
    ...DiagWall.p(DiagWall.len - WALL_THICKNESS / 2, DiagWall.depth / 2),
    d: DiagWall.depth, rot: DiagWall.rotY },

  // ── Extérieurs & Jardin ────────────────────────────────────────────────────
  { id: 'garden-e',      x: ROOM_W + WALL_THICKNESS / 2,           z: -220 - WALL_THICKNESS / 2 },

  // ── Jambes de portes (10×10) ───────────────────────────────────────────────
  { id: 'door-living-w', x: DOOR_START - PARTITION_THICKNESS / 2, z: ROOM_D + PARTITION_THICKNESS / 2, w: PARTITION_THICKNESS, d: PARTITION_THICKNESS },
  { id: 'door-living-e', x: DOOR_END   + PARTITION_THICKNESS / 2, z: ROOM_D + PARTITION_THICKNESS / 2, w: PARTITION_THICKNESS, d: PARTITION_THICKNESS },
  { id: 'door-bath-n',   x: CORR_WALL_X,            z: 513.4,                 w: PARTITION_THICKNESS, d: PARTITION_THICKNESS },
  { id: 'door-bath-s',   x: CORR_WALL_X,            z: 606.6,                 w: PARTITION_THICKNESS, d: PARTITION_THICKNESS },
  { id: 'door-entry-w',
    ...DiagWall.p(DiagWall.door.end + WALL_THICKNESS / 2, DiagWall.depth / 2),
    rot: DiagWall.rotY },
] as const satisfies readonly PillarDef[];

// Panneaux bois occultants jardin (côté est, devant pilier garden-e).
// Consommés par Building.tsx (rendu 3D) et floorDraw.ts (rendu 2D minimap/plan).
export type GardenPanelDef = { cx: number; cy: number; cz: number; w: number; h: number; d: number };
export const GARDEN_PANEL_DEFS: readonly GardenPanelDef[] = Array.from({ length: 6 }).map((_, i) => ({
  cx: ROOM_W + 5,
  cy: 95,
  cz: -220 - WALL_THICKNESS - i * 30 - 15,
  w: 10,
  h: 190,
  d: 30,
}));

export type PillarId = typeof PILLAR_DEFS[number]['id'];
const PILLAR_BY_ID = new Map(PILLAR_DEFS.map(p => [p.id, p] as const));

function pillar(id: PillarId) {
  const def = PILLAR_BY_ID.get(id);
  if (!def) throw new Error(`Unknown pillar id: ${id}`);
  return def;
}

export const pX = (id: PillarId) => pillar(id).x;
export const pZ = (id: PillarId) => pillar(id).z;
export const pW = (id: PillarId) => {
  const p = pillar(id) as any;
  return p.w ?? WALL_THICKNESS;
};
export const pD = (id: PillarId) => {
  const p = pillar(id) as any;
  return p.d ?? WALL_THICKNESS;
};

export const pWest  = (id: PillarId) => pX(id) - pW(id) / 2;
export const pEast  = (id: PillarId) => pX(id) + pW(id) / 2;
export const pNorth = (id: PillarId) => pZ(id) - pD(id) / 2;
export const pSouth = (id: PillarId) => pZ(id) + pD(id) / 2;

function splitW(def: WallDef): WallDef[] {
  if (def.segKind === 'door' || def.segKind === 'none') return [def];
  const MAX_LEN = 40;
  const res: WallDef[] = [];
  if (def.axis === 'z') {
    const len = def.z2 - def.z1;
    if (len <= MAX_LEN) return [def];
    const count = Math.ceil(len / MAX_LEN);
    const step = len / count;
    for (let i = 0; i < count; i++) {
      const z1 = def.z1 + i * step - (i > 0 ? 0.1 : 0);
      const z2 = def.z1 + (i + 1) * step + (i < count - 1 ? 0.1 : 0);
      res.push({ ...def, z1, z2 });
    }
  } else {
    const len = def.x2 - def.x1;
    if (len <= MAX_LEN) return [def];
    const count = Math.ceil(len / MAX_LEN);
    const step = len / count;
    for (let i = 0; i < count; i++) {
      const x1 = def.x1 + i * step - (i > 0 ? 0.1 : 0);
      const x2 = def.x1 + (i + 1) * step + (i < count - 1 ? 0.1 : 0);
      res.push({ ...def, x1, x2 });
    }
  }
  return res;
}

export const WALL_DEFS: WallDef[] = [

  // ── MUR OUEST ──────────────────────────────────────────────────────────────
  // Ouest 1 (Extérieur/Continu) : face arrière de la niche.
  ...splitW({ axis: 'z', xc: pEast('corner-nw') - 1.5 * WALL_THICKNESS, z1: pNorth('corner-nw-ext'), z2: pNorth('corner-sw'), mat: 'west' }),
  // Ouest 2 (Intérieur) : face avant (séjour), s'arrête à la niche.
  ...splitW({ axis: 'z', xc: pEast('corner-nw') - WALL_THICKNESS / 2, z1: pSouth('corner-nw'), z2: pNorth('niche-beam'), mat: 'west' }),

  // Ouest SDB + couloir (saute les piliers) - Mur béton de 10cm (par défaut)
  ...splitW({ axis: 'z', xc: pX('corner-sw'), z1: pSouth('corner-sw'), z2: pNorth('bath-nw'), mat: 'west' }),
  ...splitW({ axis: 'z', xc: pX('corner-sw'), z1: pSouth('bath-nw'), z2: pNorth('shower-nw'), mat: 'west' }),
  ...splitW({ axis: 'z', xc: pX('corner-sw'), z1: pSouth('shower-nw'), z2: pNorth('shower-sw'), mat: 'west' }),
  ...splitW({ axis: 'z', xc: pX('corner-sw'), z1: pSouth('shower-sw'), z2: pNorth('diag-sw'), mat: 'west' }),

  // ── MUR EST ────────────────────────────────────────────────────────────────
  ...splitW({ axis: 'z', xc: pX('corner-ne'), z1: pSouth('corner-ne'), z2: pNorth('corner-se'), mat: 'east' }), // Est 1 (séjour)
  ...splitW({ axis: 'z', xc: pX('corner-ne'), z1: pSouth('garden-e'), z2: pNorth('corner-ne'), mat: 'east' }), // Est 2 (jardin / brique)
  ...splitW({ axis: 'z', xc: pX('corner-ne'), z1: pSouth('corner-se'), z2: pNorth('diag-ne'), mat: 'east' }), // Est 3 (couloir droit)

  // ── MUR SUD (Z=400) ────────────────────────────────────────────────────────
  ...splitW({ axis: 'x', x1: pEast('corner-sw'), x2: pWest('kitchen-sw'), zc: pZ('corner-sw'), t: PARTITION_THICKNESS }),
  ...splitW({ axis: 'x', x1: pEast('kitchen-se'), x2: pWest('door-living-w'), zc: pZ('corner-sw'), t: PARTITION_THICKNESS }),
  // Linteau au-dessus de la porte principale (3D seulement)
  ...splitW({ axis: 'x', x1: pEast('door-living-w'), x2: pWest('door-living-e'), zc: pZ('corner-sw'), yBase: DOOR_H, h: WALL_H - DOOR_H, segKind: 'none', t: PARTITION_THICKNESS }),
  ...splitW({ axis: 'x', x1: pEast('door-living-e'), x2: pWest('corner-se'), zc: pZ('corner-sw'), t: PARTITION_THICKNESS }),
  // Porte principale (2D uniquement)
  ...splitW({ axis: 'x', x1: pEast('door-living-w'), x2: pWest('door-living-e'), zc: ROOM_D, segKind: 'door', t: PARTITION_THICKNESS }),

  // ── Cuisine ────────────────────────────────────────────────────────────────
  ...splitW({ axis: 'z', xc: pX('kitchen-sw'), z1: pSouth('kitchen-sw'), z2: pNorth('kitchen-nw'), t: PARTITION_THICKNESS }),
  ...splitW({ axis: 'z', xc: pX('kitchen-se'), z1: pSouth('kitchen-se'), z2: pNorth('kitchen-ne'), t: PARTITION_THICKNESS }),
  // Mur nord SDB / fond cuisine (3 morceaux, saute les piliers)
  ...splitW({ axis: 'x', x1: pEast('bath-nw'), x2: pWest('kitchen-nw'), zc: pZ('bath-nw'), t: PARTITION_THICKNESS }),
  ...splitW({ axis: 'x', x1: pEast('kitchen-nw'), x2: pWest('kitchen-ne'), zc: pZ('bath-nw'), t: PARTITION_THICKNESS }),
  ...splitW({ axis: 'x', x1: pEast('kitchen-ne'), x2: pWest('bath-ne'), zc: pZ('bath-nw'), t: PARTITION_THICKNESS }),

  // ── Couloir gauche (X=185, Z=460→600) ────────────────────────────────────
  // Segment avant porte
  ...splitW({ axis: 'z', xc: pX('bath-ne'), z1: pSouth('bath-ne'), z2: pNorth('door-bath-n'), t: PARTITION_THICKNESS }),
  // Segment après porte
  ...splitW({ axis: 'z', xc: pX('bath-ne'), z1: pSouth('door-bath-s'), z2: pNorth('bath-se'), t: PARTITION_THICKNESS }),
  // Linteau au-dessus de la porte couloir (3D seulement)
  ...splitW({ axis: 'z', xc: pX('bath-ne'), z1: pNorth('door-bath-n'), z2: pNorth('door-bath-s'),
    yBase: DOOR_H, h: WALL_H - DOOR_H, segKind: 'none', t: PARTITION_THICKNESS }),
  // Porte couloir SDB (2D uniquement)
  ...splitW({ axis: 'z', xc: pX('bath-ne'), z1: pNorth('door-bath-n'), z2: pNorth('door-bath-s'), segKind: 'door', t: PARTITION_THICKNESS }),

  // ── MUR NORD (Z=0) ──────────────────────────────────────────────────────────
  // Panneau ouest intérieur (placo)
  ...splitW({ axis: 'x', x1: pEast('corner-nw'), x2: pWest('glass-west'), zc: pZ('corner-nw'), mat: 'north' }),
  // Panneau ouest extérieur (béton)
  ...splitW({ axis: 'x', x1: pEast('corner-nw-ext'), x2: pWest('glass-west-ext'), zc: pZ('corner-nw-ext'), t: 20, mat: 'north' }),

  // Panneau est intérieur (placo)
  ...splitW({ axis: 'x', x1: pEast('glass-east'), x2: pWest('corner-ne'), zc: pZ('corner-ne'), mat: 'north' }),
  // Panneau est extérieur (béton)
  ...splitW({ axis: 'x', x1: pEast('glass-east-ext'), x2: pWest('corner-ne-ext'), zc: pZ('corner-ne-ext'), t: 20, mat: 'north' }),

  // Baie vitrée — couches dissociées
  // Muret bas (Intérieur)
  ...splitW({ axis: 'x', x1: pEast('glass-west'), x2: pWest('glass-east'), zc: -5, mat: 'north', h: 25, segKind: 'none' }),
  // Muret bas (Extérieur)
  ...splitW({ axis: 'x', x1: pEast('glass-west-ext'), x2: pWest('glass-east-ext'), zc: -20, t: 20, mat: 'north', h: 25, segKind: 'none' }),
  // Linteau (Intérieur)
  ...splitW({ axis: 'x', x1: pEast('glass-west'), x2: pWest('glass-east'), zc: -5, mat: 'north', yBase: GLASS_TOP_Y, h: WALL_H - GLASS_TOP_Y, segKind: 'none' }),
  // Linteau (Extérieur)
  ...splitW({ axis: 'x', x1: pEast('glass-west-ext'), x2: pWest('glass-east-ext'), zc: -20, t: 20, mat: 'north', yBase: GLASS_TOP_Y, h: WALL_H - GLASS_TOP_Y, segKind: 'none' }),

  // ── Douche ─────────────────────────────────────────────────────────────────
  ...splitW({ axis: 'z', xc: pX('shower-ne'), z1: pSouth('shower-ne'), z2: pNorth('shower-se'), t: PARTITION_THICKNESS }),
  ...splitW({ axis: 'x', x1: pEast('shower-sw'), x2: pWest('shower-se'), zc: pZ('shower-sw'), t: PARTITION_THICKNESS }),

];
