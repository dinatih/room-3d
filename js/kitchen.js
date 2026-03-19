import * as THREE from 'three';
import {
  KITCHEN_X0, KITCHEN_X1, KITCHEN_DEPTH, ROOM_D, GAP,
} from './config.js';

export function buildKitchen(scene) {
  const COUNTER_H = 90;
  const COUNTER_SLAB = 3;
  const KIT_W = KITCHEN_X1 - KITCHEN_X0;
  const KIT_D = KITCHEN_DEPTH;
  const FRIDGE_W = 60;
  const CABINET_W = 40;

  // --- Placard (bois) ---
  {
    const cabinetGroup = new THREE.Group();
    cabinetGroup.userData.inventoryId = 'cabinet-wood';
    const cabinetH = COUNTER_H;
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
    const geo = new THREE.BoxGeometry(CABINET_W - GAP, cabinetH, KIT_D - GAP);
    // Material array : +X, -X, +Y(top→invisible), -Y, +Z, -Z
    const mesh = new THREE.Mesh(geo, [
      woodMat,
      woodMat,
      new THREE.MeshStandardMaterial({ visible: false }),
      woodMat,
      woodMat,
      woodMat,
    ]);
    mesh.position.set(
      KITCHEN_X0 + CABINET_W / 2,
      cabinetH / 2,
      ROOM_D + KIT_D / 2
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    cabinetGroup.add(mesh);

    // Porte du placard
    const doorGeo = new THREE.BoxGeometry(CABINET_W - 4, cabinetH - 4, 0.5);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x607d8b, roughness: 0.4 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(
      KITCHEN_X0 + CABINET_W / 2,
      cabinetH / 2,
      ROOM_D + 0.5
    );
    cabinetGroup.add(door);

    // Poignée placard
    const hGeo = new THREE.BoxGeometry(1.5, 15, 2);
    const hMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5, roughness: 0.2 });
    const h = new THREE.Mesh(hGeo, hMat);
    h.position.set(
      KITCHEN_X0 + CABINET_W - 8,
      cabinetH * 0.5,
      ROOM_D + 1.5
    );
    cabinetGroup.add(h);
    scene.add(cabinetGroup);
  }

  // --- Frigo (blanc) ---
  {
    const fridgeGroup = new THREE.Group();
    fridgeGroup.userData.inventoryId = 'fridge';
    const frigoH = COUNTER_H;
    const geo = new THREE.BoxGeometry(FRIDGE_W - GAP, frigoH, KIT_D - GAP);
    const mat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3, metalness: 0.1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      KITCHEN_X0 + CABINET_W + FRIDGE_W / 2,
      frigoH / 2,
      ROOM_D + KIT_D / 2
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    fridgeGroup.add(mesh);

    // Poignée frigo
    const handleGeo = new THREE.BoxGeometry(1.5, 30, 2);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5, roughness: 0.2 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(
      KITCHEN_X0 + CABINET_W + 8,
      frigoH * 0.6,
      ROOM_D + 1.5
    );
    fridgeGroup.add(handle);
    scene.add(fridgeGroup);
  }

  // --- BOHOLMEN intégré 1 bac – rotation 90° : longueur (47cm) le long de Z ---
  // https://www.ikea.com/fr/fr/p/boholmen-evier-integre-1-bac-acier-inoxydable-s99157501/
  const sinkW    = 30;   // le long de X (profondeur évier = largeur comptoir utilisée)
  const sinkD    = 47;   // le long de Z (longueur évier)
  const holeW    = 28;   // découpe comptoir le long de X
  const holeD    = 44.6; // découpe comptoir le long de Z
  const basinW   = 23;   // largeur intérieure bac (X)
  const basinD   = 40;   // profondeur intérieure bac (Z)
  const sinkDepth = 15;  // profondeur bac
  const CR       = 5;    // rayon coins arrondis

  const sinkCX = KITCHEN_X0 + CABINET_W / 2;
  const sinkCZ = ROOM_D + KIT_D / 2;
  const sinkY  = COUNTER_H + COUNTER_SLAB;

  // Helper arrondi (XY shape space)
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

  // --- Plan de travail avec trou rectangulaire pour l'évier ---
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

    // Trou rectangulaire simple (coordonnées shape : X=world X, Y=world Z)
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
    mesh.position.set(cx0, COUNTER_H, cz0 + cD);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  // --- Bac BOHOLMEN ---
  {
    const inoxMat = new THREE.MeshStandardMaterial({
      color: 0xc8c8c8, metalness: 0.75, roughness: 0.12,
    });

    // Rebord inox : 4 strips autour du trou (plus fiable qu'ExtrudeGeometry+hole)
    const rimT  = 1.2;                    // épaisseur rebord (hauteur)
    const rimZW = (sinkD - holeD) / 2;   // largeur avant/arrière ≈ 1.2cm
    const rimXW = (sinkW - holeW) / 2;   // largeur gauche/droite ≈ 1cm
    const rimY2 = sinkY + rimT / 2;

    for (const [w, d, cx, cz] of [
      [sinkW,  rimZW, sinkCX,              sinkCZ - holeD / 2 - rimZW / 2],
      [sinkW,  rimZW, sinkCX,              sinkCZ + holeD / 2 + rimZW / 2],
      [rimXW,  holeD, sinkCX - holeW / 2 - rimXW / 2, sinkCZ],
      [rimXW,  holeD, sinkCX + holeW / 2 + rimXW / 2, sinkCZ],
    ]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, rimT, d), inoxMat);
      m.position.set(cx, rimY2, cz);
      scene.add(m);
    }

    // 4 parois du bac (box simples, à l'intérieur du trou)
    const wallT = (holeW - basinW) / 2; // ~2.5cm
    const wallD = (holeD - basinD) / 2; // ~2.3cm
    const sides = [
      { sx: holeW,  sy: sinkDepth, sz: wallT, px: 0,                        pz: -(basinD + wallD) / 2 },
      { sx: holeW,  sy: sinkDepth, sz: wallT, px: 0,                        pz:  (basinD + wallD) / 2 },
      { sx: wallT,  sy: sinkDepth, sz: holeD, px: -(basinW + wallT) / 2,    pz: 0 },
      { sx: wallT,  sy: sinkDepth, sz: holeD, px:  (basinW + wallT) / 2,    pz: 0 },
    ];
    for (const s of sides) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(s.sx, s.sy, s.sz), inoxMat);
      mesh.position.set(sinkCX + s.px, sinkY - sinkDepth / 2, sinkCZ + s.pz);
      scene.add(mesh);
    }

    // Fond du bac
    const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(basinW, 0.5, basinD), inoxMat);
    floorMesh.position.set(sinkCX, sinkY - sinkDepth + 0.25, sinkCZ);
    scene.add(floorMesh);

    // Bonde centrale
    const drain = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.8, 16), inoxMat);
    drain.position.set(sinkCX, sinkY - sinkDepth + 0.7, sinkCZ);
    scene.add(drain);

    // Robinet
    const faucetMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.1 });
    const fTige = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 20, 8), faucetMat);
    fTige.position.set(sinkCX, sinkY + 10, sinkCZ + sinkD / 2 - 3);
    scene.add(fTige);
    const fBec = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 12, 8), faucetMat);
    fBec.rotation.x = Math.PI / 2;
    fBec.position.set(sinkCX, sinkY + 19, sinkCZ + sinkD / 2 - 9);
    scene.add(fBec);
  }

  // --- Meuble haut (ouvert, sans porte ni fond) ---
  {
    const HC_W = KIT_W;    // 100cm
    const HC_H = 40;       // 40cm
    const HC_D = 40;       // 40cm
    const HC_PANEL = 1.5;
    const HC_Y0 = COUNTER_H + COUNTER_SLAB + 60; // 60cm au-dessus du plan
    const HC_CX = KITCHEN_X0 + KIT_W / 2;
    const HC_CZ = ROOM_D + KITCHEN_DEPTH - HC_D / 2; // plaqué contre le mur fond

    const hcMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.35 });

    // Dessus
    const topGeo = new THREE.BoxGeometry(HC_W, HC_PANEL, HC_D);
    const top = new THREE.Mesh(topGeo, hcMat);
    top.position.set(HC_CX, HC_Y0 + HC_H - HC_PANEL / 2, HC_CZ);
    top.castShadow = true;
    scene.add(top);

    // Dessous
    const bot = new THREE.Mesh(topGeo, hcMat);
    bot.position.set(HC_CX, HC_Y0 + HC_PANEL / 2, HC_CZ);
    bot.castShadow = true;
    bot.receiveShadow = true;
    scene.add(bot);

    // Côté gauche
    const sideGeo = new THREE.BoxGeometry(HC_PANEL, HC_H, HC_D);
    const sideL = new THREE.Mesh(sideGeo, hcMat);
    sideL.position.set(HC_CX - HC_W / 2 + HC_PANEL / 2, HC_Y0 + HC_H / 2, HC_CZ);
    sideL.castShadow = true;
    scene.add(sideL);

    // Côté droit
    const sideR = new THREE.Mesh(sideGeo, hcMat);
    sideR.position.set(HC_CX + HC_W / 2 - HC_PANEL / 2, HC_Y0 + HC_H / 2, HC_CZ);
    sideR.castShadow = true;
    scene.add(sideR);

    // Étagère milieu
    const shelf = new THREE.Mesh(topGeo, hcMat);
    shelf.position.set(HC_CX, HC_Y0 + HC_H / 2, HC_CZ);
    scene.add(shelf);
  }

  // --- Double plaque de cuisson ---
  {
    const plateY = COUNTER_H + COUNTER_SLAB + 0.2;
    const plateCX = KITCHEN_X0 + CABINET_W + FRIDGE_W / 2;
    const plateCZ = ROOM_D + KIT_D / 2;
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2, metalness: 0.1 });
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.3, metalness: 0.2 });

    const baseGeo = new THREE.BoxGeometry(FRIDGE_W - 10, 1, KIT_D - 15);
    const base = new THREE.Mesh(baseGeo, plateMat);
    base.position.set(plateCX, plateY + 0.5, plateCZ);
    scene.add(base);

    const ringGeo = new THREE.TorusGeometry(9, 1.2, 8, 24);
    const diskGeo = new THREE.CircleGeometry(9, 24);
    const diskMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.15 });

    for (let i = 0; i < 2; i++) {
      const offsetZ = (i === 0) ? -12 : 12;
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(plateCX, plateY + 1.2, plateCZ + offsetZ);
      scene.add(ring);
      const disk = new THREE.Mesh(diskGeo, diskMat);
      disk.rotation.x = -Math.PI / 2;
      disk.position.set(plateCX, plateY + 1.1, plateCZ + offsetZ);
      scene.add(disk);
    }
  }
}
