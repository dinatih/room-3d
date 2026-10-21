// Imported by Vite inside the loaded apartment; these are the production modules.
import { resolveNavigation } from '/src/features/scene/ai/navigation/navigationScope.ts';
import * as nav from '/src/features/scene/ai/navigation/service.ts';
import * as profiles from '/src/features/scene/ai/navigation/obstacles.ts';
import * as requests from '/src/features/scene/ai/navigation/doorRequests.ts';
import * as doors from '/src/features/scene/doorObstacles.ts';
import * as registry from '/src/features/scene/ai/smartObjectRegistry.ts';
import * as avoidance from '/src/features/scene/ai/agent/agentAvoidance.ts';
import * as geometry from '/src/features/scene/ai/navigation/geometry.ts';
import { getZoneDestination } from '/src/features/scene/ai/navigation/destinations.ts';
import { cameraState } from '/src/features/scene/cameraState.ts';
import { pathfindingStats } from '/src/features/scene/ai/navigation/pathfindingClient.ts';
export const check = (condition, message) => { if (!condition)
    throw Error(message); };
export const trace = entry => window.__testTrace.push({ at: performance.now(), ...entry });
const nextTask = () => new Promise(resolve => setTimeout(resolve, 0));
const register = (id, fixture) => profiles.setAgentProfile(id, fixture.profile);
const release = id => {
    requests.releaseAgentDoors(id);
    avoidance.reserveAgentDestination(id, null);
    delete cameraState.positions[id];
    profiles.removeAgentProfile(id);
    profiles.navigationDebug.delete(id);
};
export async function walk(actors, fixture, steering, onFrame) {
    const began = performance.now();
    for (const a of actors) {
        a.route ??= nav.createRouteState();
        a.yaw ??= 0;
        a.turn ??= 0;
    }
    while (actors.some(a => !a.arrived)) {
        check(performance.now() - began < fixture.timeoutMs, `Trajet interrompu: ${JSON.stringify(actors.map(a => ({ id: a.id, position: a.position, error: a.route.error, wait: a.route.waitReason })))}`);
        if (onFrame)
            await onFrame();
        // Publish all positions before advancing any actor, so the frame is concurrent.
        for (const a of actors)
            cameraState.positions[a.id] = { ...a.position, y: 0, yaw: a.yaw };
        for (const a of actors) {
            if (a.arrived)
                continue;
            const before = a.position;
            a.position = nav.followRoute(a.route, a.id, before, a.target, fixture.travelCmPerFrame, (direction, remaining) => {
                if (steering)
                    return steering(direction);
                const s = avoidance.computeSteeringVector(a.id, before.x, before.z, direction.x, direction.z, remaining);
                return { x: s.steerX, z: s.steerZ };
            });
            check(!a.route.error, `${a.id}: ${a.route.error}`);
            if (geometry.distance(before, a.position) > 0) {
                const yaw = avoidance.computeRotYStep(a.yaw, Math.atan2(a.position.x - before.x, a.position.z - before.z), fixture.turnSpeed, fixture.dt);
                a.turn += Math.abs(yaw - a.yaw);
                a.yaw = yaw;
            }
            a.arrived = geometry.distance(a.position, a.target) === 0;
            if (a.wait !== a.route.waitReason) {
                a.wait = a.route.waitReason;
                trace({ actor: a.id, wait: a.wait ?? null });
            }
        }
        await nextTask(); // Yield to the actual pathfinding worker, not a simulated planner.
    }
    return actors.map(a => ({ id: a.id, position: a.position, target: a.target, arrived: a.arrived, turn: a.turn }));
}
export async function arrival(fixture) {
    const ids = Array.from({ length: fixture.actors }, (_, i) => `suite-walker-${i}`), blocker = 'suite-occupant';
    const actors = [];
    try {
        for (const id of [...ids, blocker])
            register(id, fixture);
        const start = await resolveNavigation(() => getZoneDestination(fixture.startZone, ids[0]));
        const graph = await resolveNavigation(() => nav.getNavigationGraph(profiles.getAgentProfile(ids[0])));
        const target = fixture.arrivalOffsets
            .map(d => ({ x: start.x + d.x, z: start.z + d.z })).find(p => geometry.segmentFree(start, p, graph.obstacles));
        check(target, 'No clear garden segment');
        if (fixture.occupied)
            cameraState.positions[blocker] = { ...target, y: 0, yaw: 0 };
        for (const [i, id] of ids.entries())
            actors.push({ id, route: nav.createRouteState(), position: { ...(fixture.crossing && i === 1 ? target : start) }, target: fixture.crossing && i === 1 ? start : target });
        trace({ instructions: actors.map(a => ({ actor: a.id, type: 'MOVE_TO', start: a.position, target: a.target })), occupied: fixture.occupied, avoidanceScale: avoidance.ACTOR_AVOIDANCE_SCALE });
        check(avoidance.ACTOR_AVOIDANCE_SCALE === 0, 'This regression specifically covers zero actor footprints');
        return { actors: await walk(actors, fixture), avoidanceScale: avoidance.ACTOR_AVOIDANCE_SCALE };
    }
    finally {
        for (const a of actors)
            nav.resetRoute(a.route, a.id);
        for (const id of [...ids, blocker])
            release(id);
    }
}
export async function locomotion(fixture) {
    const { createAgentController, resetAgentDeployment, NAVIGATION_WAIT_ANIMATION } = await import('/src/features/scene/ai/agentController.ts');
    const { resolveAnimationId } = await import('/src/features/scene/animations/animationResolver.ts');
    const { APP_LOG_HISTORY } = await import('/src/features/ui/AppConsole.tsx');
    const actors = Array.from({ length: fixture.actors }, (_, i) => ({ id: `suite-locomotion-${i}` }));
    const marker = 'suite-locomotion-revision', objectId = 'suite-locomotion-object';
    let invalidated = false, waits = 0, continued = 0;
    try {
        for (const actor of actors) register(actor.id, fixture);
        const start = await resolveNavigation(() => getZoneDestination('garden', actors[0].id));
        const graph = await resolveNavigation(() => nav.getNavigationGraph(profiles.getAgentProfile(actors[0].id)));
        const target = fixture.arrivalOffsets.map(d => ({ x: start.x + d.x, z: start.z + d.z }))
            .find(p => geometry.segmentFree(start, p, graph.obstacles));
        check(target, 'No clear locomotion test segment');
        registry.SMART_OBJECTS[objectId] = { id: objectId, name: 'Locomotion target', category: 'outdoor', ownerCharacterId: actors[0].id,
            position: [target.x, 0, target.z], rotationY: 0, slots: [{ slotId: 'use', name: 'Approach', offset: [target.x, 0, target.z], animation: 'idle' }] };
        for (const actor of actors) {
            const scenario = [
                { type: 'WAIT', duration: fixture.dt, animation: 'idle', targetPos: [start.x, 0, start.z] },
                { type: 'MOVE_TO', ...(actor === actors[0] ? { smartObjectId: objectId, slotId: 'use' } : { targetPos: [target.x, 0, target.z] }) },
                { type: 'MOVE_TO', targetZoneId: 'garden' },
                { type: 'WAIT', targetZoneId: 'garden', animation: 'sad-idle', duration: fixture.dt * 4 },
            ];
            actor.controller = createAgentController(actor.id, scenario, false, () => ({ ...start, y: 0, rotY: 0 }));
            actor.controller.configure({ scenario, loop: false, landingAnim: 'pistol-kneel-to-stand' });
            actor.close = actor.controller.connect();
        }
        const deadline = performance.now() + fixture.timeoutMs;
        while (actors.some(a => a.controller.getStatus() !== 'FINISHED')) {
            check(performance.now() < deadline, '27 locomotion controllers did not finish');
            for (const actor of actors) {
                // Prepare every route before injecting the shared revision.
                if (!invalidated && actor.moved) continue;
                const before = { ...actor.controller.state };
                const state = actor.controller.update(fixture.dt);
                const moved = state.x !== before.x || state.z !== before.z;
                if (actor.verifyNextAdvance) {
                    check(moved, `${actor.id} stopped for a remote geometry revision`);
                    actor.verifyNextAdvance = false; continued++;
                }
                if (actor.controller.getStatus() === 'INTERACTING') {
                    check(resolveAnimationId(state.animation) === resolveAnimationId('sad-idle'), `${actor.id} entered interaction before its animation was initialized`);
                    actor.interactionFrames = (actor.interactionFrames ?? 0) + 1;
                }
                if (['MOVING', 'IDLE'].includes(actor.controller.getStatus()) && !moved) {
                    const expected = actor.controller.getStatus() === 'MOVING' ? [NAVIGATION_WAIT_ANIMATION] : [resolveAnimationId('idle'), NAVIGATION_WAIT_ANIMATION];
                    check(expected.includes(resolveAnimationId(state.animation)), `${actor.id} walks without moving: ${state.animation}`);
                    if (resolveAnimationId(state.animation) === NAVIGATION_WAIT_ANIMATION)
                        check(APP_LOG_HISTORY.some(entry => entry.actors.includes(actor.id) && ['nav_waiting', 'nav_blocked'].includes(entry.action)), `${actor.id} entered navigation idle without a reason in the console`);
                    waits++;
                }
                if (moved) {
                    actor.moved = true;
                    if (actor.controller.getStatus() === 'MOVING')
                        check(![resolveAnimationId('idle'), NAVIGATION_WAIT_ANIMATION].includes(resolveAnimationId(state.animation)), `${actor.id} did not resume its walk while moving`);
                }
            }
            if (!invalidated && actors.every(a => a.moved)) {
                profiles.registerObstacle({ id: marker, polygon: geometry.rectangle(10000, 10000, 1, 1), yMin: 0, yMax: 1 });
                invalidated = true;
                for (const actor of actors) actor.verifyNextAdvance = true;
            }
            await nextTask();
        }
        check(invalidated && waits > 0 && continued === fixture.actors, `Missing independent advances: ${continued}/${fixture.actors}`);
        check(actors.every(a => a.interactionFrames >= 3), 'An asynchronous interaction skipped its duration');
        return { count: actors.length, waits, continued, invalidated };
    }
    finally {
        profiles.unregisterObstacle(marker);
        delete registry.SMART_OBJECTS[objectId];
        for (const actor of actors) { actor.close?.(); release(actor.id); resetAgentDeployment(actor.id); }
    }
}
export async function reachability(fixture) {
    const id = 'suite-accessibility';
    register(id, fixture);
    try {
        const snapshot = await resolveNavigation(() => nav.getNavigationGraph(profiles.getAgentProfile(id)));
        const garden = await resolveNavigation(() => getZoneDestination('garden', id));
        const living = await resolveNavigation(() => getZoneDestination('living', id, garden));
        const corridor = await resolveNavigation(() => getZoneDestination('corridor', id, living));
        const starts = [garden, living, corridor];
        // Use the registered interaction positions and physical corners, not
        // manually selected easy routes. Some targets must remain inaccessible.
        const targets = fixture.objects.flatMap(objectId => {
            const object = registry.getSmartObject(objectId);
            check(object, 'Missing reachability fixture object: ' + objectId);
            const point = { x: object.position[0], z: object.position[2] };
            const corner = snapshot.obstacles.flat(2).reduce((nearest, p) => geometry.distance(p, point) < geometry.distance(nearest, point) ? p : nearest);
            return [point, corner];
        });
        targets.push(...starts);
        const queries = starts.flatMap(start => targets.map(target => ({ start, target })));
        const construction = [];
        check(Number.isInteger(snapshot.id) && !(snapshot instanceof geometry.VisibilityGraph), 'Expected a worker snapshot without main-thread search caches');
        for (let repetition = 0; repetition < 3; repetition++) {
            for (const implementation of repetition % 2 ? ['after', 'before'] : ['before', 'after']) {
                const began = performance.now();
                const graph = new geometry.VisibilityGraph(snapshot.obstacles, snapshot.comfort);
                // Reproduce the previous constructor's eager preparation exactly.
                if (implementation === 'before') graph.clearances = graph.vertices.map(point => graph.comfortField.clearance(point));
                construction.push({ repetition, implementation, ms: performance.now() - began,
                    vertices: graph.vertices.length, preparedDistances: graph.clearances.length });
                check(graph.canReach(garden, living), 'Graph construction changed physical connectivity');
            }
            await nextTask();
        }
        const passes = [];
        for (let repetition = 0; repetition < 3; repetition++) {
            const implementations = repetition % 2 ? ['after', 'before'] : ['before', 'after'];
            const answers = {};
            for (const implementation of implementations) {
                // Before reproduces the previous canReach implementation exactly;
                // all geometry, queries and the physical planner are unchanged.
                const graph = new geometry.VisibilityGraph(snapshot.obstacles);
                for (const phase of ['cold', 'warm']) {
                    const durations = [], found = [];
                    for (const { start, target } of queries) {
                        const began = performance.now();
                        found.push(implementation === 'before' ? graph.find(start, target) !== null : graph.canReach(start, target));
                        durations.push(performance.now() - began);
                    }
                    answers[implementation + '-' + phase] = found;
                    passes.push({ repetition, implementation, phase, queries: queries.length,
                        totalMs: durations.reduce((sum, value) => sum + value, 0), maxMs: Math.max(...durations),
                        reachable: found.filter(Boolean).length });
                }
                await nextTask();
            }
            for (const phase of ['cold', 'warm']) check(JSON.stringify(answers['before-' + phase]) === JSON.stringify(answers['after-' + phase]), 'Accessibility changed in actual apartment: ' + phase);
        }
        trace({ test: 'approach-reachability', passes });
        return { vertices: snapshot.obstacles.flat(2).length, queries: queries.length, construction, passes };
    }
    finally { release(id); }
}
export async function door(fixture) {
    const holder = 'suite-holder', id = 'suite-passage', route = nav.createRouteState();
    let liveActor;
    const angles = Object.fromEntries(Object.entries(doors.doorCollisionState).map(([key, state]) => [key, state.angle]));
    try {
        register(holder, fixture);
        register(id, fixture);
        const object = registry.getSmartObject(fixture.objectId);
        check(object, `Missing ${fixture.objectId}`);
        const sequence = registry.buildSmartObjectInstructionSequence(fixture.objectId, object.slots[0].slotId, holder);
        trace({ actor: holder, instructions: sequence });
        const approach = sequence.find(i => i.type === 'MOVE_TO' && i.protectedDoor && !i.doorKey);
        check(approach, 'Missing protected Kallax approach');
        check(!sequence.some(i => i.type === 'WAIT' && i.doorKey), 'Interaction must permit a partial opening');
        const key = approach.protectedDoor;
        const { mountKallaxActor } = await import('./interactions.mjs');
        liveActor = await mountKallaxActor(holder, fixture, await resolveNavigation(() => getZoneDestination('living', holder)));
        const deadline = performance.now() + fixture.timeoutMs;
        let pose;
        while (true) {
            check(performance.now() < deadline, 'Kallax interaction did not become ready');
            pose = await liveActor.tick();
            cameraState.positions[holder] = { x: pose.x, y: pose.y, z: pose.z, yaw: pose.rotY };
            if (pose.status === 'INTERACTING' && requests.getAgentDoorProtection(key, holder))
                break;
            await nextTask();
        }
        const limit = doors.computeDoorAllowedAngle(doors.DOOR_CONFIGS[key]);
        check(limit > 0 && limit < Math.PI / 2, 'Expected a partially protected leaf');
        trace({ actor: holder, status: pose.status, animation: pose.animation, protectedDoor: key, model: liveActor.model });
        const start = await resolveNavigation(() => getZoneDestination(key === 'living' ? 'corridor' : 'garden', id));
        const target = await resolveNavigation(() => getZoneDestination('living', id, start));
        const actors = await walk([{ id, route, position: start, target }], fixture, undefined, async () => {
            const state = await liveActor.tick();
            cameraState.positions[holder] = { x: state.x, y: state.y, z: state.z, yaw: state.rotY };
        });
        check(requests.getAgentDoorProtection(key, holder), 'Lost interaction protection during passage');
        return { actors, sequence, pose, protectedDoor: key, angleDegrees: limit * 180 / Math.PI };
    }
    finally {
        liveActor?.close();
        nav.resetRoute(route, id);
        release(holder);
        release(id);
        for (const [key, angle] of Object.entries(angles))
            doors.doorCollisionState[key].angle = angle;
    }
}
export async function unreachable(fixture) {
    const id = 'suite-unreachable', route = nav.createRouteState();
    const obstacleId = 'suite-sealed-target';
    try {
        register(id, fixture);
        const start = await resolveNavigation(() => getZoneDestination('garden', id)), target = { x: start.x + 100, z: start.z };
        profiles.registerObstacle({ id: obstacleId, polygon: geometry.rectangle(target.x, target.z, 40, 40), yMin: 0, yMax: 250 });
        requests.requestDoor('living', id);
        trace({ actor: id, instructions: [{ type: 'MOVE_TO', start, target }], expected: 'explicit-error' });
        const deadline = performance.now() + fixture.timeoutMs;
        while (!route.error) {
            check(performance.now() < deadline, 'Impossible route did not fail');
            nav.followRoute(route, id, start, target, 3);
            await nextTask();
        }
        const failure = route.failure, submitted = pathfindingStats.submitted;
        check(failure, 'Failure must be cached');
        for (let i = 0; i < 100; i++)
            nav.followRoute(route, id, start, target, 3);
        check(route.failure === failure && pathfindingStats.submitted === submitted, 'Impossible route recomputed on unchanged frames');
        check(!requests.doorRequested('living'), 'Failed route retained a passage');
        return { error: route.error, failureCached: true, additionalSearches: pathfindingStats.submitted - submitted };
    }
    finally {
        nav.resetRoute(route, id);
        profiles.unregisterObstacle(obstacleId);
        release(id);
    }
}
export async function closedDoor(fixture) {
    // Isolate leaf motion from the render loop while retaining apartment geometry.
    const id = 'suite-closed-door', route = nav.createRouteState();
    register(id, fixture);
    const { movingFurniture } = await import('/src/features/scene/furniturePositions.ts');
    const descriptor = Object.getOwnPropertyDescriptor(doors.doorCollisionState.living, 'angle');
    let angle = 0;
    Object.defineProperty(doors.doorCollisionState.living, 'angle', { configurable: true, get: () => angle, set: () => { } });
    try {
        const config = doors.DOOR_CONFIGS.living;
        const mid = { x: config.pivot.x + config.closedDir.x * config.length / 2, z: config.pivot.z + config.closedDir.z * config.length / 2 };
        const start = { x: mid.x - config.openNormal.x * fixture.doorDistances.before, z: mid.z - config.openNormal.z * fixture.doorDistances.before };
        const target = { x: mid.x + config.openNormal.x * fixture.doorDistances.after, z: mid.z + config.openNormal.z * fixture.doorDistances.after };
        let position = start;
        const deadline = performance.now() + fixture.timeoutMs;
        while (!route.waitReason?.startsWith('Battant')) {
            check(performance.now() < deadline, `No explained leaf wait: ${route.waitReason}; moving=${[...movingFurniture]}`);
            position = nav.followRoute(route, id, position, target, 3);
            check(!route.error, route.error);
            await nextTask();
        }
        const reason = route.waitReason;
        trace({ actor: id, expectedWait: reason, instructions: [{ type: 'MOVE_TO', start, target }, { synchronization: 'open-leaf-after-explained-wait' }] });
        angle = doors.computeDoorAllowedAngle(config);
        const actors = await walk([{ id, route, position, target }], fixture);
        return { reason, actors };
    }
    finally {
        Object.defineProperty(doors.doorCollisionState.living, 'angle', descriptor);
        nav.resetRoute(route, id);
        release(id);
    }
}
