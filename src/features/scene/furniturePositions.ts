/**
 * furniturePositions.ts — Définitions centralisées des positions et orientations
 * pour les meubles mobiles/multipositions manipulés via le HoverMenu.
 * Partagé entre le rendu 3D (Placements), les obstacles (furnitureObstacles)
 * et le système de SmartObjects (smartObjectRegistry / agentInstructionCoords).
 */

import { ROOM_W } from '@config';

export interface FurnitureTransform {
  x: number;
  z: number;
  ry: number;
}

export const DESK1_POSITIONS: readonly FurnitureTransform[] = [
  { x: 73.5, z: 18,   ry: 0           },
  { x: 22,   z: 74.5, ry: Math.PI / 2 },
  { x: 40,   z: 60,   ry: Math.PI     },
];

export const DESK2_POSITIONS: readonly FurnitureTransform[] = [
  { x: 200, z: 170, ry: Math.PI     },
  { x: 85,  z: 151, ry: Math.PI / 2 },
];

export const SMORKULL_POSITIONS: readonly FurnitureTransform[] = [
  { x: 85,  z: 272, ry: Math.PI / 2  }, // entre le lit Ouest et le Mackapar
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
  { label: 'Centré',    west: { x: ROOM_W / 2 - 83 / 2, z: 190 }, east: { x: ROOM_W / 2 + 83 / 2, z: 190 } },
  { label: 'Mur Ouest', west: { x: 74, z: 151.5 },               east: { x: 74 + 83, z: 151.5 } },
  { label: 'Mur Est',   west: { x: (ROOM_W - 4 - 83 / 2) - 83, z: 190 }, east: { x: ROOM_W - 4 - 83 / 2, z: 190 } },
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
