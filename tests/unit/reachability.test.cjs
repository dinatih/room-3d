const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
require('../support/load-ts.cjs');
const g = require('../../src/features/scene/ai/navigation/geometry.ts');

describe('Accessibilité physique sans recherche du plus court chemin', () => {
    it('donne les mêmes réponses que le planificateur physique sur les trous, tangences et passages étroits', () => {
        const fixtures = [
            [],
            g.union([g.inflate(g.rectangle(0, 0, 40, 30, .4), 4)]),
            g.union([g.rectangle(-30, 0, 40, 10), g.rectangle(30, 0, 40, 10)]),
            g.union([g.rectangle(0, -40, 100, 10), g.rectangle(0, 40, 100, 10), g.rectangle(-45, 0, 10, 80), g.rectangle(45, 0, 10, 80)]),
            g.union([g.rectangle(0, 0, 20, 20), g.rectangle(20, 20, 20, 20)]),
            g.union([g.rectangle(-20, 0, 10, 100), g.rectangle(20, 0, 10, 100), g.rectangle(0, -45, 40, 10)]),
        ];
        let comparisons = 0, seed = 20261019;
        const random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 2 ** 32; };
        for (const obstacles of fixtures) {
            const oracle = new g.VisibilityGraph(obstacles);
            const physical = new g.VisibilityGraph(obstacles);
            const comfortable = new g.VisibilityGraph(obstacles, { distance: 20, obstacles: g.union(obstacles.flat().map(ring => g.inflate(ring, 20))) });
            const points = [{ x: 0, z: 0 }, { x: -10, z: -10 }, { x: 10, z: 10 }, { x: 20, z: 20 }, { x: 100, z: 0 },
                ...Array.from({ length: 35 }, () => ({ x: random() * 160 - 80, z: random() * 160 - 80 }))];
            for (const [i, start] of points.entries()) for (const target of [start, points[(i + 1) % points.length], points[(i + 17) % points.length]]) {
                const expected = oracle.find(start, target) !== null;
                assert.equal(physical.canReach(start, target), expected, JSON.stringify({ start, target, obstacles }));
                assert.equal(comfortable.canReach(start, target), expected);
                assert.equal(physical.canReach(target, start), expected, 'Reachability is symmetric');
                comparisons += 3;
            }
        }
        console.log(`${comparisons} exact reachability comparisons, including repeated queries and comfort graphs`);
    });

    it('ne construit pas de chemin et conserve les erreurs de coordonnées invalides', () => {
        const graph = new g.VisibilityGraph(g.union([g.rectangle(0, 0, 40, 40)]));
        graph.find = () => { throw Error('Reachability must not calculate a shortest route'); };
        assert.equal(graph.canReach({ x: -50, z: 0 }, { x: 50, z: 0 }), true);
        assert.equal(graph.canReach({ x: 0, z: 0 }, { x: 50, z: 0 }), false);
        assert.equal(graph.canReach({ x: 0, z: 0 }, { x: 0, z: 0 }), false);
        assert.equal(graph.canReach({ x: 50, z: 0 }, { x: 50, z: 0 }), true);
        for (const value of [NaN, Infinity, -Infinity]) {
            assert.throws(() => graph.canReach({ x: value, z: 0 }, { x: 50, z: 0 }), /Non-finite/);
            assert.throws(() => graph.canReach({ x: 50, z: 0 }, { x: 50, z: value }), /Non-finite/);
        }
    });
});
