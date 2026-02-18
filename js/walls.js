import * as THREE from 'three';
import {
  ROOM_W, ROOM_D, NUM_LAYERS, BRICK_H, PLATE_H, GAP,
  NICHE_DEPTH, NICHE_LENGTH, NICHE_Z_START,
  GLASS_START, GLASS_END, GLASS_MIN_LAYER, GLASS_MAX_LAYER,
  DOOR_START, DOOR_END, DOOR_H_LAYERS,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_DEPTH, KITCHEN_Z,
} from './config.js';
import { fillRow, addBrickX, addBrickZ, allBricks } from './brickHelpers.js';

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
  // --- Mur gauche A (x = -0.5) - avec enfoncement angle D-A ---
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(NICHE_Z_START, layer % 2 === 1))
      addBrickZ(-0.5, layer, b.start, b.size, 'wall');
  }
  // Section niche : Z=28 à Z=40, reculée de 1 stud dans le mur (vers -X)
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(NICHE_LENGTH, layer % 2 === 1))
      addBrickZ(-NICHE_DEPTH - 0.5, layer, NICHE_Z_START + b.start, b.size, 'wall');
  }
  // Retour de niche à Z=28
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    addBrickX(-NICHE_DEPTH, layer, NICHE_Z_START - 0.5, NICHE_DEPTH, 'wall');
  }

  // --- Mur droit (x = ROOM_W + 0.5) ---
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(ROOM_D, layer % 2 === 1))
      addBrickZ(ROOM_W + 0.5, layer, b.start, b.size, 'wall');
  }

  // --- Mur arrière C (z = -0.5) avec baie vitrée ---
  // Ouvertures élargies pour inclure l'encadrement (évite z-fighting)
  buildWallWithOpenings(-0.5, ROOM_W, [
    { start: GLASS_START - 1, end: GLASS_END + 1, minLayer: GLASS_MIN_LAYER, maxLayer: GLASS_MAX_LAYER },
    { start: GLASS_START, end: GLASS_END, minLayer: GLASS_MAX_LAYER, maxLayer: GLASS_MAX_LAYER + 1 },
  ]);

  // Encadrement baie vitrée (accent bleu)
  for (let layer = GLASS_MIN_LAYER; layer < GLASS_MAX_LAYER; layer++) {
    addBrickX(GLASS_START - 1, layer, -0.5, 1, 'glass_frame');
    addBrickX(GLASS_END, layer, -0.5, 1, 'glass_frame');
  }
  // Linteau
  addBrickX(GLASS_START, GLASS_MAX_LAYER, -0.5, GLASS_END - GLASS_START, 'glass_frame');

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
    glassMesh.position.set(GLASS_START + glassW / 2, glassBaseY + glassH / 2, -0.5);
    scene.add(glassMesh);

    // Barre centrale
    const barGeo = new THREE.BoxGeometry(0.3, glassH, 0.5);
    const barMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.4 });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(GLASS_START + glassW / 2, glassBaseY + glassH / 2, -0.5);
    scene.add(bar);
  }

  // --- Mur avant D (z = ROOM_D + 0.5) avec porte + ouverture cuisine ---
  // Ouvertures élargies pour inclure l'encadrement (évite z-fighting)
  buildWallWithOpenings(ROOM_D + 0.5, ROOM_W, [
    { start: KITCHEN_X0, end: KITCHEN_X1, maxLayer: NUM_LAYERS },
    { start: DOOR_START - 1, end: DOOR_END + 1, maxLayer: DOOR_H_LAYERS },
    { start: DOOR_START, end: DOOR_END, minLayer: DOOR_H_LAYERS, maxLayer: DOOR_H_LAYERS + 1 },
  ]);

  // Extension mur D côté A
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    addBrickX(-NICHE_DEPTH, layer, ROOM_D + 0.5, NICHE_DEPTH, 'wall');
  }

  // --- Encadrement porte (accent rouge) ---
  for (let layer = 0; layer < DOOR_H_LAYERS; layer++) {
    addBrickX(DOOR_START - 1, layer, ROOM_D + 0.5, 1, 'accent');
    addBrickX(DOOR_END, layer, ROOM_D + 0.5, 1, 'accent');
  }
  addBrickX(DOOR_START, DOOR_H_LAYERS, ROOM_D + 0.5, DOOR_END - DOOR_START, 'accent');

  // --- Renfoncement cuisine (3 murs) ---
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(KITCHEN_DEPTH, layer % 2 === 1))
      addBrickZ(KITCHEN_X0 - 0.5, layer, ROOM_D + b.start, b.size, 'wall');
  }
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(KITCHEN_DEPTH, layer % 2 === 1))
      addBrickZ(KITCHEN_X1 + 0.5, layer, ROOM_D + b.start, b.size, 'wall');
  }
  // Mur salle de bain (fond cuisine étendu) : X=-NICHE_DEPTH → DOOR_START
  const SDB_LEN = DOOR_START + NICHE_DEPTH; // 20 studs = 2m
  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    for (const b of fillRow(SDB_LEN, layer % 2 === 1))
      addBrickX(-NICHE_DEPTH + b.start, layer, KITCHEN_Z + 0.5, b.size, 'wall');
  }

  // Sol cuisine
  const KIT_FX0 = KITCHEN_X0 - 1;
  const KIT_FX1 = KITCHEN_X1 + 1;
  const KIT_FW = KIT_FX1 - KIT_FX0;
  for (let z = ROOM_D + 1; z < KITCHEN_Z + 1; z++) {
    for (const b of fillRow(KIT_FW, z % 2 === 1)) {
      allBricks.push({
        x: KIT_FX0 + b.start + b.size / 2, y: PLATE_H / 2, z: z + 0.5,
        sx: b.size - GAP, sy: PLATE_H - GAP, sz: 1 - GAP,
        len: b.size, axis: 'x', type: 'floor'
      });
    }
  }
}
