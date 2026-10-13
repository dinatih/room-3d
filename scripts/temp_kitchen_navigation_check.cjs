const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const { getRoomFromCoords, buildNavigationWaypoints } = require('../src/features/scene/ai/navigationGraph.ts');
const { KITCHEN_WEST_WALL, KITCHEN_EAST_WALL, KITCHEN_SOUTH_WALL, BATH_NORTH_WALL, ROOM_SOUTH_WALL } = require('../src/features/scene/wallData.ts');

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
  'bathroom-entry', 'corridor-bathroom-door', 'living-corridor-door', undefined,
]);
assert.deepEqual(waypointIds(cookingRoot, { x: 200, z: 200 }), []);
console.log('Kitchen navigation checks passed: cooking root, architectural bounds, bathroom doors in both directions.');
