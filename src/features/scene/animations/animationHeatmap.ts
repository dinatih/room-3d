import * as THREE from 'three';
import { cacheDynamicGLTF } from '../character/useCharacterAnimations';
import { acquireAnimationLibrary } from '../character/animationLibrary';
import { captureAnimationRig, restoreAnimationRig } from '../character/animationSerialization';
import { findCharacter } from '../characterConfig';
import { extractCharacterParts } from '../characterParts';
import { sceneModelPath } from '../sceneModelPaths';
import { resolveTargetBoneName } from '../retargeting/boneResolver';
import { getAnimationDef, getAnimationOriginTransform, resolveAnimationId, resolveAnimationPath } from './animationResolver';
import { architectureObstacles } from '../ai/navigation/architecture';
import { furnitureObstacles } from '../ai/navigation/obstacles';
import { inflate, pointInRing, type Point, type Polygon } from '../ai/navigation/geometry';
import { DOOR_CONFIGS, doorCollisionState, doorPolygon } from '../doorObstacles';
import { doorKeys } from '../ai/navigation/service';

/** Ground 2D heatmap cell size in studio centimetres. */
export const HEATMAP_CELL_CM = 5;
/** 3D volume voxel size in studio centimetres. */
export const HEATMAP_VOXEL_CM = 10;
/** Sampling cadence in Hz across animation duration. */
export const HEATMAP_SAMPLE_HZ = 15;
const MIN_SAMPLES = 12;
const MAX_SAMPLES = 90;
const REFERENCE_HUMAN_HEIGHT_CM = 173.4;
const MAX_CACHE_ENTRIES = 24;

export interface HeatmapParticipantSpec {
  characterId: string;
  animationId: string;
  /** Position relative to the shared heatmap anchor (cm). */
  localPos: [number, number, number];
  /** Yaw relative to the shared heatmap anchor (radians). */
  localRotY: number;
}

export interface HeatmapGroundCell {
  ix: number;
  iz: number;
  x: number;
  z: number;
  count: number;
  minY: number;
  maxY: number;
  roleMask: number;
}

export interface HeatmapVoxel {
  ix: number;
  iy: number;
  iz: number;
  x: number;
  y: number;
  z: number;
  count: number;
  roleMask: number;
}

export interface HeatmapBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface AnimationHeatmapData {
  key: string;
  duration: number;
  sampleCount: number;
  maxCellCount: number;
  maxVoxelCount: number;
  groundCells: HeatmapGroundCell[];
  voxels: HeatmapVoxel[];
  bounds: HeatmapBounds;
  footprintRadius: number;
  trails: Array<{ roleMask: number; points: [number, number, number][] }>;
  resolvedLabels: string[];
}

export interface HeatmapCollisionResult {
  collidingCellIndices: Set<number>;
  collidingVoxelIndices: Set<number>;
  collidingObstacles: string[];
}

interface CapsuleSpec {
  boneA: THREE.Object3D;
  boneB: THREE.Object3D;
  radius: number;
}

interface PreparedParticipant {
  roleMask: number;
  rig: THREE.Object3D;
  wrapper: THREE.Group;
  mixer: THREE.AnimationMixer | null;
  clipDuration: number;
  hips: THREE.Object3D | null;
  hipsRestWorldXZ: { x: number; z: number } | null;
  capsules: CapsuleSpec[];
  headBone: THREE.Object3D | null;
  headRadius: number;
  library: ReturnType<typeof acquireAnimationLibrary> | null;
}

const ANATOMICAL_SEGMENTS: Array<{ from: string; to: string; radius: number }> = [
  { from: 'Hips', to: 'Spine', radius: 14 },
  { from: 'Spine', to: 'Spine2', radius: 15 },
  { from: 'Spine2', to: 'Head', radius: 11 },
  { from: 'LeftShoulder', to: 'LeftArm', radius: 6 },
  { from: 'LeftArm', to: 'LeftForeArm', radius: 5 },
  { from: 'LeftForeArm', to: 'LeftHand', radius: 5 },
  { from: 'RightShoulder', to: 'RightArm', radius: 6 },
  { from: 'RightArm', to: 'RightForeArm', radius: 5 },
  { from: 'RightForeArm', to: 'RightHand', radius: 5 },
  { from: 'LeftUpLeg', to: 'LeftLeg', radius: 8 },
  { from: 'LeftLeg', to: 'LeftFoot', radius: 6 },
  { from: 'LeftFoot', to: 'LeftToeBase', radius: 5 },
  { from: 'RightUpLeg', to: 'RightLeg', radius: 8 },
  { from: 'RightLeg', to: 'RightFoot', radius: 6 },
  { from: 'RightFoot', to: 'RightToeBase', radius: 5 },
];

const heatmapCache = new Map<string, Promise<AnimationHeatmapData>>();

function buildCacheKey(participants: HeatmapParticipantSpec[], lockHipsXZ: boolean): string {
  const entries = participants.map((p) => {
    const resolvedId = resolveAnimationId(p.animationId || 'idle');
    const origin = getAnimationOriginTransform(resolvedId);
    return {
      c: p.characterId,
      a: resolvedId,
      p: p.localPos.map((n) => Math.round(n * 100) / 100),
      r: Math.round(p.localRotY * 10000) / 10000,
      o: origin.offset.map((n) => Math.round(n * 100) / 100),
      or: Math.round(origin.rotY * 10000) / 10000,
    };
  });
  return JSON.stringify({ entries, lockHipsXZ });
}

function normalizeRigForSampling(rawScene: THREE.Object3D, characterId: string): THREE.Object3D {
  const rig = restoreAnimationRig(captureAnimationRig(rawScene));
  rig.scale.set(1, 1, 1);
  rig.position.set(0, 0, 0);
  rig.rotation.set(0, 0, 0);
  rig.updateMatrixWorld(true);

  // Extract parts at rest scale (1,1,1) identically to Character.tsx so restWorldQuaternion/defaultPosition match.
  const parts = extractCharacterParts(rig);

  const charConfig = findCharacter(characterId);
  const isLara = charConfig ? charConfig.isLara !== false : true;
  const targetHeight = charConfig?.height ?? REFERENCE_HUMAN_HEIGHT_CM;
  const baseHeight = isLara
    ? REFERENCE_HUMAN_HEIGHT_CM
    : (characterId === 'valby' ? 168.0 : targetHeight);
  const scaleFactor = (targetHeight / baseHeight) * 100.0;

  rig.scale.set(scaleFactor, scaleFactor, scaleFactor);
  rig.updateMatrixWorld(true);

  if (parts.bones.hips) {
    const hipsWorld = parts.bones.hips.getWorldPosition(new THREE.Vector3());
    rig.position.x -= hipsWorld.x;
    rig.position.z -= hipsWorld.z;
    rig.updateMatrixWorld(true);
  }
  return rig;
}

function collectCapsules(rig: THREE.Object3D, targetHeight: number): {
  capsules: CapsuleSpec[];
  hips: THREE.Object3D | null;
  headBone: THREE.Object3D | null;
  headRadius: number;
} {
  const heightScale = targetHeight / REFERENCE_HUMAN_HEIGHT_CM;
  const resolve = (name: string) => {
    const resolved = resolveTargetBoneName(rig, name);
    return resolved ? rig.getObjectByName(resolved) ?? null : null;
  };
  const capsules: CapsuleSpec[] = [];
  for (const seg of ANATOMICAL_SEGMENTS) {
    const boneA = resolve(seg.from);
    const boneB = resolve(seg.to);
    if (boneA && boneB) {
      capsules.push({ boneA, boneB, radius: seg.radius * heightScale });
    }
  }
  const hips = resolve('Hips');
  const headBone = resolve('Head');
  return { capsules, hips, headBone, headRadius: 11 * heightScale };
}

async function prepareParticipant(spec: HeatmapParticipantSpec, roleMask: number): Promise<PreparedParticipant> {
  const charConfig = findCharacter(spec.characterId);
  if (!charConfig) throw new Error(`Unknown heatmap character: ${spec.characterId}`);

  const modelSource = await cacheDynamicGLTF(sceneModelPath(charConfig.path));
  const rig = normalizeRigForSampling(modelSource.scene, spec.characterId);
  const { capsules, hips, headBone, headRadius } = collectCapsules(rig, charConfig.height);

  const resolvedId = resolveAnimationId(spec.animationId || 'idle');
  const origin = getAnimationOriginTransform(resolvedId);

  const wrapper = new THREE.Group();
  wrapper.position.set(spec.localPos[0], spec.localPos[1], spec.localPos[2]);
  wrapper.rotation.y = spec.localRotY;

  const animOrigin = new THREE.Group();
  animOrigin.position.set(origin.offset[0], origin.offset[1], origin.offset[2]);
  animOrigin.rotation.y = origin.rotY;
  animOrigin.add(rig);
  wrapper.add(animOrigin);
  wrapper.updateMatrixWorld(true);

  const hipsRestWorldXZ = hips
    ? (() => {
      const v = hips.getWorldPosition(new THREE.Vector3());
      return { x: v.x, z: v.z };
    })()
    : null;

  if (resolvedId === 't-pose') {
    return { roleMask, rig, wrapper, mixer: null, clipDuration: 0, hips, hipsRestWorldXZ, capsules, headBone, headRadius, library: null };
  }

  const def = getAnimationDef(resolvedId);
  const animPath = def?.path ?? resolveAnimationPath(resolvedId);
  if (!animPath || (!animPath.endsWith('.glb') && !animPath.endsWith('.gltf') && !animPath.includes('/'))) {
    throw new Error(`Invalid heatmap animation path for "${spec.animationId}"`);
  }

  const library = acquireAnimationLibrary(rig);
  try {
    const animSource = await cacheDynamicGLTF(animPath);
    const clip = await library.prepare(animPath, resolvedId, animSource, def?.rootMotionSpace);
    const mixer = new THREE.AnimationMixer(rig);
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity).play();
    return {
      roleMask,
      rig,
      wrapper,
      mixer,
      clipDuration: clip.duration,
      hips,
      hipsRestWorldXZ,
      capsules,
      headBone,
      headRadius,
      library,
    };
  } catch (err) {
    library.release();
    throw err;
  }
}

export function computeAnimationHeatmap(
  participants: HeatmapParticipantSpec[],
  options: { lockHipsXZ?: boolean; duoDuration?: number } = {},
): Promise<AnimationHeatmapData> {
  if (!participants.length) return Promise.reject(new Error('Heatmap requires at least one participant'));
  const lockHipsXZ = Boolean(options.lockHipsXZ);
  const key = buildCacheKey(participants, lockHipsXZ);
  const cached = heatmapCache.get(key);
  if (cached) {
    heatmapCache.delete(key);
    heatmapCache.set(key, cached);
    return cached;
  }

  const task = (async (): Promise<AnimationHeatmapData> => {
    const prepared = await Promise.all(participants.map((spec, idx) => prepareParticipant(spec, 1 << idx)));
    try {
      const maxClipDuration = Math.max(0, ...prepared.map((p) => p.clipDuration), options.duoDuration ?? 0);
      const isStaticPose = maxClipDuration <= 0;
      const sampleCount = isStaticPose
        ? 1
        : Math.max(MIN_SAMPLES, Math.min(MAX_SAMPLES, Math.ceil(maxClipDuration * HEATMAP_SAMPLE_HZ)));

      const groundMap = new Map<string, HeatmapGroundCell>();
      const voxelMap = new Map<string, HeatmapVoxel>();
      const trails: Array<{ roleMask: number; points: [number, number, number][] }> = prepared.map((p) => ({
        roleMask: p.roleMask,
        points: [],
      }));

      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;

      const pA = new THREE.Vector3();
      const pB = new THREE.Vector3();
      const tmpHips = new THREE.Vector3();
      const tmpPoint = new THREE.Vector3();

      const rasterizeSphere = (
        cx: number,
        cy: number,
        cz: number,
        radius: number,
        roleMask: number,
        seenGround: Set<string>,
        seenVoxel: Set<string>,
      ) => {
        if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(cz)) return;
        minX = Math.min(minX, cx - radius);
        maxX = Math.max(maxX, cx + radius);
        minY = Math.min(minY, cy - radius);
        maxY = Math.max(maxY, cy + radius);
        minZ = Math.min(minZ, cz - radius);
        maxZ = Math.max(maxZ, cz + radius);

        // 2D ground grid
        const gx0 = Math.floor((cx - radius) / HEATMAP_CELL_CM);
        const gx1 = Math.floor((cx + radius) / HEATMAP_CELL_CM);
        const gz0 = Math.floor((cz - radius) / HEATMAP_CELL_CM);
        const gz1 = Math.floor((cz + radius) / HEATMAP_CELL_CM);
        const rGroundSq = (radius + HEATMAP_CELL_CM * 0.35) ** 2;
        for (let ix = gx0; ix <= gx1; ix++) {
          const cellX = (ix + 0.5) * HEATMAP_CELL_CM;
          const dx = cellX - cx;
          for (let iz = gz0; iz <= gz1; iz++) {
            const cellZ = (iz + 0.5) * HEATMAP_CELL_CM;
            const dz = cellZ - cz;
            if (dx * dx + dz * dz > rGroundSq) continue;
            const gKey = `${ix},${iz}`;
            let cell = groundMap.get(gKey);
            if (!cell) {
              cell = {
                ix,
                iz,
                x: cellX,
                z: cellZ,
                count: 0,
                minY: cy - radius,
                maxY: cy + radius,
                roleMask,
              };
              groundMap.set(gKey, cell);
            } else {
              cell.minY = Math.min(cell.minY, cy - radius);
              cell.maxY = Math.max(cell.maxY, cy + radius);
              cell.roleMask |= roleMask;
            }
            if (!seenGround.has(gKey)) {
              seenGround.add(gKey);
              cell.count++;
            }
          }
        }

        // 3D voxel grid
        const vx0 = Math.floor((cx - radius) / HEATMAP_VOXEL_CM);
        const vx1 = Math.floor((cx + radius) / HEATMAP_VOXEL_CM);
        const vy0 = Math.floor((cy - radius) / HEATMAP_VOXEL_CM);
        const vy1 = Math.floor((cy + radius) / HEATMAP_VOXEL_CM);
        const vz0 = Math.floor((cz - radius) / HEATMAP_VOXEL_CM);
        const vz1 = Math.floor((cz + radius) / HEATMAP_VOXEL_CM);
        const rVoxelSq = (radius + HEATMAP_VOXEL_CM * 0.45) ** 2;
        for (let ix = vx0; ix <= vx1; ix++) {
          const vx = (ix + 0.5) * HEATMAP_VOXEL_CM;
          const dx = vx - cx;
          for (let iy = vy0; iy <= vy1; iy++) {
            const vy = (iy + 0.5) * HEATMAP_VOXEL_CM;
            const dy = vy - cy;
            for (let iz = vz0; iz <= vz1; iz++) {
              const vz = (iz + 0.5) * HEATMAP_VOXEL_CM;
              const dz = vz - cz;
              if (dx * dx + dy * dy + dz * dz > rVoxelSq) continue;
              const vKey = `${ix},${iy},${iz}`;
              let voxel = voxelMap.get(vKey);
              if (!voxel) {
                voxel = { ix, iy, iz, x: vx, y: vy, z: vz, count: 0, roleMask };
                voxelMap.set(vKey, voxel);
              } else {
                voxel.roleMask |= roleMask;
              }
              if (!seenVoxel.has(vKey)) {
                seenVoxel.add(vKey);
                voxel.count++;
              }
            }
          }
        }
      };

      for (let s = 0; s < sampleCount; s++) {
        const t = isStaticPose ? 0 : (s / Math.max(1, sampleCount - 1)) * maxClipDuration;
        const seenGround = new Set<string>();
        const seenVoxel = new Set<string>();

        for (let pIdx = 0; pIdx < prepared.length; pIdx++) {
          const p = prepared[pIdx];
          if (p.mixer && p.clipDuration > 0) {
            p.mixer.setTime(t % p.clipDuration);
          }
          p.wrapper.updateMatrixWorld(true);

          if (lockHipsXZ && p.hips && p.hipsRestWorldXZ && p.hips.parent) {
            p.hips.parent.updateWorldMatrix(true, false);
            p.hips.getWorldPosition(tmpHips);
            tmpHips.x = p.hipsRestWorldXZ.x;
            tmpHips.z = p.hipsRestWorldXZ.z;
            p.hips.position.copy(p.hips.parent.worldToLocal(tmpHips));
            p.wrapper.updateMatrixWorld(true);
          }

          if (p.hips) {
            p.hips.getWorldPosition(tmpHips);
            trails[pIdx].points.push([tmpHips.x, tmpHips.y, tmpHips.z]);
          }

          for (const cap of p.capsules) {
            cap.boneA.getWorldPosition(pA);
            cap.boneB.getWorldPosition(pB);
            const segLen = pA.distanceTo(pB);
            const steps = Math.max(1, Math.ceil(segLen / (HEATMAP_CELL_CM * 0.75)));
            for (let k = 0; k <= steps; k++) {
              tmpPoint.lerpVectors(pA, pB, k / steps);
              rasterizeSphere(tmpPoint.x, tmpPoint.y, tmpPoint.z, cap.radius, p.roleMask, seenGround, seenVoxel);
            }
          }

          if (p.headBone) {
            p.headBone.getWorldPosition(pA);
            // Offset upward from neck/head joint toward skull center
            rasterizeSphere(pA.x, pA.y + p.headRadius * 0.75, pA.z, p.headRadius, p.roleMask, seenGround, seenVoxel);
          }
        }
      }

      const groundCells = Array.from(groundMap.values());
      const voxels = Array.from(voxelMap.values());
      let maxCellCount = 1;
      for (const cell of groundCells) if (cell.count > maxCellCount) maxCellCount = cell.count;
      let maxVoxelCount = 1;
      for (const voxel of voxels) if (voxel.count > maxVoxelCount) maxVoxelCount = voxel.count;

      let footprintRadius = 0;
      for (const cell of groundCells) {
        const d = Math.hypot(cell.x, cell.z) + HEATMAP_CELL_CM * 0.5;
        if (d > footprintRadius) footprintRadius = d;
      }

      if (!Number.isFinite(minX)) {
        minX = maxX = minY = maxY = minZ = maxZ = 0;
      }

      const resolvedLabels = participants.map((spec) => {
        const id = resolveAnimationId(spec.animationId || 'idle');
        return getAnimationDef(id)?.label ?? id;
      });

      return {
        key,
        duration: maxClipDuration,
        sampleCount,
        maxCellCount,
        maxVoxelCount,
        groundCells,
        voxels,
        bounds: { minX, maxX, minY, maxY, minZ, maxZ },
        footprintRadius,
        trails,
        resolvedLabels,
      };
    } finally {
      for (const p of prepared) {
        if (p.mixer) {
          p.mixer.stopAllAction();
          p.mixer.uncacheRoot(p.rig);
        }
        p.library?.release();
      }
    }
  })().catch((err) => {
    heatmapCache.delete(key);
    throw err;
  });

  heatmapCache.set(key, task);
  while (heatmapCache.size > MAX_CACHE_ENTRIES) {
    heatmapCache.delete(heatmapCache.keys().next().value!);
  }
  return task;
}

interface PreparedObstacle {
  id: string;
  yMin: number;
  yMax: number;
  groundPoly: Polygon;
  voxelPoly: Polygon;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function toPreparedObstacles(): PreparedObstacle[] {
  const all = [
    ...architectureObstacles,
    ...furnitureObstacles.values(),
    ...doorKeys.map((key) => {
      const cfg = DOOR_CONFIGS[key];
      return {
        id: `door-${key}`,
        yMin: cfg.yMin,
        yMax: cfg.yMax,
        polygon: doorPolygon(key, doorCollisionState[key].angle),
      };
    }),
  ];
  return all.map((obs) => {
    const groundPoly = inflate(obs.polygon, HEATMAP_CELL_CM * 0.45);
    const voxelPoly = inflate(obs.polygon, HEATMAP_VOXEL_CM * 0.45);
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of voxelPoly) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    }
    return {
      id: obs.id,
      yMin: obs.yMin,
      yMax: obs.yMax,
      groundPoly,
      voxelPoly,
      minX,
      maxX,
      minZ,
      maxZ,
    };
  });
}

export function evaluateHeatmapCollisions(
  data: AnimationHeatmapData,
  anchorPos: [number, number, number],
  anchorRotY: number,
): HeatmapCollisionResult {
  const obstacles = toPreparedObstacles();
  const cos = Math.cos(anchorRotY);
  const sin = Math.sin(anchorRotY);
  const [ax, ay, az] = anchorPos;

  // Quick world AABB filter across all 8 corners of data.bounds
  const { minX, maxX, minY, maxY, minZ, maxZ } = data.bounds;
  let wMinX = Infinity, wMaxX = -Infinity, wMinZ = Infinity, wMaxZ = -Infinity;
  for (const lx of [minX, maxX]) {
    for (const lz of [minZ, maxZ]) {
      const wx = ax + lx * cos + lz * sin;
      const wz = az - lx * sin + lz * cos;
      if (wx < wMinX) wMinX = wx;
      if (wx > wMaxX) wMaxX = wx;
      if (wz < wMinZ) wMinZ = wz;
      if (wz > wMaxZ) wMaxZ = wz;
    }
  }
  const wMinY = ay + minY;
  const wMaxY = ay + maxY;

  const nearby = obstacles.filter((o) =>
    o.maxX >= wMinX - HEATMAP_VOXEL_CM &&
    o.minX <= wMaxX + HEATMAP_VOXEL_CM &&
    o.maxZ >= wMinZ - HEATMAP_VOXEL_CM &&
    o.minZ <= wMaxZ + HEATMAP_VOXEL_CM &&
    o.yMax >= wMinY &&
    o.yMin <= wMaxY,
  );

  const collidingCellIndices = new Set<number>();
  const collidingVoxelIndices = new Set<number>();
  const hitIds = new Set<string>();

  if (!nearby.length) {
    return { collidingCellIndices, collidingVoxelIndices, collidingObstacles: [] };
  }

  const pt: Point = { x: 0, z: 0 };
  const halfVoxel = HEATMAP_VOXEL_CM * 0.5;

  for (let i = 0; i < data.voxels.length; i++) {
    const v = data.voxels[i];
    pt.x = ax + v.x * cos + v.z * sin;
    pt.z = az - v.x * sin + v.z * cos;
    const vyMin = ay + v.y - halfVoxel;
    const vyMax = ay + v.y + halfVoxel;
    for (const obs of nearby) {
      if (vyMax < obs.yMin || vyMin > obs.yMax) continue;
      if (pt.x < obs.minX || pt.x > obs.maxX || pt.z < obs.minZ || pt.z > obs.maxZ) continue;
      if (pointInRing(pt, obs.voxelPoly)) {
        collidingVoxelIndices.add(i);
        hitIds.add(obs.id);
        break;
      }
    }
  }

  for (let i = 0; i < data.groundCells.length; i++) {
    const c = data.groundCells[i];
    pt.x = ax + c.x * cos + c.z * sin;
    pt.z = az - c.x * sin + c.z * cos;
    const cyMin = ay + c.minY;
    const cyMax = ay + c.maxY;
    for (const obs of nearby) {
      if (cyMax < obs.yMin || cyMin > obs.yMax) continue;
      if (pt.x < obs.minX || pt.x > obs.maxX || pt.z < obs.minZ || pt.z > obs.maxZ) continue;
      if (pointInRing(pt, obs.groundPoly)) {
        collidingCellIndices.add(i);
        hitIds.add(obs.id);
        break;
      }
    }
  }

  return {
    collidingCellIndices,
    collidingVoxelIndices,
    collidingObstacles: Array.from(hitIds).sort(),
  };
}
