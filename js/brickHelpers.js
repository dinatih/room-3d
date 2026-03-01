import { BRICK_SIZES, BRICK_H, GAP, PLATE_H, FLOOR_Y, NUM_LAYERS, WALL_PLATE_H } from './config.js';

// =============================================
// FILL ROW WITH REAL BRICKS
// =============================================
export function fillRow(length, stagger) {
  const bricks = [];
  let pos = 0;
  if (stagger && length > 80) {
    bricks.push({ start: 0, size: 80 });
    pos = 80;
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

export function addBrickX(startX, layer, z, size, type, rotY = 0) {
  allBricks.push({
    x: startX + size / 2, y: layer * BRICK_H + BRICK_H / 2, z,
    sx: size - GAP, sy: BRICK_H - GAP, sz: 10 - GAP,
    len: size, axis: 'x', type, rotY
  });
  if (layer === NUM_LAYERS - 1) {
    allBricks.push({
      x: startX + size / 2, y: NUM_LAYERS * BRICK_H + WALL_PLATE_H / 2, z,
      sx: size - GAP, sy: WALL_PLATE_H - GAP, sz: 10 - GAP,
      len: size, axis: 'x', type, rotY
    });
  }
}

export function addBrickZ(x, layer, startZ, size, type, rotY = 0) {
  allBricks.push({
    x, y: layer * BRICK_H + BRICK_H / 2, z: startZ + size / 2,
    sx: 10 - GAP, sy: BRICK_H - GAP, sz: size - GAP,
    len: size, axis: 'z', type, rotY
  });
  if (layer === NUM_LAYERS - 1) {
    allBricks.push({
      x, y: NUM_LAYERS * BRICK_H + WALL_PLATE_H / 2, z: startZ + size / 2,
      sx: 10 - GAP, sy: WALL_PLATE_H - GAP, sz: size - GAP,
      len: size, axis: 'z', type, rotY
    });
  }
}

export function addFloorBrick(x, z, size, type = 'floor') {
  allBricks.push({
    x: x + size / 2, y: FLOOR_Y, z: z + 5,
    sx: size - GAP, sy: PLATE_H - GAP, sz: 10 - GAP,
    len: size, axis: 'x', type
  });
}
