import * as THREE from 'three';
import { ROOM_W } from './config.js';
import { kallaxW } from './kallax.js';

export function buildBed(scene) {
  const BED_L = 200;
  const BED_W = 80;
  const BED_H = 30;
  const BED_FRAME = 5;
  const BED_LEG = 5;

  const KX2_END_Z = kallaxW(2); // 2-col Kallax total width (~75.5)
  const bedZ0 = KX2_END_Z + 3;
  const bedX1 = ROOM_W;

  const bedCX = bedX1 - BED_W / 2;
  const bedCZ = bedZ0 + BED_L / 2;
  const bedBaseY = 0;

  const woodMat = new THREE.MeshStandardMaterial({ color: 0xC4A46C, roughness: 0.7 });
  const woodDarkMat = new THREE.MeshStandardMaterial({ color: 0xB0935A, roughness: 0.65 });

  // 4 pieds
  const legGeo = new THREE.BoxGeometry(5, BED_LEG, 5);
  const legPositions = [
    [bedX1 - BED_W + 3, bedZ0 + 3],
    [bedX1 - 3,         bedZ0 + 3],
    [bedX1 - BED_W + 3, bedZ0 + BED_L - 3],
    [bedX1 - 3,         bedZ0 + BED_L - 3],
  ];
  for (const [lx, lz] of legPositions) {
    const leg = new THREE.Mesh(legGeo, woodDarkMat);
    leg.position.set(lx, bedBaseY + BED_LEG / 2, lz);
    leg.castShadow = true;
    scene.add(leg);
  }

  const frameY = bedBaseY + BED_LEG;

  // Cadre long côté mur B
  const sideLongGeo = new THREE.BoxGeometry(BED_FRAME, BED_H - BED_LEG, BED_L);
  const sideB = new THREE.Mesh(sideLongGeo, woodMat);
  sideB.position.set(bedX1 - BED_FRAME / 2, frameY + (BED_H - BED_LEG) / 2, bedCZ);
  sideB.castShadow = true;
  scene.add(sideB);

  // Cadre long côté intérieur
  const sideInt = new THREE.Mesh(sideLongGeo, woodMat);
  sideInt.position.set(bedX1 - BED_W + BED_FRAME / 2, frameY + (BED_H - BED_LEG) / 2, bedCZ);
  sideInt.castShadow = true;
  scene.add(sideInt);

  // Tête de lit
  const headGeo = new THREE.BoxGeometry(BED_W, BED_H - BED_LEG, BED_FRAME);
  const head = new THREE.Mesh(headGeo, woodMat);
  head.position.set(bedCX, frameY + (BED_H - BED_LEG) / 2, bedZ0 + BED_FRAME / 2);
  head.castShadow = true;
  scene.add(head);

  // Pied de lit
  const foot = new THREE.Mesh(headGeo, woodMat);
  foot.position.set(bedCX, frameY + (BED_H - BED_LEG) / 2, bedZ0 + BED_L - BED_FRAME / 2);
  foot.castShadow = true;
  scene.add(foot);

  // Lattes
  const numSlats = 15;
  const slatSpacing = (BED_L - BED_FRAME * 2) / (numSlats + 1);
  const slatGeo = new THREE.BoxGeometry(BED_W - BED_FRAME * 2, 1.2, 6);
  for (let i = 1; i <= numSlats; i++) {
    const slat = new THREE.Mesh(slatGeo, woodDarkMat);
    slat.position.set(bedCX, frameY + 0.6, bedZ0 + BED_FRAME + i * slatSpacing);
    scene.add(slat);
  }

  // Matelas
  const matH = 18;
  const matW = BED_W - BED_FRAME * 2 + 6;
  const matL = BED_L - BED_FRAME * 2 + 4;
  const frameTopY = frameY + (BED_H - BED_LEG);
  const matBottomY = frameTopY - 4;
  const matCenterY = matBottomY + matH / 2;
  const matTopY = matBottomY + matH;

  const matMat = new THREE.MeshStandardMaterial({ color: 0xF5F0E8, roughness: 0.8 });
  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(matW, matH, matL),
    matMat
  );
  mattress.position.set(bedCX, matCenterY, bedCZ);
  mattress.castShadow = true;
  mattress.receiveShadow = true;
  scene.add(mattress);

  // Couverture rouge
  const redMat = new THREE.MeshStandardMaterial({ color: 0xCC2222, roughness: 0.75 });
  const BLK_T = 1.2;
  const BLK_DRAPE = 20;

  const blkTopW = matW + 6;
  const blkTopL = matL + 3;
  const blkTop = new THREE.Mesh(
    new THREE.BoxGeometry(blkTopW, BLK_T, blkTopL),
    redMat
  );
  blkTop.position.set(bedCX, matTopY + BLK_T / 2, bedCZ + 1.5);
  blkTop.castShadow = true;
  blkTop.receiveShadow = true;
  scene.add(blkTop);

  // Drapé côté intérieur
  const drapeSide = new THREE.Mesh(
    new THREE.BoxGeometry(BLK_T, BLK_DRAPE, blkTopL),
    redMat
  );
  drapeSide.position.set(bedCX - blkTopW / 2, matTopY - BLK_DRAPE / 2, bedCZ + 1.5);
  drapeSide.castShadow = true;
  scene.add(drapeSide);

  // Drapé côté mur B
  const drapeSideB = new THREE.Mesh(
    new THREE.BoxGeometry(BLK_T, BLK_DRAPE, blkTopL),
    redMat
  );
  drapeSideB.position.set(bedCX + blkTopW / 2, matTopY - BLK_DRAPE / 2, bedCZ + 1.5);
  drapeSideB.castShadow = true;
  scene.add(drapeSideB);

  // Drapé au pied du lit
  const drapeFoot = new THREE.Mesh(
    new THREE.BoxGeometry(blkTopW, BLK_DRAPE, BLK_T),
    redMat
  );
  drapeFoot.position.set(bedCX, matTopY - BLK_DRAPE / 2, bedCZ + blkTopL / 2 + 1.5);
  drapeFoot.castShadow = true;
  scene.add(drapeFoot);

  // 2 polochons rouges
  const polochonR = 8;
  const polochonL = 28;
  const polochonGeo = new THREE.CylinderGeometry(polochonR, polochonR, polochonL, 12);
  const polochonY = matTopY + BLK_T + polochonR + 0.5;
  const polochonZ = bedZ0 + BED_FRAME + 15;

  for (const side of [-1, 1]) {
    const p = new THREE.Mesh(polochonGeo, redMat);
    p.rotation.z = Math.PI / 2;
    p.position.set(bedCX + side * (matW / 2 - polochonL / 2 - 2), polochonY, polochonZ);
    p.castShadow = true;
    scene.add(p);
  }
}
