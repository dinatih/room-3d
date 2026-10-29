/**
 * objectTransforms.ts — Registre centralisé des transforms (position + rotation Y)
 * pour les objets 3D de la scène (statiques ou dynamiques).
 * Permet aux SmartObjects de se lier directement à un objet 3D / item d'inventaire
 * sans avoir à hardcoder leur position monde.
 */

import {
  DOOR_START,
  BATH_WEST_WALL, BATH_NORTH_WALL,
  KITCHEN_WEST_WALL, KITCHEN_EAST_WALL, KITCHEN_SOUTH_WALL,
  ROOM_W, ROOM_D, PARTITION_THICKNESS, CORRIDOR_NORTH_WALL, SHOWER_SOUTH_WALL, FURNITURE_WALL_CLEARANCE
} from './wallData';
import { SDB_CLOSET_X, SDB_CLOSET_Z } from './items/SdbCloset';
import { SHOWER_W, SHOWER_D } from './items/Shower';
import { TOILET_D } from './items/Toilet';
import { FRIDGE_LOCAL_POSITION } from './items/Fridge';
import { KALLAX_NE_POSITION, KALLAX_NE_ROTATION, DRONA_CATCHALL_POSITION } from './items/kallaxNeDrona';
import { DRONA_SE_ITEMS, KALLAX_SE_DRONA_POSITIONS } from './items/kallaxSeDrona';
import { DRONA_SPECIAL_ITEMS, KALLAX_NW_POSITION, KALLAX_NW_ROTATION } from './items/dronaStorage';
import { SHOE_HAT_RACK } from './shoeHatRackData';
import { positionState } from './positionState';
import { BATHROOM_STORAGE_ITEMS } from './items/bathroomStorage';
import { KITCHEN_DRONA_ITEMS, KALLAX_CUISINE_POSITION, KALLAX_CUISINE_ROTATION, KALLAX_CUISINE_DRONA_POSITIONS } from './items/kallaxCuisineDrona';
import { DYNAMIC_FURNITURE_ANCHORS, currentFurnitureTransforms, SINGLE_BED_POSITIONS, FurnitureTransform } from './furniturePositions';

export interface ObjectTransform {
  position: [number, number, number];
  rotationY: number;
}

// Closed TILLREDA GLB measures 44.99 cm across the east-wall axis (45 cm nominal),
// wider than the 39 cm-deep Kallax above it.
const FREEZER_WIDTH = 45;

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
  const kitchenDrona = KITCHEN_DRONA_ITEMS[itemId as keyof typeof KITCHEN_DRONA_ITEMS];
  if (kitchenDrona) {
    const [x, y, z] = KALLAX_CUISINE_DRONA_POSITIONS[kitchenDrona.index], c = Math.cos(KALLAX_CUISINE_ROTATION), s = Math.sin(KALLAX_CUISINE_ROTATION);
    return { position: [KALLAX_CUISINE_POSITION[0] + x * c + z * s, y, KALLAX_CUISINE_POSITION[2] - x * s + z * c], rotationY: KALLAX_CUISINE_ROTATION };
  }
  const bathroomStorage = BATHROOM_STORAGE_ITEMS[itemId as keyof typeof BATHROOM_STORAGE_ITEMS];
  if (bathroomStorage) return { position: bathroomStorage.position, rotationY: bathroomStorage.rotationY };
  const storage = DRONA_SPECIAL_ITEMS[itemId as keyof typeof DRONA_SPECIAL_ITEMS];
  if (storage) {
    const freezer = getStaticObjectTransform('kallax-se')!;
    const position = storage.shelf === 'se' ? freezer.position : storage.shelf === 'nw' ? KALLAX_NW_POSITION : KALLAX_NE_POSITION;
    const ry = storage.shelf === 'se' ? freezer.rotationY - Math.PI / 2 : storage.shelf === 'nw' ? KALLAX_NW_ROTATION : KALLAX_NE_ROTATION;
    const [x, y, z] = storage.position, c = Math.cos(ry), s = Math.sin(ry);
    return { position: [position[0] + x * c + z * s, position[1] + y, position[2] - x * s + z * c], rotationY: ry };
  }
  switch (itemId) {
    case 'kallax-ne-stack':
      return { position: KALLAX_NE_POSITION, rotationY: KALLAX_NE_ROTATION };
    case 'kallax-nw-stack':
      return { position: KALLAX_NW_POSITION, rotationY: KALLAX_NW_ROTATION };
    case 'kallax-sw-stack':
      return { position: KALLAX_CUISINE_POSITION, rotationY: KALLAX_CUISINE_ROTATION };
    case 'kallax-se-stack': {
      const freezer = getStaticObjectTransform('kallax-se')!;
      return { position: freezer.position, rotationY: freezer.rotationY - Math.PI / 2 };
    }
    case 'drona-se-pyjama':
    case 'drona-se-linen': {
      const freezer = getStaticObjectTransform('kallax-se')!;
      const ry = freezer.rotationY - Math.PI / 2;
      const [x, y, z] = KALLAX_SE_DRONA_POSITIONS[DRONA_SE_ITEMS[itemId].index];
      return {
        position: [freezer.position[0] + x * Math.cos(ry) + z * Math.sin(ry), freezer.position[1] + y, freezer.position[2] - x * Math.sin(ry) + z * Math.cos(ry)],
        rotationY: ry,
      };
    }
    case 'drona-ne-catchall': {
      const [x, y, z] = DRONA_CATCHALL_POSITION;
      const c = Math.cos(KALLAX_NE_ROTATION), s = Math.sin(KALLAX_NE_ROTATION);
      return {
        position: [KALLAX_NE_POSITION[0] + x * c + z * s, KALLAX_NE_POSITION[1] + y, KALLAX_NE_POSITION[2] - x * s + z * c],
        rotationY: KALLAX_NE_ROTATION,
      };
    }
    case 'fridge': {
      const kitchen = getStaticObjectTransform('cuisine-group')!;
      return {
        position: [
          kitchen.position[0] + FRIDGE_LOCAL_POSITION[0],
          kitchen.position[1] + FRIDGE_LOCAL_POSITION[1],
          kitchen.position[2] + FRIDGE_LOCAL_POSITION[2],
        ],
        rotationY: kitchen.rotationY,
      };
    }
    case 'freezer':
    case 'kallax-se':
      // The freezer sits at the base of Kallax SE, with an extra quarter turn.
      return {
        position: [ROOM_W - FREEZER_WIDTH / 2 - FURNITURE_WALL_CLEARANCE, 0, ROOM_D - SHOE_HAT_RACK.width - 47.37 / 2 - FURNITURE_WALL_CLEARANCE],
        rotationY: Math.PI,
      };
    case 'bed-west':
      return { position: [SINGLE_BED_POSITIONS.west.x, 0, SINGLE_BED_POSITIONS.west.z], rotationY: SINGLE_BED_POSITIONS.west.ry };
    case 'bed-east':
      return { position: [SINGLE_BED_POSITIONS.east.x, 0, SINGLE_BED_POSITIONS.east.z], rotationY: SINGLE_BED_POSITIONS.east.ry };
    case 'sdb-closet':
      return {
        position: [SDB_CLOSET_X, 0, SDB_CLOSET_Z],
        rotationY: 0,
      };

    case 'corridor-closet':
      // Placements.tsx: <group position={[(KITCHEN_EAST_WALL + PARTITION_THICKNESS + DOOR_START) / 2, 0, (CORRIDOR_NORTH_WALL + KITCHEN_SOUTH_WALL) / 2]} ...>
      return {
        position: [
          (KITCHEN_EAST_WALL + PARTITION_THICKNESS + DOOR_START) / 2,
          0,
          (CORRIDOR_NORTH_WALL + KITCHEN_SOUTH_WALL) / 2,
        ],
        rotationY: 0,
      };

    case 'toilet':
      // Placements.tsx: <group position={[BATH_WEST_WALL + 60, 0, BATH_NORTH_WALL + 36.5]} ...>
      return {
        position: [BATH_WEST_WALL + 60, 0, BATH_NORTH_WALL + TOILET_D / 2 + 1.5],
        rotationY: 0,
      };

    case 'vasque-sdb':
      // Placements.tsx: <group position={[DOOR_START - 84, 14, BATH_NORTH_WALL + 24.5]} ...>
      return {
        position: [DOOR_START - 84, 0, BATH_NORTH_WALL + 24.5],
        rotationY: 0,
      };

    case 'shower':
      return {
        position: [
          BATH_WEST_WALL + SHOWER_W / 2,
          0,
          SHOWER_SOUTH_WALL - SHOWER_D / 2,
        ],
        rotationY: 0,
      };

    case 'cuisine-group':
      // Placements.tsx: <group position={[KITCHEN_WEST_WALL, 0, ROOM_D]} ...>
      return {
        position: [KITCHEN_WEST_WALL, 0, ROOM_D],
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
  const current = currentFurnitureTransforms[anchorKey];
  if (current) return { position: [current.x, 0, current.z], rotationY: current.ry };
  const anchorList = DYNAMIC_FURNITURE_ANCHORS[anchorKey];
  if (!anchorList || anchorList.length === 0) return undefined;

  const state = positionState[anchorKey];
  // Les lits séparés utilisent leurs placements statiques (idx = -1).
  if (state && state.idx < 0) return undefined;
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
