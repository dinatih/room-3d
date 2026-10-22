import * as THREE from 'three';
import { captureAnimationRig, restoreAnimationRig, type RigNode } from '../character/animationSerialization';

type Retarget = (clip: THREE.AnimationClip, target: THREE.Object3D, source: THREE.Object3D | undefined, space?: 'world-meters' | 'rest-meters') => THREE.AnimationClip;
type Motor = { node: THREE.Object3D; axis: THREE.Vector3; rest: THREE.Quaternion; angle: number; lower: number; upper: number; values: number[] };
// Angular convergence for orientation fitting; unreachable orientations stop at the constrained minimum.
const ANGULAR_PRECISION = 1e-5;
const ERROR_PRECISION = 1 - Math.cos(ANGULAR_PRECISION / 2);

/** Bake human poses onto the original single-axis motor chains, without moving any link pivot. */
export function retargetH2Clip(raw: THREE.AnimationClip, target: THREE.Object3D, source: THREE.Object3D | undefined, space: Parameters<Retarget>[3], retarget: Retarget) {
  const robot = restoreAnimationRig(captureAnimationRig(target));
  const driver = restoreAnimationRig(robot.getObjectByName('H2')!.userData.h2MotionDriver as RigNode);
  driver.scale.copy(robot.scale);
  driver.updateMatrixWorld(true);
  driver.traverse(node => Object.assign(node, {
    defaultPosition: node.position.clone(), restLocalQuaternion: node.quaternion.clone(),
    restWorldQuaternion: node.getWorldQuaternion(new THREE.Quaternion()),
    restWorldPosition: node.getWorldPosition(new THREE.Vector3()),
  }));
  const clip = retarget(raw, driver, source, space);
  const mixer = new THREE.AnimationMixer(driver);
  mixer.clipAction(clip).setLoop(THREE.LoopOnce, 1).play().clampWhenFinished = true;
  const motors = new Map<THREE.Object3D, Motor>();
  const endpoints: { node: THREE.Object3D; reference: THREE.Object3D; correction: THREE.Quaternion; chain: Motor[] }[] = [];
  const feet: THREE.Object3D[] = [];
  let pelvis: THREE.Object3D | undefined;
  robot.traverse(node => {
    const joint = node.userData.robotJoint;
    if (joint) {
      const axis = new THREE.Vector3().fromArray(joint.axis);
      if (axis.lengthSq() !== 1 || !Number.isFinite(joint.lower) || !Number.isFinite(joint.upper) || !(joint.lower < joint.upper)) throw new Error(`Invalid H2 motor: ${node.name}`);
      motors.set(node, { node, axis, rest: node.quaternion.clone(), angle: 0, lower: joint.lower, upper: joint.upper, values: [] });
    }
    if (node.userData.footBounds) feet.push(node);
    const semantic = node.userData.humanoidBone;
    if (!semantic) return;
    if (semantic === 'Hips') pelvis = node;
    const reference = driver.getObjectByName(`mixamorig${semantic}`);
    if (!reference) throw new Error(`Missing H2 motion reference: ${semantic}`);
    const correction = reference.getWorldQuaternion(new THREE.Quaternion()).invert()
      .multiply(new THREE.Quaternion().fromArray(node.userData.motionRestWorld));
    const chain: Motor[] = [];
    for (let link: THREE.Object3D | null = node; link; link = link.parent) {
      if (link !== node && link.userData.humanoidBone) break;
      const motor = motors.get(link);
      if (motor) chain.push(motor);
    }
    endpoints.push({ node, reference, correction, chain });
  });
  if (motors.size !== 31 || !pelvis || feet.length !== 2) throw new Error('Incomplete official H2 motor rig');
  const north = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
  const current = new THREE.Quaternion(), desired = new THREE.Quaternion(), error = new THREE.Quaternion();
  const rotation = new THREE.Quaternion(), axis = new THREE.Vector3(), point = new THREE.Vector3();
  const rootPositions: number[] = [], rootRotations: number[] = [], times: number[] = [];
  const frames = Math.ceil(raw.duration * 30); // Same 30 Hz preparation as the humanoid pipeline.
  const setAngle = (motor: Motor, angle: number) => {
    motor.angle = angle;
    motor.node.quaternion.copy(motor.rest).multiply(rotation.setFromAxisAngle(motor.axis, angle));
    motor.node.updateMatrixWorld(true);
  };
  for (let frame = 0; frame <= frames; frame++) {
    const time = raw.duration * frame / frames;
    times.push(time);
    mixer.setTime(time);
    driver.updateMatrixWorld(true);
    robot.updateMatrixWorld(true);
    for (const endpoint of endpoints) {
      desired.copy(north).multiply(endpoint.reference.getWorldQuaternion(current)).multiply(endpoint.correction);
      if (endpoint.node === pelvis) {
        pelvis.quaternion.copy(pelvis.parent!.getWorldQuaternion(current).invert()).multiply(desired);
        endpoint.reference.getWorldPosition(point).applyQuaternion(north);
        pelvis.position.copy(pelvis.parent!.worldToLocal(point));
        pelvis.updateMatrixWorld(true);
        continue;
      }
      const residual = () => 1 - Math.abs(desired.dot(endpoint.node.getWorldQuaternion(current)));
      let improvement: number;
      do {
        const before = residual();
        for (const motor of endpoint.chain) {
          motor.node.getWorldQuaternion(current);
          axis.copy(motor.axis).applyQuaternion(current);
          error.copy(desired).multiply(endpoint.node.getWorldQuaternion(current).invert());
          const delta = 2 * Math.atan2(error.x * axis.x + error.y * axis.y + error.z * axis.z, error.w);
          const previous = motor.angle;
          let bestAngle = previous, bestError = residual();
          // Equivalent revolutions are compared to avoid discontinuities at +/- pi.
          const turn = Math.round(-delta / (2 * Math.PI));
          for (const winding of [turn - 1, turn, turn + 1]) {
            const angle = THREE.MathUtils.clamp(previous + delta + winding * 2 * Math.PI, motor.lower, motor.upper);
            setAngle(motor, angle);
            const candidate = residual();
            if (candidate < bestError - Number.EPSILON) { bestAngle = angle; bestError = candidate; }
          }
          setAngle(motor, bestAngle);
        }
        improvement = before - residual();
      } while (improvement > ERROR_PRECISION);
    }
    // Sole bounds come from the official foot meshes; only whole-body height may change.
    let floor = Infinity;
    for (const foot of feet) for (const corner of foot.userData.footBounds) {
      floor = Math.min(floor, point.fromArray(corner).applyMatrix4(foot.matrixWorld).y);
    }
    if (!Number.isFinite(floor)) throw new Error('Invalid H2 sole bounds');
    if (floor < 0 || raw.name === 'walking' || raw.name === 'female-walk') {
      pelvis.position.y -= floor / pelvis.parent!.getWorldScale(point).y;
    }
    rootPositions.push(...pelvis.position.toArray());
    rootRotations.push(...pelvis.quaternion.toArray());
    for (const motor of motors.values()) motor.values.push(...motor.node.quaternion.toArray());
  }
  mixer.stopAllAction();
  mixer.uncacheRoot(driver);
  return new THREE.AnimationClip(raw.name, raw.duration, [
    new THREE.VectorKeyframeTrack(`${pelvis.name}.position`, times, rootPositions),
    new THREE.QuaternionKeyframeTrack(`${pelvis.name}.quaternion`, times, rootRotations),
    ...[...motors.values()].map(motor => new THREE.QuaternionKeyframeTrack(`${motor.node.name}.quaternion`, times, motor.values)),
  ]);
}
