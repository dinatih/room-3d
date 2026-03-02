import * as THREE from 'three';
import { ROOM_W, ROOM_D, NUM_LAYERS, WALL_H, BRICK_H, GAP, DOOR_START, DOOR_END, DOOR_H_LAYERS, NICHE_DEPTH, KITCHEN_X1, KITCHEN_Z, SDB_Z_END, DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ, LAYER_FURNITURE } from './config.js';
import { fillRow, addBrickX, addBrickZ, addFloorBrick } from './brickHelpers.js';
import { makeText } from './labels.js';

export function buildCorridor(scene) {
  const WALL_X = DOOR_START - 5;
  const WALL_Z0 = ROOM_D + 10; // après l'épaisseur du mur D

  // Mur gauche du couloir : commence à MS-N (Z=460), 140cm jusqu'à Z=600
  const LEFT_WALL_LEN = SDB_Z_END - KITCHEN_Z; // 140
  const LEFT_WALL_Z0 = KITCHEN_Z; // Z=460

  // Porte SDB : 80cm, 7 couches, 10cm du bout
  const C_DOOR_W = 80;
  const C_DOOR_START = LEFT_WALL_LEN - 10 - C_DOOR_W; // = 50
  const C_DOOR_END = C_DOOR_START + C_DOOR_W;         // = 130

  // Mur gauche du couloir (côté SDB) avec porte
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    let skipS, skipE;
    if (layer < DOOR_H_LAYERS) {
      skipS = C_DOOR_START - 10;
      skipE = C_DOOR_END + 10;
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
    addBrickZ(WALL_X, layer, LEFT_WALL_Z0 + C_DOOR_START - 10, 10, 'accent');
    addBrickZ(WALL_X, layer, LEFT_WALL_Z0 + C_DOOR_END, 10, 'accent');
  }
  addBrickZ(WALL_X, DOOR_H_LAYERS, LEFT_WALL_Z0 + C_DOOR_START, C_DOOR_W, 'accent');

  // =============================================
  // PLACARD COULISSANT (X=130→190, Z=410→460)
  // =============================================
  {
    const CLOSET_X0 = KITCHEN_X1; // 130
    const CLOSET_X1 = DOOR_START; // 190
    const CLOSET_Z0 = WALL_Z0;   // 410
    const CLOSET_Z1 = KITCHEN_Z;  // 460
    const CLOSET_W = CLOSET_X1 - CLOSET_X0; // 60
    const CLOSET_D = CLOSET_Z1 - CLOSET_Z0; // 50
    const CLOSET_CX = (CLOSET_X0 + CLOSET_X1) / 2;
    const CLOSET_CZ = (CLOSET_Z0 + CLOSET_Z1) / 2;

    // 3 étagères
    const closetParts = [];
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.4 });
    const shelfT = 3;
    for (const shelfY of [60, 120, 180]) {
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(CLOSET_W - 4, shelfT, CLOSET_D),
        shelfMat
      );
      shelf.position.set(CLOSET_CX, shelfY, CLOSET_CZ);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      scene.add(shelf);
      closetParts.push(shelf);
    }

    // Porte coulissante (panneau à X=190)
    const slideMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
    const slideH = WALL_H - 10;
    const slidePanel = new THREE.Mesh(
      new THREE.BoxGeometry(2, slideH, CLOSET_D - 2),
      slideMat
    );
    slidePanel.position.set(CLOSET_X1 - 1, slideH / 2, CLOSET_CZ);
    slidePanel.castShadow = true;
    scene.add(slidePanel);
    closetParts.push(slidePanel);

    // Rail haut
    const railMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.3 });
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, CLOSET_D),
      railMat
    );
    rail.position.set(CLOSET_X1 - 1, slideH + 1.5, CLOSET_CZ);
    scene.add(rail);
    closetParts.push(rail);

    // Rail bas
    const railBot = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.5, CLOSET_D),
      railMat
    );
    railBot.position.set(CLOSET_X1 - 1, 0.75, CLOSET_CZ);
    scene.add(railBot);
    closetParts.push(railBot);

    // Poignée
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8, roughness: 0.2 });
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 20, 3),
      handleMat
    );
    handle.position.set(CLOSET_X1 + 0.5, WALL_H / 2, CLOSET_CZ);
    scene.add(handle);
    closetParts.push(handle);

    // Sol placard (après MK-E, la porte coulissante est côté couloir)
    for (let z = CLOSET_Z0; z < CLOSET_Z1; z += 10) {
      for (const b of fillRow(CLOSET_W - 10, (z / 10) % 2 === 1)) {
        addFloorBrick(CLOSET_X0 + 10 + b.start, z, b.size);
      }
    }

    // Tag placard → layer mobilier
    for (const obj of closetParts)
      obj.layers.set(LAYER_FURNITURE);
  }

  // Mur droit du couloir (en face de la porte SDB), jusqu'au début du diag
  const CORR_RIGHT_X = ROOM_W + 5;
  const CORR_RIGHT_LEN = DIAG_AZ - WALL_Z0;
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(CORR_RIGHT_LEN, layer % 2 === 1))
      addBrickZ(CORR_RIGHT_X, layer, WALL_Z0 + b.start, b.size, 'wall');
  }

  // =============================================
  // Mur couloir bâtiment (diagonal)
  // =============================================

  const diagDX = DIAG_CX - DIAG_AX;   // -310
  const diagDZ = DIAG_CZ - DIAG_AZ;   // 190
  const diagLen = Math.sqrt(diagDX * diagDX + diagDZ * diagDZ);
  const diagWallLen = Math.round(diagLen / 10) * 10;
  const diagRotY = Math.atan2(diagDX, diagDZ);

  // Perpendiculaire au mur (vers l'intérieur couloir) pour centrer l'épaisseur 10cm
  const perpX = 5 * diagDZ / diagLen;
  const perpZ = -5 * diagDX / diagLen;
  const originX = DIAG_AX + perpX;
  const originZ = DIAG_AZ + perpZ;
  const sinθ = diagDX / diagLen;
  const cosθ = diagDZ / diagLen;

  // Porte d'entrée : 90cm, à 10cm du côté couloir
  const E_DOOR_START = 10;
  const E_DOOR_W = 90;
  const E_DOOR_END = E_DOOR_START + E_DOOR_W;
  const E_FRAME_START = E_DOOR_START - 10;
  const E_FRAME_END = E_DOOR_END + 10;

  function addDiagBrick(localZ, layer, size, type) {
    const center = localZ + size / 2;
    addBrickZ(originX + center * sinθ, layer, originZ + center * cosθ - size / 2, size, type, diagRotY);
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
          addDiagBrick(bS, layer, skipS - bS, 'wall');
        if (bE > skipE)
          addDiagBrick(skipE, layer, bE - skipE, 'wall');
      } else {
        addDiagBrick(bS, layer, b.size, 'wall');
      }
    }
  }

  // Encadrement porte d'entrée (accent rouge)
  for (let layer = 0; layer < DOOR_H_LAYERS; layer++) {
    addDiagBrick(E_FRAME_START, layer, 10, 'accent');
    addDiagBrick(E_DOOR_END, layer, 10, 'accent');
  }
  addDiagBrick(E_DOOR_START, DOOR_H_LAYERS, E_DOOR_W, 'accent');

  // =============================================
  // Charnières LEGO 19954 entre MCo-E et MDiag (une par couche)
  // =============================================
  {
    const hingeX = DIAG_AX + perpX;
    const hingeZ = DIAG_AZ + perpZ;
    const barrelR = 2.5;
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
  const CORR_FLOOR_W = ROOM_W - DOOR_START; // 110
  // Sol couloir studio (X=190→300, Z=410→540)
  for (let z = WALL_Z0; z < WALL_Z0 + CORR_RIGHT_LEN; z += 10) {
    for (const b of fillRow(CORR_FLOOR_W, (z / 10) % 2 === 1)) {
      addFloorBrick(DOOR_START + b.start, z, b.size);
    }
  }

  // Sol complémentaire sous le mur bâtiment (diagonal)
  const SDB_Z = KITCHEN_Z + LEFT_WALL_LEN; // 600
  const SHOWER_EAST = -NICHE_DEPTH + 70;    // X=60 (fin mur est douche intérieur)
  const SHOWER_Z_END = SDB_Z + 70;          // Z=670 (fin mur fond douche intérieur)

  for (let z = DIAG_AZ; z < Math.ceil(DIAG_CZ / 10) * 10; z += 10) {
    const rawDiagX = DIAG_AX + 5 - (DIAG_AX - DIAG_CX) * (z + 5 - (DIAG_AZ + 5)) / (DIAG_CZ - DIAG_AZ);
    const maxX = Math.floor(rawDiagX / 10) * 10;
    const minX = z < SDB_Z ? DOOR_START : -NICHE_DEPTH;
    const width = maxX - minX;
    if (width <= 0) continue;

    if (z >= SDB_Z && z < SHOWER_Z_END) {
      // Couper autour du mur est douche (X=60→70)
      const w1 = SHOWER_EAST - minX;
      if (w1 > 0) for (const b of fillRow(w1, (z / 10) % 2 === 1))
        addFloorBrick(minX + b.start, z, b.size);
      const w2 = maxX - (SHOWER_EAST + 10);
      if (w2 > 0) for (const b of fillRow(w2, (z / 10) % 2 === 1))
        addFloorBrick(SHOWER_EAST + 10 + b.start, z, b.size);
    } else if (z === SHOWER_Z_END) {
      // Sauter le mur fond douche (X=-10→60)
      const w = maxX - SHOWER_EAST;
      if (w > 0) for (const b of fillRow(w, (z / 10) % 2 === 1))
        addFloorBrick(SHOWER_EAST + b.start, z, b.size);
    } else {
      for (const b of fillRow(width, (z / 10) % 2 === 1))
        addFloorBrick(minX + b.start, z, b.size);
    }
  }

  // =============================================
  // Labels
  // =============================================
  const labelY = WALL_H * 0.6;
  const sdbCZ = (KITCHEN_Z + SDB_Z) / 2;
  makeText(scene, 'MUR COULOIR', { size: 12, x: WALL_X - 30, y: labelY, z: sdbCZ, rotY: Math.PI / 2 });
}
