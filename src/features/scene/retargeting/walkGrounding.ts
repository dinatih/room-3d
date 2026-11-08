import * as THREE from 'three';
import { captureAnimationRig, restoreAnimationRig } from '../character/animationSerialization';
import { resolveTargetBoneName } from './boneResolver';

/** Bake continuous walking supports after retargeting, in the target's centimetre world. */
export function groundWalkClip(scene: THREE.Object3D, clip: THREE.AnimationClip, stabilizeStride = false): THREE.AnimationClip {
  const rig = restoreAnimationRig(captureAnimationRig(scene));
  const hips = rig.getObjectByName(resolveTargetBoneName(rig, 'Hips')!)!;
  const position = clip.tracks.find(track => track.name === `${hips.name}.position`);
  if (!position || !hips.parent) throw new Error(`Missing walking pelvis: ${clip.name}`);
  const soles = ['Left', 'Right'].flatMap(side => ['Foot', 'ToeBase'].map(part => {
    const bone = rig.getObjectByName(resolveTargetBoneName(rig, side + part)!)!;
    if (!bone) throw new Error(`Missing walking support: ${side}${part}`);
    const rest = bone.getWorldPosition(new THREE.Vector3());
    const local = bone.worldToLocal(rest.clone().setY(0));
    return { bone, local };
  }));
  // 240 Hz for 30 FPS sources: resolve heel/toe support changes between rotation keys.
  const keys = [...new Set(clip.tracks.flatMap(track => Array.from(track.times)))].sort((a, b) => a - b);
  const times = keys.flatMap((time, index) => index === keys.length - 1 ? [time]
    : Array.from({ length: 8 }, (_, step) => time + (keys[index + 1] - time) * step / 8));
  const values: number[] = [];
  const travel: number[] = [];
  let previous: THREE.Vector3[] | undefined, longitudinalTravel = 0;
  const mixer = new THREE.AnimationMixer(rig);
  const action = mixer.clipAction(clip).setLoop(THREE.LoopOnce, 1).play();
  action.clampWhenFinished = true;
  try {
    for (const time of times) {
      mixer.setTime(time); rig.updateMatrixWorld(true);
      if (stabilizeStride) {
        const toes = [soles[1].bone, soles[3].bone].map(bone => bone.getWorldPosition(new THREE.Vector3()));
        if (previous) {
          const support = toes[0].y + previous[0].y <= toes[1].y + previous[1].y ? 0 : 1;
          longitudinalTravel += toes[support].z - previous[support].z;
        }
        travel.push(longitudinalTravel);
        previous = toes;
      }
      const floor = Math.min(...soles.map(({ bone, local }) => bone.localToWorld(local.clone()).y));
      if (!Number.isFinite(floor)) throw new Error(`Invalid walking support: ${clip.name}`);
      const correction = new THREE.Vector3(0, -floor, 0)
        .applyMatrix3(new THREE.Matrix3().setFromMatrix4(hips.parent.matrixWorld).invert());
      hips.position.clone().add(correction).toArray(values, values.length);
    }
  } finally {
    mixer.stopAllAction(); mixer.uncacheRoot(rig);
  }
  if (stabilizeStride) {
    if (!(longitudinalTravel < 0)) throw new Error(`Invalid forward walking stride: ${clip.name}`);
    const worldToLocal = new THREE.Matrix3().setFromMatrix4(hips.parent.matrixWorld).invert();
    for (let index = 0; index < times.length; index++) {
      const phase = (times[index] - times[0]) / (times[times.length - 1] - times[0]);
      const correction = new THREE.Vector3(0, 0, longitudinalTravel * phase - travel[index]).applyMatrix3(worldToLocal);
      new THREE.Vector3().fromArray(values, index * 3).add(correction).toArray(values, index * 3);
    }
  }
  return new THREE.AnimationClip(clip.name, clip.duration, clip.tracks.map(track => track === position
    ? new THREE.VectorKeyframeTrack(track.name, times, values) : track));
}
