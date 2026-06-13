/**
 * Minimap.tsx — overlay canvas 2D, port de js/ui/minimap.js.
 *
 * Composant HTML pur rendu HORS du Canvas R3F (dans Studio.tsx).
 * Se synchronise avec la caméra via cameraState.onUpdate.
 */
import { useRef, useEffect, useState } from 'react';
import { cameraState } from '@features/scene/cameraState';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import {
  drawFloorPlan,
  PLAN_X_MIN, PLAN_X_MAX, PLAN_Z_MIN, PLAN_ASPECT,
} from './floorDraw';
import { LANDING_STRIPS } from './LandingStrips';

const SMALL_W_DESKTOP = 150;
const SMALL_W_MOBILE  = 55;

// ── Icône avion (plan 2D) ─────────────────────────────────────────────────────
function drawPlaneIcon(
  ctx: CanvasRenderingContext2D,
  px: number, pz: number, yaw: number,
  sc: number,
  fillColor: string, strokeColor: string,
  tx: (x: number) => number, tz: (z: number) => number,
) {
  ctx.save();
  ctx.translate(tx(px), tz(pz));
  ctx.rotate(-yaw);
  const PL = 10 * sc, PW = 9 * sc;
  ctx.fillStyle   = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth   = 0.9 * sc;
  ctx.beginPath();
  ctx.moveTo(0, -PL);
  ctx.lineTo(-PW, PL);
  ctx.lineTo(0,  PL * 0.4);
  ctx.lineTo( PW, PL);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawMinimap(
  canvas: HTMLCanvasElement,
  smallW: number,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W  = canvas.width;
  const S  = W / (PLAN_X_MAX - PLAN_X_MIN);
  const sc = W / smallW;

  const tx = (x: number) => (x - PLAN_X_MIN) * S;
  const tz = (z: number) => (z - PLAN_Z_MIN) * S;

  // Fond
  ctx.fillStyle = '#111122';
  ctx.fillRect(0, 0, W, canvas.height);

  // ── Pistes d'atterrissage (seulement si activées) ─────────────────────────
  // ... (rest of landing strips logic)
  if (cameraState.landingStripsVisible) {
    for (const strip of LANDING_STRIPS) {
      const sw = strip.width  * S;
      const sl = strip.length * S;
      ctx.save();
      ctx.translate(tx(strip.cx), tz(strip.cz));
      ctx.rotate(-strip.angleY);
      ctx.fillStyle = 'rgba(40,40,40,0.80)';
      ctx.fillRect(-sw / 2, -sl / 2, sw, sl);
      ctx.fillStyle = 'rgba(220,210,0,0.9)';
      ctx.fillRect(-1.2 * S, -sl / 2 * 0.85, 2.4 * S, sl * 0.85);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (const side of [-1, 1] as const) {
        for (const xOff of [-1.5, -0.5, 0.5, 1.5]) {
          const bw = sw * 0.14, bh = sl * 0.055;
          ctx.fillRect(xOff * sw * 0.22 - bw / 2, side * sl * 0.44 - bh / 2, bw, bh);
        }
      }
      ctx.restore();
    }
  }

  // Plan partagé
  drawFloorPlan(ctx, W, canvas.height);

  const R  = 5 * sc;
  const BW = 8 * sc, BH = 4 * sc;

  // ── Other character icon ───────────────────────────────────────────────────
  const ow = { x: cameraState.otherX, z: cameraState.otherZ, yaw: cameraState.otherYaw };
  ctx.save();
  ctx.translate(tx(ow.x), tz(ow.z));
  ctx.rotate(-ow.yaw);
  ctx.fillStyle   = 'rgba(0, 102, 255, 0.4)';
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth   = 0.6 * sc;
  ctx.beginPath(); ctx.arc(0, 0, R * 0.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();

  // ── Walker icon ────────────────────────────────────────────────────────────
  const w = { x: cameraState.walkerX, z: cameraState.walkerZ, yaw: cameraState.walkerYaw };
  
  ctx.save();
  ctx.translate(tx(w.x), tz(w.z));
  ctx.rotate(-w.yaw);

  // FOV arc — follows WALKER facing
  const V    = 50 * Math.PI / 180;
  const hFov = 2 * Math.atan(Math.tan(V / 2) * (window.innerWidth / window.innerHeight));
  const fovR = 120 * S;
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.arc(0, 0, fovR, Math.PI / 2 - hFov / 2, Math.PI / 2 + hFov / 2);
  ctx.closePath();
  ctx.fillStyle   = 'rgba(255,221,0,0.15)'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,221,0,0.40)'; ctx.lineWidth = 0.5 * sc; ctx.stroke();

  // Body icon
  ctx.fillStyle   = '#0066ff'; // Default Blue
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth   = 0.8 * sc;
  
  // Body circle
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Shoulder bar (indicates direction)
  ctx.beginPath(); ctx.rect(-BW / 2, R, BW, BH); ctx.fill(); ctx.stroke();
  
  ctx.restore();

  // ── Avion joueur ────────────────────────────────────────────────────────────
  if (cameraState.mode === 'plane') {
    drawPlaneIcon(
      ctx, cameraState.planeX, cameraState.planeZ, cameraState.planeYaw,
      sc, 'rgba(120,200,255,0.9)', 'rgba(255,255,255,0.9)',
      tx, tz,
    );
  }

  // ── Avion autopilote ────────────────────────────────────────────────────────
  if (cameraState.autopilotActive) {
    drawPlaneIcon(
      ctx, cameraState.autopilotX, cameraState.autopilotZ, cameraState.autopilotYaw,
      sc, 'rgba(100,255,150,0.9)', 'rgba(255,255,255,0.9)',
      tx, tz,
    );
  }
}

// ── Composant HTML pur ────────────────────────────────────────────────────────

export function Minimap() {
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expanded, setExpanded] = useState(false);

  const smallW = isMobile ? SMALL_W_MOBILE : SMALL_W_DESKTOP;
  const canvasW = expanded
    ? Math.round(Math.min(window.innerWidth * 0.88, (window.innerHeight * 0.88) / PLAN_ASPECT))
    : smallW;
  const canvasH = Math.round(canvasW * PLAN_ASPECT);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set size only once per dimension change to avoid buffer reallocation lag
    canvas.width  = canvasW;
    canvas.height = canvasH;

    let raf: number | null = null;
    let pending = false;

    const draw = () => {
      pending = false;
      drawMinimap(canvas, smallW);
    };

    const prev = cameraState.onUpdate;
    cameraState.onUpdate = () => {
      if (!pending) {
        pending = true;
        raf = requestAnimationFrame(draw);
      }
    };
    
    // Initial draw
    draw();

    return () => {
      cameraState.onUpdate = prev;
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [canvasW, canvasH, smallW]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && expanded) setExpanded(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  const containerStyle: React.CSSProperties = expanded
    ? { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 201 }
    : isMobile
      ? { position: 'fixed', top: 8, right: 8, zIndex: 50 }
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
