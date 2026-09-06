import * as THREE from 'three';
import { LAYER_WALKER_DETAIL, LAYER_WALKER } from '@config';
import { isHeadMesh } from '../characterParts';

/** Met à jour les layers Three.js de l'ensemble du personnage (corps vs tête/visage pour FPV vs miroir) */
export function updateCharacterLayers(root: THREE.Object3D, isFirstPerson: boolean) {
  root.traverse(o => {
    if ((o as THREE.Mesh).isMesh) {
      if (isFirstPerson && isHeadMesh(o)) {
        o.layers.set(LAYER_WALKER_DETAIL);
      } else {
        o.layers.set(LAYER_WALKER);
      }
    }
  });
}
