/**
 * AltappenRug.tsx — Dalle de terrasse IKEA ALTAPPEN 30×30cm.
 *
 * AltappenRug      — tuile unique, SceneItemProps, pour l'inventaire.
 * AltappenRugField — InstancedMesh couvrant tout le jardin, pour Garden.tsx.
 */
import { useLayoutEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { glbLocalBBox, mergeGlbByMaterial } from '@features/scene/glbUtils';
import type { SceneItemProps } from '@shared/types';

const TILE_SIZE = 30;
const Z0 = -340;
const Z1 = -210;
const X_RIGHT = 210;

function gardenX0(z: number): number {
  if (z + 5 >= -190) return -110;
  return Math.ceil((-110 - 110 * (z + 5 + 190) / 70) / 10) * 10;
}

// ── Tuile unique (inventaire) ─────────────────────────────────────────────────

export function AltappenRug({ onSize }: SceneItemProps) {
  const { scene } = useGLTF('media/glb/ikea_Altappen_single.glb');

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    const rawBox = glbLocalBBox(scene);
    const tileW = rawBox.max.x - rawBox.min.x;
    const scl = TILE_SIZE / tileW;
    scene.scale.setScalar(scl);
    mergeGlbByMaterial(scene);
    const box = glbLocalBBox(scene);
    scene.position.set(
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    );
    onSize(box.getSize(new THREE.Vector3()));
  }, [scene]);

  return <primitive object={scene} />;
}

// ── Champ de dalles (scène) ───────────────────────────────────────────────────

export function AltappenRugField() {
  const { scene } = useGLTF('media/glb/ikea_Altappen_single.glb');

  const { geo, mat } = useMemo(() => {
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

useGLTF.preload('media/glb/ikea_Altappen_single.glb');
