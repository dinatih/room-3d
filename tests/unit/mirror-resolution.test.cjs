const { it } = require('node:test');
const assert = require('node:assert/strict');
require('../support/load-ts.cjs');
const THREE = require('three');
const { getAutoMirrorResolution } = require('../../src/features/scene/building/mirrorResolution.ts');

it('adapts each mirror at the exact 50 cm and 1 m boundaries, in both directions', () => {
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(100, 200));
  mirror.updateMatrixWorld(true);
  for (const [distance, resolution] of [[101, 512], [100, 512], [99, 1024], [50, 1024], [49, 2048], [0, 2048], [50, 1024], [100, 512]]) {
    assert.equal(getAutoMirrorResolution(mirror, new THREE.Vector3(0, 0, distance)), resolution);
  }
  // Being close to the infinite mirror plane but far outside the glass stays low resolution.
  assert.equal(getAutoMirrorResolution(mirror, new THREE.Vector3(200, 0, 1)), 512);
  mirror.geometry.dispose();
});

it('measures distance to the surface rather than the centre, through parent transforms', () => {
  const parent = new THREE.Group();
  parent.position.set(300, 100, -200);
  parent.rotation.y = Math.PI / 2;
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(100, 200).toNonIndexed());
  parent.add(mirror);
  parent.updateMatrixWorld(true);
  const position = new THREE.Vector3(45, 95, 49).applyMatrix4(mirror.matrixWorld);
  assert.equal(getAutoMirrorResolution(mirror, position), 2048);
  mirror.geometry.dispose();
});
