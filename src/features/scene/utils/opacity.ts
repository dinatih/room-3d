import * as THREE from 'three';

/** Clone materials so shared furniture and inventory previews keep their appearance. */
export function applyOpacity(root: THREE.Object3D, opacity: number, invalidate: () => void) {
  const originals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  let disposed = false;
  const refresh = () => {
    if (disposed) return;
    root.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh || originals.has(mesh)) return;
      originals.set(mesh, mesh.material);
      const clone = (material: THREE.Material) => {
        const copy = material.clone();
        copy.opacity = opacity;
        copy.transparent = true;
        copy.depthWrite = false;
        return copy;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(clone) : clone(mesh.material);
    });
    invalidate();
  };
  const added = ({ child }: { child: THREE.Object3D }) => {
    observe(child, true);
    queueMicrotask(refresh);
  };
  const removed = ({ child }: { child: THREE.Object3D }) => observe(child, false);
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
    originals.forEach((material, mesh) => {
      for (const copy of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) copy.dispose();
      mesh.material = material;
    });
    invalidate();
  };
}
