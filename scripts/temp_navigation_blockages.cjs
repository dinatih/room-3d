const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/features/scene/ai/navigation/doorRequests.ts', 'utf8');
const navigationExports = {};
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: navigationExports });
const { requestDoor, releaseDoor, releaseAgentDoors, doorRequested } = navigationExports;
// Opposing walkers must both be able to approach an open passage. Their bodies
// are handled by avoidance, rather than an exclusive lock held behind a walker.
assert.equal(requestDoor('bath', 'sara'), true);
assert.equal(requestDoor('bath', 'delphina'), true);
releaseDoor('bath', 'sara');
assert.equal(doorRequested('bath'), true);
releaseAgentDoors('delphina');
assert.equal(doorRequested('bath'), false);
// A close interaction waits for ALL existing walkers and prevents later walkers
// from overtaking it, including requests through the other glass leaf.
assert.equal(requestDoor('glassLeft', 'walker-a'), true);
assert.equal(requestDoor('glassRight', 'walker-b'), true);
assert.equal(requestDoor('glassLeft', 'interaction', 'closed'), false);
assert.equal(requestDoor('glassRight', 'walker-c'), false);
releaseAgentDoors('walker-a');
assert.equal(requestDoor('glassLeft', 'interaction', 'closed'), false);
releaseAgentDoors('walker-b');
assert.equal(requestDoor('glassLeft', 'interaction', 'closed'), true);
assert.equal(doorRequested('glassRight'), false);
assert.equal(requestDoor('glassRight', 'walker-c'), false);
releaseAgentDoors('interaction');
assert.equal(requestDoor('glassRight', 'walker-c'), true);
assert.equal(doorRequested('glassLeft'), true);
releaseAgentDoors('walker-c');
console.log('Passage partagé, fermeture exclusive et équité de la file : OK');

const path = require('node:path');
const modules = new Map();
function loadTs(filename) {
  filename = path.resolve(filename);
  if (modules.has(filename)) return modules.get(filename).exports;
  const loaded = { exports: {} };
  modules.set(filename, loaded);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, {
    exports: loaded.exports, module: loaded,
    require: name => name.startsWith('.') ? loadTs(path.resolve(path.dirname(filename), `${name}.ts`)) : require(name),
  }, { filename });
  return loaded.exports;
}
const geometry = loadTs('src/features/scene/ai/navigation/geometry.ts');
const { architectureObstacles } = loadTs('src/features/scene/ai/navigation/architecture.ts');
const { findDuoAnchor } = loadTs('src/features/scene/ai/navigation/duoPlacement.ts');
const { computeWorldTransform } = loadTs('src/features/scene/animations/duoWorldTransform.ts');
// The reported stop is inside the clearance of the neighboring garden fence.
const fences = architectureObstacles.filter(o => o.id === '1:fence-4' || o.id === '1:fence-5');
assert.equal(fences.length, 2);
const graph = new geometry.VisibilityGraph(geometry.union(fences.map(o => geometry.inflate(o.polygon, 13.3))));
const stranded = { x: -16.1, z: -175.2 };
assert.equal(geometry.insideObstacle(stranded, graph.obstacles), true);
const anchor = [-100, 0, -200];
const playlist = [
  { offsetB: [-54.3, 0, -51.5] },
  { offsetB: [83.9, 0, 24.8] },
];
const safe = findDuoAnchor(anchor, 0, playlist, graph, graph);
assert.ok(safe, 'A safe shared anchor must exist');
assert.deepEqual(anchor, [-100, 0, -200], 'The registry anchor must not be mutated');
assert.notEqual(safe[0], anchor[0]);
for (const def of playlist) {
  const { posA, posB } = computeWorldTransform(safe, 0, def.offsetB);
  for (const p of [posA, posB]) {
    assert.equal(geometry.insideObstacle({ x: p[0], z: p[2] }, graph.obstacles), false);
    assert.ok(graph.find({ x: p[0], z: p[2] }, { x: -154.3, z: -251.5 }), 'Each participant must be able to leave');
  }
}
console.log('Régression clôtures voisines : ancre commune praticable pour toute la playlist, sortie possible : OK', safe);
