import {
  ROOM_W, ROOM_D, DOOR_START, DOOR_END,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z,
  NICHE_DEPTH, NICHE_Z_START,
  GLASS_START, GLASS_END,
  CORR_DOOR_S, CORR_DOOR_E,
  SDB_Z_END,
  DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ,
} from '@config';

// Points sur le mur diagonal pour la porte d'entrée
const _dLen = Math.sqrt((DIAG_CX - DIAG_AX) ** 2 + (DIAG_CZ - DIAG_AZ) ** 2);
const _dX   = (DIAG_CX - DIAG_AX) / _dLen;
const _dZ   = (DIAG_CZ - DIAG_AZ) / _dLen;
const DIAG_DOOR_S = { x: DIAG_AX + 10  * _dX, z: DIAG_AZ + 10  * _dZ };
const DIAG_DOOR_E = { x: DIAG_AX + 100 * _dX, z: DIAG_AZ + 100 * _dZ };

export type Seg = [number, number, number, number]; // x1, z1, x2, z2

export const SEG_WALLS: Seg[] = [
  // MUR A OUEST (niche)
  [0,            0,            0,            NICHE_Z_START],
  [0,            NICHE_Z_START, -NICHE_DEPTH, NICHE_Z_START],
  [-NICHE_DEPTH, NICHE_Z_START, -NICHE_DEPTH, ROOM_D],
  [-NICHE_DEPTH, ROOM_D,        -NICHE_DEPTH, KITCHEN_Z],
  // MUR B EST
  [ROOM_W, 0, ROOM_W, ROOM_D + 10],
  // MUR C NORD
  [0,          0, GLASS_START, 0],
  [GLASS_END,  0, ROOM_W,      0],
  // MUR D SUD
  [-NICHE_DEPTH, ROOM_D, KITCHEN_X0, ROOM_D],
  [KITCHEN_X1,  ROOM_D, DOOR_START,  ROOM_D],
  [DOOR_END,    ROOM_D, ROOM_W,      ROOM_D],
  // CUISINE
  [KITCHEN_X0, ROOM_D, KITCHEN_X0, KITCHEN_Z],
  [KITCHEN_X1, ROOM_D, KITCHEN_X1, KITCHEN_Z],
  // MUR SDB NORD
  [-NICHE_DEPTH, KITCHEN_Z, DOOR_START, KITCHEN_Z],
  // COULOIR STUDIO (mur gauche SDB)
  [DOOR_START, KITCHEN_Z,   DOOR_START, CORR_DOOR_S],
  [DOOR_START, CORR_DOOR_E, DOOR_START, SDB_Z_END],
  // COULOIR STUDIO (mur droit, côté B)
  [ROOM_W, ROOM_D + 10, ROOM_W, DIAG_AZ],
  // SDB OUEST
  [-NICHE_DEPTH, KITCHEN_Z, -NICHE_DEPTH, DIAG_CZ],
  // DOUCHE
  [60,           600, 60,           670],
  [-NICHE_DEPTH, 670, 60,           670],
  // MUR DIAGONAL BÂTIMENT
  [DIAG_AX,       DIAG_AZ,       DIAG_DOOR_S.x, DIAG_DOOR_S.z],
  [DIAG_DOOR_E.x, DIAG_DOOR_E.z, DIAG_CX,       DIAG_CZ      ],
];

export const SEG_DOORS: Seg[] = [
  [DOOR_START,  ROOM_D,      DOOR_END,     ROOM_D],       // P1
  [DOOR_START,  ROOM_D + 10, DOOR_START,   KITCHEN_Z],    // placard couloir
  [DOOR_START,  CORR_DOOR_S, DOOR_START,   CORR_DOOR_E],  // P2 couloir SDB
  [60,          600,         DOOR_START,   600],           // PC-SDB
  [DIAG_DOOR_S.x, DIAG_DOOR_S.z, DIAG_DOOR_E.x, DIAG_DOOR_E.z], // P3 entrée diag
];

export const SEG_WINDOWS: Seg[] = [
  [GLASS_START,  0,   GLASS_END,    0],   // baie vitrée
  [-NICHE_DEPTH, 600, 60,           600], // vitrage douche
];
