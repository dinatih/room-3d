// =============================================
// CONFIG
// =============================================
// 1 unit = 1cm
export const ROOM_W       = 316; // 3,16m — largeur réelle du séjour
export const ROOM_D = 400; // 4m
export const WALL_H = 250; // 2.5m

// Porte : 80cm d'ouverture, alignée après pilier corr-s (X=200)
export const DOOR_START = 200; // cm 200
export const DOOR_END = 280; // cm 280
export const DOOR_H = 204;      // hauteur standard française (panneaux de porte)

// Renfoncement cuisine : 1m large, 60cm profond, à droite de la porte
export const KITCHEN_X0 = 30; // début (depuis mur A)
export const KITCHEN_X1 = 130; // fin (1m = 100cm)
export const KITCHEN_DEPTH = 60; // 60cm
export const KITCHEN_Z = ROOM_D + KITCHEN_DEPTH; // Z=460

// Enfoncement angle D-A : 10cm profond, 1m20 le long du mur A
export const NICHE_DEPTH = 10; // 10cm (protrusion vers X+)
export const NICHE_Z_START = ROOM_D - 120; // Z=280

// Baie vitrée double : 160cm large, 190cm haut, 50cm du mur B, sur mur C
// Muret de 20cm sous la baie (~1 couche = 30cm en LEGO)
export const GLASS_START = 90;    // 300 - 50 - 160 = cm 90
export const GLASS_END   = 250;   // 300 - 50 = cm 250
export const GLASS_TOP_Y = 210;   // hauteur allège mur C (baie vitrée)

// Corridor / SDB boundaries
export const BATH_Z_END = KITCHEN_Z + 150;

// Mur diagonal bâtiment — paramètre physique unique : angle intérieur au coin A
// (angle entre mur B et le mur diagonal, mesuré à l'intérieur de la pièce)
// Mesure sur place : 118–120°  |  modèle actuel : 122.5°
// Formule : DIAG_CZ = DIAG_AZ − (DIAG_AX − DIAG_CX) / tan(α)
export const DIAG_ANGLE_DEG = 120;
const _diagAngle = DIAG_ANGLE_DEG * (Math.PI / 180);
export const DIAG_AX = ROOM_W;       // 316 — point A : coin NE (jonction mur B)
export const DIAG_AZ = 542;          // Z du point A
export const DIAG_CX = -NICHE_DEPTH; // -10 — point C : côté niche ouest
export const DIAG_CZ = DIAG_AZ - (DIAG_AX - DIAG_CX) / Math.tan(_diagAngle); // ≈727.5

// Mur diagonal — géométrie dérivée (calculée une fois)
export const DIAG_DX    = DIAG_CX - DIAG_AX;
export const DIAG_DZ    = DIAG_CZ - DIAG_AZ;
export const DIAG_LEN   = Math.sqrt(DIAG_DX * DIAG_DX + DIAG_DZ * DIAG_DZ);
export const DIAG_SIN   = DIAG_DX / DIAG_LEN;   // composante X du vecteur directeur normé
export const DIAG_COS   = DIAG_DZ / DIAG_LEN;   // composante Z du vecteur directeur normé
export const DIAG_ROT_Y = Math.atan2(DIAG_DX, DIAG_DZ); // rotation Y Three.js du mur diagonal

// Porte d'entrée diagonale — offsets le long du mur diagonal (cm)
export const DIAG_ENTRY_S = 10;                          // début de la porte
export const DIAG_ENTRY_W = 90;                          // largeur de la porte
export const DIAG_ENTRY_E = DIAG_ENTRY_S + DIAG_ENTRY_W; // fin de la porte

// Layers Three.js
export const LAYER_STRUCTURE  = 0; // Murs, sol, plafond
export const LAYER_EQUIPMENT  = 1; // WC, douche, évier, chauffe-eau…
export const LAYER_FURNITURE  = 2; // Lit, tables, chaises, étagères…
export const LAYER_NETWORKS   = 3; // Tuyauterie, électricité (optionnel)
export const LAYER_NEIGHBORS  = 4; // Appartements voisins (fantôme)
export const LAYER_LIDAR      = 5; // Scan LiDAR
