const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const geometry = require('../../src/features/scene/ai/navigation/geometry.ts');
const meshModule = require('../../src/features/scene/ai/navigation/mesh.ts');
const queries = require('../../src/features/scene/ai/navigation/queries.ts');
const scopes = require('../../src/features/scene/ai/navigation/navigationScope.ts');
const surfaces = [[geometry.rectangle(0, 0, 400, 400)]];
const definition = { solids: [], surfaces };
const snapshot = () => queries.buildNavigationGraph(definition).snapshot();
const approach = { owner: 'fixture', goal: { x: 0, z: 0 }, start: { x: -80, z: 0 }, owned: [], surfaces,
  actors: [], exiting: false, flexible: false, escape: [] };
const duo = { anchor: { x: 0, z: 0 }, offsets: [{ x: 20, z: 0 }], partner: definition, surfaces };
const clientModule = (journal = []) => load('src/features/scene/ai/navigation/pathfindingClient.ts', {
  '@/devLog': { devLog: entry => journal.push(entry), DEV_LOG_ENABLED: true },
  './navigationScope': scopes, './mesh': meshModule, './queries': queries, '../../cameraState': { cameraState: {} },
}, source => source.replaceAll('import.meta.url', "'file:///navigation.ts'").replace(/if \(import\.meta\.hot\)[\s\S]*$/, ''));

function withWorker(exercise) {
  const previous = globalThis.self, messages = [];
  globalThis.self = { postMessage: message => messages.push(message) };
  try {
    load('src/features/scene/ai/navigation/pathfinding.worker.ts', { './geometry': geometry, './queries': queries, './mesh': meshModule });
    let id = 0;
    exercise(request => { globalThis.self.onmessage({ data: { id: ++id, ...request } }); return messages.pop(); });
  } finally { if (previous === undefined) delete globalThis.self; else globalThis.self = previous; }
}

describe('Construction du réseau et requêtes géométriques dans le worker', () => {
  it('quitte un meuble du côté connecté à la prochaine destination', () => {
    const furniture = geometry.rectangle(0, 0, 40, 400);
    const graph = queries.buildNavigationGraph({ ...definition, solids: [{ polygon: furniture, radius: 0, comfort: false }] });
    const goal = { x: 100, z: 0 };
    const candidates = queries.objectApproachCandidates({ ...approach, goal, start: { x: -15, z: 0 },
      owned: [{ polygon: furniture, radius: 0 }], exiting: true }, graph);
    assert(candidates.length > 0);
    assert(candidates.every(point => graph.canReach(point, goal)), 'La sortie la plus proche à gauche est une impasse');
    assert(candidates[0].x > 0);
  });
  it('sépare calcul, file, messages et reprise sans compter deux fois une lecture', () => {
    const previousWorker = globalThis.Worker, previousClock = globalThis.performance, sent = [];
    let worker, now = 10;
    globalThis.performance = { now: () => now };
    globalThis.Worker = class { constructor() { worker = this; } postMessage(message) { sent.push(message); } };
    try {
      const journal = [], client = clientModule(journal);
      const answer = (request, milliseconds, result) => worker.onmessage({ data: { id: request.id, graphId: request.graphId, ok: true, milliseconds, result } });
      const preparation = client.prepareNavigationGraph(definition), build = sent.shift();
      assert.equal(preparation.pending, true);
      assert(!journal.some(entry => entry.action === 'nav_job_wait'), 'Checking preparation must not count as a blocked actor');
      assert.throws(() => preparation.read(), scopes.NavigationPending);
      now = 30; answer(build, 7, snapshot());
      assert.equal(preparation.pending, false);
      now = 42; const graph = preparation.read(); preparation.read();
      const first = new scopes.NavigationScope(), second = new scopes.NavigationScope();
      const readFirst = () => client.readDuoAnchor(graph, duo), readDuo = () => client.readDuoAnchor(graph, { ...duo, anchor: { x: 10, z: 0 } });
      assert.throws(() => first.run(readFirst), scopes.NavigationPending);
      const pendingApproach = sent.shift();
      now = 50; assert.throws(() => second.run(readDuo), scopes.NavigationPending);
      assert.equal(sent.length, 0, 'The duo request waits behind the running geometric query');
      now = 70; answer(pendingApproach, 20, duo.anchor);
      const pendingDuo = sent.shift();
      now = 90; answer(pendingDuo, 5, duo.anchor);
      now = 95; assert.deepEqual(first.run(readFirst), duo.anchor);
      now = 100; assert.deepEqual(second.run(readDuo), duo.anchor);
      const completed = journal.find(entry => entry.action === 'nav_job_completed' && entry.data.jobId === pendingApproach.id);
      assert.equal(completed.data.graphId, graph.id);
      assert.equal(completed.data.workerMs, 20);
      assert(journal.some(entry => entry.action === 'nav_job_consumed' && entry.data.jobId === pendingApproach.id));
      const timing = (workerMs, deliveryMs, resumeMs, maxTotalMs, queueMs = 0) => ({ completed: 1, consumed: 1, queueMs, workerMs, localMs: 0, deliveryMs, resumeMs, maxTotalMs });
      assert.deepEqual(client.pathfindingStats.timings.build, timing(7, 13, 12, 32));
      assert.deepEqual(client.pathfindingStats.timings.duo, { completed: 2, consumed: 2, queueMs: 20, workerMs: 25, localMs: 0, deliveryMs: 23, resumeMs: 35, maxTotalMs: 53 });
      assert.deepEqual(client.findPath(graph, { x: 0, z: 0 }, { x: 30, z: 0 }), [{ x: 30, z: 0 }]);
      assert.equal(sent.length, 0, 'A route on the prepared network must not wait for the worker');
      assert.equal(client.pathfindingStats.timings.path.completed, 1);
      const error = Object.assign(new Error('invalid funnel'), { cause: { start: { x: 1, z: 2 } } });
      assert.throws(() => client.findPath({ ...graph, find() { throw error; } }, { x: 0, z: 0 }, { x: 30, z: 0 }), caught => caught === error);
      assert.equal(journal.at(-1).action, 'nav_path_error'); assert.equal(journal.at(-1).data.error, error);
      preparation.cancel();
    } finally { globalThis.performance = previousClock; if (previousWorker === undefined) delete globalThis.Worker; else globalThis.Worker = previousWorker; }
  });

  it('conserve les lecteurs actifs et calcule trajets et accessibilités sans aller-retour', () => {
    const previous = globalThis.Worker, sent = [];
    let worker;
    globalThis.Worker = class { constructor() { worker = this; } postMessage(message) { sent.push(message); } };
    try {
      const client = clientModule(), preparation = client.prepareNavigationGraph(definition), release = preparation.retain();
      const build = sent.shift();
      worker.onmessage({ data: { id: build.id, graphId: build.graphId, ok: true, milliseconds: 0, result: snapshot() } });
      const graph = preparation.read(), scope = new scopes.NavigationScope();
      const operation = () => client.readDuoAnchor(graph, duo);
      assert.throws(() => scope.run(operation), scopes.NavigationPending);
      const pending = sent.shift();
      preparation.cancel();
      assert.equal(sent.length, 0, 'Cache replacement must not cancel an active reader');
      worker.onmessage({ data: { id: pending.id, graphId: pending.graphId, ok: true, milliseconds: 0, result: duo.anchor } });
      assert.deepEqual(scope.run(operation), duo.anchor);
      assert(graph.canReach({ x: 0, z: 0 }, { x: 20, z: 0 }));
      assert.deepEqual(graph.findReachable({ x: 0, z: 0 }, [{ x: 500, z: 0 }, { x: 20, z: 0 }]), { x: 20, z: 0 });
      assert(client.findPath(graph, { x: -80, z: 0 }, { x: 80, z: 0 }));
      assert.equal(sent.length, 0, 'Movement and availability use the persistent local network');
      assert.deepEqual(client.readObjectApproach(graph, approach), [approach.goal]);
      assert.equal(sent.length, 0, 'An accessible free slot is also resolved immediately');
      release(); assert.deepEqual(sent, [{ release: graph.id }]);
      preparation.cancel(); assert.equal(sent.length, 1);
      assert.throws(() => preparation.retain(), /released navigation graph/);
    } finally { if (previous === undefined) delete globalThis.Worker; else globalThis.Worker = previous; }
  });

  it('transfère un réseau réutilisable avec les mêmes collisions et les mêmes chemins', () => withWorker(send => {
    const fixture = { ...definition, solids: [{ polygon: geometry.rectangle(0, 0, 40, 80), radius: 4, comfort: true }], comfortDistance: 15 };
    const reference = queries.buildNavigationGraph(fixture), built = send({ graphId: 1, definition: fixture, query: { kind: 'build' } });
    assert(built.ok);
    const restored = meshModule.NavigationMesh.restore(structuredClone(built.result));
    assert.deepEqual(restored.obstacles, reference.obstacles);
    for (const start of [{ x: -80, z: 0 }, { x: 0, z: 0 }]) {
      const target = { x: 80, z: 0 };
      assert.equal(restored.canReach(start, target), reference.canReach(start, target));
      assert.deepEqual(restored.find(start, target), reference.find(start, target));
    }
  }));

  it('libère explicitement les réseaux et signale les coordonnées invalides', () => withWorker(send => {
    for (const graphId of [1, 2]) assert(send({ graphId, definition, query: { kind: 'build' } }).ok);
    assert.equal(send({ release: 1 }), undefined);
    const released = send({ graphId: 1, query: { kind: 'duo', duo } });
    assert(!released.ok); assert.match(released.error, /unknown graph/);
    assert(send({ graphId: 2, query: { kind: 'duo', duo } }).ok);
    const invalid = send({ graphId: 2, query: { kind: 'duo', duo: { ...duo, anchor: { x: NaN, z: 0 } } } });
    assert(!invalid.ok); assert.match(invalid.error, /Non-finite/);
  }));

  it('sélectionne une approche hors du meuble avec la contrainte de façade', () => withWorker(send => {
    const obstacle = geometry.rectangle(0, 0, 40, 40), fixture = { ...definition, solids: [{ polygon: obstacle, radius: 4, comfort: false }] };
    const built = send({ graphId: 1, definition: fixture, query: { kind: 'build' } });
    const restored = meshModule.NavigationMesh.restore(built.result);
    const candidates = queries.objectApproachCandidates({ ...approach, owned: [{ polygon: obstacle, radius: 4 }], start: { x: 0, z: -80 },
      region: { x: 0, z: 0, rotation: 0, width: 40 } }, restored);
    assert(candidates.length > 0);
    const point = candidates[0];
    assert(point.z <= 0 && Math.abs(point.x) <= 20);
    assert(!geometry.insideObstacle(point, built.result.obstacles));
    assert(queries.buildNavigationGraph(fixture).canReach(approach.start, point));
  }));
});
