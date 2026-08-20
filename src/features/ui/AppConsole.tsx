/**
 * AppConsole.tsx — Console de debug style CS:GO fixée en bas de l'écran.
 * Affiche les logs de l'application avec horodatage et couleurs par tag.
 *
 * Usage :
 *   import { appLog } from '@features/ui/AppConsole';
 *   appLog('delphina', 'Marche vers la cuisine');
 */
import { useState, useEffect, useRef } from 'react';

// ── Palette de couleurs par tag ────────────────────────────────────────────
const TAG_COLORS: Record<string, string> = {
  delphina: '#00ff88',
  vivida:   '#ff4444',
  angelina: '#00aaff',
  cha:      '#00ccff',
  sabira:   '#ffff44',
  lgbta:    '#cc88ff',
  marissa:  '#ff6b9d',
  system:   '#ffffff',
  perf:     '#ffaa00',
  error:    '#ff0000',
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
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

const MAX_LOGS = 200;

// ── Composant ──────────────────────────────────────────────────────────────
export function AppConsole({ hidden = false }: { hidden?: boolean }) {
  const [logs, setLogs] = useState<AppLogEntry[]>([]);
  const [visible, setVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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
    width: '100%',
    maxWidth: '500px',
    zIndex: 9999,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    pointerEvents: 'auto',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '3px 10px',
    background: 'rgba(0, 0, 0, 0.92)',
    borderTop: '1px solid #00ff88',
    borderBottom: '1px solid rgba(0, 255, 136, 0.25)',
    color: '#00ff88',
    cursor: 'default',
    userSelect: 'none',
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
    maxHeight: '150px',
    overflowY: 'auto',
    background: 'rgba(0, 0, 0, 0.82)',
    padding: '4px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  };

  const lineStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
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

  // ── Rendu ──────────────────────────────────────────────────────────────
  return (
    <div style={{ ...containerStyle, display: hidden ? 'none' : 'block' }}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={titleStyle}>
          <span>🤖</span>
          <span>APP LOGS</span>
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
              marginLeft: '10px'
            }}
          >
            {isPaused ? '▶ REPRENDRE' : '⏸ PAUSE'}
          </button>
        </span>
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
                    minWidth: '70px',
                  }}
                >
                  {entry.tag}
                </span>
                <span style={{ color: 'rgba(0,255,136,0.4)', flexShrink: 0 }}>›</span>
                <span style={msgStyle}>{entry.message}</span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
