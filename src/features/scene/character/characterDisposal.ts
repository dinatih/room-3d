import * as THREE from 'three';

/**
 * Parcourt récursivement la hiérarchie 3D d'un personnage pour libérer complètement la VRAM et la RAM :
 * - Géométries GPU (BufferGeometry)
 * - Matériaux (MeshStandardMaterial, MeshBasicMaterial, etc.)
 * - Textures GPU (albedo, normal, roughness, metalness, ao, specular, emissive, alpha, etc.)
 */
export function disposeCharacterResources(root: THREE.Object3D) {
  const disposedGeometries = new Set<THREE.BufferGeometry>();
  const disposedMaterials = new Set<THREE.Material>();
  const disposedTextures = new Set<THREE.Texture>();

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) {
      if (mesh.geometry && !disposedGeometries.has(mesh.geometry)) {
        disposedGeometries.add(mesh.geometry);
        mesh.geometry.dispose();
      }

      const rawMats = mesh.material;
      if (rawMats) {
        const materials = Array.isArray(rawMats) ? rawMats : [rawMats];
        for (const mat of materials) {
          if (!mat || disposedMaterials.has(mat)) continue;
          disposedMaterials.add(mat);

          for (const key of Object.keys(mat)) {
            const prop = (mat as any)[key];
            if (prop && typeof prop === 'object' && prop.isTexture && !disposedTextures.has(prop)) {
              disposedTextures.add(prop);
              prop.dispose();
            }
          }
          mat.dispose();
        }
      }
    }
  });
}
