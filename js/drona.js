import * as THREE from 'three';

// =============================================
// DRONA - Helper pour remplir une Kallax
// Boîte ouverte en haut (4 parois + fond)
// =============================================
const dronaMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.7 });
const dronaInnerMat = new THREE.MeshStandardMaterial({ color: 0x991818, roughness: 0.8 });
const dronaTopMat = new THREE.MeshStandardMaterial({ color: 0xbb1e1e, roughness: 0.75 });
const dronaHandleMat = new THREE.MeshStandardMaterial({ color: 0x881515, roughness: 0.8 });

/**
 * Ajoute un seul Drona ouvert à la position donnée
 * @param {THREE.Scene} scene
 * @param {number} cx - centre X
 * @param {number} cy - centre Y (milieu en hauteur)
 * @param {number} cz - centre Z
 * @param {number} dronaW - largeur (Z)
 * @param {number} dronaH - hauteur (Y)
 * @param {number} dronaD - profondeur (X)
 */
export function addSingleDrona(scene, cx, cy, cz, dronaW, dronaH, dronaD) {
  const T = 0.1; // épaisseur des parois

  // Fond (en bas)
  const bottom = new THREE.Mesh(
    new THREE.BoxGeometry(dronaD - T * 2, T, dronaW - T * 2),
    dronaInnerMat
  );
  bottom.position.set(cx, cy - dronaH / 2 + T / 2, cz);
  bottom.receiveShadow = true;
  scene.add(bottom);

  // Paroi avant (X-)
  const frontBack = new THREE.BoxGeometry(T, dronaH, dronaW);
  const front = new THREE.Mesh(frontBack, dronaMat);
  front.position.set(cx - dronaD / 2 + T / 2, cy, cz);
  front.castShadow = true;
  scene.add(front);

  // Paroi arrière (X+)
  const back = new THREE.Mesh(frontBack, dronaMat);
  back.position.set(cx + dronaD / 2 - T / 2, cy, cz);
  back.castShadow = true;
  scene.add(back);

  // Paroi gauche (Z-)
  const sideGeo = new THREE.BoxGeometry(dronaD, dronaH, T);
  const left = new THREE.Mesh(sideGeo, dronaMat);
  left.position.set(cx, cy, cz - dronaW / 2 + T / 2);
  left.castShadow = true;
  scene.add(left);

  // Paroi droite (Z+)
  const right = new THREE.Mesh(sideGeo, dronaMat);
  right.position.set(cx, cy, cz + dronaW / 2 - T / 2);
  right.castShadow = true;
  scene.add(right);

  // Rebord supérieur (cadre ouvert, bord plié du tissu)
  const rimY = cy + dronaH / 2 - T / 2;
  const rimT = 0.15; // largeur du rebord
  // Avant / arrière (le long de Z)
  const rimFB = new THREE.BoxGeometry(rimT, T, dronaW + 0.1);
  const rimF = new THREE.Mesh(rimFB, dronaTopMat);
  rimF.position.set(cx - dronaD / 2, rimY, cz);
  scene.add(rimF);
  const rimB = new THREE.Mesh(rimFB, dronaTopMat);
  rimB.position.set(cx + dronaD / 2, rimY, cz);
  scene.add(rimB);
  // Gauche / droite (le long de X)
  const rimLR = new THREE.BoxGeometry(dronaD + 0.1, T, rimT);
  const rimL = new THREE.Mesh(rimLR, dronaTopMat);
  rimL.position.set(cx, rimY, cz - dronaW / 2);
  scene.add(rimL);
  const rimR = new THREE.Mesh(rimLR, dronaTopMat);
  rimR.position.set(cx, rimY, cz + dronaW / 2);
  scene.add(rimR);

  // Traits poignée (avant et arrière)
  const handleY = cy + dronaH / 2 - 0.7;
  const handleGeo = new THREE.PlaneGeometry(1.2, 0.06);
  for (const sign of [-1, 1]) {
    const handle = new THREE.Mesh(handleGeo, dronaHandleMat);
    handle.rotation.y = Math.PI / 2;
    handle.position.set(cx + sign * (dronaD / 2 + 0.005), handleY, cz);
    scene.add(handle);
  }
}

export function addDronaBoxes(scene, cx, cz, baseY, cols, rows, cell, panel, depth) {
  const totalW = cols * cell + (cols + 1) * panel;
  const dronaMargin = 0.15;
  const dronaW = cell - dronaMargin * 2;  // face Z (contraint par cellule)
  const dronaH = cell - dronaMargin * 2;  // face Y
  const dronaD = Math.min(3.8, depth - 0.2); // profondeur 38cm (réel DRONA)

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dy = baseY + r * (cell + panel) + panel + cell / 2;
      const dz = cz - totalW / 2 + c * (cell + panel) + panel + cell / 2;
      addSingleDrona(scene, cx, dy, dz, dronaW, dronaH, dronaD);
    }
  }
}
