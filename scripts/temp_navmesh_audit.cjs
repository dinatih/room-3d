const fs = require('node:fs');
if (process.argv[2] === '--trace') {
  const file = process.argv[3], buffer = fs.readFileSync(file);
  const trace = JSON.parse(file.endsWith('.gz') ? require('node:zlib').gunzipSync(buffer) : buffer);
  const profiles = new Map(), threads = new Map();
  for (const e of trace.traceEvents) {
    const thread = `${e.pid}:${e.tid}`;
    if (e.name === 'thread_name') threads.set(thread, e.args.name);
    if (e.name !== 'ProfileChunk') continue;
    const key = `${thread}:${e.id}`, d = e.args.data;
    let p = profiles.get(key);
    if (!p) { p = { thread, nodes: new Map(), parents: new Map(), samples: [] }; profiles.set(key, p); }
    for (const n of d.cpuProfile.nodes ?? []) {
      p.nodes.set(n.id, n.callFrame);
      if (n.parent !== undefined) p.parents.set(n.id, n.parent);
      for (const child of n.children ?? []) p.parents.set(child, n.id);
    }
    for (const [i, id] of (d.cpuProfile.samples ?? []).entries()) p.samples.push([id, (d.timeDeltas?.[i] ?? 0) / 1000]);
  }
  const results = [...profiles].map(([key, p]) => {
    const self = new Map(), inclusive = new Map(), groups = { navigation: 0, rendering: 0 };
    for (const [id, ms] of p.samples) {
      self.set(id, (self.get(id) ?? 0) + ms);
      let navigation = false, rendering = false;
      for (let node = id; node !== undefined; node = p.parents.get(node)) {
        inclusive.set(node, (inclusive.get(node) ?? 0) + ms);
        const frame = p.nodes.get(node);
        navigation ||= /features\/scene\/ai\//.test(frame?.url ?? '');
        rendering ||= /WebGLRenderer|renderObject|texSubImage|getProgramInfoLog/.test(frame?.functionName ?? '');
      }
      if (navigation) groups.navigation += ms;
      if (rendering) groups.rendering += ms;
    }
    const top = scores => [...scores].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([id, ms]) => ({ ms, ...p.nodes.get(id) }));
    return { key, thread: threads.get(p.thread), durationMs: p.samples.reduce((sum, s) => sum + s[1], 0), groups, self: top(self), inclusive: top(inclusive) };
  });
  console.log(JSON.stringify(results, null, 2));
  return;
}
if (process.argv[2] === '--benchmark') {
  (async () => {
    const file = process.argv[3], runs = Number(process.argv.find(a => a.startsWith('--runs='))?.split('=')[1] ?? 5);
    if (!file || !Number.isSafeInteger(runs) || runs <= 0) throw Error('Expected log or fixture and positive --runs');
    let fixture;
    if (file.endsWith('.json')) fixture = JSON.parse(fs.readFileSync(file));
    else {
      const definitions = new Map(), worst = new Map(), jobs = [];
      for await (const line of require('node:readline').createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity })) {
        if (!line) continue;
        const { entry: { action, data: d } } = JSON.parse(line);
        if (action === 'nav_graph_created') definitions.set(d.graphId, d.definition);
        if (action !== 'nav_job_completed' || d.kind !== 'build' || !d.ok) continue;
        jobs.push(d);
        const definition = definitions.get(d.graphId);
        if (!definition) continue;
        const kind = definition.solids ? 'static' : 'crowd';
        if (!worst.has(kind) || d.workerMs > worst.get(kind).workerMs) worst.set(kind, { kind, definition, graphId: d.graphId, workerMs: d.workerMs });
      }
      fixture = { source: file, cases: [...worst.values()], recorded: Object.fromEntries(['workerMs', 'queueMs', 'deliveryMs'].map(key => {
        const values = jobs.map(j => j[key]).sort((a, b) => a - b);
        return [key, { median: values[Math.floor(values.length / 2)], max: values.at(-1), sum: values.reduce((a, b) => a + b, 0) }];
      })) };
      fs.writeFileSync('/tmp/room-navigation-benchmark.json', JSON.stringify(fixture));
    }
    require('../tests/support/load-ts.cjs');
    const g = require('../src/features/scene/ai/navigation/geometry.ts'), { NavigationMesh } = require('../src/features/scene/ai/navigation/mesh.ts');
    const results = [];
    for (const item of fixture.cases) {
      const samples = [];
      let snapshot;
      for (let run = 0; run < runs; run++) {
        const d = item.definition, start = performance.now();
        const inflated = d.solids?.map(o => g.inflate(o.polygon, o.radius));
        const comforts = d.comfortDistance === undefined ? undefined : d.solids.filter(o => o.comfort).map(o => g.inflate(o.polygon, o.radius + d.comfortDistance));
        const expanded = performance.now();
        const obstacles = inflated ? g.union(inflated) : g.mergeObstacles(d.obstacles);
        const comfort = comforts && { distance: d.comfortDistance, obstacles: g.union(comforts) };
        const merged = performance.now();
        snapshot = new NavigationMesh(obstacles, d.surfaces, comfort).snapshot();
        samples.push({ inflate: expanded - start, union: merged - expanded, mesh: performance.now() - merged, total: performance.now() - start });
      }
      results.push({ kind: item.kind, graphId: item.graphId, solids: item.definition.solids?.length, obstacleVertices: snapshot.vertices.length, cells: snapshot.cells.length,
        medianMs: Object.fromEntries(Object.keys(samples[0]).map(key => [key, samples.map(s => s[key]).sort((a, b) => a - b)[Math.floor(runs / 2)]])) });
    }
    console.log(JSON.stringify({ source: fixture.source, recorded: fixture.recorded, results }, null, 2));
  })().catch(error => { console.error(error); process.exitCode = 1; });
  return;
}
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
  const count = process.argv.find(arg => arg.startsWith('--count='))?.split('=')[1];
  if (count !== undefined) {
    const maximum = require('../tests/fixtures/cases.cjs').navigation.find(f => f.id === 'autonomous-all').count;
    if (!Number.isSafeInteger(Number(count)) || Number(count) < 0 || Number(count) > maximum) throw Error(`Invalid count: ${count}`);
    fixture.count = Number(count);
  }
  if (process.argv.includes('--characters-only')) fixture.query = { ...fixture.query, debug: 'characters-only' };
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
