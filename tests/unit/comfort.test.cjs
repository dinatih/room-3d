const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
require('../support/load-ts.cjs');
const g = require('../../src/features/scene/ai/navigation/geometry.ts');
const { NAVIGATION_COMFORT_CM: margin } = require('../../src/features/scene/ai/navigation/comfort.ts');
describe('Chemins confortables', () => {
    it('ne prépare les distances de confort que pour une recherche pondérée qui en a besoin', () => {
        const { ComfortField } = require('../../src/features/scene/ai/navigation/comfort.ts');
        const original = ComfortField.prototype.clearance;
        let calls = 0;
        ComfortField.prototype.clearance = function (...args) { calls++; return original.apply(this, args); };
        try {
            const obstacles = g.union([g.rectangle(0, 0, 40, 40)]);
            const graph = new g.VisibilityGraph(obstacles, { distance: margin, obstacles: g.union(obstacles.flat().map(p => g.inflate(p, margin))) });
            assert.equal(calls, 0, 'Graph creation must not measure every comfort vertex');
            assert(graph.canReach({ x: -100, z: 0 }, { x: 100, z: 0 }));
            assert.equal(calls, 0, 'Approaches only need physical reachability');
            assert.deepEqual(graph.find({ x: -100, z: 100 }, { x: 100, z: 100 }), [{ x: 100, z: 100 }]);
            assert.equal(calls, 0, 'A free straight route needs no vertex clearances either');
            const start = { x: -100, z: 0 }, target = { x: 100, z: 0 };
            const route = graph.find(start, target);
            assert(route); assert(calls >= graph.vertices.length);
            const clearances = graph.clearances;
            graph.find(start, target);
            assert.equal(graph.clearances, clearances, 'Repeated searches reuse prepared vertex distances');
        }
        finally { ComfortField.prototype.clearance = original; }
    });
    it('préserve les passages étroits et trouve le coût optimal vérifié par Dijkstra', () => {
        const make = polygons => new g.VisibilityGraph(g.union(polygons), { distance: margin, obstacles: g.union(polygons.map(p => g.inflate(p, margin))) });
        const length = (start, path) => path.reduce((sum, p, i) => sum + g.distance(i ? path[i - 1] : start, p), 0);
        const cost = (graph, start, path) => path.reduce((sum, p, i) => sum + graph.segmentCost(i ? path[i - 1] : start, p), 0);
        function check(graph, start, target) {
            const path = graph.find(start, target);
            assert.ok(path, 'A physically passable route must remain reachable');
            assert.deepEqual(path.at(-1), target, 'Exact destination must be preserved');
            for (let i = 0; i < path.length; i++)
                assert.ok(g.segmentFree(i ? path[i - 1] : start, path[i], graph.obstacles), 'Every segment must respect physical collisions');
            return path;
        }
        const wall = make([g.rectangle(0, -50, 1000, 100)]);
        const a = { x: -100, z: 1 }, b = { x: 100, z: 1 };
        const wallPath = check(wall, a, b);
        assert.ok(wallPath.some(p => p.z >= margin), 'A long wall must offer a more comfortable parallel route');
        assert.ok(cost(wall, a, wallPath) < wall.segmentCost(a, b), 'Small detour must beat the wall-hugging direct route');
        const shortTarget = { x: -95, z: 1 };
        assert.deepEqual(check(wall, a, shortTarget), [shortTarget], 'A large relative detour must not be mandatory');
        const square = make([g.rectangle(0, 0, 40, 40)]);
        const start = { x: -100, z: 0 }, target = { x: 100, z: 0 };
        const cornerPath = check(square, start, target);
        const shortest = new g.VisibilityGraph(square.obstacles).find(start, target);
        assert.ok(cost(square, start, cornerPath) < cost(square, start, shortest), 'Open corners must prefer a more comfortable detour');
        assert.ok(length(start, cornerPath) > length(start, shortest));
        const doorway = make([g.rectangle(-80, 0, 140, 20), g.rectangle(80, 0, 140, 20)]);
        const doorPath = check(doorway, { x: 0, z: -100 }, { x: 0, z: 100 });
        assert.ok(Math.abs(length({ x: 0, z: -100 }, doorPath) - 200) < g.CLEARANCE_ERROR, 'Overlapping comfort bands must not close a narrow door or force a detour');
        assert.deepEqual(check(square, { x: -100, z: 100 }, { x: 100, z: 100 }), [{ x: 100, z: 100 }]);
        assert.equal(square.find({ x: 0, z: 0 }, target), null);
        assert.throws(() => new g.VisibilityGraph([], { distance: NaN, obstacles: [] }));
        // A small obstacle near the middle of a long segment must contribute even
        // when the original endpoints and midpoint are all outside its comfort band.
        const small = make([g.rectangle(230, -1, 2, 2)]);
        const longA = { x: -1000, z: 1 }, longB = { x: 1000, z: 1 };
        assert.ok(small.segmentCost(longA, longB) > g.distance(longA, longB));
        // Compare the adaptive integral with an independent fine midpoint reference.
        let reference = 0;
        const samples = 20000;
        for (let i = 0; i < samples; i++) {
            const p = { x: longA.x + (longB.x - longA.x) * (i + 0.5) / samples, z: 1 };
            const clearance = Math.min(...small.obstacles.flat().flatMap(ring => ring.map((v, j) => g.distance(p, g.projectToSegment(p, v, ring[(j + 1) % ring.length])))));
            reference += 1 + Math.max(0, 1 - clearance / margin);
        }
        reference *= g.distance(longA, longB) / samples;
        assert.ok(Math.abs(small.segmentCost(longA, longB) - reference) <= g.CLEARANCE_ERROR);
        // Independent complete-graph Dijkstra verifies that lazy evaluation and its
        // physical-distance heuristic retain the weighted optimum, including corners
        // from which the destination lies away from the obstacle (not tangent to it).
        for (const [graph, from, to] of [
            [square, start, target], [square, { x: -100, z: -40 }, { x: 80, z: 65 }],
            [doorway, { x: -100, z: -100 }, { x: 100, z: 100 }],
        ]) {
            const nodes = [from, ...graph.vertices, to], best = Array(nodes.length).fill(Infinity), visited = new Set();
            best[0] = 0;
            while (visited.size < nodes.length) {
                let current = -1;
                for (let i = 0; i < nodes.length; i++)
                    if (!visited.has(i) && (current === -1 || best[i] < best[current]))
                        current = i;
                if (current === -1 || !Number.isFinite(best[current]) || current === nodes.length - 1)
                    break;
                visited.add(current);
                for (let i = 0; i < nodes.length; i++) {
                    if (visited.has(i) || !g.segmentFree(nodes[current], nodes[i], graph.obstacles))
                        continue;
                    best[i] = Math.min(best[i], best[current] + graph.segmentCost(nodes[current], nodes[i]));
                }
            }
            const result = check(graph, from, to);
            assert.ok(cost(graph, from, result) <= best.at(-1) + g.CLEARANCE_ERROR, 'Lazy A* must match complete weighted Dijkstra');
        }
    });
});
