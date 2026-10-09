const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const THREE = require('three');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
// Reconstituer le squelette et les clips réels du GLB, sans textures/WebGL.
const bytes = fs.readFileSync(path.join(root, 'public/characters/robin/robin.glb'));
const jsonLength = bytes.readUInt32LE(12);
const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
const binStart = 20 + jsonLength + 8;
const nodes = gltf.nodes.map(node => {
  const object = new THREE.Object3D();
  object.name = node.name;
  if (node.translation) object.position.fromArray(node.translation);
  if (node.rotation) object.quaternion.fromArray(node.rotation);
  if (node.scale) object.scale.fromArray(node.scale);
  return object;
});
gltf.nodes.forEach((node, i) => (node.children ?? []).forEach(child => nodes[i].add(nodes[child])));
const scene = new THREE.Group();
gltf.scenes[gltf.scene ?? 0].nodes.forEach(index => scene.add(nodes[index]));
function accessor(index) {
  const acc = gltf.accessors[index];
  assert.equal(acc.componentType, 5126, 'animation values are float32');
  const view = gltf.bufferViews[acc.bufferView];
  const sizes = { SCALAR: 1, VEC3: 3, VEC4: 4 };
  const width = sizes[acc.type];
  const stride = view.byteStride ?? width * 4;
  const start = binStart + (view.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  return Float32Array.from({ length: acc.count * width }, (_, i) => bytes.readFloatLE(start + Math.floor(i / width) * stride + i % width * 4));
}
const animations = gltf.animations.map(animation => new THREE.AnimationClip(animation.name, -1, animation.channels.map(channel => {
  const sampler = animation.samplers[channel.sampler];
  const types = { rotation: THREE.QuaternionKeyframeTrack, translation: THREE.VectorKeyframeTrack, scale: THREE.VectorKeyframeTrack };
  const properties = { rotation: 'quaternion', translation: 'position', scale: 'scale' };
  return new types[channel.target.path](nodes[channel.target.node].name + '.' + properties[channel.target.path], accessor(sampler.input), accessor(sampler.output), sampler.interpolation === 'STEP' ? THREE.InterpolateDiscrete : THREE.InterpolateLinear);
})));
let frame;
const effects = [];
const layouts = [];
const refs = [];
const cameraState = { positions: {} };
const exported = {};
const fixedMath = Object.create(Math);
fixedMath.random = () => 0.2;
const code = ts.transpileModule(fs.readFileSync(path.join(root, 'src/features/scene/items/RobinBird.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
vm.runInNewContext(code, { exports: exported, Math: fixedMath, document: new EventTarget(), require(name) {
  if (name === 'react') return { useRef(value) { const ref = { current: value }; refs.push(ref); return ref; }, useEffect(fn) { effects.push(fn); }, useLayoutEffect(fn) { layouts.push(fn); } };
  if (name === '@react-three/fiber') return { useFrame(fn) { frame = fn; }, useThree: () => ({ invalidate() {}, scene: new THREE.Scene() }) };
  if (name === '@react-three/drei') return { useGLTF: { preload() {} }, useHelper() {} };
  if (name.endsWith('/useGLTFClone')) return { useGLTFClone: () => ({ scene, animations }) };
  if (name.endsWith('/useSceneStore')) return { useSceneStore: fn => fn({ layers: { skeleton: false } }) };
  if (name.endsWith('/idleState')) return { isAppIdle: () => false };
  if (name.endsWith('/glbUtils')) return { glbLocalBBox: () => new THREE.Box3(new THREE.Vector3(-5, 0, -5), new THREE.Vector3(5, 15, 5)) };
  if (name.endsWith('/AppConsole')) return { appLog() {} };
  if (name.endsWith('/useAnimPreviewStore')) return {};
  if (name.endsWith('/birdPerches')) return { ROBIN_HEIGHT: 15, RobinFootContact: class { ground() { return {radius:10,height:15}; } }, chooseBirdForagePerch: () => null, birdGroundStep: (perch, world, feet, from, direction, distance) => ({...perch,point:from.clone().addScaledVector(direction,distance)}), chooseBirdPerch: () => ({ point: new THREE.Vector3(95, 215, -165), descriptor: { kind: 'feeder', id: 'feeder' } }), resolveBirdPerch(perch, world, feet, position, rotation) { position.copy(perch.point); rotation.identity(); return true; } };
  if (name.endsWith('/cameraState')) return { cameraState };
  return require(name);
} });
const element = exported.RobinBird({});
const group = new THREE.Group();
group.add(scene);
element.ref.current = group;
const cleanup = [...layouts, ...effects].map(fn => fn());
const ai = refs.find(ref => ref.current?.targetPos).current;
const head = scene.getObjectByName('Head_011');
const beak = scene.getObjectByName('Beak_012');
for (const target of [new THREE.Vector3(200, 400, -500), new THREE.Vector3(-300, 40, 800), new THREE.Vector3(100, 700, 50)]) {
  ai.state = 'idle'; ai.timer = 0;
  frame({}, 1 / 60); // passage au clip de vol
  ai.perch.point.copy(target);
  for (let i = 0; i < 60; i++) {
    const before = group.position.clone();
    frame({}, 1 / 60);
    const movement = group.position.clone().sub(before).normalize();
    const heading = beak.getWorldPosition(new THREE.Vector3()).sub(head.getWorldPosition(new THREE.Vector3())).normalize();
    assert(heading.dot(movement) > 0.9999, `beak follows flight: ${heading.dot(movement)}`);
  }
}
ai.perch.point.copy(group.position);
frame({}, 1 / 60);
assert.equal(ai.state, 'idle', 'zero distance lands without invalid direction');
assert(Math.abs(group.rotation.x) < 1e-12, 'landing levels pitch');
assert(Math.abs(group.rotation.z) < 1e-12, 'landing levels roll');
const camera = new THREE.PerspectiveCamera();
camera.position.set(10000,10000,10000);
ai.state = 'flying'; ai.perch.descriptor.kind = 'ground'; ai.perch.point.copy(group.position);
frame({camera},1/60);
assert.equal(ai.state,'foraging','landing on grass starts searching');
const forage=ai.forage;
forage.elapsed=forage.duration;
frame({camera},1/60);
assert.equal(forage.phase,'hop','search pauses can lead to short hops');
const start=group.position.clone();
frame({camera},forage.duration/2);
assert(group.position.y>start.y,'hop lifts the feet above the ground');
frame({camera},forage.duration/2);
assert(Math.abs(group.position.y-start.y)<1e-8,'hop lands at the terrain height');
assert(group.position.distanceTo(start)>0,'hop advances along the ground');
// Selecting a peck after a call allows all three healthy eating clips in sequence.
for(let i=0;i<3;i++) {
 fixedMath.random=()=>0.4;
 forage.phase='call'; forage.elapsed=forage.duration; forage.step=null;
 frame({camera},1/60);
 assert.equal(forage.phase,'peck');
 const action=refs.find(ref=>ref.current?.getClip && ref.current.getClip().name.startsWith('Robin_Bird_')).current;
 assert.equal(action.getClip().name,['Robin_Bird_Eat','Robin_Bird_Eat2','Robin_Bird_Eat3'][i]);
}
camera.position.copy(group.position);
forage.step=null;
frame({camera},1/60);
assert.equal(forage.phase,'startled','a nearby camera triggers a flinch once');
forage.elapsed=forage.duration;
frame({camera},1/60);
assert.equal(forage.phase,'backstep','flinching leads to a backward step');
cleanup.forEach(fn => fn?.());
console.log('Robin checks passed: flight heading, landing, foraging, ballistic hops, three peck variants and startle/backstep.');
