import * as THREE from 'three';

/**
 * three-gpu-pathtracer 0.0.24 assigns one material slot per mesh, even when
 * mesh.material is an array. Supply one mesh per drawn geometry group instead.
 * Reuse the source mesh for the first group to preserve its children/skeleton.
 */
export function splitMultiMaterialMeshes(scene: THREE.Scene): () => void {
  const sources: THREE.Mesh[] = [];
  scene.traverseVisible(object => {
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh && Array.isArray(mesh.material)) sources.push(mesh);
  });

  const replacements: {
    source: THREE.Mesh;
    geometry: THREE.BufferGeometry;
    materials: THREE.Material[];
    parts: THREE.Mesh[];
    geometries: THREE.BufferGeometry[];
  }[] = [];

  const restore = () => {
    for (const { source, geometry, materials, parts, geometries } of replacements) {
      source.geometry = geometry;
      source.material = materials;
      for (const part of parts) {
        if (part !== source) part.removeFromParent();
      }
      for (const temporary of geometries) temporary.dispose();
    }
    replacements.length = 0;
  };

  try {
    for (const source of sources) {
      const geometry = source.geometry;
      const materials = source.material as THREE.Material[];
      const totalCount = geometry.index?.count ?? geometry.attributes.position.count;
      const parts: THREE.Mesh[] = [];
      const geometries: THREE.BufferGeometry[] = [];
      replacements.push({ source, geometry, materials, parts, geometries });

      for (const group of geometry.groups) {
        const material = materials[group.materialIndex ?? 0];
        if (!material) {
          throw new Error(`[Raytracing] Invalid material ${group.materialIndex} on mesh "${source.name || source.uuid}".`);
        }
        const start = Math.max(group.start, geometry.drawRange.start);
        const end = Math.min(group.start + group.count, geometry.drawRange.start + geometry.drawRange.count, totalCount);
        if (end <= start) continue;
        if (!Number.isInteger(start) || !Number.isInteger(end) || start % 3 !== 0 || end % 3 !== 0) {
          throw new Error(`[Raytracing] Incomplete triangle group on mesh "${source.name || source.uuid}".`);
        }

        // Restrict the actual index buffer: the path tracer ignores drawRange.
        const indices = new Array<number>(end - start);
        for (let i = start; i < end; i++) indices[i - start] = geometry.index ? geometry.index.getX(i) : i;
        const partGeometry = geometry.clone();
        geometries.push(partGeometry);
        partGeometry.setIndex(indices);
        partGeometry.clearGroups();
        partGeometry.setDrawRange(0, indices.length);

        const part = source.clone(false);
        part.geometry = partGeometry;
        part.material = material;
        parts.push(part);
      }

      // An array material with no drawn groups contributes no triangles.
      if (parts.length === 0) {
        const part = source.clone(false);
        part.geometry = new THREE.BufferGeometry();
        geometries.push(part.geometry);
        part.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
        part.material = materials[0];
        if (!part.material) throw new Error(`[Raytracing] Empty material array on mesh "${source.name || source.uuid}".`);
        parts.push(part);
      }

      const first = parts[0];
      source.geometry = first.geometry;
      source.material = first.material;
      parts[0] = source;
      for (const part of parts.slice(1)) source.parent!.add(part);
    }
    scene.updateMatrixWorld(true);
    return restore;
  } catch (error) {
    restore();
    throw error;
  }
}
