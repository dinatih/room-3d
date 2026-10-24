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
    assert.equal(moves[0].targetLocalPos, undefined, 'Approche directement le rangement');
    assert.equal(steps.find(step => step.waitForAnimation).type, 'USE_OBJECT', 'Rejoint le point d’utilisation après l’approche');
    assert.equal(steps.filter(step => step.waitForAnimation).length, 1);
  }
});
it('approche les rangements SDB devant leur façade sans détour dans le passage central', () => {
  const storage = require('../../src/features/scene/items/bathroomStorage.ts');
  const { objects } = load('src/features/scene/ai/smartObjectRegistry.ts', { fixtures: storage }, source => {
    const start = source.indexOf('  ...Object.fromEntries(Object.entries(BATHROOM_STORAGE_ITEMS)');
    const end = source.indexOf("\n  'bathtub-garden':", start);
    return `import { BATHROOM_STORAGE_ITEMS, BATHROOM_BOX_APPROACH } from 'fixtures';
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
    const [x, y, z] = slot.offset;
    slot.offset = [item.position[0] + x * c + z * s, item.position[1] + y, item.position[2] - x * s + z * c];
    obj.position = item.position;
    assert.equal(slot.approachOffset, undefined, 'Aucun détour imposé avant le point d’interaction');
    assert(Math.abs(slot.offset[0] - item.position[0]) < 1e-9, 'Approche centrée devant chaque rangement');
    const move = resolveInstructionCoords({ type: 'MOVE_TO', smartObjectId: id }, null, 'walker');
    const use = resolveInstructionCoords({ type: 'USE_OBJECT', smartObjectId: id }, null, 'walker');
    assert.deepEqual([move.tx, move.ty, move.tz], slot.offset);
    assert.deepEqual([use.tx, use.ty, use.tz], slot.offset);
    assert(Math.abs(move.tz - item.position[2] - (item.kind === 'cabinet' ? 60 : storage.BATHROOM_BOX_APPROACH)) < 1e-9);
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
  const { ANIMATION_DEFINITIONS } = require('../../src/features/scene/animations/animationRegistry.ts');
  const search = ANIMATION_DEFINITIONS.find(anim => anim.id === 'searching-files-high');
  assert.equal(search.path, 'animations/mixamo/anim_searching_files_high.glb');
  assert.equal(search.loop, 'once');
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
  for (const id of ['drona-se-pyjama', 'drona-se-linen', 'drona-nw-upper', 'drona-se-care', 'drona-ne-catchall2', 'drona-ne-catchall']) {
    const steps = sequence(id), actions = steps.filter(step => step.type !== 'MOVE_TO');
    const moves = steps.filter(step => step.type === 'MOVE_TO');
    assert.equal(moves.length, 1, `${id}: une seule approche du bac`);
    assert.equal(moves[0].doorKey, undefined, 'Aucun détour de dégagement de porte');
    assert.equal(moves[0].protectedDoor, id === 'drona-nw-upper' ? undefined : id.startsWith('drona-ne-') ? 'glassRight' : 'living');
    assert.equal(actions.length, 1);
    assert.equal(actions[0].animation, 'pick-fruit');
    assert.equal(actions[0].repeatCount, 1);
    assert.equal(actions[0].waitForAnimation, true);
    assert(steps.every(step => !step.dronaMotion && !step.triggerEventKey));
  }
});
