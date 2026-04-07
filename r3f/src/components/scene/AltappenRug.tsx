/**
 * AltappenRug.tsx — dalles de terrasse IKEA ALTAPPEN (InstancedMesh).
 * Port fidèle de js/furniture/altappen.js.
 */
import { useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const TILE_SIZE = 30;
const Z0 = -290;
const Z1 = -160;
const X_RIGHT = 310;

function gardenX0(z: number): number {
  if (z + 5 >= -140) return -10;
  return Math.ceil((-10 - 110 * (z + 5 + 140) / 70) / 10) * 10;
}

export function AltappenRug() {
  const { scene } = useGLTF('media/ikea_Altappen_single.glb');

  const { geo, mat } = useMemo(() => {
    // Find first mesh
    let mesh: THREE.Mesh | null = null;
    scene.traverse(c => { if ((c as THREE.Mesh).isMesh && !mesh) mesh = c as THREE.Mesh; });
    if (!mesh) return { geo: new THREE.BoxGeometry(TILE_SIZE, 1, TILE_SIZE), mat: new THREE.MeshStandardMaterial() };

    const rawBox = new THREE.Box3().setFromObject(scene);
    const tileW = rawBox.max.x - rawBox.min.x;
    const scl = TILE_SIZE / tileW;
    const cx = (rawBox.min.x + rawBox.max.x) / 2;
    const cz = (rawBox.min.z + rawBox.max.z) / 2;
    const cy = rawBox.min.y;

    const clonedGeo = (mesh as THREE.Mesh).geometry.clone();
    const bake = new THREE.Matrix4()
      .makeTranslation(-cx * scl, -cy * scl, -cz * scl)
      .multiply(new THREE.Matrix4().makeScale(scl, scl, scl));
    clonedGeo.applyMatrix4(bake);
    clonedGeo.computeBoundingSphere();

    return { geo: clonedGeo, mat: (mesh as THREE.Mesh).material as THREE.Material };
  }, [scene]);

  const positions = useMemo(() => {
    const pos: [number, number, number][] = [];
    for (let tz = Z0; tz + TILE_SIZE <= Z1; tz += TILE_SIZE) {
      const x0 = gardenX0(tz);
      for (let tx = X_RIGHT - TILE_SIZE; tx >= x0; tx -= TILE_SIZE) {
        pos.push([tx + TILE_SIZE / 2, 0, tz + TILE_SIZE / 2]);
      }
    }
    return pos;
  }, []);

  return (
    <instancedMesh
      args={[geo, mat, positions.length]}
      receiveShadow
      onUpdate={(self) => {
        const dummy = new THREE.Object3D();
        positions.forEach(([x, y, z], i) => {
          dummy.position.set(x, y, z);
          dummy.updateMatrix();
          self.setMatrixAt(i, dummy.matrix);
        });
        self.instanceMatrix.needsUpdate = true;
      }}
    />
  );
}

useGLTF.preload('media/ikea_Altappen_single.glb');
