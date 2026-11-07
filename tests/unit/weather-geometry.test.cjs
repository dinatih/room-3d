const { it } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { load } = require('../support/load-ts.cjs');
const { SLAB_FOOTPRINT, CEILING_Y, CEILING_CANOPY, roofHeightAt } = load('src/features/scene/building/roofData.ts', { '../wallData': { WALL_H: 250 } });

it('les collisions météo suivent la géométrie du plafond, y compris diagonale et auvent', () => {
  const group = new THREE.Group();
  const geometry = new THREE.ShapeGeometry(new THREE.Shape(SLAB_FOOTPRINT.map(([x,z]) => new THREE.Vector2(x,-z))));
  geometry.rotateX(-Math.PI/2);
  const slab = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  slab.position.y = CEILING_Y; group.add(slab);
  const c = CEILING_CANOPY;
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(c.width,c.height,c.depth), new THREE.MeshBasicMaterial());
  canopy.position.set(c.x, CEILING_Y+c.height/2,c.z); group.add(canopy); group.updateMatrixWorld(true);
  const ray = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0,-1,0));
  for (let x = -50.3; x < 400; x += 23) for (let z = -300.7; z < 800; z += 31) {
    ray.ray.origin.set(x,1000,z);
    assert.ok(Math.abs(roofHeightAt(x,z) - (ray.intersectObject(group,true)[0]?.point.y ?? 0)) < 1e-6, `roof at ${x},${z}`);
  }
  assert.equal(roofHeightAt(300,700),0, 'The diagonal leaves this area open despite the enclosing box');
  assert.equal(roofHeightAt(150,-200),0, 'The gap before the canopy remains open');
  for (const object of group.children) { object.geometry.dispose(); object.material.dispose(); }
});
