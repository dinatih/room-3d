const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { correctSupport, CONTACT } = require('../../scripts/correct-yoga-foot-support.cjs');

it('stabilise horizontalement un appui, respecte les repères et relâche le pied sans modifier la suite', () => {
  const scene = new THREE.Group(), parent = new THREE.Group(), hips = new THREE.Bone(), toe = new THREE.Bone();
  scene.add(parent); parent.add(hips); hips.add(toe);
  parent.rotation.x = Math.PI / 2; parent.scale.setScalar(0.01);
  hips.name = 'hips'; hips.position.set(0, 0, -100); toe.position.set(20, 0, 100);
  const times = Array.from({ length: 91 }, (_, frame) => frame / 30);
  const values = times.flatMap(t => [t, -2 * t, -100 + t]);
  const original = new THREE.AnimationClip('support', 3, [new THREE.VectorKeyframeTrack('hips.position', times, values)]);
  const corrected = correctSupport(scene, original, hips, toe);
  const sample = clip => {
    const mixer = new THREE.AnimationMixer(scene); mixer.clipAction(clip).play();
    const samples = times.map(time => { mixer.setTime(time); scene.updateMatrixWorld(true); return toe.getWorldPosition(new THREE.Vector3()); });
    mixer.stopAllAction(); mixer.uncacheRoot(scene); return samples;
  };
  const before = sample(original), after = sample(corrected);
  for (let i = 0; i < times.length; i++) {
    assert(Math.abs(after[i].y - before[i].y) < 1e-6, 'hauteur conservée');
    if (times[i] <= CONTACT.hold) assert(Math.hypot(after[i].x - after[0].x, after[i].z - after[0].z) < 1e-6, 'appui fixe');
    if (times[i] >= CONTACT.release) assert.deepEqual([...corrected.tracks[0].values.slice(i * 3, i * 3 + 3)], [...original.tracks[0].values.slice(i * 3, i * 3 + 3)], 'suite inchangée');
  }
  assert.deepEqual([...original.tracks[0].values], [...new Float32Array(values)], 'source non mutée');
  assert(hips.position.equals(new THREE.Vector3(0, 0, -100)), 'pose restaurée');
});
