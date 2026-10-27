const fs = require('node:fs');
if (process.argv[2] === '--browser') {
  const fixture = { ...require('../tests/fixtures/cases.cjs').navigation[0], id: 'navmesh-seven', count: 7, reproduction: 'node scripts/temp_navmesh_audit.cjs --browser' };
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
