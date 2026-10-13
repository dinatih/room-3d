const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { execFileSync } = require('node:child_process');
const Module = require('node:module');
const path = require('node:path');

require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const { getRoomFromCoords, buildNavigationWaypoints, findRoomPath } = require('../src/features/scene/ai/navigationGraph.ts');
const { WAYPOINTS } = require('../src/features/scene/ai/ZoneNodes.ts');
const { KITCHEN_WEST_WALL, KITCHEN_EAST_WALL, KITCHEN_SOUTH_WALL, BATH_NORTH_WALL, ROOM_SOUTH_WALL, ROOM_EAST_WALL, DiagWall } = require('../src/features/scene/wallData.ts');

const cookingRoot = { x: 80, z: 400 };
const bathroom = { x: 50, z: 550 };
assert.equal(getRoomFromCoords(cookingRoot.x, cookingRoot.z), 'living');
for (const x of [KITCHEN_WEST_WALL, 80, KITCHEN_EAST_WALL]) {
  for (const z of [ROOM_SOUTH_WALL, KITCHEN_SOUTH_WALL]) {
    assert.equal(getRoomFromCoords(x, z), 'living', `Kitchen (${x}, ${z})`);
  }
}
assert.equal(getRoomFromCoords(80, BATH_NORTH_WALL), 'bathroom');
assert.equal(getRoomFromCoords(235, 560), 'corridor');
assert.equal(getRoomFromCoords(25, 650), 'bathroom');
const waypointIds = (from, to) => buildNavigationWaypoints(from, to).map(step => step.targetWaypointId);
assert.deepEqual(waypointIds(cookingRoot, bathroom), [
  'living-corridor-door', 'corridor-entry-door', 'corridor-bathroom-door', 'bathroom-entry',
]);
assert.deepEqual(waypointIds(bathroom, cookingRoot), [
  'bathroom-entry', 'corridor-bathroom-door', 'living-corridor-door', 'living-from-corridor',
]);
assert.deepEqual(waypointIds(cookingRoot, { x: 200, z: 200 }), []);
assert.equal(getRoomFromCoords(ROOM_EAST_WALL, 200), 'living');
for (const x of [80, 240]) {
  const z = DiagWall.A.z + (x - DiagWall.A.x) * DiagWall.slope;
  assert.equal(getRoomFromCoords(x, z - 1), x === 80 ? 'bathroom' : 'corridor');
  assert.equal(getRoomFromCoords(x, z + 1), 'outdoor_corridor');
}
assert.throws(() => getRoomFromCoords(NaN, 0), /Invalid navigation coordinates/);

// Compare every route with the committed version before this refactor.
const filename = path.resolve(__dirname, '../src/features/scene/ai/navigationGraph.ts');
const previous = new Module(filename, module);
previous.filename = filename;
previous.paths = module.paths;
previous._compile(ts.transpileModule(
  execFileSync('git', ['show', '064b3ddd:src/features/scene/ai/navigationGraph.ts'], { encoding: 'utf8', cwd: path.resolve(__dirname, '..') }),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
).outputText, filename);
const positions = {
  living: { x: 160, z: 200 }, corridor: { x: 240, z: 480 }, bathroom,
  garden: { x: 200, z: -50 }, west_neighbor: { x: -200, z: 100 },
  east_neighbor: { x: 450, z: -250 }, outdoor_corridor: { x: 288, z: 603 },
  outdoor_garden: { x: -200, z: -100 },
};
const resolve = instruction => {
  if (!instruction.targetWaypointId) return instruction;
  const wp = WAYPOINTS[instruction.targetWaypointId];
  assert.ok(wp, `Unknown waypoint ${instruction.targetWaypointId}`);
  return { type: instruction.type, targetPos: [wp.x, wp.y ?? 0, wp.z] };
};
for (const [from, start] of Object.entries(positions)) {
  assert.equal(getRoomFromCoords(start.x, start.z), from);
  for (const [to, target] of Object.entries(positions)) {
    assert.deepEqual(findRoomPath(from, to), previous.exports.findRoomPath(from, to));
    assert.deepEqual(
      buildNavigationWaypoints(start, target).map(resolve),
      previous.exports.buildNavigationWaypoints(start, target).map(resolve),
      `Route ${from} -> ${to}`,
    );
  }
}
const mutableRoute = buildNavigationWaypoints(cookingRoot, bathroom);
mutableRoute[0].animation = 'idle';
assert.equal(buildNavigationWaypoints(cookingRoot, bathroom)[0].animation, undefined);
console.log('Navigation checks passed: kitchen, walls, all 64 routes preserved, independent instructions.');
