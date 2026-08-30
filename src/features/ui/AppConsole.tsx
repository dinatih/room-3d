/**
 * AppConsole.tsx — Console de debug style CS:GO fixée en bas de l'écran.
 * Affiche les logs de l'application avec horodatage et couleurs par tag.
 *
 * Usage :
 *   import { appLog } from '@features/ui/AppConsole';
 *   appLog('delphina', 'Marche vers la cuisine');
 */
import { useState, useEffect, useRef } from 'react';
import { CHARACTERS, findCharacter } from '@features/scene/walkerConfig';

// ── Palette de couleurs par tag ────────────────────────────────────────────
// Les couleurs NPC viennent de CharacterConfig.color (source unique de vérité).
// Seuls les tags système restent définis ici.
const TAG_COLORS: Record<string, string> = {
  // Tags système (non-NPC)
  system:   '#ffffff',
  perf:     '#ffaa00',
  error:    '#ff0000',
  robin:    '#ff8833',
  // Tags NPC : peuplés dynamiquement depuis CHARACTERS
  ...Object.fromEntries(CHARACTERS.map(c => [c.id, c.color])),
};

function getTagColor(tag: string): string {
  return TAG_COLORS[tag.toLowerCase()] ?? '#aaaaaa';
}

// ── Types ──────────────────────────────────────────────────────────────────
export interface AppLogEntry {
  id: number;
  tag: string;
  message: string;
  timestamp: number;
}

// ── Singleton : émettre un log depuis n'importe où ─────────────────────────
let _logCounter = 0;

export const appLog = (tag: string, message: string): void => {
  document.dispatchEvent(
    new CustomEvent('app-log', {
      detail: { tag, message, timestamp: Date.now() },
    })
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────
function formatTime(ts: number): string {
  const d = new Date(ts);
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

const MAX_LOGS = 200;

// ── Composant ──────────────────────────────────────────────────────────────
export function AppConsole({ hidden = false }: { hidden?: boolean }) {
  const [logs, setLogs] = useState<AppLogEntry[]>([]);
  const [visible, setVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const savedDimensionsRef = useRef<{ width?: number; height?: number }>({ width: 620, height: 110 });

  // Injecter la Google Font JetBrains Mono une seule fois
  useEffect(() => {
    const id = 'app-console-font';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap';
    document.head.appendChild(link);
  }, []);

  // Écouter les redimensionnements pour sauvegarder la taille manuelle
  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (visible && entry.contentRect.height > 40) {
          savedDimensionsRef.current = {
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          };
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [visible]);

  // Écouter les CustomEvents 'app-log'
  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ tag: string; message: string; timestamp: number }>;
      const { tag, message, timestamp } = ev.detail;
      setLogs(prev => {
        const entry: AppLogEntry = { id: ++_logCounter, tag, message, timestamp };
        const next = [...prev, entry];
        return next.length > MAX_LOGS ? next.slice(next.length - MAX_LOGS) : next;
      });
    };
    document.addEventListener('app-log', handler);
    return () => document.removeEventListener('app-log', handler);
  }, []);

  // Raccourci clavier 'B' pour ouvrir / fermer la console
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'b' || e.key === 'B') {
        setVisible(v => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-scroll vers le bas à chaque nouveau log si non en pause
  useEffect(() => {
    if (visible && !isPaused && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [logs, visible, isPaused]);

  // ── Styles inline ──────────────────────────────────────────────────────
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    width: visible && savedDimensionsRef.current.width ? `${savedDimensionsRef.current.width}px` : '620px',
    height: visible && savedDimensionsRef.current.height ? `${savedDimensionsRef.current.height}px` : '110px',
    maxWidth: '90vw',
    minWidth: '280px',
    zIndex: 9999,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    pointerEvents: 'auto',
    display: hidden ? 'none' : 'flex',
    flexDirection: 'column',
    resize: visible ? 'both' : 'none',
    overflow: 'hidden',
    minHeight: visible ? '60px' : 'auto',
    maxHeight: visible ? '85vh' : 'auto',
    boxShadow: visible ? '0 4px 20px rgba(0, 0, 0, 0.7)' : 'none',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 10px',
    background: 'rgba(0, 0, 0, 0.95)',
    borderTop: '1px solid #00ff88',
    borderBottom: '1px solid rgba(0, 255, 136, 0.25)',
    color: '#00ff88',
    cursor: 'default',
    userSelect: 'none',
    flexShrink: 0,
  };

  const titleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontSize: '10px',
    fontWeight: 500,
  };

  const closeBtnStyle: React.CSSProperties = {
    background: 'none',
    border: '1px solid rgba(0, 255, 136, 0.4)',
    color: '#00ff88',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    lineHeight: 1,
    padding: '1px 6px',
    cursor: 'pointer',
    borderRadius: '2px',
    letterSpacing: '0.05em',
    transition: 'background 0.15s, border-color 0.15s',
  };

  const logAreaStyle: React.CSSProperties = {
    flex: 1,
    minHeight: '40px',
    overflowY: 'auto',
    background: 'rgba(0, 0, 0, 0.85)',
    padding: '6px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const lineStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  };

  const tsStyle: React.CSSProperties = {
    color: 'rgba(170, 170, 170, 0.7)',
    flexShrink: 0,
    fontSize: '10px',
  };

  const msgStyle: React.CSSProperties = {
    color: 'rgba(220, 220, 220, 0.9)',
    flex: 1,
  };

  // Gestion du drag de redimensionnement depuis le coin inférieur gauche
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = containerRef.current ? containerRef.current.offsetWidth : (savedDimensionsRef.current.width ?? 620);
    const startH = containerRef.current ? containerRef.current.offsetHeight : (savedDimensionsRef.current.height ?? 110);

    const onPointerMove = (ev: PointerEvent) => {
      // Déplacement vers la gauche augmente la largeur (car container fixé à droite: top: 0, right: 0)
      const deltaX = startX - ev.clientX;
      const deltaY = ev.clientY - startY;
      const newW = Math.max(280, Math.min(window.innerWidth * 0.95, startW + deltaX));
      const newH = Math.max(60, Math.min(window.innerHeight * 0.85, startH + deltaY));
      
      savedDimensionsRef.current = { width: newW, height: newH };
      if (containerRef.current) {
        containerRef.current.style.width = `${newW}px`;
        containerRef.current.style.height = `${newH}px`;
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // ── Rendu ──────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={containerStyle}
    >
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            style={closeBtnStyle}
            onClick={() => setVisible(v => !v)}
            title={visible ? 'Masquer la console' : 'Afficher la console'}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,255,136,0.15)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#00ff88';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'none';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,255,136,0.4)';
            }}
          >
            {visible ? '✕' : '▲'}
          </button>
          <span style={titleStyle}>
            <span>🤖</span>
            <span>APP LOGS</span>
          </span>
        </div>
        <button
          onClick={() => setIsPaused(p => !p)}
          style={{
            background: isPaused ? 'rgba(255, 170, 0, 0.2)' : 'rgba(0, 255, 136, 0.1)',
            border: `1px solid ${isPaused ? '#ffaa00' : '#00ff88'}`,
            color: isPaused ? '#ffaa00' : '#00ff88',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            lineHeight: 1,
            padding: '2px 6px',
            cursor: 'pointer',
            borderRadius: '2px',
          }}
        >
          {isPaused ? '▶ REPRENDRE' : '⏸ PAUSE'}
        </button>
      </div>

      {/* Log area */}
      {visible && (
        <div style={logAreaStyle}>
          {logs.length === 0 && (
            <div style={{ ...lineStyle, color: 'rgba(100, 100, 100, 0.7)', fontStyle: 'italic' }}>
              En attente de logs…
            </div>
          )}
          {logs.map(entry => {
            const color = getTagColor(entry.tag);
            return (
              <div key={entry.id} style={lineStyle}>
                <span style={tsStyle}>[{formatTime(entry.timestamp)}]</span>
                <span
                  style={{
                    color,
                    flexShrink: 0,
                    fontWeight: 500,
                    textShadow: `0 0 6px ${color}55`,
                  }}
                >
                  {(() => { const ch = findCharacter(entry.tag); return ch ? `${ch.emoji} ${entry.tag}` : entry.tag; })()}
                </span>
                <span style={{ color: 'rgba(0,255,136,0.4)', flexShrink: 0 }}>›</span>
                <span style={msgStyle}>{entry.message}</span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Poignée de redimensionnement manuelle (bas-gauche) */}
      {visible && (
        <div
          onPointerDown={handleResizePointerDown}
          title="Redimensionner la console (Glisser)"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: 22,
            height: 22,
            cursor: 'nesw-resize',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            padding: '2px',
            color: '#00ff88',
            opacity: 0.75,
            zIndex: 10,
            userSelect: 'none',
            touchAction: 'none',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 15h14v-2H1v2zm0-4h10V9H1v2zm0-4h6V5H1v2z" />
          </svg>
        </div>
      )}
    </div>
  );
}
