/**
 * AppConsole.tsx — Console de debug fixée en bas à droite de l'écran.
 * Affiche les logs applicatifs avec horodatage, couleurs par tag et filtre Bulle Think.
 *
 * Utilise le composant Group (glass-card accordion) pour l'harmonie visuelle
 * avec les autres panneaux (SidePanel, Minimap, DevTools).
 */
import { useState, useEffect, useRef } from 'react';
import { CHARACTERS, findCharacter, npcLabel } from '@features/scene/walkerConfig';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { Group } from '@features/scene/sidepanel/Group';

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
export function AppConsole({ hidden = false, hideUI = false }: { hidden?: boolean; hideUI?: boolean }) {
  const isMobile = useIsMobile();
  const activeWalkerId = useSceneStore(state => state.activeWalkerId);
  const activeChar = findCharacter(activeWalkerId);

  const [logs, setLogs] = useState<AppLogEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [filterBubbleOnly, setFilterBubbleOnly] = useState(false);
  const [_cycleStep, setCycleStep] = useState(0); // 0=fermé, 1=ouvert, 2=ouvert+filtré
  const logAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [savedHeight, setSavedHeight] = useState(180);

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

  // Auto-scroll du panneau de logs si non en pause
  useEffect(() => {
    if (!isPaused && logAreaRef.current) {
      logAreaRef.current.scrollTop = logAreaRef.current.scrollHeight;
    }
  }, [logs, isPaused, filterBubbleOnly]);

  // Raccourci clavier 'B' : cycle ouvert → filtré → fermé
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return;
      if (e.key === 'b' || e.key === 'B') {
        setCycleStep(prev => {
          const next = (prev + 1) % 3;
          setOpen(next === 1 || next === 2);
          setFilterBubbleOnly(next === 2);
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const displayedLogs = filterBubbleOnly
    ? logs.filter(entry => {
        const activeId = activeWalkerId.toLowerCase();
        if (entry.tag.toLowerCase() === 'system') return true;
        const tagParts = entry.tag.toLowerCase().split('+').map(s => s.trim());
        return tagParts.some(t => t === activeId);
      })
    : logs;

  // Redimensionnement vertical par drag (vers le haut car fixé en bas)
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startH = containerRef.current?.offsetHeight ?? savedHeight;

    const onPointerMove = (ev: PointerEvent) => {
      const maxAllowed = isMobile ? window.innerHeight * 0.5 : window.innerHeight * 0.75;
      const newH = Math.max(60, Math.min(maxAllowed, startH - (ev.clientY - startY)));
      setSavedHeight(newH);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  if (hidden) return null;

  const pnjColor = activeChar?.color ?? '#6c757d';

  const consoleControls = (
    <div className="d-flex align-items-center gap-1">
      <div className="input-group input-group-sm flex-nowrap" style={{ height: '22px', width: 'auto' }}>
        <select
          className="form-select form-select-sm py-0 px-2 bg-transparent small flex-shrink-0 app-console-select"
          style={{ fontSize: '11px', color: '#212529', borderColor: pnjColor, ['--pnj-color' as string]: pnjColor }}
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

        {open && (
          <button
            type="button"
            className="btn btn-sm py-0 px-2 small"
            style={{ fontSize: '11px', borderColor: pnjColor, color: pnjColor, borderWidth: '1.5px' }}
            onClick={(e) => {
              e.stopPropagation();
              setFilterBubbleOnly(f => {
                setCycleStep(f ? 1 : 2);
                return !f;
              });
            }}
            title={
              filterBubbleOnly
                ? `Filtre actif : logs limités à ${activeChar?.name ?? activeWalkerId}`
                : `Filtrer les logs pour ${activeChar?.name ?? activeWalkerId}`
            }
          >
            {filterBubbleOnly ? '✓ Filtré' : 'Filtrer'}
          </button>
        )}
      </div>

      {open && (
        <button
          type="button"
          className="btn py-0 px-2 small flex-shrink-0"
          style={{
            fontSize: '11px',
            height: '22px',
            ...(isPaused
              ? { backgroundColor: '#ffc107', color: '#212529', fontWeight: 700, boxShadow: '0 1px 2px rgba(0,0,0,.15)', border: 'none' }
              : { backgroundColor: 'transparent', color: '#6c757d', border: '1px solid rgba(108,117,125,.5)' }),
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsPaused(p => !p);
          }}
        >
          {isPaused ? '▶ REP.' : '⏸ PAUSE'}
        </button>
      )}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`app-console position-fixed ui-panel-bottom d-flex flex-column overflow-hidden ${hideUI ? 'ui-hidden' : ''}`}
      style={{
        bottom: isMobile ? 'calc(3.75rem + env(safe-area-inset-bottom) + 8px)' : 16,
        right: isMobile ? 8 : 16,
        left: open ? (isMobile ? 8 : 288) : 'auto',
        width: open ? undefined : 'auto',
        height: open ? `${savedHeight}px` : 'auto',
        maxHeight: isMobile ? '50vh' : '75vh',
        zIndex: 100,
        fontSize: '11px',
        pointerEvents: hideUI ? 'none' : undefined,
      }}
    >
      <Group
        emoji="🤖"
        title="App Logs"
        open={open}
        extra={consoleControls}
        headerPadding="py-1 px-2"
        className="flex-grow-1"
        onToggle={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setCycleStep(0);
            setFilterBubbleOnly(false);
          } else {
            setCycleStep(filterBubbleOnly ? 2 : 1);
          }
        }}
      >
        {/* Barre de redimensionnement */}
        <div
          onPointerDown={handleResizePointerDown}
          title="Redimensionner la hauteur de la console"
          className="d-flex align-items-center justify-content-center user-select-none flex-shrink-0"
          style={{ height: 8, cursor: 'ns-resize', touchAction: 'none' }}
        >
          <div
            className="rounded-pill bg-secondary bg-opacity-50"
            style={{ width: 36, height: 3 }}
          />
        </div>

        {/* Liste des logs */}
        <div
          ref={logAreaRef}
          className="overflow-auto px-2 py-1 d-flex flex-column gap-1 user-select-text bg-transparent flex-grow-1"
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
            const isLast = idx === displayedLogs.length - 1;
            const tagParts = entry.tag.split('+').map(s => s.trim());
            const isSoloActiveTag = filterBubbleOnly && tagParts.length === 1 && tagParts[0].toLowerCase() === activeWalkerId.toLowerCase();
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
                {!isSoloActiveTag && (
                  <span className="d-inline-flex align-items-center gap-0.5 flex-shrink-0">
                    {entry.tag.toLowerCase() === 'system' ? (
                      <span
                        className="badge py-0 px-1 font-monospace"
                        style={{ backgroundColor: `${getTagColor('system')}18`, color: getTagColor('system'), border: `1px solid ${getTagColor('system')}40`, fontSize: '10px' }}
                      >
                        ⚙️ sys
                      </span>
                    ) : tagParts.map((part, i) => {
                      const ch = findCharacter(part);
                      const partColor = ch?.color ?? getTagColor(part);
                      return (
                        <span key={i}>
                          {i > 0 && <span className="text-muted mx-0.5" style={{ fontSize: '8px' }}>+</span>}
                          <span
                            className="badge py-0 px-1 font-monospace"
                            style={{ backgroundColor: `${partColor}18`, color: partColor, border: `1px solid ${partColor}40`, fontSize: '10px' }}
                          >
                            {ch ? `${ch.emoji} ${ch.name}` : part}
                          </span>
                        </span>
                      );
                    })}
                  </span>
                )}
                <span className="flex-grow-1 text-dark fw-normal">{entry.message}</span>
              </div>
            );
          })}
        </div>
      </Group>
    </div>
  );
}