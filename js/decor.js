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
  KALLAX_DEPTH,
  KALLAX_FRAME,
  KALLAX_CELL_H,
  KALLAX_PANEL,
} from "./config.js";
import { addSingleDrona } from "./drona.js";
import { kallaxW, kallaxH } from "./kallax.js";

export function buildDecor(scene) {
  // =============================================
  // 4 DRONA - 2 sur MACKAPÄR, 2 sur Kallax 2x5
  // =============================================
  {
    const DF = 33; // face 33x33cm
    const DD = 38; // profondeur 38cm

    // 2 sur MACKAPÄR
    const mpTopY = 200;
    const mpCX = -NICHE_DEPTH + 78 / 2;
    const mpCZ = ROOM_D - kallaxW(2) - 32 / 2;

    addSingleDrona(scene, mpCX - 18, mpTopY + DF / 2, mpCZ, DF, DF, DD);
    addSingleDrona(scene, mpCX + 18, mpTopY + DF / 2, mpCZ, DF, DF, DD);

    // 1 sur Kallax NE empilé 2×1+2×2 (angle C+B), poussé contre mur C (Z=0)
    const k1TopY = kallaxH(1) + kallaxH(2);
    const k1CX = ROOM_W - 20; // 280
    addSingleDrona(scene, k1CX, k1TopY + DF / 2, DF / 2, DF, DF, DD);

    // 2 sur Kallax cuisine empilé 2×2+2×2+2×1
    const k4TopY = kallaxH(2) * 2 + kallaxH(1);
    const k4CX = -NICHE_DEPTH + KALLAX_DEPTH / 2;
    const k4CZ = ROOM_D - kallaxW(2) / 2;

    addSingleDrona(scene, k4CX, k4TopY + DF / 2, k4CZ - 18, DF, DF, DD);
    addSingleDrona(scene, k4CX, k4TopY + DF / 2, k4CZ + 18, DF, DF, DD);

    // 1 sur meuble SDB côté évier (cbnE), légèrement décalé du coin
    addSingleDrona(
      scene,
      DOOR_START - 28,
      60 + DF / 2,
      KITCHEN_Z + 30,
      DD,
      DF,
      DF,
    );
  }

  // =============================================
  // 3 DRONA - sur le meuble haut cuisine
  // =============================================
  {
    const dronaFace = 33; // 33cm
    const dronaDepth = 38; // 38cm

    const hcTopY = 195;
    const HC_D = 40;
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
    const FRZ_W = 45;
    const FRZ_D = 47;
    const FRZ_H = 50;

    const frzZ = 236 + 5 + FRZ_W / 2;
    const frzX = FRZ_D / 2 + 1;
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
      new THREE.BoxGeometry(0.8, FRZ_H - 4, FRZ_W - 3),
      frzMat,
    );
    door.position.set(frzX + FRZ_D / 2 + 0.4, frzBaseY + FRZ_H / 2, frzZ);
    scene.add(door);

    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 25, 1.5),
      frzMatDark,
    );
    handle.position.set(
      frzX + FRZ_D / 2 + 1,
      frzBaseY + FRZ_H / 2,
      frzZ + FRZ_W / 2 - 5,
    );
    scene.add(handle);

    for (const dz of [-1, 1]) {
      for (const dx of [-1, 1]) {
        const foot = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5, 1.5, 1.5, 8),
          frzMatDark,
        );
        foot.position.set(
          frzX + dx * (FRZ_D / 2 - 3),
          frzBaseY + 0.75,
          frzZ + dz * (FRZ_W / 2 - 3),
        );
        scene.add(foot);
      }
    }

    // Drona sur le congélateur
    addSingleDrona(
      scene,
      frzX,
      frzBaseY + FRZ_H + 33 / 2,
      frzZ,
      33,
      33,
      38,
    );
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
    const LACK_Y = M4_TOP_Y + 20 + LACK_H / 2; // 20cm au-dessus + demi-épaisseur

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

    // Barre horizontale (tringle)
    const bar = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, MUL_W, 8),
      mulMat,
    );
    bar.rotation.x = Math.PI / 2;
    bar.position.set(MUL_D, MUL_MOUNT_Y, mulCZ);
    scene.add(bar);

    // 2 supports muraux
    for (const dz of [-MUL_W / 2 + 5, MUL_W / 2 - 5]) {
      // Bras horizontal (du mur vers la barre)
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(MUL_D, 2, 2),
        bracketMat,
      );
      arm.position.set(MUL_D / 2, MUL_MOUNT_Y, mulCZ + dz);
      scene.add(arm);

      // Plaque murale
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 10, 8),
        bracketMat,
      );
      plate.position.set(0.75, MUL_MOUNT_Y, mulCZ + dz);
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
      scene.add(clip);

      // Corps du pantalon (2 jambes côte à côte)
      for (const dx of [-7, 7]) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(pantW / 2 - 1.5, pantH, pantT),
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
    const TV_W = 70; // 70cm
    const TV_H = 40; // 40cm
    const TV_D = 1.5; // épaisseur
    const TV_Y = WALL_H - 10 - TV_H / 2; // 10cm du plafond

    const tvMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.3,
      metalness: 0.4,
    });
    const tv = new THREE.Mesh(new THREE.BoxGeometry(TV_W, TV_H, TV_D), tvMat);
    tv.position.set(ROOM_W - 25, TV_Y, 25);
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
      new THREE.PlaneGeometry(TV_W - 3, TV_H - 3),
      screenMat,
    );
    screen.position.set(ROOM_W - 25, TV_Y, 25);
    screen.rotation.y = (3 * Math.PI) / 4;
    screen.translateZ(TV_D / 2 + 0.1);
    scene.add(screen);
  }

  // =============================================
  // DESSERTE SUNNERSTA 56x36x90cm - Entre lit et Kallax 1x4, mur B
  // =============================================
  {
    const SW = 56; // 56cm le long de X (largeur)
    const SD = 36; // 36cm le long de Z (profondeur)
    const SH = 90; // 90cm hauteur
    const LEG_T = 1.5;
    const SHELF_T = 1;

    // Position : contre mur B, entre lit (fin ~Z=273.5) et Kallax 1x4 (début ~Z=304)
    const sCX = ROOM_W - SW / 2;
    const sCZ = 289;

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
    for (const sy of [5, SH / 2, SH - 5]) {
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
          new THREE.CylinderGeometry(1.5, 1.5, 1.2, 8),
          wheelMat,
        );
        wheel.position.set(
          sCX + dx * (SW / 2 - 3),
          0.6,
          sCZ + dz * (SD / 2 - 3),
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
    scootGroup.position.set(282, 0, 460);
    scootGroup.rotation.y = 0; // avant vers +Z (vers le couloir)

    const WHEEL_R = 5;
    const DECK_L = 55;
    const DECK_W = 15;
    const DECK_H = 2;
    const DECK_Y = WHEEL_R + 3;
    const STEM_H = 90;
    const STEM_R = 1.5;
    const HBAR_W = 47;
    const FRONT_Z = -DECK_L / 2 + 3;

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
      new THREE.BoxGeometry(DECK_W - 1, 0.2, DECK_L - 6),
      gripMat,
    );
    grip.position.set(0, DECK_Y + DECK_H / 2 + 0.1, 0);
    scootGroup.add(grip);

    // Roue avant
    const wheelGeo = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 3, 16);
    const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, WHEEL_R, FRONT_Z);
    scootGroup.add(frontWheel);

    // Roue arrière
    const rearWheel = new THREE.Mesh(wheelGeo, wheelMat);
    rearWheel.rotation.z = Math.PI / 2;
    rearWheel.position.set(0, WHEEL_R, DECK_L / 2 - 3);
    scootGroup.add(rearWheel);

    // Garde-boue arrière
    const fender = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.6, WHEEL_R * 1.5),
      scootMat,
    );
    fender.position.set(0, WHEEL_R * 1.6, DECK_L / 2 - 1);
    fender.rotation.x = -0.3;
    scootGroup.add(fender);

    // Fourche avant (2 tiges)
    for (const side of [-2, 2]) {
      const forkTube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, DECK_Y - WHEEL_R + 1, 6),
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
        new THREE.CylinderGeometry(1.8, 1.8, 8, 8),
        scootAccentMat,
      );
      gripHandle.rotation.z = Math.PI / 2;
      gripHandle.position.set(side * (HBAR_W / 2 - 3), 0, 0);
      hbarGroup.add(gripHandle);
    }

    scootGroup.add(hbarGroup);

    // Phare avant
    const headlight = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 0.5, 8),
      scootAccentMat,
    );
    headlight.rotation.x = Math.PI / 2;
    headlight.position.set(0, DECK_Y + STEM_H - 10, FRONT_Z - 2);
    scootGroup.add(headlight);

    scene.add(scootGroup);
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

    addFniss(110, 500);    // SDB, à côté meuble vasque
    addFniss(75, 260);  // Séjour, en face du congélateur
  }

  // =============================================
  // CANAPÉ DE JARDIN (rouge, côté est)
  // =============================================
  {
    const SOFA_W = 160;   // 160cm le long de Z
    const SOFA_D = 60;    // 60cm profondeur (X)
    const SOFA_H = 90;    // 90cm hauteur totale
    const SEAT_H = 40;    // 40cm hauteur assise
    const BACK_T = 10;    // 10cm épaisseur dossier
    const ARM_W = 10;     // 10cm largeur accoudoir
    const ARM_H = 60;     // 60cm hauteur accoudoir

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

    sofaGroup.position.set(300 - SOFA_D / 2, 0, -110);
    scene.add(sofaGroup);
  }

  // =============================================
  // CANAPÉ DE JARDIN 2 (rouge, sans accoudoirs, côté est)
  // =============================================
  {
    const S2_W = 100;    // 100cm le long de Z
    const S2_D = 60;     // 60cm profondeur (X)
    const S2_H = 100;    // 100cm hauteur totale
    const S2_SEAT = 40;  // 40cm hauteur assise
    const S2_BACK = 10;  // 10cm épaisseur dossier

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
    sofa2Group.position.set(310 - 60 - 60 - S2_D / 2 - 60, 0, -90);
    scene.add(sofa2Group);
  }

  // =============================================
  // CHAISE PLIANTE IKEA VIHALS (rouge)
  // =============================================
  {
    const VH_W = 43;     // 43cm largeur
    const VH_D = 47;     // 47cm profondeur
    const VH_H = 80;       // 80cm hauteur totale
    const VH_SEAT_H = 45; // 45cm hauteur assise
    const VH_SEAT_W = 39; // 39cm largeur assise
    const VH_SEAT_D = 41; // 41cm profondeur assise
    const VH_SEAT_T = 2; // épaisseur assise
    const VH_BACK_H = VH_H - VH_SEAT_H; // 35 hauteur dossier
    const VH_LEG_R = 1.2; // rayon tubes

    const vhRedMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.5 });
    const legGeo = new THREE.CylinderGeometry(VH_LEG_R, VH_LEG_R, 10, 6);

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
      leg.scale.y = VH_SEAT_H / 10;
      leg.position.set(sx * (VH_W / 2 - VH_LEG_R), VH_SEAT_H / 2, VH_SEAT_D / 2 - 3);
      vhGroup.add(leg);
    }

    // Pieds arrière (montants du dossier, jusqu'en haut)
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, vhRedMat);
      leg.scale.y = VH_H / 10;
      leg.position.set(sx * (VH_W / 2 - VH_LEG_R), VH_H / 2, -VH_SEAT_D / 2 + 3);
      leg.rotation.x = backAngle * 0.5;
      vhGroup.add(leg);
    }

    // Traverse avant + arrière
    for (const tz of [VH_SEAT_D / 2 - 3, -VH_SEAT_D / 2 + 3]) {
      const bar = new THREE.Mesh(legGeo, vhRedMat);
      bar.rotation.z = Math.PI / 2;
      bar.scale.y = (VH_W - VH_LEG_R * 4) / 10;
      bar.position.set(0, VH_SEAT_H * 0.3, tz);
      vhGroup.add(bar);
    }

    vhGroup.position.set(200, 0, 100);
    scene.add(vhGroup);
  }

  // =============================================
  // CAILLEBOTIS ALTAPPEN IKEA (blanc, 30×30cm)
  // Zone jardin Z=-290 → Z=-160
  // =============================================
  {
    const ALT_S = 30;       // 30cm
    const ALT_H = 2;    // ~2cm épaisseur
    const ALT_GAP = 0.6; // espacement entre dalles

    const altMat = new THREE.MeshStandardMaterial({
      color: 0xf0ece4, roughness: 0.55,
    });
    const altGeo = new THREE.BoxGeometry(
      ALT_S - ALT_GAP, ALT_H, ALT_S - ALT_GAP,
    );

    const Z0 = -290;
    const Z1 = -160;
    const X_RIGHT = 310;

    // Limite gauche jardin (même formule que floor.js)
    function gardenX0(z) {
      if (z + 5 >= -140) return -10;
      return Math.ceil((-10 - 110 * (z + 5 + 140) / 70) / 10) * 10;
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

  // =============================================
  // COFFRE BANC YITAHOME 100 Gal (gris, 122×55×62cm)
  // Derrière le canapé ouest (sofa 2)
  // =============================================
  {
    const CB_L = 122;   // 122cm le long de Z
    const CB_W = 55;    // 55cm profondeur (X)
    const CB_H = 62;    // 62cm hauteur
    const LID_H = 3;   // couvercle

    const cbMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a, roughness: 0.6,
    });
    const cbLidMat = new THREE.MeshStandardMaterial({
      color: 0x555555, roughness: 0.5,
    });

    // Sofa 2 : dos à X≈70, Z=-80
    const cbX = 70 - CB_W / 2;  // juste derrière le dossier
    const cbZ = -90;

    // Corps
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(CB_W, CB_H - LID_H, CB_L),
      cbMat,
    );
    body.position.set(cbX, (CB_H - LID_H) / 2, cbZ);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);

    // Couvercle (légèrement plus large)
    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(CB_W + 1.5, LID_H, CB_L + 1.5),
      cbLidMat,
    );
    lid.position.set(cbX, CB_H - LID_H / 2, cbZ);
    lid.castShadow = true;
    scene.add(lid);

    // Poignées latérales (2 côtés Z)
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a, roughness: 0.4,
    });
    for (const dz of [-1, 1]) {
      const handle = new THREE.Mesh(
        new THREE.BoxGeometry(15, 3, 1.5),
        handleMat,
      );
      handle.position.set(cbX, CB_H * 0.55, cbZ + dz * (CB_L / 2 + 0.8));
      scene.add(handle);
    }
  }

  // =============================================
  // CASQUETTE ROUGE - Mur B, 1m au-dessus du lit
  // =============================================
  {
    const CAP_R = 9;     // rayon calotte ~9cm
    const BAND_H = 6;   // hauteur bande tour de tête ~6cm
    const VISOR_L = 7;   // longueur visière ~7cm
    const VISOR_W = 14;   // largeur visière

    const capMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.65 });

    const capGroup = new THREE.Group();

    // Construction locale : calotte vers +Y, visière vers -X
    // Bande tour de tête (cylindre ouvert)
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(CAP_R, CAP_R, BAND_H, 20, 1, true),
      capMat,
    );
    capGroup.add(band);

    // Calotte (demi-sphère sur la bande)
    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(CAP_R, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      capMat,
    );
    crown.position.y = BAND_H / 2;
    crown.castShadow = true;
    capGroup.add(crown);

    // Bouton sommital
    const button = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 8, 4),
      capMat,
    );
    button.position.y = BAND_H / 2 + CAP_R;
    capGroup.add(button);

    // Visière arrondie (shape X→-X extension, shape Y→Z largeur, rot PI/2 autour X)
    const visorShape = new THREE.Shape();
    const VR = VISOR_W / 2;
    const VL = VISOR_L;
    const cr = 2;
    visorShape.moveTo(0, -VR);
    visorShape.lineTo(-VL + cr, -VR);
    visorShape.quadraticCurveTo(-VL, -VR, -VL, -VR + cr);
    visorShape.lineTo(-VL, VR - cr);
    visorShape.quadraticCurveTo(-VL, VR, -VL + cr, VR);
    visorShape.lineTo(0, VR);
    visorShape.closePath();
    const visorGeo = new THREE.ExtrudeGeometry(visorShape, {
      depth: 0.6, bevelEnabled: false,
    });
    const visor = new THREE.Mesh(visorGeo, capMat);
    visor.rotation.x = Math.PI / 2;
    visor.position.set(-CAP_R + 1, -BAND_H / 2, 0);
    visor.castShadow = true;
    capGroup.add(visor);

    // Rotation 90° : dome → -X (vers la pièce), ouverture → +X (mur), visière → bas
    capGroup.rotation.z = Math.PI / 2;
    capGroup.position.set(299, 144, 173.5);
    scene.add(capGroup);
  }

  // =============================================
  // DESSERTE IKEA VIGGJA (blanc, 37×50×74cm)
  // À côté du canapé ouest (côté sud)
  // =============================================
  {
    const VG_W = 37;     // 37cm (le long de Z)
    const VG_D = 50;     // 50cm (le long de X)
    const VG_H = 74;     // 74cm hauteur
    const TOP_Y = 50.8;   // plateau haut à 50.8cm
    const BOT_Y = 22.9;   // plateau bas à 22.9cm
    const TRAY_T = 1;   // épaisseur fond plateau
    const TRAY_RIM = 2.5; // hauteur rebord
    const LEG_R = 0.8;   // rayon tube acier

    const vgMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.35 });
    const vgFrameMat = new THREE.MeshStandardMaterial({
      color: 0xe8e8e8, roughness: 0.3, metalness: 0.3,
    });

    const vgGroup = new THREE.Group();

    // 4 pieds (tubes verticaux, légèrement inclinés vers l'extérieur)
    const legGeo = new THREE.CylinderGeometry(LEG_R, LEG_R, VG_H, 6);
    for (const dx of [-1, 1]) {
      for (const dz of [-1, 1]) {
        const leg = new THREE.Mesh(legGeo, vgFrameMat);
        leg.position.set(
          dx * (VG_D / 2 - 3),
          VG_H / 2,
          dz * (VG_W / 2 - 2),
        );
        vgGroup.add(leg);
      }
    }

    // Traverses horizontales (bas, connectent les pieds en X)
    for (const dz of [-1, 1]) {
      const bar = new THREE.Mesh(
        new THREE.CylinderGeometry(LEG_R, LEG_R, VG_D - 6, 6),
        vgFrameMat,
      );
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, 4, dz * (VG_W / 2 - 2));
      vgGroup.add(bar);
    }

    // Plateaux (2 : bas et haut)
    function addTray(y) {
      // Fond
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(VG_D - 4, TRAY_T, VG_W - 3),
        vgMat,
      );
      base.position.y = y;
      base.receiveShadow = true;
      vgGroup.add(base);

      // Rebords (4 côtés)
      for (const dz of [-1, 1]) {
        const rim = new THREE.Mesh(
          new THREE.BoxGeometry(VG_D - 4, TRAY_RIM, TRAY_T),
          vgMat,
        );
        rim.position.set(0, y + TRAY_RIM / 2, dz * (VG_W / 2 - 1.5));
        vgGroup.add(rim);
      }
      for (const dx of [-1, 1]) {
        const rim = new THREE.Mesh(
          new THREE.BoxGeometry(TRAY_T, TRAY_RIM, VG_W - 3),
          vgMat,
        );
        rim.position.set(dx * (VG_D / 2 - 2), y + TRAY_RIM / 2, 0);
        vgGroup.add(rim);
      }
    }

    addTray(BOT_Y);
    addTray(TOP_Y);

    // Position : côté sud du canapé ouest (sofa2 à X=100, Z=-80, spans Z=-130→-30)
    vgGroup.position.set(100, 0, -140 - VG_W / 2 - 3);
    scene.add(vgGroup);
  }

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

    function addMannequin(x, baseY, z, rotY) {
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

      g.rotation.y = rotY;
      g.position.set(x, baseY, z);
      scene.add(g);
    }

    // 1) Sur desserte SUNNERSTA (sCX=272, sCZ=289, top Y=90)
    addMannequin(ROOM_W - 56 / 2, 90, 289, 0);

    // 2) Sur Kallax NW empilé 2×1+1×1+1×1 pivoté (top≈156.5), face centre séjour
    const k14CX = KALLAX_DEPTH / 2;
    const k14CZ = kallaxW(1) / 2;
    const k14Top = kallaxW(2) + kallaxW(1) * 2;
    addMannequin(k14CX, k14Top, k14CZ,
      Math.atan2(150 - k14CX, 200 - k14CZ));

    // 3) Sur étagère LACK mur A (cx=13, cz=225, top≈191), face centre séjour
    const lackCX = 26 / 2;  // LACK_D / 2
    const lackCZ = NICHE_Z_START - 110 / 2;  // 280 - 55 = 225
    const lackTopY = 6 + 160 + 20 + 5;  // M4_TOP_Y + 20 + LACK_H = 191
    addMannequin(lackCX, lackTopY, lackCZ,
      Math.atan2(150 - lackCX, 200 - lackCZ));
  }

  // =============================================
  // NINJA FOODI 8-en-1 — Kallax cuisine, étagère spec (planche milieu retirée)
  // 51cm largeur × 19cm hauteur × 37cm profondeur
  // =============================================
  {
    const NF_W = 51;     // 51cm largeur (le long de Z dans le Kallax)
    const NF_H = 19;     // 19cm hauteur
    const NF_D = 37;     // 37cm profondeur (le long de X)

    // Posé sur l'étagère médiane de la pièce spec (2×2 milieu)
    // = top du 2×2 base + centre du spec + demi-épaisseur étagère
    const k25CX = -NICHE_DEPTH + KALLAX_DEPTH / 2;
    const k25CZ = ROOM_D - kallaxW(2) / 2;
    const shelfTopY = kallaxH(2) + kallaxH(2) / 2 + KALLAX_PANEL / 2;

    const nfBlack = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, roughness: 0.4, metalness: 0.2,
    });
    const nfSilver = new THREE.MeshStandardMaterial({
      color: 0xb0b0b0, roughness: 0.3, metalness: 0.5,
    });

    const nfGroup = new THREE.Group();

    // Corps principal (boîtier rectangulaire noir)
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(NF_D, NF_H, NF_W),
      nfBlack,
    );
    body.position.y = NF_H / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    nfGroup.add(body);

    // Couvercle / dessus (légèrement plus large, argenté)
    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(NF_D + 1, 1, NF_W + 1),
      nfSilver,
    );
    lid.position.y = NF_H;
    nfGroup.add(lid);

    // Panneau de contrôle (face avant)
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(NF_D * 0.6, NF_H * 0.5, 0.5),
      nfSilver,
    );
    panel.position.set(0, NF_H * 0.55, NF_W / 2 + 0.3);
    nfGroup.add(panel);

    // Écran LCD
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(12, 5, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x003322, roughness: 0.1, metalness: 0.3 }),
    );
    screen.position.set(0, NF_H * 0.6, NF_W / 2 + 0.6);
    nfGroup.add(screen);

    // Poignée sur le couvercle
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(15, 1.5, 3),
      nfSilver,
    );
    handle.position.set(0, NF_H + 1.5, 0);
    nfGroup.add(handle);

    nfGroup.position.set(k25CX, shelfTopY, k25CZ);
    scene.add(nfGroup);
  }
}
