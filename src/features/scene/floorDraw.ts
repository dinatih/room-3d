/**
 * floorDraw.ts — fonction de dessin du plan 2D partagée entre Minimap et FloorPlan.
 * Dessine sols, jardin, segments murs/portes/fenêtres sur un CanvasRenderingContext2D.
 * Le fond (background) est laissé à la charge de l'appelant.
 */
import {
  ROOM_W, ROOM_D, DOOR_START,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z,
  NICHE_DEPTH, NICHE_Z_START,
  BATH_Z_END,
  DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ,
} from '@config';

// Jardin diagonal endpoint (parallèle à MDiag)
const GARDEN_JC_Z = -140 - (DIAG_CZ - DIAG_AZ) * 320 / (DIAG_AX - DIAG_CX);
import { SEG_WALLS, SEG_DOORS, SEG_WINDOWS } from './floorData';

const PAD = 20;
export const PLAN_X_MIN = -NICHE_DEPTH - PAD;
export const PLAN_X_MAX = ROOM_W + PAD;
export const PLAN_Z_MIN = -350;
export const PLAN_Z_MAX = 760;
export const PLAN_ASPECT = (PLAN_Z_MAX - PLAN_Z_MIN) / (PLAN_X_MAX - PLAN_X_MIN);

export function drawFloorPlan(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
) {
  const S  = cw / (PLAN_X_MAX - PLAN_X_MIN);
  const sc = cw / 150; // échelle relative pour épaisseurs et tirets

  const tx = (x: number) => (x - PLAN_X_MIN) * S;
  const tz = (z: number) => (z - PLAN_Z_MIN) * S;

  // ── Sols ────────────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(212, 164, 55, 0.12)';
  ctx.fillRect(tx(0), tz(0), ROOM_W * S, ROOM_D * S);
  ctx.fillRect(tx(-NICHE_DEPTH), tz(NICHE_Z_START), NICHE_DEPTH * S, (ROOM_D - NICHE_Z_START) * S);
  ctx.fillRect(tx(KITCHEN_X0), tz(ROOM_D), (KITCHEN_X1 - KITCHEN_X0) * S, (KITCHEN_Z - ROOM_D) * S);
  ctx.fillRect(tx(KITCHEN_X1), tz(ROOM_D), (DOOR_START - KITCHEN_X1) * S, (KITCHEN_Z - ROOM_D) * S);
  ctx.fillRect(tx(DOOR_START), tz(ROOM_D), (ROOM_W - DOOR_START) * S, (DIAG_AZ - ROOM_D) * S);
  ctx.beginPath();
  ctx.moveTo(tx(DOOR_START), tz(DIAG_AZ));
  ctx.lineTo(tx(ROOM_W),     tz(DIAG_AZ));
  ctx.lineTo(tx(DOOR_START), tz(BATH_Z_END));
  ctx.closePath(); ctx.fill();
  ctx.fillRect(tx(-NICHE_DEPTH), tz(KITCHEN_Z), (DOOR_START + NICHE_DEPTH) * S, (BATH_Z_END - KITCHEN_Z) * S);
  ctx.beginPath();
  ctx.moveTo(tx(-NICHE_DEPTH), tz(BATH_Z_END));
  ctx.lineTo(tx(DOOR_START),   tz(BATH_Z_END));
  ctx.lineTo(tx(-NICHE_DEPTH), tz(DIAG_CZ));
  ctx.closePath(); ctx.fill();

  // ── Jardin ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(74, 158, 84, 0.08)';
  ctx.beginPath();
  ctx.moveTo(tx(-10), tz(-10)); ctx.lineTo(tx(-10), tz(-140));
  ctx.lineTo(tx(310), tz(GARDEN_JC_Z)); ctx.lineTo(tx(310), tz(-10));
  ctx.closePath(); ctx.fill();

  ctx.strokeStyle = '#4a9e54';
  ctx.lineWidth = Math.max(S * 4, 1);
  ctx.lineCap = 'round';
  ctx.setLineDash([3 * sc, 2 * sc]);
  for (const [x1, z1, x2, z2] of [
    [-10, -10, -10, -140], [-10, -140, 310, GARDEN_JC_Z], [310, GARDEN_JC_Z, 310, -10],
  ] as [number, number, number, number][]) {
    ctx.beginPath(); ctx.moveTo(tx(x1), tz(z1)); ctx.lineTo(tx(x2), tz(z2)); ctx.stroke();
  }
  ctx.setLineDash([]);

  // ── Segments ────────────────────────────────────────────────────────────────
  const wallW = Math.max(S * 8, 1.5);
  ctx.lineCap = 'round';

  ctx.strokeStyle = '#bbb';
  ctx.lineWidth = wallW;
  for (const [x1, z1, x2, z2] of SEG_WALLS) {
    ctx.beginPath(); ctx.moveTo(tx(x1), tz(z1)); ctx.lineTo(tx(x2), tz(z2)); ctx.stroke();
  }

  ctx.strokeStyle = '#cc0000';
  ctx.lineWidth = Math.max(wallW * 0.5, 1);
  ctx.setLineDash([2 * sc, 2 * sc]);
  for (const [x1, z1, x2, z2] of SEG_DOORS) {
    ctx.beginPath(); ctx.moveTo(tx(x1), tz(z1)); ctx.lineTo(tx(x2), tz(z2)); ctx.stroke();
  }

  ctx.strokeStyle = '#4488ff';
  ctx.lineWidth = Math.max(wallW * 0.5, 1);
  ctx.setLineDash([]);
  for (const [x1, z1, x2, z2] of SEG_WINDOWS) {
    ctx.beginPath(); ctx.moveTo(tx(x1), tz(z1)); ctx.lineTo(tx(x2), tz(z2)); ctx.stroke();
  }
}
