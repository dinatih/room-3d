import { ROOM_W, ROOM_D, PLATE_H, GAP, DOOR_START, DOOR_END, NICHE_DEPTH, NICHE_Z_START, FLOOR_Y, GARDEN_JC_Z } from './config.js';
import { fillRow, addFloorBrick } from './brickHelpers.js';

export function buildFloor(allBricks) {
  const FLOOR_X0 = 0;
  const FLOOR_X1 = ROOM_W;
  const FLOOR_Z0 = 0;
  const FLOOR_Z1 = ROOM_D;
  const FLOOR_W = FLOOR_X1 - FLOOR_X0;

  for (let z = FLOOR_Z0; z < FLOOR_Z1; z++) {
    for (const b of fillRow(FLOOR_W, z % 2 === 1)) {
      addFloorBrick(FLOOR_X0 + b.start, z, b.size);
    }
  }

  // Sol niche MN (X=-1→0, Z=28→40)
  for (let z = NICHE_Z_START; z < ROOM_D; z++) {
    addFloorBrick(-NICHE_DEPTH, z, NICHE_DEPTH);
  }

  // Sol sous la porte P1 (z = ROOM_D, entre les montants)
  const DOOR_W = DOOR_END - DOOR_START;
  for (const b of fillRow(DOOR_W, ROOM_D % 2 === 1)) {
    addFloorBrick(DOOR_START + b.start, ROOM_D, b.size);
  }

  // =============================================
  // SOL LEGO VERT - Jardin (quadrilatère délimité par pointillés)
  // =============================================
  {
    const zStart = Math.ceil(GARDEN_JC_Z); // -34

    for (let z = zStart; z < -1; z++) {
      let x0 = -1;
      if (z + 0.5 < -14) {
        x0 = Math.ceil(-1 - 31 * (z + 0.5 + 14) / 19);
      }
      const x1 = 31;
      const w = x1 - x0;
      if (w <= 0) continue;

      for (const b of fillRow(w, Math.abs(z) % 2 === 1)) {
        addFloorBrick(x0 + b.start, z, b.size, 'grass');
      }
    }
  }

  // Flat tiles parquet sur toutes les plates jaunes
  const floorBricks = allBricks.filter(b => b.type === 'floor');
  for (const b of floorBricks) {
    allBricks.push({
      x: b.x, y: b.y + PLATE_H, z: b.z,
      sx: b.sx, sy: b.sy, sz: b.sz,
      len: b.len, axis: b.axis, type: 'parquet'
    });
  }
}
