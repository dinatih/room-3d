const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');

it('cadre les PNJ dans la caméra d’ombre après chaque changement de dimensions', () => {
  const { update } = load('src/features/inventory/InventoryPreview.tsx', {}, source =>
    `export const update = ${source.match(/onUpdate=\{(light => .*?)\}\n/)[1]};`);
  const light = new THREE.DirectionalLight();
  for (const radius of [50, 180]) {
    Object.assign(light.shadow.camera, { left: -radius * 2, right: radius * 2, top: radius * 2, bottom: -radius * 2, far: radius * 8 });
    update(light);
    const edge = new THREE.Vector3(1, 1, 1).unproject(light.shadow.camera);
    assert(Math.abs(edge.x - radius * 2) < 1e-8);
    assert(Math.abs(edge.y - radius * 2) < 1e-8);
    assert(Math.abs(edge.z + radius * 8) < 1e-8);
    for (const layer of [0, 16, 18]) {
      const layers = new THREE.Layers(); layers.set(layer);
      assert(light.layers.test(layers));
      assert(light.shadow.camera.layers.test(layers));
    }
  }
});
