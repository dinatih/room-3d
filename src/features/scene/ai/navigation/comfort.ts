import { CLEARANCE_ERROR, distance, type Point, type Polygon } from './geometry';

/** Preferred extra space beyond the body's collision clearance, in scene centimetres. */
export const NAVIGATION_COMFORT_CM = 20;
export const NAVIGATION_COMFORT_COLOR = '#2979ff';

export interface NavigationComfort {
  distance: number;
  obstacles: Polygon[][];
}

/** Integrates the soft proximity penalty; it never changes collision geometry. */
export class ComfortField {
  private segments: { a: Point; b: Point; dx: number; dz: number; lengthSquared: number; minX: number; maxX: number; minZ: number; maxZ: number }[];

  constructor(obstacles: Polygon[][], readonly margin: number) {
    if (!Number.isFinite(margin) || margin <= 0) throw new Error('Invalid navigation comfort distance');
    this.segments = obstacles.flat().flatMap(ring => ring.map((a, i) => {
      const b = ring[(i + 1) % ring.length];
      return { a, b, dx: b.x - a.x, dz: b.z - a.z, lengthSquared: (b.x - a.x) ** 2 + (b.z - a.z) ** 2,
        minX: Math.min(a.x, b.x), maxX: Math.max(a.x, b.x), minZ: Math.min(a.z, b.z), maxZ: Math.max(a.z, b.z) };
    }));
  }

  clearance(p: Point): number {
    let squared = this.margin * this.margin;
    for (const s of this.segments) {
      const t = s.lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - s.a.x) * s.dx + (p.z - s.a.z) * s.dz) / s.lengthSquared));
      squared = Math.min(squared, (p.x - s.a.x - t * s.dx) ** 2 + (p.z - s.a.z - t * s.dz) ** 2);
    }
    return Math.sqrt(squared);
  }

  /** Distance to an obstacle can grow at most one cm per cm travelled.
   * Integrate the two unavoidable endpoint penalty cones as a cheap lower bound. */
  minimumCost(length: number, startClearance: number, endClearance: number): number {
    const a = this.margin - startClearance, b = this.margin - endClearance;
    const split = Math.max(0, Math.min(length, (a - b + length) / 2));
    return length + (a * a - Math.max(0, a - split) ** 2 + b * b - Math.max(0, b - (length - split)) ** 2) / (2 * this.margin);
  }

  cost(a: Point, b: Point): number {
    const length = distance(a, b);
    if (length === 0) return 0;
    const near = this.segments.filter(s => s.minX <= Math.max(a.x, b.x) + this.margin && s.maxX >= Math.min(a.x, b.x) - this.margin
      && s.minZ <= Math.max(a.z, b.z) + this.margin && s.maxZ >= Math.min(a.z, b.z) - this.margin);
    if (!near.length) return length;
    const penalty = (t: number) => {
      const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
      let squared = this.margin * this.margin;
      for (const s of near) {
        const projection = s.lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((x - s.a.x) * s.dx + (z - s.a.z) * s.dz) / s.lengthSquared));
        squared = Math.min(squared, (x - s.a.x - projection * s.dx) ** 2 + (z - s.a.z - projection * s.dz) ** 2);
      }
      return 1 - Math.sqrt(squared) / this.margin;
    };
    // Split at boundary endpoints' projections: a short proximity peak must not
    // disappear between the samples of a long segment with free endpoints.
    const cuts = new Set([0, 1]);
    for (const s of near) for (const p of [s.a, s.b]) {
      const t = ((p.x - a.x) * (b.x - a.x) + (p.z - a.z) * (b.z - a.z)) / (length * length);
      if (t > 0 && t < 1) cuts.add(t);
    }
    const integrate = (lo: number, hi: number, left: number, middle: number, right: number, whole: number, tolerance: number): number => {
      const mid = (lo + hi) / 2;
      const lm = penalty((lo + mid) / 2), rm = penalty((mid + hi) / 2);
      const first = (mid - lo) * (left + 4 * lm + middle) / 6;
      const second = (hi - mid) * (middle + 4 * rm + right) / 6;
      // Adaptive Simpson quadrature; 15 is the Richardson error factor.
      if (Math.abs(first + second - whole) <= 15 * tolerance) return first + second;
      return integrate(lo, mid, left, lm, middle, first, tolerance / 2) + integrate(mid, hi, middle, rm, right, second, tolerance / 2);
    };
    const sorted = [...cuts].sort((x, y) => x - y);
    let integral = 0;
    for (let i = 1; i < sorted.length; i++) {
      const lo = sorted[i - 1], hi = sorted[i];
      const left = penalty(lo), middle = penalty((lo + hi) / 2), right = penalty(hi);
      integral += integrate(lo, hi, left, middle, right, (hi - lo) * (left + 4 * middle + right) / 6, CLEARANCE_ERROR * (hi - lo) / length);
    }
    return length * (1 + integral);
  }
}
