const { it, after } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const previousWindow = global.window;
after(() => { if (previousWindow === undefined) delete global.window; else global.window = previousWindow; });
const { parseUrlLayerOverrides, updateUrlLayer } = load('src/features/scene/store/layerUrlParams.ts', {
  './debugPresets': { getDebugPreset: () => undefined },
});
function browser(href) {
  global.window = { location: new URL(href), history: {
    replaceState(_, __, url) { window.location = new URL(url); },
  } };
}
it('reads HD lighting on, off and hash URL flags', () => {
  for (const [query, expected] of [['?lightsHD=1', true], ['?lightsHD=0', false], ['?lightsHD', true], ['#/?lightsHD=1', true]]) {
    browser(`https://room.test/${query}`);
    assert.equal(parseUrlLayerOverrides().lightsHD, expected);
  }
});
it('persists the lighting toggle and preserves unrelated URL parameters', () => {
  browser('https://room.test/?perfGraph=1');
  updateUrlLayer('lightsHD', true);
  assert.equal(window.location.searchParams.get('lightsHD'), '1');
  assert.equal(parseUrlLayerOverrides().lightsHD, true);
  updateUrlLayer('lightsHD', false);
  assert.equal(window.location.searchParams.has('lightsHD'), false);
  assert.equal(window.location.searchParams.get('perfGraph'), '1');
});
