import * as THREE from 'three';

const frustum = new THREE.Frustum();
const projection = new THREE.Matrix4();
const box = new THREE.Box3();

function intersectsReceiver(mesh: THREE.Mesh) {
  if (!mesh.frustumCulled) return true;
  if (!frustum.intersectsObject(mesh)) return false;
  if ((mesh as THREE.SkinnedMesh).isSkinnedMesh || (mesh as THREE.InstancedMesh).isInstancedMesh) return true;
  // A ground plane's sphere extends above the camera even when the entire plane
  // is below its view. Its box avoids keeping all shadows active in a sky view.
  if (mesh.geometry.boundingBox === null) mesh.geometry.computeBoundingBox();
  box.copy(mesh.geometry.boundingBox!).applyMatrix4(mesh.matrixWorld);
  return frustum.intersectsBox(box);
}

function containsReceiver(object: THREE.Object3D, camera: THREE.Camera): boolean {
  if (!object.visible) return false;
  const mesh = object as THREE.Mesh & { isReflector?: boolean };
  if (mesh.isMesh && (mesh.receiveShadow || mesh.isReflector) && mesh.layers.test(camera.layers)) {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    // A visible mirror can show receivers outside the main camera's view.
    if (materials.some(material => material.visible) && intersectsReceiver(mesh)) return true;
  }
  for (const child of object.children) {
    if (containsReceiver(child, camera)) return true;
  }
  return false;
}

/** Call after renderer world-matrix updates, before its shadow pass. */
export function hasVisibleShadowReceiver(scene: THREE.Scene, camera: THREE.Camera): boolean {
  const cameras = (camera as THREE.ArrayCamera).isArrayCamera ? (camera as THREE.ArrayCamera).cameras : [camera];
  for (const view of cameras) {
    projection.multiplyMatrices(view.projectionMatrix, view.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projection, view.coordinateSystem, view.reversedDepth);
    if (containsReceiver(scene, view)) return true;
  }
  return false;
}
