import * as THREE from 'three';
import { ROOM_W, ROOM_D, WALL_H, DOOR_H, DOOR_START, NICHE_DEPTH, KITCHEN_X1, KITCHEN_Z, SDB_Z_END, DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ, LAYER_EQUIPMENT } from '../config.js';
import { makeText } from '../ui/labels.js';
import { buildEntryDoor, buildBathroomDoor, DOOR_W } from './doors.js';
import { getEastWallMats } from './walls.js';

export { toggleCorridorDoors, toggleEntryDoor, toggleLivingDoor, toggleBathroomDoor } from './doors.js';

let closetDoorGroup = null;
let closetDoorOpen = false;

export function toggleCorridorCloset() {
  closetDoorOpen = !closetDoorOpen;
  if (closetDoorGroup) closetDoorGroup.rotation.y = closetDoorOpen ? Math.PI / 2 : 0;
  return closetDoorOpen;
}

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
  // Section avant porte (Z=460 → C_DOOR_START_ABS)
  panel(W, WALL_H, C_DOOR_START_ABS - LEFT_WALL_Z0, WALL_X, WALL_H/2,
        (LEFT_WALL_Z0 + C_DOOR_START_ABS) / 2);
  // Section après porte (C_DOOR_END_ABS → SDB_Z_END)
  panel(W, WALL_H, SDB_Z_END - C_DOOR_END_ABS, WALL_X, WALL_H/2,
        (C_DOOR_END_ABS + SDB_Z_END) / 2);
  // Linteau au-dessus de la porte SDB
  panel(W, WALL_H - DOOR_H, C_DOOR_W, WALL_X,
        DOOR_H + (WALL_H - DOOR_H) / 2,
        (C_DOOR_START_ABS + C_DOOR_END_ABS) / 2);
  // ── Assembly porte SDB (encadrement + panneau) ───────────────────────────
  const sdbDoorAssembly = new THREE.Group();
  sdbDoorAssembly.userData.inventoryId = 'door-sdb';
  scene.add(sdbDoorAssembly);
  {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.3 });
    const FW = 3, FT = 1;
    const CZ = (C_DOOR_START_ABS + C_DOOR_END_ABS) / 2;
    function fp(w, h, d, x, y, z) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frameMat);
      m.position.set(x, y, z);
      sdbDoorAssembly.add(m);
    }
    for (const xF of [WALL_X - W/2 - FT/2, WALL_X + W/2 + FT/2]) {
      fp(FT, DOOR_H, FW, xF, DOOR_H / 2, C_DOOR_START_ABS - FW / 2);
      fp(FT, DOOR_H, FW, xF, DOOR_H / 2, C_DOOR_END_ABS   + FW / 2);
      fp(FT, FW, C_DOOR_W + FW * 2, xF, DOOR_H + FW / 2, CZ);
    }
    buildBathroomDoor({ hingeX: WALL_X, hingeZ: LEFT_WALL_Z0 + C_DOOR_END }, sdbDoorAssembly);
  }

  // =============================================
  // PLACARD COULOIR (X=130→190, Z=410→460) — porte pivotante
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

    const closetGroup = new THREE.Group();
    closetGroup.userData.inventoryId = 'corridor-closet';
    closetGroup.userData.hoverAction = { label: 'Placard couloir', actionId: 'corridor-closet-toggle' };
    scene.add(closetGroup);

    const add = (mesh) => {
      mesh.layers.set(LAYER_EQUIPMENT);
      closetGroup.add(mesh);
    };

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
      add(shelf);
    }

    const doorMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
    const doorH = WALL_H - 10;

    // Porte sur face est (X=CLOSET_X1), pivot côté droit = Z=CLOSET_Z0
    // Ouverture rotation.y=+π/2 : bord libre part vers +X (couloir)
    closetDoorGroup = new THREE.Group();
    closetDoorGroup.position.set(CLOSET_X1, 0, CLOSET_Z0);

    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(2, doorH, CLOSET_D - 2),
      doorMat
    );
    doorPanel.position.set(0, doorH / 2, CLOSET_D / 2);
    doorPanel.castShadow = true;
    closetDoorGroup.add(doorPanel);

    const handleMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8, roughness: 0.2 });
    const handle = new THREE.Mesh(new THREE.BoxGeometry(3, 20, 1.2), handleMat);
    handle.position.set(2, WALL_H / 2, CLOSET_D - 6);
    closetDoorGroup.add(handle);

    closetDoorGroup.traverse(c => { if (c.isMesh) c.layers.set(LAYER_EQUIPMENT); });
    closetGroup.add(closetDoorGroup);
  }

  // ── Mur droit du couloir (en face de la porte SDB), jusqu'au début du diag ─
  // Face extérieure (+X) transparente, cohérent avec mur B.
  const CORR_RIGHT_LEN = DIAG_AZ - WALL_Z0; // 530-410=120
  {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(W, WALL_H, CORR_RIGHT_LEN),
      getEastWallMats(wallMat),
    );
    m.position.set(ROOM_W + W/2, WALL_H/2, (WALL_Z0 + DIAG_AZ) / 2);
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
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

    // ── Assembly porte entrée (encadrement + panneau) ──────────────────────
    const entryDoorAssembly = new THREE.Group();
    entryDoorAssembly.userData.inventoryId = 'door-entry';
    scene.add(entryDoorAssembly);
    {
      const redFMat   = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.5 });
      const whiteFMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.3 });
      const FW = 3, FT = 1;
      function chambSection(d0, d1, height, yBase, outward, mat) {
        const base = outward ? eP : iP;
        const sign = outward ? 1 : -1;
        const pts = [
          base(d0),
          base(d1),
          [base(d1)[0] + sign * FT * pX, base(d1)[1] + sign * FT * pZ],
          [base(d0)[0] + sign * FT * pX, base(d0)[1] + sign * FT * pZ],
        ];
        const shape = new THREE.Shape();
        shape.moveTo(pts[0][0], -pts[0][1]);
        for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], -pts[i][1]);
        shape.closePath();
        const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
        geo.rotateX(-Math.PI / 2);
        if (yBase > 0) geo.translate(0, yBase, 0);
        const m = new THREE.Mesh(geo, mat);
        m.castShadow = true;
        entryDoorAssembly.add(m);
      }
      for (const [outward, mat] of [[true, redFMat], [false, whiteFMat]]) {
        chambSection(E_DOOR_START - FW, E_DOOR_START, DOOR_H, 0,      outward, mat); // jambage gauche
        chambSection(E_DOOR_END,  E_DOOR_END + FW,   DOOR_H, 0,      outward, mat); // jambage droit
        chambSection(E_DOOR_START - FW, E_DOOR_END + FW, FW, DOOR_H, outward, mat); // traverse
      }
      buildEntryDoor({
        hingeX: originX + E_DOOR_START * sinθ,
        hingeZ: originZ + E_DOOR_START * cosθ,
        rotY:   diagRotY,
      }, entryDoorAssembly);
    }
  }

  // =============================================
  // Labels
  // =============================================
  const labelY = WALL_H * 0.6;
  const sdbCZ = (KITCHEN_Z + SDB_Z_END) / 2;
  return makeText(scene, 'MUR COULOIR', { size: 12, x: WALL_X - 30, y: labelY, z: sdbCZ, rotY: Math.PI / 2 });
}
