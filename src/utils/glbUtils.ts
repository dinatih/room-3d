import * as THREE from 'three';

/**
 * Supprime les objets Line (arêtes CAD) embarqués dans les GLBs.
 * Équivalent du filtrage dans mergeGlbByMaterial() du JS vanilla.
 */
export function removeGlbLines(root: THREE.Object3D) {
  const toRemove: THREE.Object3D[] = [];
  root.traverse(obj => {
    if ((obj as THREE.Line).isLine) toRemove.push(obj);
  });
  toRemove.forEach(obj => obj.parent?.remove(obj));
}
