const fs = require('node:fs');
if (process.argv[2] === '--actor') {
  (async () => {
    let previous;
    for await (const line of require('node:readline').createInterface({ input: fs.createReadStream(process.argv[3] || '/tmp/room-3d-logs/latest.jsonl'), crlfDelay: Infinity })) {
      if (!line) continue;
      const row = JSON.parse(line), { tag, action, data: d } = row.entry;
      if (tag !== (process.argv[4] || 'sara')) continue;
      if (action === 'nav_agent_snapshot') {
        const signature = JSON.stringify([d.state.x, d.state.z, d.status, d.state.animation]);
        if (signature === previous) continue;
        previous = signature;
        console.log(JSON.stringify({ at: row.elapsedMs, action, state: d.state, status: d.status, manual: d.manualOverride, instruction: d.instruction, route: d.route }));
      } else if (action === 'nav_instruction' || action === 'nav_stop') console.log(JSON.stringify({ at: row.elapsedMs, action, ...d }));
    }
  })().catch(error => { console.error(error); process.exitCode = 1; });
  return;
}
if (process.argv[2] === '--invalid') {
  (async () => {
    require('../tests/support/load-ts.cjs');
    const g = require('../src/features/scene/ai/navigation/geometry.ts');
    const geometries = new Map();
    let world;
    for await (const line of require('node:readline').createInterface({ input: fs.createReadStream(process.argv[3] || '/tmp/room-3d-logs/latest.jsonl'), crlfDelay: Infinity })) {
      if (!line) continue;
      const row = JSON.parse(line), { action, data: d } = row.entry;
      if (action === 'nav_world') world = d;
      if (action === 'nav_graph_geometry') geometries.set(`${d.epoch}:${d.graphId}`, d);
      if (action !== 'nav_path' || d.startAccessible) continue;
      const geometry = geometries.get(`${d.epoch}:${d.graphId}`);
      if (!geometry) continue;
      const blockers = geometry.definition.solids.flatMap((solid, i) => g.pointInRing(d.start, g.inflate(solid.polygon, solid.radius))
        ? [{ ...solid, source: geometry.sources[i] || world?.doors[i - geometry.sources.length] }] : []);
      fs.writeFileSync('/tmp/navigation-invalid-start.json', JSON.stringify({ ...d, geometry, world }));
      console.log(JSON.stringify({ path: d, blockers }, null, 2));
      return;
    }
  })().catch(error => { console.error(error); process.exitCode = 1; });
  return;
}
if (process.argv[2] === '--stops') {
  (async () => {
    const file = process.argv[3] || '/tmp/room-3d-logs/latest.jsonl';
    const reasons = {}, open = new Map(), stops = [], invalidStarts = [], pendingBuilds = new Map();
    let world;
    for await (const line of require('node:readline').createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity })) {
      if (!line) continue;
      const row = JSON.parse(line), { action, tag, data: d } = row.entry;
      if (action === 'nav_world') world = d;
      if (action === 'nav_path' && !d.startAccessible) invalidStarts.push({ at: row.elapsedMs, ...d, definition: undefined });
      if (action === 'nav_graph_created') pendingBuilds.set(`${d.epoch}:${d.graphId}`, d.definition.solids ? 'static' : 'crowd');
      if (action !== 'nav_agent_snapshot') continue;
      const navigating = ['MOVING', 'BLOCKED', 'IDLE'].includes(d.status);
      const sad = navigating && d.state.animation === 'sad-idle' && !d.idle;
      const waiting = navigating && !d.idle && d.noProgressMs > 0
        && (d.pendingJob || d.navigationError || d.route.waitReason || d.route.error);
      if (sad || waiting) {
        const reason = d.pendingJob?.description || d.route.waitReason || d.route.error || d.navigationError;
        reasons[reason] = (reasons[reason] || 0) + 1;
        let stop = open.get(tag);
        if (!stop) { stop = { actor: tag, at: row.elapsedMs, durationMs: 0, reason, position: d.state, instruction: d.instruction, route: { graphId: d.route.graphId, target: d.route.target, next: d.route.next, error: d.route.error, crowd: d.route.crowd && { baseId: d.route.crowd.baseId, graphId: d.route.crowd.graphId, preparing: d.route.crowd.preparing } } }; open.set(tag, stop); stops.push(stop); }
        stop.durationMs = row.elapsedMs - stop.at;
        stop.sadSamples = (stop.sadSamples || 0) + Number(sad);
      } else open.delete(tag);
    }
    console.log(JSON.stringify({ file: fs.realpathSync(file), reasons, graphs: [...pendingBuilds.values()].reduce((a, kind) => ({ ...a, [kind]: (a[kind] || 0) + 1 }), {}), stops: stops.sort((a, b) => b.durationMs - a.durationMs), invalidStarts, stats: world?.jobs.stats }, null, 2));
  })().catch(error => { console.error(error); process.exitCode = 1; });
  return;
}
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
  const door = world.doors.find(d => d.key === (process.argv[4] || 'living')).config;
  const contacts = world.furniture.filter(o => o.yMax >= door.yMin && o.yMin <= door.yMax)
    .map(o => ({ ...o, contact: doors.getDoorContactAngle(door, o.polygon) })).filter(o => o.contact !== null).sort((a, b) => a.contact - b.contact);
  console.log(JSON.stringify({ door, contacts, glassDoor: world.glassDoor, protections: world.doorRequests.protections }, null, 2));
  return;
}
if (process.argv[2] === '--characters') {
  require('../tests/support/load-ts.cjs');
  const { CHARACTERS } = require('../src/features/scene/characterConfig.ts');
  console.log(JSON.stringify({ count: CHARACTERS.length, ids: CHARACTERS.map(c => c.id) }));
  return;
}
if (['--browser', '--browser-crowd'].includes(process.argv[2])) {
  const crowd = process.argv[2] === '--browser-crowd';
  const minutes = Number(process.argv.find(arg => arg.startsWith('--minutes='))?.split('=')[1] ?? 2);
  const seed = Number(process.argv.find(arg => arg.startsWith('--seed='))?.split('=')[1] ?? 20261019);
  const preset = process.argv.find(arg => arg.startsWith('--preset='))?.split('=')[1] ?? 'mid';
  if (!(minutes > 0) || !Number.isFinite(minutes) || !Number.isSafeInteger(seed)) throw Error('Invalid duration or seed');
  if (!['low', 'mid', 'high'].includes(preset)) throw Error('Invalid graphics preset');
  const fixture = { ...require('../tests/fixtures/cases.cjs').navigation.find(fixture => fixture.id === 'autonomous-all'), id: crowd ? 'navmesh-crowd' : 'navmesh-seven',
    seed, preset, ...(crowd ? { sessionMs: minutes * 60000, timeoutMs: (minutes + 1) * 60000, readinessTimeoutMs: (minutes + 1) * 60000 } : { count: 7 }), captureFreezeStack: process.argv.includes('--capture-freeze'), reproduction: `node scripts/temp_navmesh_audit.cjs ${process.argv.slice(2).join(' ')}` };
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
