import * as THREE from 'three';

export interface AircraftFlightControls {
  pitch: number;
  roll: number;
  yaw: number;
  power: number;
}

const AILERON_LIMIT = THREE.MathUtils.degToRad(22);
const ELEVATOR_LIMIT = THREE.MathUtils.degToRad(25);
const RUDDER_LIMIT = THREE.MathUtils.degToRad(20);
const SERVO_RESPONSE_SECONDS = 0.12;
const IDLE_RPM = 1200;
const FULL_POWER_RPM = 2400;

/** Commande les articulations du Koï dans leurs vrais repères de charnière. */
export function createKoiFlightControls(scene: THREE.Object3D) {
  scene.updateWorldMatrix(true, true);
  const aircraftRotation = scene.getWorldQuaternion(new THREE.Quaternion());
  const rotation = new THREE.Quaternion();
  function hinge(name: string, axis: THREE.Vector3) {
    let bone: THREE.Bone | undefined;
    scene.traverse(object => {
      if ((object as THREE.Bone).isBone && object.name === name) bone = object as THREE.Bone;
    });
    if (!bone) throw new Error(`Articulation Koï absente : ${name}`);
    return {
      bone,
      rest: bone.quaternion.clone(),
      axis: axis.clone().applyQuaternion(aircraftRotation)
        .applyQuaternion(bone.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize(),
    };
  }
  const x = new THREE.Vector3(1, 0, 0);
  const left = ['FrontWingL', 'FrontLinkL'].map(name => hinge(name, x));
  const right = ['FrontWingR', 'FrontLinkR'].map(name => hinge(name, x));
  const elevator = ['BackWingL', 'BackWingR', 'BackLinkL', 'BackLinkR'].map(name => hinge(name, x));
  const rudder = hinge('BackWingVertical', new THREE.Vector3(0, 1, 0));
  const propellers = ['Rotor', 'Rotor001', 'Rotor002'].map(name => hinge(name, new THREE.Vector3(0, 0, 1)));
  const current = { pitch: 0, roll: 0, yaw: 0, power: 0 };
  let propellerAngle = 0;
  function deflect(joint: ReturnType<typeof hinge>, angle: number) {
    joint.bone.quaternion.copy(joint.rest).multiply(rotation.setFromAxisAngle(joint.axis, angle));
  }
  return (delta: number, input?: AircraftFlightControls) => {
    const blend = 1 - Math.exp(-delta / SERVO_RESPONSE_SECONDS);
    for (const key of ['pitch', 'roll', 'yaw', 'power'] as const) {
      current[key] = THREE.MathUtils.lerp(current[key], input?.[key] ?? 0, blend);
    }
    left.forEach(joint => deflect(joint, -current.roll * AILERON_LIMIT));
    right.forEach(joint => deflect(joint, current.roll * AILERON_LIMIT));
    elevator.forEach(joint => deflect(joint, -current.pitch * ELEVATOR_LIMIT));
    deflect(rudder, current.yaw * RUDDER_LIMIT);
    const rpm = input && input.power > 0 ? THREE.MathUtils.lerp(IDLE_RPM, FULL_POWER_RPM, current.power) : 0;
    propellerAngle = (propellerAngle + rpm * Math.PI * 2 / 60 * delta) % (Math.PI * 2);
    propellers.forEach(joint => deflect(joint, propellerAngle));
  };
}
