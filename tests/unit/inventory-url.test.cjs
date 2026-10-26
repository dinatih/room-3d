const { it, after } = require('node:test');
const previousWindow = global.window;
after(() => { if (previousWindow === undefined) delete global.window; else global.window = previousWindow; });
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const { parseUrlInventory, inventoryUrl, updateUrlInventory } = load('src/features/inventory/inventoryUrlParams.ts', {
  './inventoryData': { CATEGORIES: ['all', 'tech', 'characters', 'animations', 'wigs', 'storage', 'spaces'].map(id => ({ id })) },
});
function browser(href) {
  const calls = [];
  global.window = { location: new URL(href), history: {
    state: { other: true },
    pushState(state, _, url) { calls.push(['push', state, url]); window.location = new URL(url); },
    replaceState(state, _, url) { calls.push(['replace', state, url]); window.location = new URL(url); },
  } };
  return calls;
}
it('reads category aliases and item targets, including hash query links', () => {
  browser('https://room.test/studio.html?inventaire=pnj&item=native');
  assert.deepEqual(parseUrlInventory(), { open: true, category: 'characters', target: { type: 'item', id: 'native' } });
  browser('https://room.test/#/?inv=perruques&item=hair_wolf_haircut');
  assert.equal(parseUrlInventory().category, 'wigs');
  assert.equal(parseUrlInventory().target.id, 'hair_wolf_haircut');
});
it('round trips solo and duo identities and encodes identifiers', () => {
  for (const mode of ['solo', 'duo']) {
    const state = { open: true, category: 'animations', target: { type: 'animation', id: 'test / & pose', mode } };
    browser(inventoryUrl(state, 'https://room.test/studio.html?debug=1&target=studio'));
    assert.deepEqual(parseUrlInventory(), state);
    assert.equal(window.location.searchParams.get('debug'), '1');
    assert.equal(window.location.searchParams.get('target'), 'studio');
  }
});
it('removes inventory aliases in search and hash while preserving other application parameters', () => {
  const href = 'https://room.test/studio.html?inventaire=pnj&page=animations&debug=1#/?inv=wigs&item=hair&keep=yes';
  const result = new URL(inventoryUrl({ open: false, category: 'all' }, href));
  assert.equal(result.search, '?debug=1');
  assert.equal(result.hash, '#/?keep=yes');
  assert.equal(new URL(inventoryUrl({ open: false, category: 'all' }, 'https://room.test/?page=help')).search, '?page=help');
});
it('pushes explicit navigation, replaces automatic selections and ignores duplicate URLs', () => {
  const calls = browser('https://room.test/studio.html?debug=1&target=studio');
  updateUrlInventory(true, 'characters');
  updateUrlInventory(true, 'characters', { type: 'item', id: 'native' }, 'replace');
  updateUrlInventory(true, 'characters', { type: 'item', id: 'native' });
  updateUrlInventory(false);
  assert.deepEqual(calls.map(c => c[0]), ['push', 'replace', 'push']);
  assert.deepEqual(calls[0][1], { other: true });
  assert.equal(window.location.search, '?debug=1&target=studio');
});
it('preserves invalid target identifiers for an explicit not-found view', () => {
  browser('https://room.test/?inventory=tech&item=missing');
  assert.equal(parseUrlInventory().target.id, 'missing');
});
