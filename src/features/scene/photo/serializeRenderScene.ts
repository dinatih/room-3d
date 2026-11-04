import * as THREE from 'three';

function binaryAttribute(value: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) {
  let array = value.array;
  if (value instanceof THREE.InterleavedBufferAttribute) {
    array = new (value.array.constructor as typeof Float32Array)(value.count * value.itemSize);
    for (let i = 0; i < value.count; i++) for (let j = 0; j < value.itemSize; j++) array[i * value.itemSize + j] = value.data.array[i * value.data.stride + value.offset + j];
  }
  return {
    itemSize: value.itemSize, type: array.constructor.name, array, normalized: value.normalized,
    ...(value instanceof THREE.Float16BufferAttribute ? { isFloat16BufferAttribute: true } : {}),
    ...(value instanceof THREE.InstancedBufferAttribute ? { isInstancedBufferAttribute: true, meshPerAttribute: value.meshPerAttribute } : {}),
  };
}

function binaryGeometry(source: THREE.BufferGeometry) {
  const copy = Object.create(source) as THREE.BufferGeometry;
  copy.toJSON = () => ({
    metadata: { version: 4.7, type: 'BufferGeometry', generator: 'renderArchive' },
    uuid: source.uuid, type: 'BufferGeometry',
    ...(source instanceof THREE.InstancedBufferGeometry ? { isInstancedBufferGeometry: true, instanceCount: source.instanceCount } : {}),
    data: {
      attributes: Object.fromEntries(Object.entries(source.attributes).map(([key, value]) => [key, binaryAttribute(value)])),
      ...(source.index ? { index: binaryAttribute(source.index) } : {}),
      groups: source.groups,
      morphAttributes: Object.fromEntries(Object.entries(source.morphAttributes).map(([key, values]) => [key, values!.map(binaryAttribute)])),
      morphTargetsRelative: source.morphTargetsRelative,
    },
  }) as unknown as ReturnType<THREE.BufferGeometry['toJSON']>;
  return copy;
}

function binaryTexture(texture: THREE.Texture) {
  const image = texture.image as { data?: THREE.TypedArray; width: number; height: number };
  if (!image?.data) return texture;
  const data = image.data;
  const copy = Object.create(texture) as THREE.Texture;
  copy.source = Object.create(texture.source);
  copy.source.toJSON = meta => {
    const result = { uuid: texture.source.uuid, url: { data, width: image.width, height: image.height, type: data.constructor.name } };
    if (meta && typeof meta !== 'string') (meta as { images: Record<string, unknown> }).images[result.uuid] = result;
    return result as unknown as ReturnType<THREE.Texture['source']['toJSON']>;
  };
  return copy;
}

/** Snapshot visible uniquement, avec les UUID des os et des cibles de lumière conservés. */
export function serializeRenderScene(scene: THREE.Scene) {
  const snapshot = scene.clone(false);
  snapshot.background = scene.background instanceof THREE.Texture ? scene.environment : scene.background;
  if (snapshot.environment) snapshot.environment = binaryTexture(snapshot.environment);
  if (snapshot.background instanceof THREE.Texture) snapshot.background = binaryTexture(snapshot.background);
  const copyVisible = (source: THREE.Object3D, parent: THREE.Object3D) => {
    if (!source.visible) return;
    const copy = source.clone(false);
    copy.uuid = source.uuid;
    if (source instanceof THREE.DirectionalLight || source instanceof THREE.SpotLight) {
      (copy as THREE.DirectionalLight | THREE.SpotLight).target = source.target;
    }
    if (copy instanceof THREE.Mesh) {
      copy.geometry = binaryGeometry(copy.geometry);
      if (copy instanceof THREE.InstancedMesh) {
        for (const key of ['instanceMatrix', 'instanceColor'] as const) {
          const original = copy[key];
          if (!original) continue;
          const attribute = Object.create(original);
          attribute.toJSON = () => binaryAttribute(original);
          copy[key] = attribute;
        }
      }
      const material = (source: THREE.Material) => {
        const result = Object.create(source);
        for (const [key, value] of Object.entries(source)) if (value instanceof THREE.Texture) result[key] = binaryTexture(value);
        return result as THREE.Material;
      };
      copy.material = Array.isArray(copy.material) ? copy.material.map(material) : material(copy.material);
    }
    parent.add(copy);
    source.children.forEach(child => copyVisible(child, copy));
  };
  scene.children.forEach(child => copyVisible(child, snapshot));
  return snapshot.toJSON();
}
