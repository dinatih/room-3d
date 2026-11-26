const { it } = require('node:test');
const assert = require('node:assert/strict');
require('../support/load-ts.cjs');
const { startCooking, advanceCooking, cancelCooking, kitchenCooking, COOKING_RECIPES } = require('../../src/features/scene/ai/kitchenCooking.ts');

it('choisit chaque recette sur un tiers du tirage et réserve une seule cuisine', () => {
  const random = Math.random;
  try {
    COOKING_RECIPES.forEach((recipe, i) => {
      Math.random = () => (i + 0.5) / 3;
      assert.equal(startCooking('native').recipe, recipe);
      assert.throws(() => startCooking('cha'), /réservée/);
      cancelCooking('cha');
      assert.equal(kitchenCooking.session.owner, 'native');
      cancelCooking('native');
    });
  } finally { Math.random = random; kitchenCooking.session = null; }
});
it('termine après quinze secondes simulées, respecte pauses et vitesse, annule sans résultat', () => {
  startCooking('native');
  assert.equal(advanceCooking('native', 3), false);
  assert.equal(advanceCooking('native', 0), false);
  assert.equal(kitchenCooking.session.elapsed, 3);
  assert.equal(advanceCooking('native', 2 * 5), false);
  assert.equal(advanceCooking('native', 1.99), false);
  assert.equal(advanceCooking('native', 0.01), true);
  cancelCooking('native');
  assert.equal(kitchenCooking.session, null);
  assert.equal(startCooking('cha').elapsed, 0);
  advanceCooking('cha', 4);
  cancelCooking('cha');
  assert.equal(kitchenCooking.session, null);
});
