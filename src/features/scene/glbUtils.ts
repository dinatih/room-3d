import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Convertit les matériaux transparents (avec texture) en matériaux opaque + alphaTest.
 * Indispensable pour les plantes (feuilles) afin d'éviter l'overdraw massif et les
 * problèmes de tri qui écrasent le FPS.
 */
export function optimizeMaterials(root: THREE.Object3D) {
  root.traverse(node => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      if (!mat) continue;
      // Si c'est transparent et qu'il y a une texture alpha (cas typique des feuilles)
      if ((mat as any).transparent && ((mat as any).map || (mat as any).alphaMap)) {
        (mat as any).transparent = false;
        (mat as any).alphaTest = 0.5;
        mat.needsUpdate = true;
      }
    }
  });
}

/**
 * Fusionne les meshes d'un GLB par matériau en un seul mesh par groupe.
 * Réduit massivement les draw calls sur les GLBs IKEA multi-submesh.
 * Appeler après avoir set la scale finale sur root, avant de calculer la bbox.
 * La scale/rotation de root est bakée dans la géométrie ; root.scale reset à 1.
 */
export function mergeGlbByMaterial(root: THREE.Object3D): void {
  if (root.userData.merged) {
    root.scale.set(1, 1, 1);
    return;
  }
  root.userData.merged = true;
  // On optimise d'abord les matériaux (transparence -> alphaTest)
  optimizeMaterials(root);

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
