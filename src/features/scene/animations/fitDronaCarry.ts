import * as THREE from 'three';
import { resolveTargetBoneName } from '../retargeting/boneResolver';
import trajectories from './dronaCarryMotion.json';

/** Bake hand contacts for Xbot and Lara native once, in the animation worker.
 * The box keeps one authored trajectory; limb lengths determine each elbow.
 */
export function fitDronaCarry(clip: THREE.AnimationClip, rig: THREE.Object3D): THREE.AnimationClip {
  if (!(clip.name in trajectories)) return clip;
  const data = trajectories[clip.name as keyof typeof trajectories];
  const mixer = new THREE.AnimationMixer(rig);
  const action = mixer.clipAction(clip).setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = true;
  action.play();
  const position = (node: THREE.Object3D) => node.getWorldPosition(new THREE.Vector3());
  const bone = (name: string) => {
    const resolved = resolveTargetBoneName(rig, name);
    const node = resolved && rig.getObjectByName(resolved);
    if (!node) throw new Error(`Dröna carry: missing ${name}`);
    return node;
  };
  const arms = (['Left', 'Right'] as const).map(side => ({
    side, upper: bone(`${side}Arm`), fore: bone(`${side}ForeArm`), hand: bone(`${side}Hand`), middle: bone(`${side}HandMiddle1`),
  }));
  const aim = (joint: THREE.Object3D, child: THREE.Object3D, target: THREE.Vector3) => {
    const origin = position(joint);
    const delta = new THREE.Quaternion().setFromUnitVectors(position(child).sub(origin).normalize(), target.clone().sub(origin).normalize());
    const parent = joint.parent!.getWorldQuaternion(new THREE.Quaternion());
    joint.quaternion.premultiply(parent.clone().invert().multiply(delta).multiply(parent));
    rig.updateMatrixWorld(true);
  };
  const frames = data.positions.length;
  const times = Float32Array.from({ length: frames }, (_, frame) => clip.duration * frame / (frames - 1));
  const values = new Map(arms.flatMap(arm => [arm.upper, arm.fore, arm.hand].map(node => [node, new Float32Array(frames * 4)] as const)));
  for (let frame = 0; frame < frames; frame++) {
    mixer.setTime(times[frame]);
    rig.updateMatrixWorld(true);
    for (const { side, upper, fore, hand, middle } of arms) {
      const contacts = data.hands[side];
      const direction = new THREE.Vector3().fromArray(contacts.directions[frame]).normalize();
      const palmLength = position(middle).distanceTo(position(hand)) * .65;
      const wrist = position(hand).lerp(new THREE.Vector3().fromArray(contacts.palms[frame]).addScaledVector(direction, -palmLength), data.weights[frame]);
      const shoulder = position(upper);
      const length1 = shoulder.distanceTo(position(fore)), length2 = position(fore).distanceTo(position(hand));
      const axis = wrist.clone().sub(shoulder), distance = axis.length();
      if (data.weights[frame] > 0 && distance >= length1 + length2) throw new Error(`Dröna carry ${clip.name}: ${side} contact out of reach (${distance.toFixed(2)} / ${(length1 + length2).toFixed(2)} cm, frame ${frame}, shoulder ${shoulder.toArray()}, wrist ${wrist.toArray()})`);
      axis.normalize();
      const pole = new THREE.Vector3(side === 'Left' ? 65 : -65, 110, 0).sub(shoulder);
      pole.addScaledVector(axis, -pole.dot(axis)).normalize();
      const along = (length1 * length1 - length2 * length2 + distance * distance) / (2 * distance);
      const elbow = shoulder.clone().addScaledVector(axis, along).addScaledVector(pole, Math.sqrt(Math.max(0, length1 * length1 - along * along)));
      if (data.weights[frame] > 0) {
        aim(upper, fore, elbow);
        aim(fore, hand, wrist);
        aim(hand, middle, wrist.clone().add(direction));
        if (position(hand).distanceTo(wrist) > .05) throw new Error(`Dröna carry ${clip.name}: ${side} IK residual at frame ${frame}, ${upper.name}, ${fore.name}, ${hand.name}`);
      }
      for (const node of [upper, fore, hand]) {
        const track = values.get(node)!;
        const quaternion = node.quaternion.clone();
        if (frame && quaternion.dot(new THREE.Quaternion().fromArray(track, (frame - 1) * 4)) < 0) quaternion.set(-quaternion.x, -quaternion.y, -quaternion.z, -quaternion.w);
        quaternion.toArray(track, frame * 4);
      }
    }
  }
  mixer.stopAllAction();
  mixer.uncacheRoot(rig);
  const replaced = new Set([...values.keys()].map(node => `${node.name}.quaternion`));
  return new THREE.AnimationClip(clip.name, clip.duration, [
    ...clip.tracks.filter(track => !replaced.has(track.name)),
    ...[...values].map(([node, rotations]) => new THREE.QuaternionKeyframeTrack(`${node.name}.quaternion`, times, rotations)),
  ]);
}
