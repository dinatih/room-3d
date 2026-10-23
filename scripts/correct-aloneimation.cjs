// Restore continuous source playback and prevent nominal soles penetrating the floor.
// Airborne poses remain free: no inferred contact intervals or per-frame floor snapping.
const fs = require('node:fs');
const path = require('node:path');
const T = require('three');
const directory = path.resolve(__dirname, '../public/animations/aloneimation');
const world = node => node.getWorldPosition(new T.Vector3());
async function main() {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader(); loader.setDRACOLoader({ preload() {} });
  loader.register(() => ({ name: 'SkeletonOnly', loadMesh: () => Promise.resolve(new T.Group()) }));
  let count = 0;
  const durations = new Map();
  for (const file of fs.readdirSync(directory).filter(file => file.endsWith('.glb')).sort()) {
    const filename = path.join(directory, file), bytes = fs.readFileSync(filename);
    const jsonLength = bytes.readUInt32LE(12), doc = JSON.parse(bytes.subarray(20, 20 + jsonLength));
    const { scene, animations: [clip] } = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
    scene.updateMatrixWorld(true);
    const hips = scene.getObjectByName('mixamorigHips');
    const feet = ['Left', 'Right'].map(side => {
      const ankle = scene.getObjectByName(`mixamorig${side}Foot`), toe = scene.getObjectByName(`mixamorig${side}ToeBase`);
      if (!ankle || !toe) throw Error(`Missing foot: ${file} ${side}`);
      const a = world(ankle), t = world(toe);
      const heel = ankle.worldToLocal(new T.Vector3(a.x, t.y, a.z));
      if (!(a.y > t.y)) throw Error(`Invalid sole geometry: ${file} ${side}`);
      return { ankle, toe, heel, height: a.y - t.y, floor: t.y };
    });
    const floor = Math.min(...feet.map(foot => foot.floor));
    const position = clip.tracks.find(track => track.name === `${hips.name}.position`);
    if (!position || !hips.parent) throw Error(`Missing pelvis: ${file}`);
    for (const track of clip.tracks) track.setInterpolation(T.InterpolateLinear);
    // Cobra's first 25 poses hide the character 78 m below the floor before
    // teleporting to its actual entrance. Other clips begin on their first key.
    const start = process.argv.includes('--check') || doc.asset.extras?.aloneimationSupport ? 0 : position.times[file === 'anim_ff_cobra_entrance.glb' ? 25 : 0];
    if (start) {
      for (const track of clip.tracks) {
        const interpolant = track.createInterpolant(), width = track.getValueSize();
        const sourceTimes = [start, ...Array.from(track.times).filter(time => time > start)];
        const values = new Float32Array(sourceTimes.length * width);
        sourceTimes.forEach((time, index) => values.set(interpolant.evaluate(time), index * width));
        track.times = new Float32Array(sourceTimes.map(time => time - start)); track.values = values;
      }
      clip.resetDuration();
    }
    durations.set(file, Number(clip.duration.toFixed(1)));
    const bindings = clip.tracks.map(track => {
      const [name, property] = track.name.split('.'), node = scene.getObjectByName(name);
      if (!node || !['position', 'quaternion', 'scale'].includes(property)) throw Error(`Invalid binding: ${file} ${track.name}`);
      for (let i = 0; i < track.times.length; i++) {
        if (!Number.isFinite(track.times[i]) || (i && track.times[i] <= track.times[i - 1])) throw Error(`Invalid frame times: ${file} ${track.name}`);
      }
      if (!Array.from(track.values).every(Number.isFinite)) throw Error(`Invalid pose: ${file} ${track.name}`);
      return { node, property, interpolant: track.createInterpolant() };
    });
    const sample = time => {
      for (const { node, property, interpolant } of bindings) node[property].fromArray(interpolant.evaluate(time));
      scene.updateMatrixWorld(true);
    };
    const points = foot => [foot.ankle.localToWorld(foot.heel.clone()), world(foot.toe)];
    if (process.argv.includes('--check')) {
      if (!doc.asset.extras?.aloneimationSupport || doc.animations.some(animation => animation.samplers.some(sampler => sampler.interpolation !== 'LINEAR'))) throw Error(`Uncorrected source: ${file}`);
      let penetration = 0;
      for (let i = 0; i < position.times.length; i++) {
        // Check keys and their midpoints, including interpolation between support samples.
        for (const time of [position.times[i], (position.times[i] + position.times[Math.min(i + 1, position.times.length - 1)]) / 2]) {
          sample(time); penetration = Math.max(penetration, floor - Math.min(...feet.flatMap(foot => points(foot).map(point => point.y))));
        }
      }
      console.log(`${file}: residual sole penetration ${(penetration * 1000).toFixed(3)} mm`);
      // Float32 source coordinates are centimetres; allow their representational precision.
      if (penetration > doc.asset.extras.aloneimationSupport.interpolationErrorMeters + 1e-6) throw Error(`Support regression: ${file}`);
      count++; continue;
    }
    if (doc.asset.extras?.aloneimationSupport) { console.log(`${file}: already corrected`); count++; continue; }
    const times = new Float32Array(Array.from(position.times).flatMap((time, i, source) => i === source.length - 1 ? [time] : Array.from({ length: 4 }, (_, step) => time + (source[i + 1] - time) * step / 4)));
    const outputs = feet.map(foot => ({ track: clip.tracks.find(track => track.name === `${foot.ankle.name}.quaternion`), values: new Float32Array(times.length * 4), type: 'VEC4' }));
    const positions = new Float32Array(times.length * 3);
    let maximumLift = 0;
    for (let i = 0; i < times.length; i++) {
      sample(times[i]);
      for (const [side, foot] of feet.entries()) {
        const [heel, toe] = points(foot), direction = toe.clone().sub(heel);
        const a = world(foot.ankle), knee = world(foot.ankle.parent), hip = world(foot.ankle.parent.parent);
        const upright = T.MathUtils.clamp(Math.min(knee.y - a.y, hip.y - knee.y) / foot.height, 0, 1);
        const support = T.MathUtils.clamp(1 - Math.max(heel.y - floor, 0) / foot.height, 0, 1) * upright;
        const angle = Math.max(0, Math.atan2(direction.y, Math.hypot(direction.x, direction.z))) * support;
        if (angle) {
          const axis = new T.Vector3(0, 1, 0).cross(direction).normalize(), parent = foot.ankle.parent.getWorldQuaternion(new T.Quaternion());
          foot.ankle.quaternion.premultiply(parent.clone().invert().multiply(new T.Quaternion().setFromAxisAngle(axis, angle)).multiply(parent));
          scene.updateMatrixWorld(true);
        }
        foot.ankle.quaternion.normalize().toArray(outputs[side].values, i * 4);
      }
      const lift = Math.max(0, floor - Math.min(...feet.flatMap(foot => points(foot).map(point => point.y))));
      maximumLift = Math.max(maximumLift, lift);
      hips.position.add(new T.Vector3(0, lift, 0).applyMatrix3(new T.Matrix3().setFromMatrix4(hips.parent.matrixWorld).invert())).toArray(positions, i * 3);
    }
    outputs.push({ track: position, values: positions, type: 'VEC3' });
    // Measure interpolation error rather than conceal it behind an arbitrary tolerance.
    for (const output of outputs) {
      const binding = bindings.find(binding => `${binding.node.name}.${binding.property}` === output.track.name);
      binding.interpolant = new (output.type === 'VEC4' ? T.QuaternionLinearInterpolant : T.LinearInterpolant)(times, output.values, output.type === 'VEC4' ? 4 : 3);
    }
    let interpolationErrorMeters = 0;
    for (let i = 1; i < times.length; i++) {
      sample((times[i - 1] + times[i]) / 2);
      interpolationErrorMeters = Math.max(interpolationErrorMeters, floor - Math.min(...feet.flatMap(foot => points(foot).map(point => point.y))));
    }
    console.log(`${file}: max lift ${(maximumLift * 100).toFixed(2)} cm, interpolation penetration ${(interpolationErrorMeters * 1000).toFixed(3)} mm`);
    count++;
    if (!process.argv.includes('--write')) continue;
    let binary = Buffer.from(bytes.subarray(28 + jsonLength));
    const accessor = (values, type) => {
      if (!Array.from(values).every(Number.isFinite)) throw Error(`Invalid output: ${file}`);
      const data = Buffer.from(values.buffer, values.byteOffset, values.byteLength), width = type === 'SCALAR' ? 1 : type === 'VEC3' ? 3 : 4;
      const bufferView = doc.bufferViews.push({ buffer: 0, byteOffset: binary.length, byteLength: data.length }) - 1;
      binary = Buffer.concat([binary, data]);
      const entry = { bufferView, componentType: 5126, count: values.length / width, type };
      if (type === 'SCALAR') { entry.min = [values[0]]; entry.max = [values[values.length - 1]]; }
      return doc.accessors.push(entry) - 1;
    };
    // Keep every surviving source key, including constant position/scale tracks.
    for (const channel of doc.animations[0].channels) {
      const property = { translation: 'position', rotation: 'quaternion', scale: 'scale' }[channel.target.path];
      const track = clip.tracks.find(track => track.name === `${doc.nodes[channel.target.node].name.replace(/:/g, '')}.${property}`);
      doc.animations[0].samplers[channel.sampler] = { input: accessor(track.times, 'SCALAR'), output: accessor(track.values, { position: 'VEC3', quaternion: 'VEC4', scale: 'VEC3' }[property]), interpolation: 'LINEAR' };
    }
    const input = accessor(times, 'SCALAR');
    for (const animation of doc.animations) for (const sampler of animation.samplers) sampler.interpolation = 'LINEAR';
    for (const output of outputs) {
      const channel = doc.animations[0].channels.find(channel => `${doc.nodes[channel.target.node].name.replace(/:/g, '')}.${channel.target.path === 'rotation' ? 'quaternion' : 'position'}` === output.track.name);
      if (!channel) throw Error(`Missing output channel: ${file} ${output.track.name}`);
      doc.animations[0].samplers[channel.sampler] = { input, output: accessor(output.values, output.type), interpolation: 'LINEAR' };
    }
    const gltfScene = doc.scenes[doc.scene || 0]; gltfScene.extras = { ...gltfScene.extras, animationSampling: 'source' };
    doc.asset.extras = { ...doc.asset.extras, aloneimationSupport: { method: 'continuous-sole-nonpenetration-v1', trimmedStartSeconds: start, maximumLiftMeters: maximumLift, interpolationErrorMeters } };
    doc.buffers[0].byteLength = binary.length;
    let json = Buffer.from(JSON.stringify(doc)); json = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 32)]);
    const header = Buffer.from(bytes.subarray(0, 20)); header.writeUInt32LE(28 + json.length + binary.length, 8); header.writeUInt32LE(json.length, 12);
    const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(binary.length); binHeader.writeUInt32LE(0x004e4942, 4);
    fs.writeFileSync(filename, Buffer.concat([header, json, binHeader, binary]));
  }
  if (process.argv.includes('--write')) {
    const registry = path.resolve(__dirname, '../src/features/scene/animations/animationRegistry.ts');
    fs.writeFileSync(registry, fs.readFileSync(registry, 'utf8').replace(/(path: 'animations\/aloneimation\/([^']+)'[\s\S]*?duration: )[\d.]+/g, (_, prefix, file) => {
      if (!durations.has(file)) throw Error(`Missing source duration: ${file}`);
      return prefix + durations.get(file).toFixed(1);
    }));
  }
  console.log(`${count} Aloneimation sources ${process.argv.includes('--check') ? 'verified' : 'processed'}`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
