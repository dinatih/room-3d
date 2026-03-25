import * as THREE from 'three';

let cbnWDoorGroup = null, cbnWDoorOpen = false;
let cbnEDoorGroup = null, cbnEDoorOpen = false;

let sdbClosetPanelL = null, sdbClosetPanelR = null, sdbClosetState = 0;
// États : 0=fermé, 1=panneaux à gauche (côté droit ouvert), 2=panneaux à droite (côté gauche ouvert)
const SDB_CL_X0 = 70, SDB_CL_X1 = 180, SDB_CL_PW = 55; // constantes de build

export function toggleSdbCloset() {
  sdbClosetState = (sdbClosetState + 1) % 3;
  const xL = sdbClosetState === 0 ? SDB_CL_X0 + SDB_CL_PW / 2
           : sdbClosetState === 1 ? SDB_CL_X0 + SDB_CL_PW / 2
           :                        SDB_CL_X1 - SDB_CL_PW / 2;
  const xR = sdbClosetState === 0 ? SDB_CL_X1 - SDB_CL_PW / 2
           : sdbClosetState === 1 ? SDB_CL_X0 + SDB_CL_PW / 2
           :                        SDB_CL_X1 - SDB_CL_PW / 2;
  if (sdbClosetPanelL) sdbClosetPanelL.position.x = xL;
  if (sdbClosetPanelR) sdbClosetPanelR.position.x = xR;
  return sdbClosetState;
}

export function getSdbClosetLabel() {
  return ['Ouvrir à gauche', 'Ouvrir à droite', 'Fermer'][sdbClosetState];
}

export function toggleCbnWestDoor() {
  cbnWDoorOpen = !cbnWDoorOpen;
  if (cbnWDoorGroup) cbnWDoorGroup.rotation.y = cbnWDoorOpen ? -Math.PI / 2 : 0;
  return cbnWDoorOpen;
}

export function toggleCbnEastDoor() {
  cbnEDoorOpen = !cbnEDoorOpen;
  if (cbnEDoorGroup) cbnEDoorGroup.rotation.y = cbnEDoorOpen ? Math.PI / 2 : 0;
  return cbnEDoorOpen;
}

import { buildVasque } from './vasque.js';
import { buildWC } from './wc.js';
import { makeGrassTex } from './floor.js';
import {
  ROOM_W,
  WALL_H,
  DOOR_START,
  NICHE_DEPTH,
  KITCHEN_Z,
  SDB_Z_END,
  DIAG_END_Z,
  LAYER_FURNITURE,
  LAYER_STRUCTURE,
  CORR_DOOR_S,
  CORR_DOOR_E,
} from '../config.js';

const W = 10; // wall thickness

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

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.9 });

  function panel(w, h, d, x, y, z, mat = wallMat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    m.userData.layerOverride = LAYER_STRUCTURE;
    scene.add(m); return m;
  }

  // =============================================
  // Mur salle de bain côté niche (parallèle au couloir), 1m40 = 140cm
  // =============================================
  const SDB_WALL_LEN = SDB_Z_END - KITCHEN_Z; // 140
  panel(W, WALL_H, SDB_WALL_LEN,
        -NICHE_DEPTH - W/2, WALL_H/2,
        (KITCHEN_Z + SDB_Z_END) / 2);

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
  // PLACARD PC-SDB — portes coulissantes + étagère triangulaire
  // =============================================
  {
    const SLIDE_X0 = SHOWER_X1 + 10; // 70
    const SLIDE_X1 = DOOR_START - 10; // 180
    const SLIDE_W = SLIDE_X1 - SLIDE_X0; // 110
    const SLIDE_CX = (SLIDE_X0 + SLIDE_X1) / 2;
    const SLIDE_Z = SDB_Z;
    const SLIDE_H = WALL_H;

    const sdbClosetGroup = new THREE.Group();
    sdbClosetGroup.userData.inventoryId = 'sdb-closet';
    sdbClosetGroup.userData.hoverAction = { label: 'Placard SDB', actionId: 'sdb-closet-toggle' };
    scene.add(sdbClosetGroup);

    const add = (mesh) => sdbClosetGroup.add(mesh);

    const doorMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e0, roughness: 0.5 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e0, roughness: 0.5 });

    const panelW = SLIDE_W / 2;
    const panelT = 2.3;
    const railD = 7;
    const sepT = 1;

    // Séparateur central
    const sepTop = new THREE.Mesh(new THREE.BoxGeometry(SLIDE_W + 4, 3, sepT), railMat);
    sepTop.position.set(SLIDE_CX, SLIDE_H - 1.5, SLIDE_Z);
    sepTop.userData.layerOverride = LAYER_STRUCTURE;
    add(sepTop);

    const sepBot = new THREE.Mesh(new THREE.BoxGeometry(SLIDE_W + 4, 1.5, sepT), railMat);
    sepBot.position.set(SLIDE_CX, 0.75, SLIDE_Z);
    sepBot.userData.layerOverride = LAYER_STRUCTURE;
    add(sepBot);

    // Porte gauche (côté SDB, Z-)
    sdbClosetPanelL = new THREE.Mesh(new THREE.BoxGeometry(panelW, SLIDE_H, panelT), doorMat);
    sdbClosetPanelL.position.set(SLIDE_X0 + panelW / 2, SLIDE_H / 2, SLIDE_Z - sepT / 2 - panelT / 2);
    sdbClosetPanelL.castShadow = true;
    sdbClosetPanelL.userData.layerOverride = LAYER_STRUCTURE;
    add(sdbClosetPanelL);

    // Porte droite (côté douche, Z+)
    sdbClosetPanelR = new THREE.Mesh(new THREE.BoxGeometry(panelW, SLIDE_H, panelT), doorMat);
    sdbClosetPanelR.position.set(SLIDE_X1 - panelW / 2, SLIDE_H / 2, SLIDE_Z + sepT / 2 + panelT / 2);
    sdbClosetPanelR.castShadow = true;
    sdbClosetPanelR.userData.layerOverride = LAYER_STRUCTURE;
    add(sdbClosetPanelR);

    // Rail haut
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(SLIDE_W + 4, 3, railD), railMat);
    topRail.position.set(SLIDE_CX, SLIDE_H - 1.5, SLIDE_Z);
    topRail.userData.layerOverride = LAYER_STRUCTURE;
    add(topRail);

    // Rail bas
    const botRail = new THREE.Mesh(new THREE.BoxGeometry(SLIDE_W + 4, 1.5, railD), railMat);
    botRail.position.set(SLIDE_CX, 0.75, SLIDE_Z);
    botRail.userData.layerOverride = LAYER_STRUCTURE;
    add(botRail);

    // Étagère triangulaire — 170cm du sol, 2cm épaisseur
    // Triangle : front-gauche (X=70,Z=600) → front-droit (X=180,Z=600) → arrière-gauche (X=70,Z=660)
    {
      const TRI_DEPTH = 60;
      const SHELF_Y = 170;
      const SHELF_T = 2;

      const shelfMat = new THREE.MeshStandardMaterial({ color: 0xf0f0e8, roughness: 0.4 });
      const shape = new THREE.Shape();
      shape.moveTo(SLIDE_X0, -SLIDE_Z);
      shape.lineTo(SLIDE_X1, -SLIDE_Z);
      shape.lineTo(SLIDE_X0, -(SLIDE_Z + TRI_DEPTH));
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, { depth: SHELF_T, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2);
      geo.translate(0, SHELF_Y, 0);

      const triShelf = new THREE.Mesh(geo, shelfMat);
      triShelf.castShadow = true;
      triShelf.receiveShadow = true;
      triShelf.userData.layerOverride = LAYER_FURNITURE;
      add(triShelf);
    }
  }

  // =============================================
  // DOUCHE (recess au-delà du mur sud)
  // =============================================
  const BASE_H = 20;
  const GLASS_H = 180;

  // Mur ouest douche (prolonge le mur SDB ouest de Z=600 à Z=670)
  panel(W, WALL_H, SHOWER_D, -NICHE_DEPTH - W/2, WALL_H/2, SHOWER_Z0 + SHOWER_D/2);

  // Mur est douche (X=60, de Z=600 à Z=670)
  panel(W, WALL_H, SHOWER_D, SHOWER_X1 + W/2, WALL_H/2, SHOWER_Z0 + SHOWER_D/2);

  // Mur fond douche (Z=670)
  panel(SHOWER_W, WALL_H, W, (SHOWER_X0 + SHOWER_X1) / 2, WALL_H/2, SHOWER_Z1 + W/2);

  // Cuve (base surélevée 20cm)
  const showerCX = (SHOWER_X0 + SHOWER_X1) / 2;
  const showerCZ = (SHOWER_Z0 + SHOWER_Z1) / 2;
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 0.3,
  });

  const showerGroup = new THREE.Group();
  showerGroup.userData.inventoryId = 'shower';
  scene.add(showerGroup);

  const base = new THREE.Mesh(new THREE.BoxGeometry(SHOWER_W, BASE_H, SHOWER_D), baseMat);
  base.position.set(showerCX, BASE_H / 2, showerCZ);
  base.castShadow = true;
  base.receiveShadow = true;
  showerGroup.add(base);

  // Vitrage douche au niveau du mur sud (Z=600)
  const glassBaseY = BASE_H;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(SHOWER_W, GLASS_H), glassMat);
  glass.position.set(showerCX, glassBaseY + GLASS_H / 2, SHOWER_Z0);
  showerGroup.add(glass);

  // Cadre haut du vitrage douche
  const showerTopBar = new THREE.Mesh(new THREE.BoxGeometry(SHOWER_W, 3, 1.5), frameMat);
  showerTopBar.position.set(showerCX, glassBaseY + GLASS_H, SHOWER_Z0);
  showerGroup.add(showerTopBar);

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

  // Meuble mural ouest
  const cbnWGroup = new THREE.Group();
  cbnWGroup.userData.inventoryId = 'bathroom-cabinet-west';
  cbnWGroup.userData.hoverAction = { label: 'Meuble SDB ouest', actionId: 'cbn-west-toggle' };
  cbnWGroup.userData.layerOverride = LAYER_FURNITURE;

  const cbnW = new THREE.Mesh(new THREE.BoxGeometry(CBN_W, CBN_H, CBN_BODY_D), cbnMat);
  cbnW.position.set(-NICHE_DEPTH + CBN_W / 2, CBN_H / 2, CBN_BODY_Z);
  cbnW.castShadow = true;
  cbnW.receiveShadow = true;
  cbnWGroup.add(cbnW);

  // Porte ouest — charnière gauche (x = -NICHE_DEPTH)
  cbnWDoorGroup = new THREE.Group();
  cbnWDoorGroup.position.set(-NICHE_DEPTH, 0, CBN_DOOR_Z);
  const doorW = new THREE.Mesh(new THREE.BoxGeometry(CBN_W - 2, CBN_H - 2, CBN_DOOR_D), cbnDoorMat);
  doorW.position.set(CBN_W / 2, CBN_H / 2, 0);
  doorW.castShadow = true;
  cbnWDoorGroup.add(doorW);
  const handleW = new THREE.Mesh(new THREE.BoxGeometry(2, 12, 1.5), cbnHandleMat);
  handleW.position.set(CBN_W - 6, CBN_H * 0.6, CBN_DOOR_D / 2 + 0.75);
  cbnWDoorGroup.add(handleW);
  cbnWGroup.add(cbnWDoorGroup);
  scene.add(cbnWGroup);

  // Meuble mural est
  const cbnEGroup = new THREE.Group();
  cbnEGroup.userData.inventoryId = 'bathroom-cabinet-east';
  cbnEGroup.userData.hoverAction = { label: 'Meuble SDB est', actionId: 'cbn-east-toggle' };
  cbnEGroup.userData.layerOverride = LAYER_FURNITURE;

  const cbnE = new THREE.Mesh(new THREE.BoxGeometry(CBN_W, CBN_H, CBN_BODY_D), cbnMat);
  cbnE.position.set(DOOR_START - CBN_W / 2 - 8, CBN_H / 2, CBN_BODY_Z);
  cbnE.castShadow = true;
  cbnE.receiveShadow = true;
  cbnEGroup.add(cbnE);

  // Porte est — charnière droite (x = DOOR_START - 8)
  cbnEDoorGroup = new THREE.Group();
  cbnEDoorGroup.position.set(DOOR_START - 8, 0, CBN_DOOR_Z);
  const doorE = new THREE.Mesh(new THREE.BoxGeometry(CBN_W - 2, CBN_H - 2, CBN_DOOR_D), cbnDoorMat);
  doorE.position.set(-CBN_W / 2, CBN_H / 2, 0);
  doorE.castShadow = true;
  cbnEDoorGroup.add(doorE);
  const handleE = new THREE.Mesh(new THREE.BoxGeometry(2, 12, 1.5), cbnHandleMat);
  handleE.position.set(-CBN_W + 6, CBN_H * 0.6, CBN_DOOR_D / 2 + 0.75);
  cbnEDoorGroup.add(handleE);
  cbnEGroup.add(cbnEDoorGroup);
  scene.add(cbnEGroup);

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
  const WEST_EXT = DIAG_END_Z - SHOWER_Z1;
  panel(W, WALL_H, WEST_EXT, -NICHE_DEPTH - W/2, WALL_H/2, (SHOWER_Z1 + DIAG_END_Z) / 2);

  // ── Tapis de pelouse synthétique 1×2m ────────────────────────────────────
  // 200cm le long de X (largeur SDB), 100cm le long de Z, centré dans la pièce
  {
    const RUG_W = 200, RUG_D = 100, RUG_H = 1.5;
    const rugCX = (- NICHE_DEPTH + DOOR_START) / 2; // ≈ 90
    const rugCZ = SDB_Z_END - RUG_D / 2 - 3;       // calé contre le mur douche/placard

    const grassTex = makeGrassTex();
    grassTex.repeat.set(10, 5); // tuiles ~20×20cm sur 200×100cm

    const topMat  = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.85 });
    const sideMat = new THREE.MeshStandardMaterial({ color: 0x2d6e30, roughness: 0.9 });
    // BoxGeometry face order: [+X, -X, +Y(top), -Y(bot), +Z, -Z]
    const rugMats = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];

    const rug = new THREE.Mesh(new THREE.BoxGeometry(RUG_W, RUG_H, RUG_D), rugMats);
    rug.position.set(rugCX, RUG_H / 2, rugCZ);
    rug.receiveShadow = true;
    rug.userData.inventoryId = 'sdb-grass-rug';
    rug.userData.layerOverride = LAYER_FURNITURE;
    scene.add(rug);
  }
}
