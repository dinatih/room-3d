import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

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
    const added: Array<{ parent: THREE.Object3D; line: THREE.LineSegments }> = [];

    scene.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || (mesh as any).isSkinnedMesh) return;
      if (!isWallMesh(mesh)) return;

      const edges = new THREE.EdgesGeometry(mesh.geometry);
      const line = new THREE.LineSegments(edges, lineMat);
      mesh.add(line);
      added.push({ parent: mesh, line });
    });

    return () => {
      added.forEach(({ parent, line }) => {
        parent.remove(line);
        line.geometry.dispose();
      });
    };
  }, [scene]);

  return null;
}
