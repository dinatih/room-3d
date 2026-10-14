import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { glbLocalBBox } from '../../glbUtils';
import { useNavigationEnabled } from './NavigationContext';
import { registerObstacle, unregisterObstacle } from './obstacles';
import { convexHull, type Polygon } from './geometry';

/** Capture the rendered item's local bounds once; follow its placement, including animated moves. */
export function NavigationObstacle({ id, owner = id, compound = false, hull = false, solidOnly = false, children }: { id: string; owner?: string; compound?: boolean; hull?: boolean; solidOnly?: boolean; children: ReactNode }) {
  const enabled = useNavigationEnabled();
  const ref = useRef<THREE.Group>(null!);
  const bounds = useRef<THREE.Box3[]>([]);
  const footprints = useRef<Polygon[]>([]);
  const previousMatrix = useRef(new THREE.Matrix4().makeScale(0, 0, 0));
  const update = () => {
    if (!enabled || !bounds.current.length) return;
    ref.current.updateWorldMatrix(true, false);
    if (previousMatrix.current.equals(ref.current.matrixWorld)) return;
    previousMatrix.current.copy(ref.current.matrixWorld);
    for (const [i, b] of bounds.current.entries()) {
      const corners = footprints.current[i].map(p => new THREE.Vector3(p.x, 0, p.z).applyMatrix4(ref.current.matrixWorld));
      const worldBox = b.clone().applyMatrix4(ref.current.matrixWorld);
      registerObstacle({ id: `${id}:${i}`, owner, polygon: corners.map(p => ({ x: p.x, z: p.z })), yMin: worldBox.min.y, yMax: worldBox.max.y });
    }
  };
  useLayoutEffect(() => {
    if (!enabled) return;
    ref.current.scale.set(1, 1, 1);
    let root = ref.current as THREE.Object3D;
    if (compound) while (root.children.length === 1 && !(root as THREE.Mesh).isMesh) root = root.children[0];
    const solids: THREE.Object3D[] = [];
    if (solidOnly) root.traverse(node => { if ((node as THREE.Mesh).isMesh && node.userData.navigationSolid) solids.push(node); });
    bounds.current = (solidOnly ? solids : compound ? root.children : [ref.current]).map(child => {
      const box = glbLocalBBox(child);
      const matrix = new THREE.Matrix4();
      let parent: THREE.Object3D | null = child;
      while (parent && parent !== ref.current) {
        // glbLocalBBox already includes the child's rotation/scale, but not its translation.
        matrix.premultiply(parent === child ? new THREE.Matrix4().makeTranslation(...child.position.toArray()) : parent.matrix);
        parent = parent.parent;
      }
      return box.applyMatrix4(matrix);
    });
    if (!bounds.current.length || bounds.current.some(box => box.isEmpty())) throw new Error(`Empty navigation geometry: ${id}`);
    footprints.current = bounds.current.map(b => [
      { x: b.min.x, z: b.min.z }, { x: b.max.x, z: b.min.z },
      { x: b.max.x, z: b.max.z }, { x: b.min.x, z: b.max.z },
    ]);
    if (hull) {
      ref.current.updateWorldMatrix(true, true);
      const inverse = ref.current.matrixWorld.clone().invert();
      const points: Polygon = [];
      ref.current.traverse(node => {
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh || !mesh.geometry.getAttribute('position')) return;
        const matrix = inverse.clone().multiply(mesh.matrixWorld);
        const vertices = mesh.geometry.getAttribute('position');
        for (let i = 0; i < vertices.count; i++) {
          const p = new THREE.Vector3().fromBufferAttribute(vertices, i).applyMatrix4(matrix);
          points.push({ x: p.x, z: p.z });
        }
      });
      footprints.current = [convexHull(points)];
    }
    previousMatrix.current.makeScale(0, 0, 0);
    update();
  }, [id, owner, compound, hull, solidOnly, children, enabled]);
  useLayoutEffect(() => () => {
    if (enabled) for (const i of bounds.current.keys()) unregisterObstacle(`${id}:${i}`);
  }, [id, enabled]);
  useFrame(update, -1);
  return <group ref={ref}>{children}</group>;
}
