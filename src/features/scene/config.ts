// =============================================
// CONFIG
// =============================================
// 1 unit = 1cm

// =============================================
// MESURES RÉELLES (Télémètre laser / Mètre ruban)
// =============================================
/** Distance X entre la jambe ouest de la porte séjour (door-living-w) et le mur est SDB (bath-ne) : 52 cm */
export const MEASURED_DIST_DOOR_LIVING_W_TO_BATH_NE = 52;

/** Distance Z entre le mur nord de la SDB (Z de bath-nw/kitchen-nw) et shower-ne : 141 cm */
export const MEASURED_DIST_BATH_N_TO_SHOWER_NE      = 141;

/** Distance X entre le mur ouest SDB et la porte sdb nord (door-bath-n) / largeur intérieure SDB : 202 cm */
export const MEASURED_DIST_BATH_W_TO_DOOR_BATH_N    = 202;

/** Largeur de l'ouverture cuisine entre kitchen-sw et kitchen-se : 102 cm */
export const MEASURED_DIST_KITCHEN_SW_TO_SE         = 102;

/** Profondeur du séjour le long du mur Est entre corner-ne et corner-se : 405 cm */
export const MEASURED_DIST_CORNER_NE_TO_SE          = 405;

/** Largeur de la douche entre shower-nw et shower-ne : 71 cm */
export const MEASURED_DIST_SHOWER_NW_TO_NE          = 71;

/** Largeur du couloir entre la porte SDB (door-bath-e) et le mur Est couloir (corner-se.x / diag-ne.x) : 116 cm */
export const MEASURED_DIST_DOOR_BATH_E_TO_CORR_E    = 116;

/** Largeur de la pièce entre niche-beam (poutre/niche) et le mur Est (corner-ne.x / corner-se.x) : 316 cm */
export const MEASURED_DIST_NICHE_BEAM_TO_EAST_WALL  = 316;

/** Hauteur sous plafond mesurée entre parquet et plafond : 250 cm */
export const MEASURED_HEIGHT_FLOOR_TO_CEILING       = 250;

// =============================================
// DIMENSIONS DU MODÈLE 3D
// =============================================
export const ROOM_W = 316; // 3,16m — largeur réelle du séjour
export const ROOM_D = 400; // 4m
export const WALL_H = 250; // 2.5m



// Porte : 80cm d'ouverture, alignée après mur couloir (X=200)
export const DOOR_START = 200; // cm 200
export const DOOR_END = 286; // cm 286
export const DOOR_H = 204;      // hauteur standard française (panneaux de porte)

// Renfoncement cuisine : 1m large, 60cm profond, à droite de la porte
export const KITCHEN_X0 = 30; // début (depuis mur A)
export const KITCHEN_X1 = 130; // fin (1m = 100cm)
export const KITCHEN_DEPTH = 60; // 60cm
export const KITCHEN_Z = ROOM_D + KITCHEN_DEPTH; // Z=460

// Enfoncement angle D-A : point X de la niche ouest (piliers / diagonale).
export const NICHE_X = -10; // 10cm vers X-
export const NICHE_Z_START = ROOM_D - 120; // Z=280

// Corridor / SDB boundaries
export const BATH_Z_END = KITCHEN_Z + 150;

// Mur diagonal bâtiment — paramètre physique unique : angle intérieur au coin Est (NE)
// (angle entre mur Est et le mur diagonal, mesuré à l'intérieur de la pièce)
// Mesure sur place : 118–120°  |  modèle actuel : 122.5°
export const DIAG_ANGLE_DEG = 120;
const _diagAngle = DIAG_ANGLE_DEG * (Math.PI / 180);
const _AX = ROOM_W;
const _AZ = 542;
const _CX = NICHE_X;
const _CZ = _AZ - (_AX - _CX) / Math.tan(_diagAngle);
const _DX = _CX - _AX;
const _DZ = _CZ - _AZ;
const _LEN = Math.sqrt(_DX * _DX + _DZ * _DZ);
const _SIN = _DX / _LEN;
const _COS = _DZ / _LEN;

/** Centralise la logique du mur diagonal (trigonométrie, positions, porte). */
export const DiagWall = {
  A: { x: _AX, z: _AZ },
  C: { x: _CX, z: _CZ },
  depth: 10,
  len: _LEN,
  sin: _SIN,
  cos: _COS,
  rotY: Math.atan2(_DX, _DZ),
  slope: (_CZ - _AZ) / (_CX - _AX),
  door: { start: 10, width: 90, end: 10 + 90 },
  /** 
   * Calcule un point (x, z) le long du mur diagonal.
   * @param d Distance depuis le point A (Est) vers C (Ouest)
   * @param off Offset perpendiculaire. Positif = extérieur, Négatif = intérieur.
   */
  p(d: number, off: number = 0) {
    return {
      x: _AX + d * _SIN + off * _COS,
      z: _AZ + d * _COS - off * _SIN
    };
  }
};

// Layers Three.js
export const LAYER_STRUCTURE  = 0; // Murs, sol, plafond
export const LAYER_EQUIPMENT  = 11; // WC, douche, évier, chauffe-eau…
export const LAYER_FURNITURE  = 12; // Lit, tables, chaises, étagères…
export const LAYER_NETWORKS   = 13; // Tuyauterie, électricité (optionnel)
export const LAYER_NEIGHBORS  = 14; // Appartements voisins (fantôme)
export const LAYER_LIDAR      = 15; // Scan LiDAR
export const LAYER_WALKER_DETAIL = 16; // Meshes walker masqués en main camera (FPS) mais visibles dans miroirs (yeux, peau visage)
export const LAYER_MIRRORS       = 17; // Miroirs NISSEDAL / Reflector
export const LAYER_WALKER        = 18; // Personnages 3D
export const LAYER_AI_ZONES      = 19; // Zones IA, cercles, flèches et labels texte
export const LAYER_ANIMALS       = 20; // Animaux autonomes (Oiseau Robin, Chien Shiba Inu)

