import { positionState } from '../../positionState';
import { movingFurniture } from '../../furniturePositions';
import { architectureObstacles, walkableSurfaces } from './architecture';
import { furnitureObstacles, getObstacleRevision, furnitureClearance, furnitureFootprint, getAgentProfile, navigationDebug, agentProfileLifecycle, type AgentProfile } from './obstacles';
import { inflate, rectangle, pointInRing, insideObstacle, segmentFree, distance, type Point, type Polygon } from './geometry';
import { DOOR_CONFIGS, computeDoorAllowedAngle, doorCollisionState, glassShutterState, doorPolygon } from '../../doorObstacles';
import { requestDoor, releaseDoor, releaseAgentDoors, doorOpeningKey, getAgentDoorProtection, protectDoor, type DoorKey, type DoorProtection } from './doorRequests';
import { limitAgentMovement, isAgentDestinationFree, getAgentObstacles, beginActorBlockCheck, endActorBlockCheck, actorBlocksUnchanged, type ActorBlockers } from '../agent/agentAvoidance';
import { NAVIGATION_COMFORT_CM } from './comfort';
import type { GraphDefinition, ApproachRegion } from './queries';
import { NavigationScope, NavigationPending, navigationValue, getNavigationScope } from './navigationScope';
import { findPath, prepareNavigationGraph, readObjectApproach, type NavigationGraph } from './pathfindingClient';
import { OccupancyManager, isInRoom, LIMITED_ROOMS, ROOM_CAPACITIES } from '../occupancyManager';

export { architectureObstacles };
export const doorKeys = Object.keys(DOOR_CONFIGS) as DoorKey[];
export class NavigationBlockedError extends Error {
  actorBlockers: ActorBlockers = new Map();
  constructor(message: string, readonly target: Point) { super(message); this.name = 'NavigationBlockedError'; }
}
// Keep only the closed pose and the latest moving pose, never every angle
// visited during an animation. Equal agent profiles share these footprints.
const doorFootprints = new WeakMap<AgentProfile, Map<DoorKey, { closed: Polygon[][]; angle: number; actual: Polygon[][] }>>();
function doorFootprint(profile: AgentProfile, key: DoorKey, angle = 0): Polygon[][] {
  let footprints = doorFootprints.get(profile);
  if (!footprints) { footprints = new Map(); doorFootprints.set(profile, footprints); }
  let footprint = footprints.get(key);
  if (!footprint) {
    const closed = [[inflate(doorPolygon(key, 0), profile.radius + DOOR_CONFIGS[key].margin)]];
    footprint = { closed, angle: 0, actual: closed };
    footprints.set(key, footprint);
  }
  if (angle === 0) return footprint.closed;
  if (footprint.angle !== angle) {
    footprint.actual = [[inflate(doorPolygon(key, angle), profile.radius + DOOR_CONFIGS[key].margin)]];
    footprint.angle = angle;
  }
  return footprint.actual;
}
export const getInteractionOwner = (owner: string) => (owner === 'bed-west' || owner === 'bed-east') && positionState['bed-double']?.idx === 1 ? 'bed-double' : owner;
/** Prepare the local entry network while the actor is still walking to its approach. */
export function prepareInteractionNavigation(agentId: string, owner: string, goal: Point): void {
  const profile = getAgentProfile(agentId);
  owner = getInteractionOwner(owner);
  if ([...furnitureObstacles.values()].some(o => o.owner === owner && o.yMin < profile.height && o.yMax > 0
    && pointInRing(goal, furnitureFootprint(o, profile)))) getNavigationPreparation(profile, owner);
}
/** Recover the furniture to exit when a scenario starts from a seated character. */
export function getContainingObjectOwner(agentId: string, position: Point): string | undefined {
  const profile = getAgentProfile(agentId);
  for (const obstacle of furnitureObstacles.values()) {
    if (obstacle.yMin < profile.height && obstacle.yMax > 0 && pointInRing(position, furnitureFootprint(obstacle, profile))) {
      return obstacle.owner ? getInteractionOwner(obstacle.owner) : undefined;
    }
  }
  return undefined;
}
const caches = new WeakMap<AgentProfile, Map<string, { revision: number; doorAngles: string; preparation: ReturnType<typeof prepareNavigationGraph>; previous?: ReturnType<typeof prepareNavigationGraph>; graph?: NavigationGraph }>>();
const releaseProfile = (profile: AgentProfile) => {
  for (const entry of caches.get(profile)?.values() ?? []) { entry.preparation.cancel(); entry.previous?.cancel(); }
  caches.delete(profile);
};
agentProfileLifecycle.onUnused = releaseProfile;
agentProfileLifecycle.onUsed = profile => { getNavigationPreparation(profile); };
const inSurface = (p: Point) => walkableSurfaces.some(rings => pointInRing(p, rings[0]) && !rings.slice(1).some(h => pointInRing(p, h)));
export function getDoorApproach(key: DoorKey, agentId?: string, preferred?: Point, start?: Point, departureOwner?: string): Point {
  const door = DOOR_CONFIGS[key];
  const radius = agentId ? getAgentProfile(agentId).radius : 0;
  const clearance = radius + door.thickness / 2 + door.margin;
  const desired = {
    x: door.pivot.x + door.closedDir.x * (door.length + clearance) + door.openNormal.x * clearance,
    z: door.pivot.z + door.closedDir.z * (door.length + clearance) + door.openNormal.z * clearance,
  };
  if (!agentId) return desired;
  const graph = getNavigationGraph(getAgentProfile(agentId), undefined);
  const goal = preferred ?? desired;
  if (start && departureOwner && insideObstacle(start, graph.obstacles)) start = getObjectApproach(departureOwner, goal, agentId, start, true, undefined) ?? start;
  const candidates = [desired, ...graph.vertices].filter(p => inSurface(p) && !insideObstacle(p, graph.obstacles) && distance(p, door.pivot) >= door.length + clearance
    && (p.x - door.pivot.x) * door.openNormal.x + (p.z - door.pivot.z) * door.openNormal.z > 0);
  candidates.sort((a, b) => distance(a, goal) - distance(b, goal));
  if (!preferred && !insideObstacle(desired, graph.obstacles)) candidates.unshift(desired);
  const candidate = start ? graph.findReachable(start, candidates) : candidates[0];
  if (!candidate) throw new NavigationBlockedError(`No safe approach for door ${key}`, goal);
  return candidate;
}
function getNavigationPreparation(profile: AgentProfile, excludeOwner?: string | string[] | Set<string>) {
  const excludeSet = excludeOwner
    ? (excludeOwner instanceof Set ? excludeOwner : new Set((Array.isArray(excludeOwner) ? excludeOwner : excludeOwner.split('+')).map(getInteractionOwner)))
    : null;
  const key = excludeSet ? [...excludeSet].sort().join('+') : '';
  let profileCache = caches.get(profile);
  if (!profileCache) { profileCache = new Map(); caches.set(profile, profileCache); }
  const revision = getObstacleRevision();
  const angles = doorKeys.map(k => computeDoorAllowedAngle(DOOR_CONFIGS[k]));
  const shutterBlocked = glassShutterState.clearHeight < profile.height;
  const doorAngles = `${angles.join(':')}:${shutterBlocked}`;
  const old = profileCache.get(key);
  if (old && (movingFurniture.size || (old.revision === revision && old.doorAngles === doorAngles))) return old;
  const previous = old?.previous ?? (old?.graph ? old.preparation : undefined);
  if (old && old.preparation !== previous) old.preparation.cancel();
  const solid = [...architectureObstacles, ...furnitureObstacles.values()].filter(o => o.yMin < profile.height && o.yMax > 0 && (!excludeSet || !o.owner || !excludeSet.has(getInteractionOwner(o.owner))));
  const definition: GraphDefinition = { solids: [], surfaces: walkableSurfaces, comfortDistance: excludeSet?.size ? undefined : NAVIGATION_COMFORT_CM };
  const addObstacle = (polygon: Polygon, radius = profile.radius) => {
    definition.solids.push({ polygon, radius, comfort: !excludeSet?.size });
  };
  solid.forEach(o => addObstacle(o.polygon, furnitureObstacles.has(o.id) ? furnitureClearance(profile) : profile.radius));
  doorKeys.forEach((k, i) => addObstacle(doorPolygon(k, angles[i]), profile.radius + DOOR_CONFIGS[k].margin));
  if (shutterBlocked) for (const key of ['glassLeft', 'glassRight'] as const) addObstacle(doorPolygon(key, 0));
  // Surface boundaries are barriers, with the same body clearance as walls.
  for (const rings of walkableSurfaces) for (const ring of rings) for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    addObstacle(rectangle((a.x + b.x) / 2, (a.z + b.z) / 2, distance(a, b), 0, Math.atan2(a.z - b.z, b.x - a.x)));
  }
  const preparation = prepareNavigationGraph(definition);
  const entry = { revision, doorAngles, preparation, previous, graph: old?.graph };
  profileCache.set(key, entry);
  return entry;
}

export function getNavigationGraph(profile: AgentProfile, excludeOwner?: string | string[] | Set<string>, continuingRoute = false): NavigationGraph {
  const owners = excludeOwner instanceof Set ? [...excludeOwner] : Array.isArray(excludeOwner) ? excludeOwner : excludeOwner?.split('+') ?? [];
  const scope = getNavigationScope();
  // One asynchronous operation must finish against one immutable snapshot.
  // Other actors may replace the shared cache without cancelling this reader.
  const entry = scope ? scope.value(`graph:${profile.radius}:${profile.height}:${owners.map(getInteractionOwner).sort().join('+')}`, () => {
    const entry = getNavigationPreparation(profile, excludeOwner);
    return { entry, release: entry.preparation.retain() };
  }, snapshot => snapshot.release()).entry : getNavigationPreparation(profile, excludeOwner);
  return readPreparedGraph(entry, continuingRoute);
}

function readPreparedGraph(entry: ReturnType<typeof getNavigationPreparation>, continuingRoute: boolean): NavigationGraph {
  try {
    const graph = entry.preparation.read();
    entry.previous?.cancel(); entry.previous = undefined;
    return entry.graph = graph;
  }
  catch (error) {
    // Existing paths may advance while their replacement builds. Every proposed
    // step is checked against live furniture and doors before being applied.
    if (error instanceof NavigationPending && continuingRoute && entry.graph) return entry.graph;
    throw error;
  }
}

/** Geometry preparation and candidate reachability execute entirely in the worker. */
export function getObjectApproach(owner: string, goal: Point, agentId: string, start?: Point, exiting = false, departureOwner?: string, flexible = false, region?: ApproachRegion): Point | null {
  owner = getInteractionOwner(owner);
  const profile = getAgentProfile(agentId), graph = getNavigationGraph(profile);
  if (start && departureOwner && !exiting && insideObstacle(start, graph.obstacles)) {
    const destination = getObjectApproach(owner, goal, agentId, undefined, false, undefined, flexible, region);
    if (!destination) return null;
    start = getObjectApproach(departureOwner, destination, agentId, start, true) ?? start;
  }
  const owned = [...furnitureObstacles.values()].filter(o => o.owner === owner && o.yMin < profile.height && o.yMax > 0);
  const needsExit = exiting || !!start && owned.some(o => pointInRing(start!, furnitureFootprint(o, profile)));
  const containingOwners = needsExit && start ? new Set([...furnitureObstacles.values()]
    .filter(o => o.owner && o.yMin < profile.height && o.yMax > 0 && pointInRing(start!, furnitureFootprint(o, profile)))
    .map(o => getInteractionOwner(o.owner!))) : new Set<string>();
  containingOwners.add(owner);
  const escape = (needsExit ? getNavigationGraph(profile, containingOwners) : graph).obstacles;
  const candidates = readObjectApproach(graph, {
    owner,
    goal: { x: goal.x, z: goal.z }, start: start ? { x: start.x, z: start.z } : undefined, owned: owned.map(o => ({ polygon: o.polygon, radius: furnitureClearance(profile) })),
    surfaces: walkableSurfaces, actors: getAgentObstacles(agentId, start ?? goal), exiting, flexible, region, escape,
  });
  const free = candidates.find(p => isAgentDestinationFree(agentId, p));
  return free ?? (exiting ? candidates[0] : undefined) ?? null;
}

export interface RouteState {
  path: Point[];
  index: number;
  target: Point | null;
  destination?: Point;
  graph: NavigationGraph | null;
  crowd?: { base: NavigationGraph; graph: NavigationGraph | null; planning?: NavigationGraph; preparation?: ReturnType<typeof prepareNavigationGraph>; preparing?: boolean; signature: string; resume: { start: Point; next: Point } };
  error: string | null;
  waitReason?: string;
  doors: Set<DoorKey>;
  protectedDoor?: DoorKey;
  owner?: string;
  approach?: Point;
  interactionTarget?: Point;
  occupiedTarget?: { point: Point; destination: Point };
  exit?: { owner: string; graph: NavigationGraph; point: Point };
  failure?: { graph: NavigationGraph; start: Point; target: Point; owner?: string; interaction: boolean; protectedDoor?: DoorKey; doorProtection?: DoorProtection; actorBlockers: ActorBlockers };
}
function clearCrowd(route: RouteState): void {
  route.crowd?.preparation?.cancel();
  route.crowd = undefined;
}
export const createRouteState = (): RouteState => ({ path: [], index: 0, target: null, graph: null, error: null, doors: new Set() });

/** Animation-driven furniture transition: keep its trajectory, wait if it becomes blocked. */
export function movePostureTransition(route: RouteState, agentId: string, start: Point, target: Point, owner: string): Point {
  const graph = getNavigationGraph(getAgentProfile(agentId), owner);
  route.waitReason = undefined;
  if (!segmentFree(start, target, graph.obstacles)) {
    route.waitReason = `Sortie de posture bloquée par un obstacle (${owner})`;
    return start;
  }
  const next = limitAgentMovement(agentId, start, target);
  if (next.x !== target.x || next.z !== target.z) route.waitReason = 'Sortie de posture bloquée par un personnage';
  return next;
}
export function resetRoute(route: RouteState, agentId: string, keepProtectedDoor?: DoorKey): void {
  routeScopes.get(route)?.clear();
  releaseAgentDoors(agentId, keepProtectedDoor);
  route.path = []; route.index = 0; route.target = null; route.graph = null; route.error = null; route.doors.clear();
  route.destination = undefined;
  route.approach = undefined; route.interactionTarget = undefined;
  route.occupiedTarget = undefined;
  route.exit = undefined;
  route.failure = undefined;
  clearCrowd(route);
  route.waitReason = undefined;
  route.protectedDoor = keepProtectedDoor;
  if (keepProtectedDoor) route.doors.add(doorOpeningKey(keepProtectedDoor));
  navigationDebug.delete(agentId);
}

export function planRoute(route: RouteState, agentId: string, start: Point, target: Point): boolean {
  const base = getNavigationGraph(getAgentProfile(agentId), undefined);
  let graph = route.crowd?.base === base && route.crowd.graph ? route.crowd.graph : base;
  if (!inSurface(start) || !inSurface(target)) {
    route.error = 'Destination ou départ hors du sol praticable';
  } else {
    let path = findPath(graph, start, target);
    if (!path && graph !== base) {
      clearCrowd(route);
      graph = base;
      path = findPath(graph, start, target);
    }
    if (path) {
      route.path = path; route.index = 0; route.target = { ...target }; route.graph = graph; route.error = null;
      navigationDebug.set(agentId, { path: [start, ...path], target });
      return true;
    }
    route.error = 'Aucun chemin praticable vers la destination';
  }
  route.path = []; route.target = { ...target }; route.graph = graph;
  navigationDebug.set(agentId, { path: [], target, error: route.error });
  return false;
}

function releaseClearedDoors(route: RouteState, agentId: string, profile: AgentProfile, position: Point): void {
  for (const opening of route.doors) {
    if (route.protectedDoor && opening === doorOpeningKey(route.protectedDoor)) continue;
    const leaves = doorKeys.filter(k => doorOpeningKey(k) === opening);
    const points = [position, ...route.path.slice(route.index)];
    const crossingAhead = leaves.some(k => {
      const closed = doorFootprint(profile, k);
      return points.some((p, i) => i > 0 && !segmentFree(points[i - 1], p, closed));
    });
    const clear = leaves.every(k => {
      const d = DOOR_CONFIGS[k], clearance = profile.radius + d.thickness / 2 + d.margin;
      const across = (position.x - d.pivot.x) * d.openNormal.x + (position.z - d.pivot.z) * d.openNormal.z;
      return across < -clearance || distance(position, d.pivot) > d.length + clearance;
    });
    const distant = leaves.every(k => distance(position, DOOR_CONFIGS[k].pivot) > DOOR_CONFIGS[k].length + profile.radius + DOOR_CONFIGS[k].thickness / 2 + DOOR_CONFIGS[k].margin);
    if ((!crossingAhead || distant) && clear) {
      releaseDoor(opening, agentId);
      route.doors.delete(opening);
    }
  }
}

function passDoors(route: RouteState, agentId: string, profile: AgentProfile, start: Point, proposed: Point): Point {
  releaseClearedDoors(route, agentId, profile, start);
  // Anticipate only the next opening once the actor reaches its swing area.
  const points = [start, ...route.path.slice(route.index)];
  const crossings = doorKeys.filter(key => DOOR_CONFIGS[key].yMin < profile.height && DOOR_CONFIGS[key].yMax > 0)
    .map(key => ({ key, index: points.findIndex((point, i) => i > 0 && !segmentFree(points[i - 1], point, doorFootprint(profile, key))) }))
    .filter(crossing => crossing.index > 0);
  const first = Math.min(...crossings.map(crossing => crossing.index));
  for (const { key, index } of crossings) if (index === first && distance(start, DOOR_CONFIGS[key].pivot) <= DOOR_CONFIGS[key].length + profile.radius + DOOR_CONFIGS[key].thickness / 2 + DOOR_CONFIGS[key].margin) {
    requestDoor(key, agentId);
    route.doors.add(doorOpeningKey(key));
  }
  for (const key of doorKeys) {
    const d = DOOR_CONFIGS[key];
    const opening = doorOpeningKey(key);
    if (d.yMin >= profile.height || d.yMax <= 0) continue;
    const actual = doorFootprint(profile, key, doorCollisionState[key].angle);
    const blocked = !segmentFree(start, proposed, actual);
    if (route.doors.has(opening) || blocked) {
      requestDoor(opening, agentId);
      route.doors.add(opening);
    }
    if (blocked) { route.waitReason = `Battant ${key} sur le trajet, attente d'ouverture`; return start; }
  }
  releaseClearedDoors(route, agentId, profile, proposed);
  return proposed;
}

/** Returns a safe movement, or the current point while waiting for a door / another agent. */
function advanceWithNavigation(route: RouteState, agentId: string, start: Point, target: Point, travel: number, steer?: (direction: Point, remaining: number) => Point, owner?: string, interaction = false, protectedDoor?: DoorKey): Point {
  route.waitReason = undefined;
  owner = owner ? getInteractionOwner(owner) : undefined;
  const crowd = route.crowd;
  if (crowd?.graph || crowd?.planning || crowd?.preparing) {
    const reachable = limitAgentMovement(agentId, crowd.resume.start, crowd.resume.next);
    if (reachable.x === crowd.resume.next.x && reachable.z === crowd.resume.next.z) {
      // The obstruction has cleared: recover the shorter static route without
      // rebuilding a crowd graph every time a distant actor moves.
      clearCrowd(route);
      route.graph = null;
    }
  }
  if (route.error === 'Destination occupée par un autre acteur') {
    const occupied = route.occupiedTarget;
    if ((!occupied || distance(occupied.destination, target) === 0)
      && !isAgentDestinationFree(agentId, occupied?.point ?? target)) return start;
    route.occupiedTarget = undefined;
    route.error = null;
    route.graph = null;
    clearCrowd(route);
  }
  const failed = route.failure;
  if (failed) {
    if (failed.graph === getNavigationGraph(getAgentProfile(agentId), undefined)
      && failed.start.x === start.x && failed.start.z === start.z
      && failed.target.x === target.x && failed.target.z === target.z
      && failed.owner === owner && failed.interaction === interaction && failed.protectedDoor === protectedDoor
      && actorBlocksUnchanged(failed.actorBlockers)) return start;
    if (protectedDoor && failed.protectedDoor === protectedDoor && failed.doorProtection) protectDoor(protectedDoor, agentId, failed.doorProtection);
    route.failure = undefined;
    route.error = null;
    route.graph = null;
    route.approach = undefined;
    route.exit = undefined;
  }
  beginActorBlockCheck(agentId);
  let position: Point;
  let actorBlockers: ActorBlockers;
  try { position = advanceRoute(route, agentId, start, target, travel, steer, owner, interaction, protectedDoor); }
  finally { actorBlockers = endActorBlockCheck(agentId); }
  if (route.error) {
    const doorProtection = protectedDoor ? getAgentDoorProtection(protectedDoor, agentId) : undefined;
    // An impossible route must not retain a passage needed by other agents.
    releaseAgentDoors(agentId);
    route.doors.clear();
    // Releasing the interaction footprint changes the graph too. Cache the
    // released geometry, and restore the footprint only when retrying the route.
    route.failure = { graph: readPreparedGraph(getNavigationPreparation(getAgentProfile(agentId)), false), start: { ...start }, target: { ...target }, owner, interaction, protectedDoor, doorProtection, actorBlockers };
  }
  const profile = getAgentProfile(agentId);
  const liveFurniture = [...furnitureObstacles.values()]
    .filter(o => o.yMin < profile.height && o.yMax > 0 && (!route.owner || !o.owner || getInteractionOwner(o.owner) !== route.owner))
    .map(o => [furnitureFootprint(o, profile)]);
  if (!segmentFree(start, position, liveFurniture)
    || (glassShutterState.clearHeight < profile.height && (['glassLeft', 'glassRight'] as const).some(key => !segmentFree(start, position, doorFootprint(profile, key))))) {
    route.waitReason = 'Trajet coupé par la géométrie actuelle';
    return start;
  }
  const limited = limitAgentMovement(agentId, start, position);
  for (const room of LIMITED_ROOMS) {
    if (!isInRoom(room, start) && isInRoom(room, limited) && !OccupancyManager.hasRoomCapacity(room, agentId)) {
      route.waitReason = `${{ living: 'Séjour complet', bathroom: 'Salle de bains complète', corridor: 'Couloir complet' }[room]} (${ROOM_CAPACITIES[room]} ${room === 'living' ? 'PNJ' : 'personnages'})`;
      return start;
    }
  }
  // Plan before contact along the next segment, including free comfort bands.
  const nextWaypoint = route.path[route.index];
  const ahead = nextWaypoint ? limitAgentMovement(agentId, start, nextWaypoint) : position;
  const blockedAhead = !!nextWaypoint && (ahead.x !== nextWaypoint.x || ahead.z !== nextWaypoint.z);
  if (limited.x !== position.x || limited.z !== position.z || blockedAhead) {
    route.waitReason = 'Déplacement limité par le corps d’un autre PNJ';
    // A stop at contact is insufficient: keep a real path around the other bodies.
    const base = route.crowd && (route.crowd.graph === route.graph || route.crowd.planning) ? route.crowd.base
      : route.graph ?? getNavigationGraph(getAgentProfile(agentId), undefined);
    const obstacles = getAgentObstacles(agentId, start);
    const signature = JSON.stringify(obstacles);
    if (obstacles.length && (route.crowd?.planning || route.crowd?.preparing || route.crowd?.base !== base || route.crowd.signature !== signature)) {
      // Finish the current crowd snapshot instead of restarting for every
      // moving actor. Live movement collision checks still protect every step.
      let crowd = route.crowd;
      if ((!crowd?.planning && !crowd?.preparation) || crowd.base !== base) {
        crowd?.preparation?.cancel();
        const preparation = prepareNavigationGraph({ obstacles: [...base.obstacles, ...obstacles.map(polygon => [polygon])], surfaces: walkableSurfaces });
        crowd = { base, graph: null, preparation, preparing: true, signature,
          resume: crowd?.resume ?? { start: { ...start }, next: route.path[route.index] ?? target } };
        route.crowd = crowd;
      }
      const graph = crowd.planning ??= crowd.preparation!.read();
      crowd.preparing = false;
      const goal = route.target ?? target;
      const path = findPath(graph, start, goal);
      crowd.planning = undefined;
      crowd.graph = path ? graph : null;
      if (path) {
        route.path = path; route.index = 0; route.graph = graph; route.target = { ...goal };
        navigationDebug.set(agentId, { path: [start, ...path], target: goal });
        // Stay outside the conservative detour boundary until its first step.
        route.waitReason = 'Contournement d’un autre PNJ calculé';
        return start;
      }
      if (insideObstacle(goal, obstacles.map(polygon => [polygon]))) {
        route.error = 'Destination occupée par un autre acteur';
        route.occupiedTarget = { point: { ...goal }, destination: { ...target } };
        releaseAgentDoors(agentId);
        route.doors.clear();
      }
    }
  }
  return limited;
}

const routeScopes = new WeakMap<RouteState, NavigationScope>();
export function followRoute(...args: Parameters<typeof advanceWithNavigation>): Point {
  const route = args[0];
  let scope = routeScopes.get(route);
  if (!scope) { scope = new NavigationScope(); routeScopes.set(route, scope); }
  try { return scope.run(() => advanceWithNavigation(...args)); }
  catch (error) {
    if (!(error instanceof NavigationPending)) throw error;
    route.waitReason = 'Calcul de navigation en cours';
    return args[2];
  }
}

/** Geometry revisions elsewhere must not stop a route whose remaining segments are still safe. */
function retainValidRoute(route: RouteState, graph: NavigationGraph, start: Point, target: Point): void {
  if (route.graph === graph || route.error || route.target?.x !== target.x || route.target?.z !== target.z || route.index >= route.path.length) return;
  const remaining = [start, ...route.path.slice(route.index)];
  if (remaining.every((point, index) => index === 0 || segmentFree(remaining[index - 1], point, graph.obstacles))) {
    route.graph = graph;
  }
}

function advanceRoute(route: RouteState, agentId: string, start: Point, target: Point, travel: number, steer?: (direction: Point, remaining: number) => Point, owner?: string, interaction = false, protectedDoor?: DoorKey): Point {
  const profile = getAgentProfile(agentId);
  route.protectedDoor = protectedDoor;
  if (protectedDoor) route.doors.add(doorOpeningKey(protectedDoor));
  if (distance(start, target) === 0) return target;
  const continuing = !route.error && route.index < route.path.length && route.destination?.x === target.x && route.destination?.z === target.z;
  route.destination = { ...target };
  const base = getNavigationGraph(profile, undefined, continuing);
  let graph = route.crowd?.base === base && route.crowd.graph ? route.crowd.graph : base;
  const owned = (id: string) => [...furnitureObstacles.values()].filter(o => o.owner === id && o.yMin < profile.height && o.yMax > 0).map(o => furnitureFootprint(o, profile));
  const contained = (id: string, p: Point) => owned(id).some(polygon => pointInRing(p, polygon));
  const localMove = (goal: Point, id: string): Point => {
    const baseLocal = getNavigationGraph(profile, id, continuing);
    const localGraph = route.crowd?.base === baseLocal && route.crowd.graph ? route.crowd.graph : baseLocal;
    retainValidRoute(route, localGraph, start, goal);
    if (route.graph !== localGraph || route.target?.x !== goal.x || route.target?.z !== goal.z) {
      const path = findPath(localGraph, start, goal);
      if (!path) {
        route.error = `Transition d'interaction bloquée (${id})`;
        navigationDebug.set(agentId, { path: [], target: goal, error: route.error });
        return start;
      }
      route.path = path; route.index = 0; route.target = { ...goal }; route.graph = localGraph;
      navigationDebug.set(agentId, { path: [start, ...path], target: goal });
    }
    route.error = null;
    while (route.index < route.path.length && distance(start, route.path[route.index]) === 0) route.index++;
    const next = route.path[route.index];
    if (!next) return goal;
    const length = distance(start, next);
    const step = Math.min(travel, length);
    const proposed = step === length ? { ...next } : { x: start.x + (next.x - start.x) * step / length, z: start.z + (next.z - start.z) * step / length };
    return passDoors(route, agentId, profile, start, proposed);
  };
  const approachFor = (id: string, goal: Point, exiting: boolean) => getObjectApproach(id, goal, agentId, start, exiting, undefined);
  // A previous interaction may leave us inside a different object's clearance.
  // Keep an ongoing local entry from its explicit approach; otherwise detect the actual owner.
  if (route.owner && !contained(route.owner, start) && !(interaction && owner === route.owner && continuing)) route.owner = undefined;
  if (!route.owner && owner && contained(owner, start)) route.owner = owner;
  if (!route.owner) {
    route.owner = getContainingObjectOwner(agentId, start);
  }
  if (route.owner && contained(route.owner, start) && !(interaction && owner === route.owner)) {
    if (route.exit?.owner !== route.owner || route.exit.graph !== base) {
      const point = approachFor(route.owner, target, true);
      route.exit = point ? { owner: route.owner, graph: base, point } : undefined;
    }
    const exit = route.exit?.point;
    if (!exit) { route.error = `Aucune sortie praticable de ${route.owner}`; navigationDebug.set(agentId, { path: [], target, error: route.error }); return start; }
    return localMove(exit, route.owner);
  }
  if (interaction && owner && contained(owner, target)) {
    if (route.owner === owner) return localMove(target, owner);
    if (!route.approach || route.interactionTarget?.x !== target.x || route.interactionTarget?.z !== target.z) {
      route.approach = approachFor(owner, target, false) ?? undefined;
      route.interactionTarget = { ...target };
    }
    if (!route.approach) { route.error = `Aucune approche praticable de ${owner}`; navigationDebug.set(agentId, { path: [], target, error: route.error }); return start; }
    if (distance(start, route.approach) < 1e-6) {
      route.owner = owner;
      return localMove(target, owner);
    }
    target = route.approach;
  }
  retainValidRoute(route, graph, start, target);
  if (!route.target || route.target.x !== target.x || route.target.z !== target.z || route.graph !== graph) {
    if (!planRoute(route, agentId, start, target)) return start;
    graph = route.graph!;
  }
  if (route.error) return start;
  while (route.index < route.path.length && distance(start, route.path[route.index]) === 0) route.index++;
  let next = route.path[route.index];
  if (!next) { resetRoute(route, agentId, protectedDoor); return target; }
  // A displaced agent must regain a valid route before continuing toward an old vertex.
  if (!segmentFree(start, next, graph.obstacles)) {
    if (!planRoute(route, agentId, start, target)) return start;
    graph = route.graph!;
    while (route.index < route.path.length && distance(start, route.path[route.index]) === 0) route.index++;
    next = route.path[route.index];
    if (!next || !segmentFree(start, next, graph.obstacles)) {
      route.error = 'Le chemin calculé contient un segment impraticable';
      navigationDebug.set(agentId, { path: [start, ...route.path], target, error: route.error });
      return start;
    }
  }
  const remaining = distance(start, next);
  const direction = { x: (next.x - start.x) / remaining, z: (next.z - start.z) / remaining };
  const step = Math.min(travel, remaining);
  // Finish the waypoint on the last step. A lateral offset here would miss it
  // indefinitely, making the actor circle and preventing the next instruction.
  const steered = step === remaining ? direction : steer?.(direction, remaining) ?? direction;
  let proposed = { x: start.x + steered.x * step, z: start.z + steered.z * step };
  let straight = steered.x === direction.x && steered.z === direction.z;
  // Steering may enter free space that cannot see the next corner. Preserve visibility
  // so avoiding a neighbour cannot strand the actor behind that corner.
  if (!segmentFree(start, proposed, graph.obstacles) || !segmentFree(proposed, next, graph.obstacles)) {
    proposed = { x: start.x + direction.x * step, z: start.z + direction.z * step };
    straight = true;
  }
  if (step === remaining && straight) proposed = { ...next };
  if (!segmentFree(start, proposed, graph.obstacles)) { route.waitReason = 'Pas refusé par la géométrie de navigation'; return start; }
  return passDoors(route, agentId, profile, start, proposed);
}

/** Computed only when reporting a stop, never on every walking frame. */
export function describeNavigationBlock(agentId: string, start: Point, target: Point, route: RouteState, actorBlockers?: ActorBlockers): string {
  const profile = getAgentProfile(agentId);
  const at = (point: Point) => `(${point.x.toFixed(1)}, ${point.z.toFixed(1)})`;
  const details = [`position ${at(start)} → cible ${at(target)}`, `rayon ${profile.radius.toFixed(1)} cm`];
  if (route.owner) details.push(`sortie de ${route.owner}`);
  const next = route.path[route.index];
  if (next) details.push(`prochain point ${at(next)}`);
  const doors = new Set([...route.doors, ...(route.protectedDoor ? [route.protectedDoor] : [])]);
  if (doors.size) details.push(`portes : ${[...doors].map(key => `${key} (${doorCollisionState[key].angle.toFixed(2)} rad)`).join(', ')}`);
  for (const [label, point] of [['départ', start], ['cible', target]] as const) {
    const obstacles = [...architectureObstacles, ...furnitureObstacles.values()]
      .filter(o => o.yMin < profile.height && o.yMax > 0 && pointInRing(point, inflate(o.polygon, furnitureClearance(profile))))
      .map(o => o.owner ?? o.id);
    if (obstacles.length) details.push(`${label} dans : ${[...new Set(obstacles)].join(', ')}`);
  }
  beginActorBlockCheck(agentId);
  isAgentDestinationFree(agentId, start);
  isAgentDestinationFree(agentId, route.occupiedTarget?.point ?? target);
  const actors = new Set([...(actorBlockers?.keys() ?? []), ...(route.failure?.actorBlockers.keys() ?? []), ...endActorBlockCheck(agentId).keys()]);
  if (actors.size) details.push(`PNJ en collision au départ / à la cible ou ayant refusé une approche : ${[...actors].join(', ')}`);
  return details.join(' ; ');
}

/** Pick free destinations by area, rather than sampling arbitrary room rectangles. */
export function randomReachableTarget(agentId: string, start: Point): Point | null {
  const graph = getNavigationGraph(getAgentProfile(agentId));
  const rings = walkableSurfaces.flat();
  const xs = rings.flat().map(p => p.x), zs = rings.flat().map(p => p.z);
  const xMin = Math.min(...xs), xMax = Math.max(...xs), zMin = Math.min(...zs), zMax = Math.max(...zs);
  const candidate = navigationValue('random-navigation-target', () => ({ x: xMin + Math.random() * (xMax - xMin), z: zMin + Math.random() * (zMax - zMin) }));
  return inSurface(candidate) && isAgentDestinationFree(agentId, candidate) && graph.canReach(start, candidate) ? candidate : null;
}
