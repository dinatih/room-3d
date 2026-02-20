import { ROOM_W, ROOM_D, PLATE_H, GAP, DOOR_START, DOOR_END, NICHE_DEPTH, NICHE_Z_START, FLOOR_Y, GARDEN_JC_Z, KITCHEN_Z, SDB_Z_END, DIAG_CZ } from './config.js';
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

  // Sol ouverture cuisine (z = ROOM_D, X=3→13)
  const KIT_OPEN_X0 = 3, KIT_OPEN_W = 10;
  for (const b of fillRow(KIT_OPEN_W, ROOM_D % 2 === 1)) {
    addFloorBrick(KIT_OPEN_X0 + b.start, ROOM_D, b.size);
  }

  // =============================================
  // SOL LEGO VERT - Jardin (quadrilatère délimité par pointillés)
  // =============================================
  {
    const zStart = Math.ceil(GARDEN_JC_Z); // -34

    for (let z = zStart; z < -1; z++) {
      let x0 = -1;
      if (z + 0.5 < -14) {
        x0 = Math.ceil(-1 - 11 * (z + 0.5 + 14) / 7);
      }
      const x1 = 31;
      const w = x1 - x0;
      if (w <= 0) continue;

      for (const b of fillRow(w, Math.abs(z) % 2 === 1)) {
        addFloorBrick(x0 + b.start, z, b.size, 'grass');
      }
    }
  }

}

export function buildParquet(allBricks) {
  // Flat tiles : parquet (séjour + couloir) ou carrelage gris (SDB)
  const floorBricks = allBricks.filter(b => b.type === 'floor');
  for (const b of floorBricks) {
    const isSDB = (b.z >= KITCHEN_Z && b.z < SDB_Z_END && b.x < DOOR_START) ||
                  (b.z >= SDB_Z_END && b.z < DIAG_CZ);
    allBricks.push({
      x: b.x, y: b.y + PLATE_H, z: b.z,
      sx: b.sx, sy: b.sy, sz: b.sz,
      len: b.len, axis: b.axis, type: isSDB ? 'tile' : 'parquet'
    });
  }
}
