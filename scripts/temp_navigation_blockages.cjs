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
