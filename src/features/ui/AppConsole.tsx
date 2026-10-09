/**
 * AppConsole.tsx — Console de debug fixée en bas à droite de l'écran.
 * Affiche les logs applicatifs avec horodatage, couleurs par tag et filtre Bulle Think.
 *
 * Utilise le composant Group (glass-card accordion) pour l'harmonie visuelle
 * avec les autres panneaux (SidePanel, Minimap, DevTools).
 */
import { useState, useEffect, useLayoutEffect, useRef, useId } from 'react';
import { CHARACTERS, findCharacter, npcLabel } from '@features/scene/characterConfig';
import { chooseRandomCharacter } from '@features/scene/store/randomCharacter';
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
const MAX_LOGS = 10_000;

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
  const activeCharacterId = useSceneStore(state => state.activeCharacterId);
  const activeChar = findCharacter(activeCharacterId);

  const [logs, setLogs] = useState<AppLogEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [filterBubbleOnly, setFilterBubbleOnly] = useState(false);
  const [_cycleStep, setCycleStep] = useState(0); // 0=fermé, 1=ouvert, 2=ouvert+filtré
  const logAreaRef = useRef<HTMLDivElement>(null);
  const [bottomDockHeight, setBottomDockHeight] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);
  const characterPopoverId = useId();
  const characterPopoverRef = useRef<HTMLDivElement>(null);
  const [characterPopoverOpen, setCharacterPopoverOpen] = useState(false);

  useEffect(() => {
    const popover = characterPopoverRef.current;
    if (!popover) return;
    const onToggle = () => {
      const isOpen = popover.matches(':popover-open');
      setCharacterPopoverOpen(isOpen);
      if (isOpen) popover.querySelector<HTMLButtonElement>('[aria-pressed="true"]')!.focus();
    };
    const closePopover = () => popover.hidePopover();
    popover.addEventListener('toggle', onToggle);
    window.addEventListener('resize', closePopover);
    return () => {
      popover.removeEventListener('toggle', onToggle);
      window.removeEventListener('resize', closePopover);
    };
  }, [hidden]);

  useEffect(() => {
    if (hidden || hideUI) {
      characterPopoverRef.current?.hidePopover();
      setCharacterPopoverOpen(false);
    }
  }, [hidden, hideUI]);

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
      if (e.altKey || e.ctrlKey || e.metaKey) return;
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
        const activeId = activeCharacterId.toLowerCase();
        if (entry.tag.toLowerCase() === 'system') return true;
        const tagParts = entry.tag.toLowerCase().split('+').map(s => s.trim());
        return tagParts.some(t => t === activeId);
      })
    : logs;

  // Réserver l'espace occupé par les commandes et le menu du bas.
  useLayoutEffect(() => {
    if (hidden) return;
    const docks = Array.from(document.querySelectorAll<HTMLElement>('.view-control-bar-dock'));
    const updateBottomDockHeight = () => {
      const dockTop = Math.min(window.innerHeight, ...docks.map(dock => dock.getBoundingClientRect().top));
      setBottomDockHeight(window.innerHeight - dockTop);
    };
    const observer = new ResizeObserver(updateBottomDockHeight);
    docks.forEach(dock => observer.observe(dock));
    window.addEventListener('resize', updateBottomDockHeight);
    updateBottomDockHeight();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateBottomDockHeight);
    };
  }, [hidden, isMobile]);

  if (hidden) return null;

  const availableHeight = `calc(100dvh - ${bottomDockHeight}px - ${isMobile ? 'env(safe-area-inset-top) - 16px' : '32px'})`;
  const pnjColor = activeChar?.color ?? '#6c757d';

  const consoleControls = (
    <div className="d-flex align-items-center gap-1">
      <button
        type="button"
        className="btn btn-sm border-0 py-0 px-1 lh-1 text-muted"
        onClick={(e) => {
          e.stopPropagation();
          setIsMaximized(m => {
            if (!m) setOpen(true); // ouvrir la card si repliée
            return !m;
          });
        }}
        title={isMaximized ? 'Réduire la console' : 'Agrandir la console'}
        style={{ fontSize: '11px' }}
      >
        {isMaximized ? '▲' : '▼'}
      </button>
      <div className="input-group input-group-sm flex-nowrap" style={{ height: '22px', width: 'auto' }}>
        <button
          type="button"
          className="btn btn-sm btn-warning text-dark p-0 px-1 border-0 flex-shrink-0"
          style={{ height: '22px', lineHeight: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            chooseRandomCharacter();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          title="Choisir un PNJ aléatoire parmi les personnages visibles (S)"
          aria-label="Choisir un PNJ aléatoire"
        >
          <i className="bi bi-shuffle" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary py-0 px-2 d-flex align-items-center gap-2 flex-shrink-0 app-console-character-trigger"
          style={{ borderColor: pnjColor, ['--pnj-color' as string]: pnjColor }}
          {...{ popovertarget: characterPopoverId }}
          aria-haspopup="dialog"
          aria-expanded={characterPopoverOpen}
          aria-controls={characterPopoverId}
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const popover = characterPopoverRef.current!;
            popover.style.top = `${rect.bottom + 8}px`;
            popover.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`;
            popover.style.maxHeight = `${window.innerHeight - rect.bottom - 16}px`;
          }}
          onPointerDown={(e) => e.stopPropagation()}
          title="Changer le PNJ sélectionné"
        >
          <span>{activeChar ? npcLabel(activeChar) : activeCharacterId}</span>
          <i className="bi bi-chevron-down" aria-hidden="true" />
        </button>

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
                ? `Filtre actif : logs limités à ${activeChar?.name ?? activeCharacterId}`
                : `Filtrer les logs pour ${activeChar?.name ?? activeCharacterId}`
            }
          >
            {filterBubbleOnly ? '✓ Filtré' : 'Filtrer'}
          </button>
        )}
      </div>

      {open && (
        <button
          type="button"
          className={`btn py-0 px-2 small flex-shrink-0 ${isPaused ? 'btn-warning text-dark fw-bold shadow-sm border-0' : ''}`}
          style={{
            fontSize: '11px',
            height: '22px',
            ...(!isPaused
              ? { backgroundColor: 'transparent', color: '#6c757d', border: '1px solid rgba(108,117,125,.5)' }
              : {}),
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsPaused(p => !p);
          }}
          title={isPaused ? 'Reprendre le défilement' : 'Mettre le défilement en pause'}
          aria-label={isPaused ? 'Reprendre le défilement' : 'Mettre le défilement en pause'}
          aria-pressed={isPaused}
        >
          <i className={`bi ${isPaused ? 'bi-play-fill' : 'bi-pause-fill'}`} aria-hidden="true" />
        </button>
      )}
    </div>
  );

  return (
    <div
      className={`app-console position-fixed ui-panel-top d-flex flex-column overflow-hidden ${hideUI ? 'ui-hidden' : ''}`}
      style={{
        top: isMobile ? 'calc(env(safe-area-inset-top) + 8px)' : 16,
        right: isMobile ? 8 : 16,
        left: open ? (isMobile ? 8 : 288) : 'auto',
        height: open ? (isMaximized ? availableHeight : '140px') : 'auto',
        maxHeight: availableHeight,
        zIndex: 100,
        fontSize: '11px',
        pointerEvents: hideUI ? 'none' : undefined,
      }}
    >
      <Group
        icon={<i className="bi bi-terminal" aria-hidden="true" />}
        title="Console"
        open={open}
        extra={consoleControls}
        className="flex-grow-1"
        onToggle={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setCycleStep(0);
            setFilterBubbleOnly(false);
            setIsMaximized(false);
          } else {
            setCycleStep(filterBubbleOnly ? 2 : 1);
          }
        }}
      >
        {/* Liste des logs */}
        <div
          ref={logAreaRef}
          className="overflow-auto px-2 py-1 d-flex flex-column gap-1 user-select-text bg-transparent flex-grow-1"
          style={{ minHeight: 0 }}
        >
          {displayedLogs.length === 0 && (
            <div className="text-muted fst-italic py-1">
              {filterBubbleOnly
                ? `Aucun log pour ${activeChar?.name ?? activeCharacterId}…`
                : 'En attente de logs…'}
            </div>
          )}
          {displayedLogs.map((entry, idx) => {
            const tagParts = entry.tag.split('+').map(s => s.trim());
            const isSoloActiveTag = filterBubbleOnly && tagParts.length === 1 && tagParts[0].toLowerCase() === activeCharacterId.toLowerCase();
            return (
              <div
                key={`${entry.id}_${idx}`}
                className="d-flex align-items-baseline gap-2 px-1 py-0.5 text-break lh-sm flex-shrink-0"
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
                        <><i className="bi bi-gear-fill me-1" aria-hidden="true" />sys</>
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
      <div
        ref={characterPopoverRef}
        id={characterPopoverId}
        {...{ popover: 'auto' }}
        role="dialog"
        aria-labelledby={`${characterPopoverId}-title`}
        className="popover app-console-character-popover glass-card shadow-lg"
        onClick={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        <h2 id={`${characterPopoverId}-title`} className="popover-header bg-transparent small fw-semibold d-flex align-items-center gap-2">
          <i className="bi bi-people" aria-hidden="true" />
          Choisir un PNJ
        </h2>
        <div className="popover-body p-2">
          <div className="row row-cols-2 g-1">
            {CHARACTERS.map(c => (
              <div key={c.id} className="col">
                <button
                  type="button"
                  className={`btn btn-sm w-100 d-flex align-items-center justify-content-between gap-1 text-start ${c.id === activeCharacterId ? 'btn-primary' : 'btn-light'}`}
                  aria-pressed={c.id === activeCharacterId}
                  onClick={() => {
                    useSceneStore.getState().setActiveCharacterId(c.id);
                    characterPopoverRef.current!.hidePopover();
                  }}
                >
                  <span>{npcLabel(c)}</span>
                  {c.id === activeCharacterId && <i className="bi bi-check-lg" aria-hidden="true" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
