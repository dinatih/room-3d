import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { DOOR_START, KITCHEN_Z, GAP } from './config.js';

// =============================================
// Ensemble meuble-vasque-miroir-lampe SDB
// Meuble 60×47×50cm suspendu à 30cm + plan vasque 63×48.5cm
// Lavabo intégré 35×25×12cm + robinet
// Miroir 63×90cm + lampe 40×2×4cm
// =============================================

const VANITY_W  = 60;
const VANITY_D  = 47;
const VANITY_H  = 50;
const VANITY_Y0 = 30;
const VANITY_X1 = DOOR_START - 48;           // 142
const VANITY_X0 = VANITY_X1 - VANITY_W;      // 82
const VANITY_CX = (VANITY_X0 + VANITY_X1) / 2;
const VANITY_CZ = KITCHEN_Z + 5 + VANITY_D / 2;

export function buildVasque(scene) {
  const group = new THREE.Group();
  group.userData.inventoryId = 'vasque-sdb';

  const vanityMat  = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
  const counterMat = new THREE.MeshStandardMaterial({ color: 0xf8f8f8, roughness: 0.2 });
  const basinMat   = new THREE.MeshStandardMaterial({ color: 0xe0e4e8, roughness: 0.15 });

  // ── Caisson suspendu ──
  const caisson = new THREE.Mesh(new THREE.BoxGeometry(VANITY_W, VANITY_H, VANITY_D), vanityMat);
  caisson.position.set(VANITY_CX, VANITY_Y0 + VANITY_H / 2, VANITY_CZ);
  caisson.castShadow = true;
  caisson.receiveShadow = true;
  group.add(caisson);

  // ── Plan vasque ──
  const counterH  = 4;
  const counterW  = VANITY_W + 3;        // 63
  const counterD  = VANITY_D + 1.5;      // 48.5
  const counterCX = VANITY_CX;
  const counterCZ = VANITY_CZ + 0.75;
  const counterTopY = VANITY_Y0 + VANITY_H + counterH;

  const basinW  = 35, basinD = 25, basinH = 12;
  const basinCZ = VANITY_CZ + 3;

  // Dalle arrière
  const backD_val = basinCZ - basinD / 2 - (counterCZ - counterD / 2);
  if (backD_val > 0.1) {
    const cBack = new THREE.Mesh(new THREE.BoxGeometry(counterW, counterH, backD_val), counterMat);
    cBack.position.set(counterCX, counterTopY - counterH / 2, counterCZ - counterD / 2 + backD_val / 2);
    cBack.castShadow = true;
    group.add(cBack);
  }

  // Dalle avant
  const actualFrontD = counterCZ + counterD / 2 - (basinCZ + basinD / 2);
  if (actualFrontD > 0.1) {
    const cFront = new THREE.Mesh(new THREE.BoxGeometry(counterW, counterH, actualFrontD), counterMat);
    cFront.position.set(counterCX, counterTopY - counterH / 2, counterCZ + counterD / 2 - actualFrontD / 2);
    cFront.castShadow = true;
    group.add(cFront);
  }

  // Côtés du plan
  const sideW = (counterW - basinW) / 2;
  const cLeft = new THREE.Mesh(new THREE.BoxGeometry(sideW, counterH, basinD), counterMat);
  cLeft.position.set(counterCX - counterW / 2 + sideW / 2, counterTopY - counterH / 2, basinCZ);
  cLeft.castShadow = true;
  group.add(cLeft);

  const cRight = new THREE.Mesh(new THREE.BoxGeometry(sideW, counterH, basinD), counterMat);
  cRight.position.set(counterCX + counterW / 2 - sideW / 2, counterTopY - counterH / 2, basinCZ);
  cRight.castShadow = true;
  group.add(cRight);

  // ── Vasque (boîte ouverte en haut) ──
  const bT = 1;
  const basinBottom = new THREE.Mesh(new THREE.BoxGeometry(basinW, bT, basinD), basinMat);
  basinBottom.position.set(counterCX, counterTopY - basinH, basinCZ);
  basinBottom.receiveShadow = true;
  group.add(basinBottom);

  const bWallBack = new THREE.Mesh(new THREE.BoxGeometry(basinW, basinH, bT), basinMat);
  bWallBack.position.set(counterCX, counterTopY - basinH / 2, basinCZ - basinD / 2 + bT / 2);
  group.add(bWallBack);

  const bWallFront = new THREE.Mesh(new THREE.BoxGeometry(basinW, basinH, bT), basinMat);
  bWallFront.position.set(counterCX, counterTopY - basinH / 2, basinCZ + basinD / 2 - bT / 2);
  group.add(bWallFront);

  const bWallLeft = new THREE.Mesh(new THREE.BoxGeometry(bT, basinH, basinD - bT * 2), basinMat);
  bWallLeft.position.set(counterCX - basinW / 2 + bT / 2, counterTopY - basinH / 2, basinCZ);
  group.add(bWallLeft);

  const bWallRight = new THREE.Mesh(new THREE.BoxGeometry(bT, basinH, basinD - bT * 2), basinMat);
  bWallRight.position.set(counterCX + basinW / 2 - bT / 2, counterTopY - basinH / 2, basinCZ);
  group.add(bWallRight);

  // ── Robinet ──
  const faucetMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 });
  const faucetTopY = counterTopY;
  const faucetBase = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 20, 8), faucetMat);
  faucetBase.position.set(VANITY_CX, faucetTopY + 10, VANITY_CZ - VANITY_D / 2 + 8);
  group.add(faucetBase);

  const faucetSpout = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 12), faucetMat);
  faucetSpout.position.set(VANITY_CX, faucetTopY + 20, VANITY_CZ - VANITY_D / 2 + 8 + 6);
  group.add(faucetSpout);

  // ── Miroir Reflector ──
  const mirrorW = counterW;
  const mirrorH = 90;
  const mirrorY = counterTopY + mirrorH / 2;
  const mirrorZ = VANITY_CZ - VANITY_D / 2 + 5 + GAP + 0.5;

  const mirror = new Reflector(new THREE.PlaneGeometry(mirrorW, mirrorH), {
    textureWidth: 512, textureHeight: 512, color: 0x888888,
  });
  mirror.position.set(counterCX, mirrorY, mirrorZ);
  group.add(mirror);

  // ── Lampe LED ──
  const lampW = 40, lampD = 4, lampH = 2;
  const lampY = counterTopY + mirrorH + lampH / 2 + 1;
  const lampZ = mirrorZ + 7 + lampD / 2;

  const lampMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.3, metalness: 0.5 });
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(lampW, lampH, lampD), lampMat);
  lamp.position.set(counterCX, lampY, lampZ);
  group.add(lamp);

  const lightFaceMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffeedd, emissiveIntensity: 1.5, roughness: 0.2,
  });
  const lightFace = new THREE.Mesh(new THREE.PlaneGeometry(lampW - 1, lampD - 0.5), lightFaceMat);
  lightFace.rotation.x = Math.PI / 2;
  lightFace.position.set(counterCX, lampY - lampH / 2 - 0.01, lampZ);
  group.add(lightFace);

  const lampLight = new THREE.PointLight(0xffeedd, 15, 120, 2);
  lampLight.position.set(counterCX, lampY - lampH / 2 - 2, lampZ);
  group.add(lampLight);

  scene.add(group);
}
