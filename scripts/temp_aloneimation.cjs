// Verify corrected assets against an untouched source snapshot.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const T = require('three');
async function main() {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader(); loader.setDRACOLoader({ preload() {} });
  loader.register(() => ({ name: 'SkeletonOnly', loadMesh: () => Promise.resolve(new T.Group()) }));
  const load = async file => {
    const bytes = fs.readFileSync(file);
    return loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  };
  const directory = 'public/animations/aloneimation', baseline = process.argv[2] || '/tmp/aloneimation-original';
  const reports = [];
  for (const file of fs.readdirSync(directory).filter(file => file.endsWith('.glb')).sort()) {
    const original = await load(path.join(baseline, file)), corrected = await load(path.join(directory, file));
    const before = original.animations[0], after = corrected.animations[0];
    const bytes = fs.readFileSync(path.join(directory, file));
    const metadata = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12))).asset.extras.aloneimationSupport;
    const start = metadata.trimmedStartSeconds;
    assert(Math.abs(before.duration - start - after.duration) < 2e-6, `${file}: duration`);
    assert.equal(before.tracks.length, after.tracks.length, `${file}: track count`);
    let unchanged = 0;
    const discrete = before.tracks.filter(track => track.getInterpolation() === T.InterpolateDiscrete);
    const discreteRotation = Math.max(0, ...discrete.filter(track => track.name.endsWith(".quaternion")).map(track => { let angle = 0; for(let i = 4; i < track.values.length; i += 4) angle = Math.max(angle, new T.Quaternion().fromArray(track.values, i - 4).normalize().angleTo(new T.Quaternion().fromArray(track.values, i).normalize())); return angle * 180 / Math.PI; }));
    for (const track of before.tracks) {
      const current = after.tracks.find(candidate => candidate.name === track.name);
      assert(current, `${file}: missing ${track.name}`);
      assert.equal(current.getInterpolation(), T.InterpolateLinear);
      assert(Array.from(current.values).every(Number.isFinite));
      for (let i = 1; i < current.times.length; i++) assert(current.times[i] > current.times[i - 1]);
      if (/mixamorig(Hips\.position|(Left|Right)Foot\.quaternion)$/.test(track.name)) continue;
      track.setInterpolation(T.InterpolateLinear);
      const interpolant = track.createInterpolant(), width = track.getValueSize();
      const times = [start, ...Array.from(track.times).filter(time => time > start)];
      assert.equal(current.times.length, times.length, `${file}: lost source key ${track.name}`);
      times.forEach((time, index) => {
        assert(Math.abs(current.times[index] - (time - start)) < 2e-6);
        assert.deepEqual(Array.from(current.values.slice(index * width, (index + 1) * width)), Array.from(interpolant.evaluate(time)), `${file}: unrelated pose changed ${track.name}`);
      });
      unchanged++;
    }
    const position = after.tracks.find(track => track.name === 'mixamorigHips.position');
    const source = before.tracks.find(track => track.name === position.name).createInterpolant();
    original.scene.updateMatrixWorld(true);
    const hips = original.scene.getObjectByName('mixamorigHips');
    const toWorld = new T.Matrix3().setFromMatrix4(hips.parent.matrixWorld);
    let maximumLift = 0;
    position.times.forEach((time, index) => {
      const delta = new T.Vector3().fromArray(position.values, index * 3).sub(new T.Vector3().fromArray(source.evaluate(time + start))).applyMatrix3(toWorld);
      // Float32 translation precision propagated through the centimetre source rig.
      const precision = 2 ** -23 * Math.max(1, ...Array.from(source.evaluate(time + start), Math.abs)) * hips.parent.getWorldScale(new T.Vector3()).length() * 8;
      assert(Math.abs(delta.x) <= precision && Math.abs(delta.z) <= precision && delta.y >= -precision, `${file}: authored root path changed`);
      maximumLift = Math.max(maximumLift, delta.y);
    });
    assert(Math.abs(maximumLift - metadata.maximumLiftMeters) < 1e-5, `${file}: lift bound`);
    reports.push({ file, discreteRotation, unchangedTracks: unchanged, sourceFrames: before.tracks[0].times.length, correctedFrames: position.times.length, maximumLiftMeters: maximumLift, interpolationErrorMeters: metadata.interpolationErrorMeters, trimmedStartSeconds: start });
  }
  fs.writeFileSync('/tmp/aloneimation-verification.json', JSON.stringify(reports, null, 2));
  console.log(`${reports.length} clips verified: all unrelated poses retained, horizontal root paths unchanged, continuous interpolation, finite ordered frames.`);
  console.log(`Maximum interpolated sole penetration: ${(Math.max(...reports.map(report => report.interpolationErrorMeters)) * 1000).toFixed(3)} mm.`);
  console.log(`Maximum original STEP angular jump: ${Math.max(...reports.map(report => report.discreteRotation)).toFixed(3)} degrees; ${reports.filter(report => report.discreteRotation > 1).length} clips above one degree.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
