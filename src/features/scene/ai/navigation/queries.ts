import { inflate, union, mergeObstacles, pointInRing, insideObstacle, segmentFree, distance, projectToSegment, BOOLEAN_PRECISION, type Point, type Polygon } from './geometry';
import { NavigationMesh, type NavigationMeshSnapshot } from './mesh';

export interface GraphDefinition {
  surfaces: Polygon[][];
  solids: { polygon: Polygon; radius: number; comfort: boolean }[];
  comfortDistance?: number;
}
export type GraphSnapshot = NavigationMeshSnapshot;
export type ApproachRegion = { x: number; z: number; rotation: number; width: number };
export interface ApproachQuery {
  owner: string;
  goal: Point; start?: Point;
  owned: { polygon: Polygon; radius: number }[];
  surfaces: Polygon[][]; actors: Polygon[];
  exiting: boolean; flexible: boolean; region?: ApproachRegion;
  escape: Polygon[][];
}
export interface DuoQuery { anchor: Point; offsets: Point[]; partner: GraphDefinition; surfaces: Polygon[][] }

export function findDuoPoint(query: DuoQuery, graphA: NavigationMesh): Point | null {
  if (![query.anchor, ...query.offsets].every(p => Number.isFinite(p.x) && Number.isFinite(p.z))) throw new Error('Non-finite navigation coordinates');
  const graphB = buildNavigationGraph(query.partner);
  const obstacles = mergeObstacles([...graphA.obstacles,
    ...query.offsets.flatMap(offset => graphB.obstacles.map(rings => rings.map(ring => ring.map(p => ({ x: p.x - offset.x, z: p.z - offset.z }))))),
  ]);
  const onGround = (p: Point) => query.surfaces.some(rings => pointInRing(p, rings[0]) && !rings.slice(1).some(hole => pointInRing(p, hole)));
  const valid = (p: Point) => onGround(p) && !insideObstacle(p, obstacles) && query.offsets.every(offset => {
    const partner = { x: p.x + offset.x, z: p.z + offset.z };
    return onGround(partner) && graphB.canReach(p, partner);
  });
  if (valid(query.anchor)) return query.anchor;
  const candidates = obstacles.flatMap(rings => rings.flatMap(ring => ring.flatMap((a, i) => [a, projectToSegment(query.anchor, a, ring[(i + 1) % ring.length])])));
  candidates.sort((a, b) => distance(a, query.anchor) - distance(b, query.anchor));
  return candidates.find(valid) ?? null;
}

export function buildNavigationGraph(definition: GraphDefinition): NavigationMesh {
  const obstacles = union(definition.solids.map(o => inflate(o.polygon, o.radius)));
  const comfort = definition.comfortDistance === undefined ? undefined : {
    distance: definition.comfortDistance,
    obstacles: union(definition.solids.filter(o => o.comfort).map(o => inflate(o.polygon, o.radius + definition.comfortDistance!))),
  };
  return new NavigationMesh(obstacles, definition.surfaces, comfort);
}

/** The usual free slot needs only cell connectivity, not another worker query. */
export function directObjectApproach(query: ApproachQuery, graph: Pick<NavigationMesh, 'obstacles' | 'canReach'>): Point | null {
  const { goal, start, region } = query;
  if (query.exiting) return null;
  if (region) {
    const dx = goal.x - region.x, dz = goal.z - region.z, c = Math.cos(region.rotation), s = Math.sin(region.rotation);
    if (-(dx * s + dz * c) < 0 || Math.abs(dx * c - dz * s) > region.width / 2) return null;
  }
  if (!query.surfaces.some(rings => pointInRing(goal, rings[0]) && !rings.slice(1).some(h => pointInRing(goal, h)))) return null;
  if (query.owned.some(o => pointInRing(goal, inflate(o.polygon, o.radius))) || insideObstacle(goal, graph.obstacles)
    || insideObstacle(goal, query.actors.map(p => [p])) || start && !graph.canReach(start, goal)) return null;
  return goal;
}

/** Ordered physically reachable candidates; live actor reservations are checked on receipt. */
export function objectApproachCandidates(query: ApproachQuery, graph: Pick<NavigationMesh, 'vertices' | 'obstacles' | 'canReach'>): Point[] {
  const { goal, start, surfaces, flexible, region } = query;
  const owned = query.owned.map(o => inflate(o.polygon, o.radius));
  const onGround = (p: Point) => surfaces.some(rings => pointInRing(p, rings[0]) && !rings.slice(1).some(h => pointInRing(p, h)));
  const accepts = (p: Point) => {
    if (!region) return true;
    const dx = p.x - region.x, dz = p.z - region.z, c = Math.cos(region.rotation), s = Math.sin(region.rotation);
    return -(dx * s + dz * c) >= 0 && Math.abs(dx * c - dz * s) <= region.width / 2;
  };
  const validGoal = !query.exiting && accepts(goal) && onGround(goal) && !owned.some(p => pointInRing(goal, p)) && !insideObstacle(goal, graph.obstacles) && (!start || graph.canReach(start, goal));
  const actors = query.actors.map(p => [p]);
  if (validGoal && !insideObstacle(goal, actors)) return [goal];
  const exiting = query.exiting || Boolean(start && owned.some(p => pointInRing(start, p)));
  const reachesGoal = (p: Point) => !exiting || insideObstacle(goal, graph.obstacles) || graph.canReach(p, goal);
  const preferred = exiting && start ? start : goal;
  const contours = owned.length && !flexible ? owned : [...graph.obstacles.flat(), ...query.actors];
  const edges = contours.flatMap(polygon => polygon.map((a, i) => [a, polygon[(i + 1) % polygon.length]] as const));
  const candidates = edges.flatMap(([a, b]) => [a, projectToSegment(goal, a, b), ...(start ? [projectToSegment(start, a, b)] : [])]);
  if (owned.length && !flexible) for (const [a, b] of edges) {
    const cuts = [a, b, ...graph.vertices.filter(p => distance(p, projectToSegment(p, a, b)) <= Math.SQRT2 * BOOLEAN_PRECISION).map(p => projectToSegment(p, a, b))];
    cuts.sort((p, q) => distance(a, p) - distance(a, q));
    candidates.push(...cuts);
    for (let i = 1; i < cuts.length; i++) {
      const p = cuts[i - 1], q = cuts[i];
      candidates.push({ x: (p.x + q.x) / 2, z: (p.z + q.z) / 2 }, projectToSegment(preferred, p, q));
    }
  }
  candidates.sort((a, b) => distance(a, preferred) - distance(b, preferred));
  const reachable: Point[] = validGoal ? [goal] : [];
  for (const p of candidates) {
    if (!accepts(p) || !onGround(p) || insideObstacle(p, graph.obstacles) || !reachesGoal(p)) continue;
    if (start && (exiting ? !segmentFree(start, p, query.escape) : !graph.canReach(start, p))) continue;
    reachable.push(p);
    if (!insideObstacle(p, actors)) return reachable;
  }
  if (exiting) {
    reachable.push(...candidates.filter(p => onGround(p) && !insideObstacle(p, graph.obstacles) && reachesGoal(p) && (!start || segmentFree(start, p, query.escape))));
    reachable.push(...candidates.filter(p => onGround(p) && !insideObstacle(p, graph.obstacles) && reachesGoal(p)));
  }
  return reachable;
}
