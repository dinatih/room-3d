import * as THREE from 'three';
import { ROOM_W, ROOM_D, NUM_LAYERS, WALL_H, BRICK_H, DOOR_H, GAP, DOOR_START, DOOR_END, DOOR_H_LAYERS, NICHE_DEPTH, KITCHEN_X1, KITCHEN_Z, SDB_Z_END, DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ, LAYER_EQUIPMENT } from './config.js';
import { fillRow, addBrickX, addBrickZ, addFloorBrick } from './brickHelpers.js';
import { makeText } from './labels.js';
import { buildDoors, DOOR_W } from './doors.js';

export { toggleCorridorDoors, toggleEntryDoor, toggleLivingDoor, toggleBathroomDoor } from './doors.js';

export function buildCorridor(scene) {
  const WALL_X = DOOR_START - 5;
  const WALL_Z0 = ROOM_D + 10; // après l'épaisseur du mur D

  // Mur gauche du couloir : commence à MS-N (Z=460), 140cm jusqu'à Z=600
  const LEFT_WALL_LEN = SDB_Z_END - KITCHEN_Z; // 140
  const LEFT_WALL_Z0 = KITCHEN_Z; // Z=460

  // Ouverture porte SDB dans le mur briques (centrée à 10cm du bout, ~83cm)
  const C_DOOR_W = DOOR_W; // 83cm — même largeur que séjour
  const C_DOOR_START = LEFT_WALL_LEN - 10 - C_DOOR_W;
  const C_DOOR_END = C_DOOR_START + C_DOOR_W;

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

    const railMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.3 });
    const rail = new THREE.Mesh(new THREE.BoxGeometry(4, 3, CLOSET_D), railMat);
    rail.position.set(CLOSET_X1 - 1, slideH + 1.5, CLOSET_CZ);
    scene.add(rail);
    closetParts.push(rail);

    const railBot = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, CLOSET_D), railMat);
    railBot.position.set(CLOSET_X1 - 1, 0.75, CLOSET_CZ);
    scene.add(railBot);
    closetParts.push(railBot);

    const handleMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8, roughness: 0.2 });
    const handle = new THREE.Mesh(new THREE.BoxGeometry(1.2, 20, 3), handleMat);
    handle.position.set(CLOSET_X1 + 0.5, WALL_H / 2, CLOSET_CZ);
    scene.add(handle);
    closetParts.push(handle);

    for (let z = CLOSET_Z0; z < CLOSET_Z1; z += 10) {
      for (const b of fillRow(CLOSET_W - 10, (z / 10) % 2 === 1)) {
        addFloorBrick(CLOSET_X0 + 10 + b.start, z, b.size);
      }
    }

    for (const obj of closetParts)
      obj.layers.set(LAYER_EQUIPMENT);
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
  const diagDX = DIAG_CX - DIAG_AX;
  const diagDZ = DIAG_CZ - DIAG_AZ;
  const diagLen = Math.sqrt(diagDX * diagDX + diagDZ * diagDZ);
  const diagWallLen = Math.round(diagLen / 10) * 10;
  const diagRotY = Math.atan2(diagDX, diagDZ);

  const perpX = 5 * diagDZ / diagLen;
  const perpZ = -5 * diagDX / diagLen;
  const originX = DIAG_AX + perpX;
  const originZ = DIAG_AZ + perpZ;
  const sinθ = diagDX / diagLen;
  const cosθ = diagDZ / diagLen;

  const E_DOOR_START = 10;
  const E_DOOR_W = 90;
  const E_DOOR_END = E_DOOR_START + E_DOOR_W;

  // ── Mur diagonal plein (remplacement des briques) ──────────
  {
    const DIAG_DEPTH = 10; // épaisseur du mur (cm)

    // Vecteur perpendiculaire extérieur (hors appartement) :
    // rotation 90° CW de la direction du mur (sinθ, cosθ) → (cosθ, -sinθ)
    const pX = cosθ;   //  diagDZ/diagLen ≈ +0.537
    const pZ = -sinθ;  // -diagDX/diagLen ≈ +0.844

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.9 });

    // Retourne [worldX, worldZ] sur la face intérieure à dist cm depuis A
    function iP(dist) {
      return [DIAG_AX + dist * sinθ, DIAG_AZ + dist * cosθ];
    }
    // Même point sur la face extérieure
    function eP(dist) {
      return [DIAG_AX + dist * sinθ + DIAG_DEPTH * pX,
              DIAG_AZ + dist * cosθ + DIAG_DEPTH * pZ];
    }

    // Extrude une section du mur de d0 à d1 (cm le long du mur),
    // de yBase à yBase+height en hauteur.
    function diagSection(d0, d1, height, yBase = 0) {
      const pts = [iP(d0), iP(d1), eP(d1), eP(d0)];
      const shape = new THREE.Shape();
      shape.moveTo(pts[0][0], -pts[0][1]);
      for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], -pts[i][1]);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2);
      if (yBase > 0) geo.translate(0, yBase, 0);
      const m = new THREE.Mesh(geo, wallMat);
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
    }

    diagSection(0,           E_DOOR_START, WALL_H);                        // section gauche
    diagSection(E_DOOR_END,  diagLen,      WALL_H);                        // section droite
    diagSection(E_DOOR_START,E_DOOR_END,   WALL_H - DOOR_H, DOOR_H);      // linteau aligné sur le panneau
  }

  // =============================================
  // Portes (panneaux 3D) — déléguées à doors.js
  // =============================================
  buildDoors(scene, {
    entry: {
      hingeX: originX + E_DOOR_START * sinθ,
      hingeZ: originZ + E_DOOR_START * cosθ,
      rotY:   diagRotY,
    },
    bathroom: {
      hingeX: WALL_X,
      hingeZ: LEFT_WALL_Z0 + C_DOOR_END,
    },
  });

  // =============================================
  // Sols couloir studio
  // =============================================
  const CORR_FLOOR_W = ROOM_W - DOOR_START; // 110
  for (let z = WALL_Z0; z < WALL_Z0 + CORR_RIGHT_LEN; z += 10) {
    for (const b of fillRow(CORR_FLOOR_W, (z / 10) % 2 === 1)) {
      addFloorBrick(DOOR_START + b.start, z, b.size);
    }
  }

  const SDB_Z = KITCHEN_Z + LEFT_WALL_LEN;
  const SHOWER_EAST = -NICHE_DEPTH + 70;
  const SHOWER_Z_END = SDB_Z + 70;

  for (let z = DIAG_AZ; z < Math.ceil(DIAG_CZ / 10) * 10; z += 10) {
    const rawDiagX = DIAG_AX + 5 - (DIAG_AX - DIAG_CX) * (z + 5 - (DIAG_AZ + 5)) / (DIAG_CZ - DIAG_AZ);
    const maxX = Math.floor(rawDiagX / 10) * 10;
    const minX = z < SDB_Z ? DOOR_START : -NICHE_DEPTH;
    const width = maxX - minX;
    if (width <= 0) continue;

    if (z >= SDB_Z && z < SHOWER_Z_END) {
      const w1 = SHOWER_EAST - minX;
      if (w1 > 0) for (const b of fillRow(w1, (z / 10) % 2 === 1))
        addFloorBrick(minX + b.start, z, b.size);
      const w2 = maxX - (SHOWER_EAST + 10);
      if (w2 > 0) for (const b of fillRow(w2, (z / 10) % 2 === 1))
        addFloorBrick(SHOWER_EAST + 10 + b.start, z, b.size);
    } else if (z === SHOWER_Z_END) {
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
  return makeText(scene, 'MUR COULOIR', { size: 12, x: WALL_X - 30, y: labelY, z: sdbCZ, rotY: Math.PI / 2 });
}
