import * as THREE from 'three';
import { NEIGHBOR_OFFSETS } from '../environmentData';

const east = NEIGHBOR_OFFSETS[1];
/** Une seule station, dans le jardin du voisin Est, à l'écart de la baie vitrée. */
export const ULOTTE_BOWL_POSITION: [number, number, number] = [east.x + 170, 0, east.z - 60];
export const DOG_BOWL = { radius: 10, height: 6, foodHeight: 4 };
/** Enregistrée uniquement par la gamelle de la scène, jamais par une preview. */
export const dogFeedingStation = { position: null as THREE.Vector3 | null };
