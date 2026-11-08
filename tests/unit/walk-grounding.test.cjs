const { it } = require('node:test');
const assert = require('node:assert/strict');
require('../support/load-ts.cjs');
const THREE = require('three');
const { groundWalkClip } = require('../../src/features/scene/retargeting/walkGrounding.ts');

it('bakes walking support without moving the rig, changing stride or grounding the swing foot', () => {
  for (const angle of [0, Math.PI / 2]) {
    const rig = new THREE.Group();
    const parent = new THREE.Group(); parent.rotation.x = angle; rig.add(parent);
    const hips = new THREE.Bone(); hips.name = 'Hips'; parent.add(hips);
    for (const side of ['Left', 'Right']) {
      const foot = new THREE.Bone(); foot.name = side + 'Foot'; hips.add(foot);
      const toe = new THREE.Bone(); toe.name = side + 'ToeBase'; toe.position.z = 10; foot.add(toe);
    }
    rig.updateMatrixWorld(true);
    const lift = new THREE.Vector3(0, 8, 0).applyMatrix4(parent.matrixWorld.clone().invert());
    const clip = new THREE.AnimationClip('walking', 1, [
      new THREE.VectorKeyframeTrack('Hips.position', [0, 0.5, 1], [0, 0, 0, ...lift.toArray(), 0, 0, 0]),
      new THREE.VectorKeyframeTrack('RightFoot.position', [0, 0.5, 1], [0, 0, 0, ...lift.toArray(), 0, 0, 0]),
    ]);
    const corrected = groundWalkClip(rig, clip);
    assert.deepEqual(hips.position.toArray(), [0, 0, 0]);
    assert.deepEqual(Array.from(clip.tracks[0].values), [0, 0, 0, ...new Float32Array(lift.toArray()), 0, 0, 0]);
    const mixer = new THREE.AnimationMixer(rig);
    mixer.clipAction(corrected).play();
    for (const time of [0, 0.125, 0.375, 0.5, 0.875]) {
      mixer.setTime(time); rig.updateMatrixWorld(true);
      const left = rig.getObjectByName('LeftFoot').getWorldPosition(new THREE.Vector3());
      assert(Math.abs(left.y) < 1e-5, `support at ${time}: ${left.y}`);
      if (time === 0.5) assert(rig.getObjectByName('RightFoot').getWorldPosition(new THREE.Vector3()).y > 7.99);
    }
    mixer.stopAllAction(); mixer.uncacheRoot(rig);
  }
});

it('stabilizes longitudinal supports at constant ground speed and closes the root loop', () => {
  const rig = new THREE.Group();
  const hips = new THREE.Bone(); hips.name = 'Hips'; rig.add(hips);
  for (const side of ['Left', 'Right']) {
    const foot = new THREE.Bone(); foot.name = side + 'Foot'; foot.position.y = side === 'Left' ? 0 : 10; hips.add(foot);
    const toe = new THREE.Bone(); toe.name = side + 'ToeBase'; foot.add(toe);
  }
  rig.updateMatrixWorld(true);
  const clip = new THREE.AnimationClip('walking', 1, [
    new THREE.VectorKeyframeTrack('Hips.position', [0, 1], [0, 0, 0, 0, 0, 0]),
    new THREE.VectorKeyframeTrack('LeftFoot.position', [0, 0.5, 1], [0, 0, 0, 0, 0, -10, 0, 0, -40]),
  ]);
  const corrected = groundWalkClip(rig, clip, true);
  const mixer = new THREE.AnimationMixer(rig);
  mixer.clipAction(corrected).setLoop(THREE.LoopOnce, 1).play().clampWhenFinished = true;
  for (const time of [0, 0.125, 0.375, 0.5, 0.875, 1]) {
    mixer.setTime(time); rig.updateMatrixWorld(true);
    const point = rig.getObjectByName('LeftToeBase').getWorldPosition(new THREE.Vector3());
    assert(Math.abs(point.z + 40 * time) < 1e-5, `planted toe at ${time}: ${point.z}`);
  }
  assert(Math.abs(hips.position.z) < 1e-5, 'root returns to its initial position');
  mixer.stopAllAction(); mixer.uncacheRoot(rig);
});
