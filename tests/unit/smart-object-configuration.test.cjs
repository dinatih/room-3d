const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');

it('expose uniquement les lits présents dans la configuration active', () => {
  const positionState = {};
  const { getAllSmartObjectIds } = load('src/features/scene/ai/smartObjectRegistry.ts', { '../positionState': { positionState } }, source => {
    const begin = source.indexOf('export function getAllSmartObjectIds()');
    const end = source.indexOf('export function getSmartObjectsByCategory', begin);
    return `import { positionState } from '../positionState';
      const SMART_OBJECTS = { 'bed-double': {}, 'bed-west': {}, 'bed-east': {}, shower: {} };
      ${source.slice(begin, end)}`;
  });
  assert.deepEqual(getAllSmartObjectIds(), ['bed-west', 'bed-east', 'shower']);
  positionState['bed-double'] = { idx: 1 };
  assert.deepEqual(getAllSmartObjectIds(), ['bed-double', 'shower']);
  positionState['bed-double'].idx = 0;
  assert.deepEqual(getAllSmartObjectIds(), ['bed-west', 'bed-east', 'shower']);
});
