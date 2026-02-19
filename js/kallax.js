import * as THREE from 'three';
import { ROOM_W, ROOM_D, NICHE_DEPTH, KALLAX_CELL, KALLAX_PANEL, KALLAX_DEPTH } from './config.js';
import { addDronaBoxes } from './drona.js';

function buildKallaxUnit(scene, cols, rows, cx, cz, baseY, backSide, dronaRows) {
  const W = cols * KALLAX_CELL + (cols + 1) * KALLAX_PANEL;
  const H = rows * KALLAX_CELL + (rows + 1) * KALLAX_PANEL;

  const mat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.4 });
  const matInner = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.5 });

  // Back panel (backSide: +1 = back towards +X, -1 = back towards -X)
  const backGeo = new THREE.BoxGeometry(0.08, H, W);
  const back = new THREE.Mesh(backGeo, matInner);
  back.position.set(cx + backSide * (KALLAX_DEPTH / 2 - 0.04), baseY + H / 2, cz);
  back.castShadow = true;
  scene.add(back);

  // Horizontal shelves
  for (let r = 0; r <= rows; r++) {
    const y = baseY + r * (KALLAX_CELL + KALLAX_PANEL) + KALLAX_PANEL / 2;
    const geo = new THREE.BoxGeometry(KALLAX_DEPTH, KALLAX_PANEL, W);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, y, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  // Vertical dividers
  for (let c = 0; c <= cols; c++) {
    const z = cz - W / 2 + c * (KALLAX_CELL + KALLAX_PANEL) + KALLAX_PANEL / 2;
    const geo = new THREE.BoxGeometry(KALLAX_DEPTH, H, KALLAX_PANEL);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, baseY + H / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  addDronaBoxes(scene, cx, cz, baseY, cols, dronaRows, KALLAX_CELL, KALLAX_PANEL, KALLAX_DEPTH);
}

export function buildKallax(scene) {
  // KALLAX 2x3 - Angle mur C (Z=0) + mur B (X=30)
  buildKallaxUnit(scene, 2, 3,
    ROOM_W - KALLAX_DEPTH / 2,
    (2 * KALLAX_CELL + 3 * KALLAX_PANEL) / 2,
    0, +1, 3);

  // KALLAX 1x4 - Mur B, à 60cm du mur D
  buildKallaxUnit(scene, 1, 4,
    ROOM_W - KALLAX_DEPTH / 2,
    ROOM_D - 6 - (1 * KALLAX_CELL + 2 * KALLAX_PANEL) / 2,
    0, +1, 4);

  // KALLAX 1x4 - Angle mur A (X=0) + mur C (Z=0)
  buildKallaxUnit(scene, 1, 4,
    KALLAX_DEPTH / 2,
    (1 * KALLAX_CELL + 2 * KALLAX_PANEL) / 2,
    0, -1, 4);

  // KALLAX 2x5 - Angle mur A (X=0) + mur D (Z=40)
  buildKallaxUnit(scene, 2, 5,
    -NICHE_DEPTH + KALLAX_DEPTH / 2,
    ROOM_D - (2 * KALLAX_CELL + 3 * KALLAX_PANEL) / 2,
    0, -1, 2);
}
