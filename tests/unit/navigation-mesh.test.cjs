const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
require('../support/load-ts.cjs');
const g = require('../../src/features/scene/ai/navigation/geometry.ts');
const { NavigationMesh } = require('../../src/features/scene/ai/navigation/mesh.ts');

describe('Réseau permanent de passages au sol', () => {
  it('contourne les obstacles, conserve les passages étroits et les coordonnées finales', () => {
    for (const polygons of [[], [g.rectangle(0, 0, 40, 80)], [g.rectangle(-80, 0, 140, 20), g.rectangle(80, 0, 140, 20)]]) {
      const obstacles = g.union(polygons), surfaces = [[g.rectangle(0, 0, 400, 400)]];
      const mesh = new NavigationMesh(obstacles, surfaces, { distance: 20, obstacles: g.union(polygons.map(p => g.inflate(p, 20))) });
      const start = { x: 0, z: -100 }, target = { x: 0, z: 100 };
      const path = mesh.find(start, target);
      assert(path); assert.deepEqual(path.at(-1), target);
      assert(path.every((p, i) => g.segmentFree(i ? path[i - 1] : start, p, obstacles)), JSON.stringify(path));
      assert.equal(mesh.canReach(start, target), true);
      assert.equal(mesh.find(start, { x: 500, z: 0 }), null, 'The mesh must respect the ground boundary');
    }
  });

  it('respecte les sols concaves, les trous et les composantes déconnectées', () => {
    const surfaces = g.union([g.rectangle(-50, 0, 100, 200), g.rectangle(50, -50, 100, 100)]);
    const mesh = new NavigationMesh([], surfaces);
    const start = { x: -50, z: 80 }, target = { x: 80, z: -50 }, path = mesh.find(start, target);
    assert(path); assert(path.length > 1, 'A direct diagonal would leave the L-shaped ground');
    for (let i = 0; i < path.length; i++) {
      const a = i ? path[i - 1] : start, b = path[i];
      const middle = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
      assert(surfaces.some(rings => g.pointInRing(middle, rings[0])), JSON.stringify(path));
    }
    const separated = new NavigationMesh([], [[g.rectangle(-100, 0, 40, 40)], [g.rectangle(100, 0, 40, 40)]]);
    assert.equal(separated.canReach({ x: -100, z: 0 }, { x: 100, z: 0 }), false);
    assert.equal(separated.find({ x: -100, z: 0 }, { x: 100, z: 0 }), null);
    assert.throws(() => separated.canReach({ x: NaN, z: 0 }, target), /Non-finite/);
  });

  it('réutilise les mêmes cellules et donne les mêmes accessibilités que la géométrie physique', () => {
    const obstacles = g.union([g.inflate(g.rectangle(0, 0, 40, 30, .4), 4)]);
    const mesh = new NavigationMesh(obstacles, [[g.rectangle(0, 0, 400, 400)]]), oracle = new g.VisibilityGraph(obstacles);
    const cells = mesh.cells;
    let seed = 20261021;
    const random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 2 ** 32; };
    for (let i = 0; i < 50; i++) {
      const start = { x: random() * 300 - 150, z: random() * 300 - 150 }, target = { x: random() * 300 - 150, z: random() * 300 - 150 };
      assert.equal(mesh.canReach(start, target), oracle.canReach(start, target));
      const path = mesh.find(start, target);
      assert.equal(Boolean(path), oracle.canReach(start, target));
      if (path) assert(path.every((p, index) => g.segmentFree(index ? path[index - 1] : start, p, obstacles)));
    }
    assert.equal(mesh.cells, cells, 'Trips must not rebuild the permanent network');
  });
});
