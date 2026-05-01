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

/**
 * Computes the axis-aligned bbox of a GLB root in its PARENT's coordinate space,
 * applying the root's own rotation/scale but ignoring the root's translation and
 * all ancestor transforms.
 *
 * Drop-in replacement for:
 *   root.updateMatrixWorld(true);
 *   new THREE.Box3().setFromObject(root)
 * …without the parent-corruption bug that occurs on Suspense remounts where
 * the parent's matrixWorld may already be set to a non-identity transform.
 */
export function glbLocalBBox(root: THREE.Object3D): THREE.Box3 {
  const innerBox = new THREE.Box3();
  const m = new THREE.Matrix4();
  root.traverseVisible(node => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    m.identity();
    let cur: THREE.Object3D | null = node;
    while (cur && cur !== root) {
      cur.updateMatrix();
      m.premultiply(cur.matrix);
      cur = cur.parent;
    }
    innerBox.union(mesh.geometry.boundingBox!.clone().applyMatrix4(m));
  });
  root.updateMatrix();
  const rootRS = root.matrix.clone().setPosition(0, 0, 0);
  return innerBox.applyMatrix4(rootRS);
}
