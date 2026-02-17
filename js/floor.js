import { ROOM_W, ROOM_D, PLATE_H, GAP } from './config.js';
import { fillRow } from './brickHelpers.js';

export function buildFloor(allBricks) {
  const FLOOR_X0 = -1;
  const FLOOR_X1 = ROOM_W + 1;
  const FLOOR_Z0 = -1;
  const FLOOR_Z1 = ROOM_D + 1;
  const FLOOR_W = FLOOR_X1 - FLOOR_X0;

  for (let z = FLOOR_Z0; z < FLOOR_Z1; z++) {
    for (const b of fillRow(FLOOR_W, z % 2 === 1)) {
      allBricks.push({
        x: FLOOR_X0 + b.start + b.size / 2, y: PLATE_H / 2, z: z + 0.5,
        sx: b.size - GAP, sy: PLATE_H - GAP, sz: 1 - GAP,
        len: b.size, axis: 'x', type: 'floor'
      });
    }
  }
}
