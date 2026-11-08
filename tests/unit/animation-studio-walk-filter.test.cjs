const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const walks = require('../../src/features/scene/ai/agent/agentWalkAnimations.ts');
const { filterStudioAnimations } = load('src/features/inventory/animationStudioCatalog.ts', { fixture: walks }, source =>
  `import { ANIMATION_WALK_SPEEDS, NPC_WALK_ANIMATIONS } from 'fixture';
   const normalizeSearchStr = value => value.toLowerCase();
   ${source.slice(source.indexOf('export function filterStudioAnimations'))}`);

it('intègre les marches aux catégories et les combine avec la recherche et la source', () => {
  const catalog = ['running', 'walking-slow', 'idle'].map(id => ({ id, category: 'locomotion',
    sources: ['mixamo'], annotationId: id, searchIndex: id }));
  const filters = { search: '', source: '', status: '', tag: '', minDuration: '', maxDuration: '', sort: 'catalog' };
  const select = patch => filterStudioAnimations(catalog, { ...filters, ...patch }, {}).map(a => a.id);
  assert.deepEqual(select({ category: 'npc-walk' }), ['running']);
  assert.deepEqual(select({ category: 'walk' }), ['running', 'walking-slow']);
  assert.deepEqual(select({ category: 'walk', search: 'slow', source: 'mixamo' }), ['walking-slow']);
  assert.deepEqual(select({ category: 'walk', source: 'miley' }), []);
  assert.deepEqual(select({ category: '' }), ['running', 'walking-slow', 'idle']);
});
