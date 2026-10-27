import * as THREE from 'three';

type WireframeMaterial = THREE.Material & { wireframe: boolean };
const requests = new WeakMap<WireframeMaterial, { original: boolean; owners: Set<object> }>();

function setWireframe(material: WireframeMaterial, enabled: boolean) {
  if (material.wireframe === enabled) return;
  material.wireframe = enabled;
  material.needsUpdate = true;
}

/** Combine overlapping requests and restore each material when its last owner leaves. */
export function enableWireframe(root: THREE.Object3D, invalidate: () => void): () => void {
  const owner = {};
  let materials = new Set<WireframeMaterial>(), disposed = false, pending = false;
  const release = (material: WireframeMaterial) => {
    const state = requests.get(material)!;
    state.owners.delete(owner);
    if (state.owners.size) return;
    setWireframe(material, state.original);
    requests.delete(material);
  };
  const refresh = () => {
    const next = new Set<WireframeMaterial>();
    const visit = (object: THREE.Object3D) => {
      if (object.name === 'SkySphere' || object.name === 'skysphere' || object.userData.isSky) return;
      const mesh = object as THREE.Mesh;
      if (mesh.isMesh) {
        for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
          if ('wireframe' in material) next.add(material as WireframeMaterial);
        }
      }
      object.children.forEach(visit);
    };
    visit(root);
    for (const material of materials) if (!next.has(material)) release(material);
    for (const material of next) {
      if (!materials.has(material)) {
        let state = requests.get(material);
        if (!state) {
          state = { original: material.wireframe, owners: new Set() };
          requests.set(material, state);
        }
        state.owners.add(owner);
      }
      setWireframe(material, true);
    }
    materials = next;
    invalidate();
  };
  // Batch GLB and merged-mesh additions; never traverse the scene every frame.
  const schedule = () => {
    if (pending) return;
    pending = true;
    queueMicrotask(() => { pending = false; if (!disposed) refresh(); });
  };
  const added = ({ child }: { child: THREE.Object3D }) => { observe(child, true); schedule(); };
  const removed = ({ child }: { child: THREE.Object3D }) => { observe(child, false); schedule(); };
  const observe = (object: THREE.Object3D, active: boolean) => object.traverse(node => {
    const method = active ? 'addEventListener' : 'removeEventListener';
    node[method]('childadded', added);
    node[method]('childremoved', removed);
  });
  observe(root, true);
  refresh();
  return () => {
    disposed = true;
    observe(root, false);
    materials.forEach(release);
    invalidate();
  };
}
