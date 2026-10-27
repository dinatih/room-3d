import polygonClipping from 'polygon-clipping';
import { ShapeUtils, Vector2 } from 'three';
import { distance, insideObstacle, segmentFree, GEOMETRY_EPSILON, type Point, type Polygon } from './geometry';
import type { NavigationComfort } from './comfort';

type Portal = { to: number; a: Point; b: Point; cost: number };
type Cell = { points: Point[]; center: Point; minX: number; maxX: number; minZ: number; maxZ: number; portals: Portal[]; component: number };
export interface NavigationMeshSnapshot { obstacles: Polygon[][]; comfort?: NavigationComfort; vertices: Point[]; cells: Cell[] }
const area = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
const same = (a: Point, b: Point) => a.x === b.x && a.z === b.z;

/** Remove internal diagonals without changing the free-space boundary. */
function mergeConvexCells(polygons: Polygon[]): Polygon[] {
  const owners = polygons.map((_, i) => i), edges = new Map<string, number>(), pairs: [number, number, Point, Point][] = [];
  const owner = (i: number): number => owners[i] === i ? i : (owners[i] = owner(owners[i]));
  polygons.forEach((points, cell) => points.forEach((a, i) => {
    const b = points[(i + 1) % points.length], key = [`${a.x}:${a.z}`, `${b.x}:${b.z}`].sort().join('/');
    const previous = edges.get(key);
    if (previous === undefined) edges.set(key, cell);
    else pairs.push([previous, cell, a, b]);
  }));
  // Prefer removing long diagonals; revisit neighbours after each merging pass.
  pairs.sort((a, b) => distance(b[2], b[3]) - distance(a[2], a[3]));
  let changed: boolean;
  do {
    changed = false;
    for (const [first, second, a, b] of pairs) {
      const from = owner(first), to = owner(second);
      if (from === to) continue;
      const left = polygons[from], right = polygons[to];
      const i = left.indexOf(b), j = right.indexOf(a);
      if (i === -1 || j === -1 || left[(i + 1) % left.length] !== a || right[(j + 1) % right.length] !== b) continue;
      const merged = [...left.slice(i + 1), ...left.slice(0, i + 1), ...Array.from({ length: right.length - 2 }, (_, k) => right[(j + 2 + k) % right.length])];
      if (new Set(merged).size !== merged.length) continue;
      const turns = merged.map((p, k) => area(p, merged[(k + 1) % merged.length], merged[(k + 2) % merged.length]));
      if (!turns.every(turn => turn >= 0) && !turns.every(turn => turn <= 0)) continue;
      polygons[from] = merged; owners[to] = from; changed = true;
    }
  } while (changed);
  return polygons.filter((_, i) => owners[i] === i);
}

/** A persistent network of convex floor cells. Searches visit only adjacent cells. */
export class NavigationMesh {
  readonly vertices: Point[];
  private cells: Cell[] = [];

  static restore(snapshot: NavigationMeshSnapshot): NavigationMesh {
    return Object.assign(Object.create(NavigationMesh.prototype), snapshot);
  }

  snapshot(): NavigationMeshSnapshot {
    return { obstacles: this.obstacles, comfort: this.comfort, vertices: this.vertices, cells: this.cells };
  }

  constructor(readonly obstacles: Polygon[][], surfaces: Polygon[][], readonly comfort?: NavigationComfort) {
    if (comfort && (!Number.isFinite(comfort.distance) || comfort.distance <= 0)) throw new Error('Invalid navigation comfort distance');
    const coordinates = (polygons: Polygon[][]) => polygons.map(rings => rings.map(ring => ring.map(p => [p.x, p.z] as [number, number])));
    const ground = coordinates(surfaces), solids = coordinates(obstacles);
    const free = solids.length ? polygonClipping.difference(ground, solids) : polygonClipping.union(ground);
    const edges = new Map<string, { cell: number; a: Point; b: Point }>();
    this.vertices = obstacles.flat(2);
    for (const polygon of free) {
      const rings = polygon.map(ring => ring.slice(0, -1).map(([x, z]) => ({ x, z })));
      const points = rings.flat();
      const triangles = ShapeUtils.triangulateShape(rings[0].map(p => new Vector2(p.x, p.z)), rings.slice(1).map(ring => ring.map(p => new Vector2(p.x, p.z))));
      const cells = triangles.map(triangle => triangle.map(index => points[index]))
        .filter(corners => Math.abs(area(...corners as [Point, Point, Point])) > GEOMETRY_EPSILON);
      for (const corners of mergeConvexCells(cells)) {
        const cell = this.cells.length;
        const center = { x: corners.reduce((sum, p) => sum + p.x, 0) / corners.length, z: corners.reduce((sum, p) => sum + p.z, 0) / corners.length };
        this.cells.push({ points: corners, center, minX: Math.min(...corners.map(p => p.x)), maxX: Math.max(...corners.map(p => p.x)),
          minZ: Math.min(...corners.map(p => p.z)), maxZ: Math.max(...corners.map(p => p.z)), portals: [], component: -1 });
        for (let i = 0; i < corners.length; i++) {
          const a = corners[i], b = corners[(i + 1) % corners.length];
          const keys = [`${a.x}:${a.z}`, `${b.x}:${b.z}`].sort(), key = keys.join('/');
          const previous = edges.get(key);
          if (!previous) { edges.set(key, { cell, a, b }); continue; }
          const other = this.cells[previous.cell].center, midpoint = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
          const cost = distance(center, midpoint) + distance(midpoint, other);
          this.cells[cell].portals.push({ to: previous.cell, a, b, cost });
          this.cells[previous.cell].portals.push({ to: cell, a, b, cost });
          edges.delete(key);
        }
      }
    }
    for (let first = 0; first < this.cells.length; first++) {
      if (this.cells[first].component !== -1) continue;
      this.cells[first].component = first;
      const pending = [first];
      while (pending.length) for (const portal of this.cells[pending.pop()!].portals) {
        if (this.cells[portal.to].component !== -1) continue;
        this.cells[portal.to].component = first;
        pending.push(portal.to);
      }
    }
  }

  private locate(point: Point): number {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.z)) throw new Error('Non-finite navigation coordinates');
    if (insideObstacle(point, this.obstacles)) return -1;
    return this.cells.findIndex(cell => {
      if (point.x < cell.minX - GEOMETRY_EPSILON || point.x > cell.maxX + GEOMETRY_EPSILON || point.z < cell.minZ - GEOMETRY_EPSILON || point.z > cell.maxZ + GEOMETRY_EPSILON) return false;
      const sides = cell.points.map((p, i) => area(p, cell.points[(i + 1) % cell.points.length], point));
      return sides.every(side => side >= -GEOMETRY_EPSILON) || sides.every(side => side <= GEOMETRY_EPSILON);
    });
  }

  canReach(start: Point, target: Point): boolean {
    const from = this.locate(start), to = this.locate(target);
    return from !== -1 && to !== -1 && this.cells[from].component === this.cells[to].component;
  }

  find(start: Point, target: Point): Point[] | null {
    const from = this.locate(start), to = this.locate(target);
    if (from === -1 || to === -1 || this.cells[from].component !== this.cells[to].component) return null;
    if (from === to) return [target];
    const costs = new Float64Array(this.cells.length).fill(Infinity), parents = new Int32Array(this.cells.length).fill(-1);
    const open: { cell: number; cost: number; priority: number }[] = [];
    const push = (entry: typeof open[number]) => {
      let i = open.length;
      open.push(entry);
      while (i > 0) {
        const parent = (i - 1) >> 1;
        if (open[parent].priority <= entry.priority) break;
        open[i] = open[parent]; i = parent;
      }
      open[i] = entry;
    };
    const pop = () => {
      const first = open[0], last = open.pop()!;
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
      return first;
    };
    costs[from] = 0;
    push({ cell: from, cost: 0, priority: distance(start, target) });
    while (open.length) {
      const current = pop();
      if (current.cost !== costs[current.cell]) continue;
      if (current.cell === to) break;
      for (const portal of this.cells[current.cell].portals) {
        const candidate = current.cost + portal.cost;
        if (candidate >= costs[portal.to]) continue;
        costs[portal.to] = candidate; parents[portal.to] = current.cell;
        push({ cell: portal.to, cost: candidate, priority: candidate + distance(this.cells[portal.to].center, this.cells[to].center) });
      }
    }
    if (!Number.isFinite(costs[to])) throw new Error('Connected navigation cells have no route');
    const corridor = [to];
    while (corridor[0] !== from) corridor.unshift(parents[corridor[0]]);
    const portals = [{ left: start, right: start }];
    for (let i = 1; i < corridor.length; i++) {
      const cell = this.cells[corridor[i - 1]], next = this.cells[corridor[i]];
      const portal = cell.portals.find(p => p.to === corridor[i])!;
      let left = portal.a, right = portal.b;
      if (area(cell.center, next.center, left) < area(cell.center, next.center, right)) [left, right] = [right, left];
      const length = distance(left, right), inset = Math.min(this.comfort?.distance ?? 0, length / 2);
      const offset = inset / length;
      portals.push({ left: { x: left.x + (right.x - left.x) * offset, z: left.z + (right.z - left.z) * offset },
        right: { x: right.x + (left.x - right.x) * offset, z: right.z + (left.z - right.z) * offset } });
    }
    portals.push({ left: target, right: target });
    const path: Point[] = [];
    let apex = start, left = start, right = start, apexIndex = 0, leftIndex = 0, rightIndex = 0;
    for (let i = 1; i < portals.length; i++) {
      const next = portals[i];
      if (area(apex, right, next.right) >= 0) {
        if (same(apex, right) || area(apex, left, next.right) < 0) { right = next.right; rightIndex = i; }
        else { path.push(left); apex = left; apexIndex = leftIndex; left = right = apex; leftIndex = rightIndex = apexIndex; i = apexIndex; continue; }
      }
      if (area(apex, left, next.left) <= 0) {
        if (same(apex, left) || area(apex, right, next.left) > 0) { left = next.left; leftIndex = i; }
        else { path.push(right); apex = right; apexIndex = rightIndex; left = right = apex; leftIndex = rightIndex = apexIndex; i = apexIndex; }
      }
    }
    if (!path.length || !same(path[path.length - 1], target)) path.push(target);
    if (!path.every((point, i) => segmentFree(i ? path[i - 1] : start, point, this.obstacles))) {
      throw Object.assign(new Error('Navigation funnel produced a segment outside free space'), { cause: { start, target, path, snapshot: this.snapshot() } });
    }
    return path;
  }
}
