import * as THREE from "three";
import { ROOM_W } from "./config.js";

export function buildSunnersta(scene) {
  const SW = 56; // 56cm (longueur)
  const SD = 36; // 36cm (profondeur)
  const SH = 90; // 90cm hauteur
  const LEG_T = 1.5;
  const SHELF_T = 1;

  const g = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    metalness: 0.3,
    roughness: 0.4,
  });
  const shelfMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 0.35,
  });

  // 4 montants verticaux
  for (const dx of [-1, 1]) {
    for (const dz of [-1, 1]) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(LEG_T, SH, LEG_T),
        frameMat,
      );
      leg.position.set(
        dx * (SW / 2 - LEG_T / 2),
        SH / 2,
        dz * (SD / 2 - LEG_T / 2),
      );
      leg.castShadow = true;
      g.add(leg);
    }
  }

  // 3 plateaux (bas, milieu, haut)
  for (const sy of [5, SH / 2, SH - 5]) {
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(SW - LEG_T * 2, SHELF_T, SD - LEG_T * 2),
      shelfMat,
    );
    shelf.position.set(0, sy, 0);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    g.add(shelf);
  }

  // 4 roulettes
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.6,
  });
  for (const dx of [-1, 1]) {
    for (const dz of [-1, 1]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 1.2, 8),
        wheelMat,
      );
      wheel.position.set(
        dx * (SW / 2 - 3),
        0.6,
        dz * (SD / 2 - 3),
      );
      g.add(wheel);
    }
  }

  // Rotation 90° : 56cm le long de Z, 36cm le long de X
  // Plaqué contre mur B (X=300) et Kallax SE (bord ~Z=299.5)
  g.rotation.y = Math.PI / 2;
  g.position.set(ROOM_W - SD / 2, 0, 299.5 - SW / 2);
  scene.add(g);
}
