// =============================================
// GEOMETRY MERGE UTILITIES
// =============================================
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three';

/**
 * After loading a GLB, merge sub-meshes that share the same material
 * into one Mesh per material group. Skips SkinnedMesh and multi-material meshes.
 * Original meshes and CAD edge lines are removed and disposed to free GPU memory.
 * Cloning still works: the merged mesh is a child of root, so clone(true) copies it.
 *
 * Call AFTER any material overrides so grouped meshes already have their
 * final materials.  Call BEFORE or AFTER scale/position on root — both work,
 * because we compute positions in root-local space.
 *
 * @param {THREE.Object3D} root  gltf.scene or any group
 */
export function mergeGlbByMaterial(root) {
  // Ensure all world matrices are up to date (including root's own transforms)
  root.updateMatrixWorld(true);
  const rootInv = new THREE.Matrix4().copy(root.matrixWorld).invert();

  // Group meshes by material uuid
  const byMat = new Map(); // uuid → { mat, geos[], layersMask, castShadow }
  const toRemove = []; // originals + edge lines to dispose after traversal

  root.traverse(obj => {
    // Remove CAD edge lines embedded in GLBs
    if (obj.isLine) { toRemove.push(obj); return; }

    if (!obj.isMesh || obj.isSkinnedMesh) return;
    if (Array.isArray(obj.material))      return; // skip multi-material

    const mat = obj.material;
    const key = mat.uuid;

    // Clone geometry and bake all intermediate transforms into root-local space
    const geo = obj.geometry.clone();
    const localM = new THREE.Matrix4().multiplyMatrices(rootInv, obj.matrixWorld);
    geo.applyMatrix4(localM);

    if (!byMat.has(key)) {
      byMat.set(key, {
        mat,
        geos:       [],
        layersMask: obj.layers.mask,
        castShadow: obj.castShadow,
      });
    }
    byMat.get(key).geos.push(geo);
    toRemove.push(obj); // mark for removal after traversal
  });

  // Remove and dispose all originals (safe: geometry already cloned above)
  for (const obj of toRemove) {
    obj.geometry?.dispose();
    obj.parent?.remove(obj);
  }

  for (const { mat, geos, layersMask, castShadow } of byMat.values()) {
    if (!geos.length) continue;

    // Normalize attributes: keep only those present in every geometry
    if (geos.length > 1) {
      const common = Object.keys(geos[0].attributes)
        .filter(name => geos.every(g => g.attributes[name] !== undefined));
      for (const geo of geos) {
        for (const name of Object.keys(geo.attributes)) {
          if (!common.includes(name)) geo.deleteAttribute(name);
        }
      }
    }

    const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    geos.forEach(g => { if (g !== merged) g.dispose(); });
    if (!merged) continue;

    merged.computeVertexNormals();
    merged.computeBoundingSphere();

    const mesh        = new THREE.Mesh(merged, mat);
    mesh.castShadow   = castShadow;
    mesh.receiveShadow = true;
    mesh.layers.mask   = layersMask || 1; // default layer 0 if not set
    root.add(mesh);
  }
}
