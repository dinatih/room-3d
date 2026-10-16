// Capture the baseline before running:
// git show 9339258d:src/features/scene/ai/navigation/geometry.ts > /tmp/room-navigation-baseline-geometry.ts
// git show 9339258d:src/features/scene/ai/navigation/service.ts > /tmp/room-navigation-baseline-service.ts
// node --expose-gc scripts/temp_navigation_memory_audit.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const nav = path.join(root, 'src/features/scene/ai/navigation');
if (process.argv.includes('--cpu-summary')) {
  const profile = JSON.parse(fs.readFileSync('/tmp/room-navigation-live.cpuprofile', 'utf8'));
  const nodes = new Map(profile.nodes.map(n => [n.id, n])), parents = new Map(), totals = new Map();
  for (const node of profile.nodes) for (const child of node.children ?? []) parents.set(child, node.id);
  profile.samples.forEach((sample, i) => {
    for (let id = sample; id !== undefined; id = parents.get(id)) {
      const f = nodes.get(id).callFrame;
      if (f.url.includes('/navigation/service.ts') || f.url.includes('/ai/useAgentController.ts')) {
        const name = `${f.functionName} ${f.url}:${f.lineNumber + 1}`;
        totals.set(name, (totals.get(name) || 0) + profile.timeDeltas[i]);
      }
    }
  });
  console.log('Inclusive navigation CPU ms:', [...totals].sort((a,b) => b[1] - a[1]).map(([name,us]) => ({name, ms:us/1000})));
  return;
}
if (process.argv.includes('--inspect-running')) {
  (async () => {
    const endpoint = fs.readFileSync('/tmp/room-navigation-browser-audit.log', 'utf8').match(/DevTools listening on (ws:\/\/\S+)/)?.[1];
    assert.ok(endpoint, 'No running navigation audit found');
    const browser = await require('puppeteer').connect({ browserWSEndpoint: endpoint });
    try {
      const page = (await browser.pages()).at(-1), client = await page.createCDPSession();
      await client.send('Profiler.enable');
      await client.send('Profiler.start');
      await new Promise(resolve => setTimeout(resolve, 10000));
      const { profile } = await client.send('Profiler.stop');
      fs.writeFileSync('/tmp/room-navigation-live.cpuprofile', JSON.stringify(profile));
      const nodes = new Map(profile.nodes.map(n => [n.id, n])), totals = new Map();
      profile.samples.forEach((id, i) => {
        const f = nodes.get(id).callFrame, name = `${f.functionName} ${f.url}:${f.lineNumber + 1}`;
        totals.set(name, (totals.get(name) || 0) + profile.timeDeltas[i]);
      });
      console.log('CPU self time:', [...totals].sort((a,b) => b[1] - a[1]).slice(0, 20).map(([name,us]) => ({ name, ms:us/1000 })));
      console.log('Live controllers:', await page.evaluate(() => [...window.autonomousAgents].map(([id,{agent}]) => ({ id,status:agent.getStatus(),route:window.nav.navigationDebug.get(id) }))));
    } finally { browser.disconnect(); }
  })().catch(error => { console.error(error); process.exitCode = 1; });
  return;
}
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }, fileName: filename,
}).outputText, filename);
const g = require(path.join(nav, 'geometry.ts'));
const registry = require(path.join(nav, 'obstacles.ts'));
const baseline = new Module(path.join(nav, 'geometry.ts'), module);
baseline.filename = path.join(nav, 'geometry.ts');
baseline.paths = module.paths;
baseline._compile(ts.transpileModule(fs.readFileSync('/tmp/room-navigation-baseline-geometry.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, baseline.filename);
if (process.argv.includes('--scene-benchmark')) {
  const fixture = JSON.parse(fs.readFileSync('/tmp/room-navigation-benchmark.json', 'utf8'));
  const results = [];
  for (const [label, implementation] of [['before', baseline.exports], ['after', g]]) {
    const graph = new implementation.VisibilityGraph(fixture.obstacles, fixture.comfort);
    for (const warm of [false, true]) {
      const queries = fixture.queries.map(([start, target]) => {
        const started = performance.now(), route = graph.find(start, target), ms = performance.now() - started;
        if (route) for (let i = 0; i < route.length; i++) assert.ok(baseline.exports.segmentFree(i ? route[i-1] : start, route[i], fixture.obstacles));
        return { ms, found: !!route, cost: route?.reduce((sum,p,i) => sum + graph.segmentCost(i ? route[i-1] : start, p), 0) };
      });
      if (label === 'after') {
        const bytes = graph.comfortEdges.reduce((sum,row) => sum+(row?.byteLength ?? 0),0);
        assert.ok(bytes <= graph.vertices.length*(graph.vertices.length-1)/2*Float64Array.BYTES_PER_ELEMENT);
      }
      results.push({ label, warm, ms: queries.reduce((sum,q) => sum+q.ms,0), queries });
    }
    if (label === 'after') for (const [start,target] of fixture.queries) assert.equal(graph.canReach(start,target), baseline.exports.insideObstacle(start,fixture.obstacles) || baseline.exports.insideObstacle(target,fixture.obstacles) ? false : !!new baseline.exports.VisibilityGraph(fixture.obstacles).find(start,target));
  }
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < fixture.queries.length; i++) {
    const before = results[pass].queries[i], after = results[pass+2].queries[i];
    assert.equal(after.found, before.found);
    if (before.found) assert.ok(Math.abs(before.cost-after.cost) <= g.CLEARANCE_ERROR);
  }
  let seed = 20261016;
  const random = () => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/2**32; };
  for (let i = 0; i < 1000; i++) {
    const a = { x: random()*2000-700, z: random()*2000-700 }, b = i%2 ? { x: random()*2000-700, z: random()*2000-700 } : a;
    for (const endpointsFree of [false,true]) assert.equal(g.segmentFree(a,b,fixture.obstacles,endpointsFree), baseline.exports.segmentFree(a,b,fixture.obstacles,endpointsFree));
  }
  const reachability = [];
  for (const [label, implementation] of [['before',baseline.exports],['after',g]]) {
    const graph = new implementation.VisibilityGraph(fixture.obstacles,fixture.comfort);
    const started = performance.now();
    const found = fixture.queries.map(([start,target]) => label === 'before' ? !!graph.find(start,target) : graph.canReach(start,target));
    reachability.push({label,ms:performance.now()-started,found});
  }
  assert.deepEqual(reachability[0].found,reachability[1].found);
  console.log('Scene weighted routes (unchanged costs), reachability and 2000 collision comparisons:', JSON.stringify(results));
  console.log('Scene boolean reachability:',JSON.stringify(reachability));
  return;
}

function benchmark(implementation) {
  const obstacles = g.union([g.rectangle(0, 0, 40, 40), g.rectangle(100, 0, 30, 60)]);
  const graph = new implementation.VisibilityGraph(obstacles, { distance: 20, obstacles: g.union(obstacles.flat().map(p => g.inflate(p, 20))) });
  const p = { x: -21, z: 0 };
  let searches = 0;
  const findComfort = graph.findComfort;
  graph.findComfort = function(...args) { searches++; return findComfort.apply(this, args); };
  const started = performance.now();
  for (let frame = 0; frame < 60; frame++) for (let actor = 0; actor < 15; actor++) assert.deepEqual(graph.find(p, p), [p]);
  return { ms: performance.now() - started, searches, edges: Array.isArray(graph.comfortEdges) ? graph.comfortEdges.length : graph.comfortEdges.size };
}
const before = benchmark(baseline.exports), after = benchmark(g);
assert.ok(before.searches > 0);
assert.equal(after.searches, 0);
assert.equal(after.edges, 0);
const occupied = new g.VisibilityGraph(g.union([g.rectangle(0, 0, 40, 40)]));
assert.equal(occupied.find({ x: 0, z: 0 }, { x: 0, z: 0 }), null);
assert.throws(() => occupied.find({ x: NaN, z: 0 }, { x: NaN, z: 0 }));
console.log('15 actors × 60 zero-length checks:', JSON.stringify({ before, after }));

// Exercise the actual navigation service with a small deterministic scene;
// rendering/store modules are replaced, geometry and obstacle registration are real.
const originalLoad = Module._load;
const furniture = { movingFurniture: new Set() };
const architecture = { architectureObstacles: [], walkableSurfaces: [[g.rectangle(0, 0, 1000, 1000)]] };
const avoidance = {
  limitAgentMovement: (_id, _start, proposed) => proposed,
  isAgentDestinationFree: () => true, getAgentObstacles: () => [],
  beginActorBlockCheck: () => {}, endActorBlockCheck: () => new Map(), actorBlocksUnchanged: () => true,
};
const doors = {
  DOOR_CONFIGS: { living: { pivot: { x: 400, z: 400 }, closedDir: { x: 1, z: 0 }, openNormal: { x: 0, z: 1 }, length: 80, thickness: 4, margin: 1, yMin: 0, yMax: 200 } },
  glassShutterState: { clearHeight: Infinity }, doorCollisionState: { living: { angle: 0 } }, computeDoorAllowedAngle: () => Math.PI / 2,
};
Module._load = function(request, parent, ...args) {
  if (parent?.filename === path.join(nav, 'service.ts')) {
    if (request === '../../positionState') return { positionState: {} };
    if (request === '../../furniturePositions') return furniture;
    if (request === './architecture') return architecture;
    if (request === '../../doorObstacles') return doors;
    if (request === '../agent/agentAvoidance') return avoidance;
  }
  return originalLoad.call(this, request, parent, ...args);
};
const service = require(path.join(nav, 'service.ts'));
const baselineService = new Module(path.join(nav, 'service.ts'), module);
baselineService.filename = path.join(nav, 'service.ts'); baselineService.paths = module.paths;
baselineService._compile(ts.transpileModule(fs.readFileSync('/tmp/room-navigation-baseline-service.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, baselineService.filename);
Module._load = originalLoad;
registry.setAgentProfile('a', { radius: 10, height: 180 });
registry.setAgentProfile('b', { radius: 10, height: 180 });
assert.equal(registry.getAgentProfile('a'), registry.getAgentProfile('b'));
let profile = registry.getAgentProfile('a');
let graph = service.getNavigationGraph(profile);
assert.equal(service.getNavigationGraph(registry.getAgentProfile('b')), graph);
function walkingBenchmark(implementation) {
  const actors = Array.from({ length: 15 }, () => ({ route: implementation.createRouteState(), position: { x: -100, z: -200 } }));
  const target = { x: 100, z: -200 };
  // Exclude the initial static graph construction from steady-state costs.
  actors.forEach(a => { a.position = implementation.followRoute(a.route, 'a', a.position, target, 1); });
  const inflate = g.inflate;
  let inflations = 0;
  g.inflate = (...args) => { inflations++; return inflate(...args); };
  const started = performance.now();
  try {
    for (let frame = 0; frame < 60; frame++) for (const a of actors) a.position = implementation.followRoute(a.route, 'a', a.position, target, 1);
  } finally { g.inflate = inflate; }
  assert.ok(actors.every(a => a.position.x === -39));
  actors.forEach(a => implementation.resetRoute(a.route, 'a'));
  return { ms: performance.now() - started, inflations };
}
const walkingBefore = walkingBenchmark(baselineService.exports), walkingAfter = walkingBenchmark(service);
assert.ok(walkingBefore.inflations > 0);
assert.equal(walkingAfter.inflations, 0);
console.log('15 walking actors × 60 frames, one stationary door:', JSON.stringify({ before: walkingBefore, after: walkingAfter }));
const doorRoute = service.createRouteState();
const doorStart = { x: 450, z: 370 }, doorTarget = { x: 450, z: 430 };
assert.deepEqual(service.followRoute(doorRoute, 'a', doorStart, doorTarget, 60), doorStart, 'Closed actual door must stop movement');
doors.doorCollisionState.living.angle = Math.PI / 2;
assert.deepEqual(service.followRoute(doorRoute, 'a', doorStart, doorTarget, 60), doorTarget, 'Opening the actual door must update the footprint');
doors.doorCollisionState.living.angle = 0;
assert.deepEqual(service.followRoute(doorRoute, 'a', doorStart, doorTarget, 60), doorStart, 'Closing again must restore the closed footprint');
service.resetRoute(doorRoute, 'a');
const crowdRoute = service.createRouteState();
const crowdStart = { x: -100, z: -100 }, crowdTarget = { x: 100, z: -100 };
const actorPolygon = g.rectangle(0,-100,20,20);
avoidance.getAgentObstacles = () => [actorPolygon];
avoidance.limitAgentMovement = (_id,start,proposed) => g.segmentFree(start,proposed,[[actorPolygon]]) ? proposed : start;
service.followRoute(crowdRoute,'a',crowdStart,crowdTarget,200);
assert.ok(crowdRoute.crowd?.graph, 'A blocking actor must produce a detour');
assert.ok(crowdRoute.crowd.base.comfort, 'Static navigation must retain comfort');
assert.equal(crowdRoute.crowd.graph.comfort,undefined,'Moving-body detours must not build weighted comfort graphs');
for (let i = 0; i < crowdRoute.path.length; i++) assert.ok(g.segmentFree(i ? crowdRoute.path[i-1] : crowdStart,crowdRoute.path[i],crowdRoute.crowd.graph.obstacles));
avoidance.getAgentObstacles = () => [];
avoidance.limitAgentMovement = (_id,_start,proposed) => proposed;
service.followRoute(crowdRoute,'a',crowdStart,crowdTarget,1);
assert.equal(crowdRoute.crowd,undefined,'A departed blocker must release the detour graph');
assert.ok(crowdRoute.graph.comfort,'Cleared passage must restore the static comfort graph');
service.resetRoute(crowdRoute,'a');
console.log('Passed: physical crowd detour, collision-free segments and comfort route recovery.');
registry.registerObstacle({id:'covered-owner',owner:'covered-owner',polygon:g.rectangle(100,100,10,10),yMin:0,yMax:200});
registry.registerObstacle({id:'cover',polygon:g.rectangle(100,100,100,100),yMin:0,yMax:200});
let actorQueries = 0;
avoidance.isAgentDestinationFree = () => { actorQueries++; return false; };
assert.equal(service.getObjectApproach('covered-owner',{x:200,z:100},'a',{x:100,z:100},true),null);
assert.equal(actorQueries,0,'Actors near geometrically invalid candidates must not invalidate failed approaches');
avoidance.isAgentDestinationFree = () => true;
registry.unregisterObstacle('covered-owner'); registry.unregisterObstacle('cover');
console.log('Passed: impossible geometry does not acquire unrelated actor dependencies.');
registry.registerObstacle({ id: 'test', owner: 'test', polygon: g.rectangle(0, 0, 40, 40), yMin: 0, yMax: 100 });
assert.notEqual(service.getNavigationGraph(profile), graph, 'Geometry revision must invalidate cached graphs');
graph = service.getNavigationGraph(profile);
assert.notEqual(service.getNavigationGraph(profile, 'test'), graph);
assert.equal(service.getNavigationGraph(profile), graph);
const route = service.createRouteState();
const start = { x: -100, z: 0 }, target = { x: 0, z: 0 };
let finds = 0;
const find = graph.find;
graph.find = function(...args) { finds++; return find.apply(this, args); };
for (let frame = 0; frame < 60; frame++) for (let actor = 0; actor < 15; actor++) service.followRoute(route, 'a', start, target, 1);
assert.equal(finds, 1, 'Unchanged blocked route must be searched once, not once per frame');
assert.ok(route.error);
registry.unregisterObstacle('test');
assert.notDeepEqual(service.followRoute(route, 'a', start, target, 1), start, 'Removing the obstacle must resume movement');
service.resetRoute(route, 'a');
assert.equal(route.graph, null);
assert.equal(route.failure, undefined);
assert.equal(registry.navigationDebug.has('a'), false);

async function checkCollection() {
  assert.equal(typeof global.gc, 'function', 'Run with node --expose-gc');
  const weak = new WeakRef(graph);
  registry.removeAgentProfile('a'); registry.removeAgentProfile('b');
  graph = null; profile = null;
  // WeakRef targets remain alive until the end of the current JS job.
  await new Promise(resolve => setImmediate(resolve));
  global.gc();
  assert.equal(weak.deref(), undefined, 'A removed profile must release its cached graph');
  const heaps = [];
  for (let batch = 0; batch < 5; batch++) {
    for (let i = 0; i < 30; i++) {
      registry.setAgentProfile('probe', { radius: 10 + i / 100 + batch, height: 180 });
      service.getNavigationGraph(registry.getAgentProfile('probe'));
      registry.removeAgentProfile('probe');
    }
    await new Promise(resolve => setImmediate(resolve));
    global.gc(); heaps.push(process.memoryUsage().heapUsed);
  }
  console.log('Collected heap after batches of 30 temporary profiles:', heaps);
  console.log('Passed: cache sharing, invalidation, blocked retries, recovery, reset and graph collection.');
}
function checkObstacleLifecycle() {
  const THREE = require('three');
  let refIndex = 0, effectIndex = 0, enabled = true;
  const refs = [], effects = [], pending = [];
  const group = new THREE.Group();
  const react = {
    useRef(initial) { const i = refIndex++; return refs[i] ?? (refs[i] = { current: i === 0 ? group : initial }); },
    useLayoutEffect(create, deps) {
      const i = effectIndex++, previous = effects[i];
      if (!previous || deps.some((value, j) => value !== previous.deps[j])) pending.push({ i, create, deps });
    },
  };
  const load = Module._load;
  Module._load = function(request, parent, ...args) {
    if (parent?.filename === path.join(nav, 'NavigationObstacle.tsx')) {
      if (request === 'react') return react;
      if (request === '@react-three/fiber') return { useFrame() {} };
      if (request === './NavigationContext') return { useNavigationEnabled: () => enabled };
      if (request === '../../glbUtils') return { glbLocalBBox: () => new THREE.Box3(new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 2, 1)) };
    }
    return load.call(this, request, parent, ...args);
  };
  const component = new Module(path.join(nav, 'NavigationObstacle.tsx'), module);
  component.filename = path.join(nav, 'NavigationObstacle.tsx'); component.paths = module.paths;
  try {
    component._compile(ts.transpileModule(fs.readFileSync(component.filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
    }).outputText, component.filename);
  } finally { Module._load = load; }
  const render = (id, count) => {
    group.clear();
    for (let i = 0; i < count; i++) group.add(new THREE.Mesh());
    refIndex = 0; effectIndex = 0;
    component.exports.NavigationObstacle({ id, compound: true, children: [] });
    // React runs layout cleanups before the new layout effects.
    for (const item of pending) effects[item.i]?.cleanup?.();
    for (const item of pending) effects[item.i] = { deps: item.deps, cleanup: item.create() };
    pending.length = 0;
  };
  render('compound-a', 3);
  assert.equal(registry.furnitureObstacles.size, 3);
  render('compound-a', 2);
  assert.equal(registry.furnitureObstacles.size, 2, 'Shrinking a compound object must unregister stale volumes');
  render('compound-a', 3);
  render('compound-b', 2);
  assert.deepEqual([...registry.furnitureObstacles.keys()].sort(), ['compound-b:0', 'compound-b:1']);
  enabled = false; render('compound-b', 2);
  assert.equal(registry.furnitureObstacles.size, 0, 'Disabling navigation must remove all volumes');
  enabled = true; render('compound-b', 2);
  assert.equal(registry.furnitureObstacles.size, 2);
  effects.forEach(effect => effect.cleanup?.());
  assert.equal(registry.furnitureObstacles.size, 0, 'Unmount must clear all volumes');
  console.log('Passed: compound shrink, replacement id, disabled preview, re-enable and unmount.');
}
checkObstacleLifecycle();
checkCollection().catch(error => { console.error(error); process.exitCode = 1; });
