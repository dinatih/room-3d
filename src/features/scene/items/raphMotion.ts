import { Matrix4, Object3D, Quaternion, Vector3 } from 'three';

/** Visual patrol speed in cm/s. */
export const RAPH_DRIVE_SPEED = 60;

export function createRaphMotion(scene: Object3D) {
  scene.updateWorldMatrix(true, true);
  const inverse = new Matrix4().copy(scene.matrixWorld).invert();
  const rotation = new Quaternion();
  const joints = new Map<string, { node: Object3D; rest: Quaternion; axis: Vector3; position: Vector3; angle: number }>();
  for (const name of ['servo_l_joint', 'servo_r_joint', 'wheel_fl_joint', 'wheel_fr_joint', 'wheel_rl_joint', 'wheel_rr_joint']) {
    const node = scene.getObjectByName(name);
    if (!node?.userData.jointAxis) throw new Error(`Missing Raph joint: ${name}`);
    joints.set(name, { node, rest: node.quaternion.clone(), axis: new Vector3(...node.userData.jointAxis),
      position: node.getWorldPosition(new Vector3()).applyMatrix4(inverse), angle: 0 });
  }
  const wheels = [...joints.values()].filter(joint => joint.node.userData.wheelRadius !== undefined);
  if (wheels.length !== 4 || wheels.some(wheel => !(wheel.node.userData.wheelRadius > 0))) throw new Error('Raph requires four wheels with positive radii');
  const frontZ = (joints.get('wheel_fl_joint')!.position.z + joints.get('wheel_fr_joint')!.position.z) / 2;
  let previousSeconds = 0;
  return (motion: string, seconds: number, distance: number, yaw: number) => {
    if (!['idle', 'roll', 'turn-left', 'turn-right', 'scan', 'dance'].includes(motion)) throw new Error(`Unknown Raph motion: ${motion}`);
    if (seconds === 0) { previousSeconds = 0; wheels.forEach(wheel => { wheel.angle = 0; }); }
    const delta = seconds - previousSeconds;
    const phase = seconds * Math.PI * 2 / 4;
    if (motion === 'turn-left' || motion === 'turn-right') yaw += (motion === 'turn-left' ? 1 : -1) * delta * Math.PI / 4;
    if (motion === 'dance') yaw += (Math.sin(phase) - Math.sin(previousSeconds * Math.PI * 2 / 4)) * Math.PI / 4;
    previousSeconds = seconds;
    for (const joint of joints.values()) joint.node.quaternion.copy(joint.rest);
    for (const wheel of wheels) {
      const rear = wheel.node.name === 'wheel_rl_joint' || wheel.node.name === 'wheel_rr_joint';
      const forward = distance - yaw * wheel.position.x;
      const lateral = rear ? yaw * (wheel.position.z - frontZ) : 0;
      let steering = rear && (forward !== 0 || lateral !== 0) ? Math.atan2(lateral, forward) : 0;
      // Equivalent wheel heading nearest neutral, including reverse travel.
      if (steering > Math.PI / 2) steering -= Math.PI;
      if (steering < -Math.PI / 2) steering += Math.PI;
      if (rear && motion === 'scan') steering = Math.PI / 4 * Math.sin(phase);
      if (rear) {
        const servo = joints.get(wheel.node.name === 'wheel_rl_joint' ? 'servo_l_joint' : 'servo_r_joint')!;
        servo.node.quaternion.copy(servo.rest).multiply(rotation.setFromAxisAngle(servo.axis, -steering));
      }
      // Imported wheel axes point along +X: positive rotation rolls toward +Z.
      wheel.angle += (forward * Math.cos(steering) + lateral * Math.sin(steering)) / wheel.node.userData.wheelRadius;
      wheel.node.quaternion.copy(wheel.rest).multiply(rotation.setFromAxisAngle(wheel.axis, wheel.angle));
    }
  };
}
