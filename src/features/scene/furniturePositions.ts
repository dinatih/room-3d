/**
 * furniturePositions.ts — Définitions centralisées des positions et orientations
 * pour les meubles mobiles/multipositions manipulés via le HoverMenu.
 * Partagé entre le rendu 3D (Placements), les obstacles (furnitureObstacles)
 * et le système de SmartObjects (smartObjectRegistry / agentInstructionCoords).
 */

import { ROOM_D, ROOM_W, FURNITURE_WALL_CLEARANCE } from './wallData';

export interface FurnitureTransform {
  x: number;
  z: number;
  ry: number;
}

/** Positions réellement affichées, y compris pendant les transitions animées. */
export const movingFurniture = new Set<string>();
export const currentFurnitureTransforms: Record<string, FurnitureTransform> = {};

// Configuration lit double au mur Ouest : plateaux Bollsidan 68 × 36 cm,
// dos au mur Est, avec 3 cm de dégagement pour les plinthes au sol.
// Le bureau 2 touche le congélateur sous le Kallax SE
// (centre à ROOM_D - 60 - 40.5 / 2 - dégagement Sud ; profondeur : 47.37 cm).
const DESK_WIDTH = 68;
const DESK_DEPTH = 36;
const EAST_DESK_X = ROOM_W - FURNITURE_WALL_CLEARANCE - DESK_DEPTH / 2;
const FREEZER_NORTH_Z = ROOM_D - 60 - 40.5 / 2 - FURNITURE_WALL_CLEARANCE - 47.37 / 2;
const EAST_DESK2_Z = FREEZER_NORTH_Z - DESK_WIDTH / 2;

export const DESK1_POSITIONS: readonly FurnitureTransform[] = [
  { x: 73.5, z: 18,   ry: 0           },
  { x: EAST_DESK_X, z: EAST_DESK2_Z - DESK_WIDTH, ry: -Math.PI / 2 },
  { x: 40,   z: 60,   ry: Math.PI     },
];

export const DESK2_POSITIONS: readonly FurnitureTransform[] = [
  { x: 240, z: 270, ry: Math.PI     },
  { x: EAST_DESK_X, z: EAST_DESK2_Z, ry: -Math.PI / 2 },
  { x: 240, z: 120, ry: Math.PI     },
  { x: 73.5, z: 18, ry: Math.PI     },
];

export const SMORKULL_POSITIONS: readonly FurnitureTransform[] = [
  { x: 96,  z: 314, ry: Math.PI / 2  }, // entre le lit Ouest et le Mackapar
  { x: 150, z: 100, ry: Math.PI      },
  { x: 150, z: 300, ry: Math.PI      },
  { x: 240, z: 38,  ry: -Math.PI / 2 }, // devant KallaxNE
];

export const AIRPERFORMER_POSITIONS: readonly FurnitureTransform[] = [
  { x: 261, z: 65.5, ry: 0 },
  { x: 200, z: 100,  ry: 0 },
];

export interface DoubleBedConfig {
  label: string;
  west: { x: number; z: number };
  east: { x: number; z: number };
}

export const DOUBLE_BED_POSITIONS: readonly DoubleBedConfig[] = [
  { label: 'Mur Ouest', west: { x: 74, z: 170 },               east: { x: 157, z: 170 } },
  { label: 'Mur Est',   west: { x: ROOM_W - 128.5, z: 190 },     east: { x: ROOM_W - 45.5, z: 190 } },
  { label: 'Centré',    west: { x: ROOM_W / 2 - 41.5, z: 190 }, east: { x: ROOM_W / 2 + 41.5, z: 190 } },
];

// Positions du lit Ouest (Utåker frame Ouest / 'bed-west')
export const BED_WEST_POSITIONS: readonly FurnitureTransform[] = DOUBLE_BED_POSITIONS.map(p => ({
  x: p.west.x,
  z: p.west.z,
  ry: Math.PI / 2,
}));

// Positions du lit Est (Utåker frame Est / 'bed-east')
export const BED_EAST_POSITIONS: readonly FurnitureTransform[] = DOUBLE_BED_POSITIONS.map(p => ({
  x: p.east.x,
  z: p.east.z,
  ry: Math.PI / 2,
}));

// Centre global du lit double (Utåker double / 'bed-double')
export const BED_DOUBLE_CENTER_POSITIONS: readonly FurnitureTransform[] = DOUBLE_BED_POSITIONS.map(p => ({
  x: (p.west.x + p.east.x) / 2,
  z: (p.west.z + p.east.z) / 2,
  ry: Math.PI / 2,
}));

export const DYNAMIC_FURNITURE_ANCHORS: Record<string, readonly FurnitureTransform[]> = {
  'desk1-position': DESK1_POSITIONS,
  'desk2-position': DESK2_POSITIONS,
  'smorkull-position': SMORKULL_POSITIONS,
  'airperformer-position': AIRPERFORMER_POSITIONS,
  'bed-position': BED_DOUBLE_CENTER_POSITIONS,
  'bed-west-position': BED_WEST_POSITIONS,
  'bed-east-position': BED_EAST_POSITIONS,
};
