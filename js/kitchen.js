import * as THREE from 'three';
import {
  KITCHEN_X0, KITCHEN_X1, KITCHEN_DEPTH, ROOM_D, GAP,
} from './config.js';

export function buildKitchen(scene) {
  const COUNTER_H = 9;
  const COUNTER_SLAB = 0.5;
  const KIT_W = KITCHEN_X1 - KITCHEN_X0;
  const KIT_D = KITCHEN_DEPTH;
  const FRIDGE_W = 6;
  const CABINET_W = 4;

  // --- Placard (bois) ---
  {
    const cabinetH = COUNTER_H;
    const geo = new THREE.BoxGeometry(CABINET_W - GAP, cabinetH, KIT_D - GAP);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.6 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      KITCHEN_X0 + CABINET_W / 2,
      cabinetH / 2,
      ROOM_D + KIT_D / 2
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Porte du placard
    const doorGeo = new THREE.BoxGeometry(CABINET_W - 0.4, cabinetH - 0.4, 0.05);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x9B7924, roughness: 0.5 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(
      KITCHEN_X0 + CABINET_W / 2,
      cabinetH / 2,
      ROOM_D + 0.05
    );
    scene.add(door);

    // Poignée placard
    const hGeo = new THREE.BoxGeometry(0.15, 1.5, 0.2);
    const hMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5, roughness: 0.2 });
    const h = new THREE.Mesh(hGeo, hMat);
    h.position.set(
      KITCHEN_X0 + CABINET_W - 0.8,
      cabinetH * 0.5,
      ROOM_D + 0.15
    );
    scene.add(h);
  }

  // --- Frigo (blanc) ---
  {
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
    scene.add(mesh);

    // Poignée frigo
    const handleGeo = new THREE.BoxGeometry(0.15, 3, 0.2);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5, roughness: 0.2 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(
      KITCHEN_X0 + CABINET_W + 0.8,
      frigoH * 0.6,
      ROOM_D + 0.15
    );
    scene.add(handle);
  }

  // --- Plan de travail ---
  {
    const geo = new THREE.BoxGeometry(KIT_W + 0.2, COUNTER_SLAB, KIT_D + 0.2);
    const mat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.25, metalness: 0.05 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      KITCHEN_X0 + KIT_W / 2,
      COUNTER_H + COUNTER_SLAB / 2,
      ROOM_D + KIT_D / 2
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  // --- Évier ---
  {
    const sinkW = 3;
    const sinkD = 3.5;
    const sinkDepth = 0.4;
    const sinkCX = KITCHEN_X0 + CABINET_W / 2;
    const sinkCZ = ROOM_D + KIT_D / 2;
    const sinkY = COUNTER_H + COUNTER_SLAB;

    const rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.4, roughness: 0.15 });

    // Fond
    const bottomGeo = new THREE.BoxGeometry(sinkW, 0.05, sinkD);
    const bottom = new THREE.Mesh(bottomGeo, rimMat);
    bottom.position.set(sinkCX, sinkY - sinkDepth + 0.025, sinkCZ);
    scene.add(bottom);

    // 4 côtés du bac
    const sides = [
      { sx: sinkW, sy: sinkDepth, sz: 0.1, px: 0, pz: -sinkD / 2 },
      { sx: sinkW, sy: sinkDepth, sz: 0.1, px: 0, pz: sinkD / 2 },
      { sx: 0.1, sy: sinkDepth, sz: sinkD, px: -sinkW / 2, pz: 0 },
      { sx: 0.1, sy: sinkDepth, sz: sinkD, px: sinkW / 2, pz: 0 },
    ];
    for (const s of sides) {
      const geo = new THREE.BoxGeometry(s.sx, s.sy, s.sz);
      const mesh = new THREE.Mesh(geo, rimMat);
      mesh.position.set(sinkCX + s.px, sinkY - sinkDepth / 2, sinkCZ + s.pz);
      scene.add(mesh);
    }

    // Robinet
    const faucetMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.1 });
    const fTige = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2, 8), faucetMat);
    fTige.position.set(sinkCX, sinkY + 1, sinkCZ + sinkD / 2 - 0.3);
    scene.add(fTige);
    const fBec = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), faucetMat);
    fBec.rotation.x = Math.PI / 2;
    fBec.position.set(sinkCX, sinkY + 1.9, sinkCZ + sinkD / 2 - 0.9);
    scene.add(fBec);
  }

  // --- Meuble haut (ouvert, sans porte ni fond) ---
  {
    const HC_W = KIT_W;    // 100cm = 10 studs
    const HC_H = 4;        // 40cm
    const HC_D = 4;        // 40cm
    const HC_PANEL = 0.15;
    const HC_Y0 = COUNTER_H + COUNTER_SLAB + 6; // 60cm au-dessus du plan
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
    const plateY = COUNTER_H + COUNTER_SLAB + 0.02;
    const plateCX = KITCHEN_X0 + CABINET_W + FRIDGE_W / 2;
    const plateCZ = ROOM_D + KIT_D / 2;
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2, metalness: 0.1 });
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.3, metalness: 0.2 });

    const baseGeo = new THREE.BoxGeometry(FRIDGE_W - 1, 0.1, KIT_D - 1.5);
    const base = new THREE.Mesh(baseGeo, plateMat);
    base.position.set(plateCX, plateY + 0.05, plateCZ);
    scene.add(base);

    const ringGeo = new THREE.TorusGeometry(0.9, 0.12, 8, 24);
    const diskGeo = new THREE.CircleGeometry(0.9, 24);
    const diskMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.15 });

    for (let i = 0; i < 2; i++) {
      const offsetZ = (i === 0) ? -1.2 : 1.2;
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(plateCX, plateY + 0.12, plateCZ + offsetZ);
      scene.add(ring);
      const disk = new THREE.Mesh(diskGeo, diskMat);
      disk.rotation.x = -Math.PI / 2;
      disk.position.set(plateCX, plateY + 0.11, plateCZ + offsetZ);
      scene.add(disk);
    }
  }
}
