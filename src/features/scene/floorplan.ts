import * as THREE from 'three';
import {
  ROOM_W, ROOM_D, DOOR_START,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z, KITCHEN_DEPTH,
  NICHE_DEPTH, NICHE_Z_START,
  SDB_Z_END,
  DIAG_AZ, DIAG_CZ,
} from '@config';
import { SEG_WALLS, SEG_DOORS, SEG_WINDOWS } from './floorData';

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

  for (const [x1, z1, x2, z2] of SEG_WALLS)   wallLine(x1, z1, x2, z2);
  for (const [x1, z1, x2, z2] of SEG_DOORS)   door(x1, z1, x2, z2);
  for (const [x1, z1, x2, z2] of SEG_WINDOWS) window_(x1, z1, x2, z2);

  return group;
}
