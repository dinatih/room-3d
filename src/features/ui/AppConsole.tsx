/**
 * AppConsole.tsx — Console de debug fixée en haut de l'écran (pleine largeur hors SidePanel).
 * Affiche les logs applicatifs avec horodatage, couleurs par tag et filtre Bulle Think.
 */
import { useState, useEffect, useRef } from 'react';
import { CHARACTERS, findCharacter, npcLabel } from '@features/scene/walkerConfig';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { useIsMobile } from '@shared/hooks/useIsMobile';

// ── Palette de couleurs par tag ────────────────────────────────────────────
const CHARACTER_ID_SET = new Set(CHARACTERS.map(c => c.id.toLowerCase()));

export function isSystemLog(tag: string): boolean {
  return !CHARACTER_ID_SET.has(tag.toLowerCase());
}

const TAG_COLORS: Record<string, string> = {
  system: '#ffffff',
  perf:   '#ffaa00',
  error:  '#ff0000',
  robin:  '#ff8833',
  ...Object.fromEntries(CHARACTERS.map(c => [c.id, c.color])),
};

function getTagColor(tag: string): string {
  const lower = tag.toLowerCase();
  if (TAG_COLORS[lower]) return TAG_COLORS[lower];
  if (isSystemLog(lower)) return '#58a6ff';
  return '#aaaaaa';
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

function getContrastTextColor(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? '#000000' : '#ffffff';
}

// ── Composant ──────────────────────────────────────────────────────────────
export function AppConsole({ hidden = false }: { hidden?: boolean }) {
  const isMobile = useIsMobile();
  const activeWalkerId = useSceneStore(state => state.activeWalkerId);
  const activeChar = findCharacter(activeWalkerId);
  const charColor = activeChar?.color ?? '#00ff88';
  const charContrastText = getContrastTextColor(charColor);
  const charDisplayName = `${activeChar?.emoji ? `${activeChar.emoji} ` : ''}${activeChar?.name ?? activeWalkerId}`;

  const [logs, setLogs] = useState<AppLogEntry[]>([]);
  const [visible, setVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [filterBubbleOnly, setFilterBubbleOnly] = useState(false);
  const [includeSystemLogs, setIncludeSystemLogs] = useState(true);
  const logAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const savedHeightRef = useRef(110);

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
  }, [logs, visible, isPaused, filterBubbleOnly, includeSystemLogs]);

  const displayedLogs = filterBubbleOnly
    ? logs.filter(entry => {
        const tag = entry.tag.toLowerCase();
        if (tag === activeWalkerId.toLowerCase()) return true;
        if (includeSystemLogs && isSystemLog(tag)) return true;
        return false;
      })
    : logs;

  // Redimensionnement vertical par drag
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startH = containerRef.current ? containerRef.current.offsetHeight : savedHeightRef.current;

    const onPointerMove = (ev: PointerEvent) => {
      const newH = Math.max(60, Math.min(window.innerHeight * 0.85, startH + (ev.clientY - startY)));
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
      className={`position-fixed top-0 end-0 font-monospace d-flex flex-column shadow-lg overflow-hidden ${
        visible ? 'border-start border-bottom border-white border-opacity-10' : ''
      }`}
      style={{
        left: visible ? (isMobile ? 0 : 280) : 'auto',
        height: visible ? `${savedHeightRef.current}px` : 'auto',
        minHeight: visible ? '60px' : 'auto',
        maxHeight: visible ? '85vh' : 'auto',
        zIndex: 9999,
        borderBottomLeftRadius: visible ? (isMobile ? '0' : '4px') : '4px',
        backgroundColor: 'rgba(13, 17, 23, 0.96)',
        boxShadow: visible ? '0 8px 24px rgba(0, 0, 0, 0.65)' : undefined,
        fontSize: '11px',
      }}
    >
      {/* Header */}
      <div
        className="d-flex align-items-center justify-content-between px-2 py-1 user-select-none border-bottom border-white border-opacity-10"
        style={{ cursor: visible ? 'default' : 'pointer', background: 'rgba(22, 27, 34, 0.98)' }}
        onClick={() => { if (!visible) setVisible(true); }}
        title={!visible ? 'Ouvrir la console App Logs (B)' : undefined}
      >
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {visible && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary py-0 px-1 border-opacity-50 lh-1 small text-white-50"
              onClick={(e) => {
                e.stopPropagation();
                setVisible(false);
              }}
              title="Masquer la console (B)"
            >
              ✕
            </button>
          )}
          <span className="text-success fw-bold text-uppercase d-flex align-items-center gap-1 small flex-shrink-0">
            <span>🤖</span>
            <span>APP LOGS</span>
          </span>

          {/* Sélecteur PNJ actif (visible en mode ouvert ET en mode replié) */}
          <select
            className="form-select form-select-sm py-0 px-1 bg-dark text-white border-secondary small w-auto flex-shrink-0"
            style={{ fontSize: '11px', height: '22px', borderColor: `${charColor}88` }}
            value={activeWalkerId}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              useSceneStore.getState().setActiveWalkerId(e.target.value);
            }}
            title="Changer le PNJ actif"
          >
            {CHARACTERS.map(c => (
              <option key={c.id} value={c.id} className="bg-dark text-light">
                {npcLabel(c)}
              </option>
            ))}
          </select>
        </div>

        {visible && (
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Bouton Filtre Personnage Actif */}
            <button
              type="button"
              className={`btn btn-sm py-0 px-2 small d-flex align-items-center gap-1 border ${
                filterBubbleOnly ? 'fw-bold shadow-sm' : ''
              }`}
              style={{
                backgroundColor: filterBubbleOnly ? charColor : 'rgba(255, 255, 255, 0.05)',
                borderColor: filterBubbleOnly ? charColor : `${charColor}88`,
                color: filterBubbleOnly ? charContrastText : charColor,
                boxShadow: filterBubbleOnly ? `0 0 8px ${charColor}66` : 'none',
                transition: 'all 0.15s ease',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setFilterBubbleOnly(f => !f);
              }}
              title={
                filterBubbleOnly
                  ? `Filtre actif : ${activeChar?.name ?? activeWalkerId} — Cliquer pour afficher tous les logs`
                  : `Afficher uniquement les logs de ${activeChar?.name ?? activeWalkerId}`
              }
            >
              <span>{charDisplayName}</span>
              <span
                className={`badge ${filterBubbleOnly ? 'bg-dark' : 'bg-secondary'} py-0 px-1`}
                style={{ fontSize: '9px', color: filterBubbleOnly ? charColor : '#ffffff' }}
              >
                {filterBubbleOnly ? 'FILTRÉ' : 'TOUS'}
              </span>
            </button>

            {/* Toggle Logs Système dans la liste filtrée */}
            <button
              type="button"
              className={`btn btn-sm py-0 px-2 small d-flex align-items-center gap-1 border ${
                includeSystemLogs
                  ? 'btn-info text-dark fw-bold shadow-sm'
                  : 'btn-outline-secondary text-white-50 border-white border-opacity-25'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setIncludeSystemLogs(s => !s);
              }}
              title={
                includeSystemLogs
                  ? 'Logs système affichés dans la liste filtrée — Cliquer pour masquer'
                  : 'Afficher aussi les logs système dans la liste filtrée PNJ'
              }
              style={{
                opacity: filterBubbleOnly ? 1 : 0.65,
              }}
            >
              <span>⚙️ Système</span>
              <span
                className={`badge ${includeSystemLogs ? 'bg-dark text-info' : 'bg-secondary text-white'} py-0 px-1`}
                style={{ fontSize: '9px' }}
              >
                {includeSystemLogs ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Bouton Pause / Reprendre */}
            <button
              type="button"
              className={`btn btn-sm py-0 px-2 small ${
                isPaused
                  ? 'btn-warning text-dark fw-bold border-0 shadow-sm'
                  : 'btn-outline-secondary text-white-50 border-white border-opacity-25'
              }`}
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
          className="flex-grow-1 overflow-y-auto px-2 py-1 d-flex flex-column gap-1 user-select-text"
          style={{ background: 'rgba(13, 17, 23, 0.96)', minHeight: 0 }}
        >
          {displayedLogs.length === 0 && (
            <div className="text-secondary fst-italic py-1">
              {filterBubbleOnly
                ? `Aucun log pour ${charDisplayName}${includeSystemLogs ? ' ou système' : ''}…`
                : 'En attente de logs…'}
            </div>
          )}
          {displayedLogs.map((entry, idx) => {
            const color = getTagColor(entry.tag);
            const isLast = idx === displayedLogs.length - 1;
            return (
              <div
                key={`${entry.id}_${idx}`}
                className={`d-flex align-items-baseline gap-2 px-1 py-0 rounded-1 text-break lh-sm flex-shrink-0 ${
                  isLast ? 'text-white fw-semibold bg-white bg-opacity-10' : 'text-light fw-medium'
                }`}
              >
                <span
                  className="font-monospace flex-shrink-0 user-select-none"
                  style={{ color }}
                >
                  {formatTime(entry.timestamp)}
                </span>
                {(!filterBubbleOnly || entry.tag.toLowerCase() !== activeWalkerId.toLowerCase()) && (
                  <span className="fw-semibold flex-shrink-0" style={{ color }}>
                    {(() => {
                      const lower = entry.tag.toLowerCase();
                      if (lower === 'system') return '⚙️ system';
                      if (lower === 'perf') return '⚡ perf';
                      if (lower === 'anim') return '✨ anim';
                      if (lower === 'robin') return '🐦 robin';
                      const ch = findCharacter(entry.tag);
                      return ch ? `${ch.emoji} ${entry.tag}` : `⚙️ ${entry.tag}`;
                    })()}
                  </span>
                )}
                <span className="flex-grow-1">{entry.message}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Poignée de redimensionnement manuelle (bas-gauche) */}
      {visible && (
        <div
          onPointerDown={handleResizePointerDown}
          title="Redimensionner la console (Glisser)"
          className="position-absolute bottom-0 start-0 d-flex align-items-end justify-content-start p-1 text-success opacity-75 user-select-none"
          style={{
            width: 22,
            height: 22,
            cursor: 'ns-resize',
            zIndex: 10,
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
