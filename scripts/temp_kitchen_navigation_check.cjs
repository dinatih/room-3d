const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
if (process.argv.includes('--plant-data')) {
  for (const path of ['public/items/plant-monstera/potted_palm.glb', 'public/items/yucca10329308/Yucca10329308.glb']) {
    const buffer = fs.readFileSync(path);
    const json = JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString());
    console.log(path, JSON.stringify({ materials: json.materials.map(m=>({name:m.name,alphaMode:m.alphaMode})), nodes: json.nodes.map(n=>({name:n.name,mesh:n.mesh})), meshes: json.meshes.map(m=>({name:m.name,materials:m.primitives.map(p=>p.material)})) }));
  }
  process.exit(0);
}
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }, fileName: filename,
  });
  module._compile(outputText, filename);
};
const g = require('../src/features/scene/ai/navigation/geometry.ts');
if (process.argv.includes('--benchmark') || process.argv.includes('--benchmark-audit')) {
  const Module = require('node:module');
  const source = require('node:child_process').execFileSync('git', ['show', `${process.env.ROOM_NAV_BASELINE || 'HEAD'}:src/features/scene/ai/navigation/geometry.ts`], { encoding: 'utf8' });
  const baseline = new Module(__filename, module);
  baseline.paths = module.paths;
  baseline._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, __filename);
  const fixture = process.argv.includes('--benchmark-audit') ? JSON.parse(fs.readFileSync('/tmp/room-navigation-audit.json', 'utf8')).blocked[0] : JSON.parse(fs.readFileSync('/tmp/room-navigation-benchmark.json', 'utf8'));
  const { obstacles } = fixture;
  const queries = fixture.queries ?? [[fixture.state, fixture.route.target]];
  const results = [];
  for (const [start, target] of queries) {
    const compare = implementation => {
      const graph = new implementation.VisibilityGraph(obstacles);
      const started = performance.now(), route = graph.find(start, target);
      return { ms: performance.now() - started, length: route ? route.reduce((sum, p, i) => sum + g.distance(i ? route[i - 1] : start, p), 0) : null };
    };
    const before = compare(baseline.exports), after = compare(g);
    assert.ok(before.length === after.length || (before.length !== null && after.length !== null && Math.abs(before.length - after.length) < 1e-6), 'Scene shortest path changed');
    results.push({ start, target, before, after });
  }
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}
const { requestDoor, releaseDoor, releaseAgentDoors, doorRequested } = require('../src/features/scene/ai/navigation/doorRequests.ts');
const square = g.rectangle(0, 0, 10, 10);
const obstacles = g.union([square]);
const graph = new g.VisibilityGraph(obstacles);
const start = { x: -10, z: 0 }, target = { x: 10, z: 0 };
const route = graph.find(start, target);
assert.ok(route);
const length = [start, ...route].slice(1).reduce((sum, p, i) => sum + g.distance([start, ...route][i], p), 0);
assert.ok(Math.abs(length - (10 + 2 * Math.sqrt(50))) < 1e-6, `Shortest route length ${length}`);
assert.equal(graph.find({ x: 0, z: 0 }, target), null);
assert.deepEqual(graph.find({ x: -10, z: 10 }, { x: 10, z: 10 }), [{ x: 10, z: 10 }]);
assert.equal(g.segmentFree(start, target, obstacles), false);
assert.equal(g.segmentFree({ x: -10, z: -5 }, { x: 10, z: -5 }, obstacles), true);
assert.throws(() => graph.find({ x: NaN, z: 0 }, target));
const inflated = g.inflate(square, 2);
assert.ok(g.pointInRing({ x: 6.9, z: 0 }, inflated));
assert.equal(g.pointInRing({ x: 7.2, z: 0 }, inflated), false);
const rotated = new g.VisibilityGraph(g.union([g.inflate(g.rectangle(0, 0, 20, 5, Math.PI / 4), 2)]));
const rotatedRoute = rotated.find({ x: -30, z: 0 }, { x: 30, z: 0 });
assert.ok(rotatedRoute);
let previous = { x: -30, z: 0 };
for (const p of rotatedRoute) { assert.ok(g.segmentFree(previous, p, rotated.obstacles)); previous = p; }
const overlap = g.union([g.rectangle(-2, 0, 10, 10), g.rectangle(2, 0, 10, 10)]);
assert.equal(overlap.length, 1);
const holed = g.union([g.rectangle(0, -10, 30, 4), g.rectangle(0, 10, 30, 4), g.rectangle(-13, 0, 4, 20), g.rectangle(13, 0, 4, 20)]);
assert.equal(g.insideObstacle({ x: 0, z: 0 }, holed), false);
assert.ok(new g.VisibilityGraph(holed).find({ x: 0, z: 0 }, { x: 5, z: 5 }));
// Independent Dijkstra oracle keeps every visible edge, including non-tangents.
function completeVisibilityDistance(obstacles, start, target) {
  if (g.insideObstacle(start, obstacles) || g.insideObstacle(target, obstacles)) return Infinity;
  const nodes = [start, target, ...obstacles.flat(2)];
  const costs = nodes.map(() => Infinity), visited = new Set();
  costs[0] = 0;
  while (visited.size < nodes.length) {
    let current = -1;
    for (let i = 0; i < nodes.length; i++) if (!visited.has(i) && (current < 0 || costs[i] < costs[current])) current = i;
    if (current === 1 || costs[current] === Infinity) return costs[1];
    visited.add(current);
    for (let i = 0; i < nodes.length; i++) {
      if (visited.has(i) || !g.segmentFree(nodes[current], nodes[i], obstacles, true)) continue;
      costs[i] = Math.min(costs[i], costs[current] + g.distance(nodes[current], nodes[i]));
    }
  }
  return costs[1];
}
const fixtures = [
  g.union([g.inflate(g.rectangle(-6, 0, 4, 18, Math.PI / 5), 1), g.inflate(g.rectangle(7, 0, 4, 14, -Math.PI / 7), 1)]),
  g.union([g.rectangle(-4, 0, 8, 20), g.rectangle(3, 6, 14, 8)]),
  g.union([g.rectangle(0, -20, 50, 4), g.rectangle(0, 20, 50, 4), g.rectangle(-23, 0, 4, 40), g.rectangle(23, 0, 4, 40), g.rectangle(0, 0, 8, 16)]),
];
const endpoints = [{x:-18,z:-15}, {x:18,z:15}, {x:0,z:15}, {x:0,z:-15}, {x:-30,z:0}, {x:30,z:0}];
for (const obstacles of fixtures) {
  const graph = new g.VisibilityGraph(obstacles);
  for (let i = 0; i < endpoints.length; i++) for (let j = i + 1; j < endpoints.length; j++) {
    const start = endpoints[i], target = endpoints[j], route = graph.find(start, target);
    const actual = route ? route.reduce((sum, p, i) => sum + g.distance(i ? route[i - 1] : start, p), 0) : Infinity;
    const expected = completeVisibilityDistance(obstacles, start, target);
    assert.ok(actual === expected || Math.abs(actual - expected) < 1e-6, `Tangent graph changed shortest distance: ${actual} vs ${expected}`);
    if (route) route.forEach((p, i) => assert.ok(g.segmentFree(i ? route[i - 1] : start, p, obstacles)));
  }
}
console.log('Tangent graph matches complete visibility Dijkstra on 45 routes: rounded, rotated, concave, enclosed and disconnected obstacles.');
requestDoor('bath', 'a'); assert.equal(requestDoor('bath', 'b'), false);
releaseDoor('bath', 'a'); assert.equal(requestDoor('bath', 'b'), true);
releaseAgentDoors('b'); assert.equal(doorRequested('bath'), false);
assert.equal(requestDoor('glassRight', 'a'), true);
assert.equal(requestDoor('glassLeft', 'b'), false);
assert.equal(doorRequested('glassLeft'), true);
releaseAgentDoors('a');
assert.equal(requestDoor('glassRight', 'b'), true);
releaseAgentDoors('b');
assert.equal(requestDoor('glassRight', 'a', 'closed'), true);
assert.equal(requestDoor('glassLeft', 'b'), false);
assert.equal(doorRequested('glassRight'), false);
releaseAgentDoors('a');
assert.equal(doorRequested('glassLeft'), true);
releaseAgentDoors('b');
console.log('Geometry checks passed: shortest route, direct routes, inflation, rotation, overlaps, holes, invalid targets, FIFO door reservations.');

if (process.argv.includes('--browser')) (async () => {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    if (process.argv.includes('--profile')) {
      const client = await page.createCDPSession();
      await page.exposeFunction('measureHeap', async () => {
        await client.send('HeapProfiler.collectGarbage');
        return client.send('Runtime.getHeapUsage');
      });
    }
    const errors = [];
    page.on('console', message => { if (message.text().startsWith('Controlled exit:') || message.text().startsWith('Agent trace:') || message.type() === 'error') console.log('CONSOLE:', message.text()); });
    page.on('requestfailed', request => console.log('REQUEST:', request.url(), request.failure()?.errorText));
    page.on('pageerror', error => { errors.push(error.message); console.error('PAGE:', error.message); });
    await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5186'}/AGENTS.md`);
    await page.evaluate(idleTest => { window.idleTest = idleTest; }, process.argv.includes('--idle-only'));
    await page.evaluate(casesTest => { window.casesTest = casesTest; }, process.argv.includes('--cases-only'));
    await page.evaluate(async () => {
      (await import('/@react-refresh')).default.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { Canvas, useFrame, useThree } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const { useGLTF } = await import('/node_modules/.vite/deps/@react-three_drei.js');
      useGLTF.setDecoderPath('/draco/');
      const placements = await import('/src/features/scene/Placements.tsx');
      const { DoorsPlacement } = await import('/src/features/scene/building/DoorsPlacement.tsx');
      const { Character } = await import('/src/features/scene/character/Character.tsx');
      const { CHARACTERS } = await import('/src/features/scene/characterConfig.ts');
      const nav = await import('/src/features/scene/ai/navigation/service.ts');
      const registry = await import('/src/features/scene/ai/navigation/obstacles.ts');
      const { doorCollisionState, DOOR_CONFIGS, computeDoorAllowedAngle, getDoorContactAngle } = await import('/src/features/scene/doorObstacles.ts');
      const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
      useSceneStore.setState(s => ({ layers: { ...s.layers, animOriginLerp: false, animCrossfade: false, exitTransitions: false } }));
      const { useAgentController } = await import('/src/features/scene/ai/useAgentController.ts');
      const { resetAppIdle } = await import('/src/features/scene/idleState.ts');
      window.resolveCoords = (await import('/src/features/scene/ai/agent/agentInstructionCoords.ts')).resolveInstructionCoords;
      window.smartObjects = await import('/src/features/scene/ai/smartObjectRegistry.ts');
      window.furnitureState = await import('/src/features/scene/furniturePositions.ts');
      window.positionState = (await import('/src/features/scene/positionState.ts')).positionState;
      window.cameraState = (await import('/src/features/scene/cameraState.ts')).cameraState;
      window.steer = (await import('/src/features/scene/ai/agent/agentAvoidance.ts')).computeSteeringVector;
      const scenarios = await import('/src/features/scene/ai/scenarios.ts');
      window.autonomousAgents = new Map();
      function AutonomousProbe({ id }) {
        const scenario = React.useMemo(() => scenarios.buildAutonomousScenario(id), [id]);
        const agent = useAgentController(id, scenario, true, () => ({ x: 160, y: 0, z: 300, rotY: 0 }));
        window.autonomousAgents.set(id, { agent, scenario });
        return null;
      }
      const regressionCases = [
        ['desk-bollsidan-1', 'work-sitting'], ['desk-bollsidan-2', 'work-standing'],
        ['cuisine-group', 'cook-oven'], ['freezer', 'open-pick'], ['kallax-ne', 'inspect'],
        ['drona-west', 'pick-item'], ['sofa-garden-west', 'seat-2'], ['building-b-corridor', 'trash'],
      ];
      function RegressionProbe({ index }) {
        const id = `regression-${index}`;
        const scenario = React.useMemo(() => [{ type: 'MOVE_TO', targetPos: [160, 0, 300] },
          ...window.smartObjects.buildSmartObjectInstructionSequence(...regressionCases[index]).map(instruction => instruction.type === 'USE_OBJECT' ? { ...instruction, duration: 0.1, repeatCount: 1, animation: 'idle' } : instruction),
          { type: 'MOVE_TO', targetPos: [200, 0, -50] }], []);
        const agent = useAgentController(id, scenario, false, () => ({ x: 160, y: 0, z: 300, rotY: 0 }));
        window.autonomousAgents.set(id, { agent, scenario, label: regressionCases[index].join(':') });
        return null;
      }
      const e = React.createElement;
      document.body.innerHTML = '<div id="fixture" style="height:100vh"></div>';
      const native = CHARACTERS.find(c => c.id === 'native');
      window.geom = await import('/src/features/scene/ai/navigation/geometry.ts');
      window.nav = { ...nav, ...registry, doorCollisionState, DOOR_CONFIGS, computeDoorAllowedAngle, getDoorContactAngle, useSceneStore };
      function Probe() {
        window.fixtureScene = useThree().scene;
        window.fixtureScene.visible = false;
        const scenario = React.useMemo(() => [
          { type: 'USE_OBJECT', smartObjectId: 'cuisine-group', slotId: 'cook-stove', duration: 0.05 },
          { type: 'MOVE_TO', targetPos: [140, 0, 560] },
        ], []);
        const agent = useAgentController('probe', scenario, false, () => ({ x: 80, y: 0, z: 400, rotY: 0 }));
        window.agent = agent;
        useFrame((_, dt) => {
          resetAppIdle();
          if (window.runAgent) { window.agentState = { ...agent.update(dt) }; window.agentStatus = agent.getStatus(); }
        });
        return null;
      }
      window.root = createRoot(document.getElementById('fixture'));
      window.root.render(e(Canvas, { camera: { position: [600, 900, 900], far: 5000 } }, e('ambientLight', { intensity: 2 }), e(Probe),
        ...(window.idleTest ? Object.keys(scenarios.INITIAL_SMART_OBJECT_BY_CHAR).slice(0, 15).map(id => e(AutonomousProbe, { key: id, id })) : []),
        ...(window.casesTest ? regressionCases.map((_, index) => e(RegressionProbe, { key: index, index })) : []),
        e(React.Suspense, { fallback: null }, e(placements.Equipment), e(placements.Furniture), e(placements.Furnishings), e(placements.Decor), e(DoorsPlacement),
          e(Character, { ...native, modelPath: native.path, targetHeight: native.height, isLara: true, isActive: false, isNPC: false, scenario: null }))));
    });
    await page.waitForFunction(() => window.nav?.furnitureObstacles.size > 25 && window.nav.hasAgentProfile('native'), { timeout: 60000 }).catch(async error => { console.log('Readiness:', await page.evaluate(() => ({ ids: [...window.nav.furnitureObstacles.keys()], native: window.nav.hasAgentProfile('native'), scene: window.fixtureScene.children.map(c => c.name), agent: window.agent.getStatus() }))); throw error; });
    console.log('Scene assets ready:', await page.evaluate(() => ({ profile: window.nav.getAgentProfile('native'), obstacles: window.nav.furnitureObstacles.size })));
    if (process.argv.includes('--profile')) {
      fs.writeFileSync('/tmp/room-navigation-benchmark.json', JSON.stringify(await page.evaluate(() => ({
        obstacles: window.nav.getNavigationGraph(window.nav.getAgentProfile('native')).obstacles,
        queries: [
          [{x:80,z:380}, {x:140,z:560}], [{x:160,z:300}, {x:200,z:-50}],
          [{x:500,z:-100}, {x:169,z:535}], [{x:-100,z:-170}, {x:14.13891,z:535}],
          [{x:37.19498,z:269.58378000000005}, {x:-300,z:-200}],
        ],
      }))));
      await page.evaluate(() => {
        window.navigationTimings = { calls: 0, totalMs: 0, longest: [] };
        const find = window.geom.VisibilityGraph.prototype.find;
        window.geom.VisibilityGraph.prototype.find = function (...args) {
          const started = performance.now();
          const result = find.apply(this, args);
          const ms = performance.now() - started, timings = window.navigationTimings;
          timings.calls++; timings.totalMs += ms;
          timings.longest.push({ ms, vertices: this.vertices.length, start: { x: args[0].x, z: args[0].z }, target: { x: args[1].x, z: args[1].z }, found: !!result });
          timings.longest.sort((a, b) => b.ms - a.ms);
          timings.longest.length = Math.min(timings.longest.length, 12);
          return result;
        };
      });
    }
    if (process.argv.includes('--profile-only')) {
      const { queries } = JSON.parse(fs.readFileSync('/tmp/room-navigation-benchmark.json', 'utf8'));
      const samples = await page.evaluate(async queries => {
        const graph = window.nav.getNavigationGraph(window.nav.getAgentProfile('native'));
        const samples = [{ batch: 0, ...await window.measureHeap() }];
        for (let batch = 1; batch <= 3; batch++) {
          for (let repetition = 0; repetition < 100; repetition++) for (const [start, target] of queries) graph.find(start, target);
          await new Promise(resolve => requestAnimationFrame(resolve));
          samples.push({ batch, ...await window.measureHeap() });
        }
        return { samples, timings: window.navigationTimings };
      }, queries);
      console.log('Repeated navigation / collected heap:', JSON.stringify(samples));
      assert.equal(errors.length, 0);
      return;
    }
    if (process.argv.includes('--cases-only')) {
      const cases = await page.evaluate(async () => {
        const profile = window.nav.getAgentProfile('native'), results = [];
        for (const [id, { agent, label }] of window.autonomousAgents) {
          window.nav.setAgentProfile(id, profile);
          const deadline = performance.now() + 30000;
          let state, status;
          while (performance.now() < deadline) {
            state = { ...agent.update(0.1) }; status = agent.getStatus();
            window.cameraState.positions[id] = { ...state, yaw: state.rotY };
            if (status === 'FINISHED' || status === 'BLOCKED') break;
            await new Promise(resolve => requestAnimationFrame(resolve));
          }
          results.push({ label, status, state, route: window.nav.navigationDebug.get(id) });
          console.log('Agent trace:', JSON.stringify(results[results.length - 1]));
          delete window.cameraState.positions[id];
          if (status !== 'FINISHED') break;
        }
        return results;
      });
      assert.equal(cases.length, 8);
      assert.ok(cases.every(c => c.status === 'FINISHED'), JSON.stringify(cases));
      console.log('Interaction regressions passed with all three animation options OFF.');
      return;
    }
    if (process.argv.includes('--idle-only')) {
      const audit = await page.evaluate(async () => {
        const profile = window.nav.getAgentProfile('native');
        for (const id of window.autonomousAgents.keys()) window.nav.setAgentProfile(id, profile);
        const blocked = new Map(), failures = [];
        const heapSamples = [];
        const frames = window.measureHeap ? 3600 : 1200;
        let completedFrames = 0;
        for (let frame = 0; frame < frames; frame++) {
          if (window.measureHeap && frame % 1200 === 0) {
            const heap = await window.measureHeap();
            heapSamples.push({ frame, ...heap });
            console.log('Agent trace:', JSON.stringify({ heap: heapSamples[heapSamples.length - 1], timings: window.navigationTimings }));
          }
          for (const [id, { agent }] of window.autonomousAgents) {
            try {
              const state = { ...agent.update(0.1) };
              window.cameraState.positions[id] = { ...state, yaw: state.rotY };
              const status = agent.getStatus(), route = window.nav.navigationDebug.get(id);
              if (status === 'BLOCKED') blocked.set(id, { id, frame, state, route, obstacles: window.nav.getNavigationGraph(profile).obstacles,
                blockers: [...window.nav.architectureObstacles, ...window.nav.furnitureObstacles.values()].filter(o => window.geom.pointInRing(route.target, window.geom.inflate(o.polygon, profile.radius))).map(o => ({id:o.id,owner:o.owner,polygon:o.polygon})),
                startBlockers: [...window.nav.architectureObstacles, ...window.nav.furnitureObstacles.values()].filter(o => window.geom.pointInRing(state, window.geom.inflate(o.polygon, profile.radius))).map(o => ({id:o.id,owner:o.owner,polygon:o.polygon})),
              });
              if (!window.measureHeap && frame % 300 === 0) console.log('Agent trace:', JSON.stringify({ id, frame, status, state, target: route?.target, error: route?.error }));
            } catch (error) { failures.push({ id, frame, error: error.message }); }
          }
          completedFrames = frame + 1;
          if (blocked.size || failures.length) break;
          await new Promise(resolve => requestAnimationFrame(resolve));
        }
        if (window.measureHeap) heapSamples.push({ frame: completedFrames, ...await window.measureHeap() });
        return { blocked: [...blocked.values()], failures, heapSamples };
      });
      console.log('Autonomous audit:', JSON.stringify({ ...audit, blocked: audit.blocked.map(({ obstacles, ...result }) => result) }));
      fs.writeFileSync('/tmp/room-navigation-audit.json', JSON.stringify(audit, null, 2));
      if (process.argv.includes('--profile')) {
        console.log('Navigation profile:', JSON.stringify(await page.evaluate(() => window.navigationTimings)));
      }
      console.log('Plant geometry:', await page.evaluate(() => {
        const entries = [];
        window.fixtureScene.traverse(node => {
          if (node.userData.itemName?.match(/palm|palmier/i)) entries.push({name:node.name,label:node.userData.itemName,children:node.children.map(c=>({name:c.name,children:c.children.map(m=>({name:m.name,type:m.type}))}))});
        });
        return JSON.stringify(entries);
      }));
      assert.equal(audit.blocked.length, 0, 'Autonomous actors must not get permanently blocked');
      assert.equal(audit.failures.length, 0, 'Autonomous coordinates must resolve');
      return;
    }
    if (process.argv.includes('--doors-only')) {
      const doors = await page.evaluate(async () => {
        const nav = window.nav, g = window.geom;
        const profile = nav.getAgentProfile('native');
        nav.useSceneStore.setState(s => ({ layers: { ...s.layers, npcCollisions: true } }));
        const results = [];
        const scenarios = [
          [180, 200, 220].map(x => [{ x, z: -50 }, { x: 160, z: 300 }]),
          [140, 150, 160].map(x => [{ x, z: 300 }, { x: 200, z: -50 }]),
          [[{ x: 180, z: -50 }, { x: 160, z: 300 }], [{ x: 160, z: 300 }, { x: 200, z: -50 }]],
        ];
        for (const [scenarioIndex, destinations] of scenarios.entries()) {
        const actors = destinations.map(([position, target], i) => ({ id: `door-${i}`, position, target, route: nav.createRouteState() }));
        actors.forEach(a => nav.setAgentProfile(a.id, profile));
        const deadline = performance.now() + 30000;
        let nextLog = 0;
        while (performance.now() < deadline && actors.some(a => g.distance(a.position, a.target) > 1e-6)) {
          for (const a of actors) {
            if (g.distance(a.position, a.target) <= 1e-6) continue;
            const before = a.position;
            a.position = nav.followRoute(a.route, a.id, a.position, a.target, 1, (direction, remaining) => {
              const s = window.steer(a.id, a.position.x, a.position.z, direction.x, direction.z, remaining);
              return { x: s.steerX, z: s.steerZ };
            });
            window.cameraState.positions[a.id] = { ...a.position, y: 0, yaw: 0 };
            for (const key of nav.doorKeys) {
              const leaf = [[g.inflate(nav.doorPolygon(key, nav.doorCollisionState[key].angle), profile.radius + nav.DOOR_CONFIGS[key].margin)]];
              if (g.distance(before, a.position) > 0 && !g.segmentFree(before, a.position, leaf)) throw new Error(`Crowd crossed ${key}`);
            }
          }
          if (performance.now() > nextLog) {
            console.log('Agent trace:', JSON.stringify({ actors: actors.map(a => ({ id: a.id, position: a.position, index: a.route.index, next: a.route.path[a.route.index], error: a.route.error, doors: [...a.route.doors] })), angles: nav.doorCollisionState }));
            nextLog = performance.now() + 5000;
          }
          await new Promise(resolve => requestAnimationFrame(resolve));
        }
        results.push(...actors.map(a => ({ scenarioIndex, id: a.id, position: a.position, remaining: g.distance(a.position, a.target), error: a.route.error })));
        for (const a of actors) { nav.resetRoute(a.route, a.id); delete window.cameraState.positions[a.id]; }
        }
        return results;
      });
      console.log('Door crowd:', JSON.stringify(doors));
      assert.ok(doors.every(a => a.remaining < 1e-6 && !a.error), 'Every actor must clear the glass doorway');
      return;
    }
    const result = await page.evaluate(() => {
      const nav = window.nav;
      const geometry = window.geom;
      const profile = nav.getAgentProfile('native');
      nav.setAgentProfile('probe', profile);
      const graph = nav.getNavigationGraph(profile);
      const fixtures = [
        [{ x: 80, z: 380 }, { x: 140, z: 560 }],
        [{ x: 140, z: 560 }, { x: 80, z: 380 }],
        [{ x: 160, z: 300 }, { x: 200, z: -50 }],
      ];
      const paths = fixtures.map(([from, to]) => graph.find(from, to));
      const exitRoute = nav.createRouteState();
      nav.followRoute(exitRoute, 'probe', {x:80,z:400}, {x:80,z:400}, 1, undefined, 'cuisine-group', true);
      nav.resetRoute(exitRoute, 'probe');
      const exited = nav.followRoute(exitRoute, 'probe', {x:80,z:400}, {x:140,z:560}, 1);
      console.log('Controlled exit:', JSON.stringify({exited, error: exitRoute.error, owner: exitRoute.owner}));
      window.agent.setPosition(80, 0, 400);
      window.runAgent = true;
      return { profile, count: nav.furnitureObstacles.size, vertices: graph.vertices.length, paths: paths.map(p => p ? ({ length: p.length, distance: [fixtures[paths.indexOf(p)][0], ...p].slice(1).reduce((sum, point, i) => sum + geometry.distance([fixtures[paths.indexOf(p)][0], ...p][i], point), 0) }) : null), blockers: [...nav.furnitureObstacles.values()].map(o => ({ id: o.id, angle: nav.getDoorContactAngle(nav.DOOR_CONFIGS.living, o.polygon), polygon: o.polygon })).filter(o => o.angle !== null && o.angle < 0.8), excludedStart: geometry.insideObstacle({x:80,z:400}, nav.getNavigationGraph(profile, 'cuisine-group').obstacles), startObstacles: [...nav.architectureObstacles, ...nav.furnitureObstacles.values()].filter(o => geometry.pointInRing({x:80,z:400}, geometry.inflate(o.polygon, profile.radius))), angles: Object.fromEntries(Object.entries(nav.DOOR_CONFIGS).map(([k, d]) => [k, nav.computeDoorAllowedAngle(d)])), furniture: [...nav.furnitureObstacles.values()].filter(o => ['kallax-se', 'corridor-closet', 'sdb-closet'].includes(o.owner)) };
    });
    console.log('Scene navigation:', JSON.stringify(result));
    assert.ok(result.profile.radius > 0 && result.profile.radius < 25.5, `Neutral body radius ${result.profile.radius}`);
    assert.ok(result.paths.every(Boolean), 'All main paths must be reachable');
    await page.evaluate(async () => {
      window.runAgent = false;
      const deadline = performance.now() + 60000;
      let previousLog = 0;
      while (performance.now() < deadline) {
        const tickStart = performance.now();
        window.agentState = { ...window.agent.update(0.1) };
        window.cameraState.positions.probe = { ...window.agentState, yaw: window.agentState.rotY };
        const tickDuration = performance.now() - tickStart;
        window.agentStatus = window.agent.getStatus();
        if (window.agentStatus === 'FINISHED' || window.agentStatus === 'BLOCKED') break;
        if (performance.now() - previousLog > 5000) {
          previousLog = performance.now();
          console.log('Agent trace:', JSON.stringify({ tickDuration, revision: window.nav.getObstacleRevision(), state: window.agentState, status: window.agentStatus, doors: window.nav.doorCollisionState }));
        }
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
    });
    const outcome = await page.evaluate(() => ({ state: window.agentState, status: window.agentStatus, debug: window.nav.navigationDebug.get('probe') }));
    console.log('Cooking -> bathroom:', JSON.stringify(outcome));
    assert.equal(outcome.status, 'FINISHED');
    const interactions = await page.evaluate(async () => {
      const nav = window.nav, geometry = window.geom;
      const profile = nav.getAgentProfile('probe');
      let position = { x: 140, z: 560 };
      const route = nav.createRouteState();
      const moves = [];
      async function move(target, owner, interaction = false) {
        nav.resetRoute(route, 'probe');
        const deadline = performance.now() + 30000;
        let steps = 0;
        while (geometry.distance(position, target) > 1e-6 && performance.now() < deadline) {
          const before = position;
          position = nav.followRoute(route, 'probe', position, target, 6, undefined, owner, interaction);
          window.cameraState.positions.probe = { ...position, y: 0, yaw: 0 };
          if (route.error) throw new Error(`${route.error}, from ${JSON.stringify(position)}, to ${JSON.stringify(target)}, blockers ${JSON.stringify([...nav.architectureObstacles, ...nav.furnitureObstacles.values()].filter(o => geometry.pointInRing(target, geometry.inflate(o.polygon, profile.radius))).map(o => o.id))}`);
          for (const key of nav.doorKeys) {
            const leaf = [[geometry.inflate(nav.doorPolygon(key, nav.doorCollisionState[key].angle), profile.radius + nav.DOOR_CONFIGS[key].margin)]];
            if (geometry.distance(before, position) > 0 && !geometry.segmentFree(before, position, leaf)) throw new Error(`Crossed closed ${key}`);
          }
          steps++;
          await new Promise(resolve => requestAnimationFrame(resolve));
        }
        if (geometry.distance(position, target) > 1e-6) throw new Error(`Route stalled at ${JSON.stringify(position)}, target ${JSON.stringify(target)}, doors ${JSON.stringify(nav.doorCollisionState)}`);
        moves.push({ target, steps });
      }
      const approach = window.resolveCoords({ type: 'MOVE_TO', smartObjectId: 'shower', slotId: 'take-shower-2' }, null, 'probe');
      const shower = window.resolveCoords({ type: 'USE_OBJECT', smartObjectId: 'shower', slotId: 'take-shower-2' }, null, 'probe');
      await move({ x: approach.tx, z: approach.tz });
      await move({ x: shower.tx, z: shower.tz }, 'shower', true);
      await move({ x: approach.tx, z: approach.tz });
      await move({ x: 80, z: 380 });
      const bedMoves = window.smartObjects.buildSmartObjectInstructionSequence('bed-west', 'lie-down');
      for (const instruction of bedMoves) {
        const p = window.resolveCoords(instruction, null, 'probe', instruction.navigation === 'interaction' || instruction.type === 'USE_OBJECT' ? undefined : position);
        await move({ x: p.tx, z: p.tz }, instruction.smartObjectId, instruction.type === 'USE_OBJECT' || instruction.navigation === 'interaction');
      }
      const bedConfigurations = [];
      nav.useSceneStore.getState().triggerAction('bed-double', true);
      for (let i = 0; i < window.furnitureState.DOUBLE_BED_POSITIONS.length; i++) {
        if (i) nav.useSceneStore.getState().triggerAction('bed-position');
        const expected = window.furnitureState.DOUBLE_BED_POSITIONS[i].west;
        const deadline = performance.now() + 10000;
        do { await new Promise(resolve => requestAnimationFrame(resolve)); }
        while ((window.positionState['bed-position']?.idx !== i || window.furnitureState.movingFurniture.size
          || Math.abs(window.smartObjects.getSmartObject('bed-west').position[0] - expected.x) > 1e-6
          || Math.abs(window.smartObjects.getSmartObject('bed-west').position[2] - expected.z) > 1e-6) && performance.now() < deadline);
        if (window.furnitureState.movingFurniture.size) throw new Error('Bed transition did not settle');
        const west = window.smartObjects.getSmartObject('bed-west');
        if (Math.abs(west.position[0] - expected.x) > 1e-6 || Math.abs(west.position[2] - expected.z) > 1e-6) throw new Error(`Stale bed anchor ${JSON.stringify(west.position)}`);
        const graph = nav.getNavigationGraph(profile);
        const path = graph.find({ x: 80, z: 380 }, { x: 140, z: 560 });
        if (!path) throw new Error(`Kitchen to bath inaccessible with bed config ${i}`);
        position = { x: 80, z: 380 };
        route.owner = undefined;
        for (const instruction of window.smartObjects.buildSmartObjectInstructionSequence('bed-west', 'lie-down')) {
          const p = window.resolveCoords(instruction, null, 'probe', instruction.navigation === 'interaction' || instruction.type === 'USE_OBJECT' ? undefined : position);
          await move({ x: p.tx, z: p.tz }, instruction.smartObjectId, instruction.type === 'USE_OBJECT' || instruction.navigation === 'interaction');
        }
        bedConfigurations.push({ index: i, anchor: west.position, points: path.length, revision: nav.getObstacleRevision() });
      }
      nav.resetRoute(route, 'probe');
      return { moves, bedConfigurations, finalPosition: position };
    });
    console.log('Shower / bed integration:', JSON.stringify(interactions));
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('Browser integration passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
