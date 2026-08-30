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
const SMALL_W_MOBILE  = 115;

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
  const floatingCanvasRef = useRef<HTMLCanvasElement>(null);
  const expandedCanvasRef = useRef<HTMLCanvasElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const smallW = isMobile ? SMALL_W_MOBILE : SMALL_W_DESKTOP;
  const smallH = Math.round(smallW * 1.35);

  // Boucle de rendu pour la minimap compacte (flottante)
  useEffect(() => {
    if (isCollapsed || expanded) return;
    const canvas = floatingCanvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(smallW * dpr);
    canvas.height = Math.round(smallH * dpr);
    canvas.style.width = `${smallW}px`;
    canvas.style.height = `${smallH}px`;

    let rafId: number;
    const loop = () => {
      drawMinimap(canvas, smallW);
      rafId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [smallW, smallH, isCollapsed, expanded]);

  // Boucle de rendu pour la minimap agrandie (modal)
  useEffect(() => {
    if (!expanded) return;
    const canvas = expandedCanvasRef.current;
    if (!canvas) return;

    const maxW = Math.min(window.innerWidth * 0.90, 750);
    const maxH = Math.min(window.innerHeight * 0.80, 750);
    const expW = Math.max(260, Math.round(Math.min(maxW, maxH / PLAN_ASPECT)));
    const expH = Math.round(expW * PLAN_ASPECT);

    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(expW * dpr);
    canvas.height = Math.round(expH * dpr);
    canvas.style.width = `${expW}px`;
    canvas.style.height = `${expH}px`;

    let rafId: number;
    const loop = () => {
      drawMinimap(canvas, expW);
      rafId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [expanded]);

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
          bottom: isMobile ? 'calc(64px + env(safe-area-inset-bottom) + 12px)' : 20,
          left: isMobile ? 12 : undefined,
          right: isMobile ? undefined : 20,
          zIndex: 90,
          pointerEvents: 'auto',
        }}
      >
        <button
          onClick={() => setIsCollapsed(false)}
          className="btn btn-dark shadow-sm glass-card border-secondary text-white d-flex align-items-center gap-1.5 rounded-3 px-2 py-1.5"
          style={{ cursor: 'pointer', opacity: 0.95 }}
          title="Afficher la minimap (Touche 8)"
        >
          <span style={{ fontSize: '11px', fontWeight: 600 }}>🗺️ Plan 2D [8]</span>
          <span style={{ fontSize: '11px' }}>➕</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* EXPANDED MODAL VIEW */}
      {expanded && (
        <div
          className="position-fixed d-flex align-items-center justify-content-center"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 99999,
            pointerEvents: 'auto',
          }}
          onClick={() => setExpanded(false)}
        >
          <div 
            className="card glass-card shadow-lg p-2.5 rounded-3 border-0"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '95vw',
              maxHeight: '95vh',
              pointerEvents: 'auto',
              background: 'rgba(255, 255, 255, 0.92)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div className="card-header border-0 bg-transparent p-0 d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-dark text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.06em' }}>
                📍 Plan 2D de la pièce
              </span>
              <button 
                type="button" 
                className="btn-close" 
                aria-label="Close" 
                onClick={() => setExpanded(false)}
              />
            </div>
            <div className="position-relative d-flex justify-content-center overflow-hidden rounded-2">
              <canvas 
                ref={expandedCanvasRef} 
                className="rounded-2 shadow-sm" 
                style={{ display: 'block', background: 'transparent' }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* FLOATING MINIMAP: Bottom-Left on mobile (away from D-Pad), Bottom-Right on desktop */}
      {!expanded && (
        <div
          className="position-fixed glass-card shadow-sm p-1 rounded-3 overflow-hidden"
          style={{
            bottom: isMobile ? 'calc(64px + env(safe-area-inset-bottom) + 12px)' : 20,
            left: isMobile ? 12 : undefined,
            right: isMobile ? undefined : 20,
            width: smallW + 8,
            zIndex: 90,
            pointerEvents: 'auto',
          }}
        >
          <canvas
            ref={floatingCanvasRef}
            className="rounded-2"
            style={{
              display: 'block',
              width: `${smallW}px`,
              height: `${smallH}px`,
              background: 'transparent',
              opacity: 0.95,
              cursor: 'pointer',
            }}
            onClick={() => setExpanded(true)}
          />
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
            title="Agrandir le plan"
            className="btn btn-dark btn-sm position-absolute d-flex align-items-center justify-content-center border-secondary shadow-sm"
            style={{
              top: 6,
              left: 6,
              width: isMobile ? 24 : 28,
              height: isMobile ? 24 : 28,
              padding: 0,
              fontSize: isMobile ? '11px' : '13px',
              opacity: 0.95,
              borderRadius: '6px',
              zIndex: 10,
              cursor: 'pointer',
            }}
          >
            ⛶
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsCollapsed(true); }}
            title="Réduire"
            className="btn btn-dark btn-sm position-absolute d-flex align-items-center justify-content-center border-secondary shadow-sm"
            style={{
              top: 6,
              right: 6,
              width: isMobile ? 24 : 28,
              height: isMobile ? 24 : 28,
              padding: 0,
              fontSize: isMobile ? '11px' : '13px',
              opacity: 0.95,
              borderRadius: '6px',
              zIndex: 10,
              cursor: 'pointer',
            }}
          >
            ➖
          </button>
        </div>
      )}
    </>
  );
}
