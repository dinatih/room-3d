import * as THREE from 'three';
import { ROOM_W, ROOM_D } from '../wallData';
import { cameraState } from '../cameraState';

export const CX = ROOM_W / 2; // 150 cm — centre X de la pièce
export const CZ = ROOM_D / 2; // 200 cm — centre Z du séjour

export const EYE_RATIO  = 0.93; // niveau des yeux ≈ 93% de la taille totale du personnage
export const WALK_SPEED = 2;
export const MOUSE_SENS = 0.002;
export const DEFAULT_ORBIT_DISTANCE = 440; // 440 cm (2x plus loin en vue 3ème personne, initialement 220 cm)
export const DEFAULT_ORBIT_PITCH = Math.PI / 4; // 45° en radians (~0.785 rad) — inclinaison plongeante
export const DEFAULT_FOLLOW_YAW_OFFSET = -3 * Math.PI / 4; // Caméra devant et à gauche du personnage

/** Hauteur caméra en mode marche = niveau des yeux du character (≈ 93% de sa taille). */
export function activeFollowH(): number {
  return cameraState.characterHeight * EYE_RATIO;
}

/** Position perspective par défaut, orientée Nord-Ouest comme la vue ISO NW. */
const PERSPECTIVE_ISO_OFFSET = 500;
export const PERSP_POS: [number, number, number] = [
  ROOM_W / 2 - PERSPECTIVE_ISO_OFFSET,
  PERSPECTIVE_ISO_OFFSET,
  ROOM_D / 2 - PERSPECTIVE_ISO_OFFSET,
];

/** Cible centrale de l'orbite perspective Nord-Ouest. */
export const PERSP_TARGET: [number, number, number] = [ROOM_W / 2, 0, ROOM_D / 2];

/** Position et cible de la caméra en mode 2D Top (centré sur la pièce à 20m d'altitude) */
export const TOP_POS: [number, number, number] = [CX, 2000, CZ];
export const TOP_TARGET: [number, number, number] = [CX, 0, CZ];

// Vecteurs temporaires réutilisables pour useFrame (évite les allocations GC constantes)
export const _tmpOffset = new THREE.Vector3();
export const _tmpSph = new THREE.Spherical();
export const _tmpCamDir = new THREE.Vector3();
export const _tmpCamRight = new THREE.Vector3();
export const _tmpCamForward = new THREE.Vector3();
export const _tmpPanDelta = new THREE.Vector3();
export const _tmpDollyDir = new THREE.Vector3();
