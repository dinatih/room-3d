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
  it('sépare calcul, file, messages et reprise sans compter deux fois une lecture', () => {
    const previousWorker = globalThis.Worker, previousClock = globalThis.performance, sent = [];
    let worker, now = 10;
    globalThis.performance = { now: () => now };
    globalThis.Worker = class { constructor() { worker = this; } postMessage(message) { sent.push(message); } };
    try {
      const scopeModule = require('../../src/features/scene/ai/navigation/navigationScope.ts');
      const client = load('src/features/scene/ai/navigation/pathfindingClient.ts', {
        './navigationScope': scopeModule, '../../cameraState': { cameraState: {} },
      }, source => source.replaceAll('import.meta.url', "'file:///navigation.ts'").replace(/if \(import\.meta\.hot\)[\s\S]*$/, ''));
      const answer = (request, milliseconds, result) => worker.onmessage({ data: { id: request.id, graphId: request.graphId, ok: true, milliseconds, result } });
      const preparation = client.prepareNavigationGraph({ solids: [] }), build = sent.shift();
      now = 30; answer(build, 7, { vertices: [], obstacles: [] });
      now = 42; const graph = preparation.read(); preparation.read();
      const scope = new scopeModule.NavigationScope();
      const operation = () => graph.canReach({ x: 0, z: 0 }, { x: 20, z: 0 });
      assert.throws(() => scope.run(operation), scopeModule.NavigationPending);
      const reach = sent.shift();
      now = 50; const path = client.requestPath(graph, { x: 0, z: 0 }, { x: 30, z: 0 }, () => {});
      assert.equal(sent.length, 0, 'The path waits behind the running accessibility query');
      now = 70; answer(reach, 20, true);
      const search = sent.shift();
      now = 90; answer(search, 5, [{ x: 30, z: 0 }]);
      now = 95; assert.equal(scope.run(operation), true);
      now = 100; path.onRead(); path.onRead();
      assert.deepEqual(client.pathfindingStats.timings.build, { completed: 1, consumed: 1, queueMs: 0, workerMs: 7, deliveryMs: 13, resumeMs: 12, maxTotalMs: 32 });
      assert.deepEqual(client.pathfindingStats.timings.reach, { completed: 1, consumed: 1, queueMs: 0, workerMs: 20, deliveryMs: 8, resumeMs: 25, maxTotalMs: 53 });
      assert.deepEqual(client.pathfindingStats.timings.path, { completed: 1, consumed: 1, queueMs: 20, workerMs: 5, deliveryMs: 15, resumeMs: 10, maxTotalMs: 50 });
      preparation.cancel();
    } finally { globalThis.performance = previousClock; if (previousWorker === undefined) delete globalThis.Worker; else globalThis.Worker = previousWorker; }
  });

  it('garde un graphe vivant pour ses lecteurs après son remplacement dans le cache', () => {
    const previous = globalThis.Worker, sent = [];
    let worker;
    globalThis.Worker = class { constructor() { worker = this; } postMessage(message) { sent.push(message); } };
    try {
      const { NavigationScope, NavigationPending } = require('../../src/features/scene/ai/navigation/navigationScope.ts');
      const client = load('src/features/scene/ai/navigation/pathfindingClient.ts', {
        './navigationScope': require('../../src/features/scene/ai/navigation/navigationScope.ts'), '../../cameraState': { cameraState: {} },
      }, source => source.replaceAll('import.meta.url', "'file:///navigation.ts'").replace(/if \(import\.meta\.hot\)[\s\S]*$/, ''));
      const preparation = client.prepareNavigationGraph({ solids: [] });
      const release = preparation.retain();
      const build = sent.shift();
      worker.onmessage({ data: { id: build.id, graphId: build.graphId, ok: true, milliseconds: 0, result: { vertices: [], obstacles: [], comfort: [] } } });
      const graph = preparation.read(), scope = new NavigationScope();
      const operation = () => graph.canReach({ x: 0, z: 0 }, { x: 20, z: 0 });
      assert.throws(() => scope.run(operation), NavigationPending);
      const reach = sent.shift();
      preparation.cancel();
      assert.equal(sent.length, 0, 'Cache replacement must not cancel a reader’s accessibility query');
      worker.onmessage({ data: { id: reach.id, graphId: reach.graphId, ok: true, milliseconds: 0, result: true } });
      assert.equal(scope.run(operation), true);
      const targets = [{ x: 0, z: 0 }, { x: 20, z: 0 }, { x: 40, z: 0 }];
      const batch = () => graph.findReachable({ x: -20, z: 0 }, targets);
      assert.throws(() => scope.run(batch), NavigationPending);
      assert.equal(sent.length, 1, 'All candidates must share a single worker round trip');
      const selection = sent.shift();
      assert.deepEqual(selection.query, { kind: 'reach-first', start: { x: -20, z: 0 }, targets });
      worker.onmessage({ data: { id: selection.id, graphId: selection.graphId, ok: true, milliseconds: 0, result: targets[1] } });
      assert.deepEqual(scope.run(batch), targets[1]);
      release();
      assert.deepEqual(sent, [{ release: graph.id }]);
      preparation.cancel(); assert.equal(sent.length, 1, 'Cache disposal is idempotent');
      assert.throws(() => preparation.retain(), /released navigation graph/);
    } finally { if (previous === undefined) delete globalThis.Worker; else globalThis.Worker = previous; }
  });

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

  it('vérifie tous les candidats en une demande en conservant la première destination accessible', () => withWorker(send => {
    const definition = { solids: [{ polygon: geometry.rectangle(0, 0, 40, 40), radius: 4, comfort: false }] };
    const start = { x: -80, z: 0 }, reference = queries.buildNavigationGraph(definition);
    assert(send({ graphId: 1, definition, query: { kind: 'build' } }).ok);
    for (const targets of [[], [{ x: 0, z: 0 }], [{ x: 0, z: 0 }, { x: 80, z: 0 }, { x: -70, z: 0 }]]) {
      const response = send({ graphId: 1, query: { kind: 'reach-first', start, targets } });
      assert(response.ok);
      assert.deepEqual(response.result, targets.find(target => reference.canReach(start, target)) ?? null);
    }
    const invalid = send({ graphId: 1, query: { kind: 'reach-first', start, targets: [{ x: NaN, z: 0 }] } });
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
