import { positionState } from '../../positionState';
import { movingFurniture } from '../../furniturePositions';
import { architectureObstacles, walkableSurfaces } from './architecture';
import { furnitureObstacles, getObstacleRevision, getAgentProfile, navigationDebug, type AgentProfile } from './obstacles';
import { inflate, union, VisibilityGraph, rectangle, pointInRing, insideObstacle, segmentFree, distance, projectToSegment, BOOLEAN_PRECISION, type Point, type Polygon } from './geometry';
import { DOOR_CONFIGS, computeDoorAllowedAngle, doorCollisionState, glassShutterState } from '../../doorObstacles';
import { requestDoor, releaseDoor, releaseAgentDoors, doorOpeningKey, type DoorKey } from './doorRequests';

export { architectureObstacles };
export const doorKeys = Object.keys(DOOR_CONFIGS) as DoorKey[];
export function doorPolygon(key: DoorKey, angle: number): Polygon {
  const d = DOOR_CONFIGS[key], c = Math.cos(Math.abs(angle)), s = Math.sin(Math.abs(angle));
  const dx = c * d.closedDir.x + s * d.openNormal.x, dz = c * d.closedDir.z + s * d.openNormal.z;
  return rectangle(d.pivot.x + dx * d.length / 2, d.pivot.z + dz * d.length / 2, d.length, d.thickness, Math.atan2(-dz, dx));
}
const colliderOwner = (owner: string) => (owner === 'bed-west' || owner === 'bed-east') && positionState['bed-double']?.idx === 1 ? 'bed-double' : owner;
const caches = new Map<string, { revision: number; doorAngles: string; graph: VisibilityGraph }>();
const inSurface = (p: Point) => walkableSurfaces.some(rings => pointInRing(p, rings[0]) && !rings.slice(1).some(h => pointInRing(p, h)));
export function getDoorApproach(key: DoorKey, agentId?: string): Point {
  const door = DOOR_CONFIGS[key];
  const radius = agentId ? getAgentProfile(agentId).radius : 0;
  const clearance = radius + door.thickness / 2 + door.margin;
  const desired = {
    x: door.pivot.x + door.closedDir.x * (door.length + clearance) + door.openNormal.x * clearance,
    z: door.pivot.z + door.closedDir.z * (door.length + clearance) + door.openNormal.z * clearance,
  };
  if (!agentId) return desired;
  const graph = getNavigationGraph(getAgentProfile(agentId));
  if (!insideObstacle(desired, graph.obstacles)) return desired;
  const candidates = graph.vertices.filter(p => inSurface(p) && distance(p, door.pivot) >= door.length + clearance
    && (p.x - door.pivot.x) * door.openNormal.x + (p.z - door.pivot.z) * door.openNormal.z > 0);
  candidates.sort((a, b) => distance(a, desired) - distance(b, desired));
  if (!candidates.length) throw new Error(`No safe approach for door ${key}`);
  return candidates[0];
}
export function getNavigationGraph(profile: AgentProfile, excludeOwner?: string): VisibilityGraph {
  if (excludeOwner) excludeOwner = colliderOwner(excludeOwner);
  const key = `${profile.radius}:${profile.height}:${excludeOwner ?? ''}`;
  const revision = getObstacleRevision();
  const angles = doorKeys.map(k => computeDoorAllowedAngle(DOOR_CONFIGS[k]));
  const shutterBlocked = glassShutterState.clearHeight < profile.height;
  const doorAngles = `${angles.join(':')}:${shutterBlocked}`;
  const old = caches.get(key);
  if (old && (movingFurniture.size || (old.revision === revision && old.doorAngles === doorAngles))) return old.graph;
  const solid = [...architectureObstacles, ...furnitureObstacles.values()].filter(o => o.yMin < profile.height && o.yMax > 0 && (!excludeOwner || o.owner !== excludeOwner));
  const obstacles = solid.map(o => inflate(o.polygon, profile.radius));
  doorKeys.forEach((k, i) => obstacles.push(inflate(doorPolygon(k, angles[i]), profile.radius + DOOR_CONFIGS[k].margin)));
  if (shutterBlocked) for (const key of ['glassLeft', 'glassRight'] as const) obstacles.push(inflate(doorPolygon(key, 0), profile.radius));
  // Surface boundaries are barriers, with the same body clearance as walls.
  for (const rings of walkableSurfaces) for (const ring of rings) for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    obstacles.push(inflate(rectangle((a.x + b.x) / 2, (a.z + b.z) / 2, distance(a, b), 0, Math.atan2(a.z - b.z, b.x - a.x)), profile.radius));
  }
  const graph = new VisibilityGraph(union(obstacles));
  caches.set(key, { revision, doorAngles, graph });
  return graph;
}

/** Reach an object's inflated boundary without ignoring unrelated obstacles. */
export function getObjectApproach(owner: string, goal: Point, agentId: string, start?: Point, exiting = false): Point | null {
  owner = colliderOwner(owner);
  const profile = getAgentProfile(agentId), graph = getNavigationGraph(profile);
  const owned = [...furnitureObstacles.values()].filter(o => o.owner === owner && o.yMin < profile.height && o.yMax > 0).map(o => inflate(o.polygon, profile.radius));
  if (!exiting && !owned.some(p => pointInRing(goal, p))) return goal;
  exiting = exiting || Boolean(start && owned.some(p => pointInRing(start, p)));
  const edges = owned.flatMap(polygon => polygon.map((a, i) => [a, polygon[(i + 1) % polygon.length]] as const));
  const candidates = edges.flatMap(([a, b]) => [a, projectToSegment(goal, a, b), ...(start ? [projectToSegment(start, a, b)] : [])]);
  // Other obstacles can cover an entire corner: include their intersections with the owner's boundary.
  candidates.push(...graph.vertices.filter(p => edges.some(([a, b]) => distance(p, projectToSegment(p, a, b)) <= Math.SQRT2 * BOOLEAN_PRECISION)));
  candidates.sort((a, b) => distance(a, goal) - distance(b, goal));
  for (const p of candidates) {
    if (!inSurface(p) || !graph.find(p, p)) continue;
    if (exiting && start ? !segmentFree(start, p, getNavigationGraph(profile, owner).obstacles) : !graph.find(p, p)) continue;
    if (start && !exiting && !graph.find(start, p)) continue;
    return p;
  }
  return null;
}

export interface RouteState {
  path: Point[];
  index: number;
  target: Point | null;
  graph: VisibilityGraph | null;
  error: string | null;
  doors: Set<DoorKey>;
  owner?: string;
  approach?: Point;
  interactionTarget?: Point;
  exit?: { owner: string; graph: VisibilityGraph; point: Point };
}
export const createRouteState = (): RouteState => ({ path: [], index: 0, target: null, graph: null, error: null, doors: new Set() });
export function resetRoute(route: RouteState, agentId: string): void {
  releaseAgentDoors(agentId);
  route.path = []; route.index = 0; route.target = null; route.graph = null; route.error = null; route.doors.clear();
  route.approach = undefined; route.interactionTarget = undefined;
  route.exit = undefined;
  navigationDebug.delete(agentId);
}

export function planRoute(route: RouteState, agentId: string, start: Point, target: Point): boolean {
  const profile = getAgentProfile(agentId), graph = getNavigationGraph(profile);
  if (!inSurface(start) || !inSurface(target)) {
    route.error = 'Destination ou départ hors du sol praticable';
  } else {
    const path = graph.find(start, target);
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
    const leaves = doorKeys.filter(k => doorOpeningKey(k) === opening);
    const points = [position, ...route.path.slice(route.index)];
    const crossingAhead = leaves.some(k => {
      const closed = [[inflate(doorPolygon(k, 0), profile.radius + DOOR_CONFIGS[k].margin)]];
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
    const closed = [[inflate(doorPolygon(key, 0), profile.radius + d.margin)]];
    const crossing = !segmentFree(start, next, closed);
    const actual = [[inflate(doorPolygon(key, doorCollisionState[key].angle), profile.radius + d.margin)]];
    const blocked = !segmentFree(start, proposed, actual);
    if (route.doors.has(opening) || blocked || (crossing && (distance(start, d.pivot) <= d.length + clearance + travel || !segmentFree(start, proposed, closed)))) {
      if (!requestDoor(opening, agentId)) return start;
      route.doors.add(opening);
    }
    if (blocked) return start;
  }
  releaseClearedDoors(route, agentId, profile, proposed);
  return proposed;
}

/** Returns a safe movement, or the current point while waiting for a door / another agent. */
export function followRoute(route: RouteState, agentId: string, start: Point, target: Point, travel: number, steer?: (direction: Point, remaining: number) => Point, owner?: string, interaction = false): Point {
  if (owner) owner = colliderOwner(owner);
  const profile = getAgentProfile(agentId);
  // Furniture transitions change continuously. Keep the existing route if safe, and wait
  // for the final geometry before computing a replacement; never rebuild per frame.
  if (movingFurniture.size) {
    const next = route.path[route.index];
    if (!next) return start;
    const changed = [...furnitureObstacles.values()].filter(o => o.yMin < profile.height && o.yMax > 0).map(o => [inflate(o.polygon, profile.radius)]);
    if (!segmentFree(start, next, changed)) return start;
  }
  const graph = movingFurniture.size && route.graph ? route.graph : getNavigationGraph(profile);
  const owned = (id: string) => [...furnitureObstacles.values()].filter(o => o.owner === id && o.yMin < profile.height && o.yMax > 0).map(o => inflate(o.polygon, profile.radius));
  const contained = (id: string, p: Point) => owned(id).some(polygon => pointInRing(p, polygon));
  const localMove = (goal: Point, id: string): Point => {
    const localGraph = getNavigationGraph(profile, id);
    if (route.graph !== localGraph || route.target?.x !== goal.x || route.target?.z !== goal.z) {
      const path = localGraph.find(start, goal);
      if (!path) {
        route.error = `Transition d'interaction bloquée (${id})`;
        navigationDebug.set(agentId, { path: [], target: goal, error: route.error });
        return start;
      }
      route.path = path; route.index = 0; route.target = { ...goal }; route.graph = localGraph;
      navigationDebug.set(agentId, { path: [start, ...path], target: goal });
    }
    route.error = null;
    while (route.index < route.path.length && distance(start, route.path[route.index]) < 1e-6) route.index++;
    const next = route.path[route.index];
    if (!next) return goal;
    const length = distance(start, next);
    const step = Math.min(travel, length);
    const proposed = step === length ? { ...next } : { x: start.x + (next.x - start.x) * step / length, z: start.z + (next.z - start.z) * step / length };
    return passDoors(route, agentId, profile, start, next, proposed, travel);
  };
  const approachFor = (id: string, goal: Point, exiting: boolean) => getObjectApproach(id, goal, agentId, start, exiting);
  if (!route.owner && owner && contained(owner, start)) route.owner = owner;
  if (route.owner && contained(route.owner, start) && !(interaction && owner === route.owner)) {
    if (route.exit?.owner !== route.owner || route.exit.graph !== graph) {
      const point = approachFor(route.owner, target, true);
      route.exit = point ? { owner: route.owner, graph, point } : undefined;
    }
    const exit = route.exit?.point;
    if (!exit) { route.error = `Aucune sortie praticable de ${route.owner}`; navigationDebug.set(agentId, { path: [], target, error: route.error }); return start; }
    return localMove(exit, route.owner);
  }
  if (route.owner && !contained(route.owner, start)) route.owner = undefined;
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
  }
  if (route.error) return start;
  while (route.index < route.path.length && distance(start, route.path[route.index]) < 1e-6) route.index++;
  const next = route.path[route.index];
  if (!next) { resetRoute(route, agentId); return target; }
  // A displaced agent must regain a valid route before continuing toward an old vertex.
  if (!segmentFree(start, next, graph.obstacles)) {
    if (!planRoute(route, agentId, start, target)) return start;
    return followRoute(route, agentId, start, target, travel, steer, owner, interaction);
  }
  const remaining = distance(start, next);
  const direction = { x: (next.x - start.x) / remaining, z: (next.z - start.z) / remaining };
  const steered = steer?.(direction, remaining) ?? direction;
  const step = Math.min(travel, remaining);
  let proposed = { x: start.x + steered.x * step, z: start.z + steered.z * step };
  // Steering may enter free space that cannot see the next corner. Preserve visibility
  // so avoiding a neighbour cannot strand the actor behind that corner.
  if (!segmentFree(start, proposed, graph.obstacles) || !segmentFree(proposed, next, graph.obstacles)) proposed = { x: start.x + direction.x * step, z: start.z + direction.z * step };
  if (!segmentFree(start, proposed, graph.obstacles)) return start;
  if (step === remaining && steered.x === direction.x && steered.z === direction.z) proposed = { ...next };
  return passDoors(route, agentId, profile, start, next, proposed, travel);
}

/** Pick free destinations by area, rather than sampling arbitrary room rectangles. */
export function randomReachableTarget(agentId: string, start: Point): Point | null {
  const graph = getNavigationGraph(getAgentProfile(agentId));
  const rings = walkableSurfaces.flat();
  const xs = rings.flat().map(p => p.x), zs = rings.flat().map(p => p.z);
  const xMin = Math.min(...xs), xMax = Math.max(...xs), zMin = Math.min(...zs), zMax = Math.max(...zs);
  const candidate = { x: xMin + Math.random() * (xMax - xMin), z: zMin + Math.random() * (zMax - zMin) };
  return inSurface(candidate) && graph.find(start, candidate) ? candidate : null;
}
