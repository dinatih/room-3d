const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
require('../support/load-ts.cjs');
const g = require('../../src/features/scene/ai/navigation/geometry.ts');
const { NavigationMesh } = require('../../src/features/scene/ai/navigation/mesh.ts');

describe('Réseau permanent de passages au sol', () => {
  it('accepte une arrivée presque tangente au mur sans accepter une traversée', () => {
    const a = { x: 210.76416853392325, z: 601.9216815870601 }, b = { x: 205.21539176697746, z: 605.125271151847 };
    const obstacles = [[[{ x: 202.7420370678465, z: 606.5532631741202 }, { x: 218.786261296332, z: 597.2901258611054 }, { x: 220, z: 620 }]]];
    assert.equal(g.insideObstacle(b, obstacles), false);
    assert.equal(g.segmentFree(a, b, obstacles), true);
    assert.equal(g.segmentFree(b, a, obstacles), true);
    assert.equal(g.segmentFree(a, { x: b.x, z: b.z + 1 }, obstacles), false);
  });
  it('calcule les patrouilles des robots autour de l’architecture réelle', () => {
    const { architectureObstacles, walkableSurfaces } = require('../../src/features/scene/ai/navigation/architecture.ts');
    const { buildNavigationGraph } = require('../../src/features/scene/ai/navigation/queries.ts');
    let seed = 20261024;
    const random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 2 ** 32; };
    for (const radius of [5, 10, 20, 40]) {
      const mesh = buildNavigationGraph({ surfaces: walkableSurfaces, solids: architectureObstacles.map(obstacle => ({ polygon: obstacle.polygon, radius, comfort: true })), comfortDistance: 20 });
      for (let trip = 0; trip < 1000; trip++) {
        const point = () => {
          const cell = mesh.cells[Math.floor(random() * mesh.cells.length)], index = Math.floor(random() * 3), t = random();
          const a = cell.points[index], b = cell.points[(index + 1) % 3];
          return trip % 3 === 0 ? cell.center : trip % 3 === 1 ? a : { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
        };
        const start = point(), target = point();
        try { mesh.find(start, target); }
        catch (error) { throw new Error(JSON.stringify({ radius, trip, start, target }), { cause: error }); }
      }
    }
  });
  it('garde les chemins dans l’espace libre autour de plusieurs obstacles orientés', () => {
    let seed = 20261024;
    const random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 2 ** 32; };
    for (let fixture = 0; fixture < 1000; fixture++) {
      const polygons = Array.from({ length: 30 }, () => g.inflate(g.rectangle(random() * 400 - 200, random() * 400 - 200, 10 + random() * 100, 10 + random() * 100, random() * Math.PI), 4));
      const obstacles = g.union(polygons);
      const mesh = new NavigationMesh(obstacles, [[g.rectangle(0, 0, 400, 400)]], fixture % 2 ? undefined : { distance: 20, obstacles });
      for (let trip = 0; trip < 100; trip++) {
        const point = () => {
          if (trip % 3 === 0) return { x: random() * 360 - 180, z: random() * 360 - 180 };
          const cell = mesh.cells[Math.floor(random() * mesh.cells.length)], index = Math.floor(random() * 3);
          if (trip % 3 === 1) return cell.points[index];
          const a = cell.points[index], b = cell.points[(index + 1) % 3], t = random();
          return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
        };
        const start = point(), target = point();
        let path;
        try { path = mesh.find(start, target); }
        catch (error) { throw new Error(JSON.stringify({ fixture, trip, seed, start, target, polygons }), { cause: error }); }
        assert.equal(Boolean(path), mesh.canReach(start, target));
        if (path) assert(path.every((point, i) => g.segmentFree(i ? path[i - 1] : start, point, obstacles)));
      }
    }
  });
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
