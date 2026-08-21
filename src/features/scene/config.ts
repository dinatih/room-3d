// =============================================
// CONFIG
// =============================================
// 1 unit = 1cm
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

