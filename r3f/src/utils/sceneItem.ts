/**
 * sceneItem.ts — props neutres réutilisables pour les composants items/
 * placés dans la scène (sans inventaire ni action).
 */
import * as THREE from 'three';

export const NOOP_ITEM:  any                      = {};
export const NOOP_STATE: Record<string, boolean>  = {};
export const NOOP_SIZE  = (_: THREE.Vector3) => {};
