import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Fusionne les meshes d'un GLB par matériau en un seul mesh par groupe.
 * Réduit massivement les draw calls sur les GLBs IKEA multi-submesh.
 * Appeler après avoir set la scale finale sur root, avant de calculer la bbox.
 * La scale/rotation de root est bakée dans la géométrie ; root.scale reset à 1.
 */
export function mergeGlbByMaterial(root: THREE.Object3D): void {
  const groups = new Map<string, { geos: THREE.BufferGeometry[]; mat: THREE.Material }>();

  root.updateMatrix();
  const rootRS = new THREE.Matrix4().copy(root.matrix).setPosition(0, 0, 0);

  root.traverse(node => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh || Array.isArray(mesh.material)) return;
    const mat = mesh.material as THREE.Material;
    if (!groups.has(mat.uuid)) groups.set(mat.uuid, { geos: [], mat });

    const m = new THREE.Matrix4();
    let cur: THREE.Object3D | null = node;
    while (cur && cur !== root) { cur.updateMatrix(); m.premultiply(cur.matrix); cur = cur.parent; }
    m.premultiply(rootRS);

    const geo = mesh.geometry.clone();
    geo.applyMatrix4(m);
    groups.get(mat.uuid)!.geos.push(geo);
  });

  root.clear();
  root.scale.set(1, 1, 1);
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);

  for (const { geos, mat } of groups.values()) {
    ['uv1', 'uv2', 'color', 'tangent'].forEach(a => {
      if (!geos.every(g => g.hasAttribute(a))) geos.forEach(g => g.deleteAttribute(a));
    });
    const merged = mergeGeometries(geos, false);
    if (!merged) continue;
    const m = new THREE.Mesh(merged, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
  }
}

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
  root.traverse(node => {
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
