const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const objects = Object.fromEntries(['freezer', 'kallax-ne'].map(id => [id, {
  id, slots: [{ slotId: 'use', animation: 'pick-fruit-3', rotY: Math.PI / 2 }],
}]));
const { buildSmartObjectInstructionSequence } = load('src/features/scene/ai/smartObjectRegistry.ts', {
  fixtures: { getSmartObject: id => objects[id], OccupancyManager: { canUseObject: () => true } },
}, source => `
import { getSmartObject, OccupancyManager } from 'fixtures';
const SMART_OBJECTS = {}, BATHROOM_STORAGE_ITEMS = {}, KITCHEN_DRONA_ITEMS = {}, DRONA_SPECIAL_ITEMS = {}, DRONA_SE_ITEMS = {};
const FREEZER_DOOR_DURATION = 1;
${source.slice(source.indexOf('export function buildSmartObjectInstructionSequence('), source.indexOf('export function getSmartObject('))}
`);

it('repart du congélateur après fermeture sans imposer un détour par la porte du séjour', () => {
  const sequence = buildSmartObjectInstructionSequence('freezer', 'use');
  assert.deepEqual(sequence.map(step => step.type), ['MOVE_TO', 'WAIT', 'USE_OBJECT', 'WAIT']);
  assert.equal(sequence[0].doorKey, 'living');
  assert.deepEqual(sequence.filter(step => step.triggerEventKey === 'freezer').map(step => step.triggerEventValue), [true, false]);
  assert(sequence.slice(1).every(step => step.protectedDoor === 'living'));
  assert.equal(sequence.at(-1).duration, 1);
});

it('conserve le dégagement de sortie du KALLAX nord-est', () => {
  const sequence = buildSmartObjectInstructionSequence('kallax-ne', 'use');
  assert.equal(sequence.at(-1).type, 'MOVE_TO');
  assert.equal(sequence.at(-1).doorKey, 'glassRight');
});
