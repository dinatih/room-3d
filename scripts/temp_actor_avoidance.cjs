const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, file);
const g = require('../src/features/scene/ai/navigation/geometry.ts');
const { NavigationMesh } = require('../src/features/scene/ai/navigation/mesh.ts');
const scope = require('../src/features/scene/ai/navigation/navigationScope.ts');
function load(file, deps) {
  const exports = {};
  new Function('exports', 'require', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(exports, name => { assert(name in deps, name); return deps[name]; });
  return exports;
}
const cameraState = { positions: {} };
const profile = { radius: 13.3, height: 170 };
const obstacles = { getAgentProfile: () => profile, hasAgentProfile: id => id in cameraState.positions, furnitureObstacles: new Map(), getObstacleRevision: () => 0, furnitureClearance: p => p.radius, navigationDebug: new Map(), agentProfileLifecycle: {} };
const avoidance = load('src/features/scene/ai/agent/agentAvoidance.ts', {
  '../../cameraState': { cameraState }, '../../store/useSceneStore': { useSceneStore: { getState: () => ({ layers: { npcCollisions: true } }) } }, '../navigation/obstacles': obstacles, '../navigation/geometry': g,
  '../duoSessionManager': { duoSessionManager: { getSessionFor: () => undefined } },
});
const nav = load('src/features/scene/ai/navigation/service.ts', {
  '../../positionState': { positionState: {} }, '../../furniturePositions': { movingFurniture: new Set() },
  './architecture': { architectureObstacles: [], walkableSurfaces: [[g.rectangle(0, 0, 1000, 1000)]] }, './obstacles': obstacles, './geometry': g,
  '../../doorObstacles': { DOOR_CONFIGS: {}, glassShutterState: { clearHeight: 1000 } },
  './doorRequests': { releaseAgentDoors() {}, doorOpeningKey: key => key }, '../agent/agentAvoidance': avoidance,
  './comfort': { NAVIGATION_COMFORT_CM: 0 }, './navigationScope': scope,
  '../occupancyManager': { LIMITED_ROOMS: [] },
  './pathfindingClient': {
    prepareNavigationGraph(definition) {
      const graph = new NavigationMesh(g.mergeObstacles(definition.obstacles ?? definition.solids.map(s => [g.inflate(s.polygon, s.radius)])), definition.surfaces);
      return { read: () => graph, retain: () => () => {}, cancel() {} };
    },
    findPath: (graph, start, target) => graph.find(start, target),
  },
});
function walk(start, other, target) {
  cameraState.positions = { a: { ...start, y: 0 }, b: { ...other, y: 0 } };
  const route = nav.createRouteState();
  let position = start;
  for (let frame = 0; frame < 600 && g.distance(position, target) > g.GEOMETRY_EPSILON; frame++) {
    position = nav.followRoute(route, 'a', position, target, 1, (dir, remaining) => {
      const s = avoidance.computeSteeringVector('a', position.x, position.z, dir.x, dir.z, remaining);
      return { x: s.steerX, z: s.steerZ };
    });
    Object.assign(cameraState.positions.a, position);
  }
  assert(g.distance(position, target) < g.GEOMETRY_EPSILON, `Blocked at ${JSON.stringify(position)}: ${route.waitReason}`);
}
walk({ x: -60, z: 0 }, { x: 0, z: 0 }, { x: 60, z: 0 });
console.log('Stationary actor detour passed');
walk({ x: -10, z: 0 }, { x: 0, z: 0 }, { x: 60, z: 0 });
console.log('Overlapping actor escape passed');
walk({ x: 0, z: 0 }, { x: 0, z: 0 }, { x: 60, z: 0 });
console.log('Coincident actor escape passed');
cameraState.positions = { a: { x: -60, z: 0, y: 0 }, b: { x: 60, z: 0, y: 0 } };
const routes = { a: nav.createRouteState(), b: nav.createRouteState() };
const targets = { a: { x: 100, z: 0 }, b: { x: -100, z: 0 } };
for (let frame = 0; frame < 600; frame++) {
  for (const id of ['a', 'b']) {
    const p = cameraState.positions[id];
    const next = nav.followRoute(routes[id], id, p, targets[id], 1, (dir, remaining) => {
      const s = avoidance.computeSteeringVector(id, p.x, p.z, dir.x, dir.z, remaining);
      return { x: s.steerX, z: s.steerZ };
    });
    Object.assign(p, next);
  }
  assert(g.distance(cameraState.positions.a, cameraState.positions.b) >= 20 - g.GEOMETRY_EPSILON, 'Actors penetrated their avoidance radii');
}
for (const id of ['a', 'b']) assert(g.distance(cameraState.positions[id], targets[id]) < g.GEOMETRY_EPSILON, `${id} stuck head-on`);
console.log('Head-on crossing without penetration passed');
cameraState.positions = { a: { x: -5, z: 0, y: 0 }, b: { x: 5, z: 0, y: 0 } };
const overlapRoutes = { a: nav.createRouteState(), b: nav.createRouteState() };
for (let frame = 0; frame < 600; frame++) {
  for (const id of ['a', 'b']) {
    const p = cameraState.positions[id];
    const next = nav.followRoute(overlapRoutes[id], id, p, targets[id], 1);
    Object.assign(p, next);
  }
}
for (const id of ['a', 'b']) assert(g.distance(cameraState.positions[id], targets[id]) < g.GEOMETRY_EPSILON, `${id} stuck after overlap`);
console.log('Two overlapping moving actors escape passed');
