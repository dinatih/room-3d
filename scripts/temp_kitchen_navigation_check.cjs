const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }, fileName: filename,
  });
  module._compile(outputText, filename);
};
const g = require('../src/features/scene/ai/navigation/geometry.ts');
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
requestDoor('bath', 'a'); assert.equal(requestDoor('bath', 'b'), false);
releaseDoor('bath', 'a'); assert.equal(requestDoor('bath', 'b'), true);
releaseAgentDoors('b'); assert.equal(doorRequested('bath'), false);
console.log('Geometry checks passed: shortest route, direct routes, inflation, rotation, overlaps, holes, invalid targets, FIFO door reservations.');

if (process.argv.includes('--browser')) (async () => {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('console', message => { if (message.text().startsWith('Controlled exit:') || message.text().startsWith('Agent trace:') || message.type() === 'error') console.log('CONSOLE:', message.text()); });
    page.on('requestfailed', request => console.log('REQUEST:', request.url(), request.failure()?.errorText));
    page.on('pageerror', error => { errors.push(error.message); console.error('PAGE:', error.message); });
    await page.goto(`${process.env.ROOM_TEST_URL || 'http://127.0.0.1:5186'}/AGENTS.md`);
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
      const { useAgentController } = await import('/src/features/scene/ai/useAgentController.ts');
      const { resetAppIdle } = await import('/src/features/scene/idleState.ts');
      window.resolveCoords = (await import('/src/features/scene/ai/agent/agentInstructionCoords.ts')).resolveInstructionCoords;
      window.smartObjects = await import('/src/features/scene/ai/smartObjectRegistry.ts');
      window.furnitureState = await import('/src/features/scene/furniturePositions.ts');
      window.positionState = (await import('/src/features/scene/positionState.ts')).positionState;
      window.cameraState = (await import('/src/features/scene/cameraState.ts')).cameraState;
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
        e(React.Suspense, { fallback: null }, e(placements.Equipment), e(placements.Furniture), e(placements.Furnishings), e(placements.Decor), e(DoorsPlacement),
          e(Character, { ...native, modelPath: native.path, targetHeight: native.height, isLara: true, isActive: false, isNPC: false, scenario: null }))));
    });
    await page.waitForFunction(() => window.nav?.furnitureObstacles.size > 25 && window.nav.hasAgentProfile('native'), { timeout: 60000 }).catch(async error => { console.log('Readiness:', await page.evaluate(() => ({ ids: [...window.nav.furnitureObstacles.keys()], native: window.nav.hasAgentProfile('native'), scene: window.fixtureScene.children.map(c => c.name), agent: window.agent.getStatus() }))); throw error; });
    console.log('Scene assets ready:', await page.evaluate(() => ({ profile: window.nav.getAgentProfile('native'), obstacles: window.nav.furnitureObstacles.size })));
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
