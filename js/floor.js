import { ROOM_W, ROOM_D, PLATE_H, GAP, DOOR_START, DOOR_END, NICHE_DEPTH, NICHE_Z_START } from './config.js';
import { fillRow } from './brickHelpers.js';

export function buildFloor(allBricks) {
  const FLOOR_X0 = 0;
  const FLOOR_X1 = ROOM_W;
  const FLOOR_Z0 = 0;
  const FLOOR_Z1 = ROOM_D;
  const FLOOR_W = FLOOR_X1 - FLOOR_X0;

  for (let z = FLOOR_Z0; z < FLOOR_Z1; z++) {
    for (const b of fillRow(FLOOR_W, z % 2 === 1)) {
      allBricks.push({
        x: FLOOR_X0 + b.start + b.size / 2, y: -1/3, z: z + 0.5,
        sx: b.size - GAP, sy: PLATE_H - GAP, sz: 1 - GAP,
        len: b.size, axis: 'x', type: 'floor'
      });
    }
  }

  // Sol niche MN (X=-1→0, Z=28→40)
  for (let z = NICHE_Z_START; z < ROOM_D; z++) {
    allBricks.push({
      x: -NICHE_DEPTH + 0.5, y: -1/3, z: z + 0.5,
      sx: NICHE_DEPTH - GAP, sy: PLATE_H - GAP, sz: 1 - GAP,
      len: NICHE_DEPTH, axis: 'x', type: 'floor'
    });
  }

  // Sol sous la porte P1 (z = ROOM_D, entre les montants)
  const DOOR_W = DOOR_END - DOOR_START;
  for (const b of fillRow(DOOR_W, ROOM_D % 2 === 1)) {
    allBricks.push({
      x: DOOR_START + b.start + b.size / 2, y: -1/3, z: ROOM_D + 0.5,
      sx: b.size - GAP, sy: PLATE_H - GAP, sz: 1 - GAP,
      len: b.size, axis: 'x', type: 'floor'
    });
  }
}
