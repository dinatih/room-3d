import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Only geometries with the same attribute layout can be merged without data loss. */
export function geometryLayoutKey(geometry: THREE.BufferGeometry): string {
  const layout = (attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) => [
    attribute.itemSize, attribute.normalized,
    (attribute instanceof THREE.InterleavedBufferAttribute ? attribute.data.array : attribute.array).constructor.name,
    'gpuType' in attribute ? attribute.gpuType : null,
  ];
  return JSON.stringify([
    !!geometry.index, geometry.morphTargetsRelative,
    Object.keys(geometry.attributes).sort().map(name => [name, layout(geometry.attributes[name])]),
    Object.keys(geometry.morphAttributes).sort().map(name => [name,
      geometry.morphAttributes[name as keyof typeof geometry.morphAttributes]!.map(layout)]),
  ]);
}

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
        (mat as any).depthWrite = true;
        if ('transmission' in mat) (mat as any).transmission = 0;
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
  // On optimise d'abord les matériaux (transparence -> alphaTest)
  optimizeMaterials(root);

  const groups = new Map<string, { geos: THREE.BufferGeometry[]; mat: THREE.Material; renderOrder: number }>();

  root.updateMatrix();
  const rootRS = new THREE.Matrix4().copy(root.matrix).setPosition(0, 0, 0);

  root.traverse(node => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh || !mesh.visible || Array.isArray(mesh.material)) return;
    const mat = mesh.material as THREE.Material;
    const order = mesh.renderOrder || 0;
    const key = `${mat.uuid}_ro${order}|${geometryLayoutKey(mesh.geometry)}`;
    if (!groups.has(key)) groups.set(key, { geos: [], mat, renderOrder: order });

    const m = new THREE.Matrix4();
    let cur: THREE.Object3D | null = node;
    while (cur && cur !== root) { cur.updateMatrix(); m.premultiply(cur.matrix); cur = cur.parent; }
    m.premultiply(rootRS);

    const geo = mesh.geometry.clone();
    geo.applyMatrix4(m);
    groups.get(key)!.geos.push(geo);
  });

  const meshes: THREE.Mesh[] = [];
  for (const { geos, mat, renderOrder } of groups.values()) {
    const merged = mergeGeometries(geos, false);
    geos.forEach(geometry => geometry.dispose());
    if (!merged) throw new Error(`Cannot merge GLB geometry: ${root.name}`);
    const m = new THREE.Mesh(merged, mat);
    m.renderOrder = renderOrder;
    m.castShadow = true;
    m.receiveShadow = true;
    meshes.push(m);
  }
  root.clear();
  root.scale.set(1, 1, 1);
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.add(...meshes);
  root.userData.merged = true;
}

/**
 * Supprime les faces orientées vers l'arrière (+Z dans le repère local normalisé)
 * pour permettre la vue à travers (see-through) depuis le dos de l'objet (ex: miroirs).
 */
export function removeGlbBackFaces(root: THREE.Object3D, frameWidth: number) {
  root.traverse(node => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    const geo = mesh.geometry;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach(material => { material.side = THREE.FrontSide; });
    const positions = geo.getAttribute('position');
    geo.computeBoundingBox();
    const bounds = geo.boundingBox!;
    const index = geo.getIndex();
    const indices: number[] = [];
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    const normal = new THREE.Vector3();

    for (let i = 0; i < (index ? index.count : positions.count); i += 3) {
      const vertices = [0, 1, 2].map(offset => index ? index.getX(i + offset) : i + offset);
      a.fromBufferAttribute(positions, vertices[0]);
      b.fromBufferAttribute(positions, vertices[1]);
      c.fromBufferAttribute(positions, vertices[2]);
      const isFrame = Math.max(a.x, b.x, c.x) <= bounds.min.x + frameWidth
        || Math.min(a.x, b.x, c.x) >= bounds.max.x - frameWidth
        || Math.max(a.y, b.y, c.y) <= bounds.min.y + frameWidth
        || Math.min(a.y, b.y, c.y) >= bounds.max.y - frameWidth;
      normal.crossVectors(b.sub(a), c.sub(a));
      // La direction dominante du triangle distingue le dos du dessus du cadre.
      // Les normales lissées des sommets servent à l'éclairage, pas à la découpe.
      // Conserver les traverses étroites du cadre, y compris leur face arrière.
      if (normal.z > Math.max(Math.abs(normal.x), Math.abs(normal.y)) && !isFrame) continue;
      indices.push(...vertices);
    }
    geo.setIndex(indices);
  });
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
 * Set precise to measure posed vertices rather than transformed local AABBs.
 *
 * Drop-in replacement for:
 *   root.updateMatrixWorld(true);
 *   new THREE.Box3().setFromObject(root)
 * …without the parent-corruption bug that occurs on Suspense remounts where
 * the parent's matrixWorld may already be set to a non-identity transform.
 */
export function glbLocalBBox(root: THREE.Object3D, precise = false): THREE.Box3 {
  // Les sommets skinnés dépendent des matrices des os, pas seulement du mesh.
  root.updateWorldMatrix(true, false);
  root.updateMatrixWorld(true); // actualise aussi bindMatrixInverse des SkinnedMesh
  root.updateMatrix();
  const rootRS = root.matrix.clone().setPosition(0, 0, 0);
  const innerBox = new THREE.Box3();
  const m = new THREE.Matrix4();
  const vertex = new THREE.Vector3();
  root.traverse(node => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    m.identity();
    let cur: THREE.Object3D | null = node;
    while (cur && cur !== root) {
      cur.updateMatrix();
      m.premultiply(cur.matrix);
      cur = cur.parent;
    }
    if (precise) {
      // Transform vertices directly: rotating a local AABB overestimates the
      // dimensions of FBX meshes whose object axes differ from their geometry.
      m.premultiply(rootRS);
      const count = mesh.geometry.getAttribute('position').count;
      for (let index = 0; index < count; index++) {
        mesh.getVertexPosition(index, vertex);
        innerBox.expandByPoint(vertex.applyMatrix4(m));
      }
      return;
    }
    let box: THREE.Box3;
    if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) {
      const skinned = mesh as THREE.SkinnedMesh;
      skinned.computeBoundingBox();
      box = skinned.boundingBox!;
    } else {
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      box = mesh.geometry.boundingBox!;
    }
    innerBox.union(box.clone().applyMatrix4(m));
  });
  return precise ? innerBox : innerBox.applyMatrix4(rootRS);
}
