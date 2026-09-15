/**
 * floorDraw.ts — fonction de dessin du plan 2D partagée entre Minimap et FloorPlan.
 * Dessine sols, jardin, segments murs/portes/fenêtres sur un CanvasRenderingContext2D.
 * Le fond (background) est laissé à la charge de l'appelant.
 */
import {
  ROOM_W, ROOM_D, DOOR_START,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z,
  NICHE_X, NICHE_Z_START,
  BATH_Z_END,
  DiagWall,
} from '@config';

import { SEG_CONCRETE_WALLS, SEG_PARTITIONS, SEG_DOORS, SEG_WINDOWS } from './floorData';
import {
  GARDEN_PANEL_DEFS,
  PARTITION_THICKNESS,
  CORR_WALL_X,
  PILLAR_DEFS,
  PillarDef,
  WALL_THICKNESS,
  GARDEN_JC_Z,
} from './wallData';

const PAD = 20;
export const PLAN_X_MIN = NICHE_X - PAD;
export const PLAN_X_MAX = ROOM_W + PAD;
export const PLAN_Z_MIN = -350;
export const PLAN_Z_MAX = 770;
export const PLAN_ASPECT = (PLAN_Z_MAX - PLAN_Z_MIN) / (PLAN_X_MAX - PLAN_X_MIN);

export function drawFloorPlan(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
) {
  const S  = Math.min(cw / (PLAN_X_MAX - PLAN_X_MIN), ch / (PLAN_Z_MAX - PLAN_Z_MIN));
  const sc = cw / 150; // échelle relative pour épaisseurs et tirets

  const offX = (cw - (PLAN_X_MAX - PLAN_X_MIN) * S) / 2;
  const offZ = (ch - (PLAN_Z_MAX - PLAN_Z_MIN) * S) / 2;

  const tx = (x: number) => offX + (x - PLAN_X_MIN) * S;
  const tz = (z: number) => offZ + (z - PLAN_Z_MIN) * S;

  // ── Sols ────────────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(212, 164, 55, 0.12)';
  // Séjour
  ctx.fillRect(tx(0), tz(0), ROOM_W * S, ROOM_D * S);
  ctx.fillRect(tx(NICHE_X), tz(NICHE_Z_START), -NICHE_X * S, (ROOM_D - NICHE_Z_START) * S);
  // Cuisine
  ctx.fillRect(tx(KITCHEN_X0), tz(ROOM_D), (KITCHEN_X1 - KITCHEN_X0) * S, (KITCHEN_Z - ROOM_D) * S);
  // Placard couloir (intérieur net)
  ctx.fillRect(
    tx(KITCHEN_X1 + PARTITION_THICKNESS),
    tz(ROOM_D + PARTITION_THICKNESS),
    (DOOR_START - (KITCHEN_X1 + PARTITION_THICKNESS)) * S,
    (KITCHEN_Z - (ROOM_D + PARTITION_THICKNESS)) * S,
  );
  // Couloir droit
  ctx.fillRect(tx(DOOR_START), tz(ROOM_D), (ROOM_W - DOOR_START) * S, (DiagWall.A.z - ROOM_D) * S);
  ctx.beginPath();
  ctx.moveTo(tx(DOOR_START), tz(DiagWall.A.z));
  ctx.lineTo(tx(ROOM_W),     tz(DiagWall.A.z));
  ctx.lineTo(tx(DOOR_START), tz(BATH_Z_END));
  ctx.closePath(); ctx.fill();
  // SDB (intérieur net à Z=467.2)
  const corrInnerW = CORR_WALL_X - PARTITION_THICKNESS / 2; // 192.0 cm
  ctx.fillRect(
    tx(NICHE_X),
    tz(KITCHEN_Z + PARTITION_THICKNESS),
    (corrInnerW - NICHE_X) * S,
    (BATH_Z_END - (KITCHEN_Z + PARTITION_THICKNESS)) * S,
  );
  ctx.beginPath();
  ctx.moveTo(tx(NICHE_X), tz(BATH_Z_END));
  ctx.lineTo(tx(corrInnerW), tz(BATH_Z_END));
  ctx.lineTo(tx(NICHE_X), tz(DiagWall.C.z));
  ctx.closePath(); ctx.fill();

  // ── Gaine technique (coffrage fermé à gauche de la cuisine) ─────────────────
  ctx.fillStyle = 'rgba(120, 130, 140, 0.15)';
  ctx.fillRect(
    tx(NICHE_X),
    tz(ROOM_D + PARTITION_THICKNESS),
    (KITCHEN_X0 - PARTITION_THICKNESS - NICHE_X) * S,
    (KITCHEN_Z - (ROOM_D + PARTITION_THICKNESS)) * S,
  );

  // ── Jardin ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(74, 158, 84, 0.08)';
  ctx.beginPath();
  ctx.moveTo(tx(-10), tz(-10)); ctx.lineTo(tx(-10), tz(-140));
  ctx.lineTo(tx(310), tz(GARDEN_JC_Z)); ctx.lineTo(tx(310), tz(-10));
  ctx.closePath(); ctx.fill();

  ctx.strokeStyle = '#4a9e54';
  ctx.lineWidth = Math.max(S * 3, 1);
  ctx.lineCap = 'round';
  ctx.setLineDash([3 * sc, 2 * sc]);
  for (const [x1, z1, x2, z2] of [
    [-10, -10, -10, -140], [-10, -140, 310, GARDEN_JC_Z], [310, GARDEN_JC_Z, 310, -10],
  ] as [number, number, number, number][]) {
    ctx.beginPath(); ctx.moveTo(tx(x1), tz(z1)); ctx.lineTo(tx(x2), tz(z2)); ctx.stroke();
  }
  ctx.setLineDash([]);

  // ── Segments Murs (2 faces par mur/cloison) ──────────────────────────────────
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';

  // 1. Murs porteurs / béton (traits épais et foncés)
  ctx.strokeStyle = '#2d3748';
  ctx.lineWidth = Math.max(S * 2.5, 1.8);
  for (const [x1, z1, x2, z2] of SEG_CONCRETE_WALLS) {
    ctx.beginPath(); ctx.moveTo(tx(x1), tz(z1)); ctx.lineTo(tx(x2), tz(z2)); ctx.stroke();
  }

  // 2. Cloisons et doublages placo (traits fins et plus clairs)
  ctx.strokeStyle = '#8a94a0';
  ctx.lineWidth = Math.max(S * 1.5, 1.1);
  for (const [x1, z1, x2, z2] of SEG_PARTITIONS) {
    ctx.beginPath(); ctx.moveTo(tx(x1), tz(z1)); ctx.lineTo(tx(x2), tz(z2)); ctx.stroke();
  }

  // ── Piliers & Poteaux structurels (PILLAR_DEFS) ─────────────────────────────
  for (const p of PILLAR_DEFS as readonly PillarDef[]) {
    const pw = p.w ?? WALL_THICKNESS;
    const pd = p.d ?? WALL_THICKNESS;
    const rot = p.rot ?? 0;
    const isConcrete = pw >= 10 || pd >= 10;

    ctx.save();
    ctx.translate(tx(p.x), tz(p.z));
    if (rot) ctx.rotate(-rot);

    const w = pw * S;
    const d = pd * S;

    ctx.fillStyle = isConcrete ? 'rgba(74, 85, 104, 0.45)' : 'rgba(160, 174, 192, 0.35)';
    ctx.fillRect(-w / 2, -d / 2, w, d);

    ctx.strokeStyle = isConcrete ? '#2d3748' : '#718096';
    ctx.lineWidth = Math.max(isConcrete ? S * 2.2 : S * 1.4, 1.1);
    ctx.strokeRect(-w / 2, -d / 2, w, d);

    ctx.restore();
  }

  // ── Portes ──────────────────────────────────────────────────────────────────
  ctx.strokeStyle = '#cc0000';
  ctx.lineWidth = Math.max(S * 2.5, 1.2);
  ctx.setLineDash([2 * sc, 2 * sc]);
  for (const [x1, z1, x2, z2] of SEG_DOORS) {
    ctx.beginPath(); ctx.moveTo(tx(x1), tz(z1)); ctx.lineTo(tx(x2), tz(z2)); ctx.stroke();
  }

  // ── Fenêtres ────────────────────────────────────────────────────────────────
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = Math.max(S * 2.5, 1.2);
  ctx.setLineDash([]);
  for (const [x1, z1, x2, z2] of SEG_WINDOWS) {
    ctx.beginPath(); ctx.moveTo(tx(x1), tz(z1)); ctx.lineTo(tx(x2), tz(z2)); ctx.stroke();
  }

  // ── Palissade bois (panneaux occultants jardin, côté est) ───────────────────
  // Clip aux panneaux dont l'emprise Z reste dans la fenêtre du plan.
  ctx.fillStyle   = '#8B6914';
  ctx.strokeStyle = '#5a4209';
  ctx.lineWidth   = Math.max(S * 1, 0.5);
  let lastDrawnNorth = Infinity;     // plus petit cz - d/2 dessiné
  let lastDrawnCx    = 0;
  let clipped        = false;
  for (const p of GARDEN_PANEL_DEFS) {
    if (p.cz - p.d / 2 < PLAN_Z_MIN) { clipped = true; continue; }
    const x = tx(p.cx - p.w / 2);
    const z = tz(p.cz - p.d / 2);
    const ww = p.w * S;
    const dh = p.d * S;
    ctx.fillRect(x, z, ww, dh);
    ctx.strokeRect(x, z, ww, dh);
    if (p.cz - p.d / 2 < lastDrawnNorth) {
      lastDrawnNorth = p.cz - p.d / 2;
      lastDrawnCx    = p.cx;
    }
  }
  // Points de continuation si palissade clippée (2 points vers le nord).
  if (clipped && isFinite(lastDrawnNorth)) {
    ctx.fillStyle = '#8B6914';
    const r = Math.max(S * 2, 1.5);
    const stepZ = 8; // cm world units between dots
    for (let i = 1; i <= 2; i++) {
      const cz = lastDrawnNorth - i * stepZ;
      if (cz < PLAN_Z_MIN) break;
      ctx.beginPath();
      ctx.arc(tx(lastDrawnCx), tz(cz), r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
