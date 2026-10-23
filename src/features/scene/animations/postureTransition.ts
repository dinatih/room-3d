import * as THREE from 'three';

/** Follow the actual change of height, including clips with a seated/standing tail. */
export function createPostureProgress(clip: THREE.AnimationClip, hips: THREE.Object3D) {
  const track = clip.tracks.find(track => track.name === `${hips.name}.position`)!;
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(hips.parent!.getWorldQuaternion(new THREE.Quaternion()).invert());
  const position = new THREE.Vector3();
  const start = position.fromArray(track.values).dot(up);
  const height = position.fromArray(track.values, track.values.length - 3).dot(up) - start;
  if (!height) throw new Error(`Posture transition ${clip.name}: unchanged pelvis height`);
  let progress = 0;
  const values = Array.from(track.times, (_, frame) => {
    const phase = (position.fromArray(track.values, frame * 3).dot(up) - start) / height;
    return progress = Math.max(progress, THREE.MathUtils.clamp(phase, 0, 1));
  });
  return new THREE.LinearInterpolant(track.times, new Float32Array(values), 1);
}

/** Fit a posture change to the actual pelvis pose and the target idle endpoint.
 * Navigation owns ground motion; preserve only the clip's vertical deviation.
 * The cached retargeted clip must remain reusable by other interactions.
 */
export function fitPostureTransition(
  clip: THREE.AnimationClip,
  hips: THREE.Object3D,
  idle: THREE.AnimationClip,
): THREE.AnimationClip {
  const name = `${hips.name}.position`;
  const source = clip.tracks.find(track => track.name === name);
  const standing = idle.tracks.find(track => track.name === name);
  if (!source || !standing || clip.duration <= 0) {
    throw new Error(`Posture transition ${clip.name}: missing pelvis track or duration`);
  }
  const fitted = clip.clone();
  const track = fitted.tracks.find(track => track.name === name)!;
  const start = hips.position.clone().sub(new THREE.Vector3().fromArray(source.values, 0));
  const end = new THREE.Vector3().fromArray(standing.values, 0)
    .sub(new THREE.Vector3().fromArray(source.values, source.values.length - 3));
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(
    hips.parent!.getWorldQuaternion(new THREE.Quaternion()).invert(),
  );
  const target = new THREE.Vector3().fromArray(standing.values, 0);
  const baseline = new THREE.Vector3(), position = new THREE.Vector3();
  for (let frame = 0; frame < track.times.length; frame++) {
    const progress = track.times[frame] / clip.duration;
    for (let axis = 0; axis < 3; axis++) {
      track.values[frame * 3 + axis] += start.getComponent(axis) * (1 - progress) + end.getComponent(axis) * progress;
    }
    baseline.copy(hips.position).lerp(target, progress);
    position.fromArray(track.values, frame * 3).sub(baseline).projectOnVector(up).add(baseline)
      .toArray(track.values, frame * 3);
  }
  return fitted;
}
