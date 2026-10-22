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
it('joue Pick Fruit une seule fois pour le pyjama et le Dröna supérieur NW', () => {
  const { sequence } = load('src/features/scene/ai/smartObjectRegistry.ts', {}, source => {
    const start = source.indexOf('export function buildSmartObjectInstructionSequence(');
    const end = source.indexOf('/**\n * Résout un SmartObject', start);
    assert(start > 0 && end > start);
    return `export function sequence(id) {
      const SMART_OBJECTS = {}, BATHROOM_STORAGE_ITEMS = {}, KITCHEN_DRONA_ITEMS = {};
      const OccupancyManager = { canUseObject: () => true };
      const getSmartObject = objectId => ({ id: objectId, slots: [{ slotId: 'pick-item', animation: 'pick-fruit' }] });
      ${source.slice(start, end).replace('export function', 'function')}
      return buildSmartObjectInstructionSequence(id, 'pick-item');
    }`;
  });
  for (const id of ['drona-se-pyjama', 'drona-nw-upper']) {
    const steps = sequence(id), actions = steps.filter(step => step.type !== 'MOVE_TO');
    assert.equal(actions.length, 1);
    assert.equal(actions[0].animation, 'pick-fruit');
    assert.equal(actions[0].repeatCount, 1);
    assert.equal(actions[0].waitForAnimation, true);
    assert(steps.every(step => !step.dronaMotion && !step.triggerEventKey));
  }
});
