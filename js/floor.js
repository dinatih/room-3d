import * as THREE from 'three';
import { ROOM_W, ROOM_D, PLATE_H, GAP, DOOR_START, DOOR_END, NICHE_DEPTH, NICHE_Z_START, FLOOR_Y, GARDEN_JC_Z, KITCHEN_Z, SDB_Z_END, DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ, COLORS } from './config.js';
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

    for (let z = zStart; z < -3; z++) {
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

// =============================================
// DALLE BÉTON COULÉ (remplace les plates LEGO jaunes)
// Couvre toute la surface bâtiment, épaisseur murs ext. comprise
// =============================================
export function buildConcreteSlab(scene) {
  // Perpendiculaire extérieure du mur diagonal (1 stud d'épaisseur)
  const diagDX = DIAG_CX - DIAG_AX;
  const diagDZ = DIAG_CZ - DIAG_AZ;
  const diagLen = Math.sqrt(diagDX * diagDX + diagDZ * diagDZ);
  const perpX = diagDZ / diagLen;   // composante X vers l'extérieur
  const perpZ = -diagDX / diagLen;  // composante Z vers l'extérieur

  // Limites extérieures des murs
  const EXT_E = ROOM_W + 1;                 // mur B extérieur (X=31)
  const EXT_S = -3;                          // mur C extérieur (Z=-3, 30cm)
  const EXT_W_MAIN = -1;                     // mur A extérieur avant niche
  const EXT_W_NICHE = -(NICHE_DEPTH + 1);   // niche/SDB extérieur (X=-2)

  // Points extérieurs du mur diagonal
  const dAX = DIAG_AX + perpX, dAZ = DIAG_AZ + perpZ;
  const dCX = DIAG_CX + perpX, dCZ = DIAG_CZ + perpZ;

  // Contour extérieur bâtiment (sens trigo dans le plan XZ)
  const shape = new THREE.Shape();
  shape.moveTo(EXT_W_MAIN, EXT_S);            // 1. coin SO
  shape.lineTo(EXT_E, EXT_S);                 // 2. coin SE
  shape.lineTo(EXT_E, dAZ);                   // 3. mur E → coin diag
  shape.lineTo(dAX, dAZ);                     // 4. départ diag extérieur
  shape.lineTo(dCX, dCZ);                     // 5. fin diag extérieur
  shape.lineTo(EXT_W_NICHE, dCZ);             // 6. retour vers mur O niche
  shape.lineTo(EXT_W_NICHE, NICHE_Z_START);   // 7. descente le long du mur niche/SDB
  shape.lineTo(EXT_W_MAIN, NICHE_Z_START);    // 8. retour mur A principal
  // fermeture auto vers (1)

  const SLAB_DEPTH = 1; // 10cm
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: SLAB_DEPTH,
    bevelEnabled: false,
  });

  const mat = new THREE.MeshStandardMaterial({
    color: COLORS.floor,
    roughness: 0.6,
  });

  const slab = new THREE.Mesh(geo, mat);
  slab.rotation.x = Math.PI / 2;
  // Surface haute de la dalle = sommet des anciennes plates
  slab.position.y = FLOOR_Y + (PLATE_H - GAP) / 2;
  slab.receiveShadow = true;
  scene.add(slab);
}
