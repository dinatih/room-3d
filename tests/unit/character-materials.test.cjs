const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');

it('isole les styles des personnages en conservant les textures invariantes partagées', () => {
  const { applyLaraVariantStyles } = load('src/features/scene/LaraVariants.ts', {
    three: THREE, './SaraNapeTattoo': {}, './MarissaReferenceTattoos': {}, './MarissaArmTattoo': {},
    './LaraLimbTattoos': {}, './LaraShoulderTattoo': {}, './ChaBackTattoo': {},
  });
  const material = new THREE.MeshStandardMaterial({ map: new THREE.Texture() });
  const source = new THREE.Group(); source.add(new THREE.Mesh(new THREE.BoxGeometry(), material));
  const first = source.clone(true), second = source.clone(true);
  applyLaraVariantStyles(first, 'native'); applyLaraVariantStyles(second, 'native');
  const a = first.children[0].material, b = second.children[0].material;
  assert.notEqual(a, b); assert.notEqual(a, material);
  assert.equal(a.map, material.map); assert.equal(b.map, material.map);
  a.color.set('red'); a.emissiveIntensity = 4;
  assert.equal(b.color.getHex(), 0xffffff); assert.equal(material.color.getHex(), 0xffffff);
  assert.equal(b.emissiveIntensity, 1);
  let disposed = 0; a.addEventListener('dispose', () => disposed++);
  applyLaraVariantStyles(first, 'native');
  assert.equal(disposed, 1); assert.equal(first.children[0].material.color.getHex(), 0xffffff);
  assert.equal(second.children[0].material, b);
});
