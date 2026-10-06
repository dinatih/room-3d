const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const path = require('node:path');
const projectRoot = path.resolve(__dirname, '..');
const localRequire = createRequire(path.join(projectRoot, 'package.json'));
const ts = localRequire('typescript');
const THREE = localRequire('three');
let frame;
const effects = [];
const refs = [];
const camera = new THREE.PerspectiveCamera(50, 1, 5);
const cameraState = { characterHeight: 170, characterX: 0, characterZ: 0, landingStripsVisible: false };
const planeInput = { pitch: 0, roll: 0, throttle: 0 };
const windowTarget = new EventTarget();
const documentTarget = new EventTarget();
class KeyboardEvent extends Event { constructor(type, init) { super(type, { cancelable: true }); Object.assign(this, init); } }
const exportsObject = {};
const code = ts.transpileModule(fs.readFileSync(path.join(projectRoot, 'src/features/scene/PaperPlane.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
vm.runInNewContext(code, {
  exports: exportsObject, window: windowTarget, document: documentTarget, HTMLElement: class {}, KeyboardEvent,
  require(name) {
    if (name === 'react') return { useRef(value) { const ref = { current: value === null && !refs.some(ref => ref.current instanceof THREE.Group) ? new THREE.Group() : value }; refs.push(ref); return ref; }, useEffect(fn) { effects.push(fn); }, useMemo(fn) { return fn(); } };
    if (name === '@react-three/fiber') return { useThree: () => ({ camera, invalidate() {} }), useFrame(fn) { frame = fn; } };
    if (name === '@react-three/drei') return { useGLTF: Object.assign(() => {}, { preload() {} }) };
    if (name === './wallData') return { ROOM_W: 300, ROOM_D: 400, WALL_H: 250 };
    if (name === './cameraState') return { cameraState };
    if (name === './sceneLayer') return { CategoryLayerGroup: () => null };
    if (name === './config') return { LAYER_AIRCRAFT: 29 };
    if (name === './skyBounds') return { SKY_CENTER: [150, 0, 150], SKY_RADIUS: 3600 };
    if (name === './planeInput') return { planeInput };
    if (name === './LandingStrips') return { LANDING_STRIPS: [{ cx: 150, cz: 200, angleY: 0, length: 300 }] };
    if (name === './useGLTFClone') return {};
    return localRequire(name);
  },
});
let exitCount = 0;
let modelChanges = 0;
exportsObject.PaperPlane({ onExit: () => exitCount++, onCycleModel: () => modelChanges++ });
const paper = exportsObject.PaperPlaneMesh();
refs.find(ref => ref.current instanceof THREE.Group).current.add(new THREE.Mesh(paper.props.geometry, new THREE.MeshBasicMaterial()));
const cleanups = effects.map(fn => fn());
const flight = refs.find(ref => ref.current && ref.current.speed === 130).current;
const key = (type, key) => windowTarget.dispatchEvent(new KeyboardEvent(type, { key }));
frame({}, 1 / 60);
assert.equal(cameraState.planeSpeed, 0);
key('keydown', 'c');
key('keydown', 'c');
assert.equal(cameraState.planeViewMode, 'cockpit');
key('keydown', 'v');
assert.equal(modelChanges, 1, 'V cycles plane models');
windowTarget.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', repeat: true }));
assert.equal(modelChanges, 1, 'holding V does not repeatedly cycle');
const beforeCtrl = flight.speed;
windowTarget.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true }));
windowTarget.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', ctrlKey: true }));
frame({}, 1 / 60);
assert(flight.speed > beforeCtrl, 'Ctrl accelerates');
assert(flight.roll > 0, 'steering works while Ctrl is held');
key('keyup', 'Control');
key('keyup', 'ArrowLeft');
key('keydown', 'a');
frame({}, 1 / 60);
assert(flight.roll > 0, 'left command banks left');
assert(flight.yaw > Math.PI, 'left bank turns left');
assert(camera.quaternion.angleTo(flight.quat) < 1e-6, 'cockpit preserves aircraft roll and pitch');

key('keydown', 'c');
assert.equal(cameraState.planeViewMode, 'character');
for (const pose of [
  { eyes: [80, 175, 40], forward: [0, 0, 1], up: [0, 1, 0] },
  { eyes: [350, 45, -200], forward: [1, 0, 0], up: [0, 0, 1] },
  { eyes: [-100, 220, 300], forward: [0, 1, 0], up: [0, 0, -1] },
]) {
  cameraState.activeEyesPos = Object.fromEntries(['x', 'y', 'z'].map((key, i) => [key, pose.eyes[i]]));
  cameraState.activeHeadForward = Object.fromEntries(['x', 'y', 'z'].map((key, i) => [key, pose.forward[i]]));
  cameraState.activeHeadUp = Object.fromEntries(['x', 'y', 'z'].map((key, i) => [key, pose.up[i]]));
  frame({}, 1 / 60);
  const expected = new THREE.Vector3(...pose.eyes).addScaledVector(new THREE.Vector3(...pose.forward), 2);
  assert(camera.position.distanceTo(expected) < 1e-6, 'PNJ camera remains exactly 2 cm ahead of animated eyes');
  assert.equal(camera.near, .1, 'PNJ camera uses FPV near plane');
  const targetDirection = flight.pos.clone().sub(camera.position).normalize();
  assert(camera.getWorldDirection(new THREE.Vector3()).dot(targetDirection) > .99999, 'PNJ camera tracks aircraft');
}
key('keydown', 'c');
frame({}, 1 / 60);
assert.equal(camera.near, 5, 'previous near plane restored after PNJ view');

key('keydown', 'w');
frame({}, 1 / 60);
assert(flight.pitch < -.05, 'up arrow/W pitches down');
windowTarget.dispatchEvent(new Event('blur'));
const pitch = flight.pitch;
frame({}, 1 / 60);
assert.equal(flight.pitch, pitch, 'blur releases controls and retains pitch attitude');
planeInput.pitch = 1;
planeInput.roll = -1;
planeInput.throttle = 1;
const speed = flight.speed;
frame({}, 1 / 60);
assert(flight.speed > speed, 'mobile throttle accelerates');
assert(flight.pitch > pitch, 'mobile pitch input reaches physics');
Object.assign(planeInput, { pitch: 0, roll: 0, throttle: 0 });
// Deux tours complets, dans les deux sens, en cockpit et en suivi.
for (const view of ['follow', 'cockpit']) {
  while (cameraState.planeViewMode !== view) key('keydown', 'c');
  for (const direction of [-1, 1]) {
    flight.pos.set(150, 1600, 150);
    Object.assign(flight, { yaw: 0, pitch: 0, roll: 0, speed: 130 });
    planeInput.pitch = direction;
    planeInput.throttle = 1;
    let accumulated = 0;
    let lastPitch = 0;
    let wasInverted = false;
    const turnFrames = Math.ceil(4 * Math.PI / (1.6 / 60));
    let previousCameraRotation = null;
    for (let i = 0; i < turnFrames; i++) {
      frame({}, 1 / 60);
      const difference = flight.pitch - lastPitch;
      accumulated += Math.atan2(Math.sin(difference), Math.cos(difference));
      lastPitch = flight.pitch;
      if (Math.cos(flight.pitch) < 0) wasInverted = true;
      if (view === 'cockpit') assert(camera.quaternion.angleTo(flight.quat) < 1e-6, 'cockpit follows full looping');
      if (view === 'follow' && previousCameraRotation) assert(camera.quaternion.angleTo(previousCameraRotation) < .2, 'follow camera does not flip at the vertical');
      previousCameraRotation = camera.quaternion.clone();
    }
    assert(wasInverted, 'loop passes through inverted attitude');
    assert(direction * accumulated >= 4 * Math.PI, 'two complete loops without pitch limit');
    planeInput.pitch = 0;
    const retainedPitch = flight.pitch;
    frame({}, 1 / 60);
    assert(Math.abs(flight.pitch - retainedPitch) < 1e-12, 'releasing stick retains attitude after looping');
  }
}
Object.assign(planeInput, { pitch: 0, roll: 0, throttle: 0 });
flight.pos.set(150, 100, 3740);
Object.assign(flight, { yaw: Math.PI, pitch: 0, roll: 0 });
frame({}, 1 / 60);
assert.equal(cameraState.planeSkyContact, true, 'aircraft touches sky boundary');
const bounds = new THREE.Box3().setFromObject(refs.find(ref => ref.current instanceof THREE.Group).current, true).getBoundingSphere(new THREE.Sphere());
assert(bounds.center.distanceTo(new THREE.Vector3(150, 0, 150)) + bounds.radius <= 3600 + 1e-6, 'whole plane stays inside sky');
flight.pos.set(150, 100, 3600);
frame({}, 1 / 60);
assert.equal(cameraState.planeSkyContact, false, 'sky contact clears after leaving boundary');
Object.assign(flight, { yaw: 0, pitch: Math.PI, roll: 0 });
flight.quat.setFromEuler(new THREE.Euler(Math.PI, 0, 0, 'YXZ'));
flight.pos.set(150, 30, 200);
cameraState.landingStripsVisible = true;
frame({}, 1 / 60);
assert.notEqual(cameraState.planeViewMode, 'landing', 'inverted flight does not trigger automatic landing');
Object.assign(flight, { yaw: Math.PI, pitch: 0, roll: 0 });
flight.quat.setFromEuler(new THREE.Euler(0, Math.PI, 0, 'YXZ'));
flight.pos.set(150, 21, 200);
for (let i = 0; i < 30; i++) frame({}, 1 / 60);
assert.equal(cameraState.planeViewMode, 'landed');
assert.equal(cameraState.planeSpeed, 0);
assert.equal(flight.speed, 0);
key('keydown', 'f');
assert.equal(exitCount, 0, 'F is handled only by Studio');
key('keydown', 'Escape');
assert.equal(exitCount, 1);
cleanups.forEach(fn => fn?.());
assert.equal(cameraState.mode, 'orbit');
assert.deepEqual(camera.up.toArray(), [0, 1, 0]);
console.log('Flight checks passed: cockpit, controls, focus, mobile input, landing, exit.');
