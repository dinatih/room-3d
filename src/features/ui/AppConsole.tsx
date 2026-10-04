/**
 * AppConsole.tsx — Console de debug fixée en bas à droite de l'écran.
 * Affiche les logs applicatifs avec horodatage, couleurs par tag et filtre Bulle Think.
 */
import { useState, useEffect, useRef } from 'react';
import { CHARACTERS, findCharacter, npcLabel } from '@features/scene/walkerConfig';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { useIsMobile } from '@shared/hooks/useIsMobile';

// ── Palette de couleurs par tag ────────────────────────────────────────────
const TAG_COLORS: Record<string, string> = {
  system: '#4b5563',
  perf:   '#d97706',
  error:  '#dc2626',
  robin:  '#ea580c',
  ...Object.fromEntries(CHARACTERS.map(c => [c.id, c.color])),
};

function getTagColor(tag: string): string {
  const lower = tag.toLowerCase();
  if (lower === 'system') return '#4b5563';
  if (lower === 'error') return '#dc2626';
  if (lower === 'perf') return '#d97706';
  if (TAG_COLORS[lower]) return TAG_COLORS[lower];
  if (lower.includes('point') || lower.includes('zone') || lower.includes('duo') || lower.includes('combat')) return '#2563eb';
  return '#6b7280';
}

// ── Types & Singleton ──────────────────────────────────────────────────────
export interface AppLogEntry {
  id: number;
  tag: string;
  message: string;
  timestamp: number;
}

let _logCounter = 0;
export const APP_LOG_HISTORY: AppLogEntry[] = [];
const MAX_LOGS = 200;

export const appLog = (tag: string, message: string): void => {
  const entry: AppLogEntry = { id: ++_logCounter, tag, message, timestamp: Date.now() };
  APP_LOG_HISTORY.push(entry);
  if (APP_LOG_HISTORY.length > MAX_LOGS) APP_LOG_HISTORY.shift();
  document.dispatchEvent(new CustomEvent('app-log', { detail: entry }));
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

// ── Composant ──────────────────────────────────────────────────────────────
export function AppConsole({ hidden = false }: { hidden?: boolean }) {
  const isMobile = useIsMobile();
  const activeWalkerId = useSceneStore(state => state.activeWalkerId);
  const activeChar = findCharacter(activeWalkerId);

  const [logs, setLogs] = useState<AppLogEntry[]>([]);
  const [visible, setVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [filterBubbleOnly, setFilterBubbleOnly] = useState(false);
  const logAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const savedHeightRef = useRef(180);

  // Écoute des CustomEvents 'app-log'
  useEffect(() => {
    const handler = (e: Event) => {
      const { id, tag, message, timestamp } = (e as CustomEvent<AppLogEntry>).detail;
      setLogs(prev => {
        const next = [...prev, { id: id ?? ++_logCounter, tag, message, timestamp }];
        return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
      });
    };
    document.addEventListener('app-log', handler);
    return () => document.removeEventListener('app-log', handler);
  }, []);

  // Raccourci clavier 'B'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return;
      if (e.key === 'b' || e.key === 'B') setVisible(v => !v);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-scroll du panneau de logs si non en pause
  useEffect(() => {
    if (visible && !isPaused && logAreaRef.current) {
      logAreaRef.current.scrollTop = logAreaRef.current.scrollHeight;
    }
  }, [logs, visible, isPaused, filterBubbleOnly]);

  const displayedLogs = filterBubbleOnly
    ? logs.filter(entry => {
        const tag = entry.tag.toLowerCase();
        const activeId = activeWalkerId.toLowerCase();

        // 1. Tag direct du PNJ actif
        if (tag === activeId) return true;

        // 2. Logs système généraux (moteur 3D suspendu, caméras, etc.)
        if (tag === 'system') return true;

        // 3. Log lié au PNJ actif (ex: hugs-point, duo, invitation mentionnant le PNJ)
        const msg = entry.message.toLowerCase();
        if (msg.includes(activeId)) return true;
        if (activeChar && msg.includes(activeChar.name.toLowerCase())) return true;

        return false;
      })
    : logs;

  // Redimensionnement vertical par drag (vers le haut car fixé en bas)
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startH = containerRef.current ? containerRef.current.offsetHeight : savedHeightRef.current;

    const onPointerMove = (ev: PointerEvent) => {
      const maxAllowed = isMobile ? window.innerHeight * 0.5 : window.innerHeight * 0.75;
      const newH = Math.max(60, Math.min(maxAllowed, startH - (ev.clientY - startY)));
      savedHeightRef.current = newH;
      if (containerRef.current) containerRef.current.style.height = `${newH}px`;
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  if (hidden) return null;

  return (
    <div
      ref={containerRef}
      className="card glass-card position-fixed font-monospace d-flex flex-column shadow-lg overflow-hidden rounded-3 border-0"
      style={{
        bottom: isMobile ? 'calc(3.75rem + env(safe-area-inset-bottom) + 8px)' : 16,
        right: isMobile ? 8 : 16,
        left: visible ? (isMobile ? 8 : 288) : 'auto',
        width: visible ? undefined : 'auto',
        height: visible ? `${savedHeightRef.current}px` : 'auto',
        minHeight: visible ? 60 : 'auto',
        maxHeight: isMobile ? '50vh' : '75vh',
        zIndex: 100, // Inférieur à #loading (9999) pour ne pas s'afficher pendant le préchargement
        fontSize: '11px',
      }}
    >
      {/* Header */}
      <div
        className="card-header p-0 border-0 bg-transparent d-flex align-items-center justify-content-between px-2 py-1 user-select-none border-bottom border-light-subtle flex-shrink-0"
        style={{ cursor: visible ? 'default' : 'pointer' }}
        onClick={() => { if (!visible) setVisible(true); }}
        title={!visible ? 'Ouvrir la console App Logs (B)' : undefined}
      >
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {visible && (
            <button
              type="button"
              className="btn btn-sm btn-light border-0 py-0 px-1 lh-1 small text-secondary"
              onClick={(e) => {
                e.stopPropagation();
                setVisible(false);
              }}
              title="Masquer la console (B)"
            >
              ▼
            </button>
          )}
          <span className="text-dark fw-bold text-uppercase d-flex align-items-center gap-1 small flex-shrink-0">
            <span>🤖</span>
            <span>APP LOGS</span>
          </span>

          {/* Sélecteur PNJ actif + bouton Filtré collé à droite (uniquement si déplié) */}
          <div className="input-group input-group-sm w-auto flex-nowrap align-items-center">
            <select
              className={`form-select form-select-sm py-0 px-2 bg-transparent text-dark border-secondary border-opacity-50 small w-auto flex-shrink-0 ${
                visible ? 'rounded-end-0' : ''
              }`}
              style={{ fontSize: '11px', height: '22px' }}
              value={activeWalkerId}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                useSceneStore.getState().setActiveWalkerId(e.target.value);
              }}
              title="Changer le PNJ sélectionné"
            >
              {CHARACTERS.map(c => (
                <option key={c.id} value={c.id} className="bg-light text-dark">
                  {npcLabel(c)}
                </option>
              ))}
            </select>

            {visible && (
              <button
                type="button"
                className={`btn btn-sm py-0 px-2 small rounded-start-0 border-start-0 ${
                  filterBubbleOnly
                    ? 'btn-dark text-white fw-bold shadow-sm'
                    : 'btn-outline-secondary text-dark bg-transparent border-opacity-50'
                }`}
                style={{ fontSize: '11px', height: '22px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterBubbleOnly(f => !f);
                }}
                title={
                  filterBubbleOnly
                    ? `Filtre actif : logs limités à ${activeChar?.name ?? activeWalkerId} (cliquer pour afficher tous les logs)`
                    : `Filtrer les logs pour ${activeChar?.name ?? activeWalkerId}`
                }
              >
                {filterBubbleOnly ? '✓ Filtré' : 'Filtrer'}
              </button>
            )}
          </div>

          {!visible && (
            <span className="text-secondary small ps-1" style={{ fontSize: '10px' }}>
              ▲ [B]
            </span>
          )}
        </div>

        {visible && (
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Bouton Pause / Reprendre */}
            <button
              type="button"
              className={`btn btn-sm py-0 px-2 small ${
                isPaused
                  ? 'btn-warning text-dark fw-bold shadow-sm'
                  : 'btn-outline-secondary text-secondary border-opacity-50'
              }`}
              style={{ fontSize: '11px', height: '22px' }}
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(p => !p);
              }}
            >
              {isPaused ? '▶ REPRENDRE' : '⏸ PAUSE'}
            </button>
          </div>
        )}
      </div>

      {/* Zone des logs */}
      {visible && (
        <div
          ref={logAreaRef}
          className="card-body p-0 flex-grow-1 overflow-auto px-2 py-1 d-flex flex-column gap-1 user-select-text bg-transparent"
          style={{ minHeight: 0 }}
        >
          {displayedLogs.length === 0 && (
            <div className="text-muted fst-italic py-1">
              {filterBubbleOnly
                ? `Aucun log pour ${activeChar?.name ?? activeWalkerId}…`
                : 'En attente de logs…'}
            </div>
          )}
          {displayedLogs.map((entry, idx) => {
            const color = getTagColor(entry.tag);
            const isLast = idx === displayedLogs.length - 1;
            return (
              <div
                key={`${entry.id}_${idx}`}
                className={`d-flex align-items-baseline gap-2 px-1 py-0.5 rounded-1 text-break lh-sm flex-shrink-0 ${
                  isLast ? 'bg-white bg-opacity-50 border-start border-primary border-2 ps-1 shadow-sm' : ''
                }`}
              >
                <span
                  className="font-monospace flex-shrink-0 user-select-none text-muted small"
                  style={{ fontSize: '10px' }}
                >
                  {formatTime(entry.timestamp)}
                </span>
                {(!filterBubbleOnly || entry.tag.toLowerCase() !== activeWalkerId.toLowerCase()) && (
                  <span
                    className="badge py-0 px-1 font-monospace flex-shrink-0"
                    style={{
                      backgroundColor: `${color}18`,
                      color: color,
                      border: `1px solid ${color}40`,
                      fontSize: '10px',
                    }}
                  >
                    {(() => {
                      if (entry.tag.toLowerCase() === 'system') return '⚙️ sys';
                      const ch = findCharacter(entry.tag);
                      return ch ? `${ch.emoji} ${entry.tag}` : entry.tag;
                    })()}
                  </span>
                )}
                <span className="flex-grow-1 text-dark fw-normal">{entry.message}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Barre de redimensionnement manuelle (bord supérieur complet) */}
      {visible && (
        <div
          onPointerDown={handleResizePointerDown}
          title="Redimensionner la hauteur de la console (Glisser vers le haut/bas)"
          className="position-absolute top-0 start-0 end-0 d-flex align-items-center justify-content-center user-select-none"
          style={{
            height: 8,
            cursor: 'ns-resize',
            zIndex: 10,
            touchAction: 'none',
          }}
        >
          <div
            className="rounded-pill bg-secondary bg-opacity-50"
            style={{
              width: 36,
              height: 3,
            }}
          />
        </div>
      )}
    </div>
  );
}
