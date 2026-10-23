// Authored contact: Bharadvaja A's right toe stays planted through frame 42;
// release completes at frame 52 (the toe's first lift apex), sampled at 30 FPS.
const fs = require('node:fs');
const path = require('node:path');
const THREE = require('three');
const CONTACT = { bone: 'RightToeBase', hold: 42 / 30, release: 52 / 30 };
const FILE = 'anim_yoga_bharadvajas_twist_pose_or_bharadvajasana_i_a.glb';

function correctSupport(scene, clip, hips, toe, contact = CONTACT) {
  if (!hips?.parent || !toe || !(contact.hold > 0 && contact.release > contact.hold && contact.release < clip.duration)) throw Error('Invalid foot support');
  const corrected = clip.clone();
  const track = corrected.tracks.find(t => t.name === `${hips.name}.position`);
  if (!track) throw Error('Missing hips translation');
  scene.updateMatrixWorld(true);
  const toLocal = new THREE.Matrix3().setFromMatrix4(hips.parent.matrixWorld).invert();
  const mixer = new THREE.AnimationMixer(scene);
  const action = mixer.clipAction(clip).setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.play();
  const point = time => { mixer.setTime(time); scene.updateMatrixWorld(true); return toe.getWorldPosition(new THREE.Vector3()); };
  const anchor = point(0), end = anchor.clone().sub(point(contact.hold)); end.y = 0;
  try {
    for (let i = 0; i < track.times.length && track.times[i] < contact.release; i++) {
      const time = track.times[i];
      const delta = time <= contact.hold ? anchor.clone().sub(point(time)) : end.clone();
      delta.y = 0;
      if (time > contact.hold) {
        const t = (time - contact.hold) / (contact.release - contact.hold);
        delta.multiplyScalar(1 - t * t * (3 - 2 * t));
      }
      delta.applyMatrix3(toLocal);
      for (let axis = 0; axis < 3; axis++) track.values[i * 3 + axis] += delta.getComponent(axis);
    }
  } finally { mixer.stopAllAction(); mixer.uncacheRoot(scene); }
  return corrected;
}

async function main() {
  const filename = process.argv[2] || path.resolve(__dirname, '../public/animations/npz/moyo', FILE);
  if (path.basename(filename) !== FILE) throw Error('Contact annotation only applies to trimmed Bharadvaja A');
  const bytes = fs.readFileSync(filename);
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader(); loader.setDRACOLoader({ preload() {} });
  loader.register(() => ({ name: 'SkeletonOnly', loadMesh: () => Promise.resolve(new THREE.Group()) }));
  const { scene, animations } = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const metadata = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/animations/npz/_metadata/yoga_meta.json'))).find(item => item.filename === FILE);
  if (Number(animations[0].duration.toFixed(1)) !== metadata.duration) throw Error('Contact annotation does not match this trim');
  const hips = scene.getObjectByName('mixamorigHips'), toe = scene.getObjectByName(`mixamorig${CONTACT.bone}`);
  const corrected = correctSupport(scene, animations[0], hips, toe);
  const track = corrected.tracks.find(t => t.name === `${hips.name}.position`);
  const jsonLength = bytes.readUInt32LE(12), gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength));
  const channel = gltf.animations[0].channels.find(c => c.target.path === 'translation' && gltf.nodes[c.target.node].name.replace(/[:_]/g, '') === hips.name);
  const accessor = gltf.accessors[gltf.animations[0].samplers[channel.sampler].output], view = gltf.bufferViews[accessor.bufferView];
  if (accessor.componentType !== 5126 || accessor.type !== 'VEC3' || accessor.count * 3 !== track.values.length) throw Error('Unsupported hips accessor');
  const start = 28 + jsonLength + (view.byteOffset || 0) + (accessor.byteOffset || 0), stride = view.byteStride || 12;
  for (let i = 0; i < accessor.count; i++) for (let axis = 0; axis < 3; axis++) {
    const value = track.values[i * 3 + axis];
    if (!Number.isFinite(value) || (accessor.min && value < accessor.min[axis]) || (accessor.max && value > accessor.max[axis])) throw Error('Corrected track exceeds accessor bounds');
    bytes.writeFloatLE(value, start + i * stride + axis * 4);
  }
  fs.writeFileSync(filename, bytes);
  console.log(`Corrected initial right toe support: ${filename}`);
}
module.exports = { correctSupport, CONTACT };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
