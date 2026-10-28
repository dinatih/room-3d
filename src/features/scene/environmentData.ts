/** Shared geometry for rendering and ground navigation (centimetres). */
export const NEIGHBOR_OFFSETS = [
  { x: -346, z: 199.76 },
  { x: 346, z: -199.76 },
] as const;
export const EXTERIOR_GROUND = { x: 150, z: 0, width: 1100, depth: 2000 };
export const EXTERIOR_CORRIDOR = { width: 120, length: 1200 };
/** Contour des dalles en coordonnées X/Z. */
export const SLAB_OUTLINE: [number, number][] = [
  [-20, -30], [316, -30], [316, -230], [326, -230],
  [326, -220], [326, 547.77], [-20, 747.53],
];
