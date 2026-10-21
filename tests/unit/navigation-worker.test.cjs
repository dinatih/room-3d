const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const geometry = require('../../src/features/scene/ai/navigation/geometry.ts');
const queries = require('../../src/features/scene/ai/navigation/queries.ts');

function withWorker(exercise) {
  const previous = globalThis.self, messages = [];
  globalThis.self = { postMessage: message => messages.push(message) };
  try {
    load('src/features/scene/ai/navigation/pathfinding.worker.ts', { './geometry': geometry, './queries': queries });
    let id = 0;
    exercise(request => {
      globalThis.self.onmessage({ data: { id: ++id, ...request } });
      return messages.pop();
    });
  } finally {
    if (previous === undefined) delete globalThis.self;
    else globalThis.self = previous;
  }
}

describe('Protocole réel du worker de navigation', () => {
  it('prépare les obstacles et conserve exactement les chemins et accessibilités physiques', () => withWorker(send => {
    const definition = { solids: [{ polygon: geometry.rectangle(0, 0, 40, 80), radius: 4, comfort: true }], comfortDistance: 15 };
    const reference = queries.buildNavigationGraph(definition);
    const built = send({ graphId: 1, definition, query: { kind: 'build' } });
    assert(built.ok);
    assert.deepEqual(built.result.obstacles, reference.obstacles);
    assert.deepEqual(built.result.comfort, reference.comfort);
    for (const [start, target] of [[{ x: -80, z: 0 }, { x: 80, z: 0 }], [{ x: 0, z: 0 }, { x: 80, z: 0 }]]) {
      const reachable = send({ graphId: 1, query: { kind: 'reach', start, target } });
      assert(reachable.ok); assert.equal(reachable.result, reference.canReach(start, target));
      const path = send({ graphId: 1, query: { kind: 'path', start, target } });
      assert(path.ok); assert.deepEqual(path.result, reference.find(start, target));
    }
  }));

  it('réutilise plusieurs graphes, les libère explicitement et signale les données invalides', () => withWorker(send => {
    const definition = { solids: [] }, start = { x: 0, z: 0 }, target = { x: 20, z: 0 };
    for (const graphId of [1, 2]) assert(send({ graphId, definition, query: { kind: 'build' } }).ok);
    assert.deepEqual(send({ graphId: 1, query: { kind: 'path', start, target } }).result, [target]);
    assert.equal(send({ release: 1 }), undefined);
    const released = send({ graphId: 1, query: { kind: 'path', start, target } });
    assert(!released.ok); assert.match(released.error, /unknown graph/);
    assert(send({ graphId: 2, query: { kind: 'path', start, target } }).ok);
    const invalid = send({ graphId: 2, query: { kind: 'reach', start: { x: NaN, z: 0 }, target } });
    assert(!invalid.ok); assert.match(invalid.error, /Non-finite/);
  }));

  it('sélectionne une approche hors du meuble avec le même gabarit et la contrainte de façade', () => withWorker(send => {
    const obstacle = geometry.rectangle(0, 0, 40, 40);
    const definition = { solids: [{ polygon: obstacle, radius: 4, comfort: false }] };
    const snapshot = send({ graphId: 1, definition, query: { kind: 'build' } }).result;
    const response = send({ graphId: 1, query: { kind: 'approach', approach: {
      owner: 'chair', goal: { x: 0, z: 0 }, start: { x: 0, z: -80 }, owned: [{ polygon: obstacle, radius: 4 }],
      surfaces: [[geometry.rectangle(0, 0, 400, 400)]], actors: [], exiting: false, flexible: false,
      region: { x: 0, z: 0, rotation: 0, width: 40 }, escape: { solids: [] },
    } } });
    assert(response.ok); assert(response.result.length > 0);
    const approach = response.result[0];
    assert(approach.z <= 0 && Math.abs(approach.x) <= 20);
    assert(!geometry.insideObstacle(approach, snapshot.obstacles));
    assert(queries.buildNavigationGraph(definition).canReach({ x: 0, z: -80 }, approach));
  }));
});
