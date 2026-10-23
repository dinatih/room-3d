const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const interx = require('../../src/features/scene/animations/interxManifest.ts');
const { getDuoAnimationForClip } = load('src/features/scene/animations/duoAnimations.ts', {
  './animationRegistry': { ANIMATION_DEFINITIONS: interx.INTERX_ANIMATION_DEFINITIONS },
  './interxManifest': interx,
});

it('toutes les variantes sur la jambe déclenchent le duo depuis B assis, avec A au décalage inverse', () => {
  const action = interx.INTERX_MANIFEST.actions.find(action => action.key === 'sit-on-leg');
  const variants = interx.INTERX_MANIFEST.duos.filter(duo => duo.actionCode === action.code);
  assert(variants.length > 0);
  for (const duo of variants) {
    const clipA = interx.INTERX_ANIMATION_DEFINITIONS.find(clip => clip.id === `${duo.id}-p1`);
    const clipB = interx.INTERX_ANIMATION_DEFINITIONS.find(clip => clip.id === `${duo.id}-p2`);
    assert(!clipA.tags.includes('seated-front'), duo.id);
    assert(clipB.tags.includes('seated-front'), duo.id);
    const session = getDuoAnimationForClip(clipB.path);
    assert.equal(session.animA, clipB.id);
    assert.equal(session.animB, clipA.id);
    assert.deepEqual(session.offsetB, [-duo.start_offset[0] * 100, 0, -duo.start_offset[2] * 100]);
  }
});
