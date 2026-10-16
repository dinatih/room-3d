import { InstancedMesh, DynamicDrawUsage, Group, Matrix4, Mesh, type Object3D, type Material } from 'three';

const noRaycast: Mesh['raycast'] = () => {};

/** Batch rigid robot links without replacing their animation/measurement hierarchy. */
export function createRigidMeshBatches(source: Object3D, target: Group) {
  target.name = source.name;
  target.userData = { ...source.userData };
  const groups = new Map<string, Mesh[]>();
  const materialKeys = new Map<Material, string>();
  source.traverse(object => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    if (mesh.type !== 'Mesh' || Array.isArray(mesh.material) || mesh.geometry.groups.length || mesh.children.length ||
        Object.keys(mesh.geometry.morphAttributes).length || mesh.customDepthMaterial || mesh.customDistanceMaterial) {
      throw new Error(`Unsupported rigid robot mesh: ${mesh.name}`);
    }
    let key = materialKeys.get(mesh.material);
    if (!key) {
      const json = Object.fromEntries(Object.entries(mesh.material.toJSON()).filter(([name]) => name !== 'uuid' && name !== 'name'));
      key = JSON.stringify(json) + mesh.material.customProgramCacheKey();
      materialKeys.set(mesh.material, key);
    }
    const attributes = Object.entries(mesh.geometry.attributes).sort(([a], [b]) => a.localeCompare(b))
      .map(([name, attribute]) => [name, attribute.itemSize, attribute.normalized, attribute.array.constructor.name]);
    key += JSON.stringify([attributes, !!mesh.geometry.index, mesh.layers.mask, mesh.castShadow, mesh.receiveShadow, mesh.renderOrder, mesh.geometry.drawRange.start, mesh.geometry.drawRange.count]);
    const list = groups.get(key) ?? [];
    list.push(mesh);
    groups.set(key, list);
  });
  const records: { mesh: Mesh; mask: number; batch: Mesh; instance: number; matrix: Matrix4; originalVisible: boolean; raycast: Mesh['raycast'] }[] = [];
  const batches: Mesh[] = [];
  function sameGeometry(a: Mesh['geometry'], b: Mesh['geometry']) {
    if (a === b) return true;
    const equal = (x: ArrayBufferView, y: ArrayBufferView) => {
      if (x.byteLength !== y.byteLength) return false;
      const first = new Uint8Array(x.buffer, x.byteOffset, x.byteLength);
      const second = new Uint8Array(y.buffer, y.byteOffset, y.byteLength);
      return first.every((value, index) => value === second[index]);
    };
    if (a.index && b.index && !equal(a.index.array, b.index.array)) return false;
    return Object.keys(a.attributes).every(name => equal(a.attributes[name].array, b.attributes[name].array));
  }
  for (const compatible of groups.values()) {
    const geometries: Mesh[][] = [];
    for (const mesh of compatible) {
      const same = geometries.find(group => sameGeometry(group[0].geometry, mesh.geometry));
      if (same) same.push(mesh); else geometries.push([mesh]);
    }
    for (const meshes of geometries) {
      const first = meshes[0];
      const material = compatible[0].material as Material;
      const batch = meshes.length > 1 ? new InstancedMesh(first.geometry, material, meshes.length) : new Mesh(first.geometry, material);
      if (batch instanceof InstancedMesh) batch.instanceMatrix.setUsage(DynamicDrawUsage);
      else batch.matrixAutoUpdate = false;
      batch.userData.rigidRobotGroup = true;
      batch.name = `${source.name}:rigid-instances`;
      batch.layers.mask = first.layers.mask;
      batch.castShadow = first.castShadow;
      batch.receiveShadow = first.receiveShadow;
      batch.renderOrder = first.renderOrder;
      for (const mesh of meshes) {
        records.push({ mesh, mask: mesh.layers.mask, batch, instance: -1, matrix: new Matrix4(), originalVisible: mesh.visible, raycast: mesh.raycast });
        // Visual leaves remain available to the animation and foot measurements.
        mesh.visible = false;
        mesh.raycast = noRaycast;
      }
      batches.push(batch);
      target.add(batch);
    }
  }
  target.matrixAutoUpdate = false;
  const matrix = new Matrix4();
  const links = batches.map(batch => ({ batch, records: records.filter(record => record.batch === batch) }));
  function update() {
    source.traverse(node => { if (node.matrixAutoUpdate) node.updateMatrix(); });
    target.matrix.copy(source.matrix);
    target.matrixWorldNeedsUpdate = true;
    target.visible = source.visible;
    for (const { batch, records } of links) {
      let instance = 0, changed = false;
      for (const record of records) {
        matrix.copy(record.mesh.matrix);
        let visible = record.originalVisible;
        for (let parent = record.mesh.parent; parent && parent !== source; parent = parent.parent) {
          matrix.premultiply(parent.matrix);
          visible &&= parent.visible;
        }
        if (matrix.determinant() <= 0) throw new Error(`Invalid rigid robot transform: ${record.mesh.name}`);
        if (visible) {
          if (record.instance !== instance || !matrix.equals(record.matrix)) {
            if (batch instanceof InstancedMesh) batch.setMatrixAt(instance, matrix);
            else { batch.matrix.copy(matrix); batch.matrixWorldNeedsUpdate = true; }
            record.matrix.copy(matrix);
            changed = true;
          }
          record.instance = instance++;
        } else record.instance = -1;
      }
      if (batch instanceof InstancedMesh) {
        changed ||= batch.count !== instance;
        batch.count = instance;
        if (changed) {
          batch.instanceMatrix.needsUpdate = true;
          batch.computeBoundingBox();
          batch.computeBoundingSphere();
        }
      } else batch.visible = instance > 0;
    }
  }
  update();
  return {
    batches, records, update,
    dispose() {
      for (const { mesh, mask, originalVisible, raycast } of records) { mesh.layers.mask = mask; mesh.visible = originalVisible; mesh.raycast = raycast; }
      for (const batch of batches) { target.remove(batch); if (batch instanceof InstancedMesh) batch.dispose(); }
    },
  };
}
