/**
 * furniturePositions.ts — Définitions centralisées des positions et orientations
 * pour les meubles mobiles/multipositions manipulés via le HoverMenu.
 * Partagé entre le rendu 3D (Placements), les obstacles (furnitureObstacles)
 * et le système de SmartObjects (smartObjectRegistry / agentInstructionCoords).
 */

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

export const DYNAMIC_FURNITURE_ANCHORS: Record<string, readonly FurnitureTransform[]> = {
  'desk1-position': DESK1_POSITIONS,
  'desk2-position': DESK2_POSITIONS,
  'smorkull-position': SMORKULL_POSITIONS,
  'airperformer-position': AIRPERFORMER_POSITIONS,
};
