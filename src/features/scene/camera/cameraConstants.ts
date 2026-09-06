import * as THREE from 'three';
import { ROOM_W, ROOM_D, WALL_H } from '@config';
import { cameraState } from '../cameraState';

export const CX = ROOM_W / 2; // 150 cm — centre X de la pièce
export const CZ = ROOM_D / 2; // 200 cm — centre Z du séjour

export const EYE_RATIO  = 0.93; // niveau des yeux ≈ 93% de la taille totale du personnage
export const WALK_SPEED = 2;
export const MOUSE_SENS = 0.002;

/** Hauteur caméra en mode marche = niveau des yeux du walker (≈ 93% de sa taille). */
export function activeWalkH(): number {
  return cameraState.walkerHeight * EYE_RATIO;
}

/**
 * Position de départ de la caméra en mode Perspective / Orbit :
 * X = ROOM_W / 2 = 150 cm (centré horizontalement)
 * Y = 1000 cm = 10 m (vue en hauteur / plongée)
 * Z = -150 cm (reculé vers le nord, côté jardin, regardant vers le sud)
 */
export const PERSP_POS: [number, number, number] = [ROOM_W / 2, 1000, -150];

/**
 * Cible (look-at target) de la caméra en mode Orbit :
 * X = ROOM_W / 2 = 150 cm (centré)
 * Y = WALL_H / 3 = 83.3 cm (tiers inférieur de la hauteur des murs)
 * Z = ROOM_D / 2 = 200 cm (centre de la pièce)
 */
export const PERSP_TARGET: [number, number, number] = [ROOM_W / 2, WALL_H / 3, ROOM_D / 2];

// Vecteurs temporaires réutilisables pour useFrame (évite les allocations GC constantes)
export const _tmpOffset = new THREE.Vector3();
export const _tmpSph = new THREE.Spherical();
export const _tmpCamDir = new THREE.Vector3();
export const _tmpCamRight = new THREE.Vector3();
export const _tmpCamForward = new THREE.Vector3();
export const _tmpPanDelta = new THREE.Vector3();
export const _tmpDollyDir = new THREE.Vector3();
