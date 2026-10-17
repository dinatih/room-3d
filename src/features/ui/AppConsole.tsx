/**
 * AppConsole.tsx — Console de debug fixée en bas à droite de l'écran.
 * Affiche les logs applicatifs avec horodatage, couleurs par tag et filtre Bulle Think.
 *
 * Utilise le composant Group (glass-card accordion) pour l'harmonie visuelle
 * avec les autres composants (Minimap, DevTools).
 */
import { useState, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { CHARACTERS, findCharacter } from '@features/scene/characterConfig';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { TOOLBAR_CLASS, TOOLBAR_BUTTON_CLASS } from '@features/scene/toolbarStyles';
import { Minimap } from '@features/scene/Minimap';
import { DevToolsGroups } from '@features/scene/DevToolsOverlay';
import { useAppIdle } from '@features/scene/idleState';
import { ProfileButton } from '@features/scene/ProfileButton';
import { PresetButton } from '@features/scene/PresetButton';

// ── Palette de couleurs par tag ────────────────────────────────────────────
const TAG_COLORS: Record<string, string> = {
  system: '#4b5563',
  perf:   '#d97706',
  download: '#0284c7',
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

function getContrastTextColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1f2937' : '#ffffff';
}

/** Identifiants techniques (anim, slot, objet…) : snake_case, kebab-case, camelCase ou texte entre guillemets. */
const IDENTIFIER_REGEX = /("[^"]+"|\b[A-Za-z0-9]+(?:[_-][A-Za-z0-9]+)+\b|\b[a-z]+(?:[A-Z][a-z0-9]+)+\b)/g;

/** Chaque identifiant est sélectionné en entier d'un seul clic (`user-select-all`). */
function renderMessage(message: string): ReactNode[] {
  return message.split(IDENTIFIER_REGEX).map((part, i) =>
    i % 2 === 1
      ? <span key={i} className="user-select-all font-monospace bg-body-secondary rounded px-1">{part}</span>
      : part
  );
}

/** État des panneaux partageable dans la query string, y compris les URL avec hash. */
function useUrlPanelToggle(key: 'minimap' | 'perfGraph') {
  const [visible, setVisible] = useState(() => {
    const { search, hash } = window.location;
    const query = search || (hash.includes('?') ? hash.slice(hash.indexOf('?')) : '');
    const value = new URLSearchParams(query).get(key);
    return value === '1' || value === 'true';
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    const hashQuery = !url.search && url.hash.includes('?');
    const separator = url.hash.indexOf('?');
    const params = hashQuery
      ? new URLSearchParams(url.hash.slice(separator + 1))
      : url.searchParams;
    if (!visible && !params.has(key)) return;
    params.set(key, visible ? '1' : '0');
    if (hashQuery) url.hash = `${url.hash.slice(0, separator)}?${params}`;
    window.history.replaceState(window.history.state, '', url);
  }, [key, visible]);

  return [visible, setVisible] as const;
}

// ── Composant ──────────────────────────────────────────────────────────────
export function AppConsole({
  hidden = false,
  hideUI = false,
  onToggleHideUI,
  actionsMenu,
}: {
  hidden?: boolean;
  hideUI?: boolean;
  onToggleHideUI?: () => void;
  actionsMenu?: ReactNode;
}) {
  const isMobile = useIsMobile();
  const activeCharacterId = useSceneStore(state => state.activeCharacterId);
  const activeChar = findCharacter(activeCharacterId);
  const isIdle = useAppIdle();

  const [logs, setLogs] = useState<AppLogEntry[]>(() => [...APP_LOG_HISTORY]);
  const [open, setOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [filterBubbleOnly, setFilterBubbleOnly] = useState(false);
  const [_cycleStep, setCycleStep] = useState(0); // 0=fermé, 1=ouvert, 2=ouvert+filtré
  const logAreaRef = useRef<HTMLDivElement>(null);
  const [bottomDockHeight, setBottomDockHeight] = useState(0);
  const [bottomDockWidth, setBottomDockWidth] = useState<number | null>(null);
  const [bottomDockRight, setBottomDockRight] = useState<number | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showMinimap, setShowMinimap] = useUrlPanelToggle('minimap');
  const [showPerf, setShowPerf] = useUrlPanelToggle('perfGraph');

  useEffect(() => {
    const onToggleMinimap = () => setShowMinimap(v => !v);
    const onTogglePerf = () => setShowPerf(v => !v);
    document.addEventListener('toggle-minimap', onToggleMinimap);
    document.addEventListener('toggle-perf', onTogglePerf);
    return () => {
      document.removeEventListener('toggle-minimap', onToggleMinimap);
      document.removeEventListener('toggle-perf', onTogglePerf);
    };
  }, []);

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
    setLogs([...APP_LOG_HISTORY]);
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
          setIsMaximized(next === 1 || next === 2);
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

  // Réserver l'espace et aligner les dimensions/espacements sur le menu principal du bas.
  useLayoutEffect(() => {
    if (hidden) return;
    const updateBottomDockDims = () => {
      const bottomBar = document.querySelector<HTMLElement>('.view-control-bar-dock .view-control-bar')
        ?? document.querySelector<HTMLElement>('.view-control-bar-dock');
      if (bottomBar) {
        const rect = bottomBar.getBoundingClientRect();
        if (rect.width > 0) {
          setBottomDockWidth(Math.round(rect.width));
        }
        if (rect.right > 0) {
          setBottomDockRight(Math.round(window.innerWidth - rect.right));
        }
        setBottomDockHeight(Math.max(0, window.innerHeight - rect.top));
      }
    };
    const targetElements = Array.from(document.querySelectorAll<HTMLElement>('.view-control-bar-dock, .view-control-bar-dock .view-control-bar'));
    const observer = new ResizeObserver(updateBottomDockDims);
    targetElements.forEach(el => observer.observe(el));
    window.addEventListener('resize', updateBottomDockDims);
    updateBottomDockDims();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateBottomDockDims);
    };
  }, [hidden, isMobile]);

  if (hidden) return null;

  const availableHeight = `calc(100dvh - ${bottomDockHeight}px - ${isMobile ? 'env(safe-area-inset-top) - 16px' : '32px'})`;
  const panelWidth = bottomDockWidth ?? (isMobile ? 260 : 280);
  const dockRightOffset = bottomDockRight ?? (isMobile ? 8 : 12);
  const pnjColor = activeChar?.color ?? '#6c757d';

  const handleToggle = () => {
    setOpen(prev => {
      const next = !prev;
      if (!next) {
        setCycleStep(0);
        setFilterBubbleOnly(false);
        setIsMaximized(false);
      } else {
        setCycleStep(filterBubbleOnly ? 2 : 1);
        setIsMaximized(true);
      }
      return next;
    });
  };

  const handleResizeCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open) {
      setOpen(true);
      setIsMaximized(true);
      setCycleStep(1);
    } else if (!isMaximized) {
      setIsMaximized(true);
    } else {
      setOpen(false);
      setIsMaximized(false);
      setFilterBubbleOnly(false);
      setCycleStep(0);
    }
  };

  return (
    <div
      className={`app-console position-fixed ui-panel-top d-flex flex-column align-items-end gap-1 ${hideUI ? 'ui-hidden' : ''}`}
      style={{
        top: isMobile ? 'calc(env(safe-area-inset-top) + 8px)' : 12,
        right: dockRightOffset,
        left: open ? (isMobile ? 8 : 288) : 'auto',
        maxHeight: availableHeight,
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      <div
        className={`${TOOLBAR_CLASS} ${open ? 'w-100 flex-column align-items-stretch overflow-hidden' : ''}`}
        style={{
          pointerEvents: 'auto',
          ...(open ? { height: isMaximized ? availableHeight : '140px', flexShrink: 0 } : {}),
        }}
        role="region"
        aria-label="Console applicative"
      >
        <div
          className="d-flex flex-nowrap align-items-center justify-content-between gap-1 flex-shrink-0 user-select-none"
          style={{ cursor: 'pointer' }}
          onClick={handleToggle}
          title={open ? 'Fermer la console (B)' : 'Ouvrir la console (B)'}
        >
          <button
            type="button"
            className={`${TOOLBAR_BUTTON_CLASS} ${open ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            title={open ? 'Fermer la console (B)' : 'Ouvrir la console (B)'}
            aria-expanded={open}
          >
            <i className="bi bi-terminal" aria-hidden="true" />
            <span>Console</span>
          </button>

          <div className="d-flex align-items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {open && (
              <>
                <button
                  type="button"
                  className={`${TOOLBAR_BUTTON_CLASS} ${filterBubbleOnly ? 'shadow-sm' : 'btn-outline-secondary'}`}
                  style={
                    filterBubbleOnly
                      ? { backgroundColor: pnjColor, borderColor: pnjColor, color: getContrastTextColor(pnjColor) }
                      : pnjColor
                        ? { borderColor: pnjColor, color: pnjColor }
                        : undefined
                  }
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

                <button
                  type="button"
                  className={`${TOOLBAR_BUTTON_CLASS} ${isPaused ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
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
              </>
            )}

            <button
              type="button"
              className={`${TOOLBAR_BUTTON_CLASS} btn-outline-secondary`}
              onClick={handleResizeCycle}
              title={
                !open
                  ? 'Ouvrir la console (taille normale)'
                  : isMaximized
                    ? 'Fermer la console'
                    : 'Agrandir la console en grand'
              }
              aria-label={
                !open
                  ? 'Ouvrir la console'
                  : isMaximized
                    ? 'Fermer la console'
                    : 'Agrandir la console en grand'
              }
            >
              {isMaximized ? '▼' : '▲'}
            </button>
          </div>
        </div>

        {open && (
          <div
            ref={logAreaRef}
            className="overflow-auto px-1 pt-1 d-flex flex-column gap-1 user-select-text bg-transparent flex-grow-1 border-top border-light-subtle"
            style={{ minHeight: 0, fontSize: '11px' }}
          >
            {displayedLogs.length === 0 && (
              <div className="text-muted fst-italic py-1 px-1">
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
                  <span className="flex-grow-1 text-dark fw-normal">{renderMessage(entry.message)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Barre de contrôle sous la card Console - largeur minimale nécessaire */}
      <div
        className={`${TOOLBAR_CLASS} flex-shrink-0 align-self-end`}
        style={{
          pointerEvents: 'auto',
          width: 'fit-content',
        }}
        role="toolbar"
        aria-label="Contrôles secondaires"
      >
        {/* 1. Mon CV (en premier) */}
        <ProfileButton hideUI={hideUI} />

        {/* 2. Minimap */}
        <button
          type="button"
          className={`${TOOLBAR_BUTTON_CLASS} ${showMinimap ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
          onClick={() => setShowMinimap(v => !v)}
          title="Plan 2D (Touche M)"
          aria-expanded={showMinimap}
        >
          <i className="bi bi-map-fill" aria-hidden="true" />
        </button>

        {/* Indicateur de veille */}
        {isIdle && (
          <span
            className="badge text-warning-emphasis bg-warning-subtle border border-warning-subtle py-1 px-2 fw-semibold user-select-none d-flex align-items-center gap-1"
            title="Application en veille (rendu 3D suspendu)"
          >
            <i className="bi bi-moon-stars-fill" aria-hidden="true" />
            <span>En veille</span>
          </span>
        )}

        {/* 3 & 4. Groupe Perf + Preset */}
        <div className="btn-group btn-group-sm view-control-bar__group" role="group" aria-label="Performances et qualité graphique">
          <button
            type="button"
            className={`${TOOLBAR_BUTTON_CLASS} ${showPerf ? 'btn-danger text-white' : 'btn-outline-secondary'} border-end-0`}
            onClick={() => setShowPerf(v => !v)}
            title="Performances & Stats (Touche H)"
            aria-expanded={showPerf}
          >
            <i className="bi bi-bar-chart-fill" aria-hidden="true" />
          </button>
          <PresetButton hideUI={hideUI} />
        </div>

        {/* 5. + Chevrons (à la suite du btn Preset) */}
        {actionsMenu}

        {/* 6. Hide UI */}
        {onToggleHideUI && (
          <button
            type="button"
            className={`${TOOLBAR_BUTTON_CLASS} btn-outline-secondary`}
            onClick={onToggleHideUI}
            title={`${hideUI ? 'Afficher' : 'Masquer'} l'interface 2D (0)`}
            aria-label={`${hideUI ? 'Afficher' : 'Masquer'} l'interface 2D (0)`}
          >
            <i className={`bi ${hideUI ? 'bi-eye' : 'bi-eye-slash'}`} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Bodies de Minimap et Perf s'ouvrant l'un en dessous de l'autre */}
      {showMinimap && (
        <div
          className="glass-card shadow-lg rounded-2 p-1 align-self-end overflow-hidden"
          style={{
            pointerEvents: 'auto',
            width: `${panelWidth}px`,
            maxWidth: 'calc(100vw - 16px)',
          }}
        >
          <Minimap embedded showGroup={false} />
        </div>
      )}

      {showPerf && (
        <div
          className="glass-card shadow-lg rounded-2 p-1 align-self-end overflow-hidden"
          style={{
            pointerEvents: 'auto',
            width: isMobile ? 'fit-content' : `${panelWidth}px`,
            maxWidth: 'calc(100vw - 16px)',
          }}
        >
          <DevToolsGroups Group={({ children }: any) => <>{children}</>} compact headerless />
        </div>
      )}
    </div>
  );
}
