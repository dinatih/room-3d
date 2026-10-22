const { it } = require('node:test');
const assert = require('node:assert/strict');
require('../support/load-ts.cjs');
const { createH2SoloCycle, advanceH2SoloCycle } = require('../../src/features/scene/items/h2SoloCycle.ts');

it('attend 10 secondes, laisse charger puis joue exactement trois répétitions complètes', () => {
  const cycle = createH2SoloCycle();
  let picks = 0;
  const tick = (delta, ready = true) => advanceH2SoloCycle(cycle, delta, 2, ready, () => { picks++; return 'dance'; });
  assert.equal(tick(9), false);
  assert.equal(tick(1), true);
  assert.equal(cycle.motion, 'dance');
  assert.equal(tick(20, false), false);
  assert.equal(cycle.time, 0);
  tick(2); assert.equal(cycle.repetitions, 2);
  tick(2); assert.equal(cycle.repetitions, 1);
  tick(1.9); assert.equal(cycle.motion, 'dance');
  assert.equal(tick(0.1), true);
  assert.equal(cycle.motion, 'idle');
  tick(9); assert.equal(picks, 1);
  tick(1); assert.equal(picks, 2);
});

it('compte les répétitions même si une frame dépasse plusieurs boucles, et refuse une durée invalide', () => {
  const cycle = createH2SoloCycle();
  advanceH2SoloCycle(cycle, 10, 1, true, () => 'dance');
  advanceH2SoloCycle(cycle, 3, 1, true, () => 'dance');
  assert.equal(cycle.motion, 'idle');
  assert.throws(() => advanceH2SoloCycle(cycle, 1, 0, true, () => 'dance'), /duration/);
});
