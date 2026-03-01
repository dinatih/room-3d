import * as THREE from "three";
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

    // 2 sur MACKAPÄR (tournées 90° pour aligner profondeur avec le meuble)
    const mpTopY = 200;
    const mpCX = -NICHE_DEPTH + 78 / 2;
    const mpCZ = ROOM_D - kallaxW(2) - 32 / 2;

    addSingleDrona(scene, mpCX - 20, mpTopY + DF / 2, mpCZ, DF, DF, DD, Math.PI / 2);
    addSingleDrona(scene, mpCX + 20, mpTopY + DF / 2, mpCZ, DF, DF, DD, Math.PI / 2);

    // 1 sur Kallax NE empilé 2×1+2×2 (angle C+B), poussé contre mur C (Z=0)
    const k1TopY = kallaxH(1) + kallaxH(2);
    const k1CX = ROOM_W - 20; // 280
    addSingleDrona(scene, k1CX, k1TopY + DF / 2, DD / 2, DF, DF, DD);

    // 2 sur Kallax cuisine empilé 2×2+2×2+2×1
    const k4TopY = kallaxH(2) * 2 + kallaxH(1);
    const k4CX = -NICHE_DEPTH + KALLAX_DEPTH / 2;
    const k4CZ = ROOM_D - kallaxW(2) / 2;

    addSingleDrona(scene, k4CX, k4TopY + DF / 2, k4CZ - 18, DF, DF, DD, Math.PI / 2);
    addSingleDrona(scene, k4CX, k4TopY + DF / 2, k4CZ + 18, DF, DF, DD, Math.PI / 2);

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
    // Plaquées contre mur du fond (KITCHEN_Z), profondeur 38cm le long de Z
    // Débordent de ~2cm du meuble (HC_D=40, Drona=38 plaqué au fond)
    const hcCZ = KITCHEN_Z - dronaDepth / 2;
    const KIT_W = KITCHEN_X1 - KITCHEN_X0;

    const gap = (KIT_W - 3 * dronaFace) / 4;

    for (let i = 0; i < 3; i++) {
      const cx = KITCHEN_X0 + gap + dronaFace / 2 + i * (dronaFace + gap);
      addSingleDrona(scene, cx, hcTopY + dronaFace / 2, hcCZ,
        dronaFace, dronaFace, dronaDepth);
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
    capGroup.position.set(297, 144, 173.5);
    scene.add(capGroup);
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

    // 1) Sur desserte SUNNERSTA (tournée 90°, centre X=282, Z=271.5, top Y=90)
    addMannequin(ROOM_W - 36 / 2, 90, 299.5 - 56 / 2, 0);

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
