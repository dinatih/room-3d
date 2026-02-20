import * as THREE from 'three';
import {
  ROOM_W, ROOM_D, DOOR_START, DOOR_END,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z, KITCHEN_DEPTH,
  NICHE_DEPTH, NICHE_Z_START,
  GLASS_START, GLASS_END,
  CORR_DOOR_S, CORR_DOOR_E,
  DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ,
} from './config.js';
import { makeText } from './labels.js';

export function buildFloorPlan() {
  const group = new THREE.Group();
  const Y = 0.3; // juste au-dessus du sol

  // === Matériaux ===
  const wallMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const doorMat = new THREE.MeshBasicMaterial({ color: 0xcc0000 });
  const windowMat = new THREE.MeshBasicMaterial({ color: 0x4488ff });
  const floorMat = new THREE.MeshBasicMaterial({
    color: 0xd4a437, transparent: true, opacity: 0.15, side: THREE.DoubleSide
  });

  const W = 0.5;  // largeur du trait mur
  const H = 0.15; // hauteur du trait
  const DW = 0.3; // largeur trait porte/fenêtre

  // --- Helper : trait de mur ---
  function wallLine(x1, z1, x2, z2, mat = wallMat, width = W) {
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.01) return;
    const geo = new THREE.BoxGeometry(len, H, width);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((x1 + x2) / 2, Y, (z1 + z2) / 2);
    mesh.rotation.y = -Math.atan2(dz, dx);
    group.add(mesh);
  }

  function door(x1, z1, x2, z2) { wallLine(x1, z1, x2, z2, doorMat, DW); }
  function window_(x1, z1, x2, z2) { wallLine(x1, z1, x2, z2, windowMat, DW); }

  // --- Helper : sol de pièce ---
  function floorRect(x, z, w, d) {
    const geo = new THREE.PlaneGeometry(w, d);
    const mesh = new THREE.Mesh(geo, floorMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x + w / 2, Y - 0.1, z + d / 2);
    group.add(mesh);
  }

  // === SOLS ===
  floorRect(0, 0, ROOM_W, ROOM_D);                                         // Séjour
  floorRect(-NICHE_DEPTH, NICHE_Z_START, NICHE_DEPTH, ROOM_D - NICHE_Z_START); // Niche
  floorRect(KITCHEN_X0, ROOM_D, KITCHEN_X1 - KITCHEN_X0, KITCHEN_DEPTH);   // Cuisine
  floorRect(DOOR_START, ROOM_D + 1, ROOM_W - DOOR_START, 13);              // Entrée
  floorRect(-NICHE_DEPTH, KITCHEN_Z + 1, DOOR_START + NICHE_DEPTH, 13);    // SDB
  floorRect(-NICHE_DEPTH, 60, 7, 7);                                          // Douche

  // === MUR A OUEST (niche) ===
  wallLine(0, 0, 0, NICHE_Z_START);
  wallLine(0, NICHE_Z_START, -NICHE_DEPTH, NICHE_Z_START);
  wallLine(-NICHE_DEPTH, NICHE_Z_START, -NICHE_DEPTH, ROOM_D);

  // === MUR B EST ===
  wallLine(ROOM_W, 0, ROOM_W, ROOM_D);

  // === MUR C NORD (baie vitrée) ===
  wallLine(0, 0, GLASS_START, 0);
  window_(GLASS_START, 0, GLASS_END, 0);
  wallLine(GLASS_END, 0, ROOM_W, 0);

  // === MUR D SUD (porte + cuisine) ===
  wallLine(-NICHE_DEPTH, ROOM_D, KITCHEN_X0, ROOM_D);
  wallLine(KITCHEN_X1, ROOM_D, DOOR_START, ROOM_D);
  door(DOOR_START, ROOM_D, DOOR_END, ROOM_D);
  wallLine(DOOR_END, ROOM_D, ROOM_W, ROOM_D);

  // === CUISINE ===
  wallLine(KITCHEN_X0, ROOM_D, KITCHEN_X0, KITCHEN_Z);
  wallLine(KITCHEN_X1, ROOM_D, KITCHEN_X1, KITCHEN_Z);

  // === MUR SDB NORD ===
  wallLine(-NICHE_DEPTH, KITCHEN_Z, DOOR_START, KITCHEN_Z);

  // === PLACARD COULISSANT (X=13→19, Z=41→46) ===
  const CW_Z0 = ROOM_D + 1; // 41
  floorRect(KITCHEN_X1, CW_Z0, DOOR_START - KITCHEN_X1, KITCHEN_Z - CW_Z0); // sol placard
  door(DOOR_START, CW_Z0, DOOR_START, KITCHEN_Z); // porte coulissante

  // === COULOIR STUDIO ===
  wallLine(DOOR_START, KITCHEN_Z, DOOR_START, CORR_DOOR_S);
  door(DOOR_START, CORR_DOOR_S, DOOR_START, CORR_DOOR_E);
  wallLine(DOOR_START, CORR_DOOR_E, DOOR_START, KITCHEN_Z + 14);

  wallLine(ROOM_W, CW_Z0, ROOM_W, CW_Z0 + 13);

  // === SDB OUEST ===
  wallLine(-NICHE_DEPTH, KITCHEN_Z, -NICHE_DEPTH, DIAG_CZ);

  // === MUR SDB SUD (vitrage douche + PC-SDB) ===
  window_(-NICHE_DEPTH, 60, 6, 60);         // VDch (vitrage douche)
  door(6, 60, DOOR_START, 60);              // PC-SDB (double porte coulissante placard)

  // === DOUCHE ===
  wallLine(6, 60, 6, 67);                   // MDch (X=6)
  wallLine(-NICHE_DEPTH, 67, 6, 67);

  // === MUR DIAGONAL BATIMENT (avec porte d'entrée) ===
  const DA = { x: DIAG_AX + 0.5, z: DIAG_AZ + 0.5 };
  const DC = { x: DIAG_CX - 0.5, z: DIAG_CZ + 0.5 };
  const dLen = Math.sqrt((DA.x - DC.x) ** 2 + (DA.z - DC.z) ** 2);
  const dX = (DC.x - DA.x) / dLen;
  const dZ = (DC.z - DA.z) / dLen;

  const doorS = { x: DA.x + 1 * dX, z: DA.z + 1 * dZ };
  const doorE = { x: DA.x + 10 * dX, z: DA.z + 10 * dZ };

  wallLine(DA.x, DA.z, doorS.x, doorS.z);
  door(doorS.x, doorS.z, doorE.x, doorE.z);
  wallLine(doorE.x, doorE.z, DC.x, DC.z);

  // === LABELS ===
  const LY = Y + 0.5;
  const WALL_COLOR = '#ffdd44';
  const DOOR_COLOR = '#ff6666';
  const WIN_COLOR = '#66aaff';
  const ROOM_COLOR = '#aaaaaa';

  // Helper : texte à plat sur le sol (lisible du dessus)
  // rotZ : 0 = texte le long de +X, PI/2 = texte le long de +Z
  function label(text, x, z, rotZ = 0, color = WALL_COLOR, size = 1.2) {
    const mesh = makeText(group, text, { color, size, x, y: LY, z });
    mesh.rotation.set(-Math.PI / 2, 0, rotZ);
    return mesh;
  }

  // --- Noms des pièces (gris, grand) ---
  label('Séjour', ROOM_W / 2, ROOM_D / 2, 0, ROOM_COLOR, 2.5);
  label('Cuisine', (KITCHEN_X0 + KITCHEN_X1) / 2, ROOM_D + KITCHEN_DEPTH / 2, 0, ROOM_COLOR, 1.5);
  label('Entrée', (DOOR_START + ROOM_W) / 2, ROOM_D + 7, 0, ROOM_COLOR, 1.5);
  label('SdB', ((-NICHE_DEPTH) + DOOR_START) / 2, (KITCHEN_Z + 60) / 2, 0, ROOM_COLOR, 1.8);
  label('Douche', 2.5, 63.5, 0, ROOM_COLOR, 1.2);

  // --- Murs principaux (séjour) ---
  label('MA', -2.5, NICHE_Z_START / 2, Math.PI / 2, WALL_COLOR, 1.0);     // Mur A Ouest
  label('MB', ROOM_W + 2, ROOM_D / 2, -Math.PI / 2, WALL_COLOR, 1.0);    // Mur B Est
  label('MC', ROOM_W / 2, -2, 0, WALL_COLOR, 1.0);                        // Mur C Nord
  label('MD', ROOM_W / 2, ROOM_D + 2, 0, WALL_COLOR, 1.0);               // Mur D Sud

  // --- Niche (extension mur A) ---
  label('MN', -NICHE_DEPTH - 1.5, (NICHE_Z_START + ROOM_D) / 2, Math.PI / 2, WALL_COLOR, 0.8);

  // --- Cuisine ---
  label('MK-O', KITCHEN_X0 - 1.5, (ROOM_D + KITCHEN_Z) / 2, Math.PI / 2, WALL_COLOR, 0.8);  // Mur Cuisine Ouest
  label('MK-E', KITCHEN_X1 + 1.5, (ROOM_D + KITCHEN_Z) / 2, -Math.PI / 2, WALL_COLOR, 0.8); // Mur Cuisine Est

  // --- SdB ---
  label('MS-N', ((-NICHE_DEPTH) + DOOR_START) / 2, KITCHEN_Z - 1.5, 0, WALL_COLOR, 0.8);     // Mur SdB Nord
  label('MS-O', -NICHE_DEPTH - 1.5, (KITCHEN_Z + 60) / 2, Math.PI / 2, WALL_COLOR, 0.8);     // Mur SdB Ouest
  label('PC-SDB', (6 + DOOR_START) / 2, 60 + 1.5, 0, DOOR_COLOR, 0.8);                          // Double porte coulissante placard

  // --- Douche ---
  label('MDch', 6 + 1.5, 63.5, -Math.PI / 2, WALL_COLOR, 0.7);  // Mur Douche Est

  // --- Placard ---
  label('Placard', (KITCHEN_X1 + DOOR_START) / 2, (CW_Z0 + KITCHEN_Z) / 2, 0, ROOM_COLOR, 1.0);
  label('PC', DOOR_START + 2, (CW_Z0 + KITCHEN_Z) / 2, -Math.PI / 2, DOOR_COLOR, 0.8);  // Porte Coulissante

  // --- Couloir ---
  label('MCo-O', DOOR_START - 1.5, (KITCHEN_Z + KITCHEN_Z + 14) / 2, Math.PI / 2, WALL_COLOR, 0.7); // Mur Couloir Ouest
  label('MCo-E', ROOM_W + 2, (CW_Z0 + CW_Z0 + 13) / 2, -Math.PI / 2, WALL_COLOR, 0.7);            // Mur Couloir Est

  // --- Mur diagonal ---
  const diagMid = { x: (DA.x + DC.x) / 2, z: (DA.z + DC.z) / 2 };
  const diagAngle = Math.atan2(DC.z - DA.z, DC.x - DA.x);
  label('MDiag', diagMid.x + 2, diagMid.z + 2, diagAngle, WALL_COLOR, 0.8);

  // --- Portes ---
  label('P1', (DOOR_START + DOOR_END) / 2, ROOM_D - 2, 0, DOOR_COLOR, 1.0);    // Porte Séjour
  label('P2', DOOR_START + 2, (CORR_DOOR_S + CORR_DOOR_E) / 2, 0, DOOR_COLOR, 1.0);           // Porte SdB
  const doorMid = { x: (doorS.x + doorE.x) / 2, z: (doorS.z + doorE.z) / 2 };
  label('P3', doorMid.x + 2, doorMid.z - 2, diagAngle, DOOR_COLOR, 1.0);        // Porte Entrée

  // --- Fenêtres ---
  label('Baie', (GLASS_START + GLASS_END) / 2, -4, 0, WIN_COLOR, 0.9);           // Baie vitrée
  label('VDch', 3.5, 60 - 1.5, 0, WIN_COLOR, 0.8);                               // Vitre douche

  // --- Label jardin (les pointillés sont dans la scène 3D, toujours visibles) ---
  label('Jardin', 14, -16, 0, '#4a9e54', 2);

  // =============================================
  // COTATIONS (Dimensions internes / externes)
  // =============================================
  const DIM_INT = '#88ffaa';
  const DIM_EXT = '#aaddff';
  const dimMatInt = new THREE.LineBasicMaterial({ color: 0x88ffaa, depthTest: false });
  const dimMatExt = new THREE.LineBasicMaterial({ color: 0xaaddff, depthTest: false });

  function dim(x1, z1, x2, z2, offset, ext = false) {
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.01) return;

    const px = -dz / len, pz = dx / len;
    const s = Math.sign(offset);

    const ax = x1 + px * offset, az = z1 + pz * offset;
    const bx = x2 + px * offset, bz = z2 + pz * offset;
    const e = s * 0.5, g = s * 0.3;

    const positions = new Float32Array([
      ax, Y, az, bx, Y, bz,
      x1 + px * g, Y, z1 + pz * g, ax + px * e, Y, az + pz * e,
      x2 + px * g, Y, z2 + pz * g, bx + px * e, Y, bz + pz * e,
    ]);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const line = new THREE.LineSegments(geo, ext ? dimMatExt : dimMatInt);
    line.renderOrder = 998;
    group.add(line);

    const meters = len / 10;
    const text = meters >= 1 ? `${meters.toFixed(1)}m` : `${Math.round(meters * 100)}cm`;
    const mx = (ax + bx) / 2, mz = (az + bz) / 2;

    let angle = -Math.atan2(dz, dx);
    if (Math.cos(angle) < -0.001 ||
        (Math.abs(Math.cos(angle)) < 0.001 && Math.sin(angle) < 0)) {
      angle += Math.PI;
    }

    const m = makeText(group, text, {
      color: ext ? DIM_EXT : DIM_INT, size: 0.65,
      x: mx, y: LY + 0.1, z: mz,
    });
    m.rotation.set(-Math.PI / 2, 0, angle);
  }

  // --- Séjour : largeur (MC) ---
  dim(GLASS_START, 0, GLASS_END, 0, -1.5);             // Baie vitrée : 1.7m
  dim(0, 0, ROOM_W, 0, -3.5);                           // int : 3.0m
  dim(-1, -1, ROOM_W + 1, -1, -5, true);                 // ext : 3.2m

  // --- Séjour : profondeur (MA) ---
  dim(0, 0, 0, ROOM_D, 3);                              // int : 4.0m
  dim(-1, -1, -1, ROOM_D + 1, 5, true);                 // ext : 4.2m

  // --- Porte P1 sur MD ---
  dim(DOOR_START, ROOM_D, DOOR_END, ROOM_D, -2);        // P1 : 80cm

  // --- Cuisine ---
  dim(KITCHEN_X0, ROOM_D, KITCHEN_X1, ROOM_D, -2);      // ouverture : 1.0m
  dim(KITCHEN_X0, ROOM_D, KITCHEN_X0, KITCHEN_Z, -2);   // prof int : 60cm
  dim(KITCHEN_X0, KITCHEN_Z, KITCHEN_X1, KITCHEN_Z, -2); // larg int : 1.0m

  // --- SdB ---
  dim(-NICHE_DEPTH, KITCHEN_Z, DOOR_START, KITCHEN_Z, 2); // larg int : 2.0m
  dim(-NICHE_DEPTH, KITCHEN_Z, -NICHE_DEPTH, 60, -2);     // prof int : 1.4m

  // --- Douche ---
  dim(-NICHE_DEPTH, 67, 6, 67, -2);                      // larg int : 70cm
  dim(6, 60, 6, 67, 2);                                   // prof int : 70cm

  // --- Entrée / Couloir ---
  dim(DOOR_START, ROOM_D + 1, ROOM_W, ROOM_D + 1, 3);   // larg : 1.1m
  dim(ROOM_W, ROOM_D + 1, ROOM_W, ROOM_D + 14, -2);     // prof MCo-E : 1.3m

  // --- Placard ---
  dim(KITCHEN_X1, ROOM_D + 1, DOOR_START, ROOM_D + 1, 2); // larg : 60cm

  // --- Ouvertures ---
  dim(6, 60, DOOR_START, 60, -2);                          // PC-SDB : 1.3m
  dim(-NICHE_DEPTH, 60, 6, 60, 2);                         // VDch : 70cm
  dim(DOOR_START, CORR_DOOR_S, DOOR_START, CORR_DOOR_E, -2);             // P2 : 80cm
  dim(doorS.x, doorS.z, doorE.x, doorE.z, 3);             // P3 : 90cm

  // --- Ext. mur diagonal ---
  dim(DA.x, DA.z, DC.x, DC.z, 6, true);                   // MDiag ext : 3.6m

  return group;
}
