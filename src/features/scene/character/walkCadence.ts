import * as THREE from 'three';
import { captureAnimationRig, restoreAnimationRig } from './animationSerialization';
import { resolveTargetBoneName } from '../retargeting/boneResolver';
import { ANIMATION_WALK_SPEEDS } from '../ai/agent/agentWalkAnimations';

const speeds = new WeakMap<THREE.AnimationClip, number>();

/** Measure the retargeted, scaled rig, rather than assuming every actor has the same stride. */
export function getWalkCycleSpeed(clip: THREE.AnimationClip, scene: THREE.Object3D): number | null {
  if (!Object.prototype.hasOwnProperty.call(ANIMATION_WALK_SPEEDS, clip.name)) return null;
  const cached = speeds.get(clip);
  if (cached !== undefined) return cached;
  const rig = restoreAnimationRig(captureAnimationRig(scene));
  const feet = ['Left', 'Right'].map(side => {
    const name = resolveTargetBoneName(rig, `${side}ToeBase`) ?? resolveTargetBoneName(rig, `${side}Foot`);
    const foot = name ? rig.getObjectByName(name) : undefined;
    if (!foot) throw new Error(`Pied manquant pour calibrer ${clip.name} : ${side}`);
    return foot;
  });
  const times = [...new Set(clip.tracks.flatMap(track => [...track.times]))].sort((a, b) => a - b);
  if (times.length < 2) throw new Error(`Échantillons insuffisants pour calibrer ${clip.name}`);
  const mixer = new THREE.AnimationMixer(rig);
  mixer.clipAction(clip).setLoop(THREE.LoopOnce, 1).play().clampWhenFinished = true;
  let previous: THREE.Vector3[] | undefined;
  let previousTime = times[0], distance = 0, supportDuration = 0;
  for (const time of times) {
    mixer.setTime(time);
    rig.updateMatrixWorld(true);
    const points = feet.map(foot => foot.getWorldPosition(new THREE.Vector3()));
    if (previous) {
      // Measure longitudinal travel of the lower forefoot, excluding its forward swing.
      const support = points[0].y + previous[0].y <= points[1].y + previous[1].y ? 0 : 1;
      const travel = (previous[support].z - points[support].z) * (clip.name === 'walking-backward' ? -1 : 1);
      if (travel > 0) {
        distance += travel;
        supportDuration += time - previousTime;
      }
    }
    previous = points;
    previousTime = time;
  }
  mixer.stopAllAction();
  mixer.uncacheRoot(rig);
  const speed = distance / supportDuration;
  if (!Number.isFinite(speed) || speed <= 0) throw new Error(`Foulée invalide : ${clip.name}`);
  speeds.set(clip, speed);
  return speed;
}

export function walkTimeScale(distance: number, delta: number, cycleSpeed: number): number {
  return delta > 0 ? distance / (delta * cycleSpeed) : 0;
}
