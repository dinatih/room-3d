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

// ── Texture herbe procédurale ────────────────────────────────────────────────
function makeGrassTex() {
  const SIZE = 256;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  // Sol : vert foncé terreux
  ctx.fillStyle = '#1e4a22';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Variation de sol : taches terre sombre
  const rng = () => Math.random();
  for (let i = 0; i < 80; i++) {
    const x = rng() * SIZE, y = rng() * SIZE;
    const r = 5 + rng() * 15;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(10,30,10,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Brins d'herbe : traits épais et contrastés
  const BLADES = 9000;
  for (let i = 0; i < BLADES; i++) {
    const x = rng() * SIZE;
    const y = rng() * SIZE;
    const len = 5 + rng() * 14;
    const angle = -Math.PI / 2 + (rng() - 0.5) * 1.0;
    // gamme : vert très foncé (#1a4a1a) à vert moyen (#4a9a40)
    const g = Math.floor(60 + rng() * 100);   // 60–160
    const r = Math.floor(10 + rng() * 30);
    ctx.strokeStyle = `rgb(${r},${g},${r})`;
    ctx.lineWidth = 0.8 + rng() * 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  // Dalle ~500×370cm → tuile ~20×20cm → 25×18 répétitions
  tex.repeat.set(25, 18);
  return tex;
}

// Dalle jardin verte — de Z = BLDG_Z_MIN jusqu'à Z=-400, même emprise X et épaisseur
export function buildGardenSlab(scene) {
  const SLAB_DEPTH = 10;
  const Z_START = BLDG_Z_MIN;
  const Z_END = -400;
  const D = Math.abs(Z_END - Z_START);
  const CZ = (Z_START + Z_END) / 2;

  const grassTex = makeGrassTex();
  const grassMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.85, color: 0xffffff });
  const sideMat  = new THREE.MeshStandardMaterial({ color: 0x1e4022, roughness: 0.9 });
  // BoxGeometry face order: [+X, -X, +Y(top), -Y(bot), +Z, -Z]
  const mats = [sideMat, sideMat, grassMat, sideMat, sideMat, sideMat];

  const slab = new THREE.Mesh(new THREE.BoxGeometry(BLDG_W, SLAB_DEPTH, D), mats);
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

  // Plafond-terrasse 235cm (X, côté Est) × 150cm (Z, extension Nord)
  // Collé au bord Nord du plafond principal (Z = BLDG_Z_MIN)
  const TER_X = 235;
  const TER_Z = 150;
  const terCX = 300 - TER_X / 2;                // de X=65 à X=300 (vers l'Ouest, côté jardin)
  const terCZ = BLDG_Z_MIN - TER_Z / 2;         // extension vers le Nord
  const terrace = new THREE.Mesh(new THREE.BoxGeometry(TER_X, CEIL_THICK, TER_Z), _ceilMats);
  terrace.position.set(terCX, WALL_H - 1 + CEIL_THICK / 2, terCZ);
  scene.add(terrace);
}
