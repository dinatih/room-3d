import polygonClipping from 'polygon-clipping';

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
  if (!polygons.length) return [];
  const inputs = polygons.map(p => [p.map(v => [snap(v.x), snap(v.z)] as [number, number])]);
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
  private edges = new Map<number, { to: number; cost: number }[]>();
  constructor(readonly obstacles: Polygon[][]) {
    this.vertices = obstacles.flat(2);
  }
  private neighbors(index: number) {
    let edges = this.edges.get(index);
    if (!edges) {
      edges = [];
      for (let i = 0; i < this.vertices.length; i++) {
        if (i !== index && segmentFree(this.vertices[index], this.vertices[i], this.obstacles, true)) edges.push({ to: i, cost: distance(this.vertices[index], this.vertices[i]) });
      }
      this.edges.set(index, edges);
    }
    return edges;
  }
  find(start: Point, target: Point): Point[] | null {
    if (![start.x, start.z, target.x, target.z].every(Number.isFinite)) throw new Error('Non-finite navigation coordinates');
    if (insideObstacle(start, this.obstacles) || insideObstacle(target, this.obstacles)) return null;
    if (segmentFree(start, target, this.obstacles, true)) return [target];
    const nodes = [...this.vertices, start, target];
    const startIndex = nodes.length - 2, targetIndex = nodes.length - 1;
    const endpointEdges = new Map<number, { to: number; cost: number }[]>();
    const endConnections = new Map<number, { to: number; cost: number }[]>();
    for (const endpoint of [startIndex, targetIndex]) for (let i = 0; i < this.vertices.length; i++) {
      if (!segmentFree(nodes[endpoint], nodes[i], this.obstacles, true)) continue;
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
