import * as THREE from 'three';
import { mergeGlbByMaterial } from '../glbUtils.ts';

const preparedScenes = new WeakMap<THREE.Group, THREE.Group>();

/** Immutable template survives aborted Suspense renders; callers clone it. */
export function getPreparedLaptopScene(scene: THREE.Group): THREE.Group {
  let prepared = preparedScenes.get(scene);
  if (!prepared) {
    prepared = prepareLaptopScene(scene);
    preparedScenes.set(scene, prepared);
  }
  return prepared;
}

/** Geometry, port layout and colors are authored in framework-laptop13.blend. */
export function prepareLaptopScene(scene: THREE.Group): THREE.Group {
  const c = scene.clone(true);
  // Also assigns the shared scene shadow/material settings. No CAD edits here.
  mergeGlbByMaterial(c);
  return c;
}
