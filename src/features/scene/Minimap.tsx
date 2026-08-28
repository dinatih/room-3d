/**
 * Minimap.tsx — overlay canvas 2D, port de js/ui/minimap.js.
 *
 * Composant HTML pur rendu HORS du Canvas R3F (dans Studio.tsx).
 * Se synchronise avec la caméra via cameraState.onUpdate.
 * Styled using Bootstrap 5.3 and the red theme accent.
 */
import { useRef, useEffect, useState } from 'react';
import { cameraState } from '@features/scene/cameraState';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import {
  drawFloorPlan,
  PLAN_X_MIN, PLAN_X_MAX, PLAN_Z_MIN, PLAN_Z_MAX, PLAN_ASPECT,
} from './floorDraw';
import { LANDING_STRIPS } from './LandingStrips';
import { CHARACTERS, isCharacterVisibleInMode } from './walkerConfig';
import { useSceneStore } from './store/useSceneStore';

const SMALL_W_DESKTOP = 140;
const SMALL_W_MOBILE  = 140;

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
  const W = canvas.width;
  const H = canvas.height;
  const S = Math.min(W / (PLAN_X_MAX - PLAN_X_MIN), H / (PLAN_Z_MAX - PLAN_Z_MIN));
  const sc = W / smallW;

  const offX = (W - (PLAN_X_MAX - PLAN_X_MIN) * S) / 2;
  const offZ = (H - (PLAN_Z_MAX - PLAN_Z_MIN) * S) / 2;

  const tx = (x: number) => offX + (x - PLAN_X_MIN) * S;
  const tz = (z: number) => offZ + (z - PLAN_Z_MIN) * S;

  // Fond
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillRect(0, 0, W, H);

  // ── Pistes d'atterrissage (seulement si activées) ─────────────────────────
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

  // ── Other characters (NPCs) icons ───────────────────────────────────────────
  const activeWalkerId = useSceneStore.getState().activeWalkerId;
  const showAllLaraStyles = useSceneStore.getState().layers.showAllLaraStyles;
  const laraCount = useSceneStore.getState().layers.laraCount ?? (typeof window !== 'undefined' && window.innerWidth <= 768 ? 2 : 15);
  ctx.save();
  ctx.fillStyle   = 'rgba(0, 102, 255, 0.4)';
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth   = 0.6 * sc;
  
  CHARACTERS.forEach(char => {
    if (char.id !== activeWalkerId) {
      if (!showAllLaraStyles) return;
      if (!isCharacterVisibleInMode(char.id, laraCount, activeWalkerId)) return;
      const currentPos = cameraState.positions[char.id];
      if (!currentPos) return;
      const x = currentPos.x;
      const z = currentPos.z;
      ctx.save();
      ctx.translate(tx(x), tz(z));
      ctx.beginPath(); 
      ctx.arc(0, 0, R * 0.7, 0, Math.PI * 2); 
      ctx.fill(); 
      ctx.stroke();
      ctx.restore();
    }
  });
  ctx.restore();

  // ── Shiba Inu (Ushiro) ──────────────────────────────────────────────────────
  const shibaPos = cameraState.positions['shiba'];
  if (shibaPos) {
    ctx.save();
    ctx.translate(tx(shibaPos.x), tz(shibaPos.z));
    ctx.rotate(-shibaPos.yaw);
    ctx.fillStyle = 'rgba(255, 153, 0, 0.8)'; // Orange
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1 * sc;
    ctx.beginPath(); 
    ctx.arc(0, 0, R * 0.8, 0, Math.PI * 2); 
    ctx.fill(); 
    ctx.stroke();
    // Petit museau pour indiquer la direction
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(0, R * 0.8, R * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

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
  ctx.fillStyle   = '#d32f2f'; // Red Theme Accent instead of '#0066ff'
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
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

// ── Composant HTML principal ──────────────────────────────────────────────────

export function Minimap() {
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const smallW = isMobile ? SMALL_W_MOBILE : SMALL_W_DESKTOP;
  const canvasW = expanded
    ? Math.round(Math.min(window.innerWidth * 0.85, (window.innerHeight * 0.85) / PLAN_ASPECT))
    : smallW;
  const canvasH = expanded
    ? Math.round(canvasW * PLAN_ASPECT)
    : Math.round(canvasW * 1.35);

  useEffect(() => {
    if (isCollapsed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    canvas.width  = Math.round(canvasW * dpr);
    canvas.height = Math.round(canvasH * dpr);
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;

    let rafId: number;
    const loop = () => {
      drawMinimap(canvas, smallW);
      rafId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [canvasW, canvasH, smallW, isCollapsed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'Escape' && expanded) {
        setExpanded(false);
      }
      if (e.key === '8' || e.code === 'Digit8' || e.code === 'Numpad8') {
        setIsCollapsed(c => !c);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  if (isCollapsed) {
    return (
      <div
        className="position-fixed"
        style={{
          bottom: isMobile ? 12 : 20,
          right: isMobile ? 12 : 20,
          zIndex: 90,
          pointerEvents: 'auto',
        }}
      >
        <button
          onClick={() => setIsCollapsed(false)}
          className="btn btn-dark shadow-sm glass-card border-secondary text-white d-flex align-items-center gap-1.5 rounded-3 px-2 py-1"
          style={{ cursor: 'pointer', opacity: 0.95 }}
          title="Afficher la minimap (Touche 8)"
        >
          <span style={{ fontSize: '11px', fontWeight: 600 }}>🗺️ Plan 2D [8]</span>
          <span style={{ fontSize: '10px' }}>➕</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Dimmed backdrop when expanded */}
      {expanded && (
        <div 
          onClick={() => setExpanded(false)}
          className="position-fixed inset-0 bg-dark bg-opacity-50"
          style={{ backdropFilter: 'blur(4px)', zIndex: 2000 }}
        />
      )}

      {expanded ? (
        /* EXPANDED VIEW: Styled inside a Bootstrap Card */
        <div 
          className="card glass-card shadow-lg p-2 position-fixed"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 2001 }}
        >
          <div className="card-header border-0 bg-transparent p-0 d-flex justify-content-between align-items-center mb-2">
            <span className="fw-semibold text-muted text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.06em', color: 'var(--text) !important' }}>
              📍 Plan 2D de la pièce
            </span>
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setExpanded(false)}></button>
          </div>
          <div className="position-relative">
            <canvas 
              ref={canvasRef} 
              className="rounded" 
              style={{ display: 'block', background: 'transparent' }} 
            />
          </div>
        </div>
      ) : (
        /* FLOATING MINIMAP: Bottom-Right compact radar */
        <div
          className="position-fixed glass-card shadow-sm p-1 rounded-3"
          style={{
            bottom: isMobile ? 12 : 20,
            right: isMobile ? 12 : 20,
            width: isMobile ? 130 : 155,
            zIndex: 90,
            pointerEvents: 'auto',
          }}
        >
          <canvas
            ref={canvasRef}
            className="rounded-2"
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              maxHeight: '175px',
              objectFit: 'contain',
              background: 'transparent',
              opacity: 0.95,
              cursor: 'pointer',
            }}
            onClick={() => setExpanded(true)}
          />
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
            title="Agrandir le plan"
            className="btn btn-dark btn-sm position-absolute d-flex align-items-center justify-content-center"
            style={{
              top: 6,
              left: 6,
              width: 22,
              height: 22,
              padding: 0,
              fontSize: '10px',
              opacity: 0.85,
              borderRadius: '4px',
            }}
          >
            ⛶
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsCollapsed(true); }}
            title="Réduire"
            className="btn btn-dark btn-sm position-absolute d-flex align-items-center justify-content-center"
            style={{
              top: 6,
              right: 6,
              width: 22,
              height: 22,
              padding: 0,
              fontSize: '11px',
              opacity: 0.85,
              borderRadius: '4px',
            }}
          >
            ➖
          </button>
        </div>
      )}
    </>
  );
}
