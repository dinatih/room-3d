import * as THREE from "three";
import {
  ROOM_W,
  ROOM_D,
  WALL_H,
  NICHE_DEPTH,
  NICHE_Z_START,
  KITCHEN_X0,
  KITCHEN_X1,
  KITCHEN_DEPTH,
  KITCHEN_Z,
  DOOR_START,
  KALLAX_CELL,
  KALLAX_PANEL,
} from "./config.js";
import { addSingleDrona } from "./drona.js";

export function buildDecor(scene) {
  // =============================================
  // 4 DRONA - 2 sur MACKAPÄR, 2 sur Kallax 2x5
  // =============================================
  {
    const DF = 3.3; // face 33x33cm
    const DD = 3.8; // profondeur 38cm

    // 2 sur MACKAPÄR
    const mpTopY = 20;
    const mpCX = -NICHE_DEPTH + 7.8 / 2;
    const mpCZ = ROOM_D - (2 * KALLAX_CELL + 3 * KALLAX_PANEL) - 3.2 / 2;

    addSingleDrona(scene, mpCX - 1.8, mpTopY + DF / 2, mpCZ, DF, DF, DD);
    addSingleDrona(scene, mpCX + 1.8, mpTopY + DF / 2, mpCZ, DF, DF, DD);

    // 1 sur Kallax 2x3 (angle C+B), poussé contre mur C (Z=0)
    const k1TopY = 3 * KALLAX_CELL + 4 * KALLAX_PANEL; // 10.5
    const k1CX = ROOM_W - 2; // 28
    addSingleDrona(scene, k1CX, k1TopY + DF / 2, DF / 2, DF, DF, DD);

    // 2 sur Kallax 2x5
    const k4TopY = 17.4 + 0.075;
    const k4CX = -NICHE_DEPTH + 4 / 2;
    const k4CZ = ROOM_D - (2 * KALLAX_CELL + 3 * KALLAX_PANEL) / 2;

    addSingleDrona(scene, k4CX, k4TopY + DF / 2, k4CZ - 1.8, DF, DF, DD);
    addSingleDrona(scene, k4CX, k4TopY + DF / 2, k4CZ + 1.8, DF, DF, DD);

    // 1 sur meuble SDB côté évier (cbnE), légèrement décalé du coin
    addSingleDrona(
      scene,
      DOOR_START - 2.8,
      6 + DF / 2,
      KITCHEN_Z + 3,
      DD,
      DF,
      DF,
    );
  }

  // =============================================
  // 3 DRONA - sur le meuble haut cuisine
  // =============================================
  {
    const dronaFace = 3.3; // 33cm
    const dronaDepth = 3.8; // 38cm

    const hcTopY = 19.5;
    const HC_D = 4;
    const hcCZ = ROOM_D + KITCHEN_DEPTH - HC_D / 2;
    const KIT_W = KITCHEN_X1 - KITCHEN_X0;

    const gap = (KIT_W - 3 * dronaFace) / 4;

    for (let i = 0; i < 3; i++) {
      const cx = KITCHEN_X0 + gap + dronaFace / 2 + i * (dronaFace + gap);
      addSingleDrona(
        scene,
        cx,
        hcTopY + dronaFace / 2,
        hcCZ,
        dronaDepth,
        dronaFace,
        dronaFace,
      );
    }
  }

  // =============================================
  // CONGÉLATEUR CHIQ CSD46D4E
  // =============================================
  {
    const FRZ_W = 4.5;
    const FRZ_D = 4.7;
    const FRZ_H = 5;

    const frzZ = 23.6 + 0.5 + FRZ_W / 2;
    const frzX = FRZ_D / 2 + 0.1;
    const frzBaseY = 0;

    const frzMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.3,
      metalness: 0.2,
    });
    const frzMatDark = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.4,
    });

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(FRZ_D, FRZ_H, FRZ_W),
      frzMat,
    );
    body.position.set(frzX, frzBaseY + FRZ_H / 2, frzZ);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, FRZ_H - 0.4, FRZ_W - 0.3),
      frzMat,
    );
    door.position.set(frzX + FRZ_D / 2 + 0.04, frzBaseY + FRZ_H / 2, frzZ);
    scene.add(door);

    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 2.5, 0.15),
      frzMatDark,
    );
    handle.position.set(
      frzX + FRZ_D / 2 + 0.1,
      frzBaseY + FRZ_H / 2,
      frzZ + FRZ_W / 2 - 0.5,
    );
    scene.add(handle);

    for (const dz of [-1, 1]) {
      for (const dx of [-1, 1]) {
        const foot = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.15, 0.15, 8),
          frzMatDark,
        );
        foot.position.set(
          frzX + dx * (FRZ_D / 2 - 0.3),
          frzBaseY + 0.075,
          frzZ + dz * (FRZ_W / 2 - 0.3),
        );
        scene.add(foot);
      }
    }

    // Drona sur le congélateur
    addSingleDrona(
      scene,
      frzX,
      frzBaseY + FRZ_H + 3.3 / 2,
      frzZ,
      3.3,
      3.3,
      3.8,
    );
  }

  // =============================================
  // ÉTAGÈRE LACK IKEA 110x26cm - Mur MA
  // 20cm au-dessus du miroir 4 (70x160), alignée avec le bout du mur MA (Z=28)
  // =============================================
  {
    const LACK_W = 11; // 110cm le long de Z
    const LACK_D = 2.6; // 26cm profondeur le long de X
    const LACK_H = 0.5; // 5cm épaisseur

    // Miroir 4 : top Y = 0.6 + 16 = 16.6
    const M4_TOP_Y = 0.6 + 16;
    const LACK_Y = M4_TOP_Y + 2 + LACK_H / 2; // 20cm au-dessus + demi-épaisseur

    // Aligné avec le bout du mur MA (Z=28)
    const LACK_Z1 = NICHE_Z_START; // 28
    const LACK_CZ = LACK_Z1 - LACK_W / 2; // 22.5
    const LACK_CX = LACK_D / 2; // 1.3

    const lackMat = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.3,
    });
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(LACK_D, LACK_H, LACK_W),
      lackMat,
    );
    shelf.position.set(LACK_CX, LACK_Y, LACK_CZ);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    scene.add(shelf);
  }

  // =============================================
  // TRINGLE MURALE MULIG IKEA 80cm - Mur MA, à la suite de l'étagère LACK
  // =============================================
  {
    const MUL_W = 8; // 80cm le long de Z
    const MUL_D = 2.6; // 26cm profondeur depuis le mur
    const MUL_MOUNT_Y = WALL_H - 2; // 20cm du plafond (2 studs en dessous)

    const mulZ0 = NICHE_Z_START - 11; // 17 (après étagère)
    const mulCZ = mulZ0 - MUL_W / 2; // 13

    const mulMat = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.3,
    });
    const bracketMat = new THREE.MeshStandardMaterial({
      color: 0xd0d0d0,
      roughness: 0.3,
    });
    const r = 0.15;

    // Barre horizontale (tringle)
    const bar = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, MUL_W, 8),
      mulMat,
    );
    bar.rotation.x = Math.PI / 2;
    bar.position.set(MUL_D, MUL_MOUNT_Y, mulCZ);
    scene.add(bar);

    // 2 supports muraux
    for (const dz of [-MUL_W / 2 + 0.5, MUL_W / 2 - 0.5]) {
      // Bras horizontal (du mur vers la barre)
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(MUL_D, 0.2, 0.2),
        bracketMat,
      );
      arm.position.set(MUL_D / 2, MUL_MOUNT_Y, mulCZ + dz);
      scene.add(arm);

      // Plaque murale
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 1, 0.8),
        bracketMat,
      );
      plate.position.set(0.075, MUL_MOUNT_Y, mulCZ + dz);
      scene.add(plate);
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
    const pantH = 6; // 60cm de longueur
    const pantW = 3.5; // 35cm plié (le long de X)
    const pantT = 0.25; // épaisseur tissu

    for (const pz of [mulCZ - 2.5, mulCZ, mulCZ + 2.5]) {
      // Pince sur la barre
      const clip = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.5, 0.4),
        pantClipMat,
      );
      clip.position.set(MUL_D, MUL_MOUNT_Y + 0.15, pz);
      scene.add(clip);

      // Corps du pantalon (2 jambes côte à côte)
      for (const dx of [-0.7, 0.7]) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(pantW / 2 - 0.15, pantH, pantT),
          pantMat,
        );
        leg.position.set(MUL_D + dx, MUL_MOUNT_Y - pantH / 2, pz);
        leg.castShadow = true;
        scene.add(leg);
      }
    }
  }

  // =============================================
  // ÉCRAN TV 70x40cm - Angle mur C + B
  // =============================================
  {
    const TV_W = 7; // 70cm
    const TV_H = 4; // 40cm
    const TV_D = 0.15; // épaisseur
    const TV_Y = WALL_H - 1 - TV_H / 2; // 10cm du plafond

    const tvMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.3,
      metalness: 0.4,
    });
    const tv = new THREE.Mesh(new THREE.BoxGeometry(TV_W, TV_H, TV_D), tvMat);
    tv.position.set(ROOM_W - 2.5, TV_Y, 2.5);
    tv.rotation.y = (3 * Math.PI) / 4; // face vers le centre du séjour
    tv.castShadow = true;
    scene.add(tv);

    // Écran (face avant, légèrement en avant)
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.05,
      metalness: 0.8,
    });
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(TV_W - 0.3, TV_H - 0.3),
      screenMat,
    );
    screen.position.set(ROOM_W - 2.5, TV_Y, 2.5);
    screen.rotation.y = (3 * Math.PI) / 4;
    screen.translateZ(TV_D / 2 + 0.01);
    scene.add(screen);
  }

  // =============================================
  // DESSERTE SUNNERSTA 56x36x90cm - Entre lit et Kallax 1x4, mur B
  // =============================================
  {
    const SW = 5.6; // 56cm le long de X (largeur)
    const SD = 3.6; // 36cm le long de Z (profondeur)
    const SH = 9.0; // 90cm hauteur
    const LEG_T = 0.15;
    const SHELF_T = 0.1;

    // Position : contre mur B, entre lit (fin ~Z=27.35) et Kallax 1x4 (début ~Z=30.4)
    const sCX = ROOM_W - SW / 2;
    const sCZ = 28.9;

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      metalness: 0.3,
      roughness: 0.4,
    });
    const shelfMat = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.35,
    });

    // 4 montants verticaux
    for (const dx of [-1, 1]) {
      for (const dz of [-1, 1]) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(LEG_T, SH, LEG_T),
          frameMat,
        );
        leg.position.set(
          sCX + dx * (SW / 2 - LEG_T / 2),
          SH / 2,
          sCZ + dz * (SD / 2 - LEG_T / 2),
        );
        leg.castShadow = true;
        scene.add(leg);
      }
    }

    // 3 plateaux (bas, milieu, haut)
    for (const sy of [0.5, SH / 2, SH - 0.5]) {
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(SW - LEG_T * 2, SHELF_T, SD - LEG_T * 2),
        shelfMat,
      );
      shelf.position.set(sCX, sy, sCZ);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      scene.add(shelf);
    }

    // 4 roulettes
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.6,
    });
    for (const dx of [-1, 1]) {
      for (const dz of [-1, 1]) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.15, 0.12, 8),
          wheelMat,
        );
        wheel.position.set(
          sCX + dx * (SW / 2 - 0.3),
          0.06,
          sCZ + dz * (SD / 2 - 0.3),
        );
        scene.add(wheel);
      }
    }
  }

  // =============================================
  // TROTTINETTE XIAOMI 5 PRO — Entrée, côté porte séjour + mur EST
  // =============================================
  {
    const scootMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.4,
      metalness: 0.3,
    });
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.6,
    });
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
    });
    const scootAccentMat = new THREE.MeshStandardMaterial({
      color: 0xcc0000,
      roughness: 0.4,
    });

    const scootGroup = new THREE.Group();
    scootGroup.position.set(28.2, 0, 46);
    scootGroup.rotation.y = 0; // avant vers +Z (vers le couloir)

    const WHEEL_R = 0.5;
    const DECK_L = 5.5;
    const DECK_W = 1.5;
    const DECK_H = 0.2;
    const DECK_Y = WHEEL_R + 0.3;
    const STEM_H = 9;
    const STEM_R = 0.15;
    const HBAR_W = 4.7;
    const FRONT_Z = -DECK_L / 2 + 0.3;

    // Deck (plateforme)
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(DECK_W, DECK_H, DECK_L),
      scootMat,
    );
    deck.position.set(0, DECK_Y, 0);
    deck.castShadow = true;
    scootGroup.add(deck);

    // Grip antidérapant sur le deck
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(DECK_W - 0.1, 0.02, DECK_L - 0.6),
      gripMat,
    );
    grip.position.set(0, DECK_Y + DECK_H / 2 + 0.01, 0);
    scootGroup.add(grip);

    // Roue avant
    const wheelGeo = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.3, 16);
    const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, WHEEL_R, FRONT_Z);
    scootGroup.add(frontWheel);

    // Roue arrière
    const rearWheel = new THREE.Mesh(wheelGeo, wheelMat);
    rearWheel.rotation.z = Math.PI / 2;
    rearWheel.position.set(0, WHEEL_R, DECK_L / 2 - 0.3);
    scootGroup.add(rearWheel);

    // Garde-boue arrière
    const fender = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.06, WHEEL_R * 1.5),
      scootMat,
    );
    fender.position.set(0, WHEEL_R * 1.6, DECK_L / 2 - 0.1);
    fender.rotation.x = -0.3;
    scootGroup.add(fender);

    // Fourche avant (2 tiges)
    for (const side of [-0.2, 0.2]) {
      const forkTube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, DECK_Y - WHEEL_R + 0.1, 6),
        scootMat,
      );
      forkTube.position.set(side, WHEEL_R + (DECK_Y - WHEEL_R) / 2, FRONT_Z);
      scootGroup.add(forkTube);
    }

    // Stem (tube de direction)
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(STEM_R, STEM_R, STEM_H, 8),
      scootMat,
    );
    stem.position.set(0, DECK_Y + STEM_H / 2, FRONT_Z);
    stem.castShadow = true;
    scootGroup.add(stem);

    // Guidon tourné à 45° vers la droite (group pivoté autour du stem)
    const hbarGroup = new THREE.Group();
    hbarGroup.position.set(0, DECK_Y + STEM_H, FRONT_Z);
    hbarGroup.rotation.y = -Math.PI / 4; // 45° vers la droite

    const handlebar = new THREE.Mesh(
      new THREE.CylinderGeometry(STEM_R * 0.8, STEM_R * 0.8, HBAR_W, 8),
      scootMat,
    );
    handlebar.rotation.z = Math.PI / 2;
    hbarGroup.add(handlebar);

    // Poignées (grips rouges)
    for (const side of [-1, 1]) {
      const gripHandle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.8, 8),
        scootAccentMat,
      );
      gripHandle.rotation.z = Math.PI / 2;
      gripHandle.position.set(side * (HBAR_W / 2 - 0.3), 0, 0);
      hbarGroup.add(gripHandle);
    }

    scootGroup.add(hbarGroup);

    // Phare avant
    const headlight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.05, 8),
      scootAccentMat,
    );
    headlight.rotation.x = Math.PI / 2;
    headlight.position.set(0, DECK_Y + STEM_H - 1, FRONT_Z - 0.2);
    scootGroup.add(headlight);

    scene.add(scootGroup);
  }

  // =============================================
  // CORBEILLES IKEA FNISS (×2)
  // =============================================
  {
    const FN_R_TOP = 1.4;    // 28cm diamètre haut
    const FN_R_BOT = 0.95;   // 19cm diamètre bas
    const FN_H = 2.8;        // 28cm hauteur
    const FN_THICK = 0.06;

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
      bottom.position.y = 0.05;
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

    addFniss(11, 50);    // SDB, à côté meuble vasque
    addFniss(7.5, 26);  // Séjour, en face du congélateur
  }

  // =============================================
  // CANAPÉ DE JARDIN (rouge, côté est)
  // =============================================
  {
    const SOFA_W = 16;   // 160cm le long de Z
    const SOFA_D = 6;    // 60cm profondeur (X)
    const SOFA_H = 9;    // 90cm hauteur totale
    const SEAT_H = 4;    // 40cm hauteur assise
    const BACK_T = 1;    // 10cm épaisseur dossier
    const ARM_W = 1;     // 10cm largeur accoudoir
    const ARM_H = 6;     // 60cm hauteur accoudoir

    const sofaMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.7 });

    const sofaGroup = new THREE.Group();

    // Assise
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(SOFA_D, SEAT_H, SOFA_W),
      sofaMat,
    );
    seat.position.set(0, SEAT_H / 2, 0);
    seat.castShadow = true;
    seat.receiveShadow = true;
    sofaGroup.add(seat);

    // Dossier (contre le mur est)
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(BACK_T, SOFA_H, SOFA_W),
      sofaMat,
    );
    back.position.set(SOFA_D / 2 - BACK_T / 2, SOFA_H / 2, 0);
    back.castShadow = true;
    sofaGroup.add(back);

    // Accoudoirs
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(SOFA_D, ARM_H, ARM_W),
        sofaMat,
      );
      arm.position.set(0, ARM_H / 2, side * (SOFA_W / 2 - ARM_W / 2));
      arm.castShadow = true;
      sofaGroup.add(arm);
    }

    sofaGroup.position.set(31 - SOFA_D / 2, 0, -8);
    scene.add(sofaGroup);
  }

  // =============================================
  // CANAPÉ DE JARDIN 2 (rouge, sans accoudoirs, côté est)
  // =============================================
  {
    const S2_W = 10;    // 100cm le long de Z
    const S2_D = 6;     // 60cm profondeur (X)
    const S2_H = 10;    // 100cm hauteur totale
    const S2_SEAT = 4;  // 40cm hauteur assise
    const S2_BACK = 1;  // 10cm épaisseur dossier

    const sofa2Mat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.7 });
    const sofa2Group = new THREE.Group();

    // Assise
    const seat2 = new THREE.Mesh(
      new THREE.BoxGeometry(S2_D, S2_SEAT, S2_W),
      sofa2Mat,
    );
    seat2.position.set(0, S2_SEAT / 2, 0);
    seat2.castShadow = true;
    seat2.receiveShadow = true;
    sofa2Group.add(seat2);

    // Dossier
    const back2 = new THREE.Mesh(
      new THREE.BoxGeometry(S2_BACK, S2_H, S2_W),
      sofa2Mat,
    );
    back2.position.set(S2_D / 2 - S2_BACK / 2, S2_H / 2, 0);
    back2.castShadow = true;
    sofa2Group.add(back2);

    sofa2Group.rotation.y = Math.PI;
    sofa2Group.position.set(31 - 6 - 6 - S2_D / 2 - 6, 0, -8);
    scene.add(sofa2Group);
  }

  // =============================================
  // CHAISE PLIANTE IKEA VIHALS (rouge)
  // =============================================
  {
    const VH_W = 4.3;     // 43cm largeur
    const VH_D = 4.7;     // 47cm profondeur
    const VH_H = 8;       // 80cm hauteur totale
    const VH_SEAT_H = 4.5; // 45cm hauteur assise
    const VH_SEAT_W = 3.9; // 39cm largeur assise
    const VH_SEAT_D = 4.1; // 41cm profondeur assise
    const VH_SEAT_T = 0.2; // épaisseur assise
    const VH_BACK_H = VH_H - VH_SEAT_H; // 3.5 hauteur dossier
    const VH_LEG_R = 0.12; // rayon tubes

    const vhRedMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.5 });
    const legGeo = new THREE.CylinderGeometry(VH_LEG_R, VH_LEG_R, 1, 6);

    const vhGroup = new THREE.Group();

    // Assise
    const vhSeat = new THREE.Mesh(
      new THREE.BoxGeometry(VH_SEAT_W, VH_SEAT_T, VH_SEAT_D),
      vhRedMat,
    );
    vhSeat.position.y = VH_SEAT_H;
    vhSeat.castShadow = true;
    vhGroup.add(vhSeat);

    // Dossier (léger angle en arrière)
    const backAngle = 0.15; // ~8°
    const vhBack = new THREE.Mesh(
      new THREE.BoxGeometry(VH_SEAT_W, VH_BACK_H, VH_SEAT_T),
      vhRedMat,
    );
    vhBack.position.set(0, VH_SEAT_H + VH_BACK_H / 2, -VH_SEAT_D / 2 + VH_SEAT_T / 2);
    vhBack.rotation.x = backAngle;
    vhBack.castShadow = true;
    vhGroup.add(vhBack);

    // Pieds avant (droits)
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, vhRedMat);
      leg.scale.y = VH_SEAT_H;
      leg.position.set(sx * (VH_W / 2 - VH_LEG_R), VH_SEAT_H / 2, VH_SEAT_D / 2 - 0.3);
      vhGroup.add(leg);
    }

    // Pieds arrière (montants du dossier, jusqu'en haut)
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, vhRedMat);
      leg.scale.y = VH_H;
      leg.position.set(sx * (VH_W / 2 - VH_LEG_R), VH_H / 2, -VH_SEAT_D / 2 + 0.3);
      leg.rotation.x = backAngle * 0.5;
      vhGroup.add(leg);
    }

    // Traverse avant + arrière
    for (const tz of [VH_SEAT_D / 2 - 0.3, -VH_SEAT_D / 2 + 0.3]) {
      const bar = new THREE.Mesh(legGeo, vhRedMat);
      bar.rotation.z = Math.PI / 2;
      bar.scale.y = VH_W - VH_LEG_R * 4;
      bar.position.set(0, VH_SEAT_H * 0.3, tz);
      vhGroup.add(bar);
    }

    vhGroup.position.set(20, 0, 10);
    scene.add(vhGroup);
  }

  // =============================================
  // CAILLEBOTIS ALTAPPEN IKEA (blanc, 30×30cm = 3×3 studs)
  // Zone jardin Z=-29 → Z=-16
  // =============================================
  {
    const ALT_S = 3;       // 30cm = 3 studs
    const ALT_H = 0.2;    // ~2cm épaisseur
    const ALT_GAP = 0.06; // espacement entre dalles

    const altMat = new THREE.MeshStandardMaterial({
      color: 0xf0ece4, roughness: 0.55,
    });
    const altGeo = new THREE.BoxGeometry(
      ALT_S - ALT_GAP, ALT_H, ALT_S - ALT_GAP,
    );

    const Z0 = -29;
    const Z1 = -16;
    const X_RIGHT = 31;

    // Limite gauche jardin (même formule que floor.js)
    function gardenX0(z) {
      if (z + 0.5 >= -14) return -1;
      return Math.ceil(-1 - 11 * (z + 0.5 + 14) / 7);
    }

    for (let tz = Z0; tz + ALT_S <= Z1; tz += ALT_S) {
      const x0 = gardenX0(tz);
      for (let tx = X_RIGHT - ALT_S; tx >= x0; tx -= ALT_S) {
        const tile = new THREE.Mesh(altGeo, altMat);
        tile.position.set(tx + ALT_S / 2, ALT_H / 2, tz + ALT_S / 2);
        tile.receiveShadow = true;
        scene.add(tile);
      }
    }
  }
}
