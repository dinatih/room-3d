const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/features/scene/ai/navigation/doorRequests.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const mod = { exports: {} };
new Function('exports', 'module', compiled)(mod.exports, mod);
const { requestDoor, releaseDoor, releaseAgentDoors, doorRequested } = mod.exports;
assert(requestDoor('living', 'a'));
assert(requestDoor('living', 'b'));
assert(!requestDoor('living', 'a', 'closed'));
assert(doorRequested('living'));
assert(requestDoor('living', 'b'));
assert(!requestDoor('living', 'c'));
releaseDoor('living', 'b');
assert(requestDoor('living', 'a', 'closed'));
assert(!doorRequested('living'));
releaseDoor('living', 'a');
assert(requestDoor('living', 'c'));
releaseAgentDoors('c');
assert(requestDoor('living', 'a'));
assert(requestDoor('bath', 'b'));
assert(!requestDoor('living', 'b', 'closed'));
releaseAgentDoors('b', 'living');
assert(requestDoor('bath', 'a'));
releaseAgentDoors('a');
assert(requestDoor('living', 'b', 'closed'));
releaseAgentDoors('b');
assert(requestDoor('glassLeft', 'a', 'closed'));
assert(!requestDoor('glassRight', 'b'));
releaseAgentDoors('a');
assert(requestDoor('glassRight', 'b'));
releaseAgentDoors('b');
console.log('Door reservations: all regression checks passed');

const avoidanceSource = fs.readFileSync('src/features/scene/ai/agent/agentAvoidance.ts', 'utf8');
const avoidanceCode = ts.transpileModule(avoidanceSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const avoidanceModule = { exports: {} };
const positions = { a: { x: 0, y: 0, z: 0 }, b: { x: 1, y: 0, z: 0 } };
const dependencies = {
  '../../cameraState': { cameraState: { positions } },
  '../../store/useSceneStore': { useSceneStore: { getState: () => ({ layers: { npcCollisions: true } }) } },
  '../navigation/obstacles': {
    getAgentProfile: () => ({ radius: 13.3, height: 170 }), hasAgentProfile: () => true,
  },
  '../navigation/geometry': {},
  '../duoSessionManager': { duoSessionManager: { getSessionFor: () => undefined } },
};
new Function('exports', 'module', 'require', avoidanceCode)(
  avoidanceModule.exports, avoidanceModule, name => {
    assert(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  },
);
const avoidance = avoidanceModule.exports;
const start = { x: 0, z: 0 }, goal = { x: 2, z: 0 };
avoidance.reserveAgentDestination('b', goal);
assert.equal(avoidance.actorClearance({ radius: 13.3 }, { radius: 13.3 }), 0);
assert.equal(avoidance.isAgentDestinationFree('a', goal), true);
assert.equal(avoidance.limitAgentMovement('a', start, goal), goal);
assert.deepEqual(avoidance.getAgentObstacles('a', start), []);
assert.equal(avoidance.actorBlocksUnchanged(new Map([['b', 'old']])), false);
const steering = avoidance.computeSteeringVector('a', 0, 0, 1, 0, 2);
assert(steering.steerX > 0, 'Soft steering must preserve forward progress');
assert.notEqual(steering.steerZ, 0, 'Soft steering remains active');
console.log('Zero actor clearance: movement, destinations, detours and soft steering passed');
