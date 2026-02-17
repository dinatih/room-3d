import * as THREE from 'three';
import { ROOM_W, ROOM_D, PLATE_H, NICHE_DEPTH } from './config.js';
import { addDronaBoxes } from './drona.js';

export function buildKallax(scene) {
  // =============================================
  // KALLAX 2x3 - Angle mur C (Z=0) + mur B (X=30)
  // =============================================
  {
    const KX_COLS = 2;
    const KX_ROWS = 3;
    const KX_CELL = 3.3;
    const KX_PANEL = 0.15;
    const KX_DEPTH = 4;
    const KX_W = KX_COLS * KX_CELL + (KX_COLS + 1) * KX_PANEL;
    const KX_H = KX_ROWS * KX_CELL + (KX_ROWS + 1) * KX_PANEL;

    const kxX = ROOM_W - KX_DEPTH / 2;
    const kxZ = KX_W / 2;
    const kxBaseY = PLATE_H;

    const kxMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.4 });
    const kxMatInner = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.5 });

    const backGeo = new THREE.BoxGeometry(0.08, KX_H, KX_W);
    const back = new THREE.Mesh(backGeo, kxMatInner);
    back.position.set(kxX + KX_DEPTH / 2 - 0.04, kxBaseY + KX_H / 2, kxZ);
    back.castShadow = true;
    scene.add(back);

    for (let r = 0; r <= KX_ROWS; r++) {
      const y = kxBaseY + r * (KX_CELL + KX_PANEL) + KX_PANEL / 2;
      const geo = new THREE.BoxGeometry(KX_DEPTH, KX_PANEL, KX_W);
      const mesh = new THREE.Mesh(geo, kxMat);
      mesh.position.set(kxX, y, kxZ);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    }

    for (let c = 0; c <= KX_COLS; c++) {
      const z = kxZ - KX_W / 2 + c * (KX_CELL + KX_PANEL) + KX_PANEL / 2;
      const geo = new THREE.BoxGeometry(KX_DEPTH, KX_H, KX_PANEL);
      const mesh = new THREE.Mesh(geo, kxMat);
      mesh.position.set(kxX, kxBaseY + KX_H / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    }

    addDronaBoxes(scene, kxX, kxZ, kxBaseY, KX_COLS, KX_ROWS, KX_CELL, KX_PANEL, KX_DEPTH);
  }

  // =============================================
  // KALLAX 1x4 - Mur B, à 60cm du mur D
  // =============================================
  {
    const K3_COLS = 1;
    const K3_ROWS = 4;
    const K3_CELL = 3.3;
    const K3_PANEL = 0.15;
    const K3_DEPTH = 4;
    const K3_W = K3_COLS * K3_CELL + (K3_COLS + 1) * K3_PANEL;
    const K3_H = K3_ROWS * K3_CELL + (K3_ROWS + 1) * K3_PANEL;

    const k3X = ROOM_W - K3_DEPTH / 2;
    const k3Z = ROOM_D - 6 - K3_W / 2;
    const k3BaseY = PLATE_H;

    const k3Mat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.4 });
    const k3MatInner = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.5 });

    const backGeo = new THREE.BoxGeometry(0.08, K3_H, K3_W);
    const back = new THREE.Mesh(backGeo, k3MatInner);
    back.position.set(k3X + K3_DEPTH / 2 - 0.04, k3BaseY + K3_H / 2, k3Z);
    back.castShadow = true;
    scene.add(back);

    for (let r = 0; r <= K3_ROWS; r++) {
      const y = k3BaseY + r * (K3_CELL + K3_PANEL) + K3_PANEL / 2;
      const geo = new THREE.BoxGeometry(K3_DEPTH, K3_PANEL, K3_W);
      const mesh = new THREE.Mesh(geo, k3Mat);
      mesh.position.set(k3X, y, k3Z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    }

    for (let c = 0; c <= K3_COLS; c++) {
      const z = k3Z - K3_W / 2 + c * (K3_CELL + K3_PANEL) + K3_PANEL / 2;
      const geo = new THREE.BoxGeometry(K3_DEPTH, K3_H, K3_PANEL);
      const mesh = new THREE.Mesh(geo, k3Mat);
      mesh.position.set(k3X, k3BaseY + K3_H / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    }

    addDronaBoxes(scene, k3X, k3Z, k3BaseY, K3_COLS, K3_ROWS, K3_CELL, K3_PANEL, K3_DEPTH);
  }

  // =============================================
  // KALLAX 1x4 - Angle mur A (X=0) + mur C (Z=0)
  // =============================================
  {
    const K2_COLS = 1;
    const K2_ROWS = 4;
    const K2_CELL = 3.3;
    const K2_PANEL = 0.15;
    const K2_DEPTH = 4;
    const K2_W = K2_COLS * K2_CELL + (K2_COLS + 1) * K2_PANEL;
    const K2_H = K2_ROWS * K2_CELL + (K2_ROWS + 1) * K2_PANEL;

    const k2X = K2_DEPTH / 2;
    const k2Z = K2_W / 2;
    const k2BaseY = PLATE_H;

    const k2Mat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.4 });
    const k2MatInner = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.5 });

    const backGeo = new THREE.BoxGeometry(0.08, K2_H, K2_W);
    const back = new THREE.Mesh(backGeo, k2MatInner);
    back.position.set(k2X - K2_DEPTH / 2 + 0.04, k2BaseY + K2_H / 2, k2Z);
    back.castShadow = true;
    scene.add(back);

    for (let r = 0; r <= K2_ROWS; r++) {
      const y = k2BaseY + r * (K2_CELL + K2_PANEL) + K2_PANEL / 2;
      const geo = new THREE.BoxGeometry(K2_DEPTH, K2_PANEL, K2_W);
      const mesh = new THREE.Mesh(geo, k2Mat);
      mesh.position.set(k2X, y, k2Z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    }

    for (let c = 0; c <= K2_COLS; c++) {
      const z = k2Z - K2_W / 2 + c * (K2_CELL + K2_PANEL) + K2_PANEL / 2;
      const geo = new THREE.BoxGeometry(K2_DEPTH, K2_H, K2_PANEL);
      const mesh = new THREE.Mesh(geo, k2Mat);
      mesh.position.set(k2X, k2BaseY + K2_H / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    }

    addDronaBoxes(scene, k2X, k2Z, k2BaseY, K2_COLS, K2_ROWS, K2_CELL, K2_PANEL, K2_DEPTH);
  }

  // =============================================
  // KALLAX 2x5 - Angle mur A (X=0) + mur D (Z=40)
  // =============================================
  {
    const K4_COLS = 2;
    const K4_ROWS = 5;
    const K4_CELL = 3.3;
    const K4_PANEL = 0.15;
    const K4_DEPTH = 4;
    const K4_W = K4_COLS * K4_CELL + (K4_COLS + 1) * K4_PANEL;
    const K4_H = K4_ROWS * K4_CELL + (K4_ROWS + 1) * K4_PANEL;

    const k4X = -NICHE_DEPTH + K4_DEPTH / 2;
    const k4Z = ROOM_D - K4_W / 2;
    const k4BaseY = PLATE_H;

    const k4Mat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.4 });
    const k4MatInner = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.5 });

    const backGeo = new THREE.BoxGeometry(0.08, K4_H, K4_W);
    const back = new THREE.Mesh(backGeo, k4MatInner);
    back.position.set(k4X - K4_DEPTH / 2 + 0.04, k4BaseY + K4_H / 2, k4Z);
    back.castShadow = true;
    scene.add(back);

    for (let r = 0; r <= K4_ROWS; r++) {
      const y = k4BaseY + r * (K4_CELL + K4_PANEL) + K4_PANEL / 2;
      const geo = new THREE.BoxGeometry(K4_DEPTH, K4_PANEL, K4_W);
      const mesh = new THREE.Mesh(geo, k4Mat);
      mesh.position.set(k4X, y, k4Z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    }

    for (let c = 0; c <= K4_COLS; c++) {
      const z = k4Z - K4_W / 2 + c * (K4_CELL + K4_PANEL) + K4_PANEL / 2;
      const geo = new THREE.BoxGeometry(K4_DEPTH, K4_H, K4_PANEL);
      const mesh = new THREE.Mesh(geo, k4Mat);
      mesh.position.set(k4X, k4BaseY + K4_H / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    }

    addDronaBoxes(scene, k4X, k4Z, k4BaseY, K4_COLS, K4_ROWS, K4_CELL, K4_PANEL, K4_DEPTH);
  }
}
