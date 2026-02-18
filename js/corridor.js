import * as THREE from 'three';
import { ROOM_W, ROOM_D, NUM_LAYERS, WALL_H, BRICK_H, PLATE_H, GAP, STUD_R, STUD_HT, DOOR_START, DOOR_END, DOOR_H_LAYERS, NICHE_DEPTH, KITCHEN_Z } from './config.js';
import { fillRow, addBrickX, addBrickZ, allBricks } from './brickHelpers.js';
import { makeText } from './labels.js';

export function buildCorridor(scene) {
  const CORRIDOR_LEN = 19; // 19 studs (le 20e = épaisseur mur D)
  const WALL_X = DOOR_START - 0.5;
  const WALL_Z0 = ROOM_D + 1; // après l'épaisseur du mur D

  // Porte couloir : 8 studs (80cm), 7 couches, 1 stud du bout
  const C_DOOR_W = 8;
  const C_DOOR_START = CORRIDOR_LEN - 1 - C_DOOR_W; // = 11
  const C_DOOR_END = C_DOOR_START + C_DOOR_W;        // = 19

  // Mur gauche du couloir (côté cuisine) avec porte
  // Ouverture élargie pour inclure l'encadrement (évite z-fighting)
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    let skipS, skipE;
    if (layer < DOOR_H_LAYERS) {
      skipS = C_DOOR_START - 1; // inclut montant gauche
      skipE = C_DOOR_END + 1;   // inclut montant droit
    } else if (layer === DOOR_H_LAYERS) {
      skipS = C_DOOR_START;      // linteau seulement
      skipE = C_DOOR_END;
    } else {
      skipS = skipE = -1;
    }

    for (const b of fillRow(CORRIDOR_LEN, layer % 2 === 1)) {
      const bS = b.start;
      const bE = bS + b.size;

      if (skipS >= 0 && bE > skipS && bS < skipE) {
        if (bS < skipS)
          addBrickZ(WALL_X, layer, WALL_Z0 + bS, skipS - bS, 'wall');
        if (bE > skipE)
          addBrickZ(WALL_X, layer, WALL_Z0 + skipE, bE - skipE, 'wall');
      } else {
        addBrickZ(WALL_X, layer, WALL_Z0 + bS, b.size, 'wall');
      }
    }
  }

  // Encadrement porte couloir (accent rouge)
  for (let layer = 0; layer < DOOR_H_LAYERS; layer++) {
    addBrickZ(WALL_X, layer, WALL_Z0 + C_DOOR_START - 1, 1, 'accent');
    addBrickZ(WALL_X, layer, WALL_Z0 + C_DOOR_END, 1, 'accent');
  }
  addBrickZ(WALL_X, DOOR_H_LAYERS, WALL_Z0 + C_DOOR_START, C_DOOR_W, 'accent');

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

  // Mur sud avec ouverture douche
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(SDB_W, layer % 2 === 1)) {
      const absS = -NICHE_DEPTH + b.start;
      const absE = absS + b.size;

      if (absE > SHOWER_X0 && absS < SHOWER_X1) {
        if (absS < SHOWER_X0)
          addBrickX(absS, layer, SDB_Z_END + 0.5, SHOWER_X0 - absS, 'wall');
        if (absE > SHOWER_X1)
          addBrickX(SHOWER_X1, layer, SDB_Z_END + 0.5, absE - SHOWER_X1, 'wall');
      } else {
        addBrickX(absS, layer, SDB_Z_END + 0.5, b.size, 'wall');
      }
    }
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
  base.position.set(showerCX, PLATE_H + BASE_H / 2, showerCZ);
  base.castShadow = true;
  base.receiveShadow = true;
  scene.add(base);

  // Porte vitrée au niveau du mur sud (Z=60), 1.8m de haut
  const glassBaseY = PLATE_H + BASE_H;
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
        x: DOOR_START + b.start + b.size / 2, y: PLATE_H / 2, z: z + 0.5,
        sx: b.size - GAP, sy: PLATE_H - GAP, sz: 1 - GAP,
        len: b.size, axis: 'x', type: 'floor'
      });
    }
  }
  // Sol SDB (X=-1→19, Z=47→60)
  for (let z = KITCHEN_Z + 1; z < SDB_Z_END; z++) {
    for (const b of fillRow(SDB_W, z % 2 === 1)) {
      allBricks.push({
        x: -NICHE_DEPTH + b.start + b.size / 2, y: PLATE_H / 2, z: z + 0.5,
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
        x: minX + b.start + b.size / 2, y: PLATE_H / 2, z: z + 0.5,
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
  makeText(scene, 'MUR COULOIR',    { size: 1.2, x: WALL_X - 3,       y: labelY, z: (WALL_Z0 + SDB_Z_END) / 2, rotY: Math.PI / 2 });
  makeText(scene, 'MUR SDB NORD',   { size: 1.2, x: sdbCX,            y: labelY, z: KITCHEN_Z - 3 });
  makeText(scene, 'MUR SDB OUEST',  { size: 1.2, x: -NICHE_DEPTH - 4, y: labelY, z: sdbCZ, rotY: Math.PI / 2 });
  makeText(scene, 'MUR SDB SUD',    { size: 1.2, x: sdbCX,            y: labelY, z: SDB_Z_END + 3, rotY: Math.PI });
}
