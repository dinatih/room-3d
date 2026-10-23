import * as THREE from 'three';
import { resolveTargetBoneName } from './boneResolver';

export interface FootContact { side: 'Left' | 'Right'; start: number; end: number; level?: boolean }

/** Bake the GLB's authored supports after adapting limb lengths to the target rig. */
export function bakeFootContacts(rig: THREE.Object3D, clip: THREE.AnimationClip, contacts: FootContact[]): THREE.AnimationClip {
  if (!contacts.length) throw new Error('Empty foot contacts');
  const hips = rig.getObjectByName(resolveTargetBoneName(rig, 'Hips')!)!;
  const position = clip.tracks.find(track => track.name === `${hips.name}.position`)!;
  // Bake four samples per source interval (120 Hz for this 30 FPS motion)
  // so quaternion interpolation also preserves the planted feet between keys.
  const times = new Float32Array(Array.from(position.times).flatMap((time, index, source) => index === source.length - 1
    ? [time] : Array.from({ length: 4 }, (_, step) => time + (source[index + 1] - time) * step / 4)));
  const world = (bone: THREE.Object3D) => bone.getWorldPosition(new THREE.Vector3());
  const evaluators = clip.tracks.map(track => {
    const [name, property] = track.name.split('.');
    const node = rig.getObjectByName(name)!;
    if (property !== 'position' && property !== 'quaternion') throw new Error(`Unsupported contact track: ${track.name}`);
    return { node, property, interpolant: new (property === 'quaternion' ? THREE.QuaternionLinearInterpolant : THREE.LinearInterpolant)(track.times, track.values as Float32Array, track.getValueSize()) };
  });
  const rest = evaluators.map(({ node, property }) => ({ node, property, value: property === 'position' ? node.position.clone() : node.quaternion.clone() }));
  const sample = (time: number) => {
    for (const { node, property, interpolant } of evaluators) {
      const values = interpolant.evaluate(time);
      if (property === 'position') node.position.fromArray(values); else node.quaternion.fromArray(values);
    }
    rig.updateMatrixWorld(true);
  };
  const output = new Map<string, Float32Array>([[position.name, new Float32Array(times.length * 3)]]);
  try {
    // The character may already be playing another clip when this bake starts.
    for (const { node, property } of evaluators) {
      const bone = node as THREE.Object3D & { defaultPosition: THREE.Vector3; restLocalQuaternion: THREE.Quaternion };
      if (property === 'position') node.position.copy(bone.defaultPosition);
      else node.quaternion.copy(bone.restLocalQuaternion);
    }
    rig.updateMatrixWorld(true);
    const soleReferences = new Map((['Left', 'Right'] as const).map(side => {
      const foot = rig.getObjectByName(resolveTargetBoneName(rig, side + 'Foot')!)!;
      const toe = rig.getObjectByName(resolveTargetBoneName(rig, side + 'ToeBase')!)!;
      const a = world(foot), t = world(toe);
      return [side, { height: t.y, heel: new THREE.Vector3(0, t.y - a.y, 0).applyQuaternion(foot.getWorldQuaternion(new THREE.Quaternion()).invert()) }];
    }));
    const legs = (['Left', 'Right'] as const).flatMap(side => {
      const spans = contacts.filter(contact => contact.side === side);
      if (!spans.length) return [];
      if (spans[0].start !== times[0] || spans[spans.length - 1].end !== times[times.length - 1]) throw new Error(`Incomplete ${side} contacts`);
      const [hip, knee, foot, toe] = ['UpLeg', 'Leg', 'Foot', 'ToeBase'].map(part => rig.getObjectByName(resolveTargetBoneName(rig, side + part)!)!);
      const frames = Array.from(times, time => { sample(time); return { toe: world(toe), foot: world(foot), rotation: foot.getWorldQuaternion(new THREE.Quaternion()) }; });
      const anchors = spans.map(({ start, end, level }, index) => {
        const frame = index === 0 || index === spans.length - 1 ? frames[0] : frames[times.findIndex(time => time >= (start + end) / 2)];
        const rotation = frame.rotation.clone(), sole = soleReferences.get(side)!;
        if (level) {
          const heel = frame.foot.clone().add(sole.heel.clone().applyQuaternion(rotation));
          const direction = frame.toe.clone().sub(heel).normalize();
          const horizontal = direction.clone().setY(0).normalize();
          rotation.premultiply(new THREE.Quaternion().setFromUnitVectors(direction, horizontal));
        }
        return { ...frame, rotation, toe: frame.toe.clone().setY(level ? sole.height : frames[0].toe.y) };
      });
      const targets = frames.map((frame, index) => {
        const time = times[index];
        let span = spans.findIndex(({ start, end }) => time >= start && time <= end);
        let delta: THREE.Vector3, rotation: THREE.Quaternion;
        if (span >= 0) {
          delta = anchors[span].toe.clone().sub(frame.toe); rotation = anchors[span].rotation.clone();
        } else {
          span = spans.findIndex(({ start }) => start > time);
          const before = times.findIndex(time => time >= spans[span - 1].end);
          const after = times.findIndex(time => time >= spans[span].start);
          const t = (time - times[before]) / (times[after] - times[before]), blend = t * t * (3 - 2 * t);
          delta = anchors[span - 1].toe.clone().sub(frames[before].toe).lerp(anchors[span].toe.clone().sub(frames[after].toe), blend);
          rotation = anchors[span - 1].rotation.clone().slerp(anchors[span].rotation, blend);
        }
        const offset = frame.toe.clone().sub(frame.foot).applyQuaternion(frame.rotation.clone().invert()).applyQuaternion(rotation);
        return { point: frame.toe.clone().add(delta).sub(offset), rotation };
      });
      for (const bone of [hip, knee, foot]) output.set(`${bone.name}.quaternion`, new Float32Array(times.length * 4));
      return [{ hip, knee, foot, targets }];
    });
    const aim = (bone: THREE.Object3D, child: THREE.Object3D, target: THREE.Vector3) => {
      const origin = world(bone), rotation = bone.getWorldQuaternion(new THREE.Quaternion());
      const swing = new THREE.Quaternion().setFromUnitVectors(world(child).sub(origin).normalize(), target.clone().sub(origin).normalize());
      bone.quaternion.copy(bone.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(swing.multiply(rotation)));
      bone.updateWorldMatrix(false, true);
    };
    for (let index = 0; index < times.length; index++) {
      sample(times[index]);
      let drop = 0;
      for (const { hip, knee, foot, targets } of legs) {
        const a = world(hip), b = world(knee), c = world(foot), target = targets[index].point;
        const length = a.distanceTo(b) + b.distanceTo(c), horizontal = Math.hypot(a.x - target.x, a.z - target.z);
        if (horizontal >= length) throw new Error(`Unreachable foot contact: ${foot.name} at ${times[index]}`);
        const ceiling = target.y + Math.sqrt(length * length - horizontal * horizontal);
        // Float32 keyframe precision; leave enough room to represent a bent knee.
        if (a.y >= ceiling) drop = Math.max(drop, a.y - ceiling + 2 ** -23 * length * 8);
      }
      hips.position.add(new THREE.Vector3(0, -drop, 0).applyMatrix3(new THREE.Matrix3().setFromMatrix4(hips.parent!.matrixWorld).invert()));
      hips.position.toArray(output.get(position.name)!, index * 3); rig.updateMatrixWorld(true);
      for (const { hip, knee, foot, targets } of legs) {
        const a = world(hip), b = world(knee), c = world(foot), { point, rotation } = targets[index];
        const upper = a.distanceTo(b), lower = b.distanceTo(c), direction = point.clone().sub(a), distance = direction.length();
        if (distance >= upper + lower || distance <= Math.abs(upper - lower)) throw new Error(`Unreachable leg: ${foot.name}`);
        direction.normalize();
        const bend = b.clone().sub(a); bend.addScaledVector(direction, -bend.dot(direction)).normalize();
        const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
        aim(hip, knee, a.clone().addScaledVector(direction, along).addScaledVector(bend, Math.sqrt(upper * upper - along * along)));
        aim(knee, foot, point);
        foot.quaternion.copy(foot.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(rotation));
        rig.updateMatrixWorld(true);
        for (const bone of [hip, knee, foot]) bone.quaternion.toArray(output.get(`${bone.name}.quaternion`)!, index * 4);
      }
    }
    return new THREE.AnimationClip(clip.name, clip.duration, clip.tracks.map(track => output.has(track.name)
      ? new (track.name.endsWith('.position') ? THREE.VectorKeyframeTrack : THREE.QuaternionKeyframeTrack)(track.name, times, output.get(track.name)!) : track));
  } finally {
    for (const { node, property, value } of rest) {
      if (property === 'position') node.position.copy(value as THREE.Vector3); else node.quaternion.copy(value as THREE.Quaternion);
    }
    rig.updateMatrixWorld(true);
  }
}
