// =============================================
// CONFIG
// =============================================
// 1 unit = 1cm
export const ROOM_W = 300; // 3m
export const ROOM_D = 400; // 4m
export const WALL_H = 240; // 2.4m
export const BRICK_H = 30;
export const NUM_LAYERS = WALL_H / BRICK_H; // 8
export const GAP = 0.8;
export const STUD_R = 3;
export const PLATE_H = 3.5; // hauteur d'une plate (sol fin)
export const STUD_HT = PLATE_H / 2; // 1.75

// Porte : 80cm d'ouverture, 30cm du mur B (X=300)
export const DOOR_START = 190; // cm 190
export const DOOR_END = 270; // cm 270
export const DOOR_H_LAYERS = 7; // ~2.1m de haut (7 x 30cm = 210cm)

// Renfoncement cuisine : 1m large, 60cm profond, à droite de la porte
export const KITCHEN_X0 = 30; // début (depuis mur A)
export const KITCHEN_X1 = 130; // fin (1m = 100cm)
export const KITCHEN_DEPTH = 60; // 60cm
export const KITCHEN_Z = ROOM_D + KITCHEN_DEPTH; // Z=460

// Enfoncement angle D-A : 10cm profond, 1m20 le long du mur A
export const NICHE_DEPTH = 10; // 10cm (protrusion vers X+)
export const NICHE_LENGTH = 120; // 1m20 le long de Z
export const NICHE_Z_START = ROOM_D - NICHE_LENGTH; // Z=280

// Baie vitrée double : 160cm large, 190cm haut, 50cm du mur B, sur mur C
// Muret de 20cm sous la baie (~1 couche = 30cm en LEGO)
export const GLASS_START = 90; // 300 - 50 - 160 = cm 90
export const GLASS_END = 250; // 300 - 50 = cm 250
export const GLASS_MIN_LAYER = 1; // muret : 1 couche = 30cm (~20cm)
export const GLASS_MAX_LAYER = 7; // 6 couches vitrées au-dessus = 180cm (~190cm)

export const BRICK_SIZES = [160, 120, 100, 80, 60, 40, 30, 20, 10];

// Kallax dimensions (cm)
export const KALLAX_CELL = 33.5;   // niche width 33.5cm
export const KALLAX_CELL_H = 34;   // niche height 34cm
export const KALLAX_PANEL = 1.5;   // inner divider 1.5cm
export const KALLAX_FRAME = 3.5;   // outer frame 3.5cm
export const KALLAX_DEPTH = 39;    // depth 39cm

// Floor plate Y position — parquet surface at Y=0
export const FLOOR_Y = -PLATE_H - (PLATE_H - GAP) / 2;

// Corridor / SDB boundaries
export const CORR_DOOR_S = KITCHEN_Z + 50;
export const CORR_DOOR_E = KITCHEN_Z + 130;
export const SDB_Z_END = KITCHEN_Z + 140;
// Mur diagonal bâtiment
// Contrainte : passe exactement par arête SE MCo-O (DOOR_START, SDB_Z_END)
// Point A = fin MCo-E, Point C = mur ouest
export const DIAG_AX = ROOM_W;           // 300
export const DIAG_AZ = 530;              // Z départ diagonale
export const DIAG_CX = -NICHE_DEPTH;     // -10
export const DIAG_CZ = DIAG_AZ + (SDB_Z_END - DIAG_AZ) * (DIAG_AX - DIAG_CX) / (DIAG_AX - DOOR_START); // ≈727.3
export const DIAG_END_Z = DIAG_CZ;

// Jardin diagonal endpoint (parallèle à MDiag, pente -7/11)
export const GARDEN_JC_Z = -140 - (DIAG_CZ - DIAG_AZ) * 320 / (DIAG_AX - DIAG_CX); // ≈-343.6

// Layers Three.js
export const LAYER_STRUCTURE  = 0; // Murs, sol, plafond
export const LAYER_EQUIPMENT  = 1; // WC, douche, évier, chauffe-eau…
export const LAYER_FURNITURE  = 2; // Lit, tables, chaises, étagères…
export const LAYER_NETWORKS   = 3; // Tuyauterie, électricité (optionnel)

export const COLORS = {
  wall: 0xeeeeee,
  studWall: 0xb8b8a8,
  floor: 0xd4a437,
  studFloor: 0xc49530,
  parquet: 0xC19A6B,
  accent: 0xcc0000,
  accentS: 0xaa0000,
  ground: 0x3a7d44,
  grass: 0x4a9e54,
  grassStud: 0x3d8545,
  tile: 0xe8e8e8,
  studTile: 0xd0d0d0,
};
