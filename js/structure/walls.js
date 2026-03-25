import * as THREE from 'three';
import { buildLivingDoor } from './doors.js';
import {
  ROOM_W, ROOM_D, WALL_H,
  NICHE_DEPTH, NICHE_Z_START,
  GLASS_START, GLASS_END,
  DOOR_START, DOOR_END, DOOR_H,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_DEPTH, KITCHEN_Z,
} from '../config.js';

const W = 10; // wall thickness

// Retourne un tableau de 6 matériaux pour BoxGeometry avec une face fantôme.
// BoxGeometry order: [+X(0), -X(1), +Y(2), -Y(3), +Z(4), -Z(5)]
// ghostIdx=0 → face extérieure est (+X) ; ghostIdx=1 → face extérieure ouest (-X)
const _ghostMat = new THREE.MeshStandardMaterial({
  color: 0xe8e4dc, roughness: 0.9,
  transparent: true, opacity: 0.18, depthWrite: false,
});
export function makeGhostExteriorMats(opaqueMat, ghostIdx) {
  return [0,1,2,3,4,5].map(i => i === ghostIdx ? _ghostMat : opaqueMat);
}
export const getEastWallMats = (m) => makeGhostExteriorMats(m, 0);
export const getWestWallMats = (m) => makeGhostExteriorMats(m, 1);

let eastDoorGroup;
let eastDoorOpen = false;

export function toggleEastDoor() {
  eastDoorOpen = !eastDoorOpen;
  eastDoorGroup.rotation.y = eastDoorOpen ? Math.PI / 2 : 0;
  return eastDoorOpen;
}

export function buildWalls(scene) {
  const wallMat  = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.9 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.8 });

  function panel(w, h, d, x, y, z, mat = wallMat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m); return m;
  }

  // ── MUR A (ouest, face extérieure à -X) ──────────────────────────────────
  // Face extérieure (-X, index 1) transparente pour voir l'intérieur depuis l'ouest.
  const westMats = getWestWallMats(wallMat);

  // A1 : de Z=-30 à Z=NICHE_Z_START=280 (longueur 310)
  {
    const m = new THREE.Mesh(new THREE.BoxGeometry(W, WALL_H, 310), westMats);
    m.position.set(-W/2, WALL_H/2, (-30 + NICHE_Z_START) / 2);
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
  }
  // A2 : face X=-NICHE_DEPTH-W/2, de Z=-30 à Z=KITCHEN_Z=460 (longueur 490)
  {
    const m = new THREE.Mesh(new THREE.BoxGeometry(W, WALL_H, 490), westMats);
    m.position.set(-NICHE_DEPTH - W/2, WALL_H/2, (-30 + KITCHEN_Z) / 2);
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
  }
  // A4 retour niche (ferme l'angle à Z=NICHE_Z_START) — face sud (-Z, index 5) vers l'ext.
  panel(NICHE_DEPTH, WALL_H, W, -NICHE_DEPTH/2, WALL_H/2, NICHE_Z_START - W/2);

  // ── MUR B (est, X=ROOM_W=300) ────────────────────────────────────────────
  // Face extérieure (+X, index 0) transparente pour voir l'intérieur depuis l'est.
  // BoxGeometry material order: [+X, -X, +Y, -Y, +Z, -Z]
  const eastMats = getEastWallMats(wallMat);

  // B1 : de Z=-30 à Z=ROOM_D+10=410 (étendu à Z=-30 pour cacher la face nord dans le mur N)
  {
    const m = new THREE.Mesh(new THREE.BoxGeometry(W, WALL_H, ROOM_D + 10 + 30), eastMats);
    m.position.set(ROOM_W + W/2, WALL_H/2, (-30 + ROOM_D + 10) / 2);
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
  }
  // B2 extension jardin : de Z=-230 à Z=-30 (joint avec B1 à Z=-30)
  {
    const m = new THREE.Mesh(new THREE.BoxGeometry(W, WALL_H, 200), eastMats);
    m.position.set(ROOM_W + W/2, WALL_H/2, (-230 + -30) / 2);
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
  }

  // Panneaux bois occultants (2 × 90cm) à la suite du mur B prolongé
  {
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.6 });
    const PANEL_W = 90;
    const PANEL_H = 190;
    const PANEL_T = 10;
    const panelX = ROOM_W + 5;
    const WALLB_EXT = 230;
    const panelZ0 = -WALLB_EXT;

    for (let i = 0; i < 2; i++) {
      const pz = panelZ0 - i * PANEL_W - PANEL_W / 2;
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(PANEL_T, PANEL_H, PANEL_W),
        panelMat
      );
      p.position.set(panelX, PANEL_H / 2, pz);
      p.castShadow = true;
      p.receiveShadow = true;
      scene.add(p);
    }
  }

  // ── MUR C (nord, Z=0) — trapèze + porte-fenêtre — KEPT VERBATIM ──────────
  {
    const WALL_DEPTH = 30;
    const NW_EXT = 20; // mur A déborde à l'ouest
    const NE_EXT = 10; // mur B déborde à l'est
    const GLASS_TOP_Y = 210; // replaces GLASS_MAX_LAYER * BRICK_H

    const wallMatC = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.9 });

    // Crée un trapèze XZ extrudé vers le haut sur `height` cm, décalé de `yBase`.
    // pts : tableau de [worldX, worldZ] définissant le contour vu du dessus.
    function trapWall(pts, height, yBase = 0) {
      const shape = new THREE.Shape();
      shape.moveTo(pts[0][0], -pts[0][1]);
      for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], -pts[i][1]);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2);
      if (yBase > 0) geo.translate(0, yBase, 0);
      const mesh = new THREE.Mesh(geo, wallMatC);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    }

    // Section gauche : angle NO bisauté → bord gauche de la baie
    trapWall([
      [0,           0          ],  // arête int. NW
      [GLASS_START, 0          ],  // arête int. bord gauche baie
      [GLASS_START, -WALL_DEPTH],  // arête ext. bord gauche baie
      [-NW_EXT,     -WALL_DEPTH],  // arête ext. NW
    ], WALL_H);

    // Section droite : bord droit de la baie → angle NE bisauté
    trapWall([
      [GLASS_END,        0          ],  // arête int. bord droit baie
      [ROOM_W,           0          ],  // arête int. NE
      [ROOM_W + NE_EXT,  -WALL_DEPTH],  // arête ext. NE
      [GLASS_END,        -WALL_DEPTH],  // arête ext. bord droit baie
    ], WALL_H);

    // Linteau (au-dessus de la baie) — rectangle simple
    const linteauH = WALL_H - GLASS_TOP_Y;
    const linteau = new THREE.Mesh(
      new THREE.BoxGeometry(GLASS_END - GLASS_START, linteauH, WALL_DEPTH),
      wallMatC
    );
    linteau.position.set(
      (GLASS_START + GLASS_END) / 2,
      GLASS_TOP_Y + linteauH / 2,
      -WALL_DEPTH / 2
    );
    linteau.castShadow = true;
    linteau.receiveShadow = true;
    scene.add(linteau);

  }

  // Porte-fenêtre double avec cadre PVC blanc et poignée
  {
    const glassW = GLASS_END - GLASS_START; // 160
    const SILL_H = 20;                            // seuil maçonné 20cm
    const glassBaseY = SILL_H;                    // vitrage démarre à 20cm
    const glassTopY = 210;                        // GLASS_TOP_Y = 210
    const glassH = glassTopY - glassBaseY;         // 190
    const midX = GLASS_START + glassW / 2;         // 170 — axe central
    const Z = -5;
    const FRAME = 8; // largeur cadre PVC
    const FRAME_D = 5; // profondeur cadre
    const doorW = glassW / 2; // 80cm chaque
    const innerH = glassH - FRAME * 2;

    const pvcMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff, transparent: true, opacity: 0.25,
      roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide,
    });
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.3 });

    // Helper : ajoute un battant (cadre + vitrage) dans un parent
    function addDoorPanel(parent, lx, ly) {
      const top = new THREE.Mesh(new THREE.BoxGeometry(doorW, FRAME, FRAME_D), pvcMat);
      top.position.set(lx, ly + glassH - FRAME / 2, Z);
      parent.add(top);

      const bot = new THREE.Mesh(new THREE.BoxGeometry(doorW, FRAME, FRAME_D), pvcMat);
      bot.position.set(lx, ly + FRAME / 2, Z);
      parent.add(bot);

      const left = new THREE.Mesh(new THREE.BoxGeometry(FRAME, innerH, FRAME_D), pvcMat);
      left.position.set(lx - doorW / 2 + FRAME / 2, ly + FRAME + innerH / 2, Z);
      parent.add(left);

      const right = new THREE.Mesh(new THREE.BoxGeometry(FRAME, innerH, FRAME_D), pvcMat);
      right.position.set(lx + doorW / 2 - FRAME / 2, ly + FRAME + innerH / 2, Z);
      parent.add(right);

      const paneW = doorW - FRAME * 2;
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(paneW, innerH), glassMat);
      pane.position.set(lx, ly + FRAME + innerH / 2, Z);
      parent.add(pane);
    }

    // Seuil maçonné 20cm dans l'épaisseur du mur C
    const sillMat = new THREE.MeshStandardMaterial({ color: 0xb0a898, roughness: 0.8 });
    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(glassW, SILL_H, 30),
      sillMat
    );
    sill.position.set(midX, SILL_H / 2, -15);
    sill.castShadow = true;
    sill.receiveShadow = true;
    scene.add(sill);

    const glassDoorGroup = new THREE.Group();
    glassDoorGroup.userData.inventoryId = 'door-glass';
    scene.add(glassDoorGroup);

    // Battant ouest (fixe) — groupe taggé pour hover menu
    const westDoorGroup = new THREE.Group();
    westDoorGroup.userData.hoverAction = { label: 'Porte-fenêtre', actionId: 'door-toggle' };
    addDoorPanel(westDoorGroup, GLASS_START + doorW / 2, glassBaseY);
    glassDoorGroup.add(westDoorGroup);

    // Battant est (ouvrant) — groupe avec pivot à la charnière droite (GLASS_END)
    eastDoorGroup = new THREE.Group();
    eastDoorGroup.userData.hoverAction = { label: 'Porte-fenêtre', actionId: 'door-toggle' };
    eastDoorGroup.position.set(GLASS_END, 0, 0);
    addDoorPanel(eastDoorGroup, -doorW / 2, glassBaseY);

    // Poignée (côté intérieur, près du centre)
    const HANDLE_H = 20;
    const HANDLE_Y = glassBaseY + glassH * 0.5;
    const HANDLE_LX = -doorW + FRAME + 4; // près du bord central

    const plate = new THREE.Mesh(new THREE.BoxGeometry(3, HANDLE_H + 4, 1), handleMat);
    plate.position.set(HANDLE_LX, HANDLE_Y, Z + FRAME_D / 2 + 0.5);
    eastDoorGroup.add(plate);

    const lever = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 8), handleMat);
    lever.position.set(HANDLE_LX, HANDLE_Y, Z + FRAME_D / 2 + 4.5);
    eastDoorGroup.add(lever);

    glassDoorGroup.add(eastDoorGroup);
  }

  // ── MUR D (sud, Z=ROOM_D=400) ────────────────────────────────────────────
  // Extension niche côté A
  panel(NICHE_DEPTH, WALL_H, W, -NICHE_DEPTH/2,                    WALL_H/2, ROOM_D + W/2);
  // Section gauche (X=0 → KITCHEN_X0=30)
  panel(KITCHEN_X0, WALL_H, W,  KITCHEN_X0/2,                      WALL_H/2, ROOM_D + W/2);
  // Section milieu (KITCHEN_X1=130 → DOOR_START-10=180)
  panel(DOOR_START - 10 - KITCHEN_X1, WALL_H, W,
        (KITCHEN_X1 + DOOR_START - 10) / 2,                        WALL_H/2, ROOM_D + W/2);
  // Montant gauche porte
  panel(10, WALL_H, W, DOOR_START - 5, WALL_H/2, ROOM_D + W/2);
  // Montant droit porte
  panel(10, WALL_H, W, DOOR_END + 5,   WALL_H/2, ROOM_D + W/2);
  // Linteau porte
  panel(DOOR_END - DOOR_START, WALL_H - DOOR_H, W,
        (DOOR_START + DOOR_END) / 2,
        DOOR_H + (WALL_H - DOOR_H) / 2, ROOM_D + W/2);
  // ── Assembly porte séjour (encadrement + panneau) ────────────────────────
  const livingDoorAssembly = new THREE.Group();
  livingDoorAssembly.userData.inventoryId = 'door-living';
  scene.add(livingDoorAssembly);
  {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.3 });
    const FW = 3, FT = 1;
    function fp(w, h, d, x, y, z) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frameMat);
      m.position.set(x, y, z);
      livingDoorAssembly.add(m);
    }
    for (const zF of [ROOM_D - FT / 2, ROOM_D + W + FT / 2]) {
      fp(FW, DOOR_H, FT, DOOR_START - FW / 2, DOOR_H / 2, zF);
      fp(FW, DOOR_H, FT, DOOR_END   + FW / 2, DOOR_H / 2, zF);
      fp(DOOR_END - DOOR_START + FW * 2, FW, FT, (DOOR_START + DOOR_END) / 2, DOOR_H + FW / 2, zF);
    }
    livingDoorAssembly.add(buildLivingDoor());
  }
  // Section droite (DOOR_END+10=280 → ROOM_W=300)
  panel(ROOM_W - DOOR_END - 10, WALL_H, W,
        (DOOR_END + 10 + ROOM_W) / 2,                              WALL_H/2, ROOM_D + W/2);

  // ── CUISINE (renfoncement) ────────────────────────────────────────────────
  const KITCHEN_DEPTH_VAL = KITCHEN_DEPTH; // 60
  // Mur gauche cuisine
  panel(W, WALL_H, KITCHEN_DEPTH_VAL, KITCHEN_X0 - W/2, WALL_H/2, ROOM_D + KITCHEN_DEPTH_VAL/2);
  // Mur droit cuisine
  panel(W, WALL_H, KITCHEN_DEPTH_VAL, KITCHEN_X1 + W/2, WALL_H/2, ROOM_D + KITCHEN_DEPTH_VAL/2);
  // Mur nord SDB (fond cuisine étendu, X=-NICHE_DEPTH→DOOR_START)
  {
    const SDB_LEN = DOOR_START + NICHE_DEPTH; // 200
    panel(SDB_LEN, WALL_H, W, (DOOR_START - NICHE_DEPTH) / 2, WALL_H/2, KITCHEN_Z + W/2);
  }
}
