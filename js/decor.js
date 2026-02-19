import * as THREE from 'three';
import { ROOM_W, ROOM_D, WALL_H, PLATE_H, GAP, NICHE_DEPTH, NICHE_Z_START, KITCHEN_X0, KITCHEN_X1, KITCHEN_DEPTH } from './config.js';
import { fillRow, allBricks } from './brickHelpers.js';
import { addSingleDrona } from './drona.js';

export function buildDecor(scene) {
  // =============================================
  // 4 DRONA - 2 sur MACKAPÄR, 2 sur Kallax 2x5
  // =============================================
  {
    const DS = 3; // taille cellule Drona

    // 2 sur MACKAPÄR
    const mpTopY = 20;
    const mpCX = -NICHE_DEPTH + 7.8 / 2;
    const mpCZ = (ROOM_D - (2 * 3.3 + 3 * 0.15)) - 3.2 / 2;

    addSingleDrona(scene, mpCX - 1.8, mpTopY + DS / 2, mpCZ, DS, DS, DS);
    addSingleDrona(scene, mpCX + 1.8, mpTopY + DS / 2, mpCZ, DS, DS, DS);

    // 1 sur Kallax 2x3 (angle C+B)
    const k1TopY = 3 * 3.3 + 4 * 0.15; // 10.5
    const k1CX = ROOM_W - 2; // 28
    const k1CZ = (2 * 3.3 + 3 * 0.15) / 2; // 3.525
    addSingleDrona(scene, k1CX, k1TopY + DS / 2, k1CZ, DS, DS, DS);

    // 2 sur Kallax 2x5
    const k4TopY = 17.4 + 0.075;
    const k4CX = -NICHE_DEPTH + 4 / 2;
    const k4CZ = ROOM_D - (2 * 3.3 + 3 * 0.15) / 2;

    addSingleDrona(scene, k4CX, k4TopY + DS / 2, k4CZ - 1.8, DS, DS, DS);
    addSingleDrona(scene, k4CX, k4TopY + DS / 2, k4CZ + 1.8, DS, DS, DS);
  }

  // =============================================
  // 3 DRONA - sur le meuble haut cuisine
  // =============================================
  {
    const CELL = 3.3;
    const MARGIN = 0.15;
    const dronaW = CELL - MARGIN * 2;  // 3.0
    const dronaH = CELL - MARGIN * 2;  // 3.0
    const HC_D = 4;
    const dronaD = HC_D - 0.6;         // 3.4

    const hcTopY = 19.5;
    const hcCZ = ROOM_D + KITCHEN_DEPTH - HC_D / 2;
    const KIT_W = KITCHEN_X1 - KITCHEN_X0;

    const gap = (KIT_W - 3 * dronaW) / 4;

    for (let i = 0; i < 3; i++) {
      const cx = KITCHEN_X0 + gap + dronaW / 2 + i * (dronaW + gap);
      addSingleDrona(scene, cx, hcTopY + dronaH / 2, hcCZ, dronaD, dronaH, dronaW);
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

    const frzMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.2 });
    const frzMatDark = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(FRZ_D, FRZ_H, FRZ_W), frzMat);
    body.position.set(frzX, frzBaseY + FRZ_H / 2, frzZ);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, FRZ_H - 0.4, FRZ_W - 0.3),
      frzMat
    );
    door.position.set(frzX + FRZ_D / 2 + 0.04, frzBaseY + FRZ_H / 2, frzZ);
    scene.add(door);

    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 2.5, 0.15),
      frzMatDark
    );
    handle.position.set(frzX + FRZ_D / 2 + 0.1, frzBaseY + FRZ_H / 2, frzZ + FRZ_W / 2 - 0.5);
    scene.add(handle);

    for (const dz of [-1, 1]) {
      for (const dx of [-1, 1]) {
        const foot = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.15, 0.15, 8),
          frzMatDark
        );
        foot.position.set(
          frzX + dx * (FRZ_D / 2 - 0.3),
          frzBaseY + 0.075,
          frzZ + dz * (FRZ_W / 2 - 0.3)
        );
        scene.add(foot);
      }
    }

    // Drona sur le congélateur
    const DS = 3;
    addSingleDrona(scene, frzX, frzBaseY + FRZ_H + DS / 2, frzZ, DS, DS, DS);
  }

  // =============================================
  // ÉTAGÈRE LACK IKEA 110x26cm - Mur MA
  // 20cm au-dessus du miroir 4 (70x160), alignée avec le bout du mur MA (Z=28)
  // =============================================
  {
    const LACK_W = 11;   // 110cm le long de Z
    const LACK_D = 2.6;  // 26cm profondeur le long de X
    const LACK_H = 0.5;  // 5cm épaisseur

    // Miroir 4 : top Y = 0.6 + 16 = 16.6
    const M4_TOP_Y = 0.6 + 16;
    const LACK_Y = M4_TOP_Y + 2 + LACK_H / 2; // 20cm au-dessus + demi-épaisseur

    // Aligné avec le bout du mur MA (Z=28)
    const LACK_Z1 = NICHE_Z_START; // 28
    const LACK_CZ = LACK_Z1 - LACK_W / 2; // 22.5
    const LACK_CX = LACK_D / 2; // 1.3

    const lackMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(LACK_D, LACK_H, LACK_W),
      lackMat
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
    const MUL_W = 8;    // 80cm le long de Z
    const MUL_D = 2.6;  // 26cm profondeur depuis le mur
    const MUL_MOUNT_Y = 24 - 2; // 20cm du plafond (WALL_H=24, 2 studs en dessous)

    const mulZ0 = NICHE_Z_START - 11; // 17 (après étagère)
    const mulCZ = mulZ0 - MUL_W / 2;  // 13

    const mulMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.3 });
    const r = 0.15;

    // Barre horizontale (tringle)
    const bar = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, MUL_W, 8),
      mulMat
    );
    bar.rotation.x = Math.PI / 2;
    bar.position.set(MUL_D, MUL_MOUNT_Y, mulCZ);
    scene.add(bar);

    // 2 supports muraux
    for (const dz of [-MUL_W / 2 + 0.5, MUL_W / 2 - 0.5]) {
      // Bras horizontal (du mur vers la barre)
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(MUL_D, 0.2, 0.2),
        bracketMat
      );
      arm.position.set(MUL_D / 2, MUL_MOUNT_Y, mulCZ + dz);
      scene.add(arm);

      // Plaque murale
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 1, 0.8),
        bracketMat
      );
      plate.position.set(0.075, MUL_MOUNT_Y, mulCZ + dz);
      scene.add(plate);
    }

    // 3 pantalons rouges suspendus
    const pantMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.7 });
    const pantClipMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.3 });
    const pantH = 6;   // 60cm de longueur
    const pantW = 3.5; // 35cm plié (le long de X)
    const pantT = 0.25; // épaisseur tissu

    for (const pz of [mulCZ - 2.5, mulCZ, mulCZ + 2.5]) {
      // Pince sur la barre
      const clip = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.5, 0.4),
        pantClipMat
      );
      clip.position.set(MUL_D, MUL_MOUNT_Y + 0.15, pz);
      scene.add(clip);

      // Corps du pantalon (2 jambes côte à côte)
      for (const dx of [-0.7, 0.7]) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(pantW / 2 - 0.15, pantH, pantT),
          pantMat
        );
        leg.position.set(MUL_D + dx, MUL_MOUNT_Y - pantH / 2, pz);
        leg.castShadow = true;
        scene.add(leg);
      }
    }
  }

  // =============================================
  // SOL LEGO VERT - Jardin (quadrilatère délimité par pointillés)
  // Couvre tout le jardin : pleine largeur Z>=-14, puis suit la diagonale
  // =============================================
  {
    const JC_Z = -14 - 19 * 32 / 31; // ≈ -33.61
    const zStart = Math.ceil(JC_Z);   // -34

    for (let z = zStart; z < -1; z++) {
      let x0 = -1;
      if (z + 0.5 < -14) {
        // En dessous du départ de la diagonale : limiter X à gauche
        x0 = Math.ceil(-1 - 31 * (z + 0.5 + 14) / 19);
      }
      const x1 = 31;
      const w = x1 - x0;
      if (w <= 0) continue;

      for (const b of fillRow(w, Math.abs(z) % 2 === 1)) {
        allBricks.push({
          x: x0 + b.start + b.size / 2, y: -1/3, z: z + 0.5,
          sx: b.size - GAP, sy: PLATE_H - GAP, sz: 1 - GAP,
          len: b.size, axis: 'x', type: 'grass'
        });
      }
    }
  }

  // =============================================
  // ÉCRAN TV 70x40cm - Angle mur C + B
  // =============================================
  {
    const TV_W = 7;    // 70cm
    const TV_H = 4;    // 40cm
    const TV_D = 0.15; // épaisseur
    const TV_Y = WALL_H - 1 - TV_H / 2; // 10cm du plafond

    const tvMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.4 });
    const tv = new THREE.Mesh(new THREE.BoxGeometry(TV_W, TV_H, TV_D), tvMat);
    tv.position.set(ROOM_W - 2.5, TV_Y, 2.5);
    tv.rotation.y = 3 * Math.PI / 4; // face vers le centre du séjour
    tv.castShadow = true;
    scene.add(tv);

    // Écran (face avant, légèrement en avant)
    const screenMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.05, metalness: 0.8 });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(TV_W - 0.3, TV_H - 0.3), screenMat);
    screen.position.set(ROOM_W - 2.5, TV_Y, 2.5);
    screen.rotation.y = 3 * Math.PI / 4;
    screen.translateZ(TV_D / 2 + 0.01);
    scene.add(screen);
  }
}
