const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
const geometry = require('../src/features/scene/ai/navigation/geometry.ts');
const profile = { radius: 13.3, height: 180 };
const cameraState = { positions: { walker: { x: -30, y: 0, z: 10 }, resting: { x: 0, y: 0, z: 0 } } };
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/features/scene/ai/agent/agentAvoidance.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, {
  exports: exportsObject,
  require(name) {
    if (name === '../../cameraState') return { cameraState };
    if (name === '../../store/useSceneStore') return { useSceneStore: { getState: () => ({ layers: { npcCollisions: true } }) } };
    if (name === '../navigation/obstacles') return { getAgentProfile: () => profile, hasAgentProfile: () => true };
    if (name === '../navigation/geometry') return geometry;
    if (name === '../duoSessionManager') return { duoSessionManager: { getSessionFor: () => undefined } };
    throw new Error(`Unexpected dependency: ${name}`);
  },
});
const a = exportsObject;
const start = { x: -30, z: 10 }, target = { x: 30, z: 10 };
assert.ok(geometry.insideObstacle({ x: 0, z: 10 }, [[geometry.inflate([{ x: 0, z: 0 }], profile.radius)]]), 'This passage was blocked by the previous actor footprint');
assert.deepEqual(a.limitAgentMovement('walker', start, target), target, 'Partial body overlap must permit crossing beside a resting actor');
assert.equal(a.isAgentDestinationFree('walker', { x: 0, z: 10 }), true);
assert.ok(geometry.segmentFree(start, target, a.getAgentObstacles('walker', start).map(p => [p])), 'Planner and movement must agree on the freed passage');
assert.equal(a.isAgentDestinationFree('walker', { x: 0, z: 0 }), true, 'Zero clearance must permit coincident actor centers');
const contact = a.limitAgentMovement('walker', { x: -30, z: 0 }, { x: 30, z: 0 });
assert.equal(contact.x, 30, 'Zero clearance must permit crossing the actor center');
assert.equal(a.getAgentObstacles('walker', start).length, 0, 'Zero-radius footprints must not generate detour obstacles');
const steering = a.computeSteeringVector('walker', -1, 0, 1, 0, 30);
assert.ok(steering.steerX > 0, 'A close actor must never cancel forward progress');
assert.ok(steering.steerZ > 0, 'An actor ahead must cause a sidestep when space permits');
// Independently exercise the geometry fallback used by followRoute: a narrow
// passage rejects the preferred sidestep while the straight step remains safe.
const narrowWalls = [[geometry.rectangle(0, 6, 100, 10)], [geometry.rectangle(0, -6, 100, 10)]];
const from = { x: -1, z: 0 };
const sidestep = { x: from.x + steering.steerX * 2, z: steering.steerZ * 2 };
assert.equal(geometry.segmentFree(from, sidestep, narrowWalls), false);
const straight = { x: 1, z: 0 };
assert.equal(geometry.segmentFree(from, straight, narrowWalls), true);
assert.deepEqual(a.limitAgentMovement('walker', from, straight), straight, 'An unavailable sidestep must allow forcing through the actor');
// Multiple actors can add lateral influence, but cannot stop forward movement.
cameraState.positions.second = { x: 1, y: 0, z: 0 };
const crowdSteering = a.computeSteeringVector('walker', -1, 0, 1, 0, 30);
assert.ok(crowdSteering.steerX > 0);
delete cameraState.positions.second;
assert.equal(a.actorBlocksUnchanged(new Map([['resting', 'old-state']])), false, 'Old actor failures must be invalidated');
a.reserveAgentDestination('resting', { x: 50, z: 0 });
assert.equal(a.isAgentDestinationFree('walker', { x: 50, z: 10 }), true);
assert.equal(a.isAgentDestinationFree('walker', { x: 50, z: 0 }), true);
const walls = [[geometry.rectangle(0, 0, 10, 100)]];
assert.equal(geometry.segmentFree({ x: -30, z: 10 }, target, walls), false, 'Walls continue to block the same crossing');
console.log('PASS: soft sidesteps, forward progress in crowds, forced narrow passage, shared destinations and solid walls');
