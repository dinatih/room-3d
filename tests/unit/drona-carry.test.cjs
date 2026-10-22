const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
require('../support/load-ts.cjs');
const { sampleDronaMotion } = require('../../src/features/scene/items/dronaPlayback.ts');
const trajectories = require('../../src/features/scene/animations/dronaCarryMotion.json');

function readClip(variant, phase) {
  const bytes = fs.readFileSync(`public/animations/custom/${variant}_${phase}.glb`);
  const length = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + length));
  const binary = bytes.subarray(28 + length);
  assert.equal(json.animations.length, 1);
  const clip = json.animations[0];
  const read = index => {
    const accessor = json.accessors[index], view = json.bufferViews[accessor.bufferView];
    const size = { SCALAR: 1, VEC3: 3, VEC4: 4 }[accessor.type];
    assert.equal(accessor.componentType, 5126);
    return Array.from({ length: accessor.count * size }, (_, i) => binary.readFloatLE((view.byteOffset ?? 0) + (accessor.byteOffset ?? 0) + 4 * i));
  };
  return { json, clip, read };
}
function endpoint(data, end) {
  return Object.fromEntries(data.clip.channels.map(channel => {
    const sampler = data.clip.samplers[channel.sampler];
    const values = data.read(sampler.output), times = data.read(sampler.input);
    const size = values.length / times.length;
    return [data.json.nodes[channel.target.node].name + '.' + channel.target.path, end ? values.slice(-size) : values.slice(0, size)];
  }));
}
for (const variant of ['pyjama', 'upper']) {
  it(`raccorde les poses exportées et l’horloge du bac (${variant})`, () => {
    const clips = ['pull', 'search', 'push'].map(phase => readClip(variant, phase));
    for (const [index, phase] of ['pull', 'search', 'push'].entries()) {
      const duration = Math.max(...clips[index].clip.samplers.map(s => clips[index].read(s.input).at(-1)));
      assert(Math.abs(duration - trajectories[`drona-${variant}-${phase}`].duration) < 1e-5);
    }
    for (let index = 1; index < clips.length; index++) {
      const last = endpoint(clips[index - 1], true), next = endpoint(clips[index], false);
      assert.deepEqual(Object.keys(last).sort(), Object.keys(next).sort());
      for (const name of Object.keys(last)) for (let axis = 0; axis < last[name].length; axis++)
        assert(Math.abs(last[name][axis] - next[name][axis]) < (name.endsWith('.rotation') ? 1e-5 : 1e-4), `${name}: raccord discontinu ${last[name]} / ${next[name]}`);
    }
    const sample = (phase, progress) => sampleDronaMotion({ action: 'test', animation: `drona-${variant}-${phase}` }, progress);
    assert.deepEqual(sample('pull', 0).position, [0, 0, 0]);
    assert.deepEqual(sample('push', 1).position, [0, 0, 0]);
    assert.deepEqual(sample('pull', 1), sample('search', 0));
    assert.deepEqual(sample('search', 1), sample('push', 0));
    assert.deepEqual(sample('search', .5), sample('search', 0), 'Le bac reste soutenu pendant la prise');
    for (const [x, y, z] of trajectories[`drona-${variant}-pull`].positions) {
      if (x !== 0 || y !== 0) assert(z <= -38, 'Le bac doit quitter entièrement la case avant de descendre');
    }
    assert.deepEqual(sample('pull', .5).position, [0, 0, -40], 'Le bac est complètement extrait avant le portage');
    assert.deepEqual(sample('push', .5), sample('pull', .5), 'Le rangement inverse la trajectoire d’extraction');
  });
}
it('conserve le coulissement des autres bacs', () => {
  const motion = { action: 'linen', from: 0, to: 1, range: [.25, .75] };
  assert.equal(sampleDronaMotion(motion, 0), 0);
  assert.equal(sampleDronaMotion(motion, .5), .5);
  assert.equal(sampleDronaMotion(motion, 1), 1);
});

it('résout le poignet droit de Xbot avant les doigts gauches aux noms voisins', () => {
  const THREE = require('three');
  const { resolveTargetBoneName } = require('../../src/features/scene/retargeting/boneResolver.ts');
  const rig = new THREE.Group();
  for (const name of ['mixamorigLeftHandRing1', 'mixamorigRightHand']) {
    const bone = new THREE.Bone(); bone.name = name; rig.add(bone);
  }
  assert.equal(resolveTargetBoneName(rig, 'RightHand'), 'mixamorigRightHand');
});
it('replace chaque bac porté dans sa case lors de la libération de l’interaction', () => {
  const { load } = require('../support/load-ts.cjs');
  const { dronaPlayback } = require('../../src/features/scene/items/dronaPlayback.ts');
  const { release } = load('src/features/scene/ai/agentController.ts', {}, source => {
    const start = source.indexOf('  const releaseClaimedSlot = () => {');
    const end = source.indexOf('  // Libérer toutes les réservations', start);
    assert(start > 0 && end > start);
    return `export function release(objectId, dronaPlayback, triggerAction, releaseSlot) {
      const _characterId = 'test', route = {}, releaseKitchenStorageAccess = () => {}, resetRoute = () => {};
      let claimedSlot = { objectId, slotId: 'pick-item' };
      const DRONA_SE_ITEMS = { 'drona-se-pyjama': { action: 'pyjama' } };
      const DRONA_SPECIAL_ITEMS = { 'drona-nw-upper': { action: 'upper' } };
      const BATHROOM_STORAGE_ITEMS = {}, KITCHEN_DRONA_ITEMS = {};
      const useSceneStore = { getState: () => ({ triggerAction }) }, OccupancyManager = { releaseSlot };
      ${source.slice(start, end)}
      releaseClaimedSlot(); return claimedSlot;
    }`;
  });
  for (const [object, action, variant] of [['drona-se-pyjama', 'pyjama', 'pyjama'], ['drona-nw-upper', 'upper', 'upper']]) {
    for (const phase of ['pull', 'search', 'push']) {
      dronaPlayback.set(action, sampleDronaMotion({ action, animation: `drona-${variant}-${phase}` }, .5));
      const events = [], slots = [];
      assert.equal(release(object, dronaPlayback, (...args) => events.push(args), (...args) => slots.push(args)), null);
      assert.equal(dronaPlayback.has(action), false);
      assert.deepEqual(events, [[action, false]]);
      assert.deepEqual(slots, [[object, 'pick-item', 'test']]);
    }
  }
});
