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

async function checkConcurrentAnimationLoads() {
  const source = fs.readFileSync('src/features/scene/character/useCharacterAnimations.ts', 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loads = new Map();
  class Loader {
    setDRACOLoader() {}
    register() {}
    load(path, resolve, progress, reject) {
      assert(!loads.has(path), `Duplicate concurrent decode: ${path}`);
      loads.set(path, { resolve, reject });
    }
  }
  const dependencies = {
    react: {}, three: { LoadingManager: class {} },
    'three/examples/jsm/loaders/GLTFLoader.js': { GLTFLoader: Loader },
    'three/examples/jsm/loaders/DRACOLoader.js': { DRACOLoader: class { setDecoderPath() {} } },
    '../retargeting/index': {}, '../retargeting/groundInterxClip': {},
    '../animations/animationResolver': {},
    './animationSource': { animationSourcePlugin: () => ({}), extractAnimationSource: value => value },
  };
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', compiled)(mod.exports, mod, name => {
    assert(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  });
  const paths = Array.from({ length: 15 }, (_, i) => `animation-${i}.glb`);
  const first = paths.map(path => mod.exports.cacheDynamicGLTF(path));
  // Fifteen characters repeat the same requests before any decode completes.
  for (let actor = 0; actor < 15; actor++) {
    paths.forEach((path, i) => assert.equal(mod.exports.cacheDynamicGLTF(path), first[i]));
  }
  assert.equal(loads.size, 15);
  paths.forEach(path => loads.get(path).resolve({ scene: {}, animations: [] }));
  await Promise.all(first);
  assert.equal(mod.exports.cacheDynamicGLTF(paths[14]), first[14]);
  console.log('15 simultaneous animation sources × 15 actors: exactly 15 decodes, completed cache reused');
}
checkConcurrentAnimationLoads().catch(error => { console.error(error); process.exitCode = 1; });
