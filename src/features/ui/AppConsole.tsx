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
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { useIsMobile } from '@shared/hooks/useIsMobile';

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
export const APP_LOG_HISTORY: AppLogEntry[] = [];

export const appLog = (tag: string, message: string): void => {
  const entry: AppLogEntry = {
    id: ++_logCounter,
    tag,
    message,
    timestamp: Date.now(),
  };
  APP_LOG_HISTORY.push(entry);
  if (APP_LOG_HISTORY.length > 200) {
    APP_LOG_HISTORY.shift();
  }
  document.dispatchEvent(
    new CustomEvent('app-log', {
      detail: entry,
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
  const isMobile = useIsMobile();
  const activeWalkerId = useSceneStore(state => state.activeWalkerId);
  const activeChar = findCharacter(activeWalkerId);

  const [logs, setLogs] = useState<AppLogEntry[]>([]);
  const [visible, setVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [filterBubbleOnly, setFilterBubbleOnly] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const savedDimensionsRef = useRef<{ height?: number }>({ height: 110 });

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
      const ev = e as CustomEvent<{ id?: number; tag: string; message: string; timestamp: number }>;
      const { id, tag, message, timestamp } = ev.detail;
      const logId = id ?? ++_logCounter;
      setLogs(prev => {
        const entry: AppLogEntry = { id: logId, tag, message, timestamp };
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
  }, [logs, visible, isPaused, filterBubbleOnly]);

  const displayedLogs = filterBubbleOnly
    ? logs.filter(entry => entry.tag.toLowerCase() === activeWalkerId.toLowerCase())
    : logs;

  // ── Styles inline ──────────────────────────────────────────────────────
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    left: visible ? (isMobile ? 0 : 280) : 'auto',
    width: 'auto',
    height: visible ? (savedDimensionsRef.current.height ? `${savedDimensionsRef.current.height}px` : '110px') : 'auto',
    minWidth: visible ? (isMobile ? '100vw' : '320px') : 'auto',
    maxWidth: 'none',
    zIndex: 9999,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    pointerEvents: 'auto',
    display: hidden ? 'none' : 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: visible ? '60px' : 'auto',
    maxHeight: visible ? '85vh' : 'auto',
    boxShadow: visible ? '0 4px 20px rgba(0, 0, 0, 0.7)' : '0 2px 8px rgba(0, 0, 0, 0.5)',
    borderBottomLeftRadius: visible ? (isMobile ? '0' : '4px') : '4px',
    borderLeft: visible && !isMobile ? '1px solid rgba(0, 255, 136, 0.3)' : 'none',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: visible ? 'space-between' : 'center',
    padding: visible ? '4px 10px' : '3px 8px',
    background: 'rgba(0, 0, 0, 0.92)',
    borderTop: 'none',
    borderRight: 'none',
    borderLeft: visible && !isMobile ? 'none' : '1px solid rgba(0, 255, 136, 0.4)',
    borderBottom: '1px solid rgba(0, 255, 136, 0.3)',
    borderBottomLeftRadius: visible ? '0' : '4px',
    color: '#00ff88',
    cursor: visible ? 'default' : 'pointer',
    userSelect: 'none',
    flexShrink: 0,
    transition: 'background 0.2s',
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

  // Gestion du drag de redimensionnement vertical (hauteur)
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startH = containerRef.current ? containerRef.current.offsetHeight : (savedDimensionsRef.current.height ?? 110);

    const onPointerMove = (ev: PointerEvent) => {
      const deltaY = ev.clientY - startY;
      const newH = Math.max(60, Math.min(window.innerHeight * 0.85, startH + deltaY));
      savedDimensionsRef.current = { height: newH };
      if (containerRef.current) {
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
      <div
        style={headerStyle}
        onClick={() => { if (!visible) setVisible(true); }}
        title={!visible ? 'Ouvrir la console App Logs (B)' : undefined}
        onMouseEnter={e => {
          if (!visible) {
            (e.currentTarget as HTMLDivElement).style.background = 'rgba(0, 255, 136, 0.15)';
          }
        }}
        onMouseLeave={e => {
          if (!visible) {
            (e.currentTarget as HTMLDivElement).style.background = 'rgba(0, 0, 0, 0.92)';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {visible && (
            <button
              style={closeBtnStyle}
              onClick={(e) => {
                e.stopPropagation();
                setVisible(false);
              }}
              title="Masquer la console (B)"
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,255,136,0.15)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#00ff88';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'none';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,255,136,0.4)';
              }}
            >
              ✕
            </button>
          )}
          <span style={titleStyle}>
            <span>🤖</span>
            <span>APP LOGS</span>
          </span>
        </div>
        {visible && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Bouton Filtre Bulle Think */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFilterBubbleOnly(f => !f);
              }}
              title={
                filterBubbleOnly
                  ? `Filtre Bulle Think actif (${activeChar?.name ?? activeWalkerId}) — Cliquer pour afficher tous les logs`
                  : `Afficher uniquement les logs de la bulle de pensée (${activeChar?.name ?? activeWalkerId})`
              }
              style={{
                background: filterBubbleOnly ? 'rgba(0, 210, 255, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${filterBubbleOnly ? '#00d2ff' : 'rgba(0, 255, 136, 0.4)'}`,
                color: filterBubbleOnly ? '#00d2ff' : '#00ff88',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '9px',
                fontWeight: filterBubbleOnly ? 600 : 400,
                lineHeight: 1,
                padding: '2px 8px',
                cursor: 'pointer',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: filterBubbleOnly ? '0 0 8px rgba(0, 210, 255, 0.4)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span>💭</span>
              <span>
                {filterBubbleOnly
                  ? `BULLE THINK : ${activeChar?.emoji ?? ''} ${activeChar?.name ?? activeWalkerId}`.trim()
                  : 'BULLE THINK'}
              </span>
            </button>

            {/* Bouton Pause / Reprendre */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(p => !p);
              }}
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
        )}
      </div>

      {/* Log area */}
      {visible && (
        <div style={logAreaStyle}>
          {displayedLogs.length === 0 && (
            <div style={{ ...lineStyle, color: 'rgba(100, 100, 100, 0.7)', fontStyle: 'italic' }}>
              {filterBubbleOnly
                ? `💭 Aucune pensée enregistrée pour ${activeChar?.name ?? activeWalkerId}…`
                : 'En attente de logs…'}
            </div>
          )}
          {displayedLogs.map((entry, idx) => {
            const color = getTagColor(entry.tag);
            return (
              <div key={`${entry.id}_${idx}`} style={lineStyle}>
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

      {/* Barre de redimensionnement vertical (bas de fenêtre) */}
      {visible && (
        <div
          onPointerDown={handleResizePointerDown}
          title="Redimensionner la hauteur de la console (Glisser verticalement)"
          style={{
            height: '8px',
            width: '100%',
            cursor: 'ns-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 255, 136, 0.05)',
            borderTop: '1px solid rgba(0, 255, 136, 0.2)',
            userSelect: 'none',
            touchAction: 'none',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.background = 'rgba(0, 255, 136, 0.25)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.background = 'rgba(0, 255, 136, 0.05)';
          }}
        >
          <div
            style={{
              width: '40px',
              height: '2px',
              background: 'rgba(0, 255, 136, 0.6)',
              borderRadius: '1px',
            }}
          />
        </div>
      )}
    </div>
  );
}
