import {
  ROOM_W, ROOM_D, DOOR_START, DOOR_END,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z,
  NICHE_DEPTH, NICHE_Z_START,
  GLASS_START, GLASS_END,
  CORR_DOOR_S, CORR_DOOR_E,
  SDB_Z_END,
  DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ,
} from '../config.js';

// Points sur le mur diagonal pour la porte d'entrée
const _dLen = Math.sqrt((DIAG_CX - DIAG_AX) ** 2 + (DIAG_CZ - DIAG_AZ) ** 2);
const _dX   = (DIAG_CX - DIAG_AX) / _dLen;
const _dZ   = (DIAG_CZ - DIAG_AZ) / _dLen;
export const DIAG_DOOR_S = { x: DIAG_AX + 10  * _dX, z: DIAG_AZ + 10  * _dZ };
export const DIAG_DOOR_E = { x: DIAG_AX + 100 * _dX, z: DIAG_AZ + 100 * _dZ };
export const DIAG_ANGLE  = Math.atan2(DIAG_CZ - DIAG_AZ, DIAG_CX - DIAG_AX);

// Segments du contour — t: 'w' mur | 'd' porte | 'n' fenêtre
export const FLOOR_SEGMENTS = [
  // MUR A OUEST (niche)
  { t: 'w', x1: 0,            z1: 0,            x2: 0,            z2: NICHE_Z_START },
  { t: 'w', x1: 0,            z1: NICHE_Z_START, x2: -NICHE_DEPTH, z2: NICHE_Z_START },
  { t: 'w', x1: -NICHE_DEPTH, z1: NICHE_Z_START, x2: -NICHE_DEPTH, z2: ROOM_D },
  { t: 'w', x1: -NICHE_DEPTH, z1: ROOM_D,        x2: -NICHE_DEPTH, z2: KITCHEN_Z },
  // MUR B EST
  { t: 'w', x1: ROOM_W, z1: 0, x2: ROOM_W, z2: ROOM_D + 10 },
  // MUR C NORD (baie vitrée)
  { t: 'w', x1: 0,          z1: 0, x2: GLASS_START, z2: 0 },
  { t: 'n', x1: GLASS_START, z1: 0, x2: GLASS_END,  z2: 0 },
  { t: 'w', x1: GLASS_END,  z1: 0, x2: ROOM_W,      z2: 0 },
  // MUR D SUD (porte + cuisine)
  { t: 'w', x1: -NICHE_DEPTH, z1: ROOM_D, x2: KITCHEN_X0, z2: ROOM_D },
  { t: 'w', x1: KITCHEN_X1,  z1: ROOM_D, x2: DOOR_START,  z2: ROOM_D },
  { t: 'd', x1: DOOR_START,  z1: ROOM_D, x2: DOOR_END,    z2: ROOM_D },
  { t: 'w', x1: DOOR_END,    z1: ROOM_D, x2: ROOM_W,      z2: ROOM_D },
  // CUISINE
  { t: 'w', x1: KITCHEN_X0, z1: ROOM_D, x2: KITCHEN_X0, z2: KITCHEN_Z },
  { t: 'w', x1: KITCHEN_X1, z1: ROOM_D, x2: KITCHEN_X1, z2: KITCHEN_Z },
  // MUR SDB NORD
  { t: 'w', x1: -NICHE_DEPTH, z1: KITCHEN_Z, x2: DOOR_START, z2: KITCHEN_Z },
  // PLACARD couloir (porte coulissante)
  { t: 'd', x1: DOOR_START, z1: ROOM_D + 10, x2: DOOR_START, z2: KITCHEN_Z },
  // COULOIR STUDIO (mur gauche SDB)
  { t: 'w', x1: DOOR_START, z1: KITCHEN_Z,   x2: DOOR_START, z2: CORR_DOOR_S },
  { t: 'd', x1: DOOR_START, z1: CORR_DOOR_S, x2: DOOR_START, z2: CORR_DOOR_E },
  { t: 'w', x1: DOOR_START, z1: CORR_DOOR_E, x2: DOOR_START, z2: SDB_Z_END },
  // COULOIR STUDIO (mur droit, côté B)
  { t: 'w', x1: ROOM_W, z1: ROOM_D + 10, x2: ROOM_W, z2: DIAG_AZ },
  // SDB OUEST (toute la longueur)
  { t: 'w', x1: -NICHE_DEPTH, z1: KITCHEN_Z, x2: -NICHE_DEPTH, z2: DIAG_CZ },
  // MUR SDB SUD (vitrage douche + PC-SDB)
  { t: 'n', x1: -NICHE_DEPTH, z1: 600, x2: 60,        z2: 600 },
  { t: 'd', x1: 60,           z1: 600, x2: DOOR_START, z2: 600 },
  // DOUCHE
  { t: 'w', x1: 60,           z1: 600, x2: 60,           z2: 670 },
  { t: 'w', x1: -NICHE_DEPTH, z1: 670, x2: 60,           z2: 670 },
  // MUR DIAGONAL BÂTIMENT (porte d'entrée)
  { t: 'w', x1: DIAG_AX,       z1: DIAG_AZ,       x2: DIAG_DOOR_S.x, z2: DIAG_DOOR_S.z },
  { t: 'd', x1: DIAG_DOOR_S.x, z1: DIAG_DOOR_S.z, x2: DIAG_DOOR_E.x, z2: DIAG_DOOR_E.z },
  { t: 'w', x1: DIAG_DOOR_E.x, z1: DIAG_DOOR_E.z, x2: DIAG_CX,       z2: DIAG_CZ       },
];
