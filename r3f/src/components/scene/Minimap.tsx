/**
 * Minimap.tsx — overlay canvas 2D, port de js/ui/minimap.js.
 *
 * Composant HTML pur rendu HORS du Canvas R3F (dans Studio.tsx).
 * Se synchronise avec la caméra via cameraState.onUpdate.
 */
import { useRef, useEffect, useState, useCallback } from 'react';
import { cameraState } from './cameraState';

import {
  ROOM_W, ROOM_D, DOOR_START, DOOR_END,
  KITCHEN_X0, KITCHEN_X1, KITCHEN_Z, KITCHEN_DEPTH,
  NICHE_DEPTH, NICHE_Z_START,
  GLASS_START, GLASS_END,
  GARDEN_JC_Z, CORR_DOOR_S, CORR_DOOR_E,
  SDB_Z_END,
  DIAG_AX, DIAG_AZ, DIAG_CX, DIAG_CZ,
} from '@config';

// ── Constantes carte ──────────────────────────────────────────────────────────

const SMALL_W = 150;
const PAD     = 20;
const X_MIN   = -NICHE_DEPTH - PAD;
const X_MAX   = ROOM_W + PAD;
const Z_MIN   = -350;
const Z_MAX   = 760;
const ASPECT  = (Z_MAX - Z_MIN) / (X_MAX - X_MIN);

// ── Géométrie ─────────────────────────────────────────────────────────────────

const _dLen = Math.sqrt((DIAG_CX - DIAG_AX) ** 2 + (DIAG_CZ - DIAG_AZ) ** 2);
const _dX   = (DIAG_CX - DIAG_AX) / _dLen;
const _dZ   = (DIAG_CZ - DIAG_AZ) / _dLen;
const DIAG_DOOR_S = { x: DIAG_AX + 10  * _dX, z: DIAG_AZ + 10  * _dZ };
const DIAG_DOOR_E = { x: DIAG_AX + 100 * _dX, z: DIAG_AZ + 100 * _dZ };
const diagXat = (z: number) =>
  DIAG_AX + (z - DIAG_AZ) * (DIAG_CX - DIAG_AX) / (DIAG_CZ - DIAG_AZ);

type TxFn = (v: number) => number;

interface Room {
  nameFr: string;
  nameEn: string;
  labelX: number;
  labelZ: number;
  contains: (x: number, z: number) => boolean;
  fills: (tx: TxFn, tz: TxFn, S: number) => [number, number, number, number][];
  fillPath?: (ctx: CanvasRenderingContext2D, tx: TxFn, tz: TxFn) => void;
}

const ROOMS: Room[] = [
  {
    nameFr: 'Jardin', nameEn: 'garden',
    labelX: 140, labelZ: -160,
    contains: (x, z) =>
      x >= -10 && x <= 310 && z <= -10 && z >= -140 - 70 * (x + 10) / 110,
    fills: () => [],
    fillPath: (ctx, tx, tz) => {
      ctx.beginPath();
      ctx.moveTo(tx(-10),  tz(-10));
      ctx.lineTo(tx(-10),  tz(-140));
      ctx.lineTo(tx(310),  tz(GARDEN_JC_Z));
      ctx.lineTo(tx(310),  tz(-10));
      ctx.closePath(); ctx.fill();
    },
  },
  {
    nameFr: 'Entrée', nameEn: 'entry',
    labelX: (DOOR_START + ROOM_W) / 2, labelZ: ROOM_D + 70,
    contains: (x, z) => {
      if (z <= ROOM_D || z > SDB_Z_END) return false;
      if (x >= KITCHEN_X1 && x <= DOOR_START && z <= KITCHEN_Z) return true;
      if (x >= DOOR_START && x <= ROOM_W && z <= DIAG_AZ) return true;
      if (x >= DOOR_START && z <= SDB_Z_END && x <= diagXat(z)) return true;
      return false;
    },
    fills: (tx, tz, S) => [
      [tx(KITCHEN_X1), tz(ROOM_D + 10), (DOOR_START - KITCHEN_X1) * S, (KITCHEN_Z - ROOM_D - 10) * S],
      [tx(DOOR_START), tz(ROOM_D + 10), (ROOM_W - DOOR_START) * S,     (DIAG_AZ - ROOM_D - 10) * S],
    ],
    fillPath: (ctx, tx, tz) => {
      ctx.beginPath();
      ctx.moveTo(tx(DOOR_START), tz(DIAG_AZ));
      ctx.lineTo(tx(ROOM_W),     tz(DIAG_AZ));
      ctx.lineTo(tx(DOOR_START), tz(SDB_Z_END));
      ctx.closePath(); ctx.fill();
    },
  },
  {
    nameFr: "Salle d'eau", nameEn: 'bathroom',
    labelX: (DOOR_START - NICHE_DEPTH) / 2, labelZ: 530,
    contains: (x, z) => {
      if (x < -NICHE_DEPTH) return false;
      if (x <= DOOR_START && z >= KITCHEN_Z && z <= SDB_Z_END) return true;
      return z > SDB_Z_END && z <= DIAG_CZ && x <= diagXat(z);
    },
    fills: (tx, tz, S) => [
      [tx(-NICHE_DEPTH), tz(KITCHEN_Z + 10), (DOOR_START + NICHE_DEPTH) * S, (SDB_Z_END - KITCHEN_Z - 10) * S],
    ],
    fillPath: (ctx, tx, tz) => {
      ctx.beginPath();
      ctx.moveTo(tx(-NICHE_DEPTH), tz(SDB_Z_END));
      ctx.lineTo(tx(DOOR_START),   tz(SDB_Z_END));
      ctx.lineTo(tx(-NICHE_DEPTH), tz(DIAG_CZ));
      ctx.closePath(); ctx.fill();
    },
  },
  {
    nameFr: 'Séjour', nameEn: 'living',
    labelX: ROOM_W / 2, labelZ: ROOM_D / 2,
    contains: (x, z) =>
      (x >= 0 && x <= ROOM_W && z >= 0 && z <= ROOM_D) ||
      (x >= -NICHE_DEPTH && x < 0 && z >= NICHE_Z_START && z <= ROOM_D) ||
      (x >= KITCHEN_X0 && x <= KITCHEN_X1 && z > ROOM_D && z <= KITCHEN_Z),
    fills: (tx, tz, S) => [
      [tx(0), tz(0), ROOM_W * S, ROOM_D * S],
      [tx(-NICHE_DEPTH), tz(NICHE_Z_START), NICHE_DEPTH * S, (ROOM_D - NICHE_Z_START) * S],
      [tx(KITCHEN_X0), tz(ROOM_D), (KITCHEN_X1 - KITCHEN_X0) * S, (KITCHEN_Z - ROOM_D) * S],
    ],
  },
  {
    nameFr: 'Cuisine', nameEn: 'kitchen',
    labelX: (KITCHEN_X0 + KITCHEN_X1) / 2, labelZ: ROOM_D + KITCHEN_DEPTH / 2,
    contains: (x, z) => x >= KITCHEN_X0 && x <= KITCHEN_X1 && z >= ROOM_D && z <= KITCHEN_Z,
    fills: (tx, tz, S) => [
      [tx(KITCHEN_X0), tz(ROOM_D), (KITCHEN_X1 - KITCHEN_X0) * S, (KITCHEN_Z - ROOM_D) * S],
    ],
  },
  {
    nameFr: 'Douche', nameEn: 'shower',
    labelX: 25, labelZ: 635,
    contains: (x, z) => x >= -NICHE_DEPTH && x <= 60 && z >= 600 && z <= 670,
    fills: (tx, tz, S) => [[tx(-NICHE_DEPTH), tz(600), (60 + NICHE_DEPTH) * S, 70 * S]],
  },
];

type SegType = 'w' | 'd' | 'n';
const FLOOR_SEGMENTS: { t: SegType; x1: number; z1: number; x2: number; z2: number }[] = [
  { t: 'w', x1: 0,            z1: 0,             x2: 0,            z2: NICHE_Z_START  },
  { t: 'w', x1: 0,            z1: NICHE_Z_START,  x2: -NICHE_DEPTH, z2: NICHE_Z_START  },
  { t: 'w', x1: -NICHE_DEPTH, z1: NICHE_Z_START,  x2: -NICHE_DEPTH, z2: ROOM_D         },
  { t: 'w', x1: -NICHE_DEPTH, z1: ROOM_D,          x2: -NICHE_DEPTH, z2: KITCHEN_Z      },
  { t: 'w', x1: ROOM_W, z1: 0,          x2: ROOM_W, z2: ROOM_D + 10   },
  { t: 'w', x1: 0,           z1: 0, x2: GLASS_START, z2: 0            },
  { t: 'n', x1: GLASS_START,  z1: 0, x2: GLASS_END,   z2: 0            },
  { t: 'w', x1: GLASS_END,   z1: 0, x2: ROOM_W,       z2: 0            },
  { t: 'w', x1: -NICHE_DEPTH, z1: ROOM_D, x2: KITCHEN_X0, z2: ROOM_D  },
  { t: 'w', x1: KITCHEN_X1,  z1: ROOM_D, x2: DOOR_START,  z2: ROOM_D  },
  { t: 'd', x1: DOOR_START,  z1: ROOM_D, x2: DOOR_END,    z2: ROOM_D  },
  { t: 'w', x1: DOOR_END,    z1: ROOM_D, x2: ROOM_W,      z2: ROOM_D  },
  { t: 'w', x1: KITCHEN_X0, z1: ROOM_D, x2: KITCHEN_X0, z2: KITCHEN_Z },
  { t: 'w', x1: KITCHEN_X1, z1: ROOM_D, x2: KITCHEN_X1, z2: KITCHEN_Z },
  { t: 'w', x1: -NICHE_DEPTH, z1: KITCHEN_Z, x2: DOOR_START, z2: KITCHEN_Z },
  { t: 'd', x1: DOOR_START, z1: ROOM_D + 10,  x2: DOOR_START, z2: KITCHEN_Z  },
  { t: 'w', x1: DOOR_START, z1: KITCHEN_Z,    x2: DOOR_START, z2: CORR_DOOR_S },
  { t: 'd', x1: DOOR_START, z1: CORR_DOOR_S,  x2: DOOR_START, z2: CORR_DOOR_E },
  { t: 'w', x1: DOOR_START, z1: CORR_DOOR_E,  x2: DOOR_START, z2: SDB_Z_END  },
  { t: 'w', x1: ROOM_W, z1: ROOM_D + 10, x2: ROOM_W, z2: DIAG_AZ      },
  { t: 'w', x1: -NICHE_DEPTH, z1: KITCHEN_Z, x2: -NICHE_DEPTH, z2: DIAG_CZ },
  { t: 'n', x1: -NICHE_DEPTH, z1: 600, x2: 60,         z2: 600          },
  { t: 'd', x1: 60,            z1: 600, x2: DOOR_START, z2: 600          },
  { t: 'w', x1: 60,            z1: 600, x2: 60,            z2: 670       },
  { t: 'w', x1: -NICHE_DEPTH,  z1: 670, x2: 60,            z2: 670       },
  { t: 'w', x1: DIAG_AX,        z1: DIAG_AZ,        x2: DIAG_DOOR_S.x, z2: DIAG_DOOR_S.z },
  { t: 'd', x1: DIAG_DOOR_S.x,  z1: DIAG_DOOR_S.z,  x2: DIAG_DOOR_E.x, z2: DIAG_DOOR_E.z },
  { t: 'w', x1: DIAG_DOOR_E.x,  z1: DIAG_DOOR_E.z,  x2: DIAG_CX,       z2: DIAG_CZ       },
];

// ── Fonction de dessin ────────────────────────────────────────────────────────

function drawMinimap(
  canvas: HTMLCanvasElement,
  hoveredRoom: Room | null,
  camX: number, camZ: number, yaw: number,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const S = W / (X_MAX - X_MIN);
  const scale = W / SMALL_W;

  const tx = (x: number) => (x - X_MIN) * S;
  const tz = (z: number) => (z - Z_MIN) * S;

  ctx.fillStyle = '#111122';
  ctx.fillRect(0, 0, W, canvas.height);

  // Sols
  ctx.fillStyle = 'rgba(212, 164, 55, 0.12)';
  ctx.fillRect(tx(0), tz(0), ROOM_W * S, ROOM_D * S);
  ctx.fillRect(tx(-NICHE_DEPTH), tz(NICHE_Z_START), NICHE_DEPTH * S, (ROOM_D - NICHE_Z_START) * S);
  ctx.fillRect(tx(KITCHEN_X0), tz(ROOM_D), (KITCHEN_X1 - KITCHEN_X0) * S, (KITCHEN_Z - ROOM_D) * S);
  ctx.fillRect(tx(KITCHEN_X1), tz(ROOM_D), (DOOR_START - KITCHEN_X1) * S, (KITCHEN_Z - ROOM_D) * S);
  ctx.fillRect(tx(DOOR_START), tz(ROOM_D), (ROOM_W - DOOR_START) * S, (DIAG_AZ - ROOM_D) * S);
  ctx.beginPath();
  ctx.moveTo(tx(DOOR_START), tz(DIAG_AZ)); ctx.lineTo(tx(ROOM_W), tz(DIAG_AZ));
  ctx.lineTo(tx(DOOR_START), tz(SDB_Z_END)); ctx.closePath(); ctx.fill();
  ctx.fillRect(tx(-NICHE_DEPTH), tz(KITCHEN_Z), (DOOR_START + NICHE_DEPTH) * S, (SDB_Z_END - KITCHEN_Z) * S);
  ctx.beginPath();
  ctx.moveTo(tx(-NICHE_DEPTH), tz(SDB_Z_END)); ctx.lineTo(tx(DOOR_START), tz(SDB_Z_END));
  ctx.lineTo(tx(-NICHE_DEPTH), tz(DIAG_CZ)); ctx.closePath(); ctx.fill();

  // Hover
  if (hoveredRoom) {
    ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
    for (const r of hoveredRoom.fills(tx, tz, S)) ctx.fillRect(...r);
    hoveredRoom.fillPath?.(ctx, tx, tz);
  }

  // Jardin
  ctx.fillStyle = 'rgba(74, 158, 84, 0.08)';
  ctx.beginPath();
  ctx.moveTo(tx(-10), tz(-10)); ctx.lineTo(tx(-10), tz(-140));
  ctx.lineTo(tx(310), tz(GARDEN_JC_Z)); ctx.lineTo(tx(310), tz(-10));
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#4a9e54'; ctx.lineWidth = Math.max(S * 4, 1);
  ctx.setLineDash([3 * scale, 2 * scale]);
  for (const [x1, z1, x2, z2] of [
    [-10, -10, -10, -140], [-10, -140, 310, GARDEN_JC_Z], [310, GARDEN_JC_Z, 310, -10],
  ] as [number, number, number, number][]) {
    ctx.beginPath(); ctx.moveTo(tx(x1), tz(z1)); ctx.lineTo(tx(x2), tz(z2)); ctx.stroke();
  }
  ctx.setLineDash([]);

  // Segments
  const wallW = Math.max(S * 8, 1.5);
  for (const { t, x1, z1, x2, z2 } of FLOOR_SEGMENTS) {
    if (t === 'w') { ctx.strokeStyle = '#bbb'; ctx.lineWidth = wallW; ctx.setLineDash([]); }
    else if (t === 'd') { ctx.strokeStyle = '#cc0000'; ctx.lineWidth = Math.max(wallW * 0.5, 1); ctx.setLineDash([2 * scale, 2 * scale]); }
    else { ctx.strokeStyle = '#4488ff'; ctx.lineWidth = Math.max(wallW * 0.5, 1); ctx.setLineDash([]); }
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tx(x1), tz(z1)); ctx.lineTo(tx(x2), tz(z2)); ctx.stroke();
  }
  ctx.setLineDash([]);

  // Labels
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const room of ROOMS) {
    const hov = hoveredRoom === room;
    ctx.fillStyle = hov ? 'rgba(255,215,0,0.95)' : 'rgba(255,255,255,0.55)';
    ctx.font = `bold ${Math.round(7 * scale)}px sans-serif`;
    ctx.fillText(room.nameFr, tx(room.labelX), tz(room.labelZ));
    ctx.fillStyle = hov ? 'rgba(255,215,0,0.6)' : 'rgba(255,255,255,0.3)';
    ctx.font = `${Math.round(5 * scale)}px sans-serif`;
    ctx.fillText(room.nameEn, tx(room.labelX), tz(room.labelZ) + 9 * scale);
  }

  // Walker (Lara) icon — toujours affiché à sa position
  ctx.save();
  ctx.translate(tx(camX), tz(camZ));
  ctx.rotate(-yaw);
  const V = 50 * Math.PI / 180;
  const hFov = 2 * Math.atan(Math.tan(V / 2) * (window.innerWidth / window.innerHeight));
  const fovR = 120 * S;
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.arc(0, 0, fovR, Math.PI / 2 - hFov / 2, Math.PI / 2 + hFov / 2);
  ctx.closePath();
  ctx.fillStyle   = 'rgba(255,221,0,0.18)'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,221,0,0.55)'; ctx.lineWidth = 0.7 * scale; ctx.stroke();
  const R = 5 * scale, BW = 8 * scale, BH = 4 * scale;
  ctx.fillStyle = '#ff4444'; ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 0.8 * scale;
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.rect(-BW / 2, R, BW, BH); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ── Composant HTML pur ────────────────────────────────────────────────────────

export function Minimap() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const hoveredRoom  = useRef<Room | null>(null);
  const [expanded, setExpanded] = useState(false);

  const canvasW = expanded
    ? Math.round(Math.min(window.innerWidth * 0.88, (window.innerHeight * 0.88) / ASPECT))
    : SMALL_W;
  const canvasH = Math.round(canvasW * ASPECT);

  // Subscribe to cameraState updates
  useEffect(() => {
    const prev = cameraState.onUpdate;
    cameraState.onUpdate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = canvasW;
      canvas.height = canvasH;
      drawMinimap(
        canvas,
        hoveredRoom.current,
        cameraState.walkerX, cameraState.walkerZ, cameraState.walkYaw,
      );
    };
    // Initial draw
    cameraState.onUpdate();
    return () => { cameraState.onUpdate = prev; };
  }, [canvasW, canvasH]);

  // Keyboard: Escape closes expanded
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && expanded) setExpanded(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  const S = () => canvasW / (X_MAX - X_MIN);
  const fromPx = (px: number) => px / S() + X_MIN;
  const fromPz = (pz: number) => pz / S() + Z_MIN;

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const s    = canvas.width / (X_MAX - X_MIN);
    const px   = (e.clientX - rect.left) * (canvas.width / rect.width);
    const pz   = (e.clientY - rect.top)  * (canvas.height / rect.height);
    const x    = px / s + X_MIN;
    const z    = pz / s + Z_MIN;
    const room = ROOMS.find(r => r.contains(x, z)) ?? null;
    if (room !== hoveredRoom.current) {
      hoveredRoom.current = room;
      cameraState.onUpdate?.(); // redraw
    }
  }, []);

  const onMouseLeave = useCallback(() => {
    if (hoveredRoom.current) { hoveredRoom.current = null; cameraState.onUpdate?.(); }
  }, []);

  const onClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const s    = canvas.width / (X_MAX - X_MIN);
    const px   = (e.clientX - rect.left) * (canvas.width / rect.width);
    const pz   = (e.clientY - rect.top)  * (canvas.height / rect.height);
    const x    = px / s + X_MIN;
    const z    = pz / s + Z_MIN;
    const room = ROOMS.find(r => r.contains(x, z));
    if (room) {
      document.dispatchEvent(new CustomEvent('minimap-pov', {
        detail: { x: room.labelX, z: room.labelZ },
      }));
    }
  }, []);

  const containerStyle: React.CSSProperties = expanded
    ? { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 201 }
    : { position: 'fixed', bottom: 16, right: 16, zIndex: 50 };

  return (
    <>
      {expanded && (
        <div
          onClick={() => setExpanded(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 200,
          }}
        />
      )}
      <div style={containerStyle}>
        <canvas
          ref={canvasRef}
          width={canvasW} height={canvasH}
          style={{
            display: 'block',
            borderRadius: expanded ? 8 : 6,
            border: `1px solid ${expanded ? '#888' : '#555'}`,
            background: '#111122',
            opacity: expanded ? 1 : 0.85,
            cursor: 'pointer',
            boxShadow: expanded ? '0 8px 60px rgba(0,0,0,0.9)' : undefined,
          }}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          onClick={onClick}
        />
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
          title={expanded ? 'Réduire' : 'Agrandir'}
          style={{
            position: 'absolute', top: 6, left: 6,
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#ccc', fontSize: 12, lineHeight: 1,
            cursor: 'pointer', padding: '3px 5px', borderRadius: 4, zIndex: 1,
          }}
        >
          {expanded ? '✕' : '⛶'}
        </button>
      </div>
    </>
  );
}
