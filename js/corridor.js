import * as THREE from 'three';
import { ROOM_W, ROOM_D, NUM_LAYERS, WALL_H, BRICK_H, PLATE_H, GAP, STUD_R, STUD_HT, DOOR_START, DOOR_END, DOOR_H_LAYERS, NICHE_DEPTH, KITCHEN_X1, KITCHEN_Z } from './config.js';
import { fillRow, addBrickX, addBrickZ, allBricks } from './brickHelpers.js';
import { makeText } from './labels.js';

export function buildCorridor(scene) {
  const WALL_X = DOOR_START - 0.5;
  const WALL_Z0 = ROOM_D + 1; // après l'épaisseur du mur D

  // Mur gauche du couloir : commence à MS-N (Z=46), 14 studs jusqu'à Z=60
  const LEFT_WALL_LEN = 14;
  const LEFT_WALL_Z0 = KITCHEN_Z; // Z=46

  // Porte SDB : 8 studs (80cm), 7 couches, 1 stud du bout
  const C_DOOR_W = 8;
  const C_DOOR_START = LEFT_WALL_LEN - 1 - C_DOOR_W; // = 5
  const C_DOOR_END = C_DOOR_START + C_DOOR_W;         // = 13

  // Mur gauche du couloir (côté SDB) avec porte
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    let skipS, skipE;
    if (layer < DOOR_H_LAYERS) {
      skipS = C_DOOR_START - 1;
      skipE = C_DOOR_END + 1;
    } else if (layer === DOOR_H_LAYERS) {
      skipS = C_DOOR_START;
      skipE = C_DOOR_END;
    } else {
      skipS = skipE = -1;
    }

    for (const b of fillRow(LEFT_WALL_LEN, layer % 2 === 1)) {
      const bS = b.start;
      const bE = bS + b.size;

      if (skipS >= 0 && bE > skipS && bS < skipE) {
        if (bS < skipS)
          addBrickZ(WALL_X, layer, LEFT_WALL_Z0 + bS, skipS - bS, 'wall');
        if (bE > skipE)
          addBrickZ(WALL_X, layer, LEFT_WALL_Z0 + skipE, bE - skipE, 'wall');
      } else {
        addBrickZ(WALL_X, layer, LEFT_WALL_Z0 + bS, b.size, 'wall');
      }
    }
  }

  // Encadrement porte SDB (accent rouge)
  for (let layer = 0; layer < DOOR_H_LAYERS; layer++) {
    addBrickZ(WALL_X, layer, LEFT_WALL_Z0 + C_DOOR_START - 1, 1, 'accent');
    addBrickZ(WALL_X, layer, LEFT_WALL_Z0 + C_DOOR_END, 1, 'accent');
  }
  addBrickZ(WALL_X, DOOR_H_LAYERS, LEFT_WALL_Z0 + C_DOOR_START, C_DOOR_W, 'accent');

  // =============================================
  // PLACARD COULISSANT (X=13→19, Z=41→46)
  // Porte coulissante + 3 étagères
  // =============================================
  {
    const CLOSET_X0 = KITCHEN_X1; // 13
    const CLOSET_X1 = DOOR_START; // 19
    const CLOSET_Z0 = WALL_Z0;   // 41
    const CLOSET_Z1 = KITCHEN_Z;  // 46
    const CLOSET_W = CLOSET_X1 - CLOSET_X0; // 6
    const CLOSET_D = CLOSET_Z1 - CLOSET_Z0; // 5
    const CLOSET_CX = (CLOSET_X0 + CLOSET_X1) / 2; // 16
    const CLOSET_CZ = (CLOSET_Z0 + CLOSET_Z1) / 2; // 43.5

    // 3 étagères
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.4 });
    const shelfT = 0.3;
    for (const shelfY of [6, 12, 18]) {
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(CLOSET_W - 0.4, shelfT, CLOSET_D - 0.4),
        shelfMat
      );
      shelf.position.set(CLOSET_CX, shelfY, CLOSET_CZ);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      scene.add(shelf);
    }

    // Porte coulissante (panneau à X=19)
    const slideMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
    const slideH = WALL_H - 1;
    const slidePanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, slideH, CLOSET_D - 0.2),
      slideMat
    );
    slidePanel.position.set(CLOSET_X1 - 0.1, slideH / 2, CLOSET_CZ);
    slidePanel.castShadow = true;
    scene.add(slidePanel);

    // Rail haut
    const railMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.3 });
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.3, CLOSET_D),
      railMat
    );
    rail.position.set(CLOSET_X1 - 0.1, slideH + 0.15, CLOSET_CZ);
    scene.add(rail);

    // Rail bas
    const railBot = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.15, CLOSET_D),
      railMat
    );
    railBot.position.set(CLOSET_X1 - 0.1, 0.075, CLOSET_CZ);
    scene.add(railBot);

    // Poignée
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8, roughness: 0.2 });
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 2, 0.3),
      handleMat
    );
    handle.position.set(CLOSET_X1 + 0.05, WALL_H / 2, CLOSET_CZ);
    scene.add(handle);

    // Sol placard
    const CLOSET_FLOOR_W = CLOSET_W;
    for (let z = CLOSET_Z0; z < CLOSET_Z1; z++) {
      for (const b of fillRow(CLOSET_FLOOR_W, z % 2 === 1)) {
        allBricks.push({
          x: CLOSET_X0 + b.start + b.size / 2, y: -1/3, z: z + 0.5,
          sx: b.size - GAP, sy: PLATE_H - GAP, sz: 1 - GAP,
          len: b.size, axis: 'x', type: 'floor'
        });
      }
    }
  }

  // Mur droit du couloir (en face de la porte SDB), 1m30 = 13 studs
  const CORR_RIGHT_X = ROOM_W + 0.5; // aligné avec mur B est
  const CORR_RIGHT_LEN = 13;
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(CORR_RIGHT_LEN, layer % 2 === 1))
      addBrickZ(CORR_RIGHT_X, layer, WALL_Z0 + b.start, b.size, 'wall');
  }

  // Mur salle de bain côté niche (parallèle au couloir), 1m40 = 14 studs
  const SDB_WALL_LEN = 14;
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(SDB_WALL_LEN, layer % 2 === 1))
      addBrickZ(-NICHE_DEPTH - 0.5, layer, KITCHEN_Z + b.start, b.size, 'wall');
  }

  // =============================================
  // Mur fond SDB (Z=60) avec ouverture douche
  // =============================================
  const SDB_W = DOOR_START + NICHE_DEPTH; // 20 studs
  const SDB_Z_END = KITCHEN_Z + SDB_WALL_LEN; // Z=60

  // Douche 70x70cm encastrée dans le mur sud (dépasse au-delà de Z=60)
  const SHOWER_W = 7;  // 70cm
  const SHOWER_D = 7;  // 70cm profondeur (au-delà du mur)
  const SHOWER_X0 = 0; // contre mur ouest
  const SHOWER_X1 = SHOWER_X0 + SHOWER_W; // X=7
  const SHOWER_Z0 = SDB_Z_END;            // Z=60 (face du mur sud)
  const SHOWER_Z1 = SHOWER_Z0 + SHOWER_D; // Z=67 (fond douche)

  // Mur sud SDB (Z=60) : seul raccord X=-1→0 (MS-O vers VDch)
  // Le reste est VDch (X=0→7) + double porte coulissante vitrée (X=7→19)
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    addBrickX(-NICHE_DEPTH, layer, SDB_Z_END + 0.5, NICHE_DEPTH, 'wall');
  }

  // Double porte coulissante vitrée (X=7→19, Z=60)
  {
    const SLIDE_X0 = SHOWER_X1; // 7 (au niveau de MDch)
    const SLIDE_X1 = DOOR_START; // 19 (au niveau de MCo-O)
    const SLIDE_W = SLIDE_X1 - SLIDE_X0; // 12 studs = 120cm
    const SLIDE_CX = (SLIDE_X0 + SLIDE_X1) / 2;
    const SLIDE_Z = SDB_Z_END; // Z=60
    const SLIDE_H = WALL_H - 2;

    const slideGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.2,
      roughness: 0.05,
      side: THREE.DoubleSide,
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3 });

    // Deux panneaux vitrés (6 studs chacun)
    const panelW = SLIDE_W / 2;
    for (const offset of [SLIDE_X0 + panelW / 2, SLIDE_X1 - panelW / 2]) {
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(panelW, SLIDE_H),
        slideGlassMat
      );
      panel.position.set(offset, SLIDE_H / 2, SLIDE_Z);
      scene.add(panel);
    }

    // Barre haute
    const topBar = new THREE.Mesh(
      new THREE.BoxGeometry(SLIDE_W, 0.3, 0.15),
      frameMat
    );
    topBar.position.set(SLIDE_CX, SLIDE_H, SLIDE_Z);
    scene.add(topBar);

    // Rail bas
    const botRail = new THREE.Mesh(
      new THREE.BoxGeometry(SLIDE_W, 0.15, 0.3),
      frameMat
    );
    botRail.position.set(SLIDE_CX, 0.075, SLIDE_Z);
    scene.add(botRail);

    // Montant central (jonction des 2 panneaux)
    const center = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, SLIDE_H, 0.15),
      frameMat
    );
    center.position.set(SLIDE_CX, SLIDE_H / 2, SLIDE_Z);
    scene.add(center);
  }

  // =============================================
  // DOUCHE (recess au-delà du mur sud)
  // =============================================
  const BASE_H = 2;    // cuve 20cm
  const GLASS_H = 18;  // porte vitrée 1.8m

  // Mur ouest douche (prolonge le mur SDB ouest de Z=60 à Z=67)
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(SHOWER_D, layer % 2 === 1))
      addBrickZ(-NICHE_DEPTH - 0.5, layer, SHOWER_Z0 + b.start, b.size, 'wall');
  }

  // Mur est douche (X=7, de Z=60 à Z=67)
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(SHOWER_D, layer % 2 === 1))
      addBrickZ(SHOWER_X1 + 0.5, layer, SHOWER_Z0 + b.start, b.size, 'wall');
  }

  // Mur fond douche (Z=67) — élargi de 1 stud pour rejoindre le mur ouest
  const BACK_W = SHOWER_W + NICHE_DEPTH; // 7 + 1 = 8
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(BACK_W, layer % 2 === 1))
      addBrickX(-NICHE_DEPTH + b.start, layer, SHOWER_Z1 + 0.5, b.size, 'wall');
  }

  // Cuve (base surélevée 20cm = 2 studs)
  const showerCX = (SHOWER_X0 + SHOWER_X1) / 2;
  const showerCZ = (SHOWER_Z0 + SHOWER_Z1) / 2;
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(SHOWER_W, BASE_H, SHOWER_D),
    baseMat
  );
  base.position.set(showerCX, BASE_H / 2, showerCZ);
  base.castShadow = true;
  base.receiveShadow = true;
  scene.add(base);

  // Porte vitrée au niveau du mur sud (Z=60), 1.8m de haut
  const glassBaseY = BASE_H;
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.2,
    roughness: 0.05,
    side: THREE.DoubleSide,
  });
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(SHOWER_W, GLASS_H),
    glassMat
  );
  glass.position.set(showerCX, glassBaseY + GLASS_H / 2, SHOWER_Z0);
  scene.add(glass);

  // Cadre haut de la porte vitrée
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3 });
  const topBar = new THREE.Mesh(
    new THREE.BoxGeometry(SHOWER_W, 0.3, 0.15),
    frameMat
  );
  topBar.position.set(showerCX, glassBaseY + GLASS_H, SHOWER_Z0);
  scene.add(topBar);

  // =============================================
  // WC basique (40cm x 60cm) contre mur SDB Nord, 40cm du mur Ouest
  // =============================================
  const WC_X0 = -NICHE_DEPTH + 4; // 4 studs du mur ouest = X=3
  const WC_W = 4;   // 40cm
  const WC_D = 6;   // 60cm total (réservoir + cuvette)
  const WC_Z0 = KITCHEN_Z; // Z=46 (contre mur nord)
  const WC_CX = WC_X0 + WC_W / 2; // X=5

  const wcMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
  const wcMatDark = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.4 });

  // Réservoir (dos, contre le mur) : 4x2x7 studs
  const tankW = WC_W, tankD = 2, tankH = 7;
  const tank = new THREE.Mesh(
    new THREE.BoxGeometry(tankW, tankH, tankD),
    wcMat
  );
  tank.position.set(WC_CX, tankH / 2, WC_Z0 + tankD / 2);
  tank.castShadow = true;
  tank.receiveShadow = true;
  scene.add(tank);

  // Cuvette (devant le réservoir) : 4x4x4 studs
  const bowlW = WC_W, bowlD = 4, bowlH = 4;
  const bowl = new THREE.Mesh(
    new THREE.BoxGeometry(bowlW, bowlH, bowlD),
    wcMat
  );
  bowl.position.set(WC_CX, bowlH / 2, WC_Z0 + tankD + bowlD / 2);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  scene.add(bowl);

  // Abattant (couvercle sur la cuvette) : légèrement plus grand
  const lidH = 0.3;
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(bowlW + 0.2, lidH, bowlD + 0.2),
    wcMatDark
  );
  lid.position.set(WC_CX, bowlH + lidH / 2, WC_Z0 + tankD + bowlD / 2);
  lid.castShadow = true;
  scene.add(lid);

  // Bouton chasse d'eau (petit cylindre sur le réservoir)
  const flushBtn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8),
    wcMatDark
  );
  flushBtn.position.set(WC_CX, tankH + 0.15, WC_Z0 + tankD / 2);
  scene.add(flushBtn);

  // =============================================
  // Meuble vasque suspendu, contre mur SDB Nord, 40cm du mur Est
  // 60cm x 47cm x 50cm = 6 x 4.7 x 5 studs, à 30cm du sol
  // =============================================
  const VANITY_W = 6;     // 60cm
  const VANITY_D = 4.7;   // 47cm
  const VANITY_H = 5;     // 50cm
  const VANITY_Y0 = 3;    // 30cm du sol
  const VANITY_X1 = DOOR_START - 4; // 40cm du mur est (X=19) = X=15
  const VANITY_X0 = VANITY_X1 - VANITY_W; // X=9
  const VANITY_CX = (VANITY_X0 + VANITY_X1) / 2; // X=12
  const VANITY_CZ = KITCHEN_Z + VANITY_D / 2;     // Z=48.35

  const vanityMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 }); // blanc
  const counterMat = new THREE.MeshStandardMaterial({ color: 0xf8f8f8, roughness: 0.2 }); // blanc plan
  const basinMat = new THREE.MeshStandardMaterial({ color: 0xe0e4e8, roughness: 0.15 }); // vasque céramique

  // Caisson (corps du meuble)
  const caisson = new THREE.Mesh(
    new THREE.BoxGeometry(VANITY_W, VANITY_H, VANITY_D),
    vanityMat
  );
  caisson.position.set(VANITY_CX, VANITY_Y0 + VANITY_H / 2, VANITY_CZ);
  caisson.castShadow = true;
  caisson.receiveShadow = true;
  scene.add(caisson);

  // Plan de travail (dessus, légèrement débordant)
  const counterH = 0.4;
  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(VANITY_W + 0.3, counterH, VANITY_D + 0.15),
    counterMat
  );
  counter.position.set(VANITY_CX, VANITY_Y0 + VANITY_H + counterH / 2, VANITY_CZ + 0.075);
  counter.castShadow = true;
  scene.add(counter);

  // Vasque (encastrée dans le plan, légère dépression)
  const basinW = 3.5, basinD = 2.5, basinH = 1.5;
  const basin = new THREE.Mesh(
    new THREE.BoxGeometry(basinW, basinH, basinD),
    basinMat
  );
  basin.position.set(VANITY_CX, VANITY_Y0 + VANITY_H + counterH - basinH / 2, VANITY_CZ + 0.3);
  basin.receiveShadow = true;
  scene.add(basin);

  // Robinet (petit cylindre vertical + bec horizontal)
  const faucetMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 });
  const faucetBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 2, 8),
    faucetMat
  );
  const faucetTopY = VANITY_Y0 + VANITY_H + counterH;
  faucetBase.position.set(VANITY_CX, faucetTopY + 1, VANITY_CZ - VANITY_D / 2 + 0.8);
  scene.add(faucetBase);

  const faucetSpout = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.15, 1.2),
    faucetMat
  );
  faucetSpout.position.set(VANITY_CX, faucetTopY + 2, VANITY_CZ - VANITY_D / 2 + 0.8 + 0.6);
  scene.add(faucetSpout);

  // =============================================
  // 2 meubles blancs 40x40x60cm dans les coins du mur SDB Nord
  // =============================================
  const CBN_W = 4, CBN_D = 4, CBN_H = 6; // 40x40x60cm
  const cbnMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });

  // Coin ouest (X=-1→3, Z=46→50)
  const cbnW = new THREE.Mesh(new THREE.BoxGeometry(CBN_W, CBN_H, CBN_D), cbnMat);
  cbnW.position.set(-NICHE_DEPTH + CBN_W / 2, CBN_H / 2, KITCHEN_Z + CBN_D / 2);
  cbnW.castShadow = true;
  cbnW.receiveShadow = true;
  scene.add(cbnW);

  // Coin est (X=15→19, Z=46→50)
  const cbnE = new THREE.Mesh(new THREE.BoxGeometry(CBN_W, CBN_H, CBN_D), cbnMat);
  cbnE.position.set(DOOR_START - CBN_W / 2, CBN_H / 2, KITCHEN_Z + CBN_D / 2);
  cbnE.castShadow = true;
  cbnE.receiveShadow = true;
  scene.add(cbnE);

  // =============================================
  // Ballon d'eau chaude 100L vertical, contre mur SDB Ouest
  // Diamètre ~40cm, hauteur ~80cm, 10cm du plafond, 10cm du mur Nord
  // =============================================
  const HW_R = 2;      // rayon 20cm = 2 studs (diam 40cm ≈ 100L)
  const HW_H = 8;      // hauteur 80cm = 8 studs
  const HW_X = -NICHE_DEPTH + HW_R; // centre X = -1 + 2 = 1
  const HW_Y = WALL_H - 1 - HW_H / 2; // 10cm du plafond, haut à 23, centre Y = 19
  const HW_Z = KITCHEN_Z + 1 + HW_R;   // 10cm du mur Nord, centre Z = 47 + 2 = 49

  const hwMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.3 });

  // Corps cylindrique (vertical, axe Y par défaut)
  const hwBody = new THREE.Mesh(
    new THREE.CylinderGeometry(HW_R, HW_R, HW_H, 16),
    hwMat
  );
  hwBody.position.set(HW_X, HW_Y, HW_Z);
  hwBody.castShadow = true;
  hwBody.receiveShadow = true;
  scene.add(hwBody);

  // Capots haut et bas
  const capMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.4 });
  const capGeo = new THREE.CylinderGeometry(HW_R + 0.05, HW_R + 0.05, 0.2, 16);
  const capTop = new THREE.Mesh(capGeo, capMat);
  capTop.position.set(HW_X, HW_Y + HW_H / 2 + 0.1, HW_Z);
  scene.add(capTop);
  const capBot = new THREE.Mesh(capGeo, capMat);
  capBot.position.set(HW_X, HW_Y - HW_H / 2 - 0.1, HW_Z);
  scene.add(capBot);

  // Fixations murales (2 pattes horizontales)
  const bracketMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.3 });
  for (const dy of [-2, 2]) {
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(HW_R + 0.5, 0.4, 0.5),
      bracketMat
    );
    bracket.position.set(-NICHE_DEPTH + (HW_R + 0.5) / 2, HW_Y + dy, HW_Z);
    scene.add(bracket);
  }

  // Extension mur SDB ouest de 6 studs vers le sud (Z=67 → Z=73)
  const WEST_EXT = 6;
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(WEST_EXT, layer % 2 === 1))
      addBrickZ(-NICHE_DEPTH - 0.5, layer, SHOWER_Z1 + b.start, b.size, 'wall');
  }

  // =============================================
  // Mur couloir bâtiment (diagonal, briques LEGO dans un Group rotaté)
  // =============================================
  const DIAG_AX = CORR_RIGHT_X - 0.5;          // 30 (face int mur B)
  const DIAG_AZ = WALL_Z0 + CORR_RIGHT_LEN;    // 54 (bout mur couloir est)
  const DIAG_CX = -NICHE_DEPTH;                 // -1 (face int mur SDB ouest)
  const DIAG_CZ = SHOWER_Z1 + WEST_EXT;         // 73 (bout extension ouest)

  const diagDX = DIAG_CX - DIAG_AX;
  const diagDZ = DIAG_CZ - DIAG_AZ;
  const diagLen = Math.sqrt(diagDX * diagDX + diagDZ * diagDZ);
  const diagWallLen = Math.round(diagLen); // ~36 studs

  const diagGroup = new THREE.Group();
  // Rotation : local Z pointe de A vers C
  diagGroup.rotation.y = Math.atan2(diagDX, diagDZ);
  // Position : coin int A + offset 0.5 est/sud
  diagGroup.position.set(DIAG_AX + 0.5, 0, DIAG_AZ + 0.5);

  // Porte d'entrée : 9 studs (90cm), à 1 stud du côté couloir (nord)
  const E_DOOR_START = 1;
  const E_DOOR_W = 9;
  const E_DOOR_END = E_DOOR_START + E_DOOR_W; // 10
  // Zone à exclure (porte + encadrement, évite z-fighting)
  const E_FRAME_START = E_DOOR_START - 1; // 0
  const E_FRAME_END = E_DOOR_END + 1;     // 11

  const brickMat = new THREE.MeshStandardMaterial({ color: 0xc8c8b8, roughness: 0.8 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.8 });
  const studMat = new THREE.MeshStandardMaterial({ color: 0xb8b8a8, roughness: 0.8 });
  const accentStudMat = new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.8 });
  const studGeo = new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_HT, 8);

  function addDiagBrick(z, layer, size, mat, sMat) {
    const geo = new THREE.BoxGeometry(1 - GAP, BRICK_H - GAP, size - GAP);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, layer * BRICK_H + BRICK_H / 2, z + size / 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    diagGroup.add(mesh);
    for (let s = 0; s < size; s++) {
      const stud = new THREE.Mesh(studGeo, sMat);
      stud.position.set(0, (layer + 1) * BRICK_H + STUD_HT / 2, z + s + 0.5);
      diagGroup.add(stud);
    }
  }

  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    // Zone à couper pour porte + encadrement
    let skipS, skipE;
    if (layer < DOOR_H_LAYERS) {
      skipS = E_FRAME_START;
      skipE = E_FRAME_END;
    } else if (layer === DOOR_H_LAYERS) {
      skipS = E_DOOR_START;
      skipE = E_DOOR_END;
    } else {
      skipS = skipE = -1;
    }

    for (const b of fillRow(diagWallLen, layer % 2 === 1)) {
      const bS = b.start;
      const bE = bS + b.size;

      if (skipS >= 0 && bE > skipS && bS < skipE) {
        if (bS < skipS)
          addDiagBrick(bS, layer, skipS - bS, brickMat, studMat);
        if (bE > skipE)
          addDiagBrick(skipE, layer, bE - skipE, brickMat, studMat);
      } else {
        addDiagBrick(bS, layer, b.size, brickMat, studMat);
      }
    }
  }

  // Encadrement porte d'entrée (accent rouge)
  for (let layer = 0; layer < DOOR_H_LAYERS; layer++) {
    addDiagBrick(E_FRAME_START, layer, 1, accentMat, accentStudMat);
    addDiagBrick(E_DOOR_END, layer, 1, accentMat, accentStudMat);
  }
  // Linteau
  addDiagBrick(E_DOOR_START, DOOR_H_LAYERS, E_DOOR_W, accentMat, accentStudMat);

  scene.add(diagGroup);

  // =============================================
  // Sols couloir studio + SDB
  // =============================================
  const CORR_FLOOR_W = ROOM_W - DOOR_START; // 30 - 19 = 11
  // Sol couloir studio (X=19→30, Z=41→54)
  for (let z = WALL_Z0; z < WALL_Z0 + CORR_RIGHT_LEN; z++) {
    for (const b of fillRow(CORR_FLOOR_W, z % 2 === 1)) {
      allBricks.push({
        x: DOOR_START + b.start + b.size / 2, y: -1/3, z: z + 0.5,
        sx: b.size - GAP, sy: PLATE_H - GAP, sz: 1 - GAP,
        len: b.size, axis: 'x', type: 'floor'
      });
    }
  }
  // Sol SDB (X=-1→19, Z=47→60)
  for (let z = KITCHEN_Z + 1; z < SDB_Z_END; z++) {
    for (const b of fillRow(SDB_W, z % 2 === 1)) {
      allBricks.push({
        x: -NICHE_DEPTH + b.start + b.size / 2, y: -1/3, z: z + 0.5,
        sx: b.size - GAP, sy: PLATE_H - GAP, sz: 1 - GAP,
        len: b.size, axis: 'x', type: 'floor'
      });
    }
  }

  // Sol complémentaire sous le mur bâtiment (diagonal)
  // Comble le triangle entre couloir/SDB et le mur diagonal
  for (let z = DIAG_AZ; z < Math.ceil(DIAG_CZ); z++) {
    // Position X de la face int du mur diagonal à ce Z
    const rawDiagX = 30.5 - 31 * (z + 0.5 - 54.5) / 19;
    const maxX = Math.floor(rawDiagX);
    // Avant Z=60 : seul le côté couloir (X=19+) manque (SDB couvre X=-1→19)
    // Après Z=60 : tout manque depuis X=-1
    const minX = z < SDB_Z_END ? DOOR_START : -NICHE_DEPTH;
    const width = maxX - minX;
    if (width <= 0) continue;
    for (const b of fillRow(width, z % 2 === 1)) {
      allBricks.push({
        x: minX + b.start + b.size / 2, y: -1/3, z: z + 0.5,
        sx: b.size - GAP, sy: PLATE_H - GAP, sz: 1 - GAP,
        len: b.size, axis: 'x', type: 'floor'
      });
    }
  }

  // =============================================
  // Labels
  // =============================================
  const labelY = WALL_H * 0.6;
  const sdbCX = (-NICHE_DEPTH + DOOR_START) / 2;
  const sdbCZ = (KITCHEN_Z + SDB_Z_END) / 2;
  makeText(scene, 'MUR COULOIR',    { size: 1.2, x: WALL_X - 3,       y: labelY, z: (KITCHEN_Z + SDB_Z_END) / 2, rotY: Math.PI / 2 });
  makeText(scene, 'MUR SDB NORD',   { size: 1.2, x: sdbCX,            y: labelY, z: KITCHEN_Z - 3 });
  makeText(scene, 'MUR SDB OUEST',  { size: 1.2, x: -NICHE_DEPTH - 4, y: labelY, z: sdbCZ, rotY: Math.PI / 2 });
  makeText(scene, 'PORTE VITRÉE',   { size: 1.2, x: sdbCX,            y: labelY, z: SDB_Z_END + 3, rotY: Math.PI });
}
