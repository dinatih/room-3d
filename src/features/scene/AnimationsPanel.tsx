/**
 * AnimationsPanel.tsx — Panneau latéral des animations de construction.
 * Toujours ouvert, positionné à droite de l'écran (ou à gauche sur mobile).
 * Affiche la durée approximative de chaque animation, un timer en cours
 * d'exécution, et un bouton Arrêter.
 * Styled using Bootstrap 5.3, glassmorphism, and the project red theme accent.
 */
import { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import type { PlaneModelKey } from './PaperPlane';
import { Minimap } from './Minimap';

export interface AnimationsPanelProps {
  buildAnim4:       boolean; onStartBuildAnim4: () => void;
  buildAnimPro:     boolean; onStartBuildAnimPro: () => void;
  onStop:           () => void;
  durations:        Record<string, number>; // ms par animation
  planeModel:       PlaneModelKey;
  onSetPlaneModel:  (m: PlaneModelKey) => void;
  autopilotVisible: boolean;
  onToggleAutopilot: () => void;
  showLandingStrips: boolean;
  onToggleLandingStrips: () => void;
}

const ANIMS: Array<{
  key:    keyof AnimationsPanelProps;
  start:  keyof AnimationsPanelProps;
  label:  string;
  color:  string;
}> = [
  { key: 'buildAnim4',   start: 'onStartBuildAnim4',   label: 'Matrix Pro',          color: '#00c853' },
  { key: 'buildAnimPro', start: 'onStartBuildAnimPro', label: 'Tombée (Pro)',    color: '#ff9800' },
];

function fmtMs(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `~${s}s`;
  const m = Math.floor(s / 60), r = s % 60;
  return r === 0 ? `~${m}min` : `~${m}m${r}s`;
}

function fmtElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60), r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : `0:${String(r).padStart(2, '0')}`;
}

function dispatchKey(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

export function AnimationsPanel(props: AnimationsPanelProps) {
  const isMobile     = useIsMobile();
  const [planeOpen, setPlaneOpen] = useState(false);

  const anyRunning   = ANIMS.some(a => props[a.key] as boolean);
  const activeKey    = ANIMS.find(a => props[a.key] as boolean)?.key ?? null;
  const activeAnim   = ANIMS.find(a => props[a.key] as boolean) ?? null;
  const [expanded, setExpanded] = useState(false);
  
  // Mobile : collapsed par défaut, déplié auto en cours d'animation
  const showList = !isMobile || expanded || anyRunning;

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (anyRunning) {
      startRef.current = Date.now();
      setElapsed(0);
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - startRef.current);
      }, 200);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [anyRunning]);

  const totalMs    = activeKey ? (props.durations[activeKey] ?? 0) : 0;
  const progress   = totalMs > 0 ? Math.min(elapsed / totalMs, 1) : 0;

  return (
    <div 
      className="position-fixed d-flex flex-column gap-2"
      style={{
        top: isMobile ? 8 : 16,
        ...(isMobile ? { left: 8 } : { right: 16 }),
        zIndex: 100,
        width: isMobile ? 140 : 170,
      }}
    >
      {/* Titre — cliquable sur mobile pour collapse/expand */}
      <div
        onClick={isMobile && !anyRunning ? () => setExpanded(e => !e) : undefined}
        className="card shadow-sm glass-card text-dark py-2 px-3 fw-bold d-flex justify-content-between align-items-center"
        style={{
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          cursor: isMobile && !anyRunning ? 'pointer' : 'default',
          userSelect: 'none',
        }}
      >
        <span>🎬 Animations</span>
        {isMobile && !anyRunning && (
          <span style={{ fontSize: '8px', color: 'var(--muted)' }}>{expanded ? '▲' : '▼'}</span>
        )}
      </div>

      {/* Boutons d'animations */}
      {showList && ANIMS.map(a => {
        const isActive = props[a.key] as boolean;
        const dur      = props.durations[a.key];
        return (
          <button
            key={a.key}
            disabled={anyRunning && !isActive}
            onClick={() => (props[a.start] as () => void)()}
            className={`btn w-100 text-start rounded-3 py-2 px-3 fw-bold d-flex justify-content-between align-items-center ${isActive ? 'btn-danger text-white border-danger shadow-sm' : 'glass-card text-dark shadow-sm'}`}
            style={{
              fontSize: isMobile ? '13px' : '11px',
              minHeight: isMobile ? '44px' : undefined,
              letterSpacing: '0.02em',
              opacity: anyRunning && !isActive ? 0.35 : 1,
            }}
          >
            <span>{isActive ? `▶ ${a.label}` : `▶ ${a.label}`}</span>
            <span className="small fw-normal opacity-75">
              {dur ? fmtMs(dur) : ''}
            </span>
          </button>
        );
      })}

      {/* Zone active : timer + barre de progression + Arrêter */}
      {anyRunning && activeAnim && (
        <div 
          className="card border border-danger-subtle p-2 d-flex flex-column gap-2 bg-danger-subtle bg-opacity-10 text-dark shadow-sm"
          style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        >
          {/* Timer */}
          <div className="d-flex justify-content-between small fw-bold text-danger" style={{ fontSize: '10px' }}>
            <span>{fmtElapsed(elapsed)}</span>
            {totalMs > 0 && <span className="text-muted">{fmtMs(totalMs)}</span>}
          </div>

          {/* Barre de progression */}
          {totalMs > 0 && (
            <div className="progress" style={{ height: '3px', background: 'rgba(0,0,0,0.08)' }}>
              <div 
                className="progress-bar bg-danger" 
                role="progressbar" 
                style={{ width: `${progress * 100}%`, transition: 'width 0.2s linear' }}
              />
            </div>
          )}

          {/* Bouton stop */}
          <button
            onClick={props.onStop}
            className="btn btn-danger btn-sm w-100 fw-bold py-1 border-0"
            style={{ fontSize: '10px', letterSpacing: '0.04em' }}
          >
            ■ Arrêter
          </button>
        </div>
      )}

      {/* XP Interactive Group */}
      {showList && (
        <div className="card shadow-sm glass-card overflow-hidden mt-1">
          <div className="card-header p-0 border-0 bg-transparent">
            <button
              className="btn w-100 text-start py-2 px-3 fw-bold d-flex align-items-center justify-content-between text-dark border-0 shadow-none"
              onClick={() => setPlaneOpen(o => !o)}
              style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}
            >
              <span>✈ Avion</span>
              <span 
                style={{ 
                  fontSize: '8px', 
                  color: 'var(--muted)',
                  transform: planeOpen ? 'rotate(90deg)' : 'none', 
                  transition: 'transform 0.18s' 
                }}
              >
                ▶
              </span>
            </button>
          </div>
          {planeOpen && (
            <div className="card-body p-0 bg-transparent d-flex flex-column border-top border-light-subtle">
              <button
                className="btn btn-outline-danger w-100 text-start rounded-0 border-0 border-bottom py-2 px-3"
                onClick={() => dispatchKey('f')}
                style={{ fontSize: isMobile ? '13px' : '10px' }}
              >
                ✈ Lancer / Quitter [F]
              </button>
              
              <div className="p-2 border-bottom" style={{ borderColor: 'rgba(0,0,0,0.08) !important' }}>
                <div className="text-muted fw-semibold mb-1" style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Modèle
                </div>
                <div className="d-flex gap-1">
                  <button 
                    className={`btn btn-sm flex-grow-1 p-1 ${props.planeModel === 'paper' ? 'btn-danger' : 'btn-outline-secondary'}`}
                    onClick={() => props.onSetPlaneModel('paper')}
                    style={{ fontSize: '9px' }}
                  >
                    Papier
                  </button>
                  <button 
                    className={`btn btn-sm flex-grow-1 p-1 ${props.planeModel === 'rocket' ? 'btn-danger' : 'btn-outline-secondary'}`}
                    onClick={() => props.onSetPlaneModel('rocket')}
                    style={{ fontSize: '9px' }}
                  >
                    Fusée
                  </button>
                  <button 
                    className={`btn btn-sm flex-grow-1 p-1 ${props.planeModel === 'comet' ? 'btn-danger' : 'btn-outline-secondary'}`}
                    onClick={() => props.onSetPlaneModel('comet')}
                    style={{ fontSize: '9px' }}
                  >
                    Comète
                  </button>
                </div>
              </div>
              
              <button
                className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
                onClick={props.onToggleAutopilot}
                style={{ 
                  fontSize: isMobile ? '13px' : '10px', 
                  background: 'transparent',
                  opacity: props.autopilotVisible ? 1 : 0.55,
                }}
              >
                <span>Pilote auto ∞</span>
                <span className={`badge ${props.autopilotVisible ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
                  {props.autopilotVisible ? 'ON' : 'OFF'}
                </span>
              </button>
              
              <button
                className="btn btn-light w-100 text-start rounded-0 border-0 border-bottom py-2 px-3 text-dark d-flex align-items-center justify-content-between"
                onClick={props.onToggleLandingStrips}
                style={{ 
                  fontSize: isMobile ? '13px' : '10px', 
                  background: 'transparent',
                  opacity: props.showLandingStrips ? 1 : 0.55,
                }}
              >
                <span>Pistes 🛬</span>
                <span className={`badge ${props.showLandingStrips ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
                  {props.showLandingStrips ? 'ON' : 'OFF'}
                </span>
              </button>
              
              <div className="p-2 text-muted" style={{ fontSize: '9px' }}>
                [C] changer vue en vol
              </div>
            </div>
          )}
        </div>
      )}

      {/* Minimap (Plan 2D) encadrée dans le menu de droite */}
      <Minimap />
    </div>
  );
}
