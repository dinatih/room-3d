import * as THREE from 'three';

// =============================================
// DRONA - Helper pour remplir une Kallax
// =============================================
const dronaMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.7 });
const dronaTopMat = new THREE.MeshStandardMaterial({ color: 0xbb1e1e, roughness: 0.75 });
const dronaHandleMat = new THREE.MeshStandardMaterial({ color: 0x881515, roughness: 0.8 });

export function addDronaBoxes(scene, cx, cz, baseY, cols, rows, cell, panel, depth) {
  const totalW = cols * cell + (cols + 1) * panel;
  const dronaMargin = 0.15;
  const dronaW = cell - dronaMargin * 2;
  const dronaH = cell - dronaMargin * 2;
  const dronaD = depth - 0.6;
  const wallThick = 0.1;
  const handleFromTop = 0.7;
  const handleLineH = 0.06;
  const handleLineW = 1.2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dy = baseY + r * (cell + panel) + panel + cell / 2;
      const dz = cz - totalW / 2 + c * (cell + panel) + panel + cell / 2;

      // Corps du Drona
      const boxGeo = new THREE.BoxGeometry(dronaD, dronaH, dronaW);
      const box = new THREE.Mesh(boxGeo, dronaMat);
      box.position.set(cx, dy, dz);
      box.castShadow = true;
      box.receiveShadow = true;
      scene.add(box);

      // Rebord supérieur
      const rimGeo = new THREE.BoxGeometry(dronaD + 0.1, wallThick, dronaW + 0.1);
      const rim = new THREE.Mesh(rimGeo, dronaTopMat);
      rim.position.set(cx, dy + dronaH / 2 - wallThick / 2, dz);
      scene.add(rim);

      // Trait d'ombre poignée
      const handleY = dy + dronaH / 2 - handleFromTop;
      const handleGeo = new THREE.PlaneGeometry(handleLineW, handleLineH);
      for (const sign of [-1, 1]) {
        const handle = new THREE.Mesh(handleGeo, dronaHandleMat);
        handle.rotation.y = Math.PI / 2;
        handle.position.set(cx + sign * (dronaD / 2 + 0.005), handleY, dz);
        scene.add(handle);
      }
    }
  }
}
