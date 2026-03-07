import * as THREE from 'three';
import {
  ROOM_W, ROOM_D, PLATE_H, GAP, WALL_H,
  DOOR_START, DOOR_END, NICHE_DEPTH, NICHE_Z_START, FLOOR_Y, GARDEN_JC_Z,
  KITCHEN_Z, SDB_Z_END, DIAG_CZ,
  BLDG_X_MIN, BLDG_X_MAX, BLDG_Z_MIN, BLDG_Z_MAX,
  COLORS,
} from './config.js';
import { fillRow, addFloorBrick } from './brickHelpers.js';

// =============================================
// SOL LEGO (briques de sol)
// =============================================
export function buildFloor(allBricks) {
  const FLOOR_X0 = 0;
  const FLOOR_X1 = ROOM_W;
  const FLOOR_Z0 = 0;
  const FLOOR_Z1 = ROOM_D;
  const FLOOR_W = FLOOR_X1 - FLOOR_X0;

  for (let z = FLOOR_Z0; z < FLOOR_Z1; z += 10) {
    for (const b of fillRow(FLOOR_W, (z / 10) % 2 === 1)) {
      addFloorBrick(FLOOR_X0 + b.start, z, b.size);
    }
  }

  // Sol niche MN (X=-10→0, Z=280→400)
  for (let z = NICHE_Z_START; z < ROOM_D; z += 10) {
    addFloorBrick(-NICHE_DEPTH, z, NICHE_DEPTH);
  }

  // Sol sous la porte P1 (z = ROOM_D, entre les montants)
  const DOOR_W = DOOR_END - DOOR_START;
  for (const b of fillRow(DOOR_W, (ROOM_D / 10) % 2 === 1)) {
    addFloorBrick(DOOR_START + b.start, ROOM_D, b.size);
  }

  // Sol ouverture cuisine (z = ROOM_D, X=30→130)
  const KIT_OPEN_X0 = 30, KIT_OPEN_W = 100;
  for (const b of fillRow(KIT_OPEN_W, (ROOM_D / 10) % 2 === 1)) {
    addFloorBrick(KIT_OPEN_X0 + b.start, ROOM_D, b.size);
  }

}

// =============================================
// PARQUET / CARRELAGE
// =============================================
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
// DALLE BÉTON + PLAFOND
// Les deux partagent l'emprise BLDG_* définie dans config.js :
//   NW(-100, 0)  NE(400, 0)
//   SW(-100,800) SE(400,800)
// =============================================
const BLDG_W  = BLDG_X_MAX - BLDG_X_MIN;  // 500 cm
const BLDG_D  = BLDG_Z_MAX - BLDG_Z_MIN;  // 800 cm
const BLDG_CX = (BLDG_X_MIN + BLDG_X_MAX) / 2;  // 150 cm
const BLDG_CZ = (BLDG_Z_MIN + BLDG_Z_MAX) / 2;  // 400 cm

export function buildConcreteSlab(scene) {
  const SLAB_DEPTH = 10; // 10cm d'épaisseur

  const mat = new THREE.MeshStandardMaterial({ color: COLORS.floor, roughness: 0.6 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(BLDG_W, SLAB_DEPTH, BLDG_D), mat);

  // Surface haute de la dalle = sommet des anciennes plates
  slab.position.set(BLDG_CX, FLOOR_Y + (PLATE_H - GAP) / 2 - SLAB_DEPTH / 2, BLDG_CZ);
  slab.receiveShadow = true;
  scene.add(slab);
}

// Dalle jardin verte — de Z = BLDG_Z_MIN-30 jusqu'à Z=-400, même emprise X et épaisseur
export function buildGardenSlab(scene) {
  const SLAB_DEPTH = 10;
  const Z_START = BLDG_Z_MIN; // -30cm (même début que la dalle béton)
  const Z_END = -400;
  const D = Math.abs(Z_END - Z_START); // 340cm
  const CZ = (Z_START + Z_END) / 2;   // -230cm

  const mat = new THREE.MeshStandardMaterial({ color: 0x4a9e54, roughness: 0.7 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(BLDG_W, SLAB_DEPTH, D), mat);
  slab.position.set(BLDG_CX, FLOOR_Y + (PLATE_H - GAP) / 2 - SLAB_DEPTH / 2, CZ);
  slab.receiveShadow = true;
  scene.add(slab);
}

// =============================================
// PLAFOND
// Boîte 20cm d'épaisseur, même emprise que la dalle.
// Face inférieure (-Y) : opaque, même aspect que les murs → cache les studs.
// Face supérieure (+Y) : transparent → effet ghost depuis au-dessus.
// =============================================
const CEIL_THICK = 20;

// BoxGeometry material order: [+X, -X, +Y (top), -Y (bottom), +Z, -Z]
const _ceilBottom = new THREE.MeshStandardMaterial({
  color: COLORS.wall, roughness: 0.35, envMapIntensity: 0.15,
});
const _ceilTop = new THREE.MeshStandardMaterial({
  color: COLORS.wall, roughness: 0.35,
  transparent: true, opacity: 0.18, depthWrite: false,
});
const _ceilSide = new THREE.MeshStandardMaterial({ color: COLORS.wall, roughness: 0.35 });
const _ceilMats = [_ceilSide, _ceilSide, _ceilTop, _ceilBottom, _ceilSide, _ceilSide];

export function buildCeiling(scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(BLDG_W, CEIL_THICK, BLDG_D), _ceilMats);
  // Base à WALL_H - 1 : légèrement sous la base des studs (évite le z-fighting)
  mesh.position.set(BLDG_CX, WALL_H - 1 + CEIL_THICK / 2, BLDG_CZ);
  scene.add(mesh);
}
