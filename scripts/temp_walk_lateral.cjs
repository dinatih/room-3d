const fs = require('node:fs');
const assert = require('node:assert/strict');
require('../tests/support/load-ts.cjs');
const T = require('three');
const { retargetClip } = require('../src/features/scene/retargeting/retargetClip.ts');
const { ANIMATION_DEFINITIONS } = require('../src/features/scene/animations/animationRegistry.ts');
const { CHARACTERS } = require('../src/features/scene/characterConfig.ts');
const { resolveTargetBoneName } = require('../src/features/scene/retargeting/boneResolver.ts');
const { getWalkCycleSpeed } = require('../src/features/scene/character/walkCadence.ts');
async function main() {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader(); loader.setDRACOLoader({ preload() {} });
  loader.register(() => ({ name: 'SkeletonOnly', loadMesh: () => Promise.resolve(new T.Group()) }));
  const load = async path => { const b = fs.readFileSync('public/' + path); return loader.parseAsync(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), ''); };
  const def = ANIMATION_DEFINITIONS.find(d => d.id === (process.env.WALK_ANIMATION || 'miley-armature-elegant-walk-2l'));
  for (const id of ['native', 'delphina']) {
    const source = await load(def.path), target = (await load(CHARACTERS.find(c => c.id === id).path)).scene;
    target.scale.multiplyScalar(100); target.updateMatrixWorld(true);
    target.traverse(n => { n.defaultPosition = n.position.clone(); n.restLocalQuaternion = n.quaternion.clone(); n.restWorldQuaternion = n.getWorldQuaternion(new T.Quaternion()); n.restWorldPosition = n.getWorldPosition(new T.Vector3()); });
    source.animations[0].name = def.id;
    const clip = retargetClip(source.animations[0], target, source.scene, def.rootMotionSpace);
    clip.name = def.id;
    const speed = getWalkCycleSpeed(clip, target);
    const mixer = new T.AnimationMixer(target); mixer.clipAction(clip).setLoop(T.LoopOnce, 1).play().clampWhenFinished = true;
    const frames = [];
    for (let i = 0; i <= 92; i++) {
      mixer.setTime(i / 92 * clip.duration); target.updateMatrixWorld(true);
      const point = name => target.getObjectByName(resolveTargetBoneName(target, name)).getWorldPosition(new T.Vector3()).toArray();
      frames.push({ time: i / 92 * clip.duration, hips: point('Hips'), left: point('LeftToeBase'), right: point('RightToeBase') });
    }
    fs.writeFileSync('/tmp/walk-lateral-' + id + '.json', JSON.stringify(frames));
    console.log(id, 'pelvis lateral range cm:', Math.max(...frames.map(f => f.hips[0])) - Math.min(...frames.map(f => f.hips[0])));
    let lockedDrift = 0, authoredDrift = 0;
    for (let i = 1; i < frames.length; i++) {
      const a = frames[i - 1], b = frames[i];
      const side = a.left[1] + b.left[1] <= a.right[1] + b.right[1] ? 'left' : 'right';
      const drift = b[side][0] - a[side][0];
      authoredDrift += Math.abs(drift);
      lockedDrift += Math.abs(drift - (b.hips[0] - a.hips[0]));
    }
    console.log(id, 'lateral support travel per cycle, frozen pelvis / authored pelvis cm:', lockedDrift, authoredDrift);
    if (!process.env.WALK_ANIMATION) assert(authoredDrift < lockedDrift, `${id}: authored weight transfer must reduce lateral sliding`);
    let forwardSlip = 0, frozenSlip = 0;
    for (let i = 1; i < frames.length; i++) {
      const a = frames[i - 1], b = frames[i];
      const side = a.left[1] + b.left[1] <= a.right[1] + b.right[1] ? 'left' : 'right';
      const slip = b[side][2] - a[side][2] + speed * (b.time - a.time);
      forwardSlip += Math.abs(slip);
      frozenSlip += Math.abs(slip - (b.hips[2] - a.hips[2]));
    }
    console.log(def.id, id, { speed, forwardSlip, frozenSlip });
    if (['miley-armature-walk-relaxed-loop', 'walking-slow'].includes(def.id)) assert(forwardSlip < frozenSlip, `${id}: corrected stride must reduce forward sliding`);
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
