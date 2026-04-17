import * as THREE from 'three';
import {
  ROOM_W, ROOM_D, DOOR_START,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z, KITCHEN_DEPTH,
  NICHE_DEPTH, NICHE_Z_START,
  GLASS_START, GLASS_END,
  SDB_Z_END,
  DIAG_AZ, DIAG_CZ,
} from '../config';
import { makeText } from './labels';
import { FLOOR_SEGMENTS, ROOMS, WALL_LABELS, DIMENSIONS } from './floorData';

export function buildFloorPlan() {
  const group = new THREE.Group();
  const Y = 3; // juste au-dessus du sol

  // === Matériaux ===
  const wallMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const doorMat = new THREE.MeshBasicMaterial({ color: 0xcc0000 });
  const windowMat = new THREE.MeshBasicMaterial({ color: 0x4488ff });
  const floorMat = new THREE.MeshBasicMaterial({
    color: 0xd4a437, transparent: true, opacity: 0.15, side: THREE.DoubleSide
  });

  const W = 5;    // largeur du trait mur
  const H = 1.5;  // hauteur du trait
  const DW = 3;   // largeur trait porte/fenêtre

  // --- Helper : trait de mur ---
  function wallLine(x1: number, z1: number, x2: number, z2: number, mat: THREE.Material = wallMat, width: number = W) {
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.1) return;
    const geo = new THREE.BoxGeometry(len, H, width);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((x1 + x2) / 2, Y, (z1 + z2) / 2);
    mesh.rotation.y = -Math.atan2(dz, dx);
    group.add(mesh);
  }

  function door(x1: number, z1: number, x2: number, z2: number) { wallLine(x1, z1, x2, z2, doorMat, DW); }
  function window_(x1: number, z1: number, x2: number, z2: number) { wallLine(x1, z1, x2, z2, windowMat, DW); }

  // --- Helper : sol de pièce ---
  function floorRect(x: number, z: number, w: number, d: number) {
    const geo = new THREE.PlaneGeometry(w, d);
    const mesh = new THREE.Mesh(geo, floorMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x + w / 2, Y - 1, z + d / 2);
    group.add(mesh);
  }

  // --- Helper : sol triangulaire ---
  function floorTri(x1: number, z1: number, x2: number, z2: number, x3: number, z3: number) {
    const y = Y - 1;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([
      x1, y, z1, x2, y, z2, x3, y, z3,
    ], 3));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, floorMat);
    group.add(mesh);
  }

  // === SOLS ===
  floorRect(0, 0, ROOM_W, ROOM_D);                                         // Séjour
  floorRect(-NICHE_DEPTH, NICHE_Z_START, NICHE_DEPTH, ROOM_D - NICHE_Z_START); // Niche
  floorRect(KITCHEN_X0, ROOM_D, KITCHEN_X1 - KITCHEN_X0, KITCHEN_DEPTH);   // Cuisine
  floorRect(DOOR_START, ROOM_D + 10, ROOM_W - DOOR_START, DIAG_AZ - ROOM_D - 10); // Entrée (rect)
  floorTri(DOOR_START, DIAG_AZ, ROOM_W, DIAG_AZ, DOOR_START, SDB_Z_END);       // Entrée (triangle)
  floorRect(-NICHE_DEPTH, KITCHEN_Z + 10, DOOR_START + NICHE_DEPTH, SDB_Z_END - KITCHEN_Z - 10); // SDB
  floorTri(-NICHE_DEPTH, SDB_Z_END, DOOR_START, SDB_Z_END, -NICHE_DEPTH, DIAG_CZ); // SDB sud (douche + PC-SDB + triangle)

  // === SEGMENTS (données partagées avec minimap via floorData.js) ===
  const CW_Z0 = ROOM_D + 10;
  floorRect(KITCHEN_X1, CW_Z0, DOOR_START - KITCHEN_X1, KITCHEN_Z - CW_Z0); // sol placard

  for (const { t, x1, z1, x2, z2 } of FLOOR_SEGMENTS) {
    if      (t === 'w') wallLine(x1, z1, x2, z2);
    else if (t === 'd') door(x1, z1, x2, z2);
    else if (t === 'n') window_(x1, z1, x2, z2);
  }

  // === LABELS ===
  const LY = Y + 5;
  const WALL_COLOR = '#ffdd44';
  const DOOR_COLOR = '#ff6666';
  const WIN_COLOR = '#66aaff';
  const ROOM_COLOR = '#aaaaaa';

  // Helper : texte à plat sur le sol (lisible du dessus)
  // rotZ : 0 = texte le long de +X, PI/2 = texte le long de +Z
  function label(text: string, x: number, z: number, rotZ = 0, color = WALL_COLOR, size = 12) {
    const mesh = makeText(group, text, { color, size, x, y: LY, z });
    mesh.rotation.set(-Math.PI / 2, 0, rotZ);
    return mesh;
  }

  // --- Noms des pièces (depuis ROOMS, source partagée avec minimap) ---
  for (const r of ROOMS) {
    label(r.nameFr, r.labelX, r.labelZ, 0, r.labelColor ?? ROOM_COLOR, r.labelSize);
  }

  // --- Murs, portes, fenêtres (depuis WALL_LABELS, source partagée avec minimap) ---
  const colorByType = { w: WALL_COLOR, d: DOOR_COLOR, n: WIN_COLOR };
  for (const w of WALL_LABELS) {
    label(w.name, w.x, w.z, w.rotZ, colorByType[w.t], w.size);
  }

  // --- Placard (label de zone, pas un mur) ---
  label('Placard', (KITCHEN_X1 + DOOR_START) / 2, (CW_Z0 + KITCHEN_Z) / 2, 0, ROOM_COLOR, 10);

  // =============================================
  // COTATIONS (Dimensions internes / externes)
  // =============================================
  const DIM_INT = '#88ffaa';
  const DIM_EXT = '#aaddff';
  const dimMatInt = new THREE.LineBasicMaterial({ color: 0x88ffaa, depthTest: false });
  const dimMatExt = new THREE.LineBasicMaterial({ color: 0xaaddff, depthTest: false });

  function dim(x1: number, z1: number, x2: number, z2: number, offset: number, ext = false) {
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.1) return;

    const px = -dz / len, pz = dx / len;
    const s = Math.sign(offset);

    const ax = x1 + px * offset, az = z1 + pz * offset;
    const bx = x2 + px * offset, bz = z2 + pz * offset;
    const e = s * 5, g = s * 3;

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

    const meters = len / 100;
    const text = meters >= 1 ? `${meters.toFixed(1)}m` : `${Math.round(meters * 100)}cm`;
    const mx = (ax + bx) / 2, mz = (az + bz) / 2;

    let angle = -Math.atan2(dz, dx);
    if (Math.cos(angle) < -0.001 ||
        (Math.abs(Math.cos(angle)) < 0.001 && Math.sin(angle) < 0)) {
      angle += Math.PI;
    }

    const m = makeText(group, text, {
      color: ext ? DIM_EXT : DIM_INT, size: 6.5,
      x: mx, y: LY + 1, z: mz,
    });
    m.rotation.set(-Math.PI / 2, 0, angle);
  }

  // --- Cotations (depuis DIMENSIONS, source partagée avec minimap) ---
  for (const d of DIMENSIONS) {
    dim(d.x1, d.z1, d.x2, d.z2, d.offset, d.ext ?? false);
  }

  return group;
}
