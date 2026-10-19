const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/features/scene/ai/navigation/doorRequests.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const mod = { exports: {} };
new Function('exports', 'module', compiled)(mod.exports, mod);
const { requestDoor, releaseDoor, releaseAgentDoors, doorRequested, protectDoor, getDoorProtections } = mod.exports;
const body = { x:40,z:50,y:0,radius:13.3,height:170 };
protectDoor('living','a',body);
requestDoor('living','b');requestDoor('living','c');
assert(doorRequested('living'));assert.equal([...getDoorProtections('living')].length,1);
releaseDoor('living','b');assert(doorRequested('living'));
releaseAgentDoors('c');assert(!doorRequested('living'));
releaseAgentDoors('a');assert.equal([...getDoorProtections('living')].length,0);
protectDoor('glassLeft','a',body);requestDoor('glassRight','b');
assert(doorRequested('glassLeft'));assert.equal([...getDoorProtections('glassRight')].length,1);
releaseAgentDoors('a');assert(doorRequested('glassRight'));
releaseAgentDoors('b');assert(!doorRequested('glassLeft'));
console.log('Door requests: shared passages coexist with protected interaction footprints');

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
assert.deepEqual(steering, { steerX: 1, steerZ: 0 }, 'Zero clearance must also disable lateral steering');
console.log('Zero actor clearance: movement, destinations, detours and steering consistently disabled');

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

// A neighbour standing at a waypoint must not turn a zero-clearance arrival
// into an endless spiral. Reproduce the open-space movement integration.
positions.a = { x: 0, y: 0, z: 0 };
positions.b = { x: 50, y: 0, z: 0 };
let arrival = { x: 0, z: 0 };
const waypoint = { x: 50, z: 0 };
for (let frame = 0; frame < 1000; frame++) {
  const remaining = Math.hypot(waypoint.x - arrival.x, waypoint.z - arrival.z);
  if (remaining === 0) break;
  const direction = avoidance.computeSteeringVector('a', arrival.x, arrival.z,
    (waypoint.x - arrival.x) / remaining, (waypoint.z - arrival.z) / remaining, remaining);
  const step = Math.min(3, remaining);
  arrival = { x: arrival.x + direction.steerX * step, z: arrival.z + direction.steerZ * step };
}
assert(Math.hypot(waypoint.x - arrival.x, waypoint.z - arrival.z) < 1e-6,
  `Open-space arrival spirals around its occupied waypoint: ${JSON.stringify(arrival)}`);
console.log('Open-space arrival at an occupied waypoint converges with zero actor clearance');
