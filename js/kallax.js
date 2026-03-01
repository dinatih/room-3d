import * as THREE from 'three';
import {
  ROOM_W, ROOM_D, NICHE_DEPTH, KALLAX_DEPTH,
} from './config.js';
import { Drona } from './drona.js';

// =============================================
// KALLAX — Ported from Gemini kallax.html
// Geometry in cm
// =============================================

// Gemini constants (cm)
const THICK_FRAME = 3.5;
const THICK_INNER = 1.5;
const D_H_EXT = 39;
const NICHE_H = 34;
const NICHE_W = 33.5;

export class Kallax {
  constructor(cols, rows, spec = false) {
    this.cols = cols;
    this.rows = rows;
    this.spec = spec;
    this.totalW = cols * NICHE_W + 2 * THICK_FRAME + (cols - 1) * THICK_INNER;
    this.totalH = rows * NICHE_H + 2 * THICK_FRAME + (rows - 1) * THICK_INNER;
    this.group = new THREE.Group();
    this.woodMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    this.build();
  }

  putDrona(col, row) {
    const d = new Drona();
    const x = -(this.totalW / 2) + THICK_FRAME + NICHE_W / 2 + col * (NICHE_W + THICK_INNER);
    const y = this.totalH / 2 - THICK_FRAME - NICHE_H / 2 - row * (NICHE_H + THICK_INNER);
    d.group.position.set(x, y, 0);
    if (Math.abs(this.group.rotation.z) > 0.1) d.group.rotation.z = -this.group.rotation.z;
    this.group.add(d.group);
  }

  fillAll() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) this.putDrona(c, r);
    }
  }

  fillRows(startRow, endRow) {
    for (let r = startRow; r <= endRow; r++) {
      for (let c = 0; c < this.cols; c++) this.putDrona(c, r);
    }
  }

  getScrewPositions() {
    const pos = [];
    const sX = this.totalW / 2 - THICK_FRAME / 2 - 0.1;
    const sY = this.totalH / 2;
    const sZ = D_H_EXT / 2 - 2;
    [sX, -sX].forEach(x => {
      [sY, -sY].forEach(y => {
        [sZ, -sZ].forEach(z => {
          const p = new THREE.Vector3(x, y > 0 ? y + 0.026 : y - 0.026, z);
          p.applyMatrix4(this.group.matrixWorld);
          pos.push(p);
        });
      });
    });
    return pos;
  }

  build() {
    const addP = (w, h, d, x, y, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.woodMat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      this.group.add(m);
    };
    // Top & bottom shelves
    addP(this.totalW, THICK_FRAME, D_H_EXT, 0, this.totalH / 2 - THICK_FRAME / 2, 0);
    addP(this.totalW, THICK_FRAME, D_H_EXT, 0, -(this.totalH / 2) + THICK_FRAME / 2, 0);
    // Left & right sides
    const sH = this.totalH - 2 * THICK_FRAME;
    const sX = this.totalW / 2 - THICK_FRAME / 2 - 0.1;
    addP(THICK_FRAME, sH, 38.8, -sX, 0, 0);
    addP(THICK_FRAME, sH, 38.8, sX, 0, 0);
    // Horizontal dividers
    for (let i = 1; i < this.rows; i++) {
      const y = this.totalH / 2 - THICK_FRAME - i * NICHE_H - (i - 0.5) * THICK_INNER;
      addP(this.totalW - 2 * THICK_FRAME - 0.2, THICK_INNER, 38.6, 0, y, 0);
    }
    // Vertical dividers
    for (let c = 1; c < this.cols; c++) {
      const x = -(this.totalW / 2) + THICK_FRAME + c * NICHE_W + (c - 0.5) * THICK_INNER;
      for (let r = 0; r < this.rows; r++) {
        if (this.spec && r === 0) continue;
        const yOff = this.totalH / 2 - THICK_FRAME - NICHE_H / 2 - r * (NICHE_H + THICK_INNER);
        addP(THICK_INNER, NICHE_H, 38.4, x, yOff, 0);
      }
    }
  }
}

// Helper: total width/height of a Kallax in cm
export function kallaxW(cols) {
  return cols * NICHE_W + 2 * THICK_FRAME + (cols - 1) * THICK_INNER;
}
export function kallaxH(rows) {
  return rows * NICHE_H + 2 * THICK_FRAME + (rows - 1) * THICK_INNER;
}

// Add a Kallax to the scene, positioned so that its center-bottom
// is at (cx, baseY, cz), facing along Z (depth along Z axis).
function addKallaxToScene(scene, kallax, cx, cz, baseY, rotY = 0) {
  // Position: center of group is at mid-height. baseY is bottom.
  const hScene = kallax.totalH;
  kallax.group.position.set(cx, baseY + hScene / 2, cz);
  if (rotY) kallax.group.rotation.y = rotY;
  scene.add(kallax.group);
  return kallax;
}

export function buildKallax(scene) {
  const kList = [];

  // Dimensions in cm for positioning
  const w1 = kallaxW(1); // 1-col width
  const w2 = kallaxW(2); // 2-col width
  const h3 = kallaxH(3);
  const h4 = kallaxH(4);
  const h5 = kallaxH(5);
  const depth = KALLAX_DEPTH; // 39

  // 1) KALLAX 2×3 — Angle mur C (Z=0) + mur B (X=300)
  //    Back against mur B (+X), centered along Z starting from Z=0
  {
    const k = new Kallax(2, 3);
    k.fillAll();
    // depth along X, width along Z
    addKallaxToScene(scene, k, ROOM_W - depth / 2, w2 / 2, 0, Math.PI / 2);
    kList.push(k);
  }

  // 2) KALLAX 1×4 — Mur B, 60cm from mur D
  //    Back against mur B (+X)
  {
    const k = new Kallax(1, 4);
    k.fillAll();
    addKallaxToScene(scene, k, ROOM_W - depth / 2, ROOM_D - 60 - w1 / 2, 0, Math.PI / 2);
    kList.push(k);
  }

  // 3) KALLAX 1×4 — Angle mur A (X=0) + mur C (Z=0)
  //    Back against mur A (-X)
  {
    const k = new Kallax(1, 4);
    k.fillAll();
    addKallaxToScene(scene, k, depth / 2, w1 / 2, 0, -Math.PI / 2);
    kList.push(k);
  }

  // 4) KALLAX "2×5" — Angle mur A (X=0) + mur D (Z=400), in the niche
  //    Actually 3 stacked units (like kallax.html south-west):
  //    2×2 (base, Drona remplies) + 2×2 (spec, planche haute retirée) + 2×1 (top)
  //    Back against niche wall (-X)
  {
    const gStack = new THREE.Group();
    let ySW = 0;
    const configs = [
      { c: 2, r: 2, s: false },
      { c: 2, r: 2, s: true },
      { c: 2, r: 1, s: false },
    ];
    configs.forEach((conf, idx) => {
      const k = new Kallax(conf.c, conf.r, conf.s);
      k.group.position.y = ySW + k.totalH / 2;
      // Seulement les 2 rangées du bas (base 2×2)
      if (idx === 0) k.fillAll();
      gStack.add(k.group);
      kList.push(k);
      ySW += k.totalH;
    });
    gStack.rotation.y = -Math.PI / 2;
    gStack.position.set(-NICHE_DEPTH + depth / 2, 0, ROOM_D - w2 / 2);
    scene.add(gStack);
  }

  // Diagnostic: log Kallax sizes
  for (const k of kList) {
    const box = new THREE.Box3().setFromObject(k.group);
    const size = box.getSize(new THREE.Vector3());
    console.log(`Kallax ${k.cols}×${k.rows}: ${size.x.toFixed(1)}×${size.y.toFixed(1)}×${size.z.toFixed(1)} cm, pos=(${k.group.position.x.toFixed(1)}, ${k.group.position.y.toFixed(1)}, ${k.group.position.z.toFixed(1)})`);
  }

  // Screws (instanced)
  scene.updateMatrixWorld(true);
  const screwCount = kList.length * 8; // 6 units × 8 screws
  const instScrews = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.6, 0.6, 0.05, 16),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.7 }),
    screwCount,
  );
  let sIdx = 0;
  const dummy = new THREE.Object3D();
  for (const k of kList) {
    for (const p of k.getScrewPositions()) {
      dummy.position.copy(p);
      dummy.rotation.copy(k.group.rotation);
      dummy.updateMatrix();
      instScrews.setMatrixAt(sIdx++, dummy.matrix);
    }
  }
  instScrews.instanceMatrix.needsUpdate = true;
  scene.add(instScrews);
}
