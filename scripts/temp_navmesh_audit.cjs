const fs = require('node:fs');
if (process.argv[2] === '--door') {
  const { load } = require('../tests/support/load-ts.cjs');
  const g = require('../src/features/scene/ai/navigation/geometry.ts');
  const obstacles = require('../src/features/scene/ai/navigation/obstacles.ts');
  const rows = fs.readFileSync(process.argv[3] || '/tmp/room-3d-logs/latest.jsonl', 'utf8').trim().split('\n').map(JSON.parse);
  const world = rows.findLast(row => row.entry.action === 'nav_world').entry.data;
  const doors = load('src/features/scene/doorObstacles.ts', {
    './cameraState': { cameraState: { positions: {} } }, './ai/navigation/obstacles': obstacles,
    './ai/navigation/geometry': g, './ai/navigation/doorRequests': require('../src/features/scene/ai/navigation/doorRequests.ts'),
    './wallData': require('../src/features/scene/wallData.ts'),
  });
  const door = world.doors.find(d => d.key === 'living').config;
  const contacts = world.furniture.filter(o => o.yMax >= door.yMin && o.yMin <= door.yMax)
    .map(o => ({ ...o, contact: doors.getDoorContactAngle(door, o.polygon) })).filter(o => o.contact !== null).sort((a, b) => a.contact - b.contact);
  console.log(JSON.stringify({ door, contacts, protections: world.doorRequests.protections }, null, 2));
  return;
}
if (process.argv[2] === '--characters') {
  require('../tests/support/load-ts.cjs');
  const { CHARACTERS } = require('../src/features/scene/characterConfig.ts');
  console.log(JSON.stringify({ count: CHARACTERS.length, ids: CHARACTERS.map(c => c.id) }));
  return;
}
if (process.argv[2] === '--browser') {
  const fixture = { ...require('../tests/fixtures/cases.cjs').navigation[0], id: 'navmesh-seven', count: 7, captureFreezeStack: process.argv.includes('--capture-freeze'), reproduction: 'node scripts/temp_navmesh_audit.cjs --browser' };
  process.env.ROOM_TEST_RESULTS = '/tmp/room-navmesh-browser';
  fs.mkdirSync(process.env.ROOM_TEST_RESULTS, { recursive: true });
  require('../tests/support/browser.cjs').withBrowser(fixture, async (page, result) => {
    result.measurements = await page.evaluate(async fixture => {
      const { autonomous } = await import('/tests/support/apartment.mjs');
      return autonomous(fixture);
    }, fixture);
  }).then(result => console.log(JSON.stringify({ status: result.status, errors: result.errors, measurements: result.measurements })))
    .catch(error => { console.error(error); process.exitCode = 1; });
  return;
}
const file = process.argv[2] || '/tmp/room-3d-logs/latest.jsonl';
const rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
const graphs = rows.filter(r => r.entry.action === 'nav_graph_created').map(r => r.entry.data);
require('../tests/support/load-ts.cjs');
const { mergeObstacles } = require('../src/features/scene/ai/navigation/geometry.ts');
const { NavigationMesh } = require('../src/features/scene/ai/navigation/mesh.ts');
const { buildNavigationGraph } = require('../src/features/scene/ai/navigation/queries.ts');
const meshes = graphs.map(({ graphId, definition }) => {
  try {
    const mesh = definition.solids ? buildNavigationGraph(definition) : new NavigationMesh(mergeObstacles(definition.obstacles), definition.surfaces);
    const snapshot = mesh.snapshot();
    return { graphId, cells: snapshot.cells.length, contourVertices: snapshot.vertices.length, obstacles: mesh.obstacles.length };
  } catch (error) {
    fs.writeFileSync('/tmp/navigation-failing-definition.json', JSON.stringify(definition));
    throw new Error(`Graph ${graphId}: ${error.message}`, { cause: error });
  }
});
const world = rows.findLast(r => r.entry.action === 'nav_world')?.entry.data;
console.log(JSON.stringify({ file: fs.realpathSync(file), meshes, stats: world?.jobs?.stats }, null, 2));
