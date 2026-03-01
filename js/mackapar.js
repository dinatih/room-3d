import * as THREE from 'three';
import { ROOM_D, NICHE_DEPTH } from './config.js';
import { kallaxW } from './kallax.js';

export function buildMackapar(scene) {
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.4 });

  const K4_W_CALC = kallaxW(2);
  const kallaxEdgeZ = ROOM_D - K4_W_CALC;

  // Mackapär group (from kallax.html)
  const mack = new THREE.Group();

  // 4 montants verticaux
  const postG = new THREE.BoxGeometry(2, 200, 2);
  [[-38, 15], [38, 15], [-38, -15], [38, -15]].forEach(p => {
    const m = new THREE.Mesh(postG, whiteMat);
    m.position.set(p[0], 100, p[1]);
    m.castShadow = true;
    mack.add(m);
  });

  // 3 étagères (2 basses + 1 haute)
  const shelfG = new THREE.BoxGeometry(78, 2, 32);
  [11, 31, 199].forEach(y => {
    const s = new THREE.Mesh(shelfG, whiteMat);
    s.position.y = y;
    s.castShadow = true;
    mack.add(s);
  });

  // Barre de penderie
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 74), whiteMat);
  rail.rotation.z = Math.PI / 2;
  rail.position.y = 185;
  mack.add(rail);

  // Position: à côté du Kallax SW, aligné sur le fond
  // Kallax prof=39, Mack prof=32 -> décalage Z = -3.5 (from kallax.html)
  const mpX = -NICHE_DEPTH + 39 + 16; // after Kallax depth + half Mackapär width offset
  const mpZ = kallaxEdgeZ - 32 / 2;
  mack.position.set(mpX, 0, mpZ);
  scene.add(mack);

  // Vêtements rouges sur la barre
  const clothMat = new THREE.MeshStandardMaterial({ color: 0xcc2020, roughness: 0.8 });
  const clothDarkMat = new THREE.MeshStandardMaterial({ color: 0xa01818, roughness: 0.85 });
  const hangerMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.3, roughness: 0.4 });
  const railY = 185;
  const CLOTH_T = 1.2;

  function addHanger(hx) {
    const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 6, 6), hangerMat);
    hook.position.set(hx, railY + 3, 0);
    mack.add(hook);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 24), hangerMat);
    bar.position.set(hx, railY - 0.5, 0);
    mack.add(bar);
  }

  const clothPositions = [-24, -8, 8, 24];

  for (let ci = 0; ci < 4; ci++) {
    const cx = clothPositions[ci];
    addHanger(cx);
    const topY = railY - 1;
    const mat = ci % 2 === 0 ? clothMat : clothDarkMat;

    if (ci < 2) {
      // Combinaison
      const torso = new THREE.Mesh(new THREE.BoxGeometry(CLOTH_T, 55, 22), mat);
      torso.position.set(cx, topY - 27.5, 0);
      torso.castShadow = true;
      mack.add(torso);
      for (const side of [-1, 1]) {
        const sleeve = new THREE.Mesh(new THREE.BoxGeometry(CLOTH_T, 40, 10), mat);
        sleeve.position.set(cx, topY - 22, side * 15);
        sleeve.rotation.x = side * 0.15;
        sleeve.castShadow = true;
        mack.add(sleeve);
      }
      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(CLOTH_T, 65, 9), mat);
        leg.position.set(cx, topY - 55 - 32.5, side * 5.5);
        leg.castShadow = true;
        mack.add(leg);
      }
    } else {
      // Sweat
      const torso = new THREE.Mesh(new THREE.BoxGeometry(CLOTH_T, 60, 24), mat);
      torso.position.set(cx, topY - 30, 0);
      torso.castShadow = true;
      mack.add(torso);
      for (const side of [-1, 1]) {
        const sleeve = new THREE.Mesh(new THREE.BoxGeometry(CLOTH_T, 50, 11), mat);
        sleeve.position.set(cx, topY - 28, side * 16);
        sleeve.rotation.x = side * 0.2;
        sleeve.castShadow = true;
        mack.add(sleeve);
      }
    }
  }
}
