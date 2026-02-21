// =============================================
// CONFIG
// =============================================
// 1 stud = 10cm
export const ROOM_W = 30; // 3m
export const ROOM_D = 40; // 4m
export const WALL_H = 24; // 2.4m
export const BRICK_H = 3;
export const NUM_LAYERS = WALL_H / BRICK_H; // 8
export const GAP = 0.08;
export const STUD_R = 0.3;
export const PLATE_H = 0.35; // hauteur d'une plate (sol fin)
export const STUD_HT = PLATE_H / 2; // 0.175

// Porte : 80cm d'ouverture, 30cm du mur B (X=30)
export const DOOR_START = 19; // stud 19
export const DOOR_END = 27; // stud 27
export const DOOR_H_LAYERS = 7; // ~2.1m de haut (7 x 3 studs = 21 studs = 2.1m)

// Renfoncement cuisine : 1m large, 60cm profond, à droite de la porte
export const KITCHEN_X0 = 3; // début (depuis mur A)
export const KITCHEN_X1 = 13; // fin (1m = 10 studs)
export const KITCHEN_DEPTH = 6; // 60cm = 6 studs (s'étend vers Z+)
export const KITCHEN_Z = ROOM_D + KITCHEN_DEPTH; // Z=46

// Enfoncement angle D-A : 10cm profond, 1m20 le long du mur A
export const NICHE_DEPTH = 1; // 10cm = 1 stud (protrusion vers X+)
export const NICHE_LENGTH = 12; // 1m20 = 12 studs le long de Z
export const NICHE_Z_START = ROOM_D - NICHE_LENGTH; // Z=28

// Baie vitrée double : 170cm large, 190cm haut, 50cm du mur B, sur mur C
// Muret de 20cm sous la baie (~1 couche = 30cm en LEGO)
export const GLASS_START = 8; // 30 - 5 - 17 = stud 8
export const GLASS_END = 25; // 30 - 5 = stud 25
export const GLASS_MIN_LAYER = 1; // muret : 1 couche = 3 studs = 30cm (~20cm)
export const GLASS_MAX_LAYER = 7; // 6 couches vitrées au-dessus = 18 studs = 1.80m (~190cm)

export const BRICK_SIZES = [16, 12, 10, 8, 6, 4, 3, 2, 1];

// Kallax dimensions (shared by kallax, decor, mackapar, mirrors, bed)
export const KALLAX_CELL = 3.3;
export const KALLAX_PANEL = 0.15;
export const KALLAX_DEPTH = 4;

// Floor plate Y position — parquet surface at Y=0
export const FLOOR_Y = -PLATE_H - (PLATE_H - GAP) / 2;

// Corridor / SDB boundaries
export const CORR_DOOR_S = KITCHEN_Z + 5;
export const CORR_DOOR_E = KITCHEN_Z + 13;
export const SDB_Z_END = KITCHEN_Z + 14;
// Mur diagonal bâtiment
// Contrainte : passe exactement par arête SE MCo-O (DOOR_START, SDB_Z_END)
// Point A = fin MCo-E, Point C = mur ouest
export const DIAG_AX = ROOM_W;           // 30
export const DIAG_AZ = 53;               // Z départ diagonale (entier pour briques couloir)
export const DIAG_CX = -NICHE_DEPTH;     // -1
export const DIAG_CZ = DIAG_AZ + (SDB_Z_END - DIAG_AZ) * (DIAG_AX - DIAG_CX) / (DIAG_AX - DOOR_START); // ≈72.73
export const DIAG_END_Z = DIAG_CZ;

// Jardin diagonal endpoint (parallèle à MDiag, pente -7/11)
export const GARDEN_JC_Z = -14 - (DIAG_CZ - DIAG_AZ) * 32 / (DIAG_AX - DIAG_CX); // ≈-34.36

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
