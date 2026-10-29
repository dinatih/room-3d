const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');

it('le maillot fixe garde son flocage entre rendus et libère les textures après chargement de la police et au démontage', t => {
  const previousDocument = globalThis.document, printed = [];
  const context = new Proxy({ fillText: text => printed.push(text) }, { get: (target, key) => target[key] ?? (() => {}) });
  globalThis.document = { createElement: () => ({ getContext: () => context }) };
  t.after(() => { if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument; });
  const memos = [], effects = [], pending = [];
  let memoIndex, effectIndex, fontReady = false;
  const { MaillotInyeong } = load('src/features/scene/items/MaillotInyeong.tsx', {
    three: THREE, 'react/jsx-runtime': require('react/jsx-runtime'),
    './shirtGeometry': load('src/features/scene/items/shirtGeometry.ts', { three: THREE }), '../glbUtils': {},
    react: {
      useRef: () => ({ current: null }), useState: () => [fontReady, () => {}], useLayoutEffect() {},
      useMemo: (fn, deps) => { const index = memoIndex++, previous = memos[index]; if (!previous || deps.some((v, i) => v !== previous.deps[i])) memos[index] = { deps, value: fn() }; return memos[index].value; },
      useEffect: (fn, deps) => { const index = effectIndex++, previous = effects[index]; if (!previous || deps.some((v, i) => v !== previous.deps[i])) pending.push(() => { previous?.cleanup?.(); effects[index] = { deps, cleanup: fn() }; }); },
    },
  });
  const disposals = new Map();
  const render = () => {
    memoIndex = effectIndex = 0;
    const element = MaillotInyeong({});
    const textures = element.props.children.flatMap(child => [child?.props?.children].flat().map(node => node?.props?.map)).filter(Boolean);
    for (const texture of textures) if (!disposals.has(texture)) {
      disposals.set(texture, 0); texture.addEventListener('dispose', () => disposals.set(texture, disposals.get(texture) + 1));
    }
    pending.splice(0).forEach(fn => fn());
    return textures;
  };
  const first = render();
  assert.deepEqual(printed, ['INYEONG', '24', '24']);
  assert.deepEqual(render(), first);
  for (const count of disposals.values()) assert.equal(count, 0);
  fontReady = true;
  const loaded = render();
  for (const texture of first) assert.equal(disposals.get(texture), 1);
  assert.deepEqual(render(), loaded);
  for (const texture of loaded) assert.equal(disposals.get(texture), 0);
  effects.forEach(effect => effect.cleanup?.());
  for (const count of disposals.values()) assert.equal(count, 1);
});
