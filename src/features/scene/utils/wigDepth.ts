import * as THREE from 'three';

/** Write depth only for fully opaque hair texels; keep blended wisps unchanged. */
export function updateWigDepth(mesh: THREE.Mesh): void {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const previous = mesh.children.find(child => child.userData.wigOpaqueDepth) as THREE.Mesh | undefined;
  if (previous) {
    mesh.remove(previous);
    for (const material of Array.isArray(previous.material) ? previous.material : [previous.material]) material.dispose();
  }
  if (!materials.some(material => material.transparent)) return;
  const depthMaterials = materials.map(material => {
    // Keep identical skin/morph shader inputs in both passes.
    const depth = material.clone();
    depth.onBeforeCompile = material.onBeforeCompile;
    depth.colorWrite = false; depth.depthWrite = true; depth.transparent = false;
    depth.alphaTest = 1; depth.forceSinglePass = true;
    depth.visible = material.visible && material.transparent;
    depth.userData.__ownedWigMaterial = true;
    return depth;
  });
  const material = Array.isArray(mesh.material) ? depthMaterials : depthMaterials[0];
  const source = mesh as THREE.SkinnedMesh;
  let depth: THREE.Mesh;
  if (source.isSkinnedMesh) {
    const skin = new THREE.SkinnedMesh(mesh.geometry, material);
    skin.skeleton = source.skeleton;
    skin.bindMode = source.bindMode;
    skin.bindMatrix.copy(source.bindMatrix);
    skin.bindMatrixInverse.copy(source.bindMatrixInverse);
    skin.morphTargetInfluences = source.morphTargetInfluences;
    skin.morphTargetDictionary = source.morphTargetDictionary;
    // Both passes have the same pose: reuse its bounds and bone palette too.
    skin.computeBoundingSphere = () => source.computeBoundingSphere();
    Object.defineProperty(skin, 'boundingSphere', { configurable: true, get: () => source.boundingSphere });
    depth = skin;
  } else depth = new THREE.Mesh(mesh.geometry, material);
  depth.name = 'WigOpaqueDepth';
  depth.userData.wigOpaqueDepth = true;
  depth.layers.mask = mesh.layers.mask;
  depth.frustumCulled = mesh.frustumCulled;
  depth.raycast = () => {};
  mesh.add(depth);
}
