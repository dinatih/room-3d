import * as THREE from 'three';
import { ROOM_W, ROOM_D, WALL_H, DOOR_H, DOOR_START, NICHE_DEPTH, KITCHEN_X1, KITCHEN_Z, SDB_Z_END, DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ, LAYER_EQUIPMENT } from './config.js';
import { makeText } from './labels.js';
import { buildDoors, DOOR_W } from './doors.js';

export { toggleCorridorDoors, toggleEntryDoor, toggleLivingDoor, toggleBathroomDoor } from './doors.js';

const W = 10; // wall thickness

export function buildCorridor(scene) {
  const WALL_X = DOOR_START - 5;
  const WALL_Z0 = ROOM_D + 10; // après l'épaisseur du mur D

  // Mur gauche du couloir : commence à MS-N (Z=460), 140cm jusqu'à Z=600
  const LEFT_WALL_LEN = SDB_Z_END - KITCHEN_Z; // 140
  const LEFT_WALL_Z0 = KITCHEN_Z; // Z=460

  // Ouverture porte SDB dans le mur
  const C_DOOR_W = DOOR_W; // 83cm
  const C_DOOR_START = LEFT_WALL_LEN - 10 - C_DOOR_W; // local offset along wall
  const C_DOOR_END = C_DOOR_START + C_DOOR_W;

  // Absolute Z positions for the bathroom door opening
  const C_DOOR_START_ABS = LEFT_WALL_Z0 + C_DOOR_START; // ≈507
  const C_DOOR_END_ABS   = LEFT_WALL_Z0 + C_DOOR_END;   // ≈590

  const wallMat  = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.9 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.8 });

  function panel(w, h, d, x, y, z, mat = wallMat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m); return m;
  }

  // ── Mur gauche du couloir (côté SDB, à X=WALL_X=185) ─────────────────────
  // Section avant porte (Z=460 → ~502)
  const LEFT_SECTION1_D = 37; // ≈ C_DOOR_START_ABS - 5 - LEFT_WALL_Z0 - 5 = gap to door frame
  panel(W, WALL_H, LEFT_SECTION1_D, WALL_X, WALL_H/2, LEFT_WALL_Z0 + LEFT_SECTION1_D/2);
  // Linteau au-dessus de la porte SDB
  panel(W, WALL_H - DOOR_H, C_DOOR_W, WALL_X,
        DOOR_H + (WALL_H - DOOR_H) / 2,
        (C_DOOR_START_ABS + C_DOOR_END_ABS) / 2);
  // Dormant + gâche porte SDB
  {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.3 });
    const gacheMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.75, roughness: 0.2 });
    const FW = 7;   // largeur du chambranle
    const FT = 1.5; // épaisseur (débord de la face du mur)
    const xI = WALL_X - W - FT / 2; // face côté couloir
    panel(FT, DOOR_H, FW, xI, DOOR_H / 2, C_DOOR_START_ABS - FW / 2, frameMat); // jamb sud
    panel(FT, DOOR_H, FW, xI, DOOR_H / 2, C_DOOR_END_ABS   + FW / 2, frameMat); // jamb nord
    panel(FT, FW, C_DOOR_W + FW * 2, xI, DOOR_H + FW / 2, (C_DOOR_START_ABS + C_DOOR_END_ABS) / 2, frameMat); // traverse
    // Gâche côté loquet (C_DOOR_START_ABS)
    panel(3.5, 18, 1.5, WALL_X - W - FT - 0.5, 100, C_DOOR_START_ABS - 0.5, gacheMat);
  }

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

    for (const obj of closetParts)
      obj.layers.set(LAYER_EQUIPMENT);
  }

  // ── Mur droit du couloir (en face de la porte SDB), jusqu'au début du diag ─
  const CORR_RIGHT_LEN = DIAG_AZ - WALL_Z0; // 530-410=120
  panel(W, WALL_H, CORR_RIGHT_LEN, ROOM_W + W/2, WALL_H/2, (WALL_Z0 + DIAG_AZ) / 2);

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

  // ── Mur diagonal plein ──────────────────────────────────────────────────
  {
    const DIAG_DEPTH = 10; // épaisseur du mur (cm)

    // Vecteur perpendiculaire extérieur (hors appartement) :
    // rotation 90° CW de la direction du mur (sinθ, cosθ) → (cosθ, -sinθ)
    const pX = cosθ;   //  diagDZ/diagLen ≈ +0.537
    const pZ = -sinθ;  // -diagDX/diagLen ≈ +0.844

    const wallMatDiag = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.9 });

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
      const m = new THREE.Mesh(geo, wallMatDiag);
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
  // Labels
  // =============================================
  const labelY = WALL_H * 0.6;
  const sdbCZ = (KITCHEN_Z + SDB_Z_END) / 2;
  return makeText(scene, 'MUR COULOIR', { size: 12, x: WALL_X - 30, y: labelY, z: sdbCZ, rotY: Math.PI / 2 });
}
