const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');

it('separates scene skin resolution from detailed previews and scales Sara overlay to the same UV bounds', () => {
  const oldDocument = global.document, oldImage = global.Image;
  const pending = [];
  global.document = { createElement() {
    const draws = [];
    return { width: 0, height: 0, draws, getContext: () => ({ drawImage: (...args) => draws.push(args) }) };
  } };
  global.Image = class { constructor() { this.width = 4096; this.height = 2048; pending.push(this); } };
  try {
    const { getSaraNapeTattooTexture: sara } = load('src/features/scene/SaraNapeTattoo.ts', {
      three: THREE, './assets/sara-nape-body_torso-0.png': 'dressed',
      './assets/sara-nape-body_nude_torso-0.png': 'skin', './assets/sara-nape-body_nude_torso-1.png': 'neck',
    });
    const { getMarissaArmTattooTexture: marissa } = load('src/features/scene/MarissaArmTattoo.ts', { three: THREE, './assets/marissa-lion.png': 'lion' });
    const base = new THREE.Texture({ width: 1024, height: 512 });
    const mat = new THREE.MeshStandardMaterial({ map: base });
    for (const get of [material => sara(material, false, true), material => marissa(material, true)]) {
      const scene = get(mat);
      assert.deepEqual([scene.image.width, scene.image.height], [1024, 512]);
      assert.equal(get(mat), scene);
    }
    const detailed = sara(mat, false, false);
    assert.deepEqual([detailed.image.width, detailed.image.height], [4096, 2048]);
    assert.notEqual(detailed, sara(mat, false, true));
    pending[0].onload();
    assert.deepEqual(sara(mat, false, true).image.draws.at(-1).slice(1), [0, 0, 1024, 512]);
    const arm = marissa(mat, false);
    assert.deepEqual([arm.image.width, arm.image.height], [4096, 2048]);
    assert.notEqual(arm, marissa(mat, true));
  } finally { global.document = oldDocument; global.Image = oldImage; }
});
