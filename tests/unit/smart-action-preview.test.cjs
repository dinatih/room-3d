const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const slots = {
  toilet: { slots: [{ slotId: 'use', animation: 'sit-idle', duration: 6 }] },
  'vasque-sdb': { slots: [{ slotId: 'wash-hands', animation: 'fab-daily-life-wash-hands', duration: 4, triggerEventKey: 'water', triggerEventValue: true }] },
};
const { resolvePreviewInstruction } = load('src/features/inventory/SmartActionPreview.tsx', {
  '@features/scene/ai/smartObjectRegistry': { getSmartObject: id => slots[id] },
}, source => `import { getSmartObject } from '@features/scene/ai/smartObjectRegistry';\n${source.slice(source.indexOf('export function resolvePreviewInstruction'), source.indexOf('/** Plays interaction steps'))}`);

it('inherits the toilet sitting animation and six-second duration for bare USE_OBJECT steps', () => {
  const resolved = resolvePreviewInstruction({ type: 'USE_OBJECT', smartObjectId: 'toilet', slotId: 'use' });
  assert.equal(resolved.animation, 'sit-idle');
  assert.equal(resolved.duration, 6);
});
it('aligne les quatre rangements SDB devant leur façade avant l’arrivée finale', () => {
  const { BATHROOM_STORAGE_ITEMS, BATHROOM_BOX_APPROACH } = require('../../src/features/scene/items/bathroomStorage.ts');
  const { sequence } = load('src/features/scene/ai/smartObjectRegistry.ts', {
    fixtures: { BATHROOM_STORAGE_ITEMS, BATHROOM_BOX_APPROACH },
  }, source => {
    const start = source.indexOf('export function buildSmartObjectInstructionSequence(');
    const end = source.indexOf('export function getSmartObject(', start);
    return `import { BATHROOM_STORAGE_ITEMS, BATHROOM_BOX_APPROACH } from 'fixtures';
      export function sequence(id) {
        const SMART_OBJECTS = {}, KITCHEN_DRONA_ITEMS = {}, SPECIAL_DRONA_SLIDE_DURATION = 1;
        const OccupancyManager = { canUseObject: () => true };
        const getSmartObject = objectId => ({ id: objectId, slots: [{ slotId: 'pick-item', animation: 'pick-fruit' }] });
        ${source.slice(start, end).replace('export function', 'function')}
        return buildSmartObjectInstructionSequence(id, 'pick-item');
      }`;
  });
  for (const [id, item] of Object.entries(BATHROOM_STORAGE_ITEMS)) {
    const steps = sequence(id), moves = steps.filter(step => step.type === 'MOVE_TO');
    assert.equal(moves.length, 1, id);
    assert.equal(moves[0].targetLocalPos, undefined, 'Utilise l’approche déclarée dans le slot');
    assert.equal(steps.find(step => step.waitForAnimation).type, 'USE_OBJECT', 'Rejoint le point d’utilisation après l’approche');
    assert.equal(steps.filter(step => step.waitForAnimation).length, 1);
  }
});
it('déclare des approachOffset SDB visibles et résout deux destinations distinctes', () => {
  const storage = require('../../src/features/scene/items/bathroomStorage.ts');
  const walls = require('../../src/features/scene/wallData.ts');
  const { objects } = load('src/features/scene/ai/smartObjectRegistry.ts', { fixtures: { ...storage, ...walls } }, source => {
    const start = source.indexOf('  ...Object.fromEntries(Object.entries(BATHROOM_STORAGE_ITEMS)');
    const end = source.indexOf("\n  'bathtub-garden':", start);
    return `import { BATHROOM_STORAGE_ITEMS, BATHROOM_BOX_APPROACH, BATH_WEST_WALL, BATH_EAST_WALL } from 'fixtures';
      const HUMAN_BODY_RADIUS = 28;
      export const objects = { ${source.slice(start, end)} };`;
  });
  const { resolveInstructionCoords } = load('src/features/scene/ai/agent/agentInstructionCoords.ts', {
    '../navigation/service': { getContainingObjectOwner: () => undefined, getObjectApproach: (owner, point) => point },
    '../navigation/obstacles': { hasAgentProfile: () => true },
    '../navigation/doorRequests': {}, '../../cameraState': {}, '../navigation/destinations': {},
    '../smartObjectRegistry': { getSmartObject: id => objects[id] },
    '../../animations/animationResolver': { resolveSlotAnimation: () => null },
  });
  for (const [id, item] of Object.entries(storage.BATHROOM_STORAGE_ITEMS)) {
    const obj = objects[id], slot = obj.slots[0], c = Math.cos(item.rotationY), s = Math.sin(item.rotationY);
    for (const key of ['offset', 'approachOffset']) {
      const [x, y, z] = slot[key];
      slot[key] = [item.position[0] + x * c + z * s, item.position[1] + y, item.position[2] - x * s + z * c];
    }
    obj.position = item.position;
    assert(Math.abs(slot.approachOffset[0] - (walls.BATH_WEST_WALL + walls.BATH_EAST_WALL) / 2) < 1e-9);
    const move = resolveInstructionCoords({ type: 'MOVE_TO', smartObjectId: id }, null, 'walker');
    const use = resolveInstructionCoords({ type: 'USE_OBJECT', smartObjectId: id }, null, 'walker');
    assert.deepEqual([move.tx, move.ty, move.tz], slot.approachOffset);
    assert.deepEqual([use.tx, use.ty, use.tz], slot.offset);
    assert.notEqual(move.tx, use.tx, 'Le premier trajet reste dans le passage central');
    assert(move.tz > use.tz, 'Le point d’approche reste devant la façade');
    assert.equal(move.ty, 0);
  }
});
it('resolves each step from its own object and preserves explicit overrides', () => {
  const step = { type: 'USE_OBJECT', smartObjectId: 'vasque-sdb', slotId: 'wash-hands', duration: 2 };
  const resolved = resolvePreviewInstruction(step);
  assert.equal(resolved.animation, 'fab-daily-life-wash-hands');
  assert.equal(resolved.duration, 2);
  assert.equal(resolved.triggerEventKey, 'water');
  assert.equal(resolved.triggerEventValue, true);
  assert.equal(step.animation, undefined);
  const wait = { type: 'WAIT', animation: 'idle', duration: 1 };
  assert.equal(resolvePreviewInstruction(wait), wait);
  assert.throws(() => resolvePreviewInstruction({ type: 'USE_OBJECT', smartObjectId: 'toilet', slotId: 'missing' }), /Slot preview introuvable/);
});
it('rejoint directement les Dröna et joue une seule prise sans détour par la porte', () => {
  const { sequence } = load('src/features/scene/ai/smartObjectRegistry.ts', {}, source => {
    const start = source.indexOf('export function buildSmartObjectInstructionSequence(');
    const end = source.indexOf('/**\n * Résout un SmartObject', start);
    assert(start > 0 && end > start);
    return `export function sequence(id) {
      const SMART_OBJECTS = {}, BATHROOM_STORAGE_ITEMS = {}, KITCHEN_DRONA_ITEMS = {};
      const DRONA_SE_ITEMS = { 'drona-se-pyjama': {}, 'drona-se-linen': {} }, DRONA_SPECIAL_ITEMS = { 'drona-nw-upper': { shelf: 'nw' }, 'drona-se-care': { shelf: 'se' }, 'drona-ne-catchall2': { shelf: 'ne' } };
      const OccupancyManager = { canUseObject: () => true };
      const getSmartObject = objectId => ({ id: objectId, slots: [{ slotId: 'pick-item', animation: 'pick-fruit' }] });
      ${source.slice(start, end).replace('export function', 'function')}
      return buildSmartObjectInstructionSequence(id, 'pick-item');
    }`;
  });
  for (const id of ['drona-se-pyjama', 'drona-se-linen', 'drona-nw-upper', 'drona-se-care', 'drona-ne-catchall2']) {
    const steps = sequence(id), actions = steps.filter(step => step.type !== 'MOVE_TO');
    const moves = steps.filter(step => step.type === 'MOVE_TO');
    assert.equal(moves.length, 1, `${id}: une seule approche du bac`);
    assert.equal(moves[0].doorKey, undefined, 'Aucun détour de dégagement de porte');
    assert.equal(moves[0].protectedDoor, id === 'drona-nw-upper' ? undefined : id === 'drona-ne-catchall2' ? 'glassRight' : 'living');
    assert.equal(actions.length, 1);
    assert.equal(actions[0].animation, 'pick-fruit');
    assert.equal(actions[0].repeatCount, 1);
    assert.equal(actions[0].waitForAnimation, true);
    assert(steps.every(step => !step.dronaMotion && !step.triggerEventKey));
  }
});
