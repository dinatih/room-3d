const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
require('../support/load-ts.cjs');
const THREE = require('three');
const { retargetClip } = require('../../src/features/scene/retargeting/retargetClip.ts');
const { captureAnimationRig, restoreAnimationRig } = require('../../src/features/scene/character/animationSerialization.ts');

function targetRig() {
  const rig = new THREE.Group(), hips = new THREE.Bone();
  hips.name = 'mixamorigHips'; hips.position.y = 1; rig.add(hips); rig.updateMatrixWorld(true);
  rig.traverse(node => {
    node.defaultPosition = node.position.clone();
    node.restLocalQuaternion = node.quaternion.clone();
    node.restWorldQuaternion = node.getWorldQuaternion(new THREE.Quaternion());
  });
  return rig;
}
it('seule la vraie t-pose immobilise les hanches, jamais twist-pose, boat-pose ou split-pose', () => {
  const values = [0, 1, 0, 0.2, 0.2, 0.1];
  for (const id of ['yoga-bharadvajas-twist-pose-or-bharadvajasana-i-a', 'yoga-boat-pose-or-paripurna-navasana-a', 'yoga-split-pose-a', 'yoga-standing-split-pose-or-urdhva-prasarita-eka-padasana-a', 't-pose']) {
    const target = targetRig(), source = targetRig();
    const clip = new THREE.AnimationClip(id, 1, [new THREE.VectorKeyframeTrack('mixamorigHips.position', [0, 1], values)]);
    const result = retargetClip(clip, target, source);
    assert.deepEqual([...result.tracks[0].values], id === 't-pose' ? [0, 1, 0, 0, 1, 0] : [...clip.tracks[0].values], id);
    const worker = retargetClip(clip, restoreAnimationRig(captureAnimationRig(target)), restoreAnimationRig(captureAnimationRig(source)));
    assert.deepEqual([...worker.tracks[0].values], [...result.tracks[0].values]);
  }
});
it('conserve la translation de chaque vrai GLB YOGA quel que soit le nom de sa posture', async t => {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader(); loader.setDRACOLoader({ preload() {} });
  loader.register(() => ({ name: 'SkeletonOnly', loadMesh: () => Promise.resolve(new THREE.Group()) }));
  let checked = 0;
  for (const filename of fs.readdirSync('public/animations/npz/moyo').filter(name => name.endsWith('.glb'))) {
    const bytes = fs.readFileSync(`public/animations/npz/moyo/${filename}`);
    const source = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
    const raw = source.animations[0].clone(); raw.name = filename.replace('anim_', '').replace('.glb', '').replaceAll('_', '-');
    const target = targetRig();
    const actual = retargetClip(raw, target, source.scene);
    raw.name = 'yoga-reference';
    const reference = retargetClip(raw, target, source.scene);
    assert.deepEqual(actual.tracks.map(track => [...track.values]), reference.tracks.map(track => [...track.values]), filename);
    checked++;
  }
  t.diagnostic(`${checked} fichiers YOGA vérifiés`);
});
