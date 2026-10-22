import { Matrix4, Object3D, Quaternion, Vector3 } from 'three';

/** Display/patrol speed in cm/s; wheel angular speed follows distance / radius. */
export const AS2W_DRIVE_SPEED = 60;

export function createAs2wMotion(scene: Object3D) {
  const joints = new Map<string, {
    node: Object3D; rest: Quaternion; axis: Vector3; home: number;
    limits?: [number, number]; radius?: number; lateral: number; angle: number;
  }>();
  scene.updateWorldMatrix(true, true);
  const inverse = new Matrix4().copy(scene.matrixWorld).invert();
  scene.traverse(node => {
    if (!node.userData.jointAxis) return;
    const radius = node.userData.wheelRadius;
    if (radius !== undefined && (!Number.isFinite(radius) || radius <= 0)) throw new Error(`Invalid As2-W wheel radius: ${node.name}`);
    joints.set(node.name, {
      node, rest: node.quaternion.clone(), axis: new Vector3(...node.userData.jointAxis as [number, number, number]).normalize(),
      home: node.userData.restAngle, limits: node.userData.jointLimits, radius,
      lateral: node.getWorldPosition(new Vector3()).applyMatrix4(inverse).x, angle: 0,
    });
  });
  const wheels = [...joints.values()].filter(joint => joint.radius !== undefined);
  if (joints.size !== 16 || wheels.length !== 4) throw new Error('As2-W requires 12 leg joints and four wheels');
  const rotation = new Quaternion();
  const point = new Vector3();
  function set(name: string, angle: number) {
    const joint = joints.get(name);
    if (!joint) throw new Error(`Missing As2-W joint: ${name}`);
    if (joint.limits) angle = Math.max(joint.limits[0], Math.min(joint.limits[1], angle));
    joint.node.quaternion.copy(joint.rest).multiply(rotation.setFromAxisAngle(joint.axis, angle - joint.home));
  }
  return (motion: string, seconds: number, distance: number, yaw: number) => {
    if (!['idle', 'roll', 'crouch', 'bow', 'dance'].includes(motion)) throw new Error(`Unknown As2-W motion: ${motion}`);
    for (const joint of joints.values()) joint.node.quaternion.copy(joint.rest);
    const entry = 1 - Math.exp(-seconds * 4);
    const phase = seconds * Math.PI * 2 / 4;
    for (const leg of ['FL', 'FR', 'RL', 'RR']) {
      let bend = 0;
      if (motion === 'crouch') bend = 0.35 * entry;
      if (motion === 'bow' && leg.startsWith('F')) bend = 0.3 * (0.5 - 0.5 * Math.cos(phase)) * entry;
      if (motion === 'dance') bend = 0.12 * Math.sin(phase + (leg === 'FL' || leg === 'RR' ? 0 : Math.PI)) * entry;
      set(`${leg}_thigh`, joints.get(`${leg}_thigh`)!.home + bend);
      set(`${leg}_calf`, joints.get(`${leg}_calf`)!.home - 2 * bend);
      // Differential travel around the chassis center also spins the wheels during turns.
      const wheel = joints.get(`${leg}_foot`)!;
      wheel.angle += (distance - yaw * wheel.lateral) / wheel.radius!;
      set(`${leg}_foot`, wheel.angle);
    }
    // Use axle height and tire radius: rotated mesh bounding boxes inflate at 45 degrees.
    scene.position.y = 0;
    scene.updateWorldMatrix(true, true);
    inverse.copy(scene.matrixWorld).invert();
    let bottom = Infinity;
    for (const wheel of wheels) {
      wheel.node.getWorldPosition(point).applyMatrix4(inverse);
      bottom = Math.min(bottom, point.y - wheel.radius!);
    }
    scene.position.y = -bottom;
  };
}
