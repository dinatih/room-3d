// Offline GLB repair; no per-animation correction runs in the application.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
require('../tests/support/load-ts.cjs');
const T = require('three');
const { ANIMATION_DEFINITIONS } = require('../src/features/scene/animations/animationRegistry.ts');
const { ANIMATION_WALK_SPEEDS } = require('../src/features/scene/ai/agent/agentWalkAnimations.ts');
const { retargetClip } = require('../src/features/scene/retargeting/retargetClip.ts');
const { resolveTargetBoneName } = require('../src/features/scene/retargeting/boneResolver.ts');

function supportCorrections(frames) {
  const travel = [new T.Vector3()];
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1], b = frames[i];
    const support = a.feet[0].y + b.feet[0].y <= a.feet[1].y + b.feet[1].y ? 0 : 1;
    travel.push(travel[i - 1].clone().add(b.feet[support].clone().sub(a.feet[support])));
  }
  const total = travel[travel.length - 1];
  return travel.map((value, i) => total.clone().multiplyScalar(i / (frames.length - 1)).sub(value).setY(0));
}

// Append animation accessors, retaining original geometry and compressed buffer bytes.
function replaceTranslation(bytes, nodeName, times, values) {
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength));
  const original = bytes.subarray(28 + jsonLength, 28 + jsonLength + bytes.readUInt32LE(20 + jsonLength));
  const chunks = [original]; let length = original.length;
  function accessor(array, size) {
    const data = Buffer.from(new Float32Array(array).buffer);
    const view = json.bufferViews.push({ buffer: 0, byteOffset: length, byteLength: data.length }) - 1;
    chunks.push(data); length += data.length;
    const min = Array(size).fill(Infinity), max = Array(size).fill(-Infinity);
    array.forEach((value, i) => { assert(Number.isFinite(value)); min[i % size] = Math.min(min[i % size], value); max[i % size] = Math.max(max[i % size], value); });
    return json.accessors.push({ bufferView: view, componentType: 5126, count: array.length / size, type: size === 1 ? 'SCALAR' : 'VEC3', min, max }) - 1;
  }
  const node = json.nodes.findIndex(n => n.name.replace(/:/g, '') === nodeName.replace(/:/g, ''));
  const channel = json.animations[0].channels.find(c => c.target.node === node && c.target.path === 'translation');
  assert(channel, `Missing source translation ${nodeName}`);
  const sampler = json.animations[0].samplers[channel.sampler];
  sampler.input = accessor(times, 1); sampler.output = accessor(values, 3); sampler.interpolation = 'LINEAR';
  json.buffers[0].byteLength = length;
  const scene = json.scenes[json.scene ?? 0];
  scene.extras = { ...scene.extras, animationSampling: 'source', walkStrideBake: 'pelvis support correction, 240 Hz, centimetre reference rig' };
  let encoded = Buffer.from(JSON.stringify(json));
  encoded = Buffer.concat([encoded, Buffer.alloc((4 - encoded.length % 4) % 4, 32)]);
  const header = Buffer.alloc(20); header.write('glTF'); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + encoded.length + length, 8); header.writeUInt32LE(encoded.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(length, 0); binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, encoded, binHeader, ...chunks]);
}

async function main() {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader(); loader.setDRACOLoader({ preload() {} });
  loader.register(() => ({ name: 'SkeletonOnly', loadMesh: () => Promise.resolve(new T.Group()) }));
  const parse = bytes => loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const referenceBytes = fs.readFileSync('public/characters/lara/lara_native.glb');
  const definitions = ANIMATION_DEFINITIONS.filter(d => Object.hasOwn(ANIMATION_WALK_SPEEDS, d.id));
  const reports = [];
  for (const def of definitions) {
    const filename = 'public/' + def.path, bytes = fs.readFileSync(filename);
    const source = await parse(bytes);
    assert(!source.scene.userData.walkStrideBake, `Already baked: ${def.id}`);
    source.scene.userData.animationSampling = 'source';
    const raw = source.animations[0].clone(); raw.name = def.id;
    const root = raw.tracks.find(t => /(?:boneroot|rootjoint)\.position$/i.test(t.name))
      ?? raw.tracks.find(t => /(?:hips|hip|pelvis)\.position$/i.test(t.name));
    assert(root, `Missing source pelvis: ${def.id}`);
    const count = Math.ceil(raw.duration * 240);
    const times = Float32Array.from({ length: count + 1 }, (_, i) => raw.duration * i / count);
    const interpolant = new T.LinearInterpolant(root.times, root.values, 3);
    const original = Float32Array.from(Array.from(times).flatMap(time => Array.from(interpolant.evaluate(time))));
    const rootIndex = raw.tracks.indexOf(root);
    raw.tracks[rootIndex] = new T.VectorKeyframeTrack(root.name, times, original);
    const target = (await parse(referenceBytes)).scene;
    target.scale.multiplyScalar(100); target.updateMatrixWorld(true);
    target.traverse(n => { n.defaultPosition = n.position.clone(); n.restLocalQuaternion = n.quaternion.clone(); n.restWorldQuaternion = n.getWorldQuaternion(new T.Quaternion()); n.restWorldPosition = n.getWorldPosition(new T.Vector3()); });
    const hips = target.getObjectByName(resolveTargetBoneName(target, 'Hips'));
    const feet = ['Left', 'Right'].map(side => target.getObjectByName(resolveTargetBoneName(target, side + 'ToeBase')));
    function frames(clip) {
      const mixer = new T.AnimationMixer(target);
      mixer.clipAction(clip).setLoop(T.LoopOnce, 1).play().clampWhenFinished = true;
      try {
        return Array.from(times, time => {
          mixer.setTime(time); target.updateMatrixWorld(true);
          return { hips: hips.getWorldPosition(new T.Vector3()), feet: feet.map(foot => foot.getWorldPosition(new T.Vector3())) };
        });
      } finally { mixer.stopAllAction(); mixer.uncacheRoot(target); target.updateMatrixWorld(true); }
    }
    const baseline = frames(retargetClip(raw, target, source.scene, def.rootMotionSpace));
    const corrections = supportCorrections(baseline);
    // Numerically invert source axes/units, supporting both CC and Mixamo rigs.
    const probes = [];
    for (let axis = 0; axis < 3; axis++) {
      const probe = raw.clone(), values = original.slice();
      times.forEach((time, i) => { values[i * 3 + axis] += Math.sin(Math.PI * time / raw.duration); });
      probe.tracks[rootIndex] = new T.VectorKeyframeTrack(root.name, times, values);
      probes.push(frames(retargetClip(probe, target, source.scene, def.rootMotionSpace)));
    }
    const corrected = original.slice();
    for (let i = 1; i < times.length - 1; i++) {
      const x = new T.Vector3(...probes.map(probe => probe[i].hips.x - baseline[i].hips.x));
      const z = new T.Vector3(...probes.map(probe => probe[i].hips.z - baseline[i].hips.z));
      const normal = x.clone().cross(z);
      assert(normal.lengthSq() > 0, `Singular translation map: ${def.id}`);
      const inverse = new T.Matrix3().set(x.x, x.y, x.z, z.x, z.y, z.z, normal.x, normal.y, normal.z).invert();
      const delta = new T.Vector3(corrections[i].x, corrections[i].z, 0).applyMatrix3(inverse)
        .multiplyScalar(Math.sin(Math.PI * times[i] / raw.duration));
      for (let axis = 0; axis < 3; axis++) corrected[i * 3 + axis] += delta.getComponent(axis);
    }
    const baked = replaceTranslation(bytes, root.name.slice(0, -'.position'.length), Array.from(times), Array.from(corrected));
    const repaired = await parse(baked); repaired.animations[0].name = def.id;
    const after = frames(retargetClip(repaired.animations[0], target, repaired.scene, def.rootMotionSpace));
    const residual = supportCorrections(after);
    const max = points => Math.max(...points.map(point => Math.hypot(point.x, point.z)));
    const report = { id: def.id, beforeCm: max(corrections), afterCm: max(residual), keys: times.length };
    assert(report.afterCm < report.beforeCm || report.beforeCm < 0.001, `No support improvement: ${JSON.stringify(report)}`);
    reports.push(report); console.log(JSON.stringify(report));
    if (process.argv.includes('--write')) {
      const backup = path.join('/tmp/room-walk-source-backups', def.path);
      fs.mkdirSync(path.dirname(backup), { recursive: true }); fs.writeFileSync(backup, bytes, { flag: 'wx' });
      fs.writeFileSync(filename, baked);
    }
  }
  fs.writeFileSync('/tmp/room-walk-source-bake.json', JSON.stringify(reports, null, 2));
}
module.exports = { supportCorrections };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
