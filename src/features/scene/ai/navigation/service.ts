import { positionState } from '../../positionState';
import { movingFurniture } from '../../furniturePositions';
import { architectureObstacles, walkableSurfaces } from './architecture';
import { furnitureObstacles, getObstacleRevision, getAgentProfile, navigationDebug, type AgentProfile } from './obstacles';
import { inflate, union, mergeObstacles, VisibilityGraph, rectangle, pointInRing, insideObstacle, segmentFree, distance, projectToSegment, BOOLEAN_PRECISION, type Point, type Polygon } from './geometry';
import { DOOR_CONFIGS, computeDoorAllowedAngle, doorCollisionState, glassShutterState } from '../../doorObstacles';
import { requestDoor, releaseDoor, releaseAgentDoors, doorOpeningKey, type DoorKey } from './doorRequests';
import { limitAgentMovement, isAgentDestinationFree, getAgentObstacles, beginActorBlockCheck, endActorBlockCheck, actorBlocksUnchanged, type ActorBlockers } from '../agent/agentAvoidance';
import { NAVIGATION_COMFORT_CM } from './comfort';
import { requestPath, type PathSearch } from './pathfindingClient';
import { cameraState } from '../../cameraState';

export { architectureObstacles };
export const doorKeys = Object.keys(DOOR_CONFIGS) as DoorKey[];
export class NavigationBlockedError extends Error {
  actorBlockers: ActorBlockers = new Map();
  constructor(message: string, readonly target: Point) { super(message); this.name = 'NavigationBlockedError'; }
}
export function doorPolygon(key: DoorKey, angle: number): Polygon {
  const d = DOOR_CONFIGS[key], c = Math.cos(Math.abs(angle)), s = Math.sin(Math.abs(angle));
  const dx = c * d.closedDir.x + s * d.openNormal.x, dz = c * d.closedDir.z + s * d.openNormal.z;
  return rectangle(d.pivot.x + dx * d.length / 2, d.pivot.z + dz * d.length / 2, d.length, d.thickness, Math.atan2(-dz, dx));
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
/** Recover the furniture to exit when a scenario starts from a seated character. */
export function getContainingObjectOwner(agentId: string, position: Point): string | undefined {
  const profile = getAgentProfile(agentId);
  const obstacle = [...furnitureObstacles.values()].find(o => o.yMin < profile.height && o.yMax > 0
    && pointInRing(position, inflate(o.polygon, profile.radius)));
  return obstacle?.owner ? getInteractionOwner(obstacle.owner) : undefined;
}
const caches = new WeakMap<AgentProfile, Map<string, { revision: number; doorAngles: string; graph: VisibilityGraph }>>();
const inSurface = (p: Point) => walkableSurfaces.some(rings => pointInRing(p, rings[0]) && !rings.slice(1).some(h => pointInRing(p, h)));
export function getDoorApproach(key: DoorKey, agentId?: string, preferred?: Point, start?: Point, departureOwner?: string, closedDoor?: DoorKey): Point {
  const door = DOOR_CONFIGS[key];
  const radius = agentId ? getAgentProfile(agentId).radius : 0;
  const clearance = radius + door.thickness / 2 + door.margin;
  const desired = {
    x: door.pivot.x + door.closedDir.x * (door.length + clearance) + door.openNormal.x * clearance,
    z: door.pivot.z + door.closedDir.z * (door.length + clearance) + door.openNormal.z * clearance,
  };
  if (!agentId) return desired;
  const graph = getNavigationGraph(getAgentProfile(agentId), undefined, closedDoor);
  const goal = preferred ?? desired;
  if (start && departureOwner && insideObstacle(start, graph.obstacles)) start = getObjectApproach(departureOwner, goal, agentId, start, true, undefined, closedDoor) ?? start;
  if (!preferred && !insideObstacle(desired, graph.obstacles) && (!start || graph.canReach(start, desired))) return desired;
  const candidates = [desired, ...graph.vertices].filter(p => inSurface(p) && !insideObstacle(p, graph.obstacles) && distance(p, door.pivot) >= door.length + clearance
    && (p.x - door.pivot.x) * door.openNormal.x + (p.z - door.pivot.z) * door.openNormal.z > 0);
  candidates.sort((a, b) => distance(a, goal) - distance(b, goal));
  const candidate = candidates.find(p => !start || graph.canReach(start, p));
  if (!candidate) throw new NavigationBlockedError(`No safe approach for door ${key}`, goal);
  return candidate;
}
export function getNavigationGraph(profile: AgentProfile, excludeOwner?: string, closedDoor?: DoorKey): VisibilityGraph {
  if (excludeOwner) excludeOwner = getInteractionOwner(excludeOwner);
  const key = `${excludeOwner ?? ''}:${closedDoor ?? ''}`;
  let profileCache = caches.get(profile);
  if (!profileCache) { profileCache = new Map(); caches.set(profile, profileCache); }
  const revision = getObstacleRevision();
  const angles = doorKeys.map(k => closedDoor && doorOpeningKey(k) === doorOpeningKey(closedDoor) ? 0 : computeDoorAllowedAngle(DOOR_CONFIGS[k]));
  const shutterBlocked = glassShutterState.clearHeight < profile.height;
  const doorAngles = `${angles.join(':')}:${shutterBlocked}`;
  const old = profileCache.get(key);
  if (old && (movingFurniture.size || (old.revision === revision && old.doorAngles === doorAngles))) return old.graph;
  const solid = [...architectureObstacles, ...furnitureObstacles.values()].filter(o => o.yMin < profile.height && o.yMax > 0 && (!excludeOwner || o.owner !== excludeOwner));
  const obstacles: Polygon[] = [], comfortObstacles: Polygon[] = [];
  const addObstacle = (polygon: Polygon, radius = profile.radius) => {
    obstacles.push(inflate(polygon, radius));
    if (!excludeOwner) comfortObstacles.push(inflate(polygon, radius + NAVIGATION_COMFORT_CM));
  };
  solid.forEach(o => addObstacle(o.polygon));
  doorKeys.forEach((k, i) => addObstacle(doorPolygon(k, angles[i]), profile.radius + DOOR_CONFIGS[k].margin));
  if (shutterBlocked) for (const key of ['glassLeft', 'glassRight'] as const) addObstacle(doorPolygon(key, 0));
  // Surface boundaries are barriers, with the same body clearance as walls.
  for (const rings of walkableSurfaces) for (const ring of rings) for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    addObstacle(rectangle((a.x + b.x) / 2, (a.z + b.z) / 2, distance(a, b), 0, Math.atan2(a.z - b.z, b.x - a.x)));
  }
  const graph = new VisibilityGraph(union(obstacles), excludeOwner ? undefined : { distance: NAVIGATION_COMFORT_CM, obstacles: union(comfortObstacles) });
  profileCache.set(key, { revision, doorAngles, graph });
  return graph;
}

/** Reach an object's inflated boundary without ignoring unrelated obstacles. */
export function getObjectApproach(owner: string, goal: Point, agentId: string, start?: Point, exiting = false, departureOwner?: string, closedDoor?: DoorKey, flexible = false): Point | null {
  owner = getInteractionOwner(owner);
  const profile = getAgentProfile(agentId), graph = getNavigationGraph(profile, undefined, closedDoor);
  if (start && departureOwner && !exiting && insideObstacle(start, graph.obstacles)) start = getObjectApproach(departureOwner, goal, agentId, start, true, undefined, closedDoor) ?? start;
  const owned = [...furnitureObstacles.values()].filter(o => o.owner === owner && o.yMin < profile.height && o.yMax > 0).map(o => inflate(o.polygon, profile.radius));
  if (!exiting && inSurface(goal) && !owned.some(p => pointInRing(goal, p)) && !insideObstacle(goal, graph.obstacles) && (!start || graph.canReach(start, goal)) && isAgentDestinationFree(agentId, goal)) return goal;
  exiting = exiting || Boolean(start && owned.some(p => pointInRing(start, p)));
  // Leave furniture by the nearest free edge, independently of the next destination.
  const preferred = exiting && start ? start : goal;
  const contours = owned.length && !flexible ? owned : [...graph.obstacles.flat(), ...getAgentObstacles(agentId, start ?? goal)];
  const edges = contours.flatMap(polygon => polygon.map((a, i) => [a, polygon[(i + 1) % polygon.length]] as const));
  const candidates = edges.flatMap(([a, b]) => [a, projectToSegment(goal, a, b), ...(start ? [projectToSegment(start, a, b)] : [])]);
  // Other obstacles can cover an entire corner: include their intersections with the owner's boundary.
  if (owned.length && !flexible) for (const [a, b] of edges) {
    const cuts = [a, b, ...graph.vertices.filter(p => distance(p, projectToSegment(p, a, b)) <= Math.SQRT2 * BOOLEAN_PRECISION).map(p => projectToSegment(p, a, b))];
    cuts.sort((p, q) => distance(a, p) - distance(a, q));
    candidates.push(...cuts);
    for (let i = 1; i < cuts.length; i++) {
      const p = cuts[i - 1], q = cuts[i];
      // Test the free portions of an edge, rather than only its covered corners.
      candidates.push({ x: (p.x + q.x) / 2, z: (p.z + q.z) / 2 }, projectToSegment(preferred, p, q));
    }
  }
  candidates.sort((a, b) => distance(a, preferred) - distance(b, preferred));
  for (const p of candidates) {
    // Only actors rejecting a physically reachable candidate are dependencies
    // of a failed approach. Actors near a point inside furniture (or behind a
    // wall) must not restart the same impossible search whenever they move.
    if (!inSurface(p) || insideObstacle(p, graph.obstacles)) continue;
    if (exiting && start && !segmentFree(start, p, getNavigationGraph(profile, owner, closedDoor).obstacles)) continue;
    if (start && !exiting && !graph.canReach(start, p)) continue;
    if (!isAgentDestinationFree(agentId, p)) continue;
    return p;
  }
  if (exiting) {
    for (const p of candidates) {
      if (!inSurface(p) || insideObstacle(p, graph.obstacles)) continue;
      if (start && !segmentFree(start, p, getNavigationGraph(profile, owner, closedDoor).obstacles)) continue;
      return p;
    }
  }
  return null;
}

export interface RouteState {
  path: Point[];
  search?: { kind: 'route' | 'local' | 'crowd'; job: PathSearch };
  index: number;
  target: Point | null;
  graph: VisibilityGraph | null;
  crowd?: { base: VisibilityGraph; graph: VisibilityGraph | null; planning?: VisibilityGraph; signature: string; resume: { start: Point; next: Point } };
  error: string | null;
  waitReason?: string;
  doors: Set<DoorKey>;
  closedDoor?: DoorKey;
  owner?: string;
  approach?: Point;
  interactionTarget?: Point;
  occupiedTarget?: { point: Point; destination: Point };
  exit?: { owner: string; graph: VisibilityGraph; point: Point };
  failure?: { graph: VisibilityGraph; start: Point; target: Point; owner?: string; interaction: boolean; closedDoor?: DoorKey; actorBlockers: ActorBlockers };
}
export const createRouteState = (): RouteState => ({ path: [], index: 0, target: null, graph: null, error: null, doors: new Set() });

/** Animation-driven furniture exit: keep its trajectory, wait if it becomes blocked. */
export function movePostureExit(route: RouteState, agentId: string, start: Point, target: Point, owner: string): Point {
  const graph = getNavigationGraph(getAgentProfile(agentId), owner, route.closedDoor);
  route.waitReason = undefined;
  if (!segmentFree(start, target, graph.obstacles)) {
    route.waitReason = `Sortie de posture bloquée par un obstacle (${owner})`;
    return start;
  }
  const next = limitAgentMovement(agentId, start, target);
  if (next.x !== target.x || next.z !== target.z) route.waitReason = 'Sortie de posture bloquée par un personnage';
  return next;
}
export function resetRoute(route: RouteState, agentId: string, keepClosedDoor?: DoorKey): void {
  route.search?.job.cancel();
  route.search = undefined;
  releaseAgentDoors(agentId, keepClosedDoor);
  route.path = []; route.index = 0; route.target = null; route.graph = null; route.error = null; route.doors.clear();
  route.approach = undefined; route.interactionTarget = undefined;
  route.occupiedTarget = undefined;
  route.exit = undefined;
  route.failure = undefined;
  route.crowd = undefined;
  route.waitReason = undefined;
  route.closedDoor = keepClosedDoor;
  if (keepClosedDoor) route.doors.add(doorOpeningKey(keepClosedDoor));
  navigationDebug.delete(agentId);
}

/** Undefined means an explicit pending search, not an unreachable target. */
function searchPath(route: RouteState, graph: VisibilityGraph, start: Point, target: Point, kind: 'route' | 'local' | 'crowd'): Point[] | null | undefined {
  let search = route.search;
  if (!search || search.kind !== kind || search.job.graph !== graph ||
      search.job.start.x !== start.x || search.job.start.z !== start.z ||
      search.job.target.x !== target.x || search.job.target.z !== target.z) {
    search?.job.cancel();
    search = { kind, job: requestPath(graph, start, target, () => cameraState.invalidate?.()) };
    route.search = search;
  }
  if (search.job.status === 'pending') {
    route.waitReason = 'Calcul du trajet en cours';
    return undefined;
  }
  if (search.job.status === 'error') throw search.job.error!;
  if (search.job.status === 'cancelled') throw new Error('Cancelled navigation search still attached to a route');
  route.search = undefined;
  return search.job.path;
}

export function planRoute(route: RouteState, agentId: string, start: Point, target: Point): boolean {
  const base = getNavigationGraph(getAgentProfile(agentId), undefined, route.closedDoor);
  let graph = route.crowd?.base === base && route.crowd.graph ? route.crowd.graph : base;
  if (!inSurface(start) || !inSurface(target)) {
    route.error = 'Destination ou départ hors du sol praticable';
  } else {
    let path = searchPath(route, graph, start, target, 'route');
    if (path === undefined) return false;
    if (!path && graph !== base) {
      route.crowd = undefined;
      graph = base;
      path = searchPath(route, graph, start, target, 'route');
      if (path === undefined) return false;
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
    if (route.closedDoor && opening === doorOpeningKey(route.closedDoor)) continue;
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
    if (!crossingAhead && clear) {
      releaseDoor(opening, agentId);
      route.doors.delete(opening);
    }
  }
}

function passDoors(route: RouteState, agentId: string, profile: AgentProfile, start: Point, next: Point, proposed: Point, travel: number): Point {
  releaseClearedDoors(route, agentId, profile, start);
  for (const key of doorKeys) {
    const d = DOOR_CONFIGS[key];
    const opening = doorOpeningKey(key);
    if (d.yMin >= profile.height || d.yMax <= 0) continue;
    const clearance = profile.radius + d.thickness / 2 + d.margin;
    const closed = doorFootprint(profile, key);
    const crossing = !segmentFree(start, next, closed);
    const actual = doorFootprint(profile, key, doorCollisionState[key].angle);
    const blocked = !segmentFree(start, proposed, actual);
    if (route.doors.has(opening) || blocked || (crossing && (distance(start, d.pivot) <= d.length + clearance + travel || !segmentFree(start, proposed, closed)))) {
      if (route.closedDoor && opening === doorOpeningKey(route.closedDoor)) { if (blocked) { route.waitReason = `Porte ${key} maintenue fermée pour l'interaction`; return start; } continue; }
      if (!requestDoor(opening, agentId)) { route.waitReason = `Passage ${key} réservé par un autre PNJ`; return start; }
      route.doors.add(opening);
    }
    if (blocked) { route.waitReason = `Battant ${key} sur le trajet, attente d'ouverture`; return start; }
  }
  releaseClearedDoors(route, agentId, profile, proposed);
  return proposed;
}

/** Returns a safe movement, or the current point while waiting for a door / another agent. */
export function followRoute(route: RouteState, agentId: string, start: Point, target: Point, travel: number, steer?: (direction: Point, remaining: number) => Point, owner?: string, interaction = false, closedDoor?: DoorKey): Point {
  route.waitReason = undefined;
  owner = owner ? getInteractionOwner(owner) : undefined;
  const crowd = route.crowd;
  if (crowd?.graph || crowd?.planning) {
    const reachable = limitAgentMovement(agentId, crowd.resume.start, crowd.resume.next);
    if (reachable.x === crowd.resume.next.x && reachable.z === crowd.resume.next.z) {
      // The obstruction has cleared: recover the shorter static route without
      // rebuilding a crowd graph every time a distant actor moves.
      if (route.search?.kind === 'crowd') { route.search.job.cancel(); route.search = undefined; }
      route.crowd = undefined;
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
    route.crowd = undefined;
  }
  const failed = route.failure;
  if (failed) {
    if (failed.graph === getNavigationGraph(getAgentProfile(agentId), undefined, closedDoor)
      && failed.start.x === start.x && failed.start.z === start.z
      && failed.target.x === target.x && failed.target.z === target.z
      && failed.owner === owner && failed.interaction === interaction && failed.closedDoor === closedDoor
      && actorBlocksUnchanged(failed.actorBlockers)) return start;
    route.failure = undefined;
    route.error = null;
    route.graph = null;
    route.approach = undefined;
    route.exit = undefined;
  }
  beginActorBlockCheck(agentId);
  let position: Point;
  let actorBlockers: ActorBlockers;
  try { position = advanceRoute(route, agentId, start, target, travel, steer, owner, interaction, closedDoor); }
  finally { actorBlockers = endActorBlockCheck(agentId); }
  if (route.error) {
    route.failure = { graph: getNavigationGraph(getAgentProfile(agentId), undefined, closedDoor), start: { ...start }, target: { ...target }, owner, interaction, closedDoor, actorBlockers };
    // An impossible route must not retain a passage needed by other agents.
    releaseAgentDoors(agentId);
    route.doors.clear();
  }
  const limited = limitAgentMovement(agentId, start, position);
  if (limited.x !== position.x || limited.z !== position.z) {
    route.waitReason = 'Déplacement limité par le corps d’un autre PNJ';
    // A stop at contact is insufficient: keep a real path around the other bodies.
    const base = route.crowd && (route.crowd.graph === route.graph || route.crowd.planning) ? route.crowd.base
      : route.graph ?? getNavigationGraph(getAgentProfile(agentId), undefined, closedDoor);
    const obstacles = getAgentObstacles(agentId, start);
    const signature = JSON.stringify(obstacles);
    if (obstacles.length && (route.crowd?.planning || route.crowd?.base !== base || route.crowd.signature !== signature)) {
      // Finish the current crowd snapshot instead of restarting for every
      // moving actor. Live movement collision checks still protect every step.
      let crowd = route.crowd;
      if (!crowd?.planning || crowd.base !== base) {
        const graph = new VisibilityGraph(mergeObstacles([...base.obstacles, ...obstacles.map(polygon => [polygon])]));
        crowd = { base, graph: null, planning: graph, signature,
          resume: crowd?.resume ?? { start: { ...start }, next: route.path[route.index] ?? target } };
        route.crowd = crowd;
      }
      const graph = crowd.planning!;
      const goal = route.target ?? target;
      const path = searchPath(route, graph, start, goal, 'crowd');
      if (path === undefined) return limited;
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

function advanceRoute(route: RouteState, agentId: string, start: Point, target: Point, travel: number, steer?: (direction: Point, remaining: number) => Point, owner?: string, interaction = false, closedDoor?: DoorKey): Point {
  const profile = getAgentProfile(agentId);
  route.closedDoor = closedDoor;
  if (closedDoor) {
    if (!requestDoor(closedDoor, agentId, 'closed')) { route.waitReason = `Attente de réservation de la porte ${closedDoor} pour l'interaction`; return start; }
    route.doors.add(doorOpeningKey(closedDoor));
  }
  // Furniture transitions change continuously. Keep the existing route if safe, and wait
  // for the final geometry before computing a replacement; never rebuild per frame.
  if (movingFurniture.size) {
    const next = route.path[route.index];
    if (!next) { route.waitReason = `Meubles en mouvement : ${[...movingFurniture].join(', ')}`; return start; }
    const changed = [...furnitureObstacles.values()].filter(o => o.yMin < profile.height && o.yMax > 0).map(o => [inflate(o.polygon, profile.radius)]);
    if (!segmentFree(start, next, changed)) { route.waitReason = `Trajet coupé par un meuble en mouvement : ${[...movingFurniture].join(', ')}`; return start; }
  }
  const base = getNavigationGraph(profile, undefined, closedDoor);
  let graph = movingFurniture.size && route.graph ? route.graph : route.crowd?.base === base && route.crowd.graph ? route.crowd.graph : base;
  const owned = (id: string) => [...furnitureObstacles.values()].filter(o => o.owner === id && o.yMin < profile.height && o.yMax > 0).map(o => inflate(o.polygon, profile.radius));
  const contained = (id: string, p: Point) => owned(id).some(polygon => pointInRing(p, polygon));
  const localMove = (goal: Point, id: string): Point => {
    const baseLocal = getNavigationGraph(profile, id, closedDoor);
    const localGraph = route.crowd?.base === baseLocal && route.crowd.graph ? route.crowd.graph : baseLocal;
    if (route.graph !== localGraph || route.target?.x !== goal.x || route.target?.z !== goal.z) {
      const path = searchPath(route, localGraph, start, goal, 'local');
      if (path === undefined) return start;
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
    return passDoors(route, agentId, profile, start, next, proposed, travel);
  };
  const approachFor = (id: string, goal: Point, exiting: boolean) => getObjectApproach(id, goal, agentId, start, exiting, undefined, closedDoor);
  // A previous interaction may leave us inside a different object's clearance.
  // Discard its owner before detecting the obstacle we actually need to exit.
  if (route.owner && !contained(route.owner, start)) route.owner = undefined;
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
  if (!route.target || route.target.x !== target.x || route.target.z !== target.z || route.graph !== graph) {
    if (!planRoute(route, agentId, start, target)) return start;
    graph = route.graph!;
  }
  if (route.error) return start;
  while (route.index < route.path.length && distance(start, route.path[route.index]) === 0) route.index++;
  let next = route.path[route.index];
  if (!next) { resetRoute(route, agentId, closedDoor); return target; }
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
  const steered = steer?.(direction, remaining) ?? direction;
  const step = Math.min(travel, remaining);
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
  return passDoors(route, agentId, profile, start, next, proposed, travel);
}

/** Computed only when reporting a stop, never on every walking frame. */
export function describeNavigationBlock(agentId: string, start: Point, target: Point, route: RouteState, actorBlockers?: ActorBlockers): string {
  const profile = getAgentProfile(agentId);
  const at = (point: Point) => `(${point.x.toFixed(1)}, ${point.z.toFixed(1)})`;
  const details = [`position ${at(start)} → cible ${at(target)}`, `rayon ${profile.radius.toFixed(1)} cm`];
  if (route.owner) details.push(`sortie de ${route.owner}`);
  const next = route.path[route.index];
  if (next) details.push(`prochain point ${at(next)}`);
  const doors = new Set([...route.doors, ...(route.closedDoor ? [route.closedDoor] : [])]);
  if (doors.size) details.push(`portes : ${[...doors].map(key => `${key} (${doorCollisionState[key].angle.toFixed(2)} rad)`).join(', ')}`);
  for (const [label, point] of [['départ', start], ['cible', target]] as const) {
    const obstacles = [...architectureObstacles, ...furnitureObstacles.values()]
      .filter(o => o.yMin < profile.height && o.yMax > 0 && pointInRing(point, inflate(o.polygon, profile.radius)))
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
  const candidate = { x: xMin + Math.random() * (xMax - xMin), z: zMin + Math.random() * (zMax - zMin) };
  return inSurface(candidate) && isAgentDestinationFree(agentId, candidate) && graph.canReach(start, candidate) ? candidate : null;
}
