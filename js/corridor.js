import * as THREE from 'three';
import { ROOM_W, ROOM_D, NUM_LAYERS, WALL_H, BRICK_H, GAP, STUD_R, STUD_HT, DOOR_START, DOOR_END, DOOR_H_LAYERS, NICHE_DEPTH, KITCHEN_X1, KITCHEN_Z, SDB_Z_END, DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ, LAYER_FURNITURE } from './config.js';
import { fillRow, addBrickX, addBrickZ, addFloorBrick } from './brickHelpers.js';
import { makeText } from './labels.js';

export function buildCorridor(scene) {
  const WALL_X = DOOR_START - 0.5;
  const WALL_Z0 = ROOM_D + 1; // après l'épaisseur du mur D

  // Mur gauche du couloir : commence à MS-N (Z=46), 14 studs jusqu'à Z=60
  const LEFT_WALL_LEN = SDB_Z_END - KITCHEN_Z; // 14
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
  // =============================================
  {
    const CLOSET_X0 = KITCHEN_X1; // 13
    const CLOSET_X1 = DOOR_START; // 19
    const CLOSET_Z0 = WALL_Z0;   // 41
    const CLOSET_Z1 = KITCHEN_Z;  // 46
    const CLOSET_W = CLOSET_X1 - CLOSET_X0; // 6
    const CLOSET_D = CLOSET_Z1 - CLOSET_Z0; // 5
    const CLOSET_CX = (CLOSET_X0 + CLOSET_X1) / 2;
    const CLOSET_CZ = (CLOSET_Z0 + CLOSET_Z1) / 2;

    // 3 étagères
    const closetParts = [];
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
      closetParts.push(shelf);
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
    closetParts.push(slidePanel);

    // Rail haut
    const railMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.3 });
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.3, CLOSET_D),
      railMat
    );
    rail.position.set(CLOSET_X1 - 0.1, slideH + 0.15, CLOSET_CZ);
    scene.add(rail);
    closetParts.push(rail);

    // Rail bas
    const railBot = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.15, CLOSET_D),
      railMat
    );
    railBot.position.set(CLOSET_X1 - 0.1, 0.075, CLOSET_CZ);
    scene.add(railBot);
    closetParts.push(railBot);

    // Poignée
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8, roughness: 0.2 });
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 2, 0.3),
      handleMat
    );
    handle.position.set(CLOSET_X1 + 0.05, WALL_H / 2, CLOSET_CZ);
    scene.add(handle);
    closetParts.push(handle);

    // Sol placard (après MK-E, la porte coulissante est côté couloir)
    for (let z = CLOSET_Z0; z < CLOSET_Z1; z++) {
      for (const b of fillRow(CLOSET_W - 1, z % 2 === 1)) {
        addFloorBrick(CLOSET_X0 + 1 + b.start, z, b.size);
      }
    }

    // Tag placard → layer mobilier
    for (const obj of closetParts)
      obj.layers.set(LAYER_FURNITURE);
  }

  // Mur droit du couloir (en face de la porte SDB), jusqu'au début du diag
  const CORR_RIGHT_X = ROOM_W + 0.5;
  const CORR_RIGHT_LEN = DIAG_AZ - WALL_Z0;
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(CORR_RIGHT_LEN, layer % 2 === 1))
      addBrickZ(CORR_RIGHT_X, layer, WALL_Z0 + b.start, b.size, 'wall');
  }

  // =============================================
  // Mur couloir bâtiment (diagonal, briques LEGO dans un Group rotaté)
  // =============================================

  const diagDX = DIAG_CX - DIAG_AX;   // -31
  const diagDZ = DIAG_CZ - DIAG_AZ;   // 19
  const diagLen = Math.sqrt(diagDX * diagDX + diagDZ * diagDZ);
  const diagWallLen = Math.round(diagLen);

  // Perpendiculaire au mur (vers l'intérieur couloir) pour centrer l'épaisseur 1 stud
  const perpX = 0.5 * diagDZ / diagLen;
  const perpZ = -0.5 * diagDX / diagLen;

  const diagGroup = new THREE.Group();
  diagGroup.rotation.y = Math.atan2(diagDX, diagDZ);
  diagGroup.position.set(DIAG_AX + perpX, 0, DIAG_AZ + perpZ);

  // Porte d'entrée : 9 studs (90cm), à 1 stud du côté couloir
  const E_DOOR_START = 1;
  const E_DOOR_W = 9;
  const E_DOOR_END = E_DOOR_START + E_DOOR_W;
  const E_FRAME_START = E_DOOR_START - 1;
  const E_FRAME_END = E_DOOR_END + 1;

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
  addDiagBrick(E_DOOR_START, DOOR_H_LAYERS, E_DOOR_W, accentMat, accentStudMat);

  scene.add(diagGroup);

  // =============================================
  // Charnières LEGO 19954 entre MCo-E et MDiag (une par couche)
  // =============================================
  {
    const hingeX = DIAG_AX + perpX;
    const hingeZ = DIAG_AZ + perpZ;
    const barrelR = 0.25;
    const barrelH = BRICK_H - GAP;
    const hingeMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.8 });

    for (let layer = 0; layer < NUM_LAYERS; layer++) {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(barrelR, barrelR, barrelH, 8),
        hingeMat
      );
      barrel.position.set(hingeX, layer * BRICK_H + BRICK_H / 2, hingeZ);
      barrel.castShadow = true;
      scene.add(barrel);
    }
  }

  // =============================================
  // Sols couloir studio
  // =============================================
  const CORR_FLOOR_W = ROOM_W - DOOR_START; // 11
  // Sol couloir studio (X=19→30, Z=41→54)
  for (let z = WALL_Z0; z < WALL_Z0 + CORR_RIGHT_LEN; z++) {
    for (const b of fillRow(CORR_FLOOR_W, z % 2 === 1)) {
      addFloorBrick(DOOR_START + b.start, z, b.size);
    }
  }

  // Sol complémentaire sous le mur bâtiment (diagonal)
  const SDB_Z = KITCHEN_Z + LEFT_WALL_LEN; // 60
  const SHOWER_EAST = -NICHE_DEPTH + 7;    // X=6 (fin mur est douche intérieur)
  const SHOWER_Z_END = SDB_Z + 7;          // Z=67 (fin mur fond douche intérieur)

  for (let z = DIAG_AZ; z < Math.ceil(DIAG_CZ); z++) {
    const rawDiagX = DIAG_AX + 0.5 - (DIAG_AX - DIAG_CX) * (z + 0.5 - (DIAG_AZ + 0.5)) / (DIAG_CZ - DIAG_AZ);
    const maxX = Math.floor(rawDiagX);
    const minX = z < SDB_Z ? DOOR_START : -NICHE_DEPTH;
    const width = maxX - minX;
    if (width <= 0) continue;

    if (z >= SDB_Z && z < SHOWER_Z_END) {
      // Couper autour du mur est douche (X=6→7)
      const w1 = SHOWER_EAST - minX;
      if (w1 > 0) for (const b of fillRow(w1, z % 2 === 1))
        addFloorBrick(minX + b.start, z, b.size);
      const w2 = maxX - (SHOWER_EAST + 1);
      if (w2 > 0) for (const b of fillRow(w2, z % 2 === 1))
        addFloorBrick(SHOWER_EAST + 1 + b.start, z, b.size);
    } else if (z === SHOWER_Z_END) {
      // Sauter le mur fond douche (X=-1→6)
      const w = maxX - SHOWER_EAST;
      if (w > 0) for (const b of fillRow(w, z % 2 === 1))
        addFloorBrick(SHOWER_EAST + b.start, z, b.size);
    } else {
      for (const b of fillRow(width, z % 2 === 1))
        addFloorBrick(minX + b.start, z, b.size);
    }
  }

  // =============================================
  // Labels
  // =============================================
  const labelY = WALL_H * 0.6;
  const sdbCZ = (KITCHEN_Z + SDB_Z) / 2;
  makeText(scene, 'MUR COULOIR', { size: 1.2, x: WALL_X - 3, y: labelY, z: sdbCZ, rotY: Math.PI / 2 });
}
