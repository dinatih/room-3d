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
import { isAppIdle } from './idleState';
import { Group } from './sidepanel/Group';

export const SMALL_W_DESKTOP = 140;
export const SMALL_W_MOBILE  = 115;

export interface MinimapProps {
  embedded?: boolean;
}

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

const floorPlanCache = new Map<string, HTMLCanvasElement>();

function getCachedFloorPlan(w: number, h: number): HTMLCanvasElement {
  const key = `${w}x${h}`;
  let cached = floorPlanCache.get(key);
  if (!cached || cached.width !== w || cached.height !== h) {
    cached = document.createElement('canvas');
    cached.width = w;
    cached.height = h;
    const ctx = cached.getContext('2d');
    if (ctx) {
      drawFloorPlan(ctx, w, h);
    }
    floorPlanCache.set(key, cached);
  }
  return cached;
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

  // Plan partagé (mis en cache sur un canvas offscreen pour épargner le CPU à chaque frame)
  const cachedPlan = getCachedFloorPlan(W, H);
  ctx.drawImage(cachedPlan, 0, 0);

  // ── Dimensions proportionnelles au monde réel (1 unité = 1 cm) ────────────
  // Rayon d'une tête humaine vue du dessus : ~11 cm (diamètre ~22 cm)
  const HEAD_RADIUS_WORLD = 11;
  const rNpc = Math.max(2.5 * sc, HEAD_RADIUS_WORLD * S);
  const R    = Math.max(3.2 * sc, HEAD_RADIUS_WORLD * S);
  const BW   = Math.max(6 * sc, 38 * S); // Largeur d'épaules (~38 cm)
  const BH   = Math.max(3 * sc, 18 * S); // Épaisseur torse (~18 cm)

  // ── Other characters (NPCs) icons ───────────────────────────────────────────
  const activeWalkerId = useSceneStore.getState().activeWalkerId;
  const showAllLaraStyles = useSceneStore.getState().layers.showAllLaraStyles;
  const laraCount = useSceneStore.getState().layers.laraCount ?? (typeof window !== 'undefined' && window.innerWidth <= 768 ? 2 : 15);
  const extraCharacters = useSceneStore.getState().layers.extraCharacters ?? false;
  const activeExtraIds = useSceneStore.getState().activeExtraIds;
  const activeMainIds = useSceneStore.getState().activeMainIds;
  ctx.save();
  ctx.fillStyle   = 'rgba(37, 99, 235, 0.65)'; // Bleu franc et net
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth   = Math.max(0.8, 0.6 * sc);
  
  CHARACTERS.forEach(char => {
    if (char.id !== activeWalkerId) {
      if (!showAllLaraStyles) return;
      if (!isCharacterVisibleInMode(char.id, laraCount, activeWalkerId, extraCharacters, activeExtraIds, activeMainIds)) return;
      const currentPos = cameraState.positions[char.id];
      if (!currentPos) return;
      const x = currentPos.x;
      const z = currentPos.z;
      ctx.save();
      ctx.translate(tx(x), tz(z));
      ctx.beginPath(); 
      ctx.arc(0, 0, rNpc, 0, Math.PI * 2); 
      ctx.fill(); 
      ctx.stroke();
      ctx.restore();
    }
  });
  ctx.restore();

  // ── Shiba Inu (Ushiro) ──────────────────────────────────────────────────────
  const shibaPos = cameraState.positions['shiba'];
  if (shibaPos) {
    const rShiba = Math.max(2.2 * sc, 8 * S);
    ctx.save();
    ctx.translate(tx(shibaPos.x), tz(shibaPos.z));
    ctx.rotate(-shibaPos.yaw);
    ctx.fillStyle = 'rgba(255, 153, 0, 0.85)'; // Orange
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = Math.max(0.8, 1 * sc);
    ctx.beginPath(); 
    ctx.arc(0, 0, rShiba, 0, Math.PI * 2); 
    ctx.fill(); 
    ctx.stroke();
    // Petit museau pour indiquer la direction
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(0, rShiba, rShiba * 0.35, 0, Math.PI * 2);
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
  const fovR = Math.max(70 * S, 60 * sc);
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.arc(0, 0, fovR, Math.PI / 2 - hFov / 2, Math.PI / 2 + hFov / 2);
  ctx.closePath();
  ctx.fillStyle   = 'rgba(255,221,0,0.18)'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,221,0,0.45)'; ctx.lineWidth = 0.5 * sc; ctx.stroke();

  // Body icon
  ctx.fillStyle   = '#d32f2f'; // Red Theme Accent instead of '#0066ff'
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth   = Math.max(0.8, 0.8 * sc);
  
  // Body circle (head)
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

export function Minimap({ embedded = false }: MinimapProps = {}) {
  const isMobile = useIsMobile();
  const floatingCanvasRef = useRef<HTMLCanvasElement>(null);
  const expandedCanvasRef = useRef<HTMLCanvasElement>(null);
  const zoomContainerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Contrôles de zoom et déplacement (Pan) pour la grande minimap
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const smallW = isMobile ? SMALL_W_MOBILE : SMALL_W_DESKTOP;
  const smallH = Math.round(smallW * 1.35);

  // Boucle de rendu pour la minimap compacte (flottante ou embedded)
  useEffect(() => {
    if (!isOpen || expanded) return;
    const canvas = floatingCanvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(smallW * dpr);
    canvas.height = Math.round(smallH * dpr);
    canvas.style.width = `${smallW}px`;
    canvas.style.height = `${smallH}px`;

    let rafId: number;
    let lastDraw = 0;
    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      if (isAppIdle()) return;
      if (now - lastDraw < 50) return; // Limite à 20 FPS (au lieu de 60/120 FPS continus)
      lastDraw = now;
      drawMinimap(canvas, smallW);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [smallW, smallH, isOpen, expanded]);

  // Boucle de rendu pour la minimap agrandie (modal)
  useEffect(() => {
    if (!expanded) return;
    const canvas = expandedCanvasRef.current;
    if (!canvas) return;

    let currentExpW = 200;

    const resize = () => {
      const chromeH = 90;
      const availW = Math.min(window.innerWidth * 0.92, 720);
      const availH = Math.max(140, window.innerHeight * 0.86 - chromeH);

      const fitW = Math.min(availW, availH / PLAN_ASPECT);
      const expW = Math.max(80, Math.round(fitW));
      const expH = Math.round(expW * PLAN_ASPECT);
      currentExpW = expW;

      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(expW * dpr);
      canvas.height = Math.round(expH * dpr);
      canvas.style.width = `${expW}px`;
      canvas.style.height = `${expH}px`;
    };

    resize();
    window.addEventListener('resize', resize);

    let rafId: number;
    let lastDraw = 0;
    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      if (isAppIdle()) return;
      if (now - lastDraw < 40) return; // Limite à 25 FPS quand agrandie
      lastDraw = now;
      drawMinimap(canvas, currentExpW);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafId);
    };
  }, [expanded]);

  // Zoom molette non-passif : empêche formellement le zoom global de la page du navigateur
  useEffect(() => {
    if (!expanded) return;
    const el = zoomContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      setZoom(prev => {
        const next = Math.min(5, Math.max(1, +(prev * factor).toFixed(2)));
        if (next === 1) setPan({ x: 0, y: 0 });
        return next;
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [expanded]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'Escape' && expanded) {
        setExpanded(false);
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
      if (e.key === '9' || e.code === 'Digit9' || e.code === 'Numpad9') {
        setIsOpen(c => !c);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return;
    isPanningRef.current = true;
    startPanRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanningRef.current) return;
    const dx = e.clientX - startPanRef.current.x;
    const dy = e.clientY - startPanRef.current.y;
    setPan({
      x: startPanRef.current.panX + dx,
      y: startPanRef.current.panY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isPanningRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <>
      {/* ── EXPANDED MODAL VIEW (Grande Minimap Zoomable) ───────────────────────── */}
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
            background: 'rgba(0, 0, 0, 0.68)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99999,
            pointerEvents: 'auto',
          }}
          onClick={() => {
            setExpanded(false);
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
        >
          <div 
            className="card glass-card shadow-lg p-2.5 rounded-3 border-0"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '96vw',
              maxHeight: '94vh',
              pointerEvents: 'auto',
              background: 'rgba(255, 255, 255, 0.94)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header avec contrôles de zoom et fermeture */}
            <div className="card-header border-0 bg-transparent p-0 d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold text-dark text-uppercase d-flex align-items-center gap-1.5" style={{ fontSize: '11px', letterSpacing: '0.06em' }}>
                  <span>🗺️</span>
                  <span>Plan 2D de la pièce</span>
                </span>
                {zoom > 1 && (
                  <span className="badge bg-primary bg-opacity-75 text-white fw-semibold small">
                    {Math.round(zoom * 100)}%
                  </span>
                )}
              </div>

              <div className="d-flex align-items-center gap-1.5">
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary py-0 px-2 fw-bold text-dark"
                    style={{ height: '24px', lineHeight: '22px' }}
                    onClick={() => setZoom(z => {
                      const next = Math.max(1, +(z - 0.25).toFixed(2));
                      if (next === 1) setPan({ x: 0, y: 0 });
                      return next;
                    })}
                    disabled={zoom <= 1}
                    title="Dézoomer"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary py-0 px-2 fw-bold text-dark"
                    style={{ height: '24px', lineHeight: '22px' }}
                    onClick={() => setZoom(z => Math.min(5, +(z + 0.25).toFixed(2)))}
                    disabled={zoom >= 5}
                    title="Zoomer"
                  >
                    +
                  </button>
                </div>
                {zoom > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger py-0 px-1.5 small fw-semibold"
                    style={{ height: '24px', lineHeight: '22px' }}
                    onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                    title="Réinitialiser le zoom"
                  >
                    ↺ 100%
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn-close ms-2" 
                  aria-label="Close" 
                  onClick={() => {
                    setExpanded(false);
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                />
              </div>
            </div>

            {/* Conteneur de zoom et pan */}
            <div 
              ref={zoomContainerRef}
              className="position-relative d-flex align-items-center justify-content-center overflow-hidden rounded-2 user-select-none border"
              style={{
                background: 'rgba(0, 0, 0, 0.04)',
                cursor: zoom > 1 ? (isPanningRef.current ? 'grabbing' : 'grab') : 'default',
                touchAction: 'none',
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onDoubleClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              title={zoom > 1 ? "Glisser pour déplacer le plan · Double-clic pour réinitialiser" : "Molette pour zoomer sur le plan"}
            >
              <canvas 
                ref={expandedCanvasRef} 
                className="rounded-2 shadow-sm" 
                style={{
                  display: 'block',
                  background: 'transparent',
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isPanningRef.current ? 'none' : 'transform 0.1s ease-out',
                }} 
              />
            </div>

            {/* Aide et raccourcis */}
            <div className="text-center mt-2 text-muted user-select-none" style={{ fontSize: '10px' }}>
              💡 Molette pour zoomer · Glisser pour déplacer · Double-clic pour réinitialiser · Échap pour fermer
            </div>
          </div>
        </div>
      )}

      {/* ── MINIMAP CARD HARMONISÉE (Panel Header comme Perf, clic pour agrandir) ── */}
      {!expanded && (
        <div
          className={`${embedded ? 'w-100' : 'position-fixed'} ${!embedded ? 'shadow-sm' : ''}`}
          style={embedded ? undefined : {
            bottom: isMobile ? 'calc(3.75rem + env(safe-area-inset-bottom) + 0.75rem)' : 20,
            left: isMobile ? 12 : undefined,
            right: isMobile ? undefined : 20,
            width: smallW + 8,
            zIndex: 90,
            pointerEvents: 'auto',
          }}
        >
          <Group 
            emoji="🗺️" 
            title="Plan 2D" 
            defaultOpen 
            headerPadding="py-1.5 px-2"
            onToggle={(open) => setIsOpen(open)}
          >
            <div
              className="d-flex justify-content-center p-1 bg-transparent"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setExpanded(true);
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              title="Cliquer pour ouvrir le plan en grand"
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
                  transition: 'transform 0.15s ease',
                }}
              />
            </div>
          </Group>
        </div>
      )}
    </>
  );
}
