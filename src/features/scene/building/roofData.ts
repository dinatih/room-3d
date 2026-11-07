import { WALL_H } from '../wallData';

/** Shared with the actual slab geometry; X/Z coordinates in centimetres. */
export const SLAB_FOOTPRINT: [number, number][] = [
  [-20, -30], [316, -30], [316, -230], [326, -230],
  [326, -220], [326, 547.77], [-20, 747.53],
];
export const CEILING_Y = WALL_H - 1;
export const CEILING_CANOPY = { x: 300 - 235 / 2 + 16, z: -30 - 75, width: 235, depth: 150, height: 20 };

export function roofHeightAt(x: number, z: number) {
  const canopy = CEILING_CANOPY;
  if (Math.abs(x - canopy.x) <= canopy.width / 2 && Math.abs(z - canopy.z) <= canopy.depth / 2) return CEILING_Y + canopy.height;
  let inside = false;
  for (let i = 0, j = SLAB_FOOTPRINT.length - 1; i < SLAB_FOOTPRINT.length; j = i++) {
    const [xi, zi] = SLAB_FOOTPRINT[i], [xj, zj] = SLAB_FOOTPRINT[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
  }
  return inside ? CEILING_Y : 0;
}
