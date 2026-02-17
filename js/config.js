// =============================================
// CONFIG
// =============================================
// 1 stud = 10cm
export const ROOM_W = 30;  // 3m
export const ROOM_D = 40;  // 4m
export const WALL_H = 24;  // 2.4m
export const BRICK_H = 3;
export const NUM_LAYERS = WALL_H / BRICK_H; // 8
export const GAP = 0.08;
export const STUD_R = 0.30;
export const STUD_HT = 0.35;
export const PLATE_H = 0.35;  // hauteur d'une plate (sol fin)

// Porte : 80cm d'ouverture, 30cm du mur B (X=30)
export const DOOR_START = 19;  // stud 19
export const DOOR_END = 27;    // stud 27
export const DOOR_H_LAYERS = 7; // ~2.1m de haut (7 x 3 studs = 21 studs = 2.1m)

// Renfoncement cuisine : 1m large, 60cm profond, à droite de la porte
export const KITCHEN_X0 = 3;   // début (depuis mur A)
export const KITCHEN_X1 = 13;  // fin (1m = 10 studs)
export const KITCHEN_DEPTH = 6; // 60cm = 6 studs (s'étend vers Z+)
export const KITCHEN_Z = ROOM_D + KITCHEN_DEPTH; // Z=46

// Enfoncement angle D-A : 10cm profond, 1m20 le long du mur A
export const NICHE_DEPTH = 1;       // 10cm = 1 stud (protrusion vers X+)
export const NICHE_LENGTH = 12;     // 1m20 = 12 studs le long de Z
export const NICHE_Z_START = ROOM_D - NICHE_LENGTH; // Z=28

// Baie vitrée double : 170cm large, 190cm haut, 50cm du mur B, sur mur C
// Muret de 20cm sous la baie (~1 couche = 30cm en LEGO)
export const GLASS_START = 8;       // 30 - 5 - 17 = stud 8
export const GLASS_END = 25;        // 30 - 5 = stud 25
export const GLASS_MIN_LAYER = 1;   // muret : 1 couche = 3 studs = 30cm (~20cm)
export const GLASS_MAX_LAYER = 7;   // 6 couches vitrées au-dessus = 18 studs = 1.80m (~190cm)

export const BRICK_SIZES = [16, 12, 10, 8, 6, 4, 3, 2, 1];

export const COLORS = {
  wall: 0xc8c8b8, studWall: 0xb8b8a8,
  floor: 0xd4a437, studFloor: 0xc49530,
  accent: 0xcc0000, accentS: 0xaa0000,
  ground: 0x3a7d44,
};
