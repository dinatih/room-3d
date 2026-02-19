import * as THREE from 'three';
import { ROOM_D, NICHE_DEPTH, KALLAX_CELL, KALLAX_PANEL } from './config.js';

export function buildMackapar(scene) {
  const MP_X = 7.8;
  const MP_Z = 3.2;
  const MP_H = 20;
  const FRAME_T = 0.2;

  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.4 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.4, roughness: 0.3 });

  const K4_W_CALC = 2 * KALLAX_CELL + 3 * KALLAX_PANEL;
  const kallaxEdgeZ = ROOM_D - K4_W_CALC;

  const mpX = -NICHE_DEPTH + MP_X / 2;
  const mpZ = kallaxEdgeZ - MP_Z / 2;
  const mpBaseY = 0;

  // 4 montants verticaux aux coins
  for (const dz of [-1, 1]) {
    for (const dx of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(FRAME_T, MP_H, FRAME_T), whiteMat);
      m.position.set(
        mpX + dx * (MP_X / 2 - FRAME_T / 2),
        mpBaseY + MP_H / 2,
        mpZ + dz * (MP_Z / 2 - FRAME_T / 2)
      );
      m.castShadow = true;
      scene.add(m);
    }
  }

  // Traverses horizontales haut et bas
  for (const dz of [-1, 1]) {
    const tH = new THREE.Mesh(new THREE.BoxGeometry(MP_X, FRAME_T, FRAME_T), whiteMat);
    tH.position.set(mpX, mpBaseY + MP_H - FRAME_T / 2, mpZ + dz * (MP_Z / 2 - FRAME_T / 2));
    scene.add(tH);
    const tB = new THREE.Mesh(new THREE.BoxGeometry(MP_X, FRAME_T, FRAME_T), whiteMat);
    tB.position.set(mpX, mpBaseY + FRAME_T / 2, mpZ + dz * (MP_Z / 2 - FRAME_T / 2));
    scene.add(tB);
  }

  // Barre de penderie
  const rail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, MP_X - FRAME_T * 2, 8),
    metalMat
  );
  rail.rotation.z = Math.PI / 2;
  rail.position.set(mpX, mpBaseY + MP_H - 2, mpZ);
  scene.add(rail);

  // 2 étagères à chaussures
  for (const sy of [1, 3]) {
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(MP_X, 0.12, MP_Z),
      whiteMat
    );
    shelf.position.set(mpX, mpBaseY + sy, mpZ);
    shelf.castShadow = true;
    scene.add(shelf);
  }

  // Étagère haute
  const shelfTop = new THREE.Mesh(
    new THREE.BoxGeometry(MP_X, 0.15, MP_Z),
    whiteMat
  );
  shelfTop.position.set(mpX, mpBaseY + MP_H - 0.08, mpZ);
  shelfTop.castShadow = true;
  scene.add(shelfTop);

  // Vêtements rouges sur la barre de penderie
  const clothMat = new THREE.MeshStandardMaterial({ color: 0xcc2020, roughness: 0.8 });
  const clothDarkMat = new THREE.MeshStandardMaterial({ color: 0xa01818, roughness: 0.85 });
  const hangerMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.3, roughness: 0.4 });
  const railY = mpBaseY + MP_H - 2;
  const CLOTH_T = 0.12;

  function addHanger(hx) {
    const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), hangerMat);
    hook.position.set(hx, railY + 0.3, mpZ);
    scene.add(hook);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.4), hangerMat);
    bar.position.set(hx, railY - 0.05, mpZ);
    scene.add(bar);
  }

  const clothPositions = [mpX - 2.4, mpX - 0.8, mpX + 0.8, mpX + 2.4];

  for (let ci = 0; ci < 4; ci++) {
    const cx = clothPositions[ci];
    addHanger(cx);
    const topY = railY - 0.1;
    const mat = ci % 2 === 0 ? clothMat : clothDarkMat;

    if (ci < 2) {
      // Combinaison
      const torso = new THREE.Mesh(new THREE.BoxGeometry(CLOTH_T, 5.5, 2.2), mat);
      torso.position.set(cx, topY - 2.75, mpZ);
      torso.castShadow = true;
      scene.add(torso);
      for (const side of [-1, 1]) {
        const sleeve = new THREE.Mesh(new THREE.BoxGeometry(CLOTH_T, 4, 1.0), mat);
        sleeve.position.set(cx, topY - 2.2, mpZ + side * 1.5);
        sleeve.rotation.x = side * 0.15;
        sleeve.castShadow = true;
        scene.add(sleeve);
      }
      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(CLOTH_T, 6.5, 0.9), mat);
        leg.position.set(cx, topY - 5.5 - 3.25, mpZ + side * 0.55);
        leg.castShadow = true;
        scene.add(leg);
      }
    } else {
      // Sweat
      const torso = new THREE.Mesh(new THREE.BoxGeometry(CLOTH_T, 6, 2.4), mat);
      torso.position.set(cx, topY - 3, mpZ);
      torso.castShadow = true;
      scene.add(torso);
      for (const side of [-1, 1]) {
        const sleeve = new THREE.Mesh(new THREE.BoxGeometry(CLOTH_T, 5, 1.1), mat);
        sleeve.position.set(cx, topY - 2.8, mpZ + side * 1.6);
        sleeve.rotation.x = side * 0.2;
        sleeve.castShadow = true;
        scene.add(sleeve);
      }
    }
  }
}
