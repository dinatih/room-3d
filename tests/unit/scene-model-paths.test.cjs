const { it } = require('node:test');
const assert = require('node:assert/strict');
require('../support/load-ts.cjs');
const { sceneModelPath } = require('../../src/features/scene/sceneModelPaths.ts');
it('normalizes audited model URLs and leaves unlisted assets unchanged', () => {
    const path = 'items/dji-avata-2/dji-avata-2.glb';
    const expected = '/items/dji-avata-2/dji-avata-2-scene-512.glb';
    assert.equal(sceneModelPath(path), expected);
    assert.equal(sceneModelPath('/' + path), expected);
    assert.equal(sceneModelPath('items/unlisted.glb'), 'items/unlisted.glb');
});
