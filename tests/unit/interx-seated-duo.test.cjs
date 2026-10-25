const { it } = require('node:test');
const assert = require('node:assert/strict');
require('../support/load-ts.cjs');
const interx = require('../../src/features/scene/animations/interxManifest.ts');
const { getAnimationsByTags, resolveSlotAnimation } = require('../../src/features/scene/animations/animationResolver.ts');
const { getDuoAnimationForClip } = require('../../src/features/scene/animations/duoAnimations.ts');

it('le tirage seated-front sélectionne le participant assis vérifié et lance son duo en rôle A', () => {
  const pool = getAnimationsByTags('seated-front');
  const random = Math.random;
  try {
    for (const duo of interx.INTERX_MANIFEST.duos) {
      for (const person of ['p1', 'p2']) {
        const clip = interx.INTERX_ANIMATION_DEFINITIONS.find(clip => clip.id === `${duo.id}-${person}`);
        const index = pool.findIndex(candidate => candidate.id === clip.id);
        assert.equal(index >= 0, person === 'p1' && duo.tags.includes('seated-front'), clip.id);
        if (index < 0) continue;
        Math.random = () => (index + 0.5) / pool.length;
        const selected = resolveSlotAnimation({ animationsRandom: 'seated-front' });
        assert.equal(selected.animation, clip.path);
        const session = getDuoAnimationForClip(selected.animation);
        assert.equal(session.id, duo.id);
        assert.equal(session.animA, clip.id);
      }
    }
  } finally {
    Math.random = random;
  }
});
