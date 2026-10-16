import * as THREE from 'three';

const configuredMeshes = new WeakMap<THREE.SkinnedMesh, THREE.Box3>();

/** Bounds follow the current skeleton without skinning every vertex each frame. */
export function enableAnimatedFrustumCulling(mesh: THREE.Mesh) {
  mesh.frustumCulled = true;
  const skinned = mesh as THREE.SkinnedMesh;
  if (!skinned.isSkinnedMesh || configuredMeshes.has(skinned)) return;

  const { geometry, skeleton, bindMatrix } = skinned;
  const positions = geometry.getAttribute('position');
  const indices = geometry.getAttribute('skinIndex');
  const weights = geometry.getAttribute('skinWeight');
  const boneBoxes = skeleton.bones.map(() => new THREE.Box3());
  const bindTransforms = skeleton.boneInverses.map(inverse => new THREE.Matrix4().multiplyMatrices(inverse, bindMatrix));
  const point = new THREE.Vector3();
  const bonePoint = new THREE.Vector3();
  const transformedBox = new THREE.Box3();
  const posedBox = new THREE.Box3();
  const transform = new THREE.Matrix4();
  const sphere = new THREE.Sphere();
  let morphWeights: number[] = [];
  const boneMatrices = skeleton.bones.map(() => new THREE.Matrix4());
  const lastBindInverse = new THREE.Matrix4();
  let hasBounds = false;

  const rebuildBoneBoxes = () => {
    for (const box of boneBoxes) box.makeEmpty();
    for (let vertex = 0; vertex < positions.count; vertex++) {
      // Mesh's implementation applies morph targets, before SkinnedMesh's skinning.
      THREE.Mesh.prototype.getVertexPosition.call(skinned, vertex, point);
      for (let influence = 0; influence < weights.itemSize; influence++) {
        const weight = weights.getComponent(vertex, influence);
        if (weight === 0) continue;
        if (weight < 0) throw new Error(`Negative skin weight in ${mesh.name}`);
        const bone = indices.getComponent(vertex, influence);
        bonePoint.copy(point).applyMatrix4(bindTransforms[bone]);
        boneBoxes[bone].expandByPoint(bonePoint);
      }
    }
    morphWeights = [...(skinned.morphTargetInfluences ?? [])];
  };
  rebuildBoneBoxes();

  skinned.computeBoundingSphere = () => {
    if (skinned.morphTargetInfluences?.some((weight, index) => weight !== morphWeights[index])) {
      rebuildBoneBoxes();
      hasBounds = false;
    }
    // Frustum tests and shadow receivers read the same pose several times in
    // one render. Reuse bounds only while every contributing bone matrix and
    // the bind transform are identical; explicit bone edits invalidate it too.
    if (hasBounds && skinned.bindMatrixInverse.equals(lastBindInverse) &&
        boneBoxes.every((bounds, bone) => bounds.isEmpty() || skeleton.bones[bone].matrixWorld.equals(boneMatrices[bone]))) return;
    posedBox.makeEmpty();
    for (let bone = 0; bone < boneBoxes.length; bone++) {
      if (boneBoxes[bone].isEmpty()) continue;
      transform.multiplyMatrices(skinned.bindMatrixInverse, skeleton.bones[bone].matrixWorld);
      boneMatrices[bone].copy(skeleton.bones[bone].matrixWorld);
      transformedBox.copy(boneBoxes[bone]).applyMatrix4(transform);
      posedBox.union(transformedBox);
    }
    // Normalized skin weights form a convex combination of the transformed boxes.
    posedBox.getBoundingSphere(sphere);
    lastBindInverse.copy(skinned.bindMatrixInverse);
    hasBounds = true;
  };

  // Three.js tests the frustum after updating world matrices but before mesh
  // onBeforeRender. A lazy sphere stays current for main, shadow and mirror cameras,
  // even when the previous frame culled the mesh or FPV temporarily hides its head.
  Object.defineProperty(skinned, 'boundingSphere', {
    configurable: true,
    enumerable: true,
    get() {
      skinned.computeBoundingSphere();
      return sphere;
    },
  });
  configuredMeshes.set(skinned, posedBox);
}

/** Current world bounds for shadow receivers, including skeletal deformation. */
export function meshWorldBounds(mesh: THREE.Mesh, target: THREE.Box3) {
  const skinned = mesh as THREE.SkinnedMesh;
  const instanced = mesh as THREE.InstancedMesh;
  if (skinned.isSkinnedMesh) {
    const pose = configuredMeshes.get(skinned);
    if (pose) {
      skinned.computeBoundingSphere();
      target.copy(pose);
    } else {
      skinned.computeBoundingBox();
      target.copy(skinned.boundingBox!);
    }
  } else if (instanced.isInstancedMesh) {
    instanced.computeBoundingBox();
    target.copy(instanced.boundingBox!);
  } else {
    if (mesh.geometry.boundingBox === null) mesh.geometry.computeBoundingBox();
    target.copy(mesh.geometry.boundingBox!);
  }
  return target.applyMatrix4(mesh.matrixWorld);
}
