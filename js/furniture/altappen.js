import * as THREE from 'three';
import { gltfLoader } from '../utils/loaders.js';
import { mergeGlbByMaterial } from '../utils/mergeUtils.js';
import { requestRender } from '../cameraManager.js';
import { LAYER_GLB } from '../config.js';

// Altappen deck tile = 30×30cm, placed from Z=-290 to Z=-160
const TILE_SIZE = 30;
const Z0 = -290;
const Z1 = -160;
const X_RIGHT = 310;

// Left boundary of the garden at a given Z (matches floor.js diagonal)
function gardenX0(z) {
  if (z + 5 >= -140) return -10;
  return Math.ceil((-10 - 110 * (z + 5 + 140) / 70) / 10) * 10;
}

export function buildAltappen(scene) {
  gltfLoader.load('media/ikea_Altappen_single.glb', (gltf) => {
    const root = gltf.scene;

    // Merge the 1402 sub-meshes into one (all share the same material)
    mergeGlbByMaterial(root);

    let mergedMesh = null;
    root.traverse(c => { if (c.isMesh && !mergedMesh) mergedMesh = c; });
    if (!mergedMesh) return;

    // Bake scale + centering directly into the geometry so InstancedMesh
    // instance matrices are simple translations in cm
    const rawBox = new THREE.Box3().setFromObject(root);
    const tileW = rawBox.max.x - rawBox.min.x;
    const scl = TILE_SIZE / tileW;

    const cx = (rawBox.min.x + rawBox.max.x) / 2;
    const cz = (rawBox.min.z + rawBox.max.z) / 2;
    const cy = rawBox.min.y;

    // Apply: first scale, then translate to center at origin (bottom at Y=0)
    const bake = new THREE.Matrix4()
      .makeTranslation(-cx * scl, -cy * scl, -cz * scl)
      .multiply(new THREE.Matrix4().makeScale(scl, scl, scl));
    mergedMesh.geometry.applyMatrix4(bake);
    mergedMesh.geometry.computeBoundingSphere();

    // Collect all tile positions
    const positions = [];
    for (let tz = Z0; tz + TILE_SIZE <= Z1; tz += TILE_SIZE) {
      const x0 = gardenX0(tz);
      for (let tx = X_RIGHT - TILE_SIZE; tx >= x0; tx -= TILE_SIZE) {
        positions.push(tx + TILE_SIZE / 2, 0, tz + TILE_SIZE / 2);
      }
    }
    const count = positions.length / 3;

    const iMesh = new THREE.InstancedMesh(
      mergedMesh.geometry,
      mergedMesh.material,
      count,
    );
    iMesh.receiveShadow = true;
    iMesh.layers.set(LAYER_GLB);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      dummy.updateMatrix();
      iMesh.setMatrixAt(i, dummy.matrix);
    }
    iMesh.instanceMatrix.needsUpdate = true;

    scene.add(iMesh);
    requestRender();
  }, undefined, err => console.error('ikea_Altappen_single.glb:', err));
}
