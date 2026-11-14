import { BufferGeometry, type Material, type Object3D, SkinnedMesh } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { enableAnimatedFrustumCulling } from '../utils/animatedFrustumCulling';

const prepared = new WeakSet<Object3D>();
const geometries = new WeakMap<BufferGeometry, WeakMap<BufferGeometry, BufferGeometry>>();
const materialKeys = new WeakMap<Material, string>();
const pairs = [['eye2', 'eyes'], ['handgun_left', 'handgun_right'], ['handgun_left_holster', 'handgun_right_holster']] as const;

function materialKey(material: Material): string {
  const cached = materialKeys.get(material);
  if (cached !== undefined) return cached;
  // Called on immutable loader materials, before per-character style clones.
  // Avoid serializing their textures again for every instance of Lara.
  const { uuid, name, ...properties } = material.toJSON();
  const key = JSON.stringify(properties);
  materialKeys.set(material, key);
  return key;
}

/** Only pairs with identical styling, visibility and skin palettes are joined. */
export function mergeLaraPairs(root: Object3D): void {
  if (prepared.has(root)) return;
  for (const [leftName, rightName] of pairs) {
    const left = root.getObjectByName(leftName), right = root.getObjectByName(rightName);
    if (!(left instanceof SkinnedMesh) || !(right instanceof SkinnedMesh) ||
        left.parent !== right.parent || left.children.length || right.children.length ||
        !left.matrix.equals(right.matrix) || left.skeleton !== right.skeleton ||
        !left.bindMatrix.equals(right.bindMatrix) || left.bindMode !== right.bindMode ||
        left.layers.mask !== right.layers.mask || left.visible !== right.visible ||
        left.castShadow !== right.castShadow || left.receiveShadow !== right.receiveShadow ||
        left.renderOrder !== right.renderOrder || Array.isArray(left.material) || Array.isArray(right.material) ||
        materialKey(left.material) !== materialKey(right.material) ||
        Object.keys(left.geometry.morphAttributes).length || Object.keys(right.geometry.morphAttributes).length ||
        left.geometry.groups.length || right.geometry.groups.length ||
        left.geometry.drawRange.start !== 0 || right.geometry.drawRange.start !== 0 ||
        left.geometry.drawRange.count !== Infinity || right.geometry.drawRange.count !== Infinity) {
      throw new Error(`Incompatible Lara pair: ${leftName}, ${rightName}`);
    }
    let matches = geometries.get(left.geometry);
    let geometry = matches?.get(right.geometry);
    if (!geometry) {
      geometry = mergeGeometries([left.geometry, right.geometry], false) ?? undefined;
      if (!geometry) throw new Error(`Unable to merge Lara pair: ${leftName}, ${rightName}`);
      if (!matches) { matches = new WeakMap(); geometries.set(left.geometry, matches); }
      matches.set(right.geometry, geometry);
    }
    left.geometry = geometry;
    // Keep the left semantic name: both eyes are head/internal meshes, while
    // each pistol pair belongs to one existing equipment visibility category.
    right.removeFromParent();
    enableAnimatedFrustumCulling(left);
  }
  prepared.add(root);
}
