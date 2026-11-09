const { it } = require('node:test');
const assert = require('node:assert/strict');
require('../support/load-ts.cjs');
const { averageFps } = require('../../src/features/scene/devState.ts');

it('counts slow frames by their duration instead of averaging instantaneous FPS', () => {
    assert.equal(averageFps([]), 0);
    assert.equal(averageFps([50, 50, 50]), 20);
    assert(Math.abs(averageFps([20, 100]) - 1000 / 60) < 1e-10);
    for (const invalid of [0, -1, NaN, Infinity]) assert.throws(() => averageFps([invalid]), /Invalid frame duration/);
});
