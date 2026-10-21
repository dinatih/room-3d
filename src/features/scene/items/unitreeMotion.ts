import { Box3, Matrix4, Object3D, Quaternion, Vector3, type Mesh } from 'three';

type Joint = { node: Object3D; rest: Quaternion; axis: Vector3; home: number };

/** Visual choreography in radians; locomotion stays in place in the preview. */
export function createUnitreeMotion(scene: Object3D, model: 'g1' | 'go2') {
  const joints = new Map<string, Joint>();
  const feet: Mesh[] = [];
  scene.traverse(node => {
    if (node.userData.jointAxis) {
      joints.set(node.name, {
        node, rest: node.quaternion.clone(),
        axis: new Vector3(...node.userData.jointAxis as [number, number, number]).normalize(),
        home: node.userData.restAngle,
      });
    }
    if ((node as Mesh).isMesh && (model === 'g1'
      ? node.name.endsWith('ankle_roll_link_visual')
      : node.name.endsWith('calf_foot'))) {
      const mesh = node as Mesh;
      mesh.geometry.computeBoundingBox();
      feet.push(mesh);
    }
  });
  const expectedJoints = model === 'g1' ? 29 : 12;
  if (joints.size !== expectedJoints || feet.length !== (model === 'g1' ? 2 : 4)) {
    throw new Error(`Unitree ${model}: invalid articulated model (${joints.size} joints, ${feet.length} feet)`);
  }
  const rotation = new Quaternion();
  const inverse = new Matrix4();
  const relative = new Matrix4();
  const box = new Box3();
  const footBox = new Box3();
  function set(name: string, angle: number) {
    const joint = joints.get(name);
    if (!joint) throw new Error(`Unitree ${model}: missing joint ${name}`);
    joint.node.quaternion.copy(joint.rest).multiply(rotation.setFromAxisAngle(joint.axis, angle - joint.home));
  }
  return (motion: string, seconds: number, entrySeconds = seconds) => {
    for (const joint of joints.values()) joint.node.quaternion.copy(joint.rest);
    const phase = seconds * Math.PI * 2;
    // Ease into every gesture from the model's resting posture.
    const entry = 1 - Math.exp(-entrySeconds * 4);
    const slow = Math.sin(phase / 3);
    if (model === 'g1') {
      for (const [side, offset] of [['left', 0], ['right', Math.PI]] as const) {
        const stride = Math.sin(phase * 0.8 + offset);
        let hip = 0, knee = 0;
        set(`${side}_shoulder_pitch_joint`, motion === 'idle' ? 0 : 0.1 * entry);
        // In the source URDF, the forearm points forward at zero; +90° lowers it.
        set(`${side}_elbow_joint`, motion === 'idle' ? Math.PI / 2 : 0.3 * entry);
        if (motion === 'walk') {
          hip = -0.28 * stride * entry;
          knee = (0.1 + 0.45 * Math.max(0, stride)) * entry;
          set(`${side}_shoulder_pitch_joint`, 0.25 * stride * entry);
          set(`${side}_elbow_joint`, 0.45 * entry);
        } else if (motion === 'dance') {
          hip = (-0.1 + 0.06 * slow) * entry;
          knee = (0.2 - 0.12 * slow) * entry;
          set(`${side}_shoulder_roll_joint`, (side === 'left' ? 1 : -1) * (0.7 + 0.3 * Math.sin(phase / 2)) * entry);
          set(`${side}_elbow_joint`, (0.6 + 0.35 * stride) * entry);
        }
        set(`${side}_hip_pitch_joint`, hip);
        set(`${side}_knee_joint`, knee);
        set(`${side}_ankle_pitch_joint`, -hip - knee);
      }
      if (motion === 'wave') {
        set('right_shoulder_pitch_joint', -1.1 * entry);
        set('right_shoulder_roll_joint', -0.7 * entry);
        set('right_elbow_joint', -0.35 * entry);
        set('right_wrist_roll_joint', 0.5 * Math.sin(phase * 1.2) * entry);
      }
      set('waist_pitch_joint', motion === 'bow' ? 0.42 * (0.5 - 0.5 * Math.cos(phase / 4)) * entry : 0);
      set('waist_yaw_joint', motion === 'dance' ? 0.28 * slow * entry : 0);
      if (!['idle', 'walk', 'wave', 'bow', 'dance'].includes(motion)) throw new Error(`Unknown G1 motion: ${motion}`);
    } else {
      for (const leg of ['FL', 'FR', 'RL', 'RR']) {
        const diagonal = leg === 'FL' || leg === 'RR' ? 0 : Math.PI;
        let hip = 0, thigh = 0.9, calf = -1.8;
        if (motion === 'trot') {
          // Two-link sagittal IK. Link lengths and home angles are from go2.xml.
          const gait = phase * 1.4 + diagonal;
          // +X points forward: swing travels back to front; stance pushes backward.
          const cycle = ((gait / (2 * Math.PI)) % 1 + 1) % 1;
          const x = (cycle < 0.5 ? -0.045 * Math.cos(cycle * 2 * Math.PI) : 0.045 - 0.18 * (cycle - 0.5)) * entry;
          const down = 2 * 0.213 * Math.cos(0.9) - 0.04 * Math.max(0, Math.sin(gait)) * entry;
          calf = -Math.acos((x * x + down * down - 2 * 0.213 ** 2) / (2 * 0.213 ** 2));
          thigh = Math.atan2(-x, down) - calf / 2;
        } else if (motion === 'paw' && leg === 'FR') {
          thigh -= 0.8 * entry;
          calf -= (0.4 + 0.12 * Math.sin(phase)) * entry;
        } else if (motion === 'bow') {
          const bend = (0.5 - 0.5 * Math.cos(phase / 4)) * entry;
          thigh += 0.3 * bend;
          calf -= 0.6 * bend;
        } else if (motion === 'dance') {
          hip = 0.12 * slow * entry;
          thigh += 0.13 * Math.sin(phase / 2 + diagonal) * entry;
          calf -= 0.26 * Math.sin(phase / 2 + diagonal) * entry;
        }
        set(`${leg}_hip_joint`, hip);
        set(`${leg}_thigh_joint`, thigh);
        set(`${leg}_calf_joint`, calf);
      }
      if (!['idle', 'trot', 'paw', 'bow', 'dance'].includes(motion)) throw new Error(`Unknown Go2 motion: ${motion}`);
    }
    // Ground using cached foot boxes in model coordinates, independent of placement.
    scene.position.y = 0;
    scene.updateWorldMatrix(true, true);
    inverse.copy(scene.matrixWorld).invert();
    box.makeEmpty();
    for (const foot of feet) {
      relative.multiplyMatrices(inverse, foot.matrixWorld);
      footBox.copy(foot.geometry.boundingBox!).applyMatrix4(relative);
      box.union(footBox);
    }
    scene.position.y = -box.min.y;
  };
}

/** Natural support-foot speed in scene units, measured on the actual articulated model. */
export function measureUnitreeWalkSpeed(scene: Object3D, model: 'g1' | 'go2'): number {
  const rig = scene.clone(true);
  const animate = createUnitreeMotion(rig, model);
  const feet: Object3D[] = [];
  rig.traverse(node => {
    if ((node as Mesh).isMesh && (model === 'g1' ? node.name.endsWith('ankle_roll_link_visual') : node.name.endsWith('calf_foot'))) feet.push(node);
  });
  const duration = 1 / (model === 'g1' ? 0.8 : 1.4);
  // Sample at the same 30 Hz as the character animation pipeline.
  const frames = Math.ceil(duration * 30);
  let previous: Vector3[] | undefined, distance = 0;
  for (let frame = 0; frame <= frames; frame++) {
    animate(model === 'g1' ? 'walk' : 'trot', duration * frame / frames, Infinity);
    rig.updateMatrixWorld(true);
    const points = feet.map(foot => foot.getWorldPosition(new Vector3()));
    if (previous) {
      const support = points.reduce((best, point, index) => point.y + previous![index].y < points[best].y + previous![best].y ? index : best, 0);
      distance += Math.hypot(points[support].x - previous[support].x, points[support].z - previous[support].z);
    }
    previous = points;
  }
  const speed = distance / duration;
  if (!Number.isFinite(speed) || speed <= 0) throw new Error(`Unitree ${model}: invalid stride`);
  return speed;
}
