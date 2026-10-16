const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }, fileName: filename,
}).outputText, filename);
const g = require('../src/features/scene/ai/navigation/geometry.ts');
const { NAVIGATION_COMFORT_CM: margin } = require('../src/features/scene/ai/navigation/comfort.ts');
if (process.argv.includes('--cpu-summary')) {
  const profile = JSON.parse(fs.readFileSync('/tmp/room-comfort.cpuprofile', 'utf8'));
  const nodes = new Map(profile.nodes.map(n => [n.id, n])), totals = new Map();
  profile.samples.forEach((id, i) => { const frame = nodes.get(id).callFrame, key = `${frame.functionName} ${frame.url}:${frame.lineNumber + 1}`; totals.set(key, (totals.get(key) || 0) + profile.timeDeltas[i]); });
  console.log([...totals].sort((a,b) => b[1] - a[1]).slice(0,15).map(([frame,us]) => ({frame,ms:us/1000})));
  return;
}
const make = polygons => new g.VisibilityGraph(g.union(polygons), { distance: margin, obstacles: g.union(polygons.map(p => g.inflate(p, margin))) });
const length = (start, path) => path.reduce((sum, p, i) => sum + g.distance(i ? path[i - 1] : start, p), 0);
const cost = (graph, start, path) => path.reduce((sum, p, i) => sum + graph.segmentCost(i ? path[i - 1] : start, p), 0);
function check(graph, start, target) {
  const path = graph.find(start, target);
  assert.ok(path, 'A physically passable route must remain reachable');
  assert.deepEqual(path.at(-1), target, 'Exact destination must be preserved');
  for (let i = 0; i < path.length; i++) assert.ok(g.segmentFree(i ? path[i - 1] : start, path[i], graph.obstacles), 'Every segment must respect physical collisions');
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
    for (let i = 0; i < nodes.length; i++) if (!visited.has(i) && (current === -1 || best[i] < best[current])) current = i;
    if (current === -1 || !Number.isFinite(best[current]) || current === nodes.length - 1) break;
    visited.add(current);
    for (let i = 0; i < nodes.length; i++) {
      if (visited.has(i) || !g.segmentFree(nodes[current], nodes[i], graph.obstacles)) continue;
      best[i] = Math.min(best[i], best[current] + graph.segmentCost(nodes[current], nodes[i]));
    }
  }
  const result = check(graph, from, to);
  assert.ok(cost(graph, from, result) <= best.at(-1) + g.CLEARANCE_ERROR, 'Lazy A* must match complete weighted Dijkstra');
}
console.log('Comfort checks passed: walls, corners, small/large detours, narrow doors, exact targets, collisions, integral accuracy.');

if (process.argv.includes('--benchmark')) {
  const fixture = JSON.parse(fs.readFileSync('/tmp/room-navigation-benchmark.json', 'utf8'));
  assert.ok(fixture.comfort, 'Capture a fresh scene fixture with --browser --profile first');
  const graphs = { physical: new g.VisibilityGraph(fixture.obstacles), comfort: new g.VisibilityGraph(fixture.obstacles, fixture.comfort) };
  for (const [name, graph] of Object.entries(graphs)) {
    for (const warm of [false, true]) {
      const began = performance.now();
      const results = fixture.queries.map(([from, to]) => {
        const began = performance.now(), path = graph.find(from, to);
        return { ms: +(performance.now() - began).toFixed(2), found: !!path, length: path && +length(from, path).toFixed(2) };
      });
      console.log(JSON.stringify({ name, warm, vertices: graph.vertices.length, totalMs: +(performance.now() - began).toFixed(2), results }));
    }
  }
}
