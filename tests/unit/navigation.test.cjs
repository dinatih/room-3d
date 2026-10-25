const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');
const g = require('../../src/features/scene/ai/navigation/geometry.ts');
const obstacles = require('../../src/features/scene/ai/navigation/obstacles.ts');
const requests = require('../../src/features/scene/ai/navigation/doorRequests.ts');
const cameraState = { positions: {} };
const doors = load('src/features/scene/doorObstacles.ts', {
    './cameraState': { cameraState }, './ai/navigation/obstacles': obstacles, './ai/navigation/geometry': g, './ai/navigation/doorRequests': requests,
    './wallData': { pX: () => 0, pZ: () => 0, BATH_WEST_WALL: 0, SHOWER_SOUTH_WALL: 0, DiagWall: { p: () => ({ x: 1000, z: 1000 }), door: { start: 0, width: 90 }, rotY: 0 } },
});
const architecture = { architectureObstacles: [], walkableSurfaces: [[g.rectangle(0, 0, 600, 600)]] };
const queries = require('../../src/features/scene/ai/navigation/queries.ts');
let pathRequests = 0, cancelledGraphs = 0, holdBuilds = false;
let roomFull = false, checkedRoom;
const navigationDependencies = {
    '@/devLog': { devLog() {}, DEV_LOG_ENABLED: false },
    './navigationScope': require('../../src/features/scene/ai/navigation/navigationScope.ts'),
    '../occupancyManager': { OccupancyManager: { hasRoomCapacity: () => !roomFull }, isInRoom: (room, point) => room === checkedRoom && point.x > 0, LIMITED_ROOMS: ['living', 'bathroom', 'corridor'], ROOM_CAPACITIES: { living: 8, bathroom: 3, corridor: 2 } },
    '../../positionState': { positionState: {} }, '../../furniturePositions': { movingFurniture: new Set() }, './architecture': architecture, './obstacles': obstacles, './geometry': g,
    '../../doorObstacles': doors, './doorRequests': requests, '../agent/agentAvoidance': { limitAgentMovement: (id, start, proposed) => proposed, isAgentDestinationFree: () => true, getAgentObstacles: () => [], beginActorBlockCheck: () => { }, endActorBlockCheck: () => new Map(), actorBlocksUnchanged: () => true },
    './comfort': require('../../src/features/scene/ai/navigation/comfort.ts'), './pathfindingClient': {
      prepareNavigationGraph: definition => { const graph = 'solids' in definition ? queries.buildNavigationGraph(definition) : new g.VisibilityGraph(g.mergeObstacles(definition.obstacles)); graph.definition = definition; graph.findReachable = (start, targets) => targets.find(target => graph.canReach(start, target)) ?? null; return { retain: () => () => {}, read: () => { if (holdBuilds) throw new navigationDependencies['./navigationScope'].NavigationPending({ status: 'pending', settled: Promise.resolve(), cancel() {} }); return graph; }, cancel() { cancelledGraphs++; } }; },
      readObjectApproach: (graph, query) => queries.objectApproachCandidates(query, graph),
      findPath: (graph, start, target) => { pathRequests++; return graph.find(start, target); },
    }, '../../cameraState': { cameraState },
};
const nav = load('src/features/scene/ai/navigation/service.ts', navigationDependencies);
function setup(active, gap) {
    for (const [key, door] of Object.entries(doors.DOOR_CONFIGS)) {
        requests.releaseAgentDoors('walker');
        requests.releaseAgentDoors('storage');
        door.pivot = { x: 1000, z: 1000 };
        doors.doorCollisionState[key].angle = 0;
    }
    architecture.architectureObstacles.splice(0, architecture.architectureObstacles.length, { id: 'left-wall', polygon: g.rectangle(-300, 0, 600 - gap, 4), yMin: 0, yMax: 250 }, { id: 'right-wall', polygon: g.rectangle(300, 0, 600 - gap, 4), yMin: 0, yMax: 250 });
    // A new registration invalidates the door limits after fixture changes.
    obstacles.registerObstacle({ id: 'revision-marker', polygon: g.rectangle(1000, 1000, 1, 1), yMin: 0, yMax: 1 });
    obstacles.unregisterObstacle('revision-marker');
    obstacles.removeAgentProfile('walker');
    obstacles.setAgentProfile('walker', { radius: 13.3, height: 170 });
    for (const [key, config] of Object.entries(active))
        Object.assign(doors.DOOR_CONFIGS[key], config);
    requests.protectDoor('entry', 'revision', { x: 1000, z: 1000, y: 0, radius: 1, height: 1 });
    requests.releaseAgentDoors('revision');
}
function walk(start, target, keys, steer) {
    const route = nav.createRouteState();
    let position = start;
    for (let i = 0; i < 1000 && g.distance(position, target) !== 0; i++) {
        const before = position;
        position = nav.followRoute(route, 'walker', position, target, 3, steer);
        assert.equal(route.error, null, route.error || '');
        for (const key of keys)
            assert(g.segmentFree(before, position, [[g.inflate(doors.doorPolygon(key, doors.doorCollisionState[key].angle), 13.3 + doors.DOOR_CONFIGS[key].margin)]]), `Crossed ${key} leaf`);
    }
    assert(g.distance(position, target) === 0, `Stopped at ${JSON.stringify(position)}: ${route.waitReason}`);
    nav.resetRoute(route, 'walker');
}
const leaf = { length: 83, thickness: 4, closedDir: { x: 1, z: 0 }, openNormal: { x: 0, z: 1 }, maxAngle: Math.PI / 2, yMin: 0, yMax: 204, margin: 1.5 };
describe('Navigation et portes — géométrie isolée', () => {
    it('choisit une place libre au sol pour atterrir près d’un PNJ ou de sa destination réservée', () => {
        setup({}, 83);
        architecture.architectureObstacles.length = 0;
        const avoidance = load('src/features/scene/ai/agent/agentAvoidance.ts', {
            '@/devLog': { devLog() {} },
            '../../cameraState': { cameraState }, '../../store/useSceneStore': { useSceneStore: { getState: () => ({ layers: { npcCollisions: true } }) } },
            '../navigation/obstacles': obstacles, '../navigation/geometry': g, '../duoSessionManager': { duoSessionManager: { getSessionFor: () => undefined } },
        });
        const crowded = load('src/features/scene/ai/navigation/service.ts', { ...navigationDependencies, '../agent/agentAvoidance': avoidance });
        const goal = { x: -100, z: -200 };
        obstacles.setAgentProfile('sandra', obstacles.getAgentProfile('walker'));
        cameraState.positions.walker = { ...goal, y: 2500 };
        try {
            for (const reserved of [false, true]) {
                cameraState.positions.sandra = { x: reserved ? 100 : goal.x, z: goal.z, y: 0 };
                avoidance.reserveAgentDestination('sandra', reserved ? goal : null);
                assert.equal(avoidance.isAgentDestinationFree('walker', goal), false);
                const target = crowded.getObjectApproach('duo-zone', goal, 'walker');
                assert(target, reserved ? 'A reservation must offer a neighbouring landing point' : 'Landing must consider actors on the ground');
                assert(avoidance.isAgentDestinationFree('walker', target));
                assert(g.distance(target, goal) <= avoidance.actorClearance({}, {}) + g.CLEARANCE_ERROR);
                if (reserved) assert.equal(avoidance.getAgentObstacles('walker', { x: -150, z: -200 }).length, 0, 'Ground reservations must not become bodies at the flying actor’s altitude');
            }
        } finally {
            avoidance.reserveAgentDestination('sandra', null);
            delete cameraState.positions.sandra; delete cameraState.positions.walker;
            obstacles.removeAgentProfile('sandra');
        }
    });
    it('ouvre la prochaine porte seulement à proximité et libère la demande si le PNJ recule', () => {
        setup({ living: { ...leaf, pivot: { x: -41.5, z: 0 } } }, 83);
        const route = nav.createRouteState(), start = { x: 20, z: -200 }, target = { x: 20, z: 100 };
        try {
            assert(nav.planRoute(route, 'walker', start, target));
            route.path.unshift({ x: 20, z: -100 });
            const next = nav.followRoute(route, 'walker', start, target, 3);
            assert(g.distance(next, start) > 0);
            assert.equal(requests.doorRequested('living'), false, 'A known path must not open a distant door');
            const nearby = { x: 20, z: -50 };
            route.path.shift();
            const approaching = nav.followRoute(route, 'walker', nearby, target, 3);
            assert(g.distance(approaching, nearby) > 0, 'Opening anticipation must still allow movement before contact');
            assert.equal(requests.doorRequested('living'), true, 'A nearby actor must request the next opening');
            nav.followRoute(route, 'walker', start, target, 3);
            assert.equal(requests.doorRequested('living'), false, 'Moving away must release the opening even when the route still crosses it');
            assert.equal(route.waitReason, undefined);
        } finally { nav.resetRoute(route, 'walker'); }
    });

    it('résout une nouvelle activité et quitte un canapé sans propriétaire de départ mémorisé', () => {
        setup({}, 83);
        architecture.architectureObstacles.length = 0;
        const start = { x: -100, z: -50 }, goal = { x: 100, z: -50 };
        const route = nav.createRouteState();
        const coords = load('src/features/scene/ai/agent/agentInstructionCoords.ts', {
            '../aiTypes': {}, '../navigation/service': nav, '../navigation/obstacles': obstacles,
            '../navigation/doorRequests': requests, '../../cameraState': { cameraState },
            '../navigation/destinations': {}, '../smartObjectRegistry': { getSmartObject: () => ({
                id: 'next-activity', name: 'Next activity', category: 'storage', position: [goal.x, 0, goal.z], rotationY: 0,
                slots: [{ slotId: 'use', offset: [goal.x, 0, goal.z] }],
            }) }, '../../animations/animationResolver': { resolveSlotAnimation: () => null }, './agentTypes': {},
        });
        obstacles.registerObstacle({ id: 'departure-sofa', owner: 'departure-sofa', polygon: g.rectangle(start.x, start.z, 60, 60), yMin: 0, yMax: 90 });
        obstacles.registerObstacle({ id: 'next-activity', owner: 'next-activity', polygon: g.rectangle(goal.x, goal.z, 40, 40), yMin: 0, yMax: 90 });
        try {
            for (const rememberedOwner of [undefined, 'old-unrelated-object']) {
                const target = coords.resolveInstructionCoords({ type: 'MOVE_TO', smartObjectId: 'next-activity', slotId: 'use' }, null, 'walker', start, rememberedOwner);
                const destination = { x: target.tx, z: target.tz };
                assert(!g.insideObstacle(destination, nav.getNavigationGraph(obstacles.getAgentProfile('walker')).obstacles));
                let position = start;
                for (let frame = 0; frame < 1000 && g.distance(position, destination) > 0; frame++) {
                    position = nav.followRoute(route, 'walker', position, destination, 3, undefined, target.owner);
                    assert.equal(route.error, null);
                }
                assert.deepEqual(position, destination, 'The actor must actually exit the sofa and reach the next activity');
                nav.resetRoute(route, 'walker');
            }
        } finally {
            nav.resetRoute(route, 'walker');
            obstacles.unregisterObstacle('departure-sofa'); obstacles.unregisterObstacle('next-activity');
        }
    });

    it('termine une accessibilité sur le même graphe malgré des reconstructions par d’autres acteurs', () => {
        setup({}, 83);
        architecture.architectureObstacles.length = 0;
        const { NavigationScope, NavigationPending, navigationQuery } = navigationDependencies['./navigationScope'];
        const scope = new NavigationScope(), released = [], jobs = [];
        let built = 0;
        const stable = load('src/features/scene/ai/navigation/service.ts', { ...navigationDependencies, './pathfindingClient': {
            ...navigationDependencies['./pathfindingClient'],
            prepareNavigationGraph(definition) {
                const id = ++built, graph = queries.buildNavigationGraph(definition);
                let users = 1;
                graph.definition = definition;
                graph.canReach = () => navigationQuery(`reach:${id}`, () => {
                    const job = { description: 'reach', status: 'pending', settled: Promise.resolve(), cancel() {} };
                    jobs.push(job); return job;
                });
                const release = () => { if (--users === 0) released.push(id); };
                return { read: () => graph, retain: () => { users++; return release; }, cancel: release };
            },
        } });
        const profile = obstacles.getAgentProfile('walker');
        const operation = () => stable.getNavigationGraph(profile).canReach({ x: -100, z: 0 }, { x: 100, z: 0 });
        try {
            assert.throws(() => scope.run(operation), NavigationPending);
            for (let change = 0; change < 3; change++) {
                obstacles.registerObstacle({ id: 'remote-snapshot-change', polygon: g.rectangle(change * 10, 200, 4, 4), yMin: 0, yMax: 250 });
                stable.getNavigationGraph(profile);
                assert.throws(() => scope.run(operation), NavigationPending);
            }
            assert.equal(jobs.length, 1, 'The same accessibility query must not restart for each global revision');
            assert(!released.includes(1), 'An active operation still owns its original graph');
            jobs[0].status = 'ready'; jobs[0].result = true;
            assert.equal(scope.run(operation), true);
            assert(released.includes(1), 'Completion releases the obsolete graph');
        } finally { scope.clear(); obstacles.unregisterObstacle('remote-snapshot-change'); }
    });

    it('continue un trajet libre pendant une reconstruction partagée et l’attente d’un autre acteur', () => {
        setup({}, 83);
        architecture.architectureObstacles.length = 0;
        obstacles.setAgentProfile('waiting', obstacles.getAgentProfile('walker'));
        const route = nav.createRouteState(), waiting = nav.createRouteState();
        const target = { x: 100, z: -50 }, blockedStart = { x: -100, z: 100 }, blockedTarget = { x: 0, z: 100 };
        try {
            obstacles.registerObstacle({ id: 'remote-obstacle', polygon: g.rectangle(0, 100, 40, 40), yMin: 0, yMax: 250 });
            nav.followRoute(waiting, 'waiting', blockedStart, blockedTarget, 3);
            assert(waiting.error, 'The remote actor must really be blocked');
            let position = nav.followRoute(route, 'walker', { x: -100, z: -50 }, target, 3);
            const path = route.path, cancelled = cancelledGraphs;
            holdBuilds = true;
            obstacles.registerObstacle({ id: 'unrelated-rebuild', polygon: g.rectangle(0, 200, 40, 40), yMin: 0, yMax: 250 });
            for (let frame = 0; frame < 3; frame++) {
                assert.deepEqual(nav.followRoute(waiting, 'waiting', blockedStart, blockedTarget, 3), blockedStart);
                const before = position;
                position = nav.followRoute(route, 'walker', position, target, 3);
                assert(g.distance(before, position) > 0, 'An unrelated pending graph must not stop this actor');
                assert.equal(route.path, path);
                assert.equal(cancelledGraphs, cancelled, 'The graph still serving existing paths must stay alive until its replacement is ready');
            }
            const barrier = g.rectangle(position.x + 8, position.z, 4, 40);
            obstacles.registerObstacle({ id: 'live-barrier', polygon: barrier, yMin: 0, yMax: 250 });
            assert.deepEqual(nav.followRoute(route, 'walker', position, target, 3), position, 'Live geometry must stop an unsafe step before the worker replies');
            assert.match(route.waitReason, /géométrie actuelle/);
            holdBuilds = false;
            const next = nav.followRoute(route, 'walker', position, target, 3);
            assert(g.distance(position, next) > 0, 'A blocked route must replan once its graph is ready');
            assert(g.segmentFree(position, next, [[g.inflate(barrier, obstacles.furnitureClearance(obstacles.getAgentProfile('walker')))]]));
        } finally {
            holdBuilds = false;
            nav.resetRoute(route, 'walker'); nav.resetRoute(waiting, 'waiting');
            obstacles.removeAgentProfile('waiting');
            for (const id of ['remote-obstacle', 'unrelated-rebuild', 'live-barrier']) obstacles.unregisterObstacle(id);
        }
    });

    it('peut démarrer et finir une approche d’objet pendant le mouvement d’un meuble éloigné', () => {
        setup({}, 83);
        architecture.architectureObstacles.length = 0;
        const moving = navigationDependencies['../../furniturePositions'].movingFurniture;
        const route = nav.createRouteState(), target = { x: 0, z: -50 };
        obstacles.registerObstacle({ id: 'interaction-object', owner: 'interaction-object', polygon: g.rectangle(0, -50, 40, 40), yMin: 0, yMax: 250 });
        moving.add('distant-furniture');
        try {
            let position = { x: -80, z: -50 };
            for (let frame = 0; frame < 100 && g.distance(position, target) > 0; frame++) {
                const before = position;
                position = nav.followRoute(route, 'walker', position, target, 3, undefined, 'interaction-object', true);
                assert.equal(route.error, null);
                assert(g.distance(before, position) > 0, route.waitReason);
            }
            assert.deepEqual(position, target, 'A remote furniture animation must not hold an actor in front of their object');
        } finally {
            moving.delete('distant-furniture'); nav.resetRoute(route, 'walker'); obstacles.unregisterObstacle('interaction-object');
        }
    });

    it('entre dans le WC depuis son approche explicite sans détour latéral', () => {
        setup({}, 83);
        architecture.architectureObstacles.length = 0;
        obstacles.registerObstacle({ id: 'test-toilet', owner: 'test-toilet', polygon: g.rectangle(0, 0, 40, 70), yMin: 0, yMax: 85 });
        const target = { x: 0, z: 10 }, approach = { x: 0, z: 63 };
        const route = nav.createRouteState();
        route.approach = approach;
        route.interactionTarget = target;
        try {
            let position = approach;
            while (g.distance(position, target) > 0) {
                const previous = position;
                position = nav.followRoute(route, 'walker', position, target, 3, undefined, 'test-toilet', true);
                assert.equal(route.error, null);
                assert.equal(position.x, 0, 'L’approche frontale ne doit pas être recalculée sur le côté du WC');
                assert(g.distance(position, target) < g.distance(previous, target), 'Chaque pas progresse vers la cuvette');
            }
        } finally { nav.resetRoute(route, 'walker'); obstacles.unregisterObstacle('test-toilet'); }
    });

    for (const room of ['living', 'bathroom', 'corridor']) it(`attend hors de la pièce pleine (${room}) puis reprend sans bloquer les sorties`, () => {
        setup({}, 83);
        architecture.architectureObstacles.length = 0;
        const route = nav.createRouteState(), target = { x: 9, z: -100 };
        checkedRoom = room; roomFull = true;
        try {
            let position = nav.followRoute(route, 'walker', { x: -3, z: -100 }, target, 3);
            assert.equal(position.x, 0);
            const planned = pathRequests;
            position = nav.followRoute(route, 'walker', position, target, 3);
            assert.equal(position.x, 0);
            assert.match(route.waitReason, { living: /Séjour complet \(8 PNJ\)/, bathroom: /Salle de bains complète \(3 personnages\)/, corridor: /Couloir complet \(2 personnages\)/ }[room]);
            assert.equal(route.error, null);
            roomFull = false;
            position = nav.followRoute(route, 'walker', position, target, 3);
            assert.equal(position.x, 3);
            assert.equal(pathRequests, planned, 'Admission must resume the existing path');
            roomFull = true;
            position = nav.followRoute(route, 'walker', position, { x: -3, z: -100 }, 6);
            assert.equal(position.x, -3, 'Leaving a full room must remain possible');
        } finally { checkedRoom = undefined; roomFull = false; nav.resetRoute(route, 'walker'); }
    });
    it('conserve un trajet encore libre après modification et recalcule si un obstacle le coupe', () => {
        setup({}, 83);
        architecture.architectureObstacles.length = 0;
        const route = nav.createRouteState(), target = { x: 100, z: -50 };
        let position = nav.followRoute(route, 'walker', { x: -100, z: -50 }, target, 3);
        const planned = pathRequests, originalPath = route.path;
        try {
            obstacles.registerObstacle({ id: 'unrelated-change', polygon: g.rectangle(0, 100, 40, 40), yMin: 0, yMax: 250 });
            const before = position;
            position = nav.followRoute(route, 'walker', position, target, 3);
            assert.equal(pathRequests, planned, 'An unrelated obstacle must not restart the path search');
            assert.equal(route.path, originalPath);
            assert(g.distance(before, position) > 0, 'Safe movement must continue');
            obstacles.registerObstacle({ id: 'blocking-change', polygon: g.rectangle(0, -50, 40, 40), yMin: 0, yMax: 250 });
            position = nav.followRoute(route, 'walker', position, target, 3);
            assert.equal(pathRequests, planned + 1, 'A blocked segment must trigger a new search');
            assert.notEqual(route.path, originalPath);
            const remaining = [position, ...route.path.slice(route.index)];
            assert(remaining.every((p, i) => !i || g.segmentFree(remaining[i - 1], p, route.graph.obstacles)), 'Replanned path must avoid the new obstacle');
        } finally {
            nav.resetRoute(route, 'walker');
            obstacles.unregisterObstacle('unrelated-change');
            obstacles.unregisterObstacle('blocking-change');
        }
    });
    it("attend devant le battant fermé puis traverse son ouverture partielle", () => {
        setup({ living: { ...leaf, pivot: { x: -41.5, z: 0 } } }, 83);
        const storage = { x: -1.5, z: 60, y: 0, radius: 13.3, height: 170 };
        requests.protectDoor('living', 'storage', storage);
        const revision = requests.getDoorProtectionRevision();
        for (let i = 0; i < 100; i++)
            requests.protectDoor('living', 'storage', storage);
        assert.equal(requests.getDoorProtectionRevision(), revision, 'A stationary interaction must not invalidate the graph every frame');
        const limit = doors.computeDoorAllowedAngle(doors.DOOR_CONFIGS.living);
        assert(limit > 0 && limit < Math.PI / 2, `Expected partial opening, got ${limit}`);
        requests.requestDoor('living', 'walker');
        assert(requests.doorRequested('living'));
        assert(!g.pointInRing(storage, g.inflate(doors.doorPolygon('living', limit), storage.radius + leaf.margin)), 'Door entered protected body');
        doors.doorCollisionState.living.angle = limit;
        walk({ x: 20, z: -50 }, { x: 20, z: 100 }, ['living']);
        const blockedRoute = nav.createRouteState();
        doors.doorCollisionState.living.angle = 0;
        const start = { x: 20, z: -50 };
        let next = start;
        for (let i = 0; i < 100 && !blockedRoute.waitReason; i++)
            next = nav.followRoute(blockedRoute, 'walker', next, { x: 20, z: 100 }, 3);
        assert.equal(blockedRoute.error, null);
        assert(/Battant/.test(blockedRoute.waitReason), 'Must wait on the real closed leaf');
        nav.resetRoute(blockedRoute, 'walker');
        requests.releaseAgentDoors('storage');
        assert.equal(doors.computeDoorAllowedAngle(doors.DOOR_CONFIGS.living), Math.PI / 2);
        console.log('Living door: partial protected opening passes; actual closed leaf still blocks; stable geometry cache passed', limit * 180 / Math.PI);
    });
    it("traverse la double porte et protège la pose Kallax jusqu’à la sortie", () => {
        setup({ glassLeft: { ...leaf, length: 75, thickness: 5.5, margin: 3, pivot: { x: -75, z: 0 } }, glassRight: { ...leaf, length: 75, thickness: 5.5, margin: 3, pivot: { x: 75, z: 0 }, closedDir: { x: -1, z: 0 } } }, 150);
        requests.protectDoor('glassRight', 'storage', { x: 40, z: 50, y: 0, radius: 13.3, height: 170 });
        const left = doors.computeDoorAllowedAngle(doors.DOOR_CONFIGS.glassLeft), right = doors.computeDoorAllowedAngle(doors.DOOR_CONFIGS.glassRight);
        assert.equal(left, Math.PI / 2);
        assert(right > 0 && right < Math.PI / 2);
        doors.doorCollisionState.glassLeft.angle = -left;
        doors.doorCollisionState.glassRight.angle = right;
        walk({ x: -30, z: -50 }, { x: -30, z: 100 }, ['glassLeft', 'glassRight']);
        assert.equal([...requests.getDoorProtections('glassLeft')].length, 1, 'Glass leaves share the protected footprint');
        requests.releaseAgentDoors('storage');
        console.log('Double door: one protected partial leaf leaves the other passage usable', right * 180 / Math.PI);
        // Coordinate resolution protects the interaction pose and retains it while exiting.
        const coords = load('src/features/scene/ai/agent/agentInstructionCoords.ts', {
            '../aiTypes': {}, '../navigation/service': nav, '../navigation/obstacles': obstacles, '../navigation/doorRequests': requests, '../../cameraState': { cameraState },
            '../navigation/destinations': { getZoneDestination: () => ({ x: 0, z: 100 }) }, '../smartObjectRegistry': { getSmartObject: () => ({ id: 'storage-fixture', name: 'Storage', category: 'storage', position: [0, 0, 100], rotationY: 0, slots: [{ slotId: 'use', offset: [40, 0, 50] }] }) },
            '../../animations/animationResolver': { resolveSlotAnimation: () => null }, './agentTypes': {},
        });
        coords.resolveInstructionCoords({ type: 'MOVE_TO', smartObjectId: 'storage-fixture', slotId: 'use', protectedDoor: 'glassRight' }, null, 'walker', { x: -30, z: 100 });
        const protectedPoint = [...requests.getDoorProtections('glassRight')][0];
        assert.equal(protectedPoint.x, 40);
        assert.equal(protectedPoint.z, 50);
        coords.resolveInstructionCoords({ type: 'MOVE_TO', smartObjectId: 'storage-fixture', slotId: 'use', doorKey: 'glassRight', protectedDoor: 'glassRight' }, null, 'walker', { x: -30, z: 100 });
        assert.deepEqual([...requests.getDoorProtections('glassRight')][0], protectedPoint, 'Exit must keep the interaction footprint until clear');
        requests.releaseAgentDoors('walker');
        console.log('Interaction coordinates: protected pose registered and retained through exit');
    });
    it("libère la protection après échec et ne recalcule pas sans changement", () => {
        // Failed routes release their footprint without invalidating their own failure
        // on every frame, and restore the footprint when a route can be retried.
        setup({ living: { ...leaf, pivot: { x: -41.5, z: 0 } } }, 83);
        const storage = { x: -1.5, z: 60, y: 0, radius: 13.3, height: 170 };
        requests.protectDoor('living', 'walker', storage);
        const failedRoute = nav.createRouteState(), failedStart = { x: 20, z: -50 }, invalidGoal = { x: 1000, z: 0 };
        nav.followRoute(failedRoute, 'walker', failedStart, invalidGoal, 3, undefined, undefined, false, 'living');
        assert(failedRoute.error);
        assert.equal(requests.getAgentDoorProtection('living', 'walker'), undefined);
        const failure = failedRoute.failure;
        nav.followRoute(failedRoute, 'walker', failedStart, invalidGoal, 3, undefined, undefined, false, 'living');
        assert.equal(failedRoute.failure, failure, 'Released protection must not trigger its own route retry');
        doors.doorCollisionState.living.angle = doors.computeDoorAllowedAngle(doors.DOOR_CONFIGS.living);
        nav.followRoute(failedRoute, 'walker', failedStart, { x: 20, z: 100 }, 3, undefined, undefined, false, 'living');
        assert.equal(failedRoute.error, null);
        assert.deepEqual(requests.getAgentDoorProtection('living', 'walker'), storage);
        nav.resetRoute(failedRoute, 'walker');
        console.log('Failed interaction route: stable failure cache, released protection restored on retry');
    });
    it("termine quinze trajets malgré un steering latéral persistant", () => {
        // Even with a lateral avoidance force, the actual route must finish its final
        // step rather than orbit its waypoint forever in unobstructed space.
        setup({}, 83);
        architecture.architectureObstacles.length = 0;
        for (let actor = 0; actor < 15; actor++) {
            walk({ x: 0, z: actor }, { x: 50, z: actor }, [], direction => {
                const x = direction.x - direction.z, z = direction.z + direction.x, length = Math.hypot(x, z);
                return { x: x / length, z: z / length };
            });
        }
        console.log('15 open-space routes: persistent lateral steering still reaches each exact waypoint');
    });
    it('détecte la réintroduction du steering responsable de la rotation sans fin', () => {
        setup({}, 83);
        architecture.architectureObstacles.length = 0;
        const sourceLine = 'const steered = step === remaining ? direction : steer?.(direction, remaining) ?? direction;';
        const broken = load('src/features/scene/ai/navigation/service.ts', navigationDependencies, source => {
            assert(source.includes(sourceLine), 'Mutation no longer matches the production source');
            return source.replace(sourceLine, 'const steered = steer?.(direction, remaining) ?? direction;').replace('const step = Math.min(travel, remaining);', 'const step = travel;');
        });
        const route = broken.createRouteState(), target = { x: 50, z: 0 };
        let position = { x: 0, z: 0 };
        // Same finite budget as the working regression; the old bug keeps orbiting.
        for (let frame = 0; frame < 1000; frame++)
            position = broken.followRoute(route, 'walker', position, target, 3, direction => {
                const x = direction.x - direction.z, z = direction.z + direction.x, length = Math.hypot(x, z);
                return { x: x / length, z: z / length };
            });
        assert.throws(() => assert.deepEqual(position, target, 'Destination not reached'), /Destination not reached/);
        broken.resetRoute(route, 'walker');
    });
});
