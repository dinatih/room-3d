import {
  ROOM_W, ROOM_D, DOOR_START, DOOR_END,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z, KITCHEN_DEPTH,
  NICHE_DEPTH, NICHE_Z_START,
  GLASS_START, GLASS_END,
  GARDEN_JC_Z, CORR_DOOR_S, CORR_DOOR_E,
  SDB_Z_END,
  DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ,
} from '../config';

// Points sur le mur diagonal pour la porte d'entrée
const _dLen = Math.sqrt((DIAG_CX - DIAG_AX) ** 2 + (DIAG_CZ - DIAG_AZ) ** 2);
const _dX   = (DIAG_CX - DIAG_AX) / _dLen;
const _dZ   = (DIAG_CZ - DIAG_AZ) / _dLen;
export const DIAG_DOOR_S = { x: DIAG_AX + 10  * _dX, z: DIAG_AZ + 10  * _dZ };
export const DIAG_DOOR_E = { x: DIAG_AX + 100 * _dX, z: DIAG_AZ + 100 * _dZ };
export const DIAG_ANGLE  = Math.atan2(DIAG_CZ - DIAG_AZ, DIAG_CX - DIAG_AX);

const diagXat = (z: number): number => DIAG_AX + (z - DIAG_AZ) * (DIAG_CX - DIAG_AX) / (DIAG_CZ - DIAG_AZ);

// Pièces — source unique pour minimap (hover, clic POV) et floorplan (labels 3D)
// labelSize / labelColor : utilisés par floorplan.js
// contains / fills / fillPath : utilisés par minimap.js
export const ROOMS = [
  {
    nameFr: 'Jardin', nameEn: 'garden',
    labelX: 140, labelZ: -160, labelSize: 20, labelColor: '#4a9e54',
    contains: (x, z) => {
      if (x < -10 || x > 310 || z > -10) return false;
      return z >= -140 - 70 * (x + 10) / 110;
    },
    fills: () => [],
    fillPath: (ctx, tx, tz) => {
      ctx.beginPath();
      ctx.moveTo(tx(-10), tz(-10));
      ctx.lineTo(tx(-10), tz(-140));
      ctx.lineTo(tx(310), tz(GARDEN_JC_Z));
      ctx.lineTo(tx(310), tz(-10));
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    nameFr: 'Entrée', nameEn: 'entry',
    labelX: (DOOR_START + ROOM_W) / 2, labelZ: ROOM_D + 70, labelSize: 15,
    contains: (x, z) => {
      if (z <= ROOM_D || z > SDB_Z_END) return false;
      if (x >= KITCHEN_X1 && x <= DOOR_START && z <= KITCHEN_Z) return true;
      if (x >= DOOR_START && x <= ROOM_W && z <= DIAG_AZ) return true;
      if (x >= DOOR_START && z <= SDB_Z_END && x <= diagXat(z)) return true;
      return false;
    },
    fills: (tx, tz, S) => [
      [tx(KITCHEN_X1), tz(ROOM_D + 10), (DOOR_START - KITCHEN_X1) * S, (KITCHEN_Z - ROOM_D - 10) * S],
      [tx(DOOR_START), tz(ROOM_D + 10), (ROOM_W - DOOR_START) * S, (DIAG_AZ - ROOM_D - 10) * S],
    ],
    fillPath: (ctx, tx, tz) => {
      ctx.beginPath();
      ctx.moveTo(tx(DOOR_START), tz(DIAG_AZ));
      ctx.lineTo(tx(ROOM_W), tz(DIAG_AZ));
      ctx.lineTo(tx(DOOR_START), tz(SDB_Z_END));
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    nameFr: 'Salle d\'eau', nameEn: 'bathroom',
    labelX: (DOOR_START - NICHE_DEPTH) / 2, labelZ: 530, labelSize: 18,
    contains: (x, z) => {
      if (x < -NICHE_DEPTH) return false;
      if (x <= DOOR_START && z >= KITCHEN_Z && z <= SDB_Z_END) return true;
      return z > SDB_Z_END && z <= DIAG_CZ && x <= diagXat(z);
    },
    fills: (tx, tz, S) => [
      [tx(-NICHE_DEPTH), tz(KITCHEN_Z + 10), (DOOR_START + NICHE_DEPTH) * S, (SDB_Z_END - KITCHEN_Z - 10) * S],
    ],
    fillPath: (ctx, tx, tz) => {
      ctx.beginPath();
      ctx.moveTo(tx(-NICHE_DEPTH), tz(SDB_Z_END));
      ctx.lineTo(tx(DOOR_START), tz(SDB_Z_END));
      ctx.lineTo(tx(-NICHE_DEPTH), tz(DIAG_CZ));
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    nameFr: 'Séjour', nameEn: 'living',
    labelX: ROOM_W / 2, labelZ: ROOM_D / 2, labelSize: 25,
    contains: (x, z) =>
      (x >= 0 && x <= ROOM_W && z >= 0 && z <= ROOM_D) ||
      (x >= -NICHE_DEPTH && x < 0 && z >= NICHE_Z_START && z <= ROOM_D) ||
      (x >= KITCHEN_X0 && x <= KITCHEN_X1 && z > ROOM_D && z <= KITCHEN_Z),
    fills: (tx, tz, S) => [
      [tx(0), tz(0), ROOM_W * S, ROOM_D * S],
      [tx(-NICHE_DEPTH), tz(NICHE_Z_START), NICHE_DEPTH * S, (ROOM_D - NICHE_Z_START) * S],
      [tx(KITCHEN_X0), tz(ROOM_D), (KITCHEN_X1 - KITCHEN_X0) * S, (KITCHEN_Z - ROOM_D) * S],
    ],
  },
  {
    nameFr: 'Cuisine', nameEn: 'kitchen',
    labelX: (KITCHEN_X0 + KITCHEN_X1) / 2, labelZ: ROOM_D + KITCHEN_DEPTH / 2, labelSize: 15,
    contains: (x, z) => x >= KITCHEN_X0 && x <= KITCHEN_X1 && z >= ROOM_D && z <= KITCHEN_Z,
    fills: (tx, tz, S) => [
      [tx(KITCHEN_X0), tz(ROOM_D), (KITCHEN_X1 - KITCHEN_X0) * S, (KITCHEN_Z - ROOM_D) * S],
    ],
  },
  {
    nameFr: 'Douche', nameEn: 'shower',
    labelX: 25, labelZ: 635, labelSize: 12,
    contains: (x, z) => x >= -NICHE_DEPTH && x <= 60 && z >= 600 && z <= 670,
    fills: (tx, tz, S) => [
      [tx(-NICHE_DEPTH), tz(600), (60 + NICHE_DEPTH) * S, 70 * S],
    ],
  },
];

// Labels des murs, portes et fenêtres — partagés entre floorplan.js et minimap.js
// t: 'w' mur | 'd' porte | 'n' fenêtre
// rotZ : rotation du texte 3D dans floorplan (ignoré par minimap)
// size  : taille du texte 3D dans floorplan
const _CW_Z0    = ROOM_D + 10;
const _diagMidX = (DIAG_AX + DIAG_CX) / 2;
const _diagMidZ = (DIAG_AZ + DIAG_CZ) / 2;
const _doorMidX = (DIAG_DOOR_S.x + DIAG_DOOR_E.x) / 2;
const _doorMidZ = (DIAG_DOOR_S.z + DIAG_DOOR_E.z) / 2;

export const WALL_LABELS = [
  // Murs principaux
  { t: 'w', name: 'MA',    x: -25,                             z: NICHE_Z_START / 2,                  rotZ:  Math.PI / 2,  size: 10 },
  { t: 'w', name: 'MB',    x: ROOM_W + 20,                     z: ROOM_D / 2,                         rotZ: -Math.PI / 2,  size: 10 },
  { t: 'w', name: 'MC',    x: ROOM_W / 2,                      z: -20,                                rotZ:  0,            size: 10 },
  { t: 'w', name: 'MD',    x: ROOM_W / 2,                      z: ROOM_D + 20,                        rotZ:  0,            size: 10 },
  // Niche + gaine
  { t: 'w', name: 'MN',    x: -NICHE_DEPTH - 15,               z: (NICHE_Z_START + ROOM_D) / 2,       rotZ:  Math.PI / 2,  size: 8  },
  { t: 'w', name: 'MGT-O', x: -NICHE_DEPTH - 15,               z: (ROOM_D + KITCHEN_Z) / 2,           rotZ:  Math.PI / 2,  size: 7  },
  // Cuisine
  { t: 'w', name: 'MK-O',  x: KITCHEN_X0 - 15,                 z: (ROOM_D + KITCHEN_Z) / 2,           rotZ:  Math.PI / 2,  size: 8  },
  { t: 'w', name: 'MK-E',  x: KITCHEN_X1 + 15,                 z: (ROOM_D + KITCHEN_Z) / 2,           rotZ: -Math.PI / 2,  size: 8  },
  // SdB
  { t: 'w', name: 'MS-N',  x: (-NICHE_DEPTH + DOOR_START) / 2, z: KITCHEN_Z - 15,                     rotZ:  0,            size: 8  },
  { t: 'w', name: 'MS-O',  x: -NICHE_DEPTH - 15,               z: (KITCHEN_Z + 600) / 2,              rotZ:  Math.PI / 2,  size: 8  },
  // Douche + couloir
  { t: 'w', name: 'MDch',  x: 60 + 15,                         z: 635,                                rotZ: -Math.PI / 2,  size: 7  },
  { t: 'w', name: 'MCo-O', x: DOOR_START - 15,                 z: (KITCHEN_Z * 2 + 140) / 2,          rotZ:  Math.PI / 2,  size: 7  },
  { t: 'w', name: 'MCo-E', x: ROOM_W + 20,                     z: (_CW_Z0 * 2 + 130) / 2,            rotZ: -Math.PI / 2,  size: 7  },
  // Mur diagonal
  { t: 'w', name: 'MDiag', x: _diagMidX + 20,                  z: _diagMidZ + 20,                     rotZ:  DIAG_ANGLE,   size: 8  },
  // Portes
  { t: 'd', name: 'P1',    x: (DOOR_START + DOOR_END) / 2,     z: ROOM_D - 20,                        rotZ:  0,            size: 10 },
  { t: 'd', name: 'P2',    x: DOOR_START + 20,                 z: (CORR_DOOR_S + CORR_DOOR_E) / 2,    rotZ:  0,            size: 10 },
  { t: 'd', name: 'P3',    x: _doorMidX + 20,                  z: _doorMidZ - 20,                     rotZ:  DIAG_ANGLE,   size: 10 },
  { t: 'd', name: 'PC-SDB',x: (60 + DOOR_START) / 2,           z: 600 + 15,                           rotZ:  0,            size: 8  },
  { t: 'd', name: 'PC',    x: DOOR_START + 20,                 z: (_CW_Z0 + KITCHEN_Z) / 2,           rotZ: -Math.PI / 2,  size: 8  },
  // Fenêtres
  { t: 'n', name: 'Baie',  x: (GLASS_START + GLASS_END) / 2,   z: -40,                                rotZ:  0,            size: 9  },
  { t: 'n', name: 'VDch',  x: 35,                              z: 600 - 15,                           rotZ:  0,            size: 8  },
];

// Cotations — partagées entre floorplan.js (3D) et minimap.js (canvas 2D)
// offset > 0 = vers la gauche/haut du segment, < 0 = vers la droite/bas
// ext: true = cotation extérieure (couleur distincte)
export const DIMENSIONS = [
  // Séjour : largeur (MC)
  { x1: GLASS_START,   z1: 0,            x2: GLASS_END,      z2: 0,            offset: -15 },
  { x1: 0,             z1: 0,            x2: ROOM_W,         z2: 0,            offset: -35 },
  { x1: -10,           z1: -10,          x2: ROOM_W + 10,    z2: -10,          offset: -50, ext: true },
  // Séjour : profondeur (MA)
  { x1: 0,             z1: 0,            x2: 0,              z2: ROOM_D,       offset:  30 },
  { x1: -10,           z1: -10,          x2: -10,            z2: ROOM_D + 10,  offset:  50, ext: true },
  // Porte P1
  { x1: DOOR_START,    z1: ROOM_D,       x2: DOOR_END,       z2: ROOM_D,       offset: -20 },
  // Cuisine
  { x1: KITCHEN_X0,    z1: ROOM_D,       x2: KITCHEN_X1,     z2: ROOM_D,       offset: -20 },
  { x1: KITCHEN_X0,    z1: ROOM_D,       x2: KITCHEN_X0,     z2: KITCHEN_Z,    offset: -20 },
  { x1: KITCHEN_X0,    z1: KITCHEN_Z,    x2: KITCHEN_X1,     z2: KITCHEN_Z,    offset: -20 },
  // SdB
  { x1: -NICHE_DEPTH,  z1: KITCHEN_Z,    x2: DOOR_START,     z2: KITCHEN_Z,    offset:  20 },
  { x1: -NICHE_DEPTH,  z1: KITCHEN_Z,    x2: -NICHE_DEPTH,   z2: 600,          offset: -20 },
  // Douche
  { x1: -NICHE_DEPTH,  z1: 670,          x2: 60,             z2: 670,          offset: -20 },
  { x1: 60,            z1: 600,          x2: 60,             z2: 670,          offset:  20 },
  // Entrée / Couloir
  { x1: DOOR_START,    z1: ROOM_D + 10,  x2: ROOM_W,         z2: ROOM_D + 10,  offset:  30 },
  { x1: ROOM_W,        z1: ROOM_D + 10,  x2: ROOM_W,         z2: ROOM_D + 140, offset: -20 },
  // Placard
  { x1: KITCHEN_X1,    z1: ROOM_D + 10,  x2: DOOR_START,     z2: ROOM_D + 10,  offset:  20 },
  // Ouvertures
  { x1: 60,            z1: 600,          x2: DOOR_START,     z2: 600,          offset: -20 },
  { x1: -NICHE_DEPTH,  z1: 600,          x2: 60,             z2: 600,          offset:  20 },
  { x1: DOOR_START,    z1: CORR_DOOR_S,  x2: DOOR_START,     z2: CORR_DOOR_E,  offset: -20 },
  { x1: DIAG_DOOR_S.x, z1: DIAG_DOOR_S.z, x2: DIAG_DOOR_E.x, z2: DIAG_DOOR_E.z, offset: 30 },
  // Mur diagonal ext.
  { x1: DIAG_AX,       z1: DIAG_AZ,      x2: DIAG_CX,        z2: DIAG_CZ,      offset:  60, ext: true },
];

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
