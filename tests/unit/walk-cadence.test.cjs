const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
require('../support/load-ts.cjs');
const THREE = require('three');
const { getWalkCycleSpeed, walkTimeScale } = require('../../src/features/scene/character/walkCadence.ts');

function fixture(scale = 1) {
  const rig = new THREE.Group();
  rig.scale.setScalar(scale);
  for (const [name, y] of [['LeftFoot', 0], ['RightFoot', 10]]) {
    const foot = new THREE.Bone(); foot.name = name; foot.position.y = y; rig.add(foot);
  }
  const clip = new THREE.AnimationClip('walking', 1, [
    new THREE.VectorKeyframeTrack('LeftFoot.position', [0, 0.5, 1], [0, 0, 0, 0, 0, -50, 0, 0, -100]),
    new THREE.VectorKeyframeTrack('RightFoot.position', [0, 0.5, 1], [0, 10, 0, 0, 10, 50, 0, 10, 0]),
  ]);
  return { rig, clip };
}
it('mesure le pied en appui, respecte les proportions et ne modifie pas le personnage', () => {
  for (const scale of [1, 2]) {
    const { rig, clip } = fixture(scale);
    assert.equal(getWalkCycleSpeed(clip, rig), 100 * scale);
    assert.equal(rig.getObjectByName('LeftFoot').position.z, 0);
    assert.equal(getWalkCycleSpeed(clip, rig), 100 * scale);
  }
  assert.equal(getWalkCycleSpeed(new THREE.AnimationClip('idle'), new THREE.Group()), null);
});
it('synchronise la phase avec la distance, quels que soient le FPS et les ralentissements', () => {
  for (const fps of [12, 30, 60, 144]) {
    let phase = 0;
    for (let frame = 0; frame < fps; frame++) {
      const dt = 1 / fps, distance = 75 * dt;
      phase += dt * walkTimeScale(distance, dt, 100);
    }
    assert(Math.abs(phase - 0.75) < 1e-12);
  }
  assert.equal(walkTimeScale(0, 1 / 60, 100), 0);
  assert.equal(walkTimeScale(0, 0, 100), 0);
});
it('exclut les animations solo même lorsque leurs pieds bougent', () => {
  for (const name of ['bureau-2', 'idle', 'dancing']) {
    const { rig, clip } = fixture();
    clip.name = name;
    assert.equal(getWalkCycleSpeed(clip, rig), null);
  }
});
it('calibre les deux vrais clips sur Lara et Xbot après retargeting', async t => {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const { retargetClip } = require('../../src/features/scene/retargeting/retargetClip.ts');
  const read = async path => {
    const loader = new GLTFLoader();
    loader.setDRACOLoader({ preload() {} }); // Mesh decoding is skipped by SkeletonOnly.
    loader.register(() => ({ name: 'SkeletonOnly', loadMesh: () => Promise.resolve(new THREE.Group()) }));
    const data = fs.readFileSync(path);
    return loader.parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '');
  };
  for (const model of ['lara/lara_native', 'xbot/Xbot_official']) {
    const { scene } = await read(`public/characters/${model}.glb`);
    // Match Character's world scale (1 unit = 1 cm) and captured rest transforms.
    scene.scale.multiplyScalar(100);
    scene.updateMatrixWorld(true);
    scene.traverse(node => {
      node.defaultPosition = node.position.clone();
      node.restLocalQuaternion = node.quaternion.clone();
      node.restWorldQuaternion = node.getWorldQuaternion(new THREE.Quaternion());
      node.restWorldPosition = node.getWorldPosition(new THREE.Vector3());
    });
    for (const id of ['walking', 'female-walk']) {
      const source = await read(`public/animations/mixamo/anim_${id.replace('-', '_')}.glb`);
      source.animations[0].name = id; // The worker receives the canonical animation ID.
      const clip = retargetClip(source.animations[0], scene, source.scene); clip.name = id;
      const speed = getWalkCycleSpeed(clip, scene);
      assert(Number.isFinite(speed) && speed > 0);
      t.diagnostic(`${model} / ${id}: ${speed.toFixed(2)} cm/s`);
    }
  }
});
