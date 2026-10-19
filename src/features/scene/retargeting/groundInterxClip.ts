import * as THREE from 'three';
import { resolveTargetBoneName } from './boneResolver';

/** Lowest animated sole vertex, measured relative to the model origin (world units). */
export function interxSoleHeight(model: THREE.Object3D): number {
  model.updateMatrixWorld(true);
  let lowest = Infinity;
  const point = new THREE.Vector3();
  const footNames = new Set(['LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase']
    .map(name => resolveTargetBoneName(model, name)));
  model.traverse(object => {
    const mesh = object as THREE.SkinnedMesh;
    if (!mesh.isSkinnedMesh) return;
    mesh.skeleton.update();
    const positions = mesh.geometry.getAttribute('position');
    const indices = mesh.geometry.getAttribute('skinIndex');
    const weights = mesh.geometry.getAttribute('skinWeight');
    for (let vertex = 0; vertex < positions.count; vertex++) {
      const touchesFoot = [0, 1, 2, 3].some(component =>
        weights.getComponent(vertex, component) > 0
        && footNames.has(mesh.skeleton.bones[indices.getComponent(vertex, component)].name));
      if (!touchesFoot) continue;
      point.fromBufferAttribute(positions, vertex);
      mesh.applyBoneTransform(vertex, point).applyMatrix4(mesh.matrixWorld);
      lowest = Math.min(lowest, point.y);
    }
  });
  if (!Number.isFinite(lowest)) throw new Error('Inter-X : aucune géométrie de pied skinnée pour mesurer les appuis');
  return lowest - model.getWorldPosition(point).y;
}

/** Bake a constant initial sole correction into the hips translation track.
 * Arm and leg kinematics remain naturally preserved from source mocap.
 */
export function groundInterxClip(clip: THREE.AnimationClip, model: THREE.Object3D, baseHeightMeters: number): THREE.AnimationClip {
  const hipsName = resolveTargetBoneName(model, 'Hips');
  const hips = hipsName ? model.getObjectByName(hipsName) : undefined;
  if (!hips) throw new Error('Inter-X : racine du corps manquante');
  const hipsTrack = clip.tracks.find(track => track.name === `${hips.name}.position`);
  if (!hipsTrack) throw new Error('Inter-X : piste de bassin manquante');

  const isBoneInMeters = hips.position.length() < 5.0;
  const baseHeight = isBoneInMeters ? baseHeightMeters : baseHeightMeters * 100;
  const soleHeight = interxSoleHeight(model);
  const correctionY = -(baseHeight + soleHeight);
  const correction = new THREE.Vector3(0, correctionY, 0)
    .applyMatrix3(new THREE.Matrix3().setFromMatrix4(hips.parent?.matrixWorld ?? new THREE.Matrix4()).invert());

  const values = hipsTrack.values.slice();
  for (let j = 0; j < values.length / 3; j++) {
    values[3 * j] += correction.x;
    values[3 * j + 1] += correction.y;
    values[3 * j + 2] += correction.z;
  }
  const newHipsTrack = new THREE.VectorKeyframeTrack(hipsTrack.name, hipsTrack.times, values);
  return new THREE.AnimationClip(clip.name, clip.duration, [
    ...clip.tracks.filter(track => track.name !== hipsTrack.name),
    newHipsTrack,
  ]);
}
