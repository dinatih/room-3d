const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
require('../support/load-ts.cjs');
const THREE = require('three');
const { retargetClip } = require('../../src/features/scene/retargeting/retargetClip.ts');
const { resolveTargetBoneName } = require('../../src/features/scene/retargeting/boneResolver.ts');
const { createPostureMotion, fitPostureTransition } = require('../../src/features/scene/animations/postureTransition.ts');

it('préserve le déplacement avant/arrière des deux pieds des vrais clips, pour Lara et Xbot', async t => {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader(); loader.setDRACOLoader({ preload() {} });
  loader.register(() => ({ name: 'SkeletonOnly', loadMesh: () => Promise.resolve(new THREE.Group()) }));
  const read = path => {
    const bytes = fs.readFileSync(`public/${path}`);
    return loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  };
  for (const path of ['characters/lara/lara_native.glb', 'characters/xbot/Xbot_official.glb']) {
    const model = (await read(path)).scene;
    model.scale.setScalar(100); model.updateMatrixWorld(true);
    model.traverse(node => {
      node.defaultPosition = node.position.clone(); node.restLocalQuaternion = node.quaternion.clone();
      node.restWorldQuaternion = node.getWorldQuaternion(new THREE.Quaternion());
    });
    const hips = model.getObjectByName(resolveTargetBoneName(model, 'Hips'));
    const feet = ['LeftFoot', 'RightFoot'].map(name => model.getObjectByName(resolveTargetBoneName(model, name)));
    const clips = {};
    for (const [id, file] of Object.entries({
      'stand-to-sit': 'mixamo/anim_stand_to_sit.glb', 'sit-to-stand': 'mixamo/anim_sit_to_stand.glb',
      seated: 'mixamo/anim_sitting_idle.glb', idle: 'miley/miley_armature_idle01_f.glb',
    })) {
      const source = await read(`animations/${file}`); source.animations[0].name = id;
      clips[id] = retargetClip(source.animations[0], model, source.scene);
    }
    for (const id of ['stand-to-sit', 'sit-to-stand']) {
      const original = clips[id], entering = id === 'stand-to-sit';
      const start = clips[entering ? 'idle' : 'seated'].tracks.find(track => track.name === `${hips.name}.position`);
      const fitted = fitPostureTransition(original, hips, clips[entering ? 'seated' : 'idle'], new THREE.Vector3().fromArray(start.values));
      const motion = createPostureMotion(original, fitted, hips, model);
      const times = original.tracks.find(track => track.name === start.name).times;
      const sample = clip => {
        model.traverse(node => { node.position.copy(node.defaultPosition); node.quaternion.copy(node.restLocalQuaternion); });
        const mixer = new THREE.AnimationMixer(model), action = mixer.clipAction(clip).setLoop(THREE.LoopOnce, 1).play();
        action.clampWhenFinished = true;
        const result = Array.from(times, time => {
          mixer.setTime(time); model.updateMatrixWorld(true);
          return feet.map(foot => foot.getWorldPosition(new THREE.Vector3()).z);
        });
        mixer.stopAllAction(); mixer.uncacheRoot(model); return result;
      };
      const native = sample(original), actual = sample(fitted);
      const offset = native[0].map((z, side) => actual[0][side] - z);
      for (let frame = 0; frame < times.length; frame++) for (let side = 0; side < feet.length; side++) {
        const actualZ = actual[frame][side] + motion.distance * motion.progress.evaluate(times[frame])[0];
        assert(Math.abs(actualZ - native[frame][side] - offset[side]) < 0.001, `${path}/${id}: patinage ajouté au pied ${side}, frame ${frame}`);
      }
      assert.equal(Math.sign(motion.distance), entering ? -1 : 1);
      t.diagnostic(`${path}/${id}: trajet natif ${motion.distance.toFixed(2)} cm, appuis conservés`);
    }
  }
});
