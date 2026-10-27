const fs = require('node:fs');
const file = process.argv[2] || '/tmp/room-3d-logs/latest.jsonl';
const rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
const graphs = rows.filter(r => r.entry.action === 'nav_graph_created').map(r => r.entry.data);
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const { inflate, union } = require('../src/features/scene/ai/navigation/geometry.ts');
const { NavigationMesh } = require('../src/features/scene/ai/navigation/mesh.ts');
const meshes = graphs.map(({ graphId, definition }) => {
  const obstacles = definition.obstacles ?? union(definition.solids.map(o => inflate(o.polygon, o.radius)));
  const snapshot = new NavigationMesh(obstacles, definition.surfaces).snapshot();
  return { graphId, triangles: snapshot.cells.length, contourVertices: snapshot.vertices.length, obstacles: obstacles.length };
});
const world = rows.findLast(r => r.entry.action === 'nav_world')?.entry.data;
console.log(JSON.stringify({ file: fs.realpathSync(file), meshes, stats: world?.jobs?.stats }, null, 2));
