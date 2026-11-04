const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const life = require('../../src/features/scene/ai/laraLife.ts');
const duos = require('../../src/features/scene/animations/duoAnimations.ts');
const interx = require('../../src/features/scene/animations/interxManifest.ts');
const ids = ['garden-fresh-air', 'rain-dance', 'est-neighbor-flat', 'combat-point', 'interx-affection-point', 'interx-affection-garden-point', 'building-b-corridor-end', 'building-b-corridor'];
const { objects } = load('src/features/scene/ai/smartObjectRegistry.ts', { duos, interx }, source => {
  const start = source.indexOf('const INTERX_MASSAGE_DUO_IDS');
  const end = source.indexOf('/**', start);
  const definitions = ids.map(id => {
    const a = source.indexOf(`  '${id}': {`), b = source.indexOf('\n  },', a);
    assert(a >= 0 && b > a);
    return source.slice(a, b + 5);
  }).join('\n');
  return `import { DUO_ANIMATIONS } from 'duos'; import { INTERX_DUO_ANIMATIONS } from 'interx';
    ${source.slice(start, end)} export const objects = {${definitions}};`;
});
const occupied = new Set();
const activities = load('src/features/scene/ai/autonomousActivities.ts', {
  './laraLife': life, './lifeHousekeeping': require('../../src/features/scene/ai/lifeHousekeeping.ts'),
  './smartObjectRegistry': { getAllSmartObjects: () => Object.values(objects), buildSmartObjectInstructionSequence: (id, slotId) => {
    const slot = objects[id].slots.find(slot => slot.slotId === slotId);
    return [{ type: 'MOVE_TO', smartObjectId: id, slotId }, { type: 'USE_OBJECT', smartObjectId: id, ...slot }];
  } },
  './occupancyManager': { OccupancyManager: { canUseObject: () => true, getReservations: () => [], isSlotOccupied: (id, slot) => occupied.has(`${id}:${slot}`) } },
});

it('propose exactement les spots de danse, combat et massage aux profils concernés', () => {
  for (const id of life.LIFE_CHARACTER_IDS) {
    const candidates = activities.getLaraLifeCandidates(id, false);
    const dances = candidates.filter(c => c.activity === 'dance');
    assert.equal(dances.length, life.LIFE_SPECIALTIES.dance.includes(id) ? 8 : 0, id);
    assert(!dances.some(c => c.slotId.startsWith('combat') || c.slotId.startsWith('locomotion')));
    const fights = candidates.filter(c => c.activity === 'combat');
    assert.equal(fights.length, life.LIFE_SPECIALTIES.combat.includes(id) ? 2 : 0, id);
    assert.equal(candidates.filter(c => c.activity === 'massage').length, life.LIFE_SPECIALTIES.massage.includes(id) ? 2 : 0, id);
    assert.equal(candidates.filter(c => c.activity === 'receive-massage').length, 2);
    assert(!candidates.some(c => c.slotId.startsWith('locomotion')));
    for (const candidate of [...dances, ...fights, ...candidates.filter(c => c.activity === 'massage')]) {
      const [move, use] = activities.buildLaraLifeInstructions(id, candidate);
      const slot = objects[candidate.id].slots.find(slot => slot.slotId === candidate.slotId);
      assert.equal(move.lifePhase, undefined);
      assert.equal(use.lifePhase, candidate.activity);
      assert.equal(use.repeatCount, slot.repeatCount);
      assert.equal(use.repeatVariation, slot.repeatVariation);
      assert.equal(use.animation, undefined, 'The smart action keeps its random animation pool');
    }
  }
  occupied.add('rain-dance:dance-in-rain');
  assert(!activities.getLaraLifeCandidates('delphina', false).some(c => c.id === 'rain-dance'));
  occupied.clear();
});

it('expose des massages dédiés avec un pool réel et réserve le rôle masseur à celle qui lance l’action', () => {
  for (const id of ['interx-affection-point', 'interx-affection-garden-point']) {
    const slot = objects[id].slots.find(slot => slot.slotId === 'massage');
    assert.equal(slot.duoRole, 'roleB');
    assert(slot.duoPool.length > 0);
    for (const animationId of slot.duoPool) {
      const definition = duos.DUO_ANIMATIONS.find(def => def.id === animationId);
      assert(definition && !definition.isCombat && definition.tags.some(tag => tag.startsWith('massage-')));
    }
  }
});

it('soulage stimulation et mouvement par la danse et le combat, et distingue donner et recevoir un massage', () => {
  const needs = { ...life.createLife('native').needs, rest: 50, work: 80, walk: 80, company: 80 };
  for (const activity of ['dance', 'combat']) {
    assert.equal(life.lifeEffect(activity), null);
    const after = life.evolveLife(needs, 10, life.lifeEffect(activity, activity), false);
    assert(after.work < needs.work && after.walk < needs.walk && after.rest > needs.rest);
    assert(after.company > needs.company);
    assert.equal(life.lifeNeed(activity, { ...needs, work: 0 }), 'walk');
  }
  const giver = life.evolveLife(needs, 10, 'massage', false);
  const receiver = life.evolveLife(needs, 10, 'receive-massage', false);
  assert(giver.company < needs.company && giver.rest > needs.rest);
  assert(receiver.company < needs.company && receiver.rest < needs.rest);
  assert.equal(life.lifeNeed('massage'), 'company');
  assert.equal(life.lifeNeed('receive-massage'), 'rest');
});

function duoWorld(combat) {
  const actorIds = ['cha', 'native', 'sara', 'vivida', 'rajaa'];
  const positions = Object.fromEntries(actorIds.map((id, i) => [id, { x: i * 20, z: 0 }]));
  const definition = { id: 'test-duo', label: 'Duo', isCombat: combat, animA: 'a', animB: 'b', duration: 10 };
  const object = { id: combat ? 'combat-point' : 'interx-affection-point', category: 'outdoor', position: [0, 0, 0],
    slots: [{ slotId: combat ? 'combat-session' : 'massage', isDuo: true, duoPool: [definition.id], duoCount: 1, offset: [0, 0, 0], ...(!combat ? { duoRole: 'roleB' } : {}) }] };
  const claims = [];
  const { duoSessionManager } = load('src/features/scene/ai/duoSessionManager.ts', {
    '../animations/duoAnimations': { DUO_ANIMATIONS: [definition], canCharacterPerformDuo: () => true },
    '../animations/duoWorldTransform': { computeWorldTransform: () => ({ posA: [0, 0, 0], posB: [0, 0, 100], rotA: 0, rotB: 0 }) },
    './occupancyManager': { LIMITED_ROOMS: [], OccupancyManager: { canUseObject: () => true, claimSlot: (...args) => (claims.push(args), true) } },
    '@features/ui/AppConsole': { appLog: () => {} }, '../cameraState': { cameraState: { positions } },
    '../characterConfig': { AUTONOMOUS_NPC_IDS: new Set(actorIds), isCharacterVisibleInMode: () => true },
    './smartObjectRegistry': { getSmartObject: () => object }, './autonomousActivities': { INITIAL_SMART_OBJECT_BY_CHAR: {} },
    '../store/useSceneStore': { useSceneStore: { getState: () => ({ activeCharacterId: 'player', layers: {} }) } },
    './navigation/duoPlacement': { findDuoAnchor: anchor => anchor }, './navigation/navigationScope': { navigationValue: (key, fn) => fn() },
    './navigation/service': { getNavigationGraph: () => ({}) }, './navigation/obstacles': { getAgentProfile: () => ({}) },
    './laraLife': life, './laraLifeStore': { characterLives: Object.fromEntries(actorIds.map(id => [id, life.createLife(id)])) },
  });
  return { manager: duoSessionManager, object, claims };
}

it('cherche une combattante consentante, respecte un refus et ne recrute jamais une non-combattante', () => {
  const originalDocument = global.document;
  global.document = new EventTarget();
  try {
    for (const busy of [false, true]) {
      const w = duoWorld(true), checked = [];
      const onCheck = event => { checked.push(event.detail.targetId); if (busy || event.detail.targetId === 'sara') event.preventDefault(); };
      document.addEventListener('npc-check-life-invitation', onCheck);
      const result = w.manager.startDuoSession(w.object.id, 'combat-session', 'cha', undefined, undefined, true);
      document.removeEventListener('npc-check-life-invitation', onCheck);
      assert(checked.includes('sara') && checked.includes('rajaa'));
      assert(!checked.includes('native') && !checked.includes('vivida'));
      if (busy) { assert.equal(result, null); assert.equal(w.claims.length, 0); }
      else assert.equal(result.targetB, 'rajaa');
    }
    const w = duoWorld(true);
    assert.equal(w.manager.startDuoSession(w.object.id, 'combat-session', 'native', undefined, undefined, true), null);
    assert.equal(w.claims.length, 0);
  } finally { global.document = originalDocument; }
});

it('attribue le rôle B à la masseuse et invite la receveuse au rôle A sans réinviter la meneuse', () => {
  const originalDocument = global.document;
  global.document = new EventTarget();
  try {
    for (const giver of ['cha', 'vivida']) {
      const w = duoWorld(false), invitations = [], checks = [];
      const onInvite = event => invitations.push(event.detail);
      const onCheck = event => checks.push(event.detail);
      document.addEventListener('npc-invite-duo', onInvite);
      document.addEventListener('npc-check-life-invitation', onCheck);
      const result = w.manager.startDuoSession(w.object.id, 'massage', giver, 'native', undefined, true);
      document.removeEventListener('npc-invite-duo', onInvite);
      document.removeEventListener('npc-check-life-invitation', onCheck);
      assert.equal(result.targetA, 'native');
      assert.equal(result.targetB, giver);
      assert.equal(checks[0].fromId, giver);
      assert.equal(checks[0].targetId, 'native');
      assert.equal(invitations.length, 1);
      assert.equal(invitations[0].targetId, 'native');
      assert.equal(invitations[0].forceRole, 'roleA');
      assert.equal(invitations[0].lifeInvitationConfirmed, true);
      assert(w.claims.some(([, slot, character]) => slot === 'massage:roleB' && character === giver));
    }
  } finally { global.document = originalDocument; }
});

it('une demande pour recevoir un massage cherche une masseuse, et conserve ce rôle lors d’une reprise', () => {
  const originalDocument = global.document;
  global.document = new EventTarget();
  try {
    const w = duoWorld(false), checks = [];
    const onCheck = event => checks.push(event.detail);
    document.addEventListener('npc-check-life-invitation', onCheck);
    const result = w.manager.startDuoSession(w.object.id, 'massage', 'native', 'cha', undefined, true, 'roleA');
    document.removeEventListener('npc-check-life-invitation', onCheck);
    assert.equal(result.targetA, 'native');
    assert.equal(result.targetB, 'cha');
    assert.equal(checks[0].slotId, 'massage:roleB');
    const invalid = duoWorld(false);
    assert.equal(invalid.manager.startDuoSession(invalid.object.id, 'massage', 'native', 'sara', undefined, true, 'roleA'), null);
    assert.equal(invalid.claims.length, 0);
  } finally { global.document = originalDocument; }
});

it('Helena commence sur un spot téléphone distinct du bureau et peut satisfaire sa stimulation en journée', () => {
  const sequence = activities.buildAutonomousActivities('helena');
  assert(sequence.every(step => step.smartObjectId === 'building-b-corridor-end'));
  assert.equal(sequence.find(step => step.type === 'USE_OBJECT').lifePhase, 'tech');
  assert.equal(sequence.find(step => step.type === 'USE_OBJECT').animation, 'texting-while-standing');
  assert(life.routineActivities(10).includes('tech'));
  assert(life.LIFE_INITIAL_PREFERENCES.helena.includes('tech'));
  assert(life.LIFE_PERSONALITY.helena.includes('Timide'));
  const needs = { ...life.createLife('helena').needs };
  const after = life.evolveLife(needs, 10, 'tech', false);
  assert(after.work < needs.work && after.walk > needs.walk);
  assert.equal(activities.getLaraLifeCandidates('helena', false).filter(c => c.activity === 'tech').length, 2);
});
