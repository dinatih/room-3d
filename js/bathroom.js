import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import {
  ROOM_W,
  NUM_LAYERS,
  WALL_H,
  BRICK_H,
  PLATE_H,
  GAP,
  DOOR_START,
  NICHE_DEPTH,
  KITCHEN_Z,
  SDB_Z_END,
  DIAG_END_Z,
} from "./config.js";
import {
  fillRow,
  addBrickX,
  addBrickZ,
  addFloorBrick,
} from "./brickHelpers.js";
import { makeText } from "./labels.js";

export function buildBathroom(scene) {
  const WALL_X = DOOR_START - 0.5;
  const SDB_W = DOOR_START + NICHE_DEPTH; // 20 studs

  // Shared materials
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.2,
    roughness: 0.05,
    side: THREE.DoubleSide,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.3,
  });

  // =============================================
  // Mur salle de bain côté niche (parallèle au couloir), 1m40 = 14 studs
  // =============================================
  const SDB_WALL_LEN = SDB_Z_END - KITCHEN_Z; // 14
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(SDB_WALL_LEN, layer % 2 === 1))
      addBrickZ(-NICHE_DEPTH - 0.5, layer, KITCHEN_Z + b.start, b.size, "wall");
  }

  // =============================================
  // Mur fond SDB (Z=60) avec ouverture douche
  // =============================================
  const SDB_Z = KITCHEN_Z + SDB_WALL_LEN; // Z=60

  // Douche 70x70cm encastrée dans le mur sud
  const SHOWER_W = 7;
  const SHOWER_D = 7;
  const SHOWER_X0 = 0;
  const SHOWER_X1 = SHOWER_X0 + SHOWER_W; // X=7
  const SHOWER_Z0 = SDB_Z; // Z=60
  const SHOWER_Z1 = SHOWER_Z0 + SHOWER_D; // Z=67

  // Mur sud SDB (Z=60) : seul raccord X=-1→0
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    addBrickX(-NICHE_DEPTH, layer, SDB_Z + 0.5, NICHE_DEPTH, "wall");
  }

  // =============================================
  // Double porte coulissante vitrée (X=7→19, Z=60)
  // =============================================
  {
    const SLIDE_X0 = SHOWER_X1 + 1; // 8
    const SLIDE_X1 = DOOR_START - 1; // 18
    const SLIDE_W = SLIDE_X1 - SLIDE_X0; // 12
    const SLIDE_CX = (SLIDE_X0 + SLIDE_X1) / 2;
    const SLIDE_Z = SDB_Z;
    const SLIDE_H = WALL_H - 2;

    // Deux panneaux vitrés (6 studs chacun)
    const panelW = SLIDE_W / 2;
    for (const offset of [SLIDE_X0 + panelW / 2, SLIDE_X1 - panelW / 2]) {
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(panelW, SLIDE_H),
        glassMat,
      );
      panel.position.set(offset, SLIDE_H / 2, SLIDE_Z);
      scene.add(panel);
    }

    // Barre haute
    const topBar = new THREE.Mesh(
      new THREE.BoxGeometry(SLIDE_W, 0.3, 0.15),
      frameMat,
    );
    topBar.position.set(SLIDE_CX, SLIDE_H, SLIDE_Z);
    scene.add(topBar);

    // Rail bas
    const botRail = new THREE.Mesh(
      new THREE.BoxGeometry(SLIDE_W, 0.15, 0.3),
      frameMat,
    );
    botRail.position.set(SLIDE_CX, 0.075, SLIDE_Z);
    scene.add(botRail);

    // Montant central
    const center = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, SLIDE_H, 0.15),
      frameMat,
    );
    center.position.set(SLIDE_CX, SLIDE_H / 2, SLIDE_Z);
    scene.add(center);
  }

  // =============================================
  // DOUCHE (recess au-delà du mur sud)
  // =============================================
  const BASE_H = 2;
  const GLASS_H = 18;

  // Mur ouest douche (prolonge le mur SDB ouest de Z=60 à Z=67)
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(SHOWER_D, layer % 2 === 1))
      addBrickZ(-NICHE_DEPTH - 0.5, layer, SHOWER_Z0 + b.start, b.size, "wall");
  }

  // Mur est douche (X=7, de Z=60 à Z=67)
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(SHOWER_D, layer % 2 === 1))
      addBrickZ(SHOWER_X1 + 0.5, layer, SHOWER_Z0 + b.start, b.size, "wall");
  }

  // Mur fond douche (Z=67) — élargi de 1 stud pour rejoindre le mur ouest
  const BACK_W = SHOWER_W + NICHE_DEPTH; // 8
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(BACK_W, layer % 2 === 1))
      addBrickX(-NICHE_DEPTH + b.start, layer, SHOWER_Z1 + 0.5, b.size, "wall");
  }

  // Cuve (base surélevée 20cm)
  const showerCX = (SHOWER_X0 + SHOWER_X1) / 2;
  const showerCZ = (SHOWER_Z0 + SHOWER_Z1) / 2;
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 0.3,
  });
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(SHOWER_W, BASE_H, SHOWER_D),
    baseMat,
  );
  base.position.set(showerCX, BASE_H / 2, showerCZ);
  base.castShadow = true;
  base.receiveShadow = true;
  scene.add(base);

  // Porte vitrée au niveau du mur sud (Z=60)
  const glassBaseY = BASE_H;
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(SHOWER_W, GLASS_H),
    glassMat,
  );
  glass.position.set(showerCX, glassBaseY + GLASS_H / 2, SHOWER_Z0);
  scene.add(glass);

  // Cadre haut de la porte vitrée
  const showerTopBar = new THREE.Mesh(
    new THREE.BoxGeometry(SHOWER_W, 0.3, 0.15),
    frameMat,
  );
  showerTopBar.position.set(showerCX, glassBaseY + GLASS_H, SHOWER_Z0);
  scene.add(showerTopBar);

  // =============================================
  // WC basique (40cm x 60cm) contre mur SDB Nord, 40cm du mur Ouest
  // =============================================
  const WC_X0 = -NICHE_DEPTH + 4;
  const WC_W = 4;
  const WC_D = 6;
  const WC_Z0 = KITCHEN_Z + 0.5;
  const WC_CX = WC_X0 + WC_W / 2;

  const wcMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 0.3,
  });
  const wcMatDark = new THREE.MeshStandardMaterial({
    color: 0xd8d8d8,
    roughness: 0.4,
  });

  // Réservoir
  const tankW = WC_W,
    tankD = 2,
    tankH = 7;
  const tank = new THREE.Mesh(
    new THREE.BoxGeometry(tankW, tankH, tankD),
    wcMat,
  );
  tank.position.set(WC_CX, tankH / 2, WC_Z0 + tankD / 2);
  tank.castShadow = true;
  tank.receiveShadow = true;
  scene.add(tank);

  // Cuvette
  const bowlW = WC_W,
    bowlD = 4,
    bowlH = 4;
  const bowl = new THREE.Mesh(
    new THREE.BoxGeometry(bowlW, bowlH, bowlD),
    wcMat,
  );
  bowl.position.set(WC_CX, bowlH / 2, WC_Z0 + tankD + bowlD / 2);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  scene.add(bowl);

  // Abattant
  const lidH = 0.3;
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(bowlW + 0.2, lidH, bowlD + 0.2),
    wcMatDark,
  );
  lid.position.set(WC_CX, bowlH + lidH / 2, WC_Z0 + tankD + bowlD / 2);
  lid.castShadow = true;
  scene.add(lid);

  // Bouton chasse d'eau
  const flushBtn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8),
    wcMatDark,
  );
  flushBtn.position.set(WC_CX, tankH + 0.15, WC_Z0 + tankD / 2);
  scene.add(flushBtn);

  // =============================================
  // Meuble vasque suspendu, contre mur SDB Nord
  // =============================================
  const VANITY_W = 6;
  const VANITY_D = 4.7;
  const VANITY_H = 5;
  const VANITY_Y0 = 3;
  const VANITY_X1 = DOOR_START - 4.8;
  const VANITY_X0 = VANITY_X1 - VANITY_W;
  const VANITY_CX = (VANITY_X0 + VANITY_X1) / 2;
  const VANITY_CZ = KITCHEN_Z + 0.5 + VANITY_D / 2;

  const vanityMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 0.3,
  });
  const counterMat = new THREE.MeshStandardMaterial({
    color: 0xf8f8f8,
    roughness: 0.2,
  });
  const basinMat = new THREE.MeshStandardMaterial({
    color: 0xe0e4e8,
    roughness: 0.15,
  });

  const caisson = new THREE.Mesh(
    new THREE.BoxGeometry(VANITY_W, VANITY_H, VANITY_D),
    vanityMat,
  );
  caisson.position.set(VANITY_CX, VANITY_Y0 + VANITY_H / 2, VANITY_CZ);
  caisson.castShadow = true;
  caisson.receiveShadow = true;
  scene.add(caisson);

  const counterH = 0.4;
  const counterW = VANITY_W + 0.3; // 6.3
  const counterD = VANITY_D + 0.15; // 4.85
  const counterCX = VANITY_CX;
  const counterCZ = VANITY_CZ + 0.075;
  const counterTopY = VANITY_Y0 + VANITY_H + counterH;

  // Basin hole dimensions
  const basinW = 3.5,
    basinD = 2.5,
    basinH = 1.2;
  const basinCZ = VANITY_CZ + 0.3;

  // Counter as 4 strips around basin opening
  const backW = counterW;
  const backD = counterCZ - counterD / 2 - (basinCZ - basinD / 2);
  if (backD > 0.01) {
    const cBack = new THREE.Mesh(
      new THREE.BoxGeometry(backW, counterH, backD),
      counterMat,
    );
    cBack.position.set(
      counterCX,
      counterTopY - counterH / 2,
      counterCZ - counterD / 2 + backD / 2,
    );
    cBack.castShadow = true;
    scene.add(cBack);
  }

  const frontD = basinCZ + basinD / 2 - (counterCZ + counterD / 2);
  const actualFrontD = counterCZ + counterD / 2 - (basinCZ + basinD / 2);
  if (actualFrontD > 0.01) {
    const cFront = new THREE.Mesh(
      new THREE.BoxGeometry(backW, counterH, actualFrontD),
      counterMat,
    );
    cFront.position.set(
      counterCX,
      counterTopY - counterH / 2,
      counterCZ + counterD / 2 - actualFrontD / 2,
    );
    cFront.castShadow = true;
    scene.add(cFront);
  }

  const sideW = (counterW - basinW) / 2;
  const cLeft = new THREE.Mesh(
    new THREE.BoxGeometry(sideW, counterH, basinD),
    counterMat,
  );
  cLeft.position.set(
    counterCX - counterW / 2 + sideW / 2,
    counterTopY - counterH / 2,
    basinCZ,
  );
  cLeft.castShadow = true;
  scene.add(cLeft);

  const cRight = new THREE.Mesh(
    new THREE.BoxGeometry(sideW, counterH, basinD),
    counterMat,
  );
  cRight.position.set(
    counterCX + counterW / 2 - sideW / 2,
    counterTopY - counterH / 2,
    basinCZ,
  );
  cRight.castShadow = true;
  scene.add(cRight);

  // Recessed basin (open-top box: 4 walls + bottom)
  const bT = 0.1; // basin wall thickness
  // Bottom
  const basinBottom = new THREE.Mesh(
    new THREE.BoxGeometry(basinW, bT, basinD),
    basinMat,
  );
  basinBottom.position.set(counterCX, counterTopY - basinH, basinCZ);
  basinBottom.receiveShadow = true;
  scene.add(basinBottom);

  // Back wall (Z-)
  const bWallBack = new THREE.Mesh(
    new THREE.BoxGeometry(basinW, basinH, bT),
    basinMat,
  );
  bWallBack.position.set(
    counterCX,
    counterTopY - basinH / 2,
    basinCZ - basinD / 2 + bT / 2,
  );
  scene.add(bWallBack);

  // Front wall (Z+)
  const bWallFront = new THREE.Mesh(
    new THREE.BoxGeometry(basinW, basinH, bT),
    basinMat,
  );
  bWallFront.position.set(
    counterCX,
    counterTopY - basinH / 2,
    basinCZ + basinD / 2 - bT / 2,
  );
  scene.add(bWallFront);

  // Left wall (X-)
  const bWallLeft = new THREE.Mesh(
    new THREE.BoxGeometry(bT, basinH, basinD - bT * 2),
    basinMat,
  );
  bWallLeft.position.set(
    counterCX - basinW / 2 + bT / 2,
    counterTopY - basinH / 2,
    basinCZ,
  );
  scene.add(bWallLeft);

  // Right wall (X+)
  const bWallRight = new THREE.Mesh(
    new THREE.BoxGeometry(bT, basinH, basinD - bT * 2),
    basinMat,
  );
  bWallRight.position.set(
    counterCX + basinW / 2 - bT / 2,
    counterTopY - basinH / 2,
    basinCZ,
  );
  scene.add(bWallRight);

  // Robinet
  const faucetMat = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    metalness: 0.8,
    roughness: 0.2,
  });
  const faucetBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 2, 8),
    faucetMat,
  );
  const faucetTopY = VANITY_Y0 + VANITY_H + counterH;
  faucetBase.position.set(
    VANITY_CX,
    faucetTopY + 1,
    VANITY_CZ - VANITY_D / 2 + 0.8,
  );
  scene.add(faucetBase);

  const faucetSpout = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.15, 1.2),
    faucetMat,
  );
  faucetSpout.position.set(
    VANITY_CX,
    faucetTopY + 2,
    VANITY_CZ - VANITY_D / 2 + 0.8 + 0.6,
  );
  scene.add(faucetSpout);

  // =============================================
  // Miroir sans cadre au-dessus du plan vasque (toute la largeur, 90cm de haut)
  // =============================================
  const mirrorW = counterW; // toute la largeur du plan
  const mirrorH = 9; // 90cm
  const mirrorY = counterTopY + mirrorH / 2;
  const mirrorZ = VANITY_CZ - VANITY_D / 2 + 0.5; // aligné au dos du meuble vasque

  const mirGeo = new THREE.PlaneGeometry(mirrorW, mirrorH);
  const mirror = new Reflector(mirGeo, {
    textureWidth: 512,
    textureHeight: 512,
    color: 0x888888,
  });
  mirror.position.set(counterCX, mirrorY, mirrorZ);
  scene.add(mirror);

  // =============================================
  // Lampe rectangulaire au-dessus du miroir (40x4x2cm, flottante 7cm du mur)
  // =============================================
  const lampW = 4,
    lampD = 0.4,
    lampH = 0.2;
  const lampY = counterTopY + mirrorH + lampH / 2 + 0.1;
  const lampZ = mirrorZ + 0.7 + lampD / 2; // 7cm du mur (aligné sur miroir)

  const lampMat = new THREE.MeshStandardMaterial({
    color: 0x999999,
    roughness: 0.3,
    metalness: 0.5,
  });
  const lamp = new THREE.Mesh(
    new THREE.BoxGeometry(lampW, lampH, lampD),
    lampMat,
  );
  lamp.position.set(counterCX, lampY, lampZ);
  scene.add(lamp);

  // Face éclairante (dessous de la lampe)
  const lightFaceMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffeedd,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });
  const lightFace = new THREE.Mesh(
    new THREE.PlaneGeometry(lampW - 0.1, lampD - 0.05),
    lightFaceMat,
  );
  lightFace.rotation.x = Math.PI / 2;
  lightFace.position.set(counterCX, lampY - lampH / 2 - 0.001, lampZ);
  scene.add(lightFace);

  // Lumière ponctuelle sous la lampe
  const lampLight = new THREE.PointLight(0xffeedd, 15, 12, 2);
  lampLight.position.set(counterCX, lampY - lampH / 2 - 0.2, lampZ);
  scene.add(lampLight);

  // =============================================
  // 2 meubles blancs 40x40x60cm dans les coins du mur SDB Nord
  // =============================================
  const CBN_W = 4,
    CBN_D = 4,
    CBN_H = 6;
  const cbnMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 0.3,
  });

  const cbnW = new THREE.Mesh(
    new THREE.BoxGeometry(CBN_W, CBN_H, CBN_D),
    cbnMat,
  );
  cbnW.position.set(
    -NICHE_DEPTH + CBN_W / 2,
    CBN_H / 2,
    KITCHEN_Z + 0.5 + CBN_D / 2,
  );
  cbnW.castShadow = true;
  cbnW.receiveShadow = true;
  scene.add(cbnW);

  const cbnE = new THREE.Mesh(
    new THREE.BoxGeometry(CBN_W, CBN_H, CBN_D),
    cbnMat,
  );
  cbnE.position.set(
    DOOR_START - CBN_W / 2 - 0.8,
    CBN_H / 2,
    KITCHEN_Z + 0.5 + CBN_D / 2,
  );
  cbnE.castShadow = true;
  cbnE.receiveShadow = true;
  scene.add(cbnE);

  // =============================================
  // Ballon d'eau chaude 100L vertical
  // =============================================
  const HW_R = 2;
  const HW_H = 8;
  const HW_X = -NICHE_DEPTH + HW_R;
  const HW_Y = WALL_H - 1 - HW_H / 2;
  const HW_Z = KITCHEN_Z + 1 + HW_R;

  const hwMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    roughness: 0.3,
  });

  const hwBody = new THREE.Mesh(
    new THREE.CylinderGeometry(HW_R, HW_R, HW_H, 16),
    hwMat,
  );
  hwBody.position.set(HW_X, HW_Y, HW_Z);
  hwBody.castShadow = true;
  hwBody.receiveShadow = true;
  scene.add(hwBody);

  const capMat = new THREE.MeshStandardMaterial({
    color: 0xd0d0d0,
    roughness: 0.4,
  });
  const capGeo = new THREE.CylinderGeometry(HW_R + 0.05, HW_R + 0.05, 0.2, 16);
  const capTop = new THREE.Mesh(capGeo, capMat);
  capTop.position.set(HW_X, HW_Y + HW_H / 2 + 0.1, HW_Z);
  scene.add(capTop);
  const capBot = new THREE.Mesh(capGeo, capMat);
  capBot.position.set(HW_X, HW_Y - HW_H / 2 - 0.1, HW_Z);
  scene.add(capBot);

  const bracketMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.6,
    roughness: 0.3,
  });
  for (const dy of [-2, 2]) {
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(HW_R + 0.5, 0.4, 0.5),
      bracketMat,
    );
    bracket.position.set(-NICHE_DEPTH + (HW_R + 0.5) / 2, HW_Y + dy, HW_Z);
    scene.add(bracket);
  }

  // Extension mur SDB ouest de 6 studs vers le sud (Z=67 → Z=73)
  const WEST_EXT = DIAG_END_Z - SHOWER_Z1; // 6
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(WEST_EXT, layer % 2 === 1))
      addBrickZ(-NICHE_DEPTH - 0.5, layer, SHOWER_Z1 + b.start, b.size, "wall");
  }

  // =============================================
  // Sol SDB (X=-1→19, Z=47→60)
  // =============================================
  for (let z = KITCHEN_Z + 1; z < SDB_Z; z++) {
    for (const b of fillRow(SDB_W, z % 2 === 1)) {
      addFloorBrick(-NICHE_DEPTH + b.start, z, b.size);
    }
  }

  // =============================================
  // Labels
  // =============================================
  const labelY = WALL_H * 0.6;
  const sdbCX = (-NICHE_DEPTH + DOOR_START) / 2;
  const sdbCZ = (KITCHEN_Z + SDB_Z) / 2;
  makeText(scene, "MUR SDB NORD", {
    size: 1.2,
    x: sdbCX,
    y: labelY,
    z: KITCHEN_Z - 3,
  });
  makeText(scene, "MUR SDB OUEST", {
    size: 1.2,
    x: -NICHE_DEPTH - 4,
    y: labelY,
    z: sdbCZ,
    rotY: Math.PI / 2,
  });
  makeText(scene, "PORTE VITRÉE", {
    size: 1.2,
    x: sdbCX,
    y: labelY,
    z: SDB_Z + 3,
    rotY: Math.PI,
  });
}
