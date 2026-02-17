import { BRICK_SIZES, BRICK_H, GAP } from './config.js';

// =============================================
// FILL ROW WITH REAL BRICKS
// =============================================
export function fillRow(length, stagger) {
  const bricks = [];
  let pos = 0;
  if (stagger && length > 8) {
    bricks.push({ start: 0, size: 8 });
    pos = 8;
  }
  while (pos < length) {
    const remaining = length - pos;
    for (const size of BRICK_SIZES) {
      if (size <= remaining) {
        bricks.push({ start: pos, size });
        pos += size;
        break;
      }
    }
  }
  return bricks;
}

// =============================================
// BUILD BRICKS
// =============================================
export const allBricks = []; // {x,y,z, sx,sy,sz, type}

export function addBrickX(startX, layer, z, size, type) {
  allBricks.push({
    x: startX + size / 2, y: layer * BRICK_H + BRICK_H / 2, z,
    sx: size - GAP, sy: BRICK_H - GAP, sz: 1 - GAP,
    len: size, axis: 'x', type
  });
}

export function addBrickZ(x, layer, startZ, size, type) {
  allBricks.push({
    x, y: layer * BRICK_H + BRICK_H / 2, z: startZ + size / 2,
    sx: 1 - GAP, sy: BRICK_H - GAP, sz: size - GAP,
    len: size, axis: 'z', type
  });
}
