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

it('réserve le sommeil des lits simples et doubles aux clips de sommeil, sans Gunplay', () => {
  const manifests = Object.fromEntries(['interx', 'fab', 'behave', 'kit', 'accad'].map(name => [`./${name}Manifest`, { [`${name.toUpperCase()}_ANIMATION_DEFINITIONS`]: [] }]));
  const registry = load('src/features/scene/animations/animationRegistry.ts', manifests);
  const { getAnimationsByTags, resolveSlotAnimationInfo } = load('src/features/scene/animations/animationResolver.ts', {
    './animationRegistry': registry, './duoAnimations': {},
  });
  const { beds } = load('src/features/scene/ai/smartObjectRegistry.ts', {}, source => {
    const begin = source.indexOf("  'bed-double': {");
    const end = source.indexOf("\n  },", source.indexOf("  'bed-east': {", begin)) + 5;
    return `const HUMAN_BODY_RADIUS = 20; export const beds = { ${source.slice(begin, end)} };`;
  });
  const sleepIds = getAnimationsByTags('sleep').map(animation => animation.id);
  assert.ok(sleepIds.includes('laying-sleeping'));
  assert.ok(getAnimationsByTags('sleep').every(animation => !animation.tags.includes('transition')));
  assert.deepEqual(getAnimationsByTags('sleep-transition').map(animation => animation.id), ['lie-down-bed', 'get-up-bed']);
  assert.ok(getAnimationsByTags('laying').every(animation => !animation.id.startsWith('miley-')));
  for (const bed of Object.values(beds)) {
    for (const slot of bed.slots.filter(slot => slot.slotId.startsWith('lie-down'))) {
      const variants = resolveSlotAnimationInfo(slot).variants;
      assert.ok(variants.length > 0);
      assert.deepEqual(variants.map(variant => variant.canonicalId).sort(), [...sleepIds].sort());
    }
  }
  for (const id of ['gunplay', 'gunplay-1', 'gunplay-shooting']) {
    const animation = registry.ANIMATION_DEFINITIONS.find(animation => animation.id === id);
    assert.deepEqual(animation.tags, ['combat']);
  }
});
