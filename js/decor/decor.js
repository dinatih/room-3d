import * as THREE from 'three';
import { gltfLoader } from '../utils/loaders.js';
import { mergeGlbByMaterial } from '../utils/mergeUtils.js';
import { LAYER_GLB } from '../config.js';
import { requestRender } from '../cameraManager.js';
import { sunnerstaMannequin } from '../furniture/sunnersta.js';
import {
  ROOM_W,
  ROOM_D,
  WALL_H,
  NICHE_DEPTH,
  NICHE_Z_START,
  KITCHEN_X0,
  KITCHEN_X1,
  KITCHEN_Z,
  DOOR_START,
  KALLAX_DEPTH,
  KALLAX_PANEL,
} from '../config.js';
import { addSingleDrona } from '../furniture/drona.js';
import { kallaxW, kallaxH, kallaxSWGroup } from '../furniture/kallax.js';
import { mackaparGroup } from '../furniture/mackapar.js';

let freezerDoorGroup = null;
let freezerDoorOpen = false;

export function toggleFreezerDoor() {
  freezerDoorOpen = !freezerDoorOpen;
  if (freezerDoorGroup) freezerDoorGroup.rotation.y = freezerDoorOpen ? Math.PI / 2 : 0;
  return freezerDoorOpen;
}

export function buildDecor(scene) {
  // =============================================
  // 4 DRONA - 2 sur MACKAPÄR, 2 sur Kallax 2x5
  // =============================================
  {
    const DF = 33; // face 33x33cm (Drona réelle)
    const DD = 38; // profondeur 38cm (Drona réelle)

    // 2 sur MACKAPÄR — enfants du mackaparGroup (position 0,0,0 → coords monde = coords locales)
    const mpTopY = 200;
    const mpCX = -NICHE_DEPTH + 3.5 + 77 / 2;  // ≈ 32cm
    const mpCZ = ROOM_D - kallaxW(2) - 32 / 2;

    addSingleDrona(mackaparGroup, mpCX - 20, mpTopY + DF / 2, mpCZ, Math.PI / 2);
    addSingleDrona(mackaparGroup, mpCX + 20, mpTopY + DF / 2, mpCZ, Math.PI / 2);

    // 1 sur Kallax NE empilé 2×1+2×2 (angle C+B), poussé contre mur C (Z=0)
    const k1TopY = kallaxH(1) + kallaxH(2);
    const k1CX = ROOM_W - 20; // 280
    addSingleDrona(scene, k1CX, k1TopY + DF / 2, DD / 2);

    // 2 sur Kallax cuisine empilé 2×2+2×2+2×1 — enfants du groupe SW (ry=-π/2)
    // local_x = gStack.pos.z - world_z ; local_z = 0 ; local_rotY = π
    const k4TopY = kallaxH(2) * 2 + kallaxH(1);
    addSingleDrona(kallaxSWGroup,  18, k4TopY + DF / 2, 0, Math.PI);
    addSingleDrona(kallaxSWGroup, -18, k4TopY + DF / 2, 0, Math.PI);

    // 1 sur meuble SDB côté évier (cbnE), plaqué contre mur nord
    addSingleDrona(scene, DOOR_START - 28, 60 + DF / 2, KITCHEN_Z + 30);
    // 1 sur meuble SDB ouest (cbnW)
    addSingleDrona(scene, -NICHE_DEPTH + 20, 60 + DF / 2, KITCHEN_Z + 30);
  }

  // =============================================
  // 3 DRONA - sur le meuble haut cuisine
  // =============================================
  {
    const DF = 33; // face 33x33cm (Drona réelle)
    const DD = 38; // profondeur 38cm (Drona réelle)

    const hcTopY = 195;
    // Plaquées contre mur du fond (KITCHEN_Z), profondeur 38cm le long de Z
    // Débordent de ~2cm du meuble (HC_D=40, Drona=38 plaqué au fond)
    const hcCZ = KITCHEN_Z - DD / 2;
    const KIT_W = KITCHEN_X1 - KITCHEN_X0;

    const gap = (KIT_W - 3 * DF) / 4;

    for (let i = 0; i < 3; i++) {
      const cx = KITCHEN_X0 + gap + DF / 2 + i * (DF + gap);
      addSingleDrona(scene, cx, hcTopY + DF / 2, hcCZ, Math.PI);
    }
  }

  // =============================================
  // CONGÉLATEUR CHIQ CSD46D4E
  // =============================================
  {
    const FRZ_W = 45;   // largeur (Z)
    const FRZ_D = 47;   // profondeur (X)
    const FRZ_H = 50;   // hauteur (Y)
    const FRZ_T = 1.5;  // épaisseur parois

    const frzZ = 236 + 5 + FRZ_W / 2 + 6; // 269.5 — centre Z
    const frzX = FRZ_D / 2 + 1;          // 24.5  — centre X
    const frzBaseY = 0;

    const frzMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.2 });
    const frzDarkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
    const frzInsideMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.5 });

    // Groupe principal (pour inventaire + positionnement)
    const freezerGroup = new THREE.Group();
    freezerGroup.userData.inventoryId = 'freezer';
    freezerGroup.userData.hoverAction = { label: 'Congélateur', actionId: 'freezer-toggle' };
    freezerGroup.position.set(frzX, frzBaseY, frzZ);

    function addP(sx, sy, sz, x, y, z, mat = frzMat) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      freezerGroup.add(m);
    }

    // Carcasse : 5 panneaux, face avant (+X) ouverte
    const innerH = FRZ_H - FRZ_T * 2;
    const innerW = FRZ_W - FRZ_T * 2;

    // Dos
    addP(FRZ_T, FRZ_H, FRZ_W,               -FRZ_D / 2 + FRZ_T / 2, FRZ_H / 2, 0);
    // Dessus
    addP(FRZ_D, FRZ_T, FRZ_W,               0, FRZ_H - FRZ_T / 2, 0);
    // Dessous
    addP(FRZ_D, FRZ_T, FRZ_W,               0, FRZ_T / 2, 0);
    // Côté gauche (Z-)
    addP(FRZ_D - FRZ_T, innerH, FRZ_T,      FRZ_T / 2, FRZ_H / 2, -FRZ_W / 2 + FRZ_T / 2);
    // Côté droit (Z+)
    addP(FRZ_D - FRZ_T, innerH, FRZ_T,      FRZ_T / 2, FRZ_H / 2,  FRZ_W / 2 - FRZ_T / 2);

    // Intérieur : fond peint clair
    addP(0.5, innerH, innerW,  -FRZ_D / 2 + FRZ_T + 0.25, FRZ_H / 2, 0, frzInsideMat);
    // 2 étagères intérieures
    addP(FRZ_D - FRZ_T - 1, FRZ_T, innerW,  FRZ_T / 2 - 0.5, FRZ_H * 0.35, 0, frzInsideMat);
    addP(FRZ_D - FRZ_T - 1, FRZ_T, innerW,  FRZ_T / 2 - 0.5, FRZ_H * 0.60, 0, frzInsideMat);

    // Pieds
    for (const dz of [-1, 1]) {
      for (const dx of [-1, 1]) {
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2, 8), frzDarkMat);
        foot.position.set(dx * (FRZ_D / 2 - 3), 1, dz * (FRZ_W / 2 - 3));
        freezerGroup.add(foot);
      }
    }

    // --- Porte (charnière côté -Z) ---
    // En local du freezerGroup : charnière à (FRZ_D/2, 0, -FRZ_W/2)
    freezerDoorGroup = new THREE.Group();
    freezerDoorGroup.position.set(FRZ_D / 2, 0, -FRZ_W / 2);

    // Panneau de porte : s'étend depuis la charnière en +Z
    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(FRZ_T, FRZ_H - 2, FRZ_W - FRZ_T),
      frzMat,
    );
    doorPanel.position.set(0, FRZ_H / 2, FRZ_W / 2);
    doorPanel.castShadow = true;
    freezerDoorGroup.add(doorPanel);

    // Poignée : côté libre de la porte (bord +Z), face externe (+X)
    const handle = new THREE.Mesh(new THREE.BoxGeometry(1.5, 25, 1.5), frzDarkMat);
    handle.position.set(FRZ_T / 2 + 0.9, FRZ_H / 2, FRZ_W - 7);
    freezerDoorGroup.add(handle);

    freezerGroup.add(freezerDoorGroup);
    scene.add(freezerGroup);

    // Drona sur le congélateur
    const DF = 33;
    addSingleDrona(scene, frzX, frzBaseY + FRZ_H + DF / 2, frzZ, Math.PI);
  }

  // =============================================
  // ÉTAGÈRE LACK IKEA 110x26cm - Mur MA
  // 20cm au-dessus du miroir 4 (70x160), alignée avec le bout du mur MA (Z=280)
  // =============================================
  {
    const LACK_W = 110; // 110cm le long de Z
    const LACK_D = 26; // 26cm profondeur le long de X
    const LACK_H = 5; // 5cm épaisseur

    // Miroir 4 : top Y = 6 + 160 = 166
    const M4_TOP_Y = 6 + 160;
    const LACK_Y = 187.5 + LACK_H / 2; // bas à 187.5

    // Aligné avec le bout du mur MA (Z=280)
    const LACK_Z1 = NICHE_Z_START; // 280
    const LACK_CZ = LACK_Z1 - LACK_W / 2; // 225
    const LACK_CX = LACK_D / 2; // 13

    const lackMat = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.3,
    });
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(LACK_D, LACK_H, LACK_W),
      lackMat,
    );
    shelf.userData.inventoryId = 'shelf-lack';
    shelf.position.set(LACK_CX, LACK_Y, LACK_CZ);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    scene.add(shelf);
  }

  // =============================================
  // TRINGLE MURALE MULIG IKEA 80cm - Mur MA, à la suite de l'étagère LACK
  // =============================================
  {
    const MUL_W = 80; // 80cm le long de Z
    const MUL_D = 26; // 26cm profondeur depuis le mur
    const MUL_MOUNT_Y = WALL_H - 20; // 20cm du plafond

    const mulZ0 = NICHE_Z_START - 110; // 170 (après étagère)
    const mulCZ = mulZ0 - MUL_W / 2; // 130

    const mulMat = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.3,
    });
    const bracketMat = new THREE.MeshStandardMaterial({
      color: 0xd0d0d0,
      roughness: 0.3,
    });
    const r = 1.5;

    const muligGroup = new THREE.Group();
    muligGroup.userData.inventoryId = 'rail-mulig';

    // Barre horizontale (tringle)
    const bar = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, MUL_W, 8),
      mulMat,
    );
    bar.rotation.x = Math.PI / 2;
    bar.position.set(MUL_D, MUL_MOUNT_Y, mulCZ);
    muligGroup.add(bar);

    // 2 supports muraux
    for (const dz of [-MUL_W / 2 + 5, MUL_W / 2 - 5]) {
      // Bras horizontal (du mur vers la barre)
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(MUL_D, 2, 2),
        bracketMat,
      );
      arm.position.set(MUL_D / 2, MUL_MOUNT_Y, mulCZ + dz);
      muligGroup.add(arm);

      // Plaque murale
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 10, 8),
        bracketMat,
      );
      plate.position.set(0.75, MUL_MOUNT_Y, mulCZ + dz);
      muligGroup.add(plate);
    }

    // 3 pantalons rouges suspendus
    const pantMat = new THREE.MeshStandardMaterial({
      color: 0xcc2222,
      roughness: 0.7,
    });
    const pantClipMat = new THREE.MeshStandardMaterial({
      color: 0x999999,
      roughness: 0.3,
    });
    const pantH = 60; // 60cm de longueur
    const pantW = 35; // 35cm plié (le long de X)
    const pantT = 2.5; // épaisseur tissu

    for (const pz of [mulCZ - 25, mulCZ, mulCZ + 25]) {
      // Pince sur la barre
      const clip = new THREE.Mesh(
        new THREE.BoxGeometry(3, 5, 4),
        pantClipMat,
      );
      clip.position.set(MUL_D, MUL_MOUNT_Y + 1.5, pz);
      muligGroup.add(clip);

      // Corps du pantalon (2 jambes côte à côte)
      for (const dx of [-7, 7]) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(pantW / 2 - 1.5, pantH, pantT),
          pantMat,
        );
        leg.position.set(MUL_D + dx, MUL_MOUNT_Y - pantH / 2, pz);
        leg.castShadow = true;
        muligGroup.add(leg);
      }
    }
    scene.add(muligGroup);
  }


  // =============================================
  // CORBEILLES IKEA FNISS (×2)
  // =============================================
  {
    const FN_R_TOP = 14;    // 28cm diamètre haut
    const FN_R_BOT = 9.5;   // 19cm diamètre bas
    const FN_H = 28;        // 28cm hauteur
    const FN_THICK = 0.6;

    const fnMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.4 });
    const fnInnerMat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0, roughness: 0.3, side: THREE.BackSide,
    });

    function addFniss(x, z) {
      const group = new THREE.Group();
      // Coque extérieure
      const outer = new THREE.Mesh(
        new THREE.CylinderGeometry(FN_R_TOP, FN_R_BOT, FN_H, 24, 1, true),
        fnMat,
      );
      outer.position.y = FN_H / 2;
      outer.castShadow = true;
      group.add(outer);
      // Face intérieure
      const inner = new THREE.Mesh(
        new THREE.CylinderGeometry(FN_R_TOP - FN_THICK, FN_R_BOT - FN_THICK, FN_H, 24, 1, true),
        fnInnerMat,
      );
      inner.position.y = FN_H / 2;
      group.add(inner);
      // Fond
      const bottom = new THREE.Mesh(
        new THREE.CircleGeometry(FN_R_BOT - FN_THICK, 24),
        fnMat,
      );
      bottom.rotation.x = -Math.PI / 2;
      bottom.position.y = 0.5;
      group.add(bottom);
      // Lèvre supérieure (anneau)
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(FN_R_TOP - FN_THICK / 2, FN_THICK, 8, 24),
        fnMat,
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.y = FN_H;
      group.add(rim);

      group.position.set(x, 0, z);
      scene.add(group);
      return group;
    }

    addFniss(110, 500).userData.inventoryId = 'basket-fniss';
    addFniss(286, 202);
  }


  // Casquette rouge mur B → remplacée par GLB dans casquettes.js

  // =============================================
  // TÊTES DE MANNEQUIN — sur desserte SUNNERSTA + Kallax 1x4 NO
  // Épaules 41cm, hauteur 45cm, tour de tête 56cm
  // =============================================
  {
    const SHOULDER_W = 41;   // 41cm largeur épaules
    const TOTAL_H = 45;      // 45cm hauteur totale
    const HEAD_R = 8.9;      // circ 56cm → r≈8.9cm
    const NECK_R = 4;       // ~8cm diamètre cou
    const NECK_H = 8;       // ~8cm hauteur cou
    const SHOULDER_H = 8;   // épaisseur épaules
    const SHOULDER_D = 22;   // profondeur épaules ~22cm

    const mannMat = new THREE.MeshStandardMaterial({
      color: 0xf5f0eb, roughness: 0.5,
    });

    function addMannequin(x, baseY, z, rotY, parent = scene) {
      const g = new THREE.Group();

      // Épaules (ellipsoïde aplati)
      const shoulders = new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 8), mannMat,
      );
      shoulders.scale.set(SHOULDER_W / 2, SHOULDER_H / 2, SHOULDER_D / 2);
      shoulders.position.y = SHOULDER_H / 2;
      shoulders.castShadow = true;
      g.add(shoulders);

      // Cou (cylindre)
      const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(NECK_R, NECK_R * 1.1, NECK_H, 12), mannMat,
      );
      neck.position.y = SHOULDER_H + NECK_H / 2;
      neck.castShadow = true;
      g.add(neck);

      // Tête (sphère légèrement allongée verticalement)
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(HEAD_R, 16, 12), mannMat,
      );
      head.scale.y = 1.15;
      head.position.y = SHOULDER_H + NECK_H + HEAD_R;
      head.castShadow = true;
      g.add(head);

      // Nez (petit cône)
      const nose = new THREE.Mesh(
        new THREE.ConeGeometry(1.2, 2.5, 6), mannMat,
      );
      nose.rotation.x = -Math.PI / 2;
      nose.position.set(0, SHOULDER_H + NECK_H + HEAD_R, HEAD_R + 0.5);
      g.add(nose);

      g.userData.inventoryId = 'mannequin-head';
      g.rotation.y = rotY;
      g.position.set(x, baseY, z);
      parent.add(g);
    }

    // 1) Sur desserte SUNNERSTA — enfant de sunnerstaMannequin (Y=90 dans le monde)
    addMannequin(0, 0, 0, 0, sunnerstaMannequin);

    // 2) Sur Kallax NW empilé 2×1+1×1+1×1 pivoté (top≈156.5), face centre séjour
    const k14CX = KALLAX_DEPTH / 2;
    const k14CZ = kallaxW(1) / 2;
    const k14Top = kallaxW(2) + kallaxW(1) * 2;
    addMannequin(k14CX, k14Top, k14CZ,
      Math.atan2(150 - k14CX, 200 - k14CZ));

    // 3) Sur étagère LACK mur A (cx=13, cz=225, top≈191), face centre séjour
    const lackCX = 26 / 2;  // LACK_D / 2
    const lackCZ = NICHE_Z_START - 110 / 2;  // 280 - 55 = 225
    const lackTopY = 187.5 + 5;  // bas LACK + LACK_H = 192.5
    addMannequin(lackCX, lackTopY, lackCZ,
      Math.atan2(150 - lackCX, 200 - lackCZ));
  }

  // =============================================
  // PIZZA OVEN — Kallax cuisine, étagère spec (planche milieu retirée)
  // =============================================
  {
    const k25CX = -NICHE_DEPTH + KALLAX_DEPTH / 2;
    const k25CZ = ROOM_D - kallaxW(2) / 2;
    const shelfTopY = kallaxH(2) + kallaxH(2) / 2 + KALLAX_PANEL / 2;

    gltfLoader.load('media/pizza_oven.glb', (gltf) => {
      const oven = gltf.scene;

      const rawBox = new THREE.Box3().setFromObject(oven);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      // Hauteur cible ~19cm (même gabarit que le Ninja Foodi)
      oven.scale.setScalar(19 * 0.8 / rawSize.y);
      oven.rotation.y = -Math.PI / 2;
      oven.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(oven);
      oven.position.set(
        k25CX - (box.min.x + box.max.x) / 2,
        shelfTopY - box.min.y,
        k25CZ - (box.min.z + box.max.z) / 2,
      );

      oven.traverse(c => {
        c.layers.set(LAYER_GLB);
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });

      mergeGlbByMaterial(oven);
      scene.add(oven);
      requestRender();
    }, undefined, err => console.error('pizza_oven.glb:', err));
  }

}
