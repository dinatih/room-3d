import * as THREE from "three";
import { buildVasque } from "./vasque.js";
import { buildWC } from "./wc.js";
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
  LAYER_FURNITURE,
  LAYER_STRUCTURE,
  CORR_DOOR_S,
  CORR_DOOR_E,
} from "./config.js";
import { fillRow, addBrickX, addBrickZ, addFloorBrick } from "./brickHelpers.js";

export function buildBathroom(scene) {
  const WALL_X = DOOR_START - 5;
  const SDB_W = DOOR_START + NICHE_DEPTH; // 200

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
  // Mur salle de bain côté niche (parallèle au couloir), 1m40 = 140cm
  // =============================================
  const SDB_WALL_LEN = SDB_Z_END - KITCHEN_Z; // 140
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(SDB_WALL_LEN, layer % 2 === 1))
      addBrickZ(-NICHE_DEPTH - 5, layer, KITCHEN_Z + b.start, b.size, "wall");
  }

  // =============================================
  // Mur fond SDB (Z=600) avec ouverture douche
  // =============================================
  const SDB_Z = KITCHEN_Z + SDB_WALL_LEN; // Z=600

  // Douche 70x70cm encastrée dans le mur sud, contre MS-O
  const SHOWER_W = 70;
  const SHOWER_D = 70;
  const SHOWER_X0 = -NICHE_DEPTH; // -10, contre mur ouest
  const SHOWER_X1 = SHOWER_X0 + SHOWER_W; // X=60
  const SHOWER_Z0 = SDB_Z; // Z=600
  const SHOWER_Z1 = SHOWER_Z0 + SHOWER_D; // Z=670

  // =============================================
  // Double porte coulissante placard PC-SDB (Z=600, jusqu'au plafond)
  // =============================================
  {
    const SLIDE_X0 = SHOWER_X1 + 10; // 70 → shifted: was +1 → +10
    const SLIDE_X1 = DOOR_START - 10; // 180
    const SLIDE_W = SLIDE_X1 - SLIDE_X0; // 110 → was 10 studs
    const SLIDE_CX = (SLIDE_X0 + SLIDE_X1) / 2;
    const SLIDE_Z = SDB_Z;
    const SLIDE_H = WALL_H;

    const doorMat = new THREE.MeshStandardMaterial({
      color: 0xf5f0e0,
      roughness: 0.5,
    });
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xf5f0e0,
      roughness: 0.5,
    });

    // Rail commun avec séparateur central
    const panelW = SLIDE_W / 2;
    const panelT = 2.3; // 2.3cm
    const railD = 7; // 7cm
    const sepT = 1; // séparateur central 1cm

    // Séparateur central (uniquement dans les rails haut et bas)
    const sepTop = new THREE.Mesh(new THREE.BoxGeometry(SLIDE_W + 4, 3, sepT), railMat);
    sepTop.position.set(SLIDE_CX, SLIDE_H - 1.5, SLIDE_Z);
    sepTop.userData.layerOverride = LAYER_STRUCTURE;
    scene.add(sepTop);

    const sepBot = new THREE.Mesh(new THREE.BoxGeometry(SLIDE_W + 4, 1.5, sepT), railMat);
    sepBot.position.set(SLIDE_CX, 0.75, SLIDE_Z);
    sepBot.userData.layerOverride = LAYER_STRUCTURE;
    scene.add(sepBot);

    // Porte gauche (côté SDB, Z-)
    const panelL = new THREE.Mesh(new THREE.BoxGeometry(panelW, SLIDE_H, panelT), doorMat);
    panelL.position.set(SLIDE_X0 + panelW / 2, SLIDE_H / 2, SLIDE_Z - sepT / 2 - panelT / 2);
    panelL.castShadow = true;
    panelL.userData.layerOverride = LAYER_STRUCTURE;
    scene.add(panelL);

    // Porte droite (côté douche, Z+)
    const panelR = new THREE.Mesh(new THREE.BoxGeometry(panelW, SLIDE_H, panelT), doorMat);
    panelR.position.set(SLIDE_X1 - panelW / 2, SLIDE_H / 2, SLIDE_Z + sepT / 2 + panelT / 2);
    panelR.castShadow = true;
    panelR.userData.layerOverride = LAYER_STRUCTURE;
    scene.add(panelR);

    // Rail haut (au plafond)
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(SLIDE_W + 4, 3, railD), railMat);
    topRail.position.set(SLIDE_CX, SLIDE_H - 1.5, SLIDE_Z);
    topRail.userData.layerOverride = LAYER_STRUCTURE;
    scene.add(topRail);

    // Rail bas
    const botRail = new THREE.Mesh(new THREE.BoxGeometry(SLIDE_W + 4, 1.5, railD), railMat);
    botRail.position.set(SLIDE_CX, 0.75, SLIDE_Z);
    botRail.userData.layerOverride = LAYER_STRUCTURE;
    scene.add(botRail);
  }

  // =============================================
  // DOUCHE (recess au-delà du mur sud)
  // =============================================
  const BASE_H = 20;
  const GLASS_H = 180;

  // Mur ouest douche (prolonge le mur SDB ouest de Z=600 à Z=670)
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(SHOWER_D, layer % 2 === 1))
      addBrickZ(-NICHE_DEPTH - 5, layer, SHOWER_Z0 + b.start, b.size, "wall");
  }

  // Mur est douche (X=60, de Z=600 à Z=670)
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(SHOWER_D, layer % 2 === 1))
      addBrickZ(SHOWER_X1 + 5, layer, SHOWER_Z0 + b.start, b.size, "wall");
  }

  // Mur fond douche (Z=670)
  const BACK_W = SHOWER_W; // 70 (de -10 à 60)
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(BACK_W, layer % 2 === 1))
      addBrickX(-NICHE_DEPTH + b.start, layer, SHOWER_Z1 + 5, b.size, "wall");
  }

  // Cuve (base surélevée 20cm)
  const showerCX = (SHOWER_X0 + SHOWER_X1) / 2;
  const showerCZ = (SHOWER_Z0 + SHOWER_Z1) / 2;
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 0.3,
  });
  const base = new THREE.Mesh(new THREE.BoxGeometry(SHOWER_W, BASE_H, SHOWER_D), baseMat);
  base.position.set(showerCX, BASE_H / 2, showerCZ);
  base.castShadow = true;
  base.receiveShadow = true;
  scene.add(base);

  // Vitrage douche au niveau du mur sud (Z=600)
  const glassBaseY = BASE_H;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(SHOWER_W, GLASS_H), glassMat);
  glass.position.set(showerCX, glassBaseY + GLASS_H / 2, SHOWER_Z0);
  scene.add(glass);

  // Cadre haut du vitrage douche
  const showerTopBar = new THREE.Mesh(new THREE.BoxGeometry(SHOWER_W, 3, 1.5), frameMat);
  showerTopBar.position.set(showerCX, glassBaseY + GLASS_H, SHOWER_Z0);
  scene.add(showerTopBar);

  // =============================================
  // WC — délégué à js/wc.js
  buildWC(scene);

  // ── Ensemble vasque → délégué à vasque.js ──
  buildVasque(scene);

  // =============================================
  // 2 meubles blancs dans les coins du mur SDB Nord
  // METOD Structure élément mural, blanc, 40x37x60 cm
  // =============================================
  const CBN_W = 40,
    CBN_BODY_D = 37,
    CBN_DOOR_D = 2,
    CBN_H = 60;
  const CBN_BODY_Z = KITCHEN_Z + 11 + CBN_BODY_D / 2;
  const CBN_DOOR_Z = KITCHEN_Z + 11 + CBN_BODY_D + CBN_DOOR_D / 2;

  const cbnMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
  const cbnDoorMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.2 });
  const cbnHandleMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.5, roughness: 0.3 });

  const cbnGroup = new THREE.Group();
  cbnGroup.userData.inventoryId = 'bathroom-cabinets';
  cbnGroup.userData.layerOverride = LAYER_FURNITURE;

  // Corps meuble ouest
  const cbnW = new THREE.Mesh(new THREE.BoxGeometry(CBN_W, CBN_H, CBN_BODY_D), cbnMat);
  cbnW.position.set(-NICHE_DEPTH + CBN_W / 2, CBN_H / 2, CBN_BODY_Z);
  cbnW.castShadow = true;
  cbnW.receiveShadow = true;
  cbnGroup.add(cbnW);
  // Porte meuble ouest
  const doorW = new THREE.Mesh(new THREE.BoxGeometry(CBN_W - 2, CBN_H - 2, CBN_DOOR_D), cbnDoorMat);
  doorW.position.set(-NICHE_DEPTH + CBN_W / 2, CBN_H / 2, CBN_DOOR_Z);
  doorW.castShadow = true;
  cbnGroup.add(doorW);
  // Poignée meuble ouest (côté droit)
  const handleW = new THREE.Mesh(new THREE.BoxGeometry(2, 12, 1.5), cbnHandleMat);
  handleW.position.set(-NICHE_DEPTH + CBN_W - 6, CBN_H * 0.6, CBN_DOOR_Z + CBN_DOOR_D / 2 + 0.75);
  cbnGroup.add(handleW);

  // Corps meuble est
  const cbnE = new THREE.Mesh(new THREE.BoxGeometry(CBN_W, CBN_H, CBN_BODY_D), cbnMat);
  cbnE.position.set(DOOR_START - CBN_W / 2 - 8, CBN_H / 2, CBN_BODY_Z);
  cbnE.castShadow = true;
  cbnE.receiveShadow = true;
  cbnGroup.add(cbnE);
  // Porte meuble est
  const doorE = new THREE.Mesh(new THREE.BoxGeometry(CBN_W - 2, CBN_H - 2, CBN_DOOR_D), cbnDoorMat);
  doorE.position.set(DOOR_START - CBN_W / 2 - 8, CBN_H / 2, CBN_DOOR_Z);
  doorE.castShadow = true;
  cbnGroup.add(doorE);
  // Poignée meuble est (côté gauche)
  const handleE = new THREE.Mesh(new THREE.BoxGeometry(2, 12, 1.5), cbnHandleMat);
  handleE.position.set(DOOR_START - CBN_W - 8 + 6, CBN_H * 0.6, CBN_DOOR_Z + CBN_DOOR_D / 2 + 0.75);
  cbnGroup.add(handleE);
  scene.add(cbnGroup);

  // =============================================
  // Ballon d'eau chaude 100L vertical
  // =============================================
  const HW_R = 28;  // rayon = 56cm de diamètre
  const HW_H = 65;  // hauteur cylindre
  const HW_X = -NICHE_DEPTH + HW_R;
  const HW_Y = WALL_H - 10 - HW_H / 2;
  const HW_Z = KITCHEN_Z + 10 + HW_R;

  const hwMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    roughness: 0.3,
  });

  const hwGroup = new THREE.Group();
  hwGroup.userData.inventoryId = 'water-heater';

  const hwBody = new THREE.Mesh(new THREE.CylinderGeometry(HW_R, HW_R, HW_H, 16), hwMat);
  hwBody.position.set(HW_X, HW_Y, HW_Z);
  hwBody.castShadow = true;
  hwBody.receiveShadow = true;
  hwGroup.add(hwBody);

  const capMat = new THREE.MeshStandardMaterial({
    color: 0xd0d0d0,
    roughness: 0.4,
  });
  const capGeo = new THREE.CylinderGeometry(HW_R + 0.5, HW_R + 0.5, 2, 16);
  const capTop = new THREE.Mesh(capGeo, capMat);
  capTop.position.set(HW_X, HW_Y + HW_H / 2 + 1, HW_Z);
  hwGroup.add(capTop);
  const capBot = new THREE.Mesh(capGeo, capMat);
  capBot.position.set(HW_X, HW_Y - HW_H / 2 - 1, HW_Z);
  hwGroup.add(capBot);

  const bracketMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.6,
    roughness: 0.3,
  });
  for (const dy of [-20, 20]) {
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(HW_R + 5, 4, 5), bracketMat);
    bracket.position.set(-NICHE_DEPTH + (HW_R + 5) / 2, HW_Y + dy, HW_Z);
    hwGroup.add(bracket);
  }
  scene.add(hwGroup);

  // Extension mur SDB ouest vers le sud (Z=670 → DIAG_END_Z)
  const WEST_EXT = (Math.floor((DIAG_END_Z - SHOWER_Z1) / 10) + 1) * 10;
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(WEST_EXT, layer % 2 === 1))
      addBrickZ(-NICHE_DEPTH - 5, layer, SHOWER_Z1 + b.start, b.size, "wall");
  }

  // =============================================
  // Sol SDB (X=-10→180, Z=470→600, sans recouvrir MCo-O)
  // =============================================
  // Sol principal (X=-10→180, sans passer sous les murs)
  for (let z = KITCHEN_Z + 10; z < SDB_Z; z += 10) {
    for (const b of fillRow(SDB_W - 10, (z / 10) % 2 === 1)) {
      addFloorBrick(-NICHE_DEPTH + b.start, z, b.size);
    }
  }
  // Seuil porte P2 (X=180→190, uniquement sous l'ouverture Z=CORR_DOOR_S→CORR_DOOR_E)
  for (let z = CORR_DOOR_S; z < CORR_DOOR_E; z += 10) {
    addFloorBrick(DOOR_START - 10, z, 10);
  }
}
