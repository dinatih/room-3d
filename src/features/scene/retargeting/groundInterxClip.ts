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

function solveArm(upper: THREE.Object3D, lower: THREE.Object3D, hand: THREE.Object3D, target: THREE.Vector3) {
  const handRotation = hand.getWorldQuaternion(new THREE.Quaternion());
  const rotate = (bone: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3) => {
    const rotation = new THREE.Quaternion().setFromUnitVectors(from.normalize(), to.normalize())
      .multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
    bone.quaternion.copy(bone.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(rotation));
    bone.updateWorldMatrix(false, true);
  };
  // Some rigs (Lara) have no clavicle joint. Allow the minimum shoulder motion
  // needed to reach the wrist, keeping the upper arm and forearm lengths intact.
  const initialShoulder = upper.getWorldPosition(new THREE.Vector3());
  const initialElbow = lower.getWorldPosition(new THREE.Vector3());
  const initialWrist = hand.getWorldPosition(new THREE.Vector3());
  const maxReach = initialShoulder.distanceTo(initialElbow) + initialElbow.distanceTo(initialWrist);
  if (initialShoulder.distanceTo(target) > maxReach) {
    const move = target.clone().sub(initialShoulder).normalize()
      .multiplyScalar(initialShoulder.distanceTo(target) - maxReach)
      .applyMatrix3(new THREE.Matrix3().setFromMatrix4(upper.parent!.matrixWorld).invert());
    upper.position.add(move);
    upper.updateWorldMatrix(false, true);
  }
  const shoulder = upper.getWorldPosition(new THREE.Vector3());
  const elbow = lower.getWorldPosition(new THREE.Vector3());
  const wrist = hand.getWorldPosition(new THREE.Vector3());
  const lengthA = shoulder.distanceTo(elbow);
  const lengthB = elbow.distanceTo(wrist);
  const distance = shoulder.distanceTo(target);
  // Input tracks use Float32; permit only its accumulated numerical roundoff.
  const reachTolerance = (lengthA + lengthB) * 2 ** -20;
  if (distance > lengthA + lengthB + reachTolerance || distance < Math.abs(lengthA - lengthB) || distance === 0) {
    throw new Error(`Inter-X : cible de main inaccessible pour ${upper.name} (${distance.toFixed(3)} / ${(lengthA + lengthB).toFixed(3)} cm)`);
  }
  const direction = target.clone().sub(shoulder).normalize();
  const pole = elbow.clone().sub(shoulder);
  pole.addScaledVector(direction, -pole.dot(direction));
  if (pole.lengthSq() === 0) throw new Error(`Inter-X : plan du coude indéterminé pour ${upper.name}`);
  pole.normalize();
  const along = (lengthA * lengthA - lengthB * lengthB + distance * distance) / (2 * distance);
  const bend = Math.sqrt(Math.max(0, lengthA * lengthA - along * along));
  const targetElbow = shoulder.clone().addScaledVector(direction, along).addScaledVector(pole, bend);
  rotate(upper, elbow.clone().sub(shoulder), targetElbow.clone().sub(shoulder));
  const newElbow = lower.getWorldPosition(new THREE.Vector3());
  rotate(lower, hand.getWorldPosition(new THREE.Vector3()).sub(newElbow), target.clone().sub(newElbow));
  hand.quaternion.copy(hand.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(handRotation));
  hand.updateWorldMatrix(false, true);
}

/** Bake a constant initial sole correction and preserve both original wrist trajectories with arm IK.
 * Root motion and leg rotations remain intact. baseHeightMeters includes the
 * desired source sole elevation for seated/carried participants; it must not
 * force their feet onto the other participant's support plane.
 */
export function groundInterxClip(clip: THREE.AnimationClip, model: THREE.Object3D, baseHeightMeters: number): THREE.AnimationClip {
  const saved: Array<{ object: THREE.Object3D; position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3 }> = [];
  model.traverse(object => saved.push({ object, position: object.position.clone(), quaternion: object.quaternion.clone(), scale: object.scale.clone() }));
  const bone = (name: string): THREE.Object3D => {
    const resolved = resolveTargetBoneName(model, name);
    const result = resolved ? model.getObjectByName(resolved) : undefined;
    if (!result) throw new Error(`Inter-X : os manquant ${name}`);
    return result;
  };
  const hips = bone('Hips');
  const arms = ['Left', 'Right'].map(side => ({ upper: bone(`${side}Arm`), lower: bone(`${side}ForeArm`), hand: bone(`${side}Hand`) }));
  const hipsTrack = clip.tracks.find(track => track.name === `${hips.name}.position`);
  if (!hipsTrack) throw new Error('Inter-X : piste de bassin manquante');
  const times = hipsTrack.times;
  const correctedJoints = arms.flatMap(arm => [arm.upper, arm.lower, arm.hand]);
  const correctedNames = [hips.name + '.position', ...arms.map(arm => arm.upper.name + '.position'), ...correctedJoints.map(bone => bone.name + '.quaternion')];
  const values = correctedNames.map(() => [] as number[]);
  const mixer = new THREE.AnimationMixer(model);
  try {
    // Another clip may currently be playing on this instance. Evaluate the new
    // clip from the recorded rest pose, then restore the live pose in finally.
    model.traverse(object => {
      const joint = object as THREE.Bone & { defaultPosition?: THREE.Vector3; restLocalQuaternion?: THREE.Quaternion };
      if (joint.isBone && joint.defaultPosition && joint.restLocalQuaternion) {
        joint.position.copy(joint.defaultPosition);
        joint.quaternion.copy(joint.restLocalQuaternion);
      }
    });
    const originalShoulders = arms.map(arm => arm.upper.position.clone());
    const action = mixer.clipAction(clip).setLoop(THREE.LoopOnce, 1).play();
    action.clampWhenFinished = true;
    mixer.setTime(0);
    const correctionY = -(baseHeightMeters * 100 + interxSoleHeight(model));
    const correction = new THREE.Vector3(0, correctionY, 0)
      .applyMatrix3(new THREE.Matrix3().setFromMatrix4(hips.parent!.matrixWorld).invert());
    for (let frame = 0; frame < times.length; frame++) {
      arms.forEach((arm, index) => arm.upper.position.copy(originalShoulders[index]));
      mixer.setTime(times[frame]);
      model.updateMatrixWorld(true);
      const targets = arms.map(arm => arm.hand.getWorldPosition(new THREE.Vector3()));
      hips.position.add(correction);
      model.updateMatrixWorld(true);
      arms.forEach((arm, index) => solveArm(arm.upper, arm.lower, arm.hand, targets[index]));
      arms.forEach((arm, index) => {
        const error = arm.hand.getWorldPosition(new THREE.Vector3()).distanceTo(targets[index]);
        if (error > 0.001) throw new Error(`Inter-X : erreur IK ${error} cm à la frame ${frame} (${arm.upper.name})`);
      });
      hips.position.toArray(values[0], frame * 3);
      arms.forEach((arm, index) => arm.upper.position.toArray(values[index + 1], frame * 3));
      correctedJoints.forEach((joint, index) => joint.quaternion.toArray(values[index + 3], frame * 4));
    }
    const replacements = correctedNames.map((name, index) => name.endsWith('.position')
      ? new THREE.VectorKeyframeTrack(name, times, values[index])
      : new THREE.QuaternionKeyframeTrack(name, times, values[index]));
    return new THREE.AnimationClip(clip.name, clip.duration, [
      ...clip.tracks.filter(track => !correctedNames.includes(track.name)), ...replacements,
    ]);
  } finally {
    mixer.stopAllAction();
    mixer.uncacheRoot(model);
    saved.forEach(({ object, position, quaternion, scale }) => {
      object.position.copy(position); object.quaternion.copy(quaternion); object.scale.copy(scale);
    });
    model.updateMatrixWorld(true);
  }
}
