/**
 * AnimationsPanel.tsx — Panneau latéral des animations de construction.
 * Toujours ouvert, positionné à droite de l'écran.
 * Affiche la durée approximative de chaque animation, un timer en cours
 * d'exécution, et un bouton Arrêter.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@shared/hooks/useIsMobile';

export interface AnimationsPanelProps {
  buildAnim:        boolean; onStartBuildAnim:  () => void;
  buildAnim3:       boolean; onStartBuildAnim3: () => void;
  buildAnim4:       boolean; onStartBuildAnim4: () => void;
  visiteGuidee:     boolean; onStartVisiteGuidee: () => void;
  onStop:           () => void;
  durations:        Record<string, number>; // ms par animation
}

const ANIMS: Array<{
  key:    keyof AnimationsPanelProps;
  start:  keyof AnimationsPanelProps;
  label:  string;
  color:  string;
}> = [
  { key: 'buildAnim',    start: 'onStartBuildAnim',    label: 'Créer l\'appart', color: '#0ea5a0' },
  { key: 'buildAnim3',   start: 'onStartBuildAnim3',   label: 'Tombée du ciel',  color: '#0ea5a0' },
  { key: 'buildAnim4',   start: 'onStartBuildAnim4',   label: 'Matrix',          color: '#00c853' },
  { key: 'visiteGuidee', start: 'onStartVisiteGuidee', label: 'Visite guidée',   color: '#f59e0b' },
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

export function AnimationsPanel(props: AnimationsPanelProps) {
  const isMobile     = useIsMobile();
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
    <div style={{
      position: 'fixed',
      // Mobile : top-left (Minimap occupe top-right, tab bar occupe bas)
      // Desktop : top-right (inchangé)
      top: isMobile ? 8 : 16,
      ...(isMobile ? { left: 8 } : { right: 16 }),
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
      width: isMobile ? 140 : 170,
      fontFamily: 'inherit',
    }}>
      {/* Titre — cliquable sur mobile pour collapse/expand */}
      <div
        onClick={isMobile && !anyRunning ? () => setExpanded(e => !e) : undefined}
        style={{
          color: 'rgba(255,255,255,0.55)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: isMobile ? '8px 10px' : '4px 8px',
          background: 'rgba(10,10,20,0.55)',
          backdropFilter: 'blur(8px)',
          borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.08)',
          cursor: isMobile && !anyRunning ? 'pointer' : 'default',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span>🎬 Animations</span>
        {isMobile && !anyRunning && (
          <span style={{ fontSize: 9, opacity: 0.7 }}>{expanded ? '▲' : '▼'}</span>
        )}
      </div>

      {/* Boutons — cachés en mobile collapsed */}
      {showList && ANIMS.map(a => {
        const isActive = props[a.key] as boolean;
        const dur      = props.durations[a.key];
        return (
          <button
            key={a.key}
            disabled={anyRunning && !isActive}
            onClick={() => (props[a.start] as () => void)()}
            style={{
              background: isActive ? `${a.color}22` : 'rgba(10,10,20,0.55)',
              color: isActive ? a.color : 'rgba(255,255,255,0.75)',
              border: `1px solid ${isActive ? a.color + '77' : 'rgba(255,255,255,0.10)'}`,
              borderRadius: 6,
              padding: isMobile ? '12px 12px' : '6px 10px',
              fontSize: isMobile ? 13 : 11,
              minHeight: isMobile ? 44 : undefined,
              fontWeight: 700,
              letterSpacing: '0.04em',
              cursor: anyRunning && !isActive ? 'not-allowed' : 'pointer',
              opacity: anyRunning && !isActive ? 0.3 : 1,
              backdropFilter: 'blur(8px)',
              textAlign: 'left',
              fontFamily: 'inherit',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>{isActive ? `▶ ${a.label}` : `▶ ${a.label}`}</span>
            <span style={{ opacity: 0.6, fontSize: 10, fontWeight: 400 }}>
              {dur ? fmtMs(dur) : ''}
            </span>
          </button>
        );
      })}

      {/* Zone active : timer + barre de progression + Arrêter */}
      {anyRunning && activeAnim && (
        <div style={{
          background: 'rgba(10,10,20,0.70)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${activeAnim.color}55`,
          borderRadius: 6,
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {/* Timer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: activeAnim.color,
            fontWeight: 600,
          }}>
            <span>{fmtElapsed(elapsed)}</span>
            {totalMs > 0 && <span style={{ opacity: 0.6 }}>{fmtMs(totalMs)}</span>}
          </div>

          {/* Barre de progression */}
          {totalMs > 0 && (
            <div style={{
              height: 3,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.12)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${progress * 100}%`,
                background: activeAnim.color,
                borderRadius: 2,
                transition: 'width 0.2s linear',
              }} />
            </div>
          )}

          {/* Bouton stop */}
          <button
            onClick={props.onStop}
            style={{
              background: 'rgba(255,60,60,0.15)',
              color: '#ff6060',
              border: '1px solid rgba(255,60,60,0.35)',
              borderRadius: 5,
              padding: '5px 0',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.05em',
            }}
          >
            ■ Arrêter
          </button>
        </div>
      )}
    </div>
  );
}
