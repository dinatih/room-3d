import * as THREE from 'three';
import {
  ROOM_W, ROOM_D, NUM_LAYERS, BRICK_H,
  NICHE_DEPTH, NICHE_LENGTH, NICHE_Z_START,
  GLASS_START, GLASS_END, GLASS_MIN_LAYER, GLASS_MAX_LAYER,
  DOOR_START, DOOR_END, DOOR_H_LAYERS,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_DEPTH, KITCHEN_Z,
} from './config.js';
import { fillRow, addBrickX, addBrickZ, addFloorBrick } from './brickHelpers.js';

// --- Helper: mur avec ouvertures multiples ---
function buildWallWithOpenings(wallZ, length, openings) {
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(length, layer % 2 === 1)) {
      const bS = b.start;
      const bE = bS + b.size;
      let segments = [{ s: bS, e: bE }];
      for (const op of openings) {
        const minL = op.minLayer || 0;
        if (layer < minL || layer >= op.maxLayer) continue;
        const newSegments = [];
        for (const seg of segments) {
          if (seg.e <= op.start || seg.s >= op.end) {
            newSegments.push(seg);
          } else {
            if (seg.s < op.start) newSegments.push({ s: seg.s, e: op.start });
            if (seg.e > op.end) newSegments.push({ s: op.end, e: seg.e });
          }
        }
        segments = newSegments;
      }
      for (const seg of segments) {
        const size = seg.e - seg.s;
        if (size > 0) addBrickX(seg.s, layer, wallZ, size, 'wall');
      }
    }
  }
}

export function buildWalls(scene) {
  // --- Mur gauche A (x = -5), prolongé jusqu'à Z=-30 ---
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(NICHE_Z_START + 30, layer % 2 === 1))
      addBrickZ(-5, layer, -30 + b.start, b.size, 'wall');
  }
  // Section niche ouest (x = -NICHE_DEPTH - 5), prolongée jusqu'à Z=-30
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(NICHE_Z_START + NICHE_LENGTH + 30, layer % 2 === 1))
      addBrickZ(-NICHE_DEPTH - 5, layer, -30 + b.start, b.size, 'wall');
  }
  // Retour de niche à Z=280
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    addBrickX(-NICHE_DEPTH, layer, NICHE_Z_START - 5, NICHE_DEPTH, 'wall');
  }

  // --- Mur droit B (x = ROOM_W + 5) ---
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(ROOM_D, layer % 2 === 1))
      addBrickZ(ROOM_W + 5, layer, b.start, b.size, 'wall');
  }

  // Extension mur B vers le jardin (30cm mur C + 200cm)
  const WALLB_EXT = 230;
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(WALLB_EXT, layer % 2 === 1))
      addBrickZ(ROOM_W + 5, layer, -WALLB_EXT + b.start, b.size, 'wall');
  }

  // Panneaux bois occultants (2 × 90cm) à la suite du mur B prolongé
  {
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.6 });
    const PANEL_W = 90;    // 90cm chacun
    const PANEL_H = 190;   // 190cm
    const PANEL_T = 10;    // 10cm d'épaisseur
    const panelX = ROOM_W + 5;
    const panelZ0 = -WALLB_EXT; // Z=-230, suite du mur

    for (let i = 0; i < 2; i++) {
      const pz = panelZ0 - i * PANEL_W - PANEL_W / 2;
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(PANEL_T, PANEL_H, PANEL_W),
        panelMat
      );
      panel.position.set(panelX, PANEL_H / 2, pz);
      panel.castShadow = true;
      panel.receiveShadow = true;
      scene.add(panel);
    }
  }

  // --- Mur arrière C (30cm = 3 rangées, z = -5 / -15 / -25) avec baie vitrée ---
  const wallC_openings = [
    { start: GLASS_START - 10, end: GLASS_END + 10, minLayer: GLASS_MIN_LAYER, maxLayer: GLASS_MAX_LAYER },
    { start: GLASS_START, end: GLASS_END, minLayer: GLASS_MAX_LAYER, maxLayer: GLASS_MAX_LAYER + 1 },
  ];
  for (const wz of [-5, -15, -25])
    buildWallWithOpenings(wz, ROOM_W, wallC_openings);

  // Encadrement baie vitrée (accent bleu) sur les 3 rangées
  for (const wz of [-5, -15, -25]) {
    for (let layer = GLASS_MIN_LAYER; layer < GLASS_MAX_LAYER; layer++) {
      addBrickX(GLASS_START - 10, layer, wz, 10, 'glass_frame');
      addBrickX(GLASS_END, layer, wz, 10, 'glass_frame');
    }
    addBrickX(GLASS_START, GLASS_MAX_LAYER, wz, GLASS_END - GLASS_START, 'glass_frame');
  }

  // Vitrage (panneau semi-transparent)
  {
    const glassW = GLASS_END - GLASS_START;
    const glassBaseY = GLASS_MIN_LAYER * BRICK_H;
    const glassTopY = GLASS_MAX_LAYER * BRICK_H;
    const glassH = glassTopY - glassBaseY;
    const glassGeo = new THREE.PlaneGeometry(glassW, glassH);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.25,
      roughness: 0.05,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.set(GLASS_START + glassW / 2, glassBaseY + glassH / 2, -5);
    scene.add(glassMesh);

    // Barre centrale
    const barGeo = new THREE.BoxGeometry(3, glassH, 5);
    const barMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.4 });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(GLASS_START + glassW / 2, glassBaseY + glassH / 2, -5);
    scene.add(bar);
  }

  // --- Mur avant D (z = ROOM_D + 5) avec porte + ouverture cuisine ---
  // Ouvertures élargies pour inclure l'encadrement (évite z-fighting)
  buildWallWithOpenings(ROOM_D + 5, ROOM_W, [
    { start: KITCHEN_X0, end: KITCHEN_X1, maxLayer: NUM_LAYERS },
    { start: DOOR_START - 10, end: DOOR_END + 10, maxLayer: DOOR_H_LAYERS },
    { start: DOOR_START, end: DOOR_END, minLayer: DOOR_H_LAYERS, maxLayer: DOOR_H_LAYERS + 1 },
  ]);

  // Extension mur D côté A
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    addBrickX(-NICHE_DEPTH, layer, ROOM_D + 5, NICHE_DEPTH, 'wall');
  }

  // --- Encadrement porte (accent rouge) ---
  for (let layer = 0; layer < DOOR_H_LAYERS; layer++) {
    addBrickX(DOOR_START - 10, layer, ROOM_D + 5, 10, 'accent');
    addBrickX(DOOR_END, layer, ROOM_D + 5, 10, 'accent');
  }
  addBrickX(DOOR_START, DOOR_H_LAYERS, ROOM_D + 5, DOOR_END - DOOR_START, 'accent');

  // --- Renfoncement cuisine (3 murs) ---
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(KITCHEN_DEPTH, layer % 2 === 1))
      addBrickZ(KITCHEN_X0 - 5, layer, ROOM_D + b.start, b.size, 'wall');
  }
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(KITCHEN_DEPTH, layer % 2 === 1))
      addBrickZ(KITCHEN_X1 + 5, layer, ROOM_D + b.start, b.size, 'wall');
  }
  // Mur salle de bain (fond cuisine étendu) : X=-NICHE_DEPTH → DOOR_START
  const SDB_LEN = DOOR_START + NICHE_DEPTH; // 200cm = 2m
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(SDB_LEN, layer % 2 === 1))
      addBrickX(-NICHE_DEPTH + b.start, layer, KITCHEN_Z + 5, b.size, 'wall');
  }

  // Sol cuisine (à l'intérieur des murs MK-O, MK-E et MS-N)
  const KIT_FW = KITCHEN_X1 - KITCHEN_X0;
  for (let z = ROOM_D + 10; z < KITCHEN_Z; z += 10) {
    for (const b of fillRow(KIT_FW, (z / 10) % 2 === 1)) {
      addFloorBrick(KITCHEN_X0 + b.start, z, b.size);
    }
  }
}
