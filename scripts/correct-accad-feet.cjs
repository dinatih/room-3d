// Bake nominal sole support into the published ACCAD GLBs (glTF Y-up).
const fs = require('node:fs');
const path = require('node:path');
const T = require('three');
const median = a => { const s = [...a].sort((x, y) => x - y); return (s[Math.floor((s.length - 1) / 2)] + s[Math.floor(s.length / 2)]) / 2; };
async function main() {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  loader.setDRACOLoader({ preload() {} });
  loader.register(() => ({ name: 'SkeletonOnly', loadMesh: () => Promise.resolve(new T.Group()) }));
  const directory = path.resolve(__dirname, '../public/animations/npz/accad');
  for (const file of fs.readdirSync(directory).filter(f => f.endsWith('.glb'))) {
    const filename = path.join(directory, file), bytes = fs.readFileSync(path.join(process.argv.includes('--write') && process.env.ACCAD_ORIGINAL_DIR ? process.env.ACCAD_ORIGINAL_DIR : directory, file));
    const size = bytes.readUInt32LE(12), doc = JSON.parse(bytes.subarray(20, 20 + size));
    if (doc.asset.extras?.accadFootSupport && !process.argv.includes('--check')) { console.log(`${file}: already corrected`); continue; }
    const { scene, animations: [clip] } = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
    scene.updateMatrixWorld(true);
    const hips = scene.getObjectByName('mixamorigHips');
    const feet = ['Left', 'Right'].map(side => {
      const ankle = scene.getObjectByName(`mixamorig${side}Foot`), toe = scene.getObjectByName(`mixamorig${side}ToeBase`);
      const a = ankle.getWorldPosition(new T.Vector3()), t = toe.getWorldPosition(new T.Vector3());
      // Nominal heel lies below the ankle on the rest toe's support plane.
      const heel = ankle.worldToLocal(new T.Vector3(a.x, t.y, a.z));
      return { ankle, toe, heel, height: a.y - t.y, samples: [], support: [] };
    });
    const hipTrack = clip.tracks.find(t => t.name === `${hips.name}.position`);
    const times = hipTrack.times;
    const mixer = new T.AnimationMixer(scene), action = mixer.clipAction(clip).setLoop(T.LoopOnce, 1);
    action.clampWhenFinished = true; action.play();
    const sample = time => { mixer.setTime(time); scene.updateMatrixWorld(true); };
    const points = foot => [foot.ankle.localToWorld(foot.heel.clone()), foot.toe.getWorldPosition(new T.Vector3())];
    for (const time of times) {
      sample(time);
      for (const foot of feet) {
        foot.samples.push(points(foot));
        const ankle = foot.ankle.getWorldPosition(new T.Vector3()), knee = foot.ankle.parent.getWorldPosition(new T.Vector3()), hip = foot.ankle.parent.parent.getWorldPosition(new T.Vector3());
        foot.support.push(T.MathUtils.clamp(Math.min(knee.y - ankle.y, hip.y - knee.y) / foot.height, 0, 1));
      }
    }
    const floors = Array.from(times, (_, i) => Math.min(...feet.flatMap(f => f.samples[i].map(p => p.y))));
    // The lying transition ceases to have standing foot support; its initial
    // double support defines the floor instead of its later airborne feet.
    const floor = file === 'anim_lie_down_bed.glb' ? floors[0] : median(floors);
    if (process.argv.includes('--check')) {
      if (!doc.asset.extras?.accadFootSupport || Math.abs(floor) > 1e-6) throw Error(`Invalid nominal floor: ${file}: ${floor}`);
      const originalBytes = fs.readFileSync(path.join(process.env.ACCAD_ORIGINAL_DIR || directory, file));
      const original = await loader.parseAsync(originalBytes.buffer.slice(originalBytes.byteOffset, originalBytes.byteOffset + originalBytes.byteLength), '');
      if (original.animations[0].duration !== clip.duration) throw Error(`Changed duration: ${file}`);
      for (const [side, foot] of feet.entries()) {
        const name = `${foot.ankle.name}.quaternion`, current = clip.tracks.find(t => t.name === name);
        const baseline = original.animations[0].tracks.find(t => t.name === name).createInterpolant();
        let travel = 0;
        for (let i = 0; i < current.times.length; i++) {
          const q = new T.Quaternion().fromArray(current.values, i * 4);
          const source = new T.Quaternion().fromArray(baseline.evaluate(current.times[i]));
          if (Math.abs(q.length() - 1) > 1e-6 || q.clone().normalize().angleTo(source.normalize()) > doc.asset.extras.accadFootSupport.maxCorrections[side] + 1e-5) throw Error(`Accumulated ankle rotation: ${file} frame ${i}`);
          if (i) travel += q.angleTo(new T.Quaternion().fromArray(current.values, (i - 1) * 4));
        }
        console.log(`  ${foot.ankle.name}: total angular travel ${(travel * 180 / Math.PI).toFixed(1)}°; correction bound verified`);
      }
      for (const track of original.animations[0].tracks) {
        if (feet.some(f => track.name === `${f.ankle.name}.quaternion`) || track.name === hipTrack.name) continue;
        const current = clip.tracks.find(t => t.name === track.name);
        if (!current || !Buffer.from(track.values.buffer).equals(Buffer.from(current.values.buffer)) || !Buffer.from(track.times.buffer).equals(Buffer.from(current.times.buffer))) throw Error(`Unrelated track changed: ${file}: ${track.name}`);
      }
      console.log(`${file}: nominal support at Y=0 verified (${times.length} frames)`);
      continue;
    }
    const outputs = [];
    for (const foot of feet) {
      if (!(foot.height > 0)) throw Error(`Invalid sole geometry: ${file}`);
      const track = clip.tracks.find(t => t.name === `${foot.ankle.name}.quaternion`);
      const values = new Float32Array(times.length * 4), originalRotation = track.createInterpolant();
      let maxCorrection = 0;
      for (let i = 0; i < times.length; i++) {
        sample(times[i]);
        // Mixer bindings cache unchanged samples: never accumulate on the bone
        // quaternion mutated by the preceding correction.
        foot.ankle.quaternion.fromArray(originalRotation.evaluate(times[i]));
        const [heel, toe] = foot.samples[i], direction = toe.clone().sub(heel);
        const weight = T.MathUtils.clamp(1 - Math.max(heel.y - floor, 0) / foot.height, 0, 1);
        const pitch = Math.atan2(direction.y, Math.hypot(direction.x, direction.z));
        const angle = Math.max(pitch, 0) * weight * foot.support[i];
        if (angle > 0) {
          const axis = new T.Vector3(0, 1, 0).cross(direction).normalize();
          const parent = foot.ankle.parent.getWorldQuaternion(new T.Quaternion());
          const correction = new T.Quaternion().setFromAxisAngle(axis, angle);
          foot.ankle.quaternion.copy(parent.clone().invert().multiply(correction).multiply(parent).multiply(foot.ankle.quaternion));
        }
        maxCorrection = Math.max(maxCorrection, angle);
        foot.ankle.quaternion.toArray(values, i * 4);
      }
      outputs.push({ track, values, type: 'VEC4', maxCorrection });
      console.log(`${file} ${foot.ankle.name}: maximum correction ${(maxCorrection * 180 / Math.PI).toFixed(2)}°`);
    }
    // Evaluate both corrected ankles together before measuring nominal support.
    const corrected = clip.clone();
    for (const out of outputs) corrected.tracks[clip.tracks.indexOf(out.track)] = new T.QuaternionKeyframeTrack(out.track.name, times, out.values);
    mixer.stopAllAction(); mixer.uncacheRoot(scene);
    const correctedAction = mixer.clipAction(corrected).setLoop(T.LoopOnce, 1); correctedAction.clampWhenFinished = true; correctedAction.play();
    const correctedFloors = Array.from(times, time => { sample(time); return Math.min(...feet.flatMap(f => points(f).map(p => p.y))); });
    const offset = file === 'anim_lie_down_bed.glb' ? correctedFloors[0] : median(correctedFloors);
    sample(0);
    const localOffset = new T.Vector3(0, offset, 0).applyMatrix3(new T.Matrix3().setFromMatrix4(hips.parent.matrixWorld).invert());
    const positions = hipTrack.values.slice();
    for (let i = 0; i < positions.length; i += 3) for (let axis = 0; axis < 3; axis++) positions[i + axis] -= localOffset.getComponent(axis);
    outputs.push({ track: hipTrack, values: positions, type: 'VEC3' });
    if (!process.argv.includes('--write')) { console.log(`  nominal floor ${floor.toFixed(5)} m; corrected offset ${offset.toFixed(5)} m`); continue; }
    let binary = Buffer.from(bytes.subarray(28 + size));
    function accessor(values, type) {
      const encoded = Buffer.from(values.buffer, values.byteOffset, values.byteLength), width = type === 'SCALAR' ? 1 : type === 'VEC3' ? 3 : 4;
      const view = doc.bufferViews.push({ buffer: 0, byteOffset: binary.length, byteLength: encoded.length }) - 1;
      binary = Buffer.concat([binary, encoded]);
      const result = { bufferView: view, componentType: 5126, count: values.length / width, type };
      if (type !== 'VEC4') {
        result.min = Array.from({ length: width }, (_, axis) => Math.min(...values.filter((_, i) => i % width === axis)));
        result.max = Array.from({ length: width }, (_, axis) => Math.max(...values.filter((_, i) => i % width === axis)));
      }
      return doc.accessors.push(result) - 1;
    }
    const input = accessor(times, 'SCALAR');
    for (const out of outputs) {
      if (![...out.values].every(Number.isFinite)) throw Error(`Non-finite output: ${file}`);
      const channel = doc.animations[0].channels.find(c => `${doc.nodes[c.target.node].name.replace(/:/g, '')}.${c.target.path === 'rotation' ? 'quaternion' : c.target.path === 'translation' ? 'position' : c.target.path}` === out.track.name);
      doc.animations[0].samplers[channel.sampler] = { input, output: accessor(out.values, out.type), interpolation: 'LINEAR' };
    }
    doc.asset.extras = { ...doc.asset.extras, accadFootSupport: { method: 'nominal-sole-v2', floorOffsetMeters: offset, maxCorrections: outputs.filter(o => o.type === 'VEC4').map(o => o.maxCorrection) } };
    doc.buffers[0].byteLength = binary.length;
    let json = Buffer.from(JSON.stringify(doc)); json = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 32)]);
    const header = Buffer.alloc(20); header.writeUInt32LE(0x46546c67); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + json.length + binary.length, 8); header.writeUInt32LE(json.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
    const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(binary.length); binHeader.writeUInt32LE(0x004e4942, 4);
    fs.writeFileSync(filename, Buffer.concat([header, json, binHeader, binary]));
    console.log(`  nominal floor shifted by ${offset.toFixed(5)} m`);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
