/**
 * NpcConsole.tsx — Console de debug style CS:GO fixée en bas de l'écran.
 * Affiche les logs des NPCs avec horodatage et couleurs par personnage.
 *
 * Usage :
 *   import { npcLog } from '@features/ui/NpcConsole';
 *   npcLog('delphina', 'Marche vers la cuisine');
 */
import { useState, useEffect, useRef } from 'react';

// ── Palette de couleurs par NPC ────────────────────────────────────────────
const NPC_COLORS: Record<string, string> = {
  delphina: '#00ff88',
  vivid:    '#ff6b9d',
  angelina: '#ffaa00',
  cha:      '#00ccff',
  sabira:   '#ff4444',
  lgbta:    '#cc88ff',
  marissa:  '#ffff44',
};

function getNpcColor(npcId: string): string {
  return NPC_COLORS[npcId.toLowerCase()] ?? '#aaaaaa';
}

// ── Types ──────────────────────────────────────────────────────────────────
export interface NpcLogEntry {
  id: number;
  npcId: string;
  message: string;
  timestamp: number;
}

// ── Singleton : émettre un log depuis n'importe où ─────────────────────────
let _logCounter = 0;

export const npcLog = (npcId: string, message: string): void => {
  document.dispatchEvent(
    new CustomEvent('npc-log', {
      detail: { npcId, message, timestamp: Date.now() },
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

const MAX_LOGS = 60;

// ── Composant ──────────────────────────────────────────────────────────────
export function NpcConsole() {
  const [logs, setLogs] = useState<NpcLogEntry[]>([]);
  const [visible, setVisible] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Injecter la Google Font JetBrains Mono une seule fois
  useEffect(() => {
    const id = 'npc-console-font';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap';
    document.head.appendChild(link);
  }, []);

  // Écouter les CustomEvents 'npc-log'
  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ npcId: string; message: string; timestamp: number }>;
      const { npcId, message, timestamp } = ev.detail;
      setLogs(prev => {
        const entry: NpcLogEntry = { id: ++_logCounter, npcId, message, timestamp };
        const next = [...prev, entry];
        return next.length > MAX_LOGS ? next.slice(next.length - MAX_LOGS) : next;
      });
    };
    document.addEventListener('npc-log', handler);
    return () => document.removeEventListener('npc-log', handler);
  }, []);

  // Auto-scroll vers le bas à chaque nouveau log
  useEffect(() => {
    if (visible && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, visible]);

  // ── Styles inline ──────────────────────────────────────────────────────
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
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
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={titleStyle}>
          <span>🤖</span>
          <span>NPCs LOG</span>
          {logs.length > 0 && (
            <span style={{ opacity: 0.5, fontSize: '9px', fontWeight: 400 }}>
              ({logs.length}/{MAX_LOGS})
            </span>
          )}
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
              En attente de logs NPC…
            </div>
          )}
          {logs.map(entry => {
            const color = getNpcColor(entry.npcId);
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
                  {entry.npcId}
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
