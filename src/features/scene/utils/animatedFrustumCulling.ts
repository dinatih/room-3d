import * as THREE from 'three';

const configuredMeshes = new WeakMap<THREE.SkinnedMesh, { box: THREE.Box3; geometry: THREE.BufferGeometry; skeleton: THREE.Skeleton; bindMatrix: THREE.Matrix4 }>();

interface CachedBoneBoxes {
  posVersion: number;
  idxVersion: number;
  weightVersion: number;
  morphWeights: number[];
  bindMatrix: THREE.Matrix4;
  activeBones: number[];
  boneBoxes: THREE.Box3[];
  boneInverses: THREE.Matrix4[];
}
const geometryBoneBoxCache = new WeakMap<THREE.BufferGeometry, CachedBoneBoxes[]>();

function attrVersion(attr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute): number {
  return 'isInterleavedBufferAttribute' in attr && attr.isInterleavedBufferAttribute
    ? attr.data.version
    : (attr as THREE.BufferAttribute).version;
}

function mat4Equal(a: ArrayLike<number>, b: ArrayLike<number>): boolean {
  return a[12] === b[12] && a[13] === b[13] && a[14] === b[14]
    && a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]
    && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7]
    && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11]
    && a[15] === b[15];
}

function isIdentityElements(e: ArrayLike<number>): boolean {
  return e[0] === 1 && e[5] === 1 && e[10] === 1 && e[15] === 1
    && e[1] === 0 && e[2] === 0 && e[3] === 0
    && e[4] === 0 && e[6] === 0 && e[7] === 0
    && e[8] === 0 && e[9] === 0 && e[11] === 0
    && e[12] === 0 && e[13] === 0 && e[14] === 0;
}

function morphsEqual(current: number[] | undefined, cached: number[]): boolean {
  const len = current?.length ?? 0;
  if (len === 0 && cached.length === 0) return true;
  const maxLen = Math.max(len, cached.length);
  for (let i = 0; i < maxLen; i++) {
    if ((current?.[i] ?? 0) !== (cached[i] ?? 0)) return false;
  }
  return true;
}

/** Bounds follow the current skeleton without skinning every vertex each frame. */
export function enableAnimatedFrustumCulling(mesh: THREE.Mesh) {
  mesh.frustumCulled = true;
  const skinned = mesh as THREE.SkinnedMesh;
  if (!skinned.isSkinnedMesh) return;
  const existing = configuredMeshes.get(skinned);
  if (existing && existing.geometry === skinned.geometry && existing.skeleton === skinned.skeleton && existing.bindMatrix.equals(skinned.bindMatrix)) return;

  const { geometry, skeleton, bindMatrix } = skinned;
  const positions = geometry.getAttribute('position');
  const indices = geometry.getAttribute('skinIndex');
  const weights = geometry.getAttribute('skinWeight');
  let boneBoxes: THREE.Box3[] = [];
  const bindTransforms: THREE.Matrix4[] = [];
  const point = new THREE.Vector3();
  const bonePoint = new THREE.Vector3();
  const posedBox = new THREE.Box3();
  const transform = new THREE.Matrix4();
  const sphere = new THREE.Sphere();
  let morphWeights: number[] = [];
  const boneMatrices: THREE.Matrix4[] = [];
  const lastBindInverse = new THREE.Matrix4();
  let bindIsIdentity = false;
  let hasBounds = false;
  let activeBones: number[] = [];

  const computeOrReuseBoneBoxes = () => {
    const influences = skinned.morphTargetInfluences;
    const posVer = attrVersion(positions);
    const idxVer = attrVersion(indices);
    const weightVer = attrVersion(weights);
    const entries = geometryBoneBoxCache.get(geometry);
    if (entries) {
      for (const entry of entries) {
        if (entry.posVersion !== posVer || entry.idxVersion !== idxVer || entry.weightVersion !== weightVer) continue;
        if (!morphsEqual(influences, entry.morphWeights)) continue;
        if (!mat4Equal(bindMatrix.elements, entry.bindMatrix.elements)) continue;
        let inversesMatch = true;
        for (let i = 0; i < entry.activeBones.length; i++) {
          const bone = entry.activeBones[i];
          const curInv = skeleton.boneInverses[bone];
          const cachedInv = entry.boneInverses[bone];
          if (!curInv || !cachedInv || !mat4Equal(curInv.elements, cachedInv.elements)) {
            inversesMatch = false;
            break;
          }
        }
        if (!inversesMatch) continue;
        boneBoxes = entry.boneBoxes;
        activeBones = entry.activeBones;
        morphWeights = [...(influences ?? [])];
        for (const bone of activeBones) boneMatrices[bone] ??= new THREE.Matrix4();
        return;
      }
    }

    boneBoxes = [];
    for (let vertex = 0; vertex < positions.count; vertex++) {
      // Mesh's implementation applies morph targets, before SkinnedMesh's skinning.
      THREE.Mesh.prototype.getVertexPosition.call(skinned, vertex, point);
      for (let influence = 0; influence < weights.itemSize; influence++) {
        const weight = weights.getComponent(vertex, influence);
        if (weight === 0) continue;
        if (weight < 0) throw new Error(`Negative skin weight in ${mesh.name}`);
        const bone = indices.getComponent(vertex, influence);
        bindTransforms[bone] ??= new THREE.Matrix4().multiplyMatrices(skeleton.boneInverses[bone], bindMatrix);
        boneBoxes[bone] ??= new THREE.Box3();
        bonePoint.copy(point).applyMatrix4(bindTransforms[bone]);
        boneBoxes[bone].expandByPoint(bonePoint);
      }
    }
    morphWeights = [...(influences ?? [])];
    activeBones = boneBoxes.flatMap((bounds, bone) => bounds.isEmpty() ? [] : [bone]);
    for (const bone of activeBones) {
      boneMatrices[bone] ??= new THREE.Matrix4();
    }
    // Animated morph weights can take a new value every frame. Keep their
    // current boxes on this mesh only; the shared cache retains neutral poses.
    if (influences?.some(weight => weight !== 0)) return;
    const boneInverses: THREE.Matrix4[] = [];
    for (const bone of activeBones) boneInverses[bone] = skeleton.boneInverses[bone].clone();
    const list = entries ?? [];
    list.push({
      posVersion: posVer,
      idxVersion: idxVer,
      weightVersion: weightVer,
      morphWeights: [...morphWeights],
      bindMatrix: bindMatrix.clone(),
      activeBones,
      boneBoxes,
      boneInverses,
    });
    if (!entries) geometryBoneBoxCache.set(geometry, list);
  };
  computeOrReuseBoneBoxes();

  skinned.computeBoundingSphere = () => {
    if (!morphsEqual(skinned.morphTargetInfluences, morphWeights)) {
      computeOrReuseBoneBoxes();
      hasBounds = false;
    }
    const bindEl = skinned.bindMatrixInverse.elements;
    const boneList = skeleton.bones;
    // Frustum tests and shadow receivers read the same pose several times in
    // one render. Reuse bounds only while every contributing bone matrix and
    // the bind transform are identical; explicit bone edits invalidate it too.
    if (hasBounds && mat4Equal(bindEl, lastBindInverse.elements)) {
      let allMatch = true;
      for (let i = 0; i < activeBones.length; i++) {
        const bone = activeBones[i];
        if (!mat4Equal(boneList[bone].matrixWorld.elements, boneMatrices[bone].elements)) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) return;
    }

    lastBindInverse.copy(skinned.bindMatrixInverse);
    bindIsIdentity = isIdentityElements(bindEl);

    if (activeBones.length === 0) {
      posedBox.makeEmpty();
      posedBox.getBoundingSphere(sphere);
      hasBounds = true;
      return;
    }

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    const tEl = transform.elements;
    for (let i = 0; i < activeBones.length; i++) {
      const bone = activeBones[i];
      const worldMat = boneList[bone].matrixWorld;
      boneMatrices[bone].copy(worldMat);
      const m = bindIsIdentity ? worldMat.elements : (transform.multiplyMatrices(skinned.bindMatrixInverse, worldMat), tEl);
      const b = boneBoxes[bone];
      const bMinX = b.min.x, bMinY = b.min.y, bMinZ = b.min.z;
      const bMaxX = b.max.x, bMaxY = b.max.y, bMaxZ = b.max.z;

      const m0 = m[0], m4 = m[4], m8 = m[8];
      const m1 = m[1], m5 = m[5], m9 = m[9];
      const m2 = m[2], m6 = m[6], m10 = m[10];

      const x0 = (m0 >= 0 ? m0 * bMinX : m0 * bMaxX) + (m4 >= 0 ? m4 * bMinY : m4 * bMaxY) + (m8 >= 0 ? m8 * bMinZ : m8 * bMaxZ) + m[12];
      const x1 = (m0 >= 0 ? m0 * bMaxX : m0 * bMinX) + (m4 >= 0 ? m4 * bMaxY : m4 * bMinY) + (m8 >= 0 ? m8 * bMaxZ : m8 * bMinZ) + m[12];
      const y0 = (m1 >= 0 ? m1 * bMinX : m1 * bMaxX) + (m5 >= 0 ? m5 * bMinY : m5 * bMaxY) + (m9 >= 0 ? m9 * bMinZ : m9 * bMaxZ) + m[13];
      const y1 = (m1 >= 0 ? m1 * bMaxX : m1 * bMinX) + (m5 >= 0 ? m5 * bMaxY : m5 * bMinY) + (m9 >= 0 ? m9 * bMaxZ : m9 * bMinZ) + m[13];
      const z0 = (m2 >= 0 ? m2 * bMinX : m2 * bMaxX) + (m6 >= 0 ? m6 * bMinY : m6 * bMaxY) + (m10 >= 0 ? m10 * bMinZ : m10 * bMaxZ) + m[14];
      const z1 = (m2 >= 0 ? m2 * bMaxX : m2 * bMinX) + (m6 >= 0 ? m6 * bMaxY : m6 * bMinY) + (m10 >= 0 ? m10 * bMaxZ : m10 * bMinZ) + m[14];

      if (x0 < minX) minX = x0;
      if (x1 > maxX) maxX = x1;
      if (y0 < minY) minY = y0;
      if (y1 > maxY) maxY = y1;
      if (z0 < minZ) minZ = z0;
      if (z1 > maxZ) maxZ = z1;
    }
    posedBox.min.set(minX, minY, minZ);
    posedBox.max.set(maxX, maxY, maxZ);
    // Normalized skin weights form a convex combination of the transformed boxes.
    posedBox.getBoundingSphere(sphere);
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
  configuredMeshes.set(skinned, { box: posedBox, geometry, skeleton, bindMatrix: bindMatrix.clone() });
}

/** Current world bounds for shadow receivers, including skeletal deformation. */
export function meshWorldBounds(mesh: THREE.Mesh, target: THREE.Box3) {
  const skinned = mesh as THREE.SkinnedMesh;
  const instanced = mesh as THREE.InstancedMesh;
  if (skinned.isSkinnedMesh) {
    const entry = configuredMeshes.get(skinned);
    if (entry) {
      skinned.computeBoundingSphere();
      target.copy(entry.box);
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
