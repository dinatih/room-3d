import polygonClipping from 'polygon-clipping';
import { ComfortField, type NavigationComfort } from './comfort';

export interface Point { x: number; z: number }
export type Polygon = Point[];
export const GEOMETRY_EPSILON = 1e-7;
/** Maximum error of the conservative circular clearance approximation, in cm. */
export const CLEARANCE_ERROR = 0.1;
/** Boolean operations require coincident CAD edges to share the same numeric coordinates. */
export const BOOLEAN_PRECISION = 1e-5;
const snap = (n: number) => Math.round(n / BOOLEAN_PRECISION) * BOOLEAN_PRECISION;
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);
export function projectToSegment(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x, dz = b.z - a.z;
  const lengthSquared = dx * dx + dz * dz;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / lengthSquared));
  return { x: a.x + dx * t, z: a.z + dz * t };
}
const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
const ringBounds = new WeakMap<Polygon, { minX: number; maxX: number; minZ: number; maxZ: number }>();
function bounds(ring: Polygon) {
  let result = ringBounds.get(ring);
  if (!result) {
    result = { minX: Math.min(...ring.map(p => p.x)), maxX: Math.max(...ring.map(p => p.x)), minZ: Math.min(...ring.map(p => p.z)), maxZ: Math.max(...ring.map(p => p.z)) };
    ringBounds.set(ring, result);
  }
  return result;
}

export function convexHull(points: Point[]): Polygon {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.z - b.z);
  const half = (vertices: Point[]) => {
    const result: Point[] = [];
    for (const p of vertices) {
      while (result.length >= 2 && cross(result[result.length - 2], result[result.length - 1], p) <= GEOMETRY_EPSILON) result.pop();
      result.push(p);
    }
    return result;
  };
  const lower = half(sorted), upper = half(sorted.reverse());
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

export function rectangle(x: number, z: number, w: number, d: number, ry = 0): Polygon {
  const c = Math.cos(ry), s = Math.sin(ry);
  return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]]
    .map(([px, pz]) => ({ x: x + c * px + s * pz, z: z - s * px + c * pz }));
}

export function inflate(polygon: Polygon, radius: number): Polygon {
  if (radius === 0) return polygon;
  const count = Math.ceil(Math.PI / Math.acos(radius / (radius + CLEARANCE_ERROR)));
  const circumradius = radius / Math.cos(Math.PI / count);
  const offsets = Array.from({ length: count }, (_, i) => ({ x: circumradius * Math.cos(2 * Math.PI * i / count), z: circumradius * Math.sin(2 * Math.PI * i / count) }));
  return convexHull(polygon.flatMap(p => offsets.map(o => ({ x: snap(p.x + o.x), z: snap(p.z + o.z) }))));
}

export function pointInRing(p: Point, ring: Polygon): boolean {
  const box = bounds(ring);
  if (p.x < box.minX || p.x > box.maxX || p.z < box.minZ || p.z > box.maxZ) return false;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j], b = ring[i];
    if (Math.abs(cross(a, b, p)) <= GEOMETRY_EPSILON && p.x >= Math.min(a.x, b.x) - GEOMETRY_EPSILON && p.x <= Math.max(a.x, b.x) + GEOMETRY_EPSILON && p.z >= Math.min(a.z, b.z) - GEOMETRY_EPSILON && p.z <= Math.max(a.z, b.z) + GEOMETRY_EPSILON) return false;
    if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
}

/** Rings keep their holes: a courtyard enclosed by obstacles must remain free. */
export function union(polygons: Polygon[]): Polygon[][] {
  return mergeObstacles(polygons.map(p => [p]));
}

/** Merge existing obstacles while preserving holes and new intersection corners. */
export function mergeObstacles(obstacles: Polygon[][]): Polygon[][] {
  if (!obstacles.length) return [];
  const inputs = obstacles.map(rings => rings.map(r => r.map(v => [snap(v.x), snap(v.z)] as [number, number])));
  return polygonClipping.union(inputs[0], ...inputs.slice(1)).map(p => p.map(r => r.slice(0, -1).map(([x, z]) => ({ x, z }))));
}

export function insideObstacle(p: Point, obstacles: Polygon[][]): boolean {
  return obstacles.some(rings => {
    if (!pointInRing(p, rings[0])) return false;
    return !rings.slice(1).some(hole => {
      if (pointInRing(p, hole)) return true;
      return hole.some((a, i) => {
        const b = hole[(i + 1) % hole.length];
        return Math.abs(cross(a, b, p)) <= GEOMETRY_EPSILON && p.x >= Math.min(a.x, b.x) - GEOMETRY_EPSILON && p.x <= Math.max(a.x, b.x) + GEOMETRY_EPSILON && p.z >= Math.min(a.z, b.z) - GEOMETRY_EPSILON && p.z <= Math.max(a.z, b.z) + GEOMETRY_EPSILON;
      });
    });
  });
}

export function segmentFree(a: Point, b: Point, obstacles: Polygon[][], endpointsFree = false): boolean {
  if (!endpointsFree && (insideObstacle(a, obstacles) || insideObstacle(b, obstacles))) return false;
  const ts = [0, 1];
  const dx = b.x - a.x, dz = b.z - a.z;
  const endpointTolerance = GEOMETRY_EPSILON / Math.max(GEOMETRY_EPSILON, distance(a, b));
  for (const rings of obstacles) for (const ring of rings) {
    const box = bounds(ring);
    if (Math.max(a.x, b.x) < box.minX || Math.min(a.x, b.x) > box.maxX || Math.max(a.z, b.z) < box.minZ || Math.min(a.z, b.z) > box.maxZ) continue;
    for (let i = 0; i < ring.length; i++) {
    const c = ring[i], d = ring[(i + 1) % ring.length];
    const ex = d.x - c.x, ez = d.z - c.z;
    const denominator = dx * ez - dz * ex;
    if (Math.abs(denominator) <= GEOMETRY_EPSILON) continue;
    const t = ((c.x - a.x) * ez - (c.z - a.z) * ex) / denominator;
    const u = ((c.x - a.x) * dz - (c.z - a.z) * dx) / denominator;
    if (t > endpointTolerance && t < 1 - endpointTolerance && u >= 0 && u <= 1) {
      const vertexTolerance = GEOMETRY_EPSILON / Math.max(GEOMETRY_EPSILON, distance(c, d));
      // A transverse crossing of an edge's interior necessarily enters solid space.
      // Vertex touches need the interval test below to distinguish a tangent.
      if (u > vertexTolerance && u < 1 - vertexTolerance) return false;
      ts.push(t);
    }
    }
  }
  ts.sort((x, y) => x - y);
  for (let i = 1; i < ts.length; i++) {
    const t = (ts[i - 1] + ts[i]) / 2;
    if (insideObstacle({ x: a.x + dx * t, z: a.z + dz * t }, obstacles)) return false;
  }
  return true;
}

export class VisibilityGraph {
  readonly vertices: Point[];
  private corners: { previous: Point; next: Point; convex: boolean }[];
  private edges = new Map<number, { to: number; cost: number }[]>();
  private comfortField?: ComfortField;
  private physicalGraph?: VisibilityGraph;
  private clearances: number[] = [];
  private comfortEdges = new Map<number, Map<number, number>>();
  constructor(readonly obstacles: Polygon[][], readonly comfort?: NavigationComfort) {
    this.vertices = obstacles.flat(2);
    this.corners = obstacles.flatMap(rings => rings.flatMap(ring => ring.map((point, i) => {
      const previous = ring[(i + ring.length - 1) % ring.length], next = ring[(i + 1) % ring.length];
      return { previous, next, convex: cross(previous, point, next) > GEOMETRY_EPSILON };
    })));
    if (comfort) {
      this.comfortField = new ComfortField(obstacles, comfort.distance);
      this.physicalGraph = new VisibilityGraph(obstacles);
      this.vertices.push(...comfort.obstacles.flat(2).filter(p => !insideObstacle(p, obstacles)));
      this.clearances = this.vertices.map(p => this.comfortField!.clearance(p));
    }
  }

  /** Length plus the integrated cost of travelling within the comfort band. */
  segmentCost(a: Point, b: Point): number {
    return this.comfortField ? this.comfortField.cost(a, b) : distance(a, b);
  }

  /** Exact physical distance is a stronger admissible heuristic in a furnished
   * apartment than a straight line through several walls. Reuse sparse edges. */
  private distanceEstimator(target: Point): (p: Point) => number {
    const remaining = new Map<number, number>();
    const open = new Set<number>();
    for (let i = 0; i < this.vertices.length; i++) {
      if (this.tangent(i, target) && segmentFree(this.vertices[i], target, this.obstacles, true)) {
        remaining.set(i, distance(this.vertices[i], target)); open.add(i);
      }
    }
    while (open.size) {
      const current = [...open].reduce((a, b) => remaining.get(a)! <= remaining.get(b)! ? a : b);
      open.delete(current);
      for (const edge of this.neighbors(current)) {
        const candidate = remaining.get(current)! + edge.cost;
        if (candidate < (remaining.get(edge.to) ?? Infinity)) { remaining.set(edge.to, candidate); open.add(edge.to); }
      }
    }
    return p => {
      if (segmentFree(p, target, this.obstacles, true)) return distance(p, target);
      let best = Infinity;
      for (const [i, rest] of remaining) {
        const candidate = distance(p, this.vertices[i]) + rest;
        if (candidate < best && this.tangent(i, p) && segmentFree(p, this.vertices[i], this.obstacles, true)) best = candidate;
      }
      return best;
    };
  }

  private findComfort(start: Point, target: Point): Point[] | null {
    // Reject disconnected destinations with the sparse physical graph first.
    // Its feasible route also supplies an upper bound for the weighted search.
    const physicalPath = this.physicalGraph!.find(start, target);
    if (!physicalPath) return null;
    let bestPath = physicalPath;
    let bestCost = physicalPath.reduce((sum, p, i) => sum + this.segmentCost(i ? physicalPath[i - 1] : start, p), 0);
    const direct = segmentFree(start, target, this.obstacles, true) ? this.segmentCost(start, target) : Infinity;
    if (direct === distance(start, target)) return [target];
    if (direct <= bestCost) { bestPath = [target]; bestCost = direct; }
    // A long wall may have no corner near either endpoint. Project onto its
    // comfort contour so a small parallel detour remains available there too.
    const projections: Point[] = [];
    for (const ring of this.comfort!.obstacles.flat()) for (let i = 0; i < ring.length; i++) for (const endpoint of [start, target]) {
      const p = projectToSegment(endpoint, ring[i], ring[(i + 1) % ring.length]);
      if (distance(p, endpoint) <= this.comfort!.distance && !insideObstacle(p, this.obstacles)) projections.push(p);
    }
    const nodes = [...this.vertices, ...projections, start, target];
    const clearances = [...this.clearances, ...[...projections, start, target].map(p => this.comfortField!.clearance(p))];
    const startIndex = nodes.length - 2, targetIndex = nodes.length - 1;
    const physicalDistance = this.physicalGraph!.distanceEstimator(target);
    const estimates = new Map<number, number>([[targetIndex, 0]]);
    const estimate = (index: number) => {
      if (!estimates.has(index)) estimates.set(index, physicalDistance(nodes[index]));
      return estimates.get(index)!;
    };
    // Lazy edge A*: first queue the analytic lower bound, then evaluate
    // visibility and proximity only when that edge can improve the route.
    // Exact edges return to the queue before their destination is settled.
    type Edge = { from: number; to: number; cost: number; priority: number; exact: boolean };
    const open: Edge[] = [];
    const push = (edge: Edge) => {
      let i = open.length;
      open.push(edge);
      while (i > 0) {
        const parent = (i - 1) >> 1;
        if (open[parent].priority <= edge.priority) break;
        open[i] = open[parent]; i = parent;
      }
      open[i] = edge;
    };
    const pop = (): Edge => {
      const result = open[0], last = open.pop()!;
      if (open.length) {
        let i = 0;
        while (2 * i + 1 < open.length) {
          let child = 2 * i + 1;
          if (child + 1 < open.length && open[child + 1].priority < open[child].priority) child++;
          if (last.priority <= open[child].priority) break;
          open[i] = open[child]; i = child;
        }
        open[i] = last;
      }
      return result;
    };
    const costs = new Map([[startIndex, 0]]), parents = new Map<number, number>();
    const expand = (current: number) => {
      for (let to = 0; to < nodes.length; to++) {
        if (costs.has(to)) continue;
        const cost = costs.get(current)! + this.comfortField!.minimumCost(distance(nodes[current], nodes[to]), clearances[current], clearances[to]);
        if (cost + distance(nodes[to], target) >= bestCost) continue;
        const priority = cost + estimate(to);
        if (priority < bestCost) push({ from: current, to, cost, priority, exact: false });
      }
    };
    expand(startIndex);
    while (open.length) {
      const edge = pop();
      if (edge.priority >= bestCost) return bestPath;
      const { from: current, to } = edge;
      if (costs.has(to)) continue;
      if (edge.exact) {
        costs.set(to, edge.cost); parents.set(to, current);
        if (to !== targetIndex) { expand(to); continue; }
        const result: Point[] = [target];
        let index = to;
        while (parents.get(index) !== startIndex) { index = parents.get(index)!; result.unshift(nodes[index]); }
        return result;
      }
      let cost: number;
      if (current < this.vertices.length && to < this.vertices.length) {
        const first = Math.min(current, to), second = Math.max(current, to);
        let connections = this.comfortEdges.get(first);
        if (!connections) { connections = new Map(); this.comfortEdges.set(first, connections); }
        const cached = connections.get(second);
        cost = cached ?? (segmentFree(nodes[current], nodes[to], this.obstacles, true) ? this.segmentCost(nodes[current], nodes[to]) : Infinity);
        if (cached === undefined) connections.set(second, cost);
      } else cost = segmentFree(nodes[current], nodes[to], this.obstacles, true) ? this.segmentCost(nodes[current], nodes[to]) : Infinity;
      const candidate = costs.get(current)! + cost;
      const priority = candidate + estimate(to);
      if (priority < bestCost) push({ from: current, to, cost: candidate, priority, exact: true });
    }
    return bestPath;
  }
  private tangent(index: number, target: Point): boolean {
    const { previous, next, convex } = this.corners[index];
    if (!convex) return false;
    const a = cross(this.vertices[index], previous, target), b = cross(this.vertices[index], next, target);
    // A shortest path can only turn at a convex obstacle corner, along a tangent.
    // Rays between the two boundary directions can always be shortened past it.
    return !((a > GEOMETRY_EPSILON && b < -GEOMETRY_EPSILON) || (a < -GEOMETRY_EPSILON && b > GEOMETRY_EPSILON));
  }
  private neighbors(index: number) {
    let edges = this.edges.get(index);
    if (!edges) {
      edges = [];
      for (let i = 0; i < this.vertices.length; i++) {
        if (i !== index && this.tangent(index, this.vertices[i]) && this.tangent(i, this.vertices[index]) && segmentFree(this.vertices[index], this.vertices[i], this.obstacles, true)) edges.push({ to: i, cost: distance(this.vertices[index], this.vertices[i]) });
      }
      this.edges.set(index, edges);
    }
    return edges;
  }
  find(start: Point, target: Point): Point[] | null {
    if (![start.x, start.z, target.x, target.z].every(Number.isFinite)) throw new Error('Non-finite navigation coordinates');
    if (insideObstacle(start, this.obstacles) || insideObstacle(target, this.obstacles)) return null;
    if (this.comfort) return this.findComfort(start, target);
    if (segmentFree(start, target, this.obstacles, true)) return [target];
    const nodes = [...this.vertices, start, target];
    const startIndex = nodes.length - 2, targetIndex = nodes.length - 1;
    const endpointEdges = new Map<number, { to: number; cost: number }[]>();
    const endConnections = new Map<number, { to: number; cost: number }[]>();
    for (const endpoint of [startIndex, targetIndex]) for (let i = 0; i < this.vertices.length; i++) {
      if (!this.tangent(i, nodes[endpoint]) || !segmentFree(nodes[endpoint], nodes[i], this.obstacles, true)) continue;
      const cost = distance(nodes[endpoint], nodes[i]);
      const edges = endpointEdges.get(endpoint) ?? [];
      edges.push({ to: i, cost }); endpointEdges.set(endpoint, edges);
      const connections = endConnections.get(i) ?? [];
      connections.push({ to: endpoint, cost }); endConnections.set(i, connections);
    }
    const open = new Set([startIndex]);
    const costs = new Map([[startIndex, 0]]), parents = new Map<number, number>();
    while (open.size) {
      const current = [...open].reduce((a, b) => (costs.get(a)! + distance(nodes[a], target) <= costs.get(b)! + distance(nodes[b], target) ? a : b));
      if (current === targetIndex) {
        const result: Point[] = [target];
        let index = current;
        while (parents.get(index) !== startIndex) {
          index = parents.get(index)!;
          result.unshift(nodes[index]);
        }
        return result;
      }
      open.delete(current);
      for (const { to, cost } of (current >= startIndex ? endpointEdges.get(current) ?? [] : [...this.neighbors(current), ...(endConnections.get(current) ?? [])])) {
        const candidate = costs.get(current)! + cost;
        if (candidate >= (costs.get(to) ?? Infinity)) continue;
        costs.set(to, candidate);
        parents.set(to, current);
        open.add(to);
      }
    }
    return null;
  }
}
