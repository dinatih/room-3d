const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
function load(relativePath, dependencies) {
  const filename = path.join(root, relativePath);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require(id) {
      if (!(id in dependencies)) throw new Error(`Unexpected dependency: ${id}`);
      return dependencies[id];
    },
    document: { dispatchEvent(event) { events.push(event.detail); } },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  }, { filename });
  return module.exports;
}
const events = [];
const registry = load('src/features/scene/animations/animationRegistry.ts', {});
const duo = load('src/features/scene/animations/duoAnimations.ts', { './animationRegistry': registry });
const combatIds = new Set([
  'b1', 'd1', 'd4', 'f2', 'h1', 'h2', 'h4', 'ko1', 'ko2', 'ko3', 'p1', 'p2',
  's1', 's2', 's3', 's4', 's5', 't1', 't3', 't4', 't5', 'double_leg_takedown',
  'double_leg_takedown_pair', 'release_hostage', 'fist_fight', 'taken_hostage',
  'shoulder_throw', 'brutal_assassination',
]);
for (const def of duo.DUO_ANIMATIONS) {
  assert.equal(def.isCombat, combatIds.has(def.id), def.id);
  assert.equal(duo.canCharacterPerformDuo('xbot', def), def.isCombat);
  assert.equal(duo.canCharacterPerformDuo('native', def), true);
  for (const leader of ['xbot', 'native', 'rosanna']) {
    for (const partner of ['xbot', 'native', 'rosanna', undefined]) {
      const result = duo.resolveDuoPreviewParticipants(def, leader, partner);
      assert.notEqual(result.leaderId, result.partnerId);
      if (!def.isCombat) {
        assert.notEqual(result.leaderId, 'xbot');
        assert.notEqual(result.partnerId, 'xbot');
      }
    }
  }
}
const fight = duo.getDuoAnimationDef('fist_fight');
const dance = duo.getDuoAnimationDef('slow_dance');
assert.equal(duo.resolveDuoPreviewParticipants(dance, 'xbot', 'native').leaderId, 'rosanna');
assert.equal(duo.resolveDuoPreviewParticipants(fight, 'xbot', 'native').leaderId, 'xbot');

const npcIds = new Set(['xbot', 'native', 'rosanna', 'marissa']);
let visible = new Set(npcIds);
const store = { activeCharacterId: 'xbot', layers: { laraCount: 4 }, activeExtraIds: [], activeMainIds: [] };
const cameraState = { positions: { xbot: { x: 0, z: 0 }, native: { x: 10, z: 0 }, rosanna: { x: 20, z: 0 }, marissa: { x: 30, z: 0 } } };
const reservations = new Map();
const objects = {};
for (const [id, pool] of [['dance', ['slow_dance']], ['fight', ['fist_fight']], ['mixed', ['fist_fight', 'slow_dance']]]) {
  objects[id] = { name: id, slots: [{ slotId: 'session', isDuo: true, duoPool: pool, duoCount: pool.length, offset: [0, 0, 0] }] };
}
const manager = load('src/features/scene/ai/duoSessionManager.ts', {
  '../animations/duoAnimations': duo,
  './occupancyManager': { OccupancyManager: {
    claimSlot(object, slot, id) { reservations.set(`${object}:${slot}`, id); return true; },
    releaseSlot(object, slot, id) { if (reservations.get(`${object}:${slot}`) === id) reservations.delete(`${object}:${slot}`); },
  } },
  '@features/ui/AppConsole': { appLog() {} },
  '../cameraState': { cameraState },
  '../characterConfig': { AUTONOMOUS_NPC_IDS: npcIds, isCharacterVisibleInMode: id => visible.has(id) },
  './smartObjectRegistry': { getSmartObject: id => objects[id] },
  './scenarios': { INITIAL_SMART_OBJECT_BY_CHAR: {} },
  '../store/useSceneStore': { useSceneStore: { getState: () => store } },
}).duoSessionManager;
function reset() {
  manager.leaveAllSessions();
  events.length = 0;
  reservations.clear();
  visible = new Set(npcIds);
}
function excludesXbot(result) {
  assert.ok(result);
  assert.notEqual(result.targetA, 'xbot');
  assert.notEqual(result.targetB, 'xbot');
  assert.ok(events.every(event => event.targetId !== 'xbot'));
  assert.ok([...reservations.values()].every(id => id !== 'xbot'));
}
for (const object of ['dance', 'mixed']) {
  reset(); excludesXbot(manager.startDuoSession(object, 'session', 'xbot', 'native'));
  assert.ok(events.some(event => event.forceRole === 'roleA'), 'Replacement leader is invited');
  reset(); excludesXbot(manager.startDuoSession(object, 'session', 'native', 'xbot'));
  reset(); excludesXbot(manager.startDuoSession(object, 'session'));
}
reset(); assert.equal(manager.startDuoSession('fight', 'session', 'xbot', 'native').targetA, 'xbot');
reset(); assert.equal(manager.startDuoSession('fight', 'session', 'native', 'xbot').targetB, 'xbot');
reset();
const existing = manager.startDuoSession('dance', 'session', 'native', 'rosanna');
assert.ok(existing);
excludesXbot(manager.startDuoSession('dance', 'session', 'xbot'));
assert.equal(manager.getSessionFor('xbot'), null);
reset();
visible = new Set(['xbot']);
assert.equal(manager.startDuoSession('dance', 'session', 'xbot'), null);
assert.equal(manager.getSessionByObjectId('dance'), null);
assert.equal(events.length, 0);
assert.equal(reservations.size, 0);
reset(); excludesXbot(manager.forceDuoAnimation(dance, 'xbot', 'native'));
reset(); excludesXbot(manager.forceDuoAnimation(dance, 'native', 'xbot'));
reset();
assert.equal(manager.forceDuoAnimation(fight, 'xbot', 'native').targetA, 'xbot');
events.length = 0;
excludesXbot(manager.forceDuoAnimation(dance));
assert.equal(manager.getSessionFor('xbot'), null);
reset();
visible = new Set(['xbot']);
assert.equal(manager.forceDuoAnimation(dance, 'xbot'), null);
assert.equal(manager.getSessionByObjectId('duo-zone'), null);
assert.equal(reservations.size, 0);
assert.equal(events.length, 0);
reset();
manager.forceDuoAnimation(fight, 'native', 'xbot');
const session = manager.getSessionByObjectId('duo-zone');
const snapshot = JSON.stringify(session);
visible = new Set(['xbot']);
events.length = 0;
const before = [...reservations];
assert.equal(manager.forceDuoAnimation(dance), null);
assert.equal(JSON.stringify(session), snapshot, 'Failed replacement preserves existing session');
assert.deepEqual([...reservations], before);
assert.equal(events.length, 0);
reset();
manager.startDuoSession('dance', 'session', 'native', 'rosanna');
manager.leaveDuoZone('rosanna');
events.length = 0;
assert.equal(manager.inviteNearestNpc('native'), 'rosanna');
assert.ok(events.every(event => event.targetId !== 'xbot'));

// Inspect the actual rendered CharacterGroup with lightweight React/Three mocks.
const characters = [...npcIds].map(id => ({ id, name: id, path: `${id}.glb`, isLara: id !== 'xbot', height: 170, variant: 'native' }));
const jsx = (type, props) => ({ type, props });
const group = load('src/features/scene/character/CharacterGroup.tsx', {
  react: { Suspense: 'Suspense', useMemo: fn => fn(), createElement: jsx },
  'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
  '@react-three/drei': { useGLTF: { preload() {} } },
  '@features/scene/store/useSceneStore': { useSceneStore: selector => selector({ ...store, layers: { characterGrid: true, showAllLaraStyles: true, laraCount: 4 } }) },
  './Character': { Character: 'Character' },
  './useCharacterAnimations': { cacheDynamicGLTF() {} },
  '../characterConfig': { CHARACTERS: characters, isCharacterVisibleInMode: () => true },
  '../animations/duoAnimations': duo,
  './characterGridUtils': { getCharacterGridPosition: index => ({ x: index * 300, y: 0, z: 0 }), getCharacterGridCenterIndex: () => 1 },
});
function renderedCharacters(props) {
  const wrapped = group.CharacterGroup(props);
  const internal = wrapped.props.children;
  const tree = internal.type(internal.props);
  const rendered = [];
  function visit(node) {
    if (!node) return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (node.type === 'Character') rendered.push(node.props);
    else visit(node.props?.children);
  }
  visit(tree);
  return rendered;
}
for (const def of [dance, fight]) {
  for (const leader of ['xbot', 'native']) {
    const rendered = renderedCharacters({ isPreview: true, previewCharacterId: leader, duoPartnerId: 'xbot', duoAnimDef: def });
    assert.equal(rendered.length, 2);
    if (!def.isCombat) assert.ok(rendered.every(char => char.id !== 'xbot'));
  }
}
const grid = renderedCharacters({ duoAnimDef: dance, duoPartnerId: 'xbot' });
const xbot = grid.filter(char => char.id === 'xbot');
assert.equal(xbot.length, 1);
assert.equal(xbot[0].characterAnim, 'idle');
assert.equal(xbot[0].duoAnimDef, undefined);
assert.equal(grid.filter(char => char.isAnimationMaster).length, 1);
assert.equal(renderedCharacters({ duoAnimDef: fight, duoPartnerId: 'xbot' }).filter(char => char.id === 'xbot').length, 5);
console.log('Duo xbot: classification, previews, grid and session regression checks passed.');
