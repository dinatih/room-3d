import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const lineMat = new THREE.LineBasicMaterial({ color: 0xff2200 });

function isWallMesh(obj: THREE.Object3D): boolean {
  let cur: THREE.Object3D | null = obj.parent;
  while (cur) {
    if (cur.userData?.brickType === 'wall') return true;
    cur = cur.parent;
  }
  return false;
}

export function WallEdgesLayer() {
  const { scene } = useThree();

  useEffect(() => {
    scene.updateMatrixWorld(true);
    const geos: THREE.BufferGeometry[] = [];

    scene.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || (mesh as any).isSkinnedMesh) return;
      if (!isWallMesh(mesh)) return;

      // Position-only, non-indexé (homogène pour mergeGeometries)
      const src = mesh.geometry;
      const tmp = new THREE.BufferGeometry();
      tmp.setAttribute('position', src.getAttribute('position').clone());
      if (src.index) tmp.setIndex(src.index.clone());

      const geo = tmp.index ? tmp.toNonIndexed() : tmp;
      if (geo !== tmp) tmp.dispose();

      geo.applyMatrix4(mesh.matrixWorld);
      geos.push(geo);
    });

    if (geos.length === 0) return;

    const merged = mergeGeometries(geos);
    geos.forEach(g => g.dispose());
    if (!merged) return;

    const deduped = mergeVertices(merged, 0.01);
    merged.dispose();

    const edges = new THREE.EdgesGeometry(deduped, 5);
    deduped.dispose();

    const line = new THREE.LineSegments(edges, lineMat);
    scene.add(line);

    return () => {
      scene.remove(line);
      edges.dispose();
    };
  }, [scene]);

  return null;
}
