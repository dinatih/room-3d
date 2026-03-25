import * as THREE from 'three';
import {
  KITCHEN_X0, KITCHEN_X1, KITCHEN_DEPTH, ROOM_D,
} from '../config.js';

let fridgeDoorGroup = null;
let fridgeDoorOpen = false;
let cabinetDoorGroup = null;
let cabinetDoorOpen = false;

export function toggleFridgeDoor() {
  fridgeDoorOpen = !fridgeDoorOpen;
  if (fridgeDoorGroup) fridgeDoorGroup.rotation.y = fridgeDoorOpen ? Math.PI / 2 : 0;
  return fridgeDoorOpen;
}

export function toggleCabinetDoor() {
  cabinetDoorOpen = !cabinetDoorOpen;
  if (cabinetDoorGroup) cabinetDoorGroup.rotation.y = cabinetDoorOpen ? Math.PI / 2 : 0;
  return cabinetDoorOpen;
}

export const kitchenGroup = new THREE.Group();
kitchenGroup.userData.inventoryId = 'cuisine-stack';

export function buildKitchen(scene) {
  scene.add(kitchenGroup);
  const COUNTER_H = 90;
  const COUNTER_SLAB = 3;
  const KIT_W = KITCHEN_X1 - KITCHEN_X0;
  const KIT_D = KITCHEN_DEPTH;
  const FRIDGE_W = 60;
  const CABINET_W = 40;
  const DOOR_T = 1.5;
  const T = 1.5; // panel thickness

  const handleMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.5, roughness: 0.2 });

  // -------------------------------------------------------
  // MEUBLE SOUS ÉVIER (placard blanc avec porte articulée)
  // -------------------------------------------------------
  {
    const cabinetGroup = new THREE.Group();
    cabinetGroup.userData.inventoryId = 'cabinet-wood';
    cabinetGroup.userData.hoverAction = { label: 'Meuble évier', actionId: 'cabinet-toggle' };
    const cabinetH = COUNTER_H;
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
    const insideMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.5 });

    // Groupe centré à la base du meuble
    cabinetGroup.position.set(KITCHEN_X0 + CABINET_W / 2, 0, ROOM_D + KIT_D / 2);

    function addCabP(sx, sy, sz, x, y, z, mat = whiteMat) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      cabinetGroup.add(m);
    }

    const innerH = cabinetH - T * 2;

    // Dos (+Z, plaqué contre mur cuisine)
    addCabP(CABINET_W, cabinetH, T,          0, cabinetH / 2,  KIT_D / 2 - T / 2);
    // Dessus supprimé — bloquait le trou de l'évier
    // Dessous
    addCabP(CABINET_W, T, KIT_D,             0, T / 2, 0);
    // Côté gauche (-X)
    addCabP(T, innerH, KIT_D - T,           -CABINET_W / 2 + T / 2, cabinetH / 2, -T / 2);
    // Côté droit (+X, côté frigo)
    addCabP(T, innerH, KIT_D - T,            CABINET_W / 2 - T / 2, cabinetH / 2, -T / 2);
    // Fond intérieur (visible quand porte ouverte)
    addCabP(CABINET_W - T * 2, innerH, 0.5,  0, cabinetH / 2, KIT_D / 2 - T - 0.3, insideMat);

    // Séparation tuyaux (tablette basse)
    addCabP(CABINET_W - T * 2 - 2, T, KIT_D - T * 2,  0, cabinetH * 0.3, -T / 2, insideMat);

    // --- Porte articulée (charnière côté gauche -X, ouverture vers -Z) ---
    cabinetDoorGroup = new THREE.Group();
    cabinetDoorGroup.position.set(-CABINET_W / 2, 0, -KIT_D / 2);

    const CAB_DT = 1.5;
    const cabDoor = new THREE.Mesh(
      new THREE.BoxGeometry(CABINET_W - 2, cabinetH - 2, CAB_DT),
      whiteMat,
    );
    cabDoor.position.set(CABINET_W / 2, cabinetH / 2, CAB_DT / 2);
    cabDoor.castShadow = true;
    cabinetDoorGroup.add(cabDoor);

    // Poignée sur face extérieure, côté libre (+X)
    const cabHandle = new THREE.Mesh(new THREE.BoxGeometry(1.5, 15, 2), handleMat);
    cabHandle.position.set(CABINET_W - 8, cabinetH / 2, -1.5);
    cabinetDoorGroup.add(cabHandle);

    cabinetGroup.add(cabinetDoorGroup);
    kitchenGroup.add(cabinetGroup);
  }

  // -------------------------------------------------------
  // RÉFRIGÉRATEUR (blanc, porte articulée)
  // -------------------------------------------------------
  {
    const fridgeGroup = new THREE.Group();
    fridgeGroup.userData.inventoryId = 'fridge';
    fridgeGroup.userData.hoverAction = { label: 'Réfrigérateur', actionId: 'fridge-toggle' };
    const frigoH = COUNTER_H;
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.2, metalness: 0.05 });
    const insideMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.5 });

    // Groupe centré à la base
    fridgeGroup.position.set(KITCHEN_X0 + CABINET_W + FRIDGE_W / 2, 0, ROOM_D + KIT_D / 2);

    function addFridgeP(sx, sy, sz, x, y, z, mat = whiteMat) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      fridgeGroup.add(m);
    }

    const innerH = frigoH - T * 2;

    // Dos (+Z)
    addFridgeP(FRIDGE_W, frigoH, T,           0, frigoH / 2,  KIT_D / 2 - T / 2);
    // Dessus
    addFridgeP(FRIDGE_W, T, KIT_D,            0, frigoH - T / 2, 0);
    // Dessous
    addFridgeP(FRIDGE_W, T, KIT_D,            0, T / 2, 0);
    // Côté gauche (-X, côté placard)
    addFridgeP(T, innerH, KIT_D - T,         -FRIDGE_W / 2 + T / 2, frigoH / 2, -T / 2);
    // Côté droit (+X)
    addFridgeP(T, innerH, KIT_D - T,          FRIDGE_W / 2 - T / 2, frigoH / 2, -T / 2);

    // Fond intérieur
    addFridgeP(FRIDGE_W - T * 2, innerH, 0.5,  0, frigoH / 2, KIT_D / 2 - T - 0.3, insideMat);
    // 2 étagères intérieures
    addFridgeP(FRIDGE_W - T * 2 - 2, T, KIT_D - T * 2,  0, frigoH * 0.35, -T / 2, insideMat);
    addFridgeP(FRIDGE_W - T * 2 - 2, T, KIT_D - T * 2,  0, frigoH * 0.62, -T / 2, insideMat);

    // Bac à légumes (bas)
    addFridgeP(FRIDGE_W - T * 2 - 4, 10, KIT_D - T * 2 - 4,  0, T + 5, -T / 2, insideMat);

    // --- Porte articulée (charnière côté gauche -X, ouverture vers -Z) ---
    const FDT = 8; // épaisseur porte frigo (réaliste avec rangements)
    fridgeDoorGroup = new THREE.Group();
    fridgeDoorGroup.position.set(-FRIDGE_W / 2, 0, -KIT_D / 2);

    const shelfMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.4, transparent: true, opacity: 0.85 });

    // Panneau principal de la porte
    const fridgeDoor = new THREE.Mesh(
      new THREE.BoxGeometry(FRIDGE_W - 2, frigoH - 2, FDT),
      whiteMat,
    );
    fridgeDoor.position.set(FRIDGE_W / 2, frigoH / 2, FDT / 2);
    fridgeDoor.castShadow = true;
    fridgeDoorGroup.add(fridgeDoor);

    // Poignée sur face extérieure (z=0), côté libre (+X)
    const fridgeHandle = new THREE.Mesh(new THREE.BoxGeometry(1.5, 30, 2.5), handleMat);
    fridgeHandle.position.set(FRIDGE_W - 10, frigoH * 0.6, -1.5);
    fridgeDoorGroup.add(fridgeHandle);

    // --- Rangements porte (balconnet bouteilles) ---
    const SHELF_D  = 10;   // profondeur du balconnet (vers l'intérieur du frigo)
    const SHELF_T  = 1.2;  // épaisseur tablette
    const GUARD_H  = 6;    // hauteur du garde-fou

    // Tablette basse (pour grande bouteille, Y=5..6)
    const shelfBase = new THREE.Mesh(
      new THREE.BoxGeometry(FRIDGE_W - 8, SHELF_T, SHELF_D),
      shelfMat,
    );
    shelfBase.position.set(FRIDGE_W / 2, 5 + SHELF_T / 2, FDT + SHELF_D / 2);
    fridgeDoorGroup.add(shelfBase);

    // Garde-fou avant de la tablette basse
    const guard = new THREE.Mesh(
      new THREE.BoxGeometry(FRIDGE_W - 8, GUARD_H, 1.2),
      shelfMat,
    );
    guard.position.set(FRIDGE_W / 2, 5 + SHELF_T + GUARD_H / 2, FDT + 0.6);
    fridgeDoorGroup.add(guard);

    // Tablette haute (petits pots, Y≈55)
    const shelfTop = new THREE.Mesh(
      new THREE.BoxGeometry(FRIDGE_W - 8, SHELF_T, SHELF_D),
      shelfMat,
    );
    shelfTop.position.set(FRIDGE_W / 2, 56 + SHELF_T / 2, FDT + SHELF_D / 2);
    fridgeDoorGroup.add(shelfTop);
    const guardTop = new THREE.Mesh(
      new THREE.BoxGeometry(FRIDGE_W - 8, 4, 1.2),
      shelfMat,
    );
    guardTop.position.set(FRIDGE_W / 2, 56 + SHELF_T + 2, FDT + 0.6);
    fridgeDoorGroup.add(guardTop);

    // --- Bouteille de jus d'orange 50cm ---
    const ojMat    = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.3, transparent: true, opacity: 0.88 });
    const ojCapMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.4 });
    const ojLblMat = new THREE.MeshStandardMaterial({ color: 0xff8c00, roughness: 0.3 });

    const ojBottleY = 5 + SHELF_T + 1; // base de la bouteille sur la tablette

    // Corps de la bouteille (44cm)
    const ojBody = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.5, 44, 20), ojMat);
    ojBody.position.set(FRIDGE_W / 2, ojBottleY + 22, FDT + 5);
    fridgeDoorGroup.add(ojBody);

    // Goulot (6cm)
    const ojNeck = new THREE.Mesh(new THREE.CylinderGeometry(2, 3.5, 4, 16), ojMat);
    ojNeck.position.set(FRIDGE_W / 2, ojBottleY + 44 + 2, FDT + 5);
    fridgeDoorGroup.add(ojNeck);

    // Bouchon (2cm)
    const ojCap = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 2, 16), ojCapMat);
    ojCap.position.set(FRIDGE_W / 2, ojBottleY + 44 + 4 + 1, FDT + 5);
    fridgeDoorGroup.add(ojCap);

    // Étiquette (cylindre légèrement plus large, 20cm de haut, centré sur le corps)
    const ojLabel = new THREE.Mesh(new THREE.CylinderGeometry(4.51, 4.51, 20, 20), ojLblMat);
    ojLabel.position.set(FRIDGE_W / 2, ojBottleY + 22, FDT + 5);
    fridgeDoorGroup.add(ojLabel);

    fridgeGroup.add(fridgeDoorGroup);
    kitchenGroup.add(fridgeGroup);
  }

  // -------------------------------------------------------
  // ÉVIER BOHOLMEN intégré 1 bac
  // -------------------------------------------------------
  const sinkW    = 30;
  const sinkD    = 47;
  const holeW    = 28;
  const holeD    = 44.6;
  const basinW   = 23;
  const basinD   = 40;
  const sinkDepth = 15;
  const CR       = 5;

  const sinkCX = KITCHEN_X0 + CABINET_W / 2;
  const sinkCZ = ROOM_D + KIT_D / 2;
  const sinkY  = COUNTER_H + COUNTER_SLAB;

  function roundedRect(path, x, y, w, h, r) {
    path.moveTo(x + r, y);
    path.lineTo(x + w - r, y);
    path.quadraticCurveTo(x + w, y, x + w, y + r);
    path.lineTo(x + w, y + h - r);
    path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    path.lineTo(x + r, y + h);
    path.quadraticCurveTo(x, y + h, x, y + h - r);
    path.lineTo(x, y + r);
    path.quadraticCurveTo(x, y, x + r, y);
  }

  // Plan de travail avec trou évier
  {
    const cW = KIT_W + 2;
    const cD = KIT_D + 2;
    const cx0 = KITCHEN_X0 + KIT_W / 2 - cW / 2;
    const cz0 = ROOM_D + KIT_D / 2 - cD / 2;

    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(cW, 0);
    shape.lineTo(cW, cD);
    shape.lineTo(0, cD);
    shape.lineTo(0, 0);

    const hX = sinkCX - cx0 - holeW / 2;
    const hZ = sinkCZ - cz0 - holeD / 2;
    const hole = new THREE.Path();
    hole.moveTo(hX, hZ);
    hole.lineTo(hX + holeW, hZ);
    hole.lineTo(hX + holeW, hZ + holeD);
    hole.lineTo(hX, hZ + holeD);
    hole.lineTo(hX, hZ);
    shape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(shape, { depth: COUNTER_SLAB, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.05 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.inventoryId = 'counter';
    mesh.position.set(cx0, COUNTER_H, cz0 + cD);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    kitchenGroup.add(mesh);
  }

  // Bac BOHOLMEN
  {
    const sinkGroup = new THREE.Group();
    sinkGroup.userData.inventoryId = 'sink-boholmen';
    const inoxMat = new THREE.MeshStandardMaterial({
      color: 0xc8c8c8, metalness: 0.75, roughness: 0.12,
    });

    const add = (geo, x, y, z, mat = inoxMat) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      sinkGroup.add(m);
    };

    const rimT  = 1.2;
    const rimZW = (sinkD - holeD) / 2;
    const rimXW = (sinkW - holeW) / 2;
    const rimY2 = sinkY + rimT / 2;

    for (const [w, d, cx, cz] of [
      [sinkW,  rimZW, sinkCX,              sinkCZ - holeD / 2 - rimZW / 2],
      [sinkW,  rimZW, sinkCX,              sinkCZ + holeD / 2 + rimZW / 2],
      [rimXW,  holeD, sinkCX - holeW / 2 - rimXW / 2, sinkCZ],
      [rimXW,  holeD, sinkCX + holeW / 2 + rimXW / 2, sinkCZ],
    ]) add(new THREE.BoxGeometry(w, rimT, d), cx, rimY2, cz);

    const wallT = (holeW - basinW) / 2;
    const wallD = (holeD - basinD) / 2;
    for (const s of [
      { sx: holeW, sy: sinkDepth, sz: wallT, px: 0,                     pz: -(basinD + wallD) / 2 },
      { sx: holeW, sy: sinkDepth, sz: wallT, px: 0,                     pz:  (basinD + wallD) / 2 },
      { sx: wallT, sy: sinkDepth, sz: holeD, px: -(basinW + wallT) / 2, pz: 0 },
      { sx: wallT, sy: sinkDepth, sz: holeD, px:  (basinW + wallT) / 2, pz: 0 },
    ]) add(new THREE.BoxGeometry(s.sx, s.sy, s.sz), sinkCX + s.px, sinkY - sinkDepth / 2, sinkCZ + s.pz);

    add(new THREE.BoxGeometry(basinW, 0.5, basinD), sinkCX, sinkY - sinkDepth + 0.25, sinkCZ);
    add(new THREE.CylinderGeometry(2.5, 2.5, 0.8, 16), sinkCX, sinkY - sinkDepth + 0.7, sinkCZ);

    const faucetMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.1 });
    add(new THREE.CylinderGeometry(1, 1, 20, 8), sinkCX, sinkY + 10, sinkCZ + sinkD / 2 - 3, faucetMat);
    const fBec = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 12, 8), faucetMat);
    fBec.rotation.x = Math.PI / 2;
    fBec.position.set(sinkCX, sinkY + 19, sinkCZ + sinkD / 2 - 9);
    sinkGroup.add(fBec);

    kitchenGroup.add(sinkGroup);
  }

  // -------------------------------------------------------
  // MEUBLE HAUT (ouvert, sans porte ni fond)
  // -------------------------------------------------------
  {
    const upperGroup = new THREE.Group();
    upperGroup.userData.inventoryId = 'meuble-haut-cuisine';

    const HC_W = KIT_W;
    const HC_H = 40;
    const HC_D = 40;
    const HC_PANEL = 1.5;
    const HC_Y0 = COUNTER_H + COUNTER_SLAB + 60;
    const HC_CX = KITCHEN_X0 + KIT_W / 2;
    const HC_CZ = ROOM_D + KITCHEN_DEPTH - HC_D / 2;

    const hcMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.35 });

    const add = (geo, x, y, z) => {
      const m = new THREE.Mesh(geo, hcMat);
      m.position.set(x, y, z);
      m.castShadow = true;
      upperGroup.add(m);
    };

    const topGeo = new THREE.BoxGeometry(HC_W, HC_PANEL, HC_D);
    const sideGeo = new THREE.BoxGeometry(HC_PANEL, HC_H, HC_D);
    add(topGeo,  HC_CX, HC_Y0 + HC_H - HC_PANEL / 2, HC_CZ); // dessus
    add(topGeo,  HC_CX, HC_Y0 + HC_PANEL / 2,         HC_CZ); // dessous
    add(sideGeo, HC_CX - HC_W / 2 + HC_PANEL / 2, HC_Y0 + HC_H / 2, HC_CZ); // gauche
    add(sideGeo, HC_CX + HC_W / 2 - HC_PANEL / 2, HC_Y0 + HC_H / 2, HC_CZ); // droite
    add(topGeo,  HC_CX, HC_Y0 + HC_H / 2, HC_CZ); // étagère milieu

    kitchenGroup.add(upperGroup);
  }

  // -------------------------------------------------------
  // PLAQUES À INDUCTION (verre plat, sans brûleurs)
  // -------------------------------------------------------
  {
    const stoveGroup = new THREE.Group();
    stoveGroup.userData.inventoryId = 'stove';

    const plateY  = COUNTER_H + COUNTER_SLAB;
    const plateCX = KITCHEN_X0 + CABINET_W + FRIDGE_W / 2;
    const plateCZ = ROOM_D + KIT_D / 2;

    const glassMat   = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.08, metalness: 0.3 });
    const zoneMat    = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.05, metalness: 0.2 });
    const ringMat    = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.1,  metalness: 0.1 });
    const controlMat = new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.3,  metalness: 0.1 });

    const add = (geo, x, y, z, mat = glassMat) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      stoveGroup.add(m);
    };

    const baseW = FRIDGE_W - 8;
    const baseD = KIT_D - 12;
    const base = new THREE.Mesh(new THREE.BoxGeometry(baseW, 1, baseD), glassMat);
    base.position.set(plateCX, plateY + 0.5, plateCZ);
    base.castShadow = true;
    stoveGroup.add(base);

    for (let i = 0; i < 2; i++) {
      const cz = plateCZ + (i === 0 ? -12 : 12);
      add(new THREE.CylinderGeometry(9, 9, 0.15, 40), plateCX, plateY + 1.1, cz, zoneMat);
      const ring = new THREE.Mesh(new THREE.RingGeometry(7.5, 9, 40), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(plateCX, plateY + 1.2, cz);
      stoveGroup.add(ring);
      add(new THREE.CylinderGeometry(1.5, 1.5, 0.05, 16), plateCX, plateY + 1.2, cz, ringMat);
    }

    add(new THREE.BoxGeometry(baseW - 10, 0.5, 6), plateCX, plateY + 1.1, plateCZ - baseD / 2 + 4);
    for (let i = 0; i < 4; i++) {
      add(new THREE.CylinderGeometry(0.6, 0.6, 0.3, 8), plateCX - 10 + i * 7, plateY + 1.35, plateCZ - baseD / 2 + 4, controlMat);
    }

    kitchenGroup.add(stoveGroup);
  }
}
