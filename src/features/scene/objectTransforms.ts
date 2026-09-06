/**
 * objectTransforms.ts — Registre centralisé des transforms (position + rotation Y)
 * pour les objets 3D de la scène (statiques ou dynamiques).
 * Permet aux SmartObjects de se lier directement à un objet 3D / item d'inventaire
 * sans avoir à hardcoder leur position monde.
 */

import {
  BATH_Z_END, DOOR_START,
  NICHE_X,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z,
  ROOM_D,
} from '@config';
import { PARTITION_THICKNESS } from './wallData';
import { positionState } from './positionState';
import { DYNAMIC_FURNITURE_ANCHORS, FurnitureTransform } from './furniturePositions';

export interface ObjectTransform {
  position: [number, number, number];
  rotationY: number;
}

/**
 * Mapping des alias d'itemId vers leur anchorKey dynamique si applicable
 */
const ITEM_TO_ANCHOR_KEY: Record<string, string> = {
  'desk-bollsidan-1': 'desk1-position',
  'desk1': 'desk1-position',
  'desk-bollsidan-2': 'desk2-position',
  'desk2': 'desk2-position',
  'chair-office': 'smorkull-position',
  'smorkull': 'smorkull-position',
  'airperformer': 'airperformer-position',
  'bed-double': 'bed-position',
  'bed-west': 'bed-west-position',
  'bed-east': 'bed-east-position',
};

/**
 * Positions statiques des objets 3D fidèles à Placements.tsx
 */
function getStaticObjectTransform(itemId: string): ObjectTransform | undefined {
  switch (itemId) {
    case 'sdb-closet':
      // Placements.tsx: <group position={[130.3, 0, BATH_Z_END]} ...><SdbCloset .../>
      return {
        position: [130.3, 0, BATH_Z_END],
        rotationY: 0,
      };

    case 'corridor-closet':
      // Placements.tsx: <group position={[(KITCHEN_X1 + DOOR_START) / 2, 0, (ROOM_D + PARTITION_THICKNESS + KITCHEN_Z) / 2]} ...>
      return {
        position: [
          (KITCHEN_X1 + DOOR_START) / 2,
          0,
          (ROOM_D + PARTITION_THICKNESS + KITCHEN_Z) / 2,
        ],
        rotationY: 0,
      };

    case 'toilet':
      // Placements.tsx: <group position={[NICHE_X + 60, 0, KITCHEN_Z + PARTITION_THICKNESS + 36.5]} ...>
      return {
        position: [NICHE_X + 60, 0, KITCHEN_Z + PARTITION_THICKNESS + 36.5],
        rotationY: 0,
      };

    case 'vasque-sdb':
      // Placements.tsx: <group position={[DOOR_START - 84, 14, KITCHEN_Z + PARTITION_THICKNESS + 24.5]} ...>
      return {
        position: [DOOR_START - 84, 0, KITCHEN_Z + PARTITION_THICKNESS + 24.5],
        rotationY: 0,
      };

    case 'shower':
      // Placements.tsx: <group position={[NICHE_X + 35, 0, KITCHEN_Z + PARTITION_THICKNESS + 140 + PARTITION_THICKNESS / 2 + 35]} ...>
      return {
        position: [
          NICHE_X + 35,
          0,
          KITCHEN_Z + PARTITION_THICKNESS + 140 + PARTITION_THICKNESS / 2 + 35,
        ],
        rotationY: 0,
      };

    case 'cuisine-group':
      // Placements.tsx: <group position={[KITCHEN_X0, 0, ROOM_D]} ...>
      return {
        position: [KITCHEN_X0, 0, ROOM_D],
        rotationY: 0,
      };

    default:
      return undefined;
  }
}

/**
 * Récupère le transform d'un objet dynamique depuis positionState et DYNAMIC_FURNITURE_ANCHORS
 */
function getDynamicTransform(anchorKey: string): ObjectTransform | undefined {
  const anchorList = DYNAMIC_FURNITURE_ANCHORS[anchorKey];
  if (!anchorList || anchorList.length === 0) return undefined;

  const state = positionState[anchorKey];
  const idx = state ? (state.idx % anchorList.length) : 0;
  const anchor: FurnitureTransform = anchorList[idx] || anchorList[0];

  return {
    position: [anchor.x, 0, anchor.z],
    rotationY: anchor.ry,
  };
}

/**
 * Récupère le transform (position monde + rotation Ry) d'un objet 3D.
 * Gère de manière transparente les objets statiques et les objets dynamiques multipositions.
 */
export function getObjectTransform(itemId: string): ObjectTransform | undefined {
  // 1. Vérifie si l'item correspond à un meuble dynamique dans positionState
  const dynamicKey = ITEM_TO_ANCHOR_KEY[itemId];
  if (dynamicKey && DYNAMIC_FURNITURE_ANCHORS[dynamicKey]) {
    const dyn = getDynamicTransform(dynamicKey);
    if (dyn) return dyn;
  }

  // 2. Vérifie les objets statiques
  return getStaticObjectTransform(itemId);
}
