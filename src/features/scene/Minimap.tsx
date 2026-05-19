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

const SMALL_W_DESKTOP = 150;
const SMALL_W_MOBILE  = 55;

function drawMinimap(
  canvas: HTMLCanvasElement,
  camX: number, camZ: number, yaw: number,
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

  // Plan partagé (même code que FloorPlan 3D)
  drawFloorPlan(ctx, W, canvas.height);

  // Walker icon
  ctx.save();
  ctx.translate(tx(camX), tz(camZ));
  ctx.rotate(-yaw);
  const V    = 50 * Math.PI / 180;
  const hFov = 2 * Math.atan(Math.tan(V / 2) * (window.innerWidth / window.innerHeight));
  const fovR = 120 * S;
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.arc(0, 0, fovR, Math.PI / 2 - hFov / 2, Math.PI / 2 + hFov / 2);
  ctx.closePath();
  ctx.fillStyle   = 'rgba(255,221,0,0.18)'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,221,0,0.55)'; ctx.lineWidth = 0.7 * sc; ctx.stroke();
  const R = 5 * sc, BW = 8 * sc, BH = 4 * sc;
  ctx.fillStyle = '#ff4444'; ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 0.8 * sc;
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.rect(-BW / 2, R, BW, BH); ctx.fill(); ctx.stroke();
  ctx.restore();
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
    const prev = cameraState.onUpdate;
    cameraState.onUpdate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = canvasW;
      canvas.height = canvasH;
      drawMinimap(canvas, cameraState.walkerX, cameraState.walkerZ, cameraState.walkYaw, smallW);
    };
    cameraState.onUpdate();
    return () => { cameraState.onUpdate = prev; };
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
