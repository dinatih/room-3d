import * as THREE from 'three';
import { captureAnimationRig, restoreAnimationRig } from './animationSerialization';
import { resolveTargetBoneName } from '../retargeting/boneResolver';
import { ANIMATION_WALK_SPEEDS } from '../ai/agent/agentWalkAnimations';

const speeds = new WeakMap<THREE.AnimationClip, number>();
const ignoredClips = new WeakSet<THREE.AnimationClip>();

/** Measure the retargeted, scaled rig, rather than assuming every actor has the same stride. */
export function getWalkCycleSpeed(clip: THREE.AnimationClip, scene: THREE.Object3D): number | null {
  if (!Object.prototype.hasOwnProperty.call(ANIMATION_WALK_SPEEDS, clip.name) || ignoredClips.has(clip)) return null;
  const cached = speeds.get(clip);
  if (cached !== undefined) return cached;
  const rig = restoreAnimationRig(captureAnimationRig(scene));
  const feet = ['LeftFoot', 'RightFoot'].map(side => {
    const name = resolveTargetBoneName(rig, side);
    return name ? rig.getObjectByName(name) : null;
  });
  if (!feet[0] || !feet[1]) {
    ignoredClips.add(clip);
    return null;
  }
  const times = [...new Set(clip.tracks.flatMap(track => [...track.times]))].sort((a, b) => a - b);
  if (times.length < 2) {
    ignoredClips.add(clip);
    return null;
  }
  const mixer = new THREE.AnimationMixer(rig);
  mixer.clipAction(clip).setLoop(THREE.LoopOnce, 1).play().clampWhenFinished = true;
  let previous: THREE.Vector3[] | undefined;
  let distance = 0;
  for (const time of times) {
    mixer.setTime(time);
    rig.updateMatrixWorld(true);
    const points = feet.map(foot => foot!.getWorldPosition(new THREE.Vector3()));
    if (previous) {
      // The lower ankle is the support foot. Measure that same foot across the interval.
      const support = points[0].y + previous[0].y <= points[1].y + previous[1].y ? 0 : 1;
      distance += Math.hypot(points[support].x - previous[support].x, points[support].z - previous[support].z);
    }
    previous = points;
  }
  mixer.stopAllAction();
  mixer.uncacheRoot(rig);
  const speed = distance / (times[times.length - 1] - times[0]);
  if (!Number.isFinite(speed) || speed <= 0) {
    ignoredClips.add(clip);
    return null;
  }
  speeds.set(clip, speed);
  return speed;
}

export function walkTimeScale(distance: number, delta: number, cycleSpeed: number): number {
  return delta > 0 ? distance / (delta * cycleSpeed) : 0;
}
