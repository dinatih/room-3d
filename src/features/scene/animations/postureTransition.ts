import * as THREE from 'three';

/** Extract the authored forward travel, compensating the fitted pelvis origin. */
export function createPostureMotion(original: THREE.AnimationClip, fitted: THREE.AnimationClip, hips: THREE.Object3D, root: THREE.Object3D) {
  const source = original.tracks.find(track => track.name === `${hips.name}.position`)!;
  const target = fitted.tracks.find(track => track.name === source.name)!;
  root.updateWorldMatrix(true, true);
  const toRoot = new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().copy(root.matrixWorld).invert().multiply(hips.parent!.matrixWorld));
  const sourceStart = new THREE.Vector3().fromArray(source.values);
  const targetStart = new THREE.Vector3().fromArray(target.values);
  const position = new THREE.Vector3();
  const scale = root.getWorldScale(new THREE.Vector3()).z;
  const values = Array.from(source.times, (_, frame) => position.fromArray(source.values, frame * 3).sub(sourceStart)
    .sub(new THREE.Vector3().fromArray(target.values, frame * 3).sub(targetStart)).applyMatrix3(toRoot).z * scale);
  const distance = values[values.length - 1];
  if (!distance) throw new Error(`Posture transition ${original.name}: missing forward travel`);
  return { distance, progress: new THREE.LinearInterpolant(source.times, new Float32Array(values.map(value => value / distance)), 1) };
}

/** Fit a posture change to the actual pelvis pose and the target idle endpoint.
 * Navigation owns ground motion; preserve only the clip's vertical deviation.
 * The cached retargeted clip must remain reusable by other interactions.
 */
export function fitPostureTransition(
  clip: THREE.AnimationClip,
  hips: THREE.Object3D,
  idle: THREE.AnimationClip,
  startPosition = hips.position,
): THREE.AnimationClip {
  const name = `${hips.name}.position`;
  const source = clip.tracks.find(track => track.name === name);
  const standing = idle.tracks.find(track => track.name === name);
  if (!source || !standing || clip.duration <= 0) {
    throw new Error(`Posture transition ${clip.name}: missing pelvis track or duration`);
  }
  const fitted = clip.clone();
  const track = fitted.tracks.find(track => track.name === name)!;
  const start = startPosition.clone().sub(new THREE.Vector3().fromArray(source.values, 0));
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
    baseline.copy(startPosition).lerp(target, progress);
    position.fromArray(track.values, frame * 3).sub(baseline).projectOnVector(up).add(baseline)
      .toArray(track.values, frame * 3);
  }
  return fitted;
}
