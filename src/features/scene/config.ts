// =============================================
// CONFIG
// =============================================
// 1 unit = 1cm

// Layers Three.js (0 réservé par défaut Three.js pour caméras/helpers non catégorisés)
export const LAYER_DEFAULT          = 0;  // Layer universel par défaut Three.js
export const LAYER_EQUIPMENT        = 11; // WC, douche, évier, chauffe-eau…
export const LAYER_FURNITURE        = 12; // Lit, tables, chaises, étagères…
export const LAYER_NETWORKS         = 13; // Tuyauterie, électricité (optionnel)
export const LAYER_NEIGHBORS        = 14; // Appartements voisins (fantôme)
export const LAYER_LIDAR            = 15; // Scan LiDAR
export const LAYER_WALKER_DETAIL    = 16; // Meshes walker masqués en main camera (FPS) mais visibles dans miroirs (yeux, peau visage)
export const LAYER_MIRRORS          = 17; // Miroirs NISSEDAL / Reflector
export const LAYER_WALKER           = 18; // Personnages 3D
export const LAYER_AI_ZONES         = 19; // Zones IA, cercles, flèches et labels texte
export const LAYER_ANIMALS          = 20; // Animaux autonomes (Oiseau Robin, Chien Shiba Inu)
export const LAYER_FURNISHINGS      = 21; // Tapis, rideaux, lampadaire, coussins (Habillage & confort fonctionnel)
export const LAYER_DECOR            = 22; // Tasses, plantes en pot, cadres, props (Détails & habillage de surface)
export const LAYER_ENVIRONMENT      = 23; // Ciel (skysphere) et atmosphère
export const LAYER_WALL_STRUCTURE   = 24; // Structure murale (murs, cloisons, linteaux, piliers)
export const LAYER_FLOOR_COVERINGS  = 25; // Revêtements de sol (parquet, carrelage, PVC) et plinthes
export const LAYER_DOORS            = 26; // Portes (séjour, SDB, entrée, baie vitrée)
export const LAYER_GRASS            = 27; // Herbe et sol extérieur (BermudaGround)
export const LAYER_STRUCTURE        = 28; // Dalle béton, plafond (calque dédié, isolé du layer 0)
