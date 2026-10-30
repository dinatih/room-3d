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
    '../occupancyManager': { OccupancyManager: { hasRoomCapacity: room => room !== checkedRoom || !roomFull }, isInRoom: (room, point) => room === checkedRoom && point.x > 0, LIMITED_ROOMS: ['living', 'bathroom', 'corridor'], ROOM_CAPACITIES: { living: 8, bathroom: 3, corridor: 2 }, ROOM_FOOTPRINTS: {} },
    '../../positionState': { positionState: {} }, '../../furniturePositions': { movingFurniture: new Set() }, './architecture': architecture, './obstacles': obstacles, './geometry': g,
    '../../doorObstacles': doors, './doorRequests': requests, '../agent/agentAvoidance': { limitAgentMovement: (id, start, proposed) => proposed, isAgentDestinationFree: () => true, getAgentObstacles: () => [], beginActorBlockCheck: () => { }, endActorBlockCheck: () => new Map(), actorBlocksUnchanged: () => true },
    './comfort': require('../../src/features/scene/ai/navigation/comfort.ts'), './pathfindingClient': {
      prepareNavigationGraph: definition => { const graph = 'solids' in definition ? queries.buildNavigationGraph(definition) : new g.VisibilityGraph(g.mergeObstacles(definition.obstacles)); let ready = false; graph.definition = definition; graph.findReachable = (start, targets) => targets.find(target => graph.canReach(start, target)) ?? null; return { get pending() { return holdBuilds && !ready; }, retain: () => () => {}, read: () => { if (holdBuilds && !ready) throw new navigationDependencies['./navigationScope'].NavigationPending({ status: 'pending', settled: Promise.resolve(), cancel() {} }); ready = true; return graph; }, cancel() { cancelledGraphs++; } }; },
      readObjectApproach: (graph, query) => queries.objectApproachCandidates(query, graph),
      findPath: (graph, start, target) => { pathRequests++; return graph.find(start, target); },
    }, '../../cameraState': { cameraState },
};
const nav = load('src/features/scene/ai/navigation/service.ts', navigationDependencies);
const loadAvoidance = () => load('src/features/scene/ai/agent/agentAvoidance.ts', {
    '@/devLog': { devLog() {} }, '../../cameraState': { cameraState },
    '../../store/useSceneStore': { useSceneStore: { getState: () => ({ layers: { npcCollisions: true } }) } },
    '../navigation/obstacles': obstacles, '../navigation/geometry': g,
    '../duoSessionManager': { duoSessionManager: { getSessionFor: () => undefined } },
});
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
            assert(g.segmentFree(before, position, [[g.inflate(doors.doorPolygon(key, doors.doorCollisionState[key].angle), obstacles.NAVIGATION_RADIUS_CM)]]), `Crossed ${key} leaf`);
    }
    assert(g.distance(position, target) === 0, `Stopped at ${JSON.stringify(position)}: ${route.waitReason}`);
    nav.resetRoute(route, 'walker');
}
const leaf = { length: 83, thickness: 4, closedDir: { x: 1, z: 0 }, openNormal: { x: 0, z: 1 }, maxAngle: Math.PI / 2, yMin: 0, yMax: 204, margin: 1.5 };
describe('Navigation et portes — géométrie isolée', () => {
    it('attend hors du débattement après dégagement au lieu de reboucler dans la porte de Sabira', () => {
        setup({ bath: { ...leaf, pivot: { x: -41.5, z: 0 } } }, 83);
        doors.doorCollisionState.bath.angle = 0.21765831600078125;
        const route = nav.createRouteState(), target = { x: 0, z: -100 };
        let position = { x: 41.5, z: 27.83034 };
        cameraState.positions.walker = { ...position, y: 0 };
        assert(doors.computeDoorDynamics(doors.DOOR_CONFIGS.bath, doors.doorCollisionState.bath.angle).allowed < Math.PI / 2);
        route.waitReason = "Battant bath sur le trajet, attente d'ouverture";
        try {
            do {
                const next = nav.recoverDoorContact(route, 'walker', position, 3);
                assert(next); position = next;
                cameraState.positions.walker = { ...position, y: 0 };
            } while (route.doorEscape);
            const outside = { ...position };
            assert.equal(doors.computeDoorDynamics(doors.DOOR_CONFIGS.bath, doors.doorCollisionState.bath.angle).allowed, Math.PI / 2, 'Le personnage dégagé ne doit plus retenir la porte');
            for (let frame = 0; frame < 10; frame++) {
                position = nav.followRoute(route, 'walker', position, target, 3);
                assert.deepEqual(position, outside, 'Ne pas rentrer dans l’arc avant que le passage réel soit libre');
                assert(requests.doorRequested('bath'));
            }
            doors.doorCollisionState.bath.angle = Math.PI / 2;
            for (let frame = 0; frame < 200 && g.distance(position, target); frame++) position = nav.followRoute(route, 'walker', position, target, 3);
            assert.deepEqual(position, target, 'Le trajet doit reprendre lorsque la porte est ouverte');
        } finally { delete cameraState.positions.walker; nav.resetRoute(route, 'walker'); }
    });
    it('réutilise le réseau après une révision sans changement de géométrie retenue', () => {
        setup({}, 83);
        const profile = obstacles.getAgentProfile('walker'), graph = nav.getNavigationGraph(profile);
        try {
            obstacles.registerObstacle({ id: 'above-agent', polygon: g.rectangle(0, 0, 40, 40), yMin: 300, yMax: 400 });
            assert.equal(nav.getNavigationGraph(profile), graph, 'An obstacle above the actor must not replace its network');
            obstacles.unregisterObstacle('above-agent');
            assert.equal(nav.getNavigationGraph(profile), graph, 'Removing excluded geometry must preserve the preparation');
            obstacles.registerObstacle({ id: 'above-agent', polygon: g.rectangle(0, 0, 40, 40), yMin: 0, yMax: 200 });
            assert.notEqual(nav.getNavigationGraph(profile), graph, 'A physical change must replace the network');
        } finally { obstacles.unregisterObstacle('above-agent'); }
    });
    it('acquiert le remplacement avant de libérer une préparation encore en cours', () => {
        setup({}, 83);
        const events = [];
        const pending = load('src/features/scene/ai/navigation/service.ts', { ...navigationDependencies,
            './pathfindingClient': { ...navigationDependencies['./pathfindingClient'], prepareNavigationGraph: definition => {
                events.push('prepare');
                const preparation = navigationDependencies['./pathfindingClient'].prepareNavigationGraph(definition);
                return { ...preparation, cancel() { events.push('cancel'); preparation.cancel(); } };
            } },
        });
        holdBuilds = true;
        try {
            const profile = obstacles.getAgentProfile('walker');
            assert.throws(() => pending.getNavigationGraph(profile), navigationDependencies['./navigationScope'].NavigationPending);
            obstacles.registerObstacle({ id: 'replacement-order', polygon: g.rectangle(0, 0, 40, 40), yMin: 0, yMax: 200 });
            assert.throws(() => pending.getNavigationGraph(profile), navigationDependencies['./navigationScope'].NavigationPending);
            assert.deepEqual(events, ['prepare', 'prepare', 'cancel']);
        } finally { holdBuilds = false; obstacles.unregisterObstacle('replacement-order'); obstacles.removeAgentProfile('walker'); }
    });
    for (const crossing of [false, true]) for (const travel of [3, 11]) it(`${crossing ? 'croise à angle droit' : 'anticipe un face-à-face'} sans arrêt (${travel} cm par pas)`, () => {
        setup({}, 83);
        const avoidance = loadAvoidance(), ids = ['walker', 'oncoming'];
        obstacles.setAgentProfile('oncoming', obstacles.getAgentProfile('walker'));
        const actors = ids.map((id, i) => ({ id, position: crossing && i ? { x: 0, z: -10 } : { x: i ? 60 : -60, z: 50 }, target: crossing && i ? { x: 0, z: 110 } : { x: i ? -60 : 60, z: 50 } }));
        try {
            let anticipated = false;
            for (let frame = 0; frame < 200; frame++) {
                for (const a of actors) {
                    cameraState.positions[a.id] = { ...a.position, y: 0 };
                    avoidance.setAgentVelocity(a.id, a.previous ? { x: a.position.x - a.previous.x, z: a.position.z - a.previous.z } : null);
                    a.previous = { ...a.position };
                }
                const next = actors.map(a => {
                    const remaining = g.distance(a.position, a.target);
                    if (!remaining) return a.position;
                    const dx = (a.target.x - a.position.x) / remaining, dz = (a.target.z - a.position.z) / remaining;
                    const s = avoidance.computeSteeringVector(a.id, a.position.x, a.position.z, dx, dz, remaining);
                    if (frame === 0 && s.steerZ !== 0) anticipated = true;
                    const proposed = remaining <= travel ? a.target : { x: a.position.x + s.steerX * travel, z: a.position.z + s.steerZ * travel };
                    const p = avoidance.limitAgentMovement(a.id, a.position, proposed);
                    assert(g.distance(a.position, p) > 0, JSON.stringify({ crossing, travel, frame, actor: a, steering: s }));
                    cameraState.positions[a.id] = { ...p, y: 0 };
                    avoidance.setAgentVelocity(a.id, { x: p.x - a.position.x, z: p.z - a.position.z });
                    return p;
                });
                actors.forEach((a, i) => { a.position = next[i]; });
                assert(!g.pointInRing(actors[0].position, g.inflate([actors[1].position], obstacles.NAVIGATION_RADIUS_CM * 2)), JSON.stringify({ crossing, travel, frame, actors }));
                if (actors.every(a => g.distance(a.position, a.target) === 0)) break;
            }
            assert(crossing || anticipated, 'Avoidance must begin before the former 24 cm limit');
            assert(actors.every(a => g.distance(a.position, a.target) === 0));
        } finally { for (const id of ids) delete cameraState.positions[id]; obstacles.removeAgentProfile('oncoming'); }
    });
    it('calcule un détour de dégagement quand le mobilier interdit toutes les sorties directes', () => {
        setup({ living: { ...leaf, pivot: { x: -41.5, z: 0 } } }, 83);
        const furniture = { id: 'escape-screen', polygon: g.rectangle(0, 25, 100, 4), yMin: 0, yMax: 200 };
        obstacles.registerObstacle(furniture);
        const route = nav.createRouteState();
        route.waitReason = "Battant living sur le trajet, attente d'ouverture";
        let position = { x: -5, z: 15 }, detoured = false;
        try {
            for (let frame = 0; frame < 150; frame++) {
                const next = nav.recoverDoorContact(route, 'walker', position, 3);
                if (!next) break;
                detoured ||= !!route.doorEscape?.path?.length;
                assert(g.segmentFree(position, next, [[g.inflate(furniture.polygon, obstacles.NAVIGATION_RADIUS_CM)], [g.inflate(doors.doorPolygon('living', 0), obstacles.NAVIGATION_RADIUS_CM)]]));
                position = next;
            }
            assert(detoured, 'The escape must use a path around the furniture');
            assert(g.distance(position, { x: -41.5, z: 0 }) > leaf.length);
        } finally { obstacles.unregisterObstacle(furniture.id); nav.resetRoute(route, 'walker'); }
    });
    it('ne dégage pas un battant en entrant dans une pièce déjà pleine', () => {
        setup({ living: { ...leaf, pivot: { x: -41.5, z: 0 } } }, 83);
        checkedRoom = 'bathroom'; roomFull = true;
        navigationDependencies['../occupancyManager'].ROOM_FOOTPRINTS.bathroom = g.rectangle(150, 0, 300, 600);
        const route = nav.createRouteState();
        route.waitReason = "Battant living sur le trajet, attente d'ouverture";
        let position = { x: -5, z: 15 };
        try {
            for (let frame = 0; frame < 100; frame++) {
                const next = nav.recoverDoorContact(route, 'walker', position, 3);
                if (!next) break;
                assert(next.x < 0, 'Recovery entered a full room');
                position = next;
            }
            assert(g.distance(position, { x: -41.5, z: 0 }) > leaf.length, 'A safe escape must still be available');
        } finally { checkedRoom = undefined; roomFull = false; delete navigationDependencies['../occupancyManager'].ROOM_FOOTPRINTS.bathroom; nav.resetRoute(route, 'walker'); }
    });
    it('dégage trois PNJ du battant sans traverser les corps ni le mur, puis reprend les trajets', () => {
        setup({ living: { ...leaf, pivot: { x: -41.5, z: 0 } } }, 83);
        const avoidance = loadAvoidance();
        const recovery = load('src/features/scene/ai/navigation/service.ts', { ...navigationDependencies, '../agent/agentAvoidance': avoidance });
        const ids = ['escape-a', 'escape-b', 'escape-c'];
        const actors = ids.map((id, i) => {
            obstacles.setAgentProfile(id, obstacles.getAgentProfile('walker'));
            const position = { x: -5 + i * 16, z: 15 + i * 12 };
            cameraState.positions[id] = { ...position, y: 0 };
            const route = recovery.createRouteState();
            route.waitReason = "Battant living sur le trajet, attente d'ouverture";
            return { id, position, route, escaped: false };
        });
        try {
            for (let frame = 0; frame < 150; frame++) for (const actor of actors) {
                if (actor.escaped) continue;
                const before = actor.position;
                const next = recovery.recoverDoorContact(actor.route, actor.id, before, 3);
                assert(next, `No escape for ${actor.id}`);
                assert(g.distance(before, next) <= 3 + g.BOOLEAN_PRECISION, 'Recovery must walk, never teleport');
                assert(g.segmentFree(before, next, architecture.architectureObstacles.map(o => [g.inflate(o.polygon, obstacles.NAVIGATION_RADIUS_CM)])), 'Recovery crossed a wall');
                assert(g.segmentFree(before, next, [[g.inflate(doors.doorPolygon('living', 0), obstacles.NAVIGATION_RADIUS_CM)]]), 'Recovery crossed the leaf');
                actor.position = next;
                cameraState.positions[actor.id] = { ...next, y: 0 };
                actor.escaped = !actor.route.doorEscape;
            }
            assert(actors.every(a => a.escaped), JSON.stringify(actors));
            assert.equal(doors.computeDoorDynamics(doors.DOOR_CONFIGS.living, 0).allowed, Math.PI / 2, 'Escaped actors must no longer hold the opening stop');
            for (const actor of actors) {
                assert(requests.doorRequested('living'), 'Keep the opening request while resuming the route');
                actor.route.waitReason = "Battant living sur le trajet, attente d'ouverture";
                assert.equal(recovery.recoverDoorContact(actor.route, actor.id, actor.position, 3), undefined, 'An actor outside the swing must not restart a zero-length escape');
            }
            doors.doorCollisionState.living.angle = Math.PI / 2;
            for (const actor of actors) {
                const target = { x: actor.position.x, z: actor.position.z + 30 };
                for (let frame = 0; frame < 60 && g.distance(actor.position, target); frame++) actor.position = nav.followRoute(actor.route, actor.id, actor.position, target, 3);
                assert.equal(g.distance(actor.position, target), 0, 'The interrupted route must resume');
            }
            doors.doorCollisionState.living.angle = 0;
            const trapped = recovery.createRouteState();
            let position = { x: 0, z: 0 };
            assert(g.pointInRing(position, g.inflate(doors.doorPolygon('living', 0), obstacles.NAVIGATION_RADIUS_CM)));
            for (let frame = 0; frame < 100; frame++) {
                const next = recovery.recoverDoorContact(trapped, 'walker', position, 3);
                if (!next) break;
                assert(g.distance(position, next) <= 3 + g.BOOLEAN_PRECISION);
                position = next;
            }
            assert(!g.pointInRing(position, g.inflate(doors.doorPolygon('living', 0), obstacles.NAVIGATION_RADIUS_CM)), 'An actor already inside a leaf must also escape');
        } finally { for (const id of ids) { delete cameraState.positions[id]; obstacles.removeAgentProfile(id); requests.releaseAgentDoors(id); } }
    });
    it('traverse un PNJ qui bouche un couloir sans traverser les murs', () => {
        setup({}, 83);
        architecture.architectureObstacles.splice(0, architecture.architectureObstacles.length,
            ...[-155, 155].map(x => ({ id: `neck-${x}`, polygon: g.rectangle(x, 0, 290, 80), yMin: 0, yMax: 250 })));
        const avoidance = loadAvoidance(), { NavigationMesh } = require('../../src/features/scene/ai/navigation/mesh.ts');
        const crowded = load('src/features/scene/ai/navigation/service.ts', { ...navigationDependencies,
            '../agent/agentAvoidance': avoidance, './pathfindingClient': { ...navigationDependencies['./pathfindingClient'],
                prepareNavigationGraph: definition => {
                    const graph = 'solids' in definition ? queries.buildNavigationGraph(definition) : new NavigationMesh(g.mergeObstacles(definition.obstacles), definition.surfaces);
                    return { pending: false, read: () => graph, retain: () => () => {}, cancel() {} };
                },
            },
        });
        const route = crowded.createRouteState(), target = { x: 0, z: -100 };
        let position = { x: 0, z: 100 }, crossed = false;
        obstacles.setAgentProfile('blocker', obstacles.getAgentProfile('walker'));
        cameraState.positions.blocker = { x: 0, y: 0, z: 0 };
        cameraState.positions.walker = { ...position, y: 0 };
        try {
            for (let frame = 0; frame < 1000 && g.distance(position, target) > 0; frame++) {
                const before = position;
                position = crowded.followRoute(route, 'walker', position, target, 3);
                assert(g.distance(before, position) > 0 && g.distance(before, position) <= 3 + g.BOOLEAN_PRECISION, 'A blocked detour must continue walking without teleporting');
                assert.equal(route.error, null);
                assert(g.segmentFree(before, position, route.crowd?.base.obstacles ?? route.graph.obstacles), 'Walls must still block every step');
                cameraState.positions.walker = { ...position, y: 0 };
                crossed ||= g.distance(position, cameraState.positions.blocker) < 2 * obstacles.NAVIGATION_RADIUS_CM;
            }
            assert(crossed, 'An impossible detour must allow crossing the actor');
            assert.deepEqual(position, target);
            assert.equal(cameraState.positions.blocker.z, 0);
            crowded.resetRoute(route, 'walker');
            for (let frame = 0; frame < 1000 && g.distance(position, cameraState.positions.blocker) > 0; frame++) {
                const body = cameraState.positions.blocker;
                position = crowded.followRoute(route, 'walker', position, { x: body.x, z: body.z }, 3);
                cameraState.positions.walker = { ...position, y: 0 };
                assert.equal(route.error, null, 'An actor at the destination must never invalidate it');
            }
            assert.deepEqual(position, { x: 0, z: 0 });
        } finally { crowded.resetRoute(route, 'walker'); delete cameraState.positions.walker; delete cameraState.positions.blocker; obstacles.removeAgentProfile('blocker'); }
    });
    it('laisse Vivida et Ybot suivre leurs tangentes sans enfermer les départs au contact après arrondi', () => {
        setup({}, 83);
        const avoidance = loadAvoidance();
        const cases = [
            [{ x: -211.06665584452736, z: -206.72909010546846 }, { x: -216.83606, z: -217.32803 }, { x: -216.83606, z: -204.33932 }, true],
            [{ x: -216.83606, z: -217.32803 }, { x: -211.06665584452736, z: -206.72909010546846 }, { x: -211.06666, z: -219.7178 }, true],
            [{ x: 228.0614667015447, z: -83.23971738885206 }, { x: 239.70823511084012, z: -80 }, { x: 227.55645, z: -80 }, false],
        ];
        obstacles.setAgentProfile('encounter', obstacles.getAgentProfile('walker'));
        try {
            for (const [position, other, tangent, traversable] of cases) {
                cameraState.positions.walker = { ...position, y: 0 };
                cameraState.positions.encounter = { ...other, y: 0 };
                const next = avoidance.limitAgentMovement('walker', position, tangent);
                const footprints = avoidance.getAgentObstacles('walker', position).map(polygon => [polygon]);
                const { NavigationMesh } = require('../../src/features/scene/ai/navigation/mesh.ts');
                const graph = new NavigationMesh(g.mergeObstacles(footprints), [[g.rectangle(0, 0, 2000, 2000)]]);
                assert(graph.canReach(position, position), 'Rounded overlap contours must not enclose the departure');
                if (traversable) assert(g.distance(next, position) > 0, `The computed tangent must remain usable at ${JSON.stringify(position)}`);
                else assert.deepEqual(next, position, 'An obsolete inward detour must still be rejected');
                assert(g.distance(other, g.projectToSegment(other, position, next)) >= avoidance.actorClearance(obstacles.getAgentProfile('walker'), obstacles.getAgentProfile('encounter')) - Math.SQRT2 * g.BOOLEAN_PRECISION);
                assert.deepEqual(avoidance.limitAgentMovement('walker', position, other), position, 'Inward movement must still stop');
            }
        } finally { delete cameraState.positions.walker; delete cameraState.positions.encounter; obstacles.removeAgentProfile('encounter'); }
    });
    it('utilise le même rayon pour les PNJ, murs, meubles et portes malgré un modèle plus large', () => {
        const gap = 4 * obstacles.NAVIGATION_RADIUS_CM;
        setup({ living: { ...leaf, length: gap, thickness: 1, pivot: { x: -gap / 2, z: 0 } } }, gap);
        const profile = obstacles.getAgentProfile('walker'), graph = nav.getNavigationGraph(profile);
        assert(profile.radius > obstacles.NAVIGATION_RADIUS_CM);
        assert.equal(loadAvoidance().actorRadius(profile), obstacles.NAVIGATION_RADIUS_CM);
        assert.equal(obstacles.furnitureClearance(profile), obstacles.NAVIGATION_RADIUS_CM);
        assert(graph.definition.solids.every(solid => solid.radius === obstacles.NAVIGATION_RADIUS_CM));
        doors.doorCollisionState.living.angle = Math.PI / 2;
        walk({ x: 0, z: -50 }, { x: 0, z: 100 }, ['living']);
    });
    it('contourne une pièce de transit pleine puis reprend le chemin direct quand elle se libère', () => {
        setup({}, 83);
        architecture.architectureObstacles.length = 0;
        const footprint = [{ x: -20, z: -40 }, { x: 20, z: -40 }, { x: 20, z: 0 }, { x: 0, z: 0 }, { x: 0, z: 40 }, { x: -20, z: 40 }];
        const isInRoom = (room, point) => room === 'living' && Math.abs(point.x) <= 20 && Math.abs(point.z) <= 40 && (point.x <= 0 || point.z <= 0);
        let full = true;
        const transit = load('src/features/scene/ai/navigation/service.ts', { ...navigationDependencies, '../occupancyManager': {
            ...navigationDependencies['../occupancyManager'], isInRoom, ROOM_FOOTPRINTS: { living: footprint },
            OccupancyManager: { hasRoomCapacity: room => room !== 'living' || !full },
        } });
        const route = transit.createRouteState(), target = { x: 100, z: 0 };
        let position = { x: -100, z: 0 };
        try {
            const budget = Math.ceil((g.distance(position, target) + 2 * (40 + 80)) / 3) + footprint.length;
            for (let frame = 0; frame < budget && g.distance(position, target) > 0; frame++) {
                const before = position;
                position = transit.followRoute(route, 'walker', position, target, 3);
                assert(!isInRoom('living', position), 'A detour must respect the occupied room boundary');
                assert(g.distance(position, before) > 0, route.waitReason);
                if (route.crowd?.graph) assert(!g.insideObstacle({ x: 5, z: 5 }, route.crowd.graph.obstacles), 'The room concavity must leave the adjoining corridor free');
            }
            assert.deepEqual(position, target);
            transit.resetRoute(route, 'walker');
            position = transit.followRoute(route, 'walker', { x: -100, z: 0 }, target, 3);
            assert(route.crowd);
            full = false;
            transit.followRoute(route, 'walker', position, target, 3);
            assert.equal(route.crowd, undefined, 'An available room restores the shorter static route');
        } finally { transit.resetRoute(route, 'walker'); }
    });
    it('sépare Alex et Rajaa au contact relevé pendant la simulation à 25 PNJ', () => {
        setup({}, 83);
        architecture.architectureObstacles.length = 0;
        const surfaces = architecture.walkableSurfaces.splice(0, architecture.walkableSurfaces.length, [g.rectangle(0, 0, 2000, 2000)]);
        const avoidance = loadAvoidance();
        const crowded = load('src/features/scene/ai/navigation/service.ts', { ...navigationDependencies, '../agent/agentAvoidance': avoidance });
        const actors = [
            { id: 'walker', position: { x: 249.43726991434085, z: -413.99102991434086 }, target: { x: 400, z: -300 }, route: crowded.createRouteState() },
            { id: 'encounter', position: { x: 250.52280797221866, z: -412.24813860307967 }, target: { x: -300, z: -200 }, route: crowded.createRouteState() },
        ];
        obstacles.setAgentProfile('encounter', obstacles.getAgentProfile('walker'));
        actors.forEach(actor => { cameraState.positions[actor.id] = { ...actor.position, y: 0 }; });
        try {
            for (const actor of actors) {
                const other = actors.find(other => other !== actor);
                assert.deepEqual(avoidance.limitAgentMovement(actor.id, actor.position, other.position), actor.position, 'Deepening the body overlap must remain forbidden');
                const before = actor.position;
                actor.position = crowded.followRoute(actor.route, actor.id, actor.position, actor.target, 3);
                cameraState.positions[actor.id] = { ...actor.position, y: 0 };
                if (g.distance(before, actor.position) === 0) {
                    const next = crowded.followRoute(actor.route, actor.id, actor.position, actor.target, 3);
                    assert(g.distance(next, actor.position) > 0, `${actor.id} remains blocked after a ready detour: ${JSON.stringify({ position: actor.position, others: cameraState.positions, path: actor.route.path, obstacles: avoidance.getAgentObstacles(actor.id, actor.position) })}`);
                    assert(g.distance(next, other.position) >= g.distance(actor.position, other.position) - Math.SQRT2 * g.BOOLEAN_PRECISION);
                }
            }
        } finally {
            actors.forEach(actor => { crowded.resetRoute(actor.route, actor.id); delete cameraState.positions[actor.id]; });
            obstacles.removeAgentProfile('encounter');
            architecture.walkableSurfaces.splice(0, architecture.walkableSurfaces.length, ...surfaces);
        }
    });
    it('rafraîchit une ancienne pose de porte avant de déclarer toutes les approches inaccessibles', () => {
        const { NavigationScope, NavigationPending } = navigationDependencies['./navigationScope'];
        const moving = navigationDependencies['../../furniturePositions'].movingFurniture;
        for (const furnitureMoving of [false, true]) {
            setup({ living: { ...leaf, pivot: { x: -41.5, z: 0 } } }, 83);
            requests.protectDoor('living', 'storage', { x: -1.5, z: 60, y: 0, radius: 13.3, height: 170 });
            const scope = new NavigationScope(), profile = obstacles.getAgentProfile('walker');
            const old = nav.getNavigationGraph(profile), angle = doors.computeDoorAllowedAngle(doors.DOOR_CONFIGS.living);
            const start = { x: -41.5 + Math.cos(angle) * leaf.length / 2, z: Math.sin(angle) * leaf.length / 2 };
            const target = { x: 20, z: 100 };
            assert(!old.canReach(start, start));
            try {
                assert.throws(() => scope.run(() => {
                    assert.equal(nav.getNavigationGraph(profile), old);
                    throw new NavigationPending({ status: 'pending', settled: Promise.resolve(), cancel() {} });
                }), NavigationPending);
                if (furnitureMoving) moving.add('unrelated-moving-furniture');
                requests.releaseAgentDoors('storage');
                const point = scope.run(() => nav.getObjectApproach('free-target', target, 'walker', start));
                assert(point, 'An old closed leaf must not strand an actor in a currently open passage');
                assert(nav.getNavigationGraph(profile).canReach(start, point));
            } finally { moving.clear(); scope.clear(); requests.releaseAgentDoors('storage'); }
        }
    });
    it('partage le même réseau pour les écarts flottants du même gabarit sans réduire les dimensions', () => {
        setup({}, 83);
        const radii = [13.265273447935224, 13.265273447935268, 13.265273447935357];
        try {
            radii.forEach((radius, i) => obstacles.setAgentProfile(`same-body-${i}`, { radius, height: 173.4 }));
            const profile = obstacles.getAgentProfile('same-body-0'), graph = nav.getNavigationGraph(profile);
            radii.forEach((radius, i) => {
                assert.equal(obstacles.getAgentProfile(`same-body-${i}`), profile);
                assert(profile.radius >= radius && profile.radius - radius <= g.BOOLEAN_PRECISION);
                assert.equal(nav.getNavigationGraph(obstacles.getAgentProfile(`same-body-${i}`)), graph);
            });
            obstacles.setAgentProfile('same-body-0', profile);
            assert.equal(obstacles.getAgentProfile('same-body-0'), profile, 'Canonical profiles must not grow when registered again');
        } finally { radii.forEach((_, i) => obstacles.removeAgentProfile(`same-body-${i}`)); }
    });

    it('avance au contact pendant la préparation d’un détour puis utilise le détour disponible', () => {
        setup({}, 83);
        architecture.architectureObstacles.length = 0;
        const avoidance = loadAvoidance();
        let limitStep = false;
        const crowded = load('src/features/scene/ai/navigation/service.ts', { ...navigationDependencies, '../agent/agentAvoidance': { ...avoidance,
            limitAgentMovement: (id, start, proposed) => limitStep && g.distance(start, proposed) <= 3 + g.BOOLEAN_PRECISION ? start : avoidance.limitAgentMovement(id, start, proposed),
        } });
        const route = crowded.createRouteState(), target = { x: 100, z: -100 };
        let position = { x: -100, z: -100 };
        obstacles.setAgentProfile('blocker', obstacles.getAgentProfile('walker'));
        cameraState.positions.blocker = { x: 0, y: 0, z: -100 };
        cameraState.positions.walker = { ...position, y: 0 };
        try {
            assert(crowded.planRoute(route, 'walker', position, target));
            position = crowded.followRoute(route, 'walker', position, target, 3);
            cameraState.positions.walker = { ...position, y: 0 };
            const readyPreparation = route.crowd.preparation, waypoint = route.path[route.index];
            obstacles.setAgentProfile('distant', obstacles.getAgentProfile('walker'));
            cameraState.positions.distant = { x: 200, y: 0, z: 200 };
            for (const z of [190, 180]) {
                cameraState.positions.distant.z = z;
                limitStep = true;
                position = crowded.followRoute(route, 'walker', position, target, 3);
                limitStep = false;
                cameraState.positions.walker = { ...position, y: 0 };
                assert.equal(route.crowd.preparation, readyPreparation, 'A distant moving actor must not rebuild a safe detour');
            }
            cameraState.positions.blocker.x += 1;
            position = crowded.followRoute(route, 'walker', position, target, 3);
            cameraState.positions.walker = { ...position, y: 0 };
            assert.equal(route.crowd.preparation, readyPreparation, 'A moved obstacle that leaves the detour free must preserve it');
            cameraState.positions.blocker = { x: (position.x + waypoint.x) / 2, y: 0, z: (position.z + waypoint.z) / 2 };
            holdBuilds = true;
            const beforeRenewal = position;
            position = crowded.followRoute(route, 'walker', position, target, 3);
            assert.notEqual(route.crowd.preparation, readyPreparation, 'An obstruction of a remaining segment must replace the detour');
            assert(g.distance(position, beforeRenewal) > 0);
            cameraState.positions.walker = { ...position, y: 0 };
            for (let frame = 0; frame < 10; frame++) {
                const before = position, preparation = route.crowd?.preparation;
                position = crowded.followRoute(route, 'walker', position, target, 3);
                assert(g.distance(position, before) > 0, 'A future collision must not stop the free current step');
                assert.equal(route.waitReason, undefined);
                if (preparation) assert.equal(route.crowd.preparation, preparation);
                cameraState.positions.walker = { ...position, y: 0 };
            }
            const footprints = avoidance.getAgentObstacles('walker', position).map(polygon => [polygon]);
            position = footprints[0][0].reduce((a, b) => a.x < b.x ? a : b);
            cameraState.positions.walker = { ...position, y: 0 };
            const crossing = crowded.followRoute(route, 'walker', position, target, 3);
            assert(g.distance(crossing, position) > 0, 'A pending actor detour must not pause the walker at contact');
            assert.equal(route.waitReason, undefined);
            holdBuilds = false;
            crowded.followRoute(route, 'walker', position, target, 3);
            const budget = route.path.reduce((frames, point, i) => frames + Math.ceil(g.distance(i ? route.path[i - 1] : position, point) / 3), 0);
            for (let frame = 0; frame <= budget && g.distance(position, target) > 0; frame++) {
                const before = position;
                position = crowded.followRoute(route, 'walker', position, target, 3);
                assert(g.distance(before, position) > 0, `A ready detour must progress: ${route.waitReason}`);
                assert(g.segmentFree(before, position, footprints));
                cameraState.positions.walker = { ...position, y: 0 };
            }
            assert.deepEqual(position, target);
        } finally {
            holdBuilds = false; crowded.resetRoute(route, 'walker');
            delete cameraState.positions.blocker; delete cameraState.positions.walker;
            obstacles.removeAgentProfile('blocker');
            delete cameraState.positions.distant; obstacles.removeAgentProfile('distant');
        }
    });
    it('quitte le contact de Sandra aux coordonnées du blocage de David', () => {
        setup({}, 83);
        architecture.architectureObstacles.length = 0;
        const avoidance = loadAvoidance();
        const start = { x: 498.3174969946046, z: -298.91871689634644 }, target = { x: 500, z: -100 };
        cameraState.positions.walker = { ...start, y: 0 };
        cameraState.positions.sandra = { x: 500, z: -300, y: 0 };
        obstacles.setAgentProfile('sandra', obstacles.getAgentProfile('walker'));
        const surfaces = architecture.walkableSurfaces.splice(0, architecture.walkableSurfaces.length, [g.rectangle(0, 0, 2000, 2000)]);
        const crowded = load('src/features/scene/ai/navigation/service.ts', { ...navigationDependencies, '../agent/agentAvoidance': avoidance });
        const route = crowded.createRouteState();
        try {
            assert.deepEqual(avoidance.limitAgentMovement('walker', start, target), target, 'Separating from contact must remain possible');
            assert.deepEqual(avoidance.limitAgentMovement('walker', start, cameraState.positions.sandra), start, 'Entering the same body must still be blocked');
            let position = start;
            for (let frame = 0; frame < Math.ceil(g.distance(start, target) / 3); frame++) {
                const next = crowded.followRoute(route, 'walker', position, target, 3);
                assert(g.distance(next, target) < g.distance(position, target), 'Every step must progress without another detour');
                position = next;
                cameraState.positions.walker = { ...position, y: 0 };
            }
            assert.deepEqual(position, target);
            assert.equal(route.crowd, undefined);
        } finally {
            crowded.resetRoute(route, 'walker');
            architecture.walkableSurfaces.splice(0, architecture.walkableSurfaces.length, ...surfaces);
            delete cameraState.positions.walker; delete cameraState.positions.sandra;
            obstacles.removeAgentProfile('sandra');
        }
    });
    it('choisit une place libre au sol pour atterrir près d’un PNJ ou de sa destination réservée', () => {
        setup({}, 83);
        architecture.architectureObstacles.length = 0;
        const avoidance = loadAvoidance();
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
    it('anticipe la porte avant sa zone de rotation et la libère lorsque le trajet change', () => {
        setup({ living: { ...leaf, pivot: { x: -41.5, z: 0 } } }, 83);
        const route = nav.createRouteState(), start = { x: 20, z: -200 }, target = { x: 20, z: 100 };
        try {
            assert(nav.planRoute(route, 'walker', start, target));
            route.path.unshift({ x: 20, z: -100 });
            const next = nav.followRoute(route, 'walker', start, target, 3);
            assert(g.distance(next, start) > 0);
            assert.equal(requests.doorRequested('living'), true, 'The next crossing must open while the actor is still approaching');
            const nearby = { x: 20, z: -50 };
            route.path.shift();
            const approaching = nav.followRoute(route, 'walker', nearby, target, 3);
            assert(g.distance(approaching, nearby) > 0, 'Opening anticipation must still allow movement before contact');
            assert.equal(requests.doorRequested('living'), true);
            nav.followRoute(route, 'walker', start, target, 3);
            assert.equal(requests.doorRequested('living'), true, 'A detour must not close a door still needed by the route');
            nav.followRoute(route, 'walker', start, { x: 20, z: -250 }, 3);
            assert.equal(requests.doorRequested('living'), false, 'A changed route must release an unused opening');
            assert.equal(route.waitReason, undefined);
        } finally { nav.resetRoute(route, 'walker'); }
    });

    it('traverse sans arrêt une porte animée par le ressort réel dans les deux sens', () => {
        const { useDoorSpring } = load('src/features/scene/items/useDoorSpring.ts', {
            react: { useRef: value => ({ current: value }) },
            '@react-three/fiber': { useThree: () => ({ invalidate() {} }) },
        });
        for (const speed of [60, 180]) for (const side of [-1, 1]) {
            setup({ living: { ...leaf, pivot: { x: -41.5, z: 0 } } }, 83);
            const route = nav.createRouteState(), spring = useDoorSpring(), dt = 1 / 60;
            let position = { x: 20, z: side * 200 };
            const target = { x: 20, z: -side * 200 };
            try {
                assert(nav.planRoute(route, 'walker', position, target));
                const budget = route.path.reduce((frames, point, i) => frames + Math.ceil(g.distance(i ? route.path[i - 1] : position, point) / (speed * dt)), 0);
                for (let frame = 0; frame <= budget && g.distance(position, target) > 0; frame++) {
                    const before = position;
                    position = nav.followRoute(route, 'walker', position, target, speed * dt);
                    assert.equal(route.error, null);
                    assert(!route.waitReason, `${speed} cm/s, side ${side}, frame ${frame}: ${route.waitReason}`);
                    assert(g.distance(before, position) > 0, 'An anticipated opening must not stop the actor');
                    assert(g.segmentFree(before, position, [[g.inflate(doors.doorPolygon('living', doors.doorCollisionState.living.angle), obstacles.NAVIGATION_RADIUS_CM)]]), 'The actor must never cross the actual leaf');
                    doors.doorCollisionState.living.angle = spring(doors.doorCollisionState.living.angle, requests.doorRequested('living') ? Math.PI / 2 : 0, dt, 0, Math.PI / 2);
                }
                assert.deepEqual(position, target);
                assert.equal(requests.doorRequested('living'), false, 'The cleared opening must close again');
            } finally { nav.resetRoute(route, 'walker'); }
        }
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
            const barrier = g.rectangle(position.x + 4 / 2 + obstacles.NAVIGATION_RADIUS_CM + g.CLEARANCE_ERROR, position.z, 4, 40);
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
            const contact = load('src/features/scene/ai/navigation/service.ts', { ...navigationDependencies,
                '../agent/agentAvoidance': { ...navigationDependencies['../agent/agentAvoidance'], limitAgentMovement: (_id, start) => start } });
            assert.deepEqual(contact.followRoute(contact.createRouteState(), 'walker', { x: 0, z: -100 }, target, 3), { x: 0, z: -100 },
                'Crossing an actor must still respect room admission even when contact clips the step before the entrance');
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
        assert(!g.pointInRing(storage, g.inflate(doors.doorPolygon('living', limit), obstacles.NAVIGATION_RADIUS_CM)), 'Door entered protected navigation footprint');
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
        assert.equal(doors.getDoorLimitDiagnostics('glassRight').angle, right);
        assert.deepEqual(doors.getDoorLimitDiagnostics('glassRight').contacts.map(contact => contact.protection), [...requests.getDoorProtections('glassRight')]);
        doors.doorCollisionState.glassLeft.angle = -left;
        doors.doorCollisionState.glassRight.angle = right;
        walk({ x: -30, z: -50 }, { x: -30, z: 100 }, ['glassLeft', 'glassRight']);
        assert.equal([...requests.getDoorProtections('glassLeft')].length, 1, 'Glass leaves share the protected footprint');
        requests.releaseAgentDoors('storage');
        console.log('Double door: one protected partial leaf leaves the other passage usable', right * 180 / Math.PI);
        assert.equal(doors.getDoorLimitDiagnostics('glassRight').angle, Math.PI / 2);
        assert.deepEqual(doors.getDoorLimitDiagnostics('glassRight').contacts, []);
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
