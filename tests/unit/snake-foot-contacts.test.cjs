const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
require('../support/load-ts.cjs');
const THREE = require('three');
const { bakeFootContacts } = require('../../src/features/scene/retargeting/footContacts.ts');
const { retargetClip } = require('../../src/features/scene/retargeting/retargetClip.ts');
const { resolveTargetBoneName } = require('../../src/features/scene/retargeting/boneResolver.ts');
const { captureAnimationRig, restoreAnimationRig } = require('../../src/features/scene/character/animationSerialization.ts');

for (const fixture of [
  { name: 'Snake', path: 'mixamo/anim_snake_hip_hop_dance.glb', id: 'snake-hip-hop-dance', contacts: 12, frames: 459 },
  ...[
    ['pickup_box_floor_male', 'pickup-box-floor-male', 134],
    ['pickup_box_floor_female', 'pickup-box-floor-female', 179],
    ['lift_box_male', 'lift-box-male', 132],
    ['lift_box_female', 'lift-box-female', 251],
  ].map(([file, id, frames]) => ({ name: `ACCAD ${id}`, path: `npz/accad/anim_${file}.glb`, id, contacts: 2, frames })),
  ...JSON.parse(fs.readFileSync('public/animations/npz/_metadata/accad_actions.json')).filter(item => /accad-(pickup-box-floor|lift-box)-male2|accad-crouch-/.test(item.id)).map(item => ({ ...item, path: item.path.replace(/^animations\//, ''), name: item.label, contacts: item.id === 'accad-crouch-male2' ? 1 : 2 })),
  { name: 'ACCAD poser la boîte', path: 'npz/accad/anim_putdown_box_floor.glb', id: 'putdown-box-floor', contacts: 2, frames: 72 },
]) it(`${fixture.name} conserve les appuis sur Lara, Ybot et Xbot, y compris dans le worker`, async t => {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader(); loader.setDRACOLoader({ preload() {} });
  loader.register(() => ({ name: 'SkeletonOnly', loadMesh: () => Promise.resolve(new THREE.Group()) }));
  async function read(path) {
    const bytes = fs.readFileSync(path);
    return loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  }
  for (const path of ['lara/lara_native', 'ybot/ybot', 'xbot/Xbot_official']) {
    const source = await read(`public/animations/${fixture.path}`);
    const target = (await read(`public/characters/${path}.glb`)).scene;
    target.scale.multiplyScalar(100); target.updateMatrixWorld(true);
    target.traverse(node => {
      node.defaultPosition = node.position.clone(); node.restLocalQuaternion = node.quaternion.clone();
      node.restWorldQuaternion = node.getWorldQuaternion(new THREE.Quaternion());
    });
    const soleReferences = new Map(['Left', 'Right'].map(side => {
      const foot = target.getObjectByName(resolveTargetBoneName(target, side + 'Foot'));
      const toe = target.getObjectByName(resolveTargetBoneName(target, side + 'ToeBase'));
      const a = foot.getWorldPosition(new THREE.Vector3()), t = toe.getWorldPosition(new THREE.Vector3());
      return [side, { height: t.y, heel: new THREE.Vector3(0, t.y - a.y, 0).applyQuaternion(foot.getWorldQuaternion(new THREE.Quaternion()).invert()) }];
    }));
    const raw = source.animations[0]; raw.name = fixture.id;
    const contacts = source.scene.userData.footContacts;
    assert.equal(contacts.length, fixture.contacts);
    const snapshot = () => JSON.stringify(captureAnimationRig(target));
    const before = snapshot();
    delete source.scene.userData.footContacts;
    const baseline = retargetClip(raw, target, source.scene);
    source.scene.userData.footContacts = contacts;
    const corrected = retargetClip(raw, target, source.scene);
    if (fixture.id === 'accad-crouch-male2') {
      for (const part of ['UpLeg', 'Leg', 'Foot']) {
        const name = resolveTargetBoneName(target, 'Left' + part) + '.quaternion';
        assert.deepEqual(corrected.tracks.find(track => track.name === name).values, baseline.tracks.find(track => track.name === name).values, 'H2 left leg must remain free');
      }
    }
    assert.equal(snapshot(), before, 'Baking must restore the target rest pose');
    const worker = retargetClip(raw, restoreAnimationRig(captureAnimationRig(target)), restoreAnimationRig(captureAnimationRig(source.scene)));
    for (let i = 0; i < corrected.tracks.length; i++) {
      assert.deepEqual(worker.tracks[i].values, corrected.tracks[i].values, `${path}: worker track ${i}`);
    }
    const evaluate = clip => {
      const tracks = clip.tracks.map(track => ({ node: target.getObjectByName(track.name.split('.')[0]), property: track.name.split('.')[1], interpolant: track.createInterpolant() }));
      return time => {
        for (const { node, property, interpolant } of tracks) node[property].fromArray(interpolant.evaluate(time));
        target.updateMatrixWorld(true);
      };
    };
    const original = evaluate(baseline), first = contacts[0];
    const toe = target.getObjectByName(resolveTargetBoneName(target, first.side + 'ToeBase'));
    original(first.start); const anchor = toe.getWorldPosition(new THREE.Vector3());
    let originalDrift = 0;
    for (let time = first.start; time <= first.end; time += 1 / 30) {
      original(time); const point = toe.getWorldPosition(new THREE.Vector3());
      originalDrift = Math.max(originalDrift, Math.hypot(point.x - anchor.x, point.z - anchor.z));
    }
    if (path === 'lara/lara_native') assert.ok(originalDrift > 1, 'Fixture must reproduce the visible retargeting slide');
    const sample = evaluate(corrected);
    let maximum = 0, vertical = 0;
    const floorHeights = new Map();
    for (const { side, start, end, level } of contacts) {
      const bones = ['Foot', 'ToeBase'].map(part => target.getObjectByName(resolveTargetBoneName(target, side + part)));
      sample(start);
      const anchors = bones.map(bone => bone.getWorldPosition(new THREE.Vector3()));
      if (level) assert.ok(Math.abs(anchors[1].y - soleReferences.get(side).height) < .0001, 'Crouching support must use the target standing sole plane');
      if (!floorHeights.has(side)) floorHeights.set(side, anchors[1].y);
      assert.ok(Math.abs(anchors[1].y - floorHeights.get(side)) < 0.0001, 'All toe supports use the same ground height');
      for (let time = start; time <= end; time += 1 / 240) {
        sample(time);
        if (level) {
          const sole = soleReferences.get(side);
          const heel = bones[0].getWorldPosition(new THREE.Vector3()).add(sole.heel.clone().applyQuaternion(bones[0].getWorldQuaternion(new THREE.Quaternion())));
          assert.ok(Math.abs(heel.y - bones[1].getWorldPosition(new THREE.Vector3()).y) < .1, 'Heel and toe must remain level');
        }
        bones.forEach((bone, index) => {
          const point = bone.getWorldPosition(new THREE.Vector3());
          maximum = Math.max(maximum, point.distanceTo(anchors[index]));
          vertical = Math.max(vertical, Math.abs(point.y - anchors[index].y));
        });
      }
    }
    // Includes interpolation between the baked keys, measured in scene centimetres.
    assert.ok(maximum < 0.1, `${path}: contact drift ${maximum} cm`);
    assert.equal(corrected.duration, raw.duration);
    const position = corrected.tracks.find(track => track.name.endsWith('.position'));
    assert.equal(position.times.length, (baseline.tracks.find(track => track.name === position.name).times.length - 1) * 4 + 1);
    const originalPosition = baseline.tracks.find(track => track.name === position.name).createInterpolant();
    const hips = target.getObjectByName(resolveTargetBoneName(target, 'Hips'));
    const parent = new THREE.Matrix3().setFromMatrix4(hips.parent.matrixWorld);
    position.times.forEach((time, index) => {
      const delta = new THREE.Vector3().fromArray(position.values, index * 3)
        .sub(new THREE.Vector3().fromArray(originalPosition.evaluate(time))).applyMatrix3(parent);
      assert.ok(Math.hypot(delta.x, delta.z) < 0.0001, 'Pelvis sway retained in world space');
    });
    if (contacts.some(contact => contact.level)) {
      const rebaked = bakeFootContacts(target, baseline, contacts);
      for (let i = 0; i < corrected.tracks.length; i++) assert.deepEqual(rebaked.tracks[i].values, corrected.tracks[i].values, 'Support plane must be independent of the current animated pose');
    }
    t.diagnostic(`${path}: initial horizontal drift = ${originalDrift.toFixed(3)} cm; maximum 3D foot/toe drift at 240 FPS = ${maximum.toFixed(5)} cm; vertical = ${vertical.toFixed(5)} cm`);
  }
});
