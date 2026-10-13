/** Shared geometry for rendering and ground navigation (centimetres). */
export const NEIGHBOR_OFFSETS = [
  { x: -346, z: 199.76 },
  { x: 346, z: -199.76 },
] as const;
export const EXTERIOR_GROUND = { x: 150, z: 0, width: 1100, depth: 2000 };
export const EXTERIOR_CORRIDOR = { width: 120, length: 1200 };
