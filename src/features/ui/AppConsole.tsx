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
import { getDebugPreset } from '@features/scene/store/debugPresets';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { TOOLBAR_CLASS, TOOLBAR_BUTTON_CLASS } from '@features/scene/toolbarStyles';
import { Minimap } from '@features/scene/Minimap';
import { LaraLifePanel } from '@features/scene/sidepanel/sections/LaraLifePanel';
import { useLaraLifeStore } from '@features/scene/ai/laraLifeStore';
import { LIFE_CHARACTER_IDS } from '@features/scene/ai/laraLife';
import { DevToolsGroups } from '@features/scene/DevToolsOverlay';
import { useAppIdle } from '@features/scene/idleState';
import { ProfileButton } from '@features/scene/ProfileButton';
import { PresetButton } from '@features/scene/PresetButton';
import { devLog } from '@/devLog';

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
export type AppLogCategory = 'anim' | 'duo' | 'nav' | 'object' | 'system' | 'perf' | 'download';

export interface AppLogAnimationRef {
  id: string;
  mode?: 'solo' | 'duo';
  label?: string;
  actorId?: string;
  partnerId?: string;
}

export interface AppLogObjectRef {
  id: string;
  inventoryId?: string;
  label?: string;
  slotId?: string;
}

export interface AppLogMetadata {
  category?: AppLogCategory;
  action?: string;
  reason?: string;
  actors?: string[];
  animation?: AppLogAnimationRef;
  object?: AppLogObjectRef;
}

export interface AppLogEntry {
  id: number;
  tag: string;
  message: string;
  timestamp: number;
  category: AppLogCategory;
  action?: string;
  reason?: string;
  actors: string[];
  animation?: AppLogAnimationRef;
  object?: AppLogObjectRef;
}

export type OpenInventoryTargetDetail =
  | { type: 'animation'; animation: AppLogAnimationRef }
  | { type: 'object'; object: AppLogObjectRef };

let _pendingInventoryTarget: OpenInventoryTargetDetail | null = null;

export function consumePendingInventoryTarget(): OpenInventoryTargetDetail | null {
  const target = _pendingInventoryTarget;
  _pendingInventoryTarget = null;
  return target;
}

export function peekPendingInventoryTarget(): OpenInventoryTargetDetail | null {
  return _pendingInventoryTarget;
}

export function openInventoryTarget(detail: OpenInventoryTargetDetail): void {
  _pendingInventoryTarget = detail;
  document.dispatchEvent(new CustomEvent<OpenInventoryTargetDetail>('open-inventory-target', { detail }));
}

const LOG_CATEGORY_LABELS: Record<AppLogCategory, string> = {
  anim: '🎬 Anim',
  duo: '👯 Duo',
  nav: '🧭 Nav',
  object: '🪑 Objet',
  system: '⚙️ Système',
  perf: '⚡ Perf',
  download: '📥 Réseau',
};

let _logCounter = 0;
export const APP_LOG_HISTORY: AppLogEntry[] = [];
const MAX_LOGS = 10_000;

function inferLogCategory(tag: string, meta?: AppLogMetadata): AppLogCategory {
  if (meta?.category) return meta.category;
  if (meta?.animation) return meta.animation.mode === 'duo' ? 'duo' : 'anim';
  if (meta?.object) return 'object';
  const lower = tag.toLowerCase();
  if (lower === 'perf') return 'perf';
  if (lower === 'download') return 'download';
  if (lower === 'anim') return 'anim';
  if (lower === 'system') return 'system';
  if (lower.includes('+')) return 'duo';
  return 'nav';
}

export const appLog = (tag: string, message: string, meta?: AppLogMetadata): void => {
  const actors = meta?.actors ?? tag
    .split('+')
    .map(s => s.trim())
    .filter(s => Boolean(findCharacter(s)));
  const entry: AppLogEntry = {
    id: ++_logCounter,
    tag,
    message,
    timestamp: Date.now(),
    category: inferLogCategory(tag, meta),
    action: meta?.action,
    reason: meta?.reason,
    actors,
    animation: meta?.animation,
    object: meta?.object,
  };
  APP_LOG_HISTORY.push(entry);
  devLog(entry);
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

/** État des panneaux partageable dans la query string, y compris les URL avec hash. */
function useUrlPanelToggle(key: 'minimap' | 'laraLife' | 'perfGraph') {
  const [visible, setVisible] = useState(() => {
    const { search, hash } = window.location;
    const query = search || (hash.includes('?') ? hash.slice(hash.indexOf('?')) : '');
    const params = new URLSearchParams(query);
    const value = params.get(key) ?? (key === 'perfGraph' && getDebugPreset(params)?.perfGraph ? '1' : null);
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
  const [categoryFilter, setCategoryFilter] = useState<'' | AppLogCategory>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [_cycleStep, setCycleStep] = useState(0); // 0=fermé, 1=ouvert, 2=ouvert+filtré
  const logAreaRef = useRef<HTMLDivElement>(null);
  const [bottomDockHeight, setBottomDockHeight] = useState(0);
  const [bottomDockWidth, setBottomDockWidth] = useState<number | null>(null);
  const [bottomDockRight, setBottomDockRight] = useState<number | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showMinimap, setShowMinimap] = useUrlPanelToggle('minimap');
  const [showLife, setShowLife] = useUrlPanelToggle('laraLife');
  const [showPerf, setShowPerf] = useUrlPanelToggle('perfGraph');

  useEffect(() => {
    const onToggleMinimap = () => setShowMinimap(v => !v);
    const onTogglePerf = () => setShowPerf(v => !v);
    const onToggleLife = () => {
      setShowLife(visible => {
        if (!visible) {
          useLaraLifeStore.setState({ selectedCharacterId: 'native' });
          return true;
        }
        const current = useLaraLifeStore.getState().selectedCharacterId;
        const nextIdx = LIFE_CHARACTER_IDS.indexOf(current) + 1;
        if (nextIdx < LIFE_CHARACTER_IDS.length) {
          useLaraLifeStore.setState({ selectedCharacterId: LIFE_CHARACTER_IDS[nextIdx] });
          return true;
        }
        return false;
      });
    };
    document.addEventListener('toggle-minimap', onToggleMinimap);
    document.addEventListener('toggle-perf', onTogglePerf);
    document.addEventListener('toggle-life', onToggleLife);
    return () => {
      document.removeEventListener('toggle-minimap', onToggleMinimap);
      document.removeEventListener('toggle-perf', onTogglePerf);
      document.removeEventListener('toggle-life', onToggleLife);
    };
  }, []);

  // Écoute des CustomEvents 'app-log'
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AppLogEntry>).detail;
      setLogs(prev => {
        const next = [...prev, { ...detail, id: detail.id ?? ++_logCounter }];
        return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
      });
    };
    document.addEventListener('app-log', handler);
    setLogs([...APP_LOG_HISTORY]);
    return () => document.removeEventListener('app-log', handler);
  }, []);

  // À l'ouverture, montrer les derniers messages même si le défilement est en pause.
  useLayoutEffect(() => {
    if (logAreaRef.current) logAreaRef.current.scrollTop = logAreaRef.current.scrollHeight;
  }, [open, hidden]);

  // Auto-scroll du panneau de logs si non en pause
  useEffect(() => {
    if (!isPaused && logAreaRef.current) {
      logAreaRef.current.scrollTop = logAreaRef.current.scrollHeight;
    }
  }, [logs, isPaused, filterBubbleOnly, categoryFilter, actionFilter]);

  // Raccourci clavier 'B' : cycle ouvert → filtré → fermé
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return;
      if (e.key === 'b' || e.key === 'B') {
        setIsPaused(true);
        setCycleStep(prev => {
          const next = (prev + 1) % 3;
          setOpen(next === 1 || next === 2);
          if (next !== 0) setFilterBubbleOnly(next === 2);
          setIsMaximized(next === 1 || next === 2);
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const availableActions = Array.from(
    new Set(
      logs
        .filter(e => !categoryFilter || e.category === categoryFilter)
        .map(e => e.action)
        .filter((a): a is string => Boolean(a))
    )
  ).sort();

  const displayedLogs = logs.filter(entry => {
    if (filterBubbleOnly) {
      const activeId = activeCharacterId.toLowerCase();
      if (entry.tag.toLowerCase() !== 'system') {
        const tagParts = entry.tag.toLowerCase().split('+').map(s => s.trim());
        const actorMatch = entry.actors.some(a => a.toLowerCase() === activeId) || tagParts.some(t => t === activeId);
        if (!actorMatch) return false;
      }
    }
    if (categoryFilter && entry.category !== categoryFilter) return false;
    if (actionFilter && entry.action !== actionFilter) return false;
    return true;
  });
  const latestLog = displayedLogs[displayedLogs.length - 1];
  const latestLogTag = latestLog?.tag.split('+').map(part => {
    const character = findCharacter(part.trim());
    return character ? `${character.emoji} ${character.name}` : part.trim();
  }).join(' + ');

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
    setIsPaused(true);
    setOpen(prev => {
      const next = !prev;
      if (!next) {
        setCycleStep(0);
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
      setIsPaused(true);
      setOpen(true);
      setIsMaximized(true);
      setCycleStep(1);
    } else if (!isMaximized) {
      setIsMaximized(true);
    } else {
      setOpen(false);
      setIsMaximized(false);
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
        maxWidth: `calc(100vw - ${dockRightOffset}px - 8px)`,
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      <div
        className={`${TOOLBAR_CLASS} mw-100 overflow-hidden ${open ? 'w-100 flex-column align-items-stretch' : ''}`}
        style={{
          pointerEvents: 'auto',
          ...(open ? { height: isMaximized ? availableHeight : '140px', minHeight: 0 } : {}),
        }}
        role="region"
        aria-label="Console applicative"
      >
        <div
          className={`d-flex ${open ? 'flex-wrap flex-shrink-0' : 'flex-nowrap flex-grow-1 flex-shrink-1'} align-items-center justify-content-between gap-1 mw-100 user-select-none`}
          style={{ cursor: 'pointer', minWidth: 0 }}
          onClick={handleToggle}
          title={open ? 'Fermer la console (B)' : 'Ouvrir la console (B)'}
        >
          {!open && latestLog && (
            <span className="small font-monospace text-truncate flex-grow-1" title={`[${latestLogTag}] ${latestLog.message}`}>
              <small>[{latestLogTag}] {latestLog.message}</small>
            </span>
          )}
          <button
            type="button"
            className={`${TOOLBAR_BUTTON_CLASS} flex-shrink-0 ${open ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
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

          <div className={`d-flex align-items-center gap-1 flex-wrap ${open ? 'flex-shrink-1' : 'flex-shrink-0'} mw-100`} onClick={(e) => e.stopPropagation()}>
            {open && (
              <>
                <select
                  aria-label="Filtrer par catégorie de log"
                  className="form-select form-select-sm py-0 ps-1 pe-4 w-auto mw-100 small"
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value as '' | AppLogCategory);
                    setActionFilter('');
                  }}
                  title="Filtrer les logs par catégorie"
                >
                  <option value="">Toutes cat.</option>
                  {(Object.entries(LOG_CATEGORY_LABELS) as [AppLogCategory, string][]).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>

                <select
                  aria-label="Filtrer par action de log"
                  className="form-select form-select-sm py-0 ps-1 pe-4 w-auto mw-100 small"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  title="Filtrer les logs par action"
                >
                  <option value="">Toutes actions</option>
                  {availableActions.map(act => (
                    <option key={act} value={act}>{act}</option>
                  ))}
                </select>

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
                  className="d-flex align-items-baseline gap-1 px-1 py-0.5 text-break lh-sm flex-shrink-0 flex-wrap"
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
                  <span className="badge bg-light text-secondary border py-0 px-1 font-monospace flex-shrink-0">
                    {LOG_CATEGORY_LABELS[entry.category]}
                  </span>
                  {entry.action && (
                    <span className="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle py-0 px-1 font-monospace flex-shrink-0">
                      {entry.action}
                    </span>
                  )}
                  <span className="text-dark fw-normal">{entry.message}</span>
                  {entry.object && (
                    <span className="d-inline-flex align-items-center gap-1 flex-shrink-0">
                      <span
                        className="user-select-all font-monospace bg-body-secondary text-dark border rounded px-1"
                        title={entry.object.label ? `Objet : ${entry.object.label}` : `Objet ID : ${entry.object.id}`}
                      >
                        {entry.object.id}{entry.object.slotId ? `:${entry.object.slotId}` : ''}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary py-0 px-1 lh-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          openInventoryTarget({
                            type: 'object',
                            object: entry.object!,
                          });
                        }}
                        title={`Ouvrir l'objet "${entry.object.label ?? entry.object.id}" dans l'Inventaire`}
                        aria-label={`Ouvrir l'objet ${entry.object.id} dans l'inventaire`}
                      >
                        <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
                      </button>
                    </span>
                  )}
                  {entry.animation && (
                    <span className="d-inline-flex align-items-center gap-1 flex-shrink-0">
                      <span
                        className="user-select-all font-monospace bg-body-secondary text-dark border rounded px-1"
                        title={entry.animation.label ? `Animation : ${entry.animation.label}` : `Animation ID : ${entry.animation.id}`}
                      >
                        {entry.animation.id}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger py-0 px-1 lh-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          openInventoryTarget({
                            type: 'animation',
                            animation: {
                              ...entry.animation!,
                              actorId: entry.animation!.actorId ?? entry.actors[0],
                              partnerId: entry.animation!.partnerId ?? entry.actors[1],
                            },
                          });
                        }}
                        title={`Ouvrir l'animation "${entry.animation.label ?? entry.animation.id}" dans Inventaire > Animations`}
                        aria-label={`Ouvrir l'animation ${entry.animation.id} dans Inventaire > Animations`}
                      >
                        <i className="bi bi-film" aria-hidden="true" />
                      </button>
                    </span>
                  )}
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

        <button
          type="button"
          className={`${TOOLBAR_BUTTON_CLASS} ${showLife ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
          onClick={() => setShowLife(v => !v)}
          title="Vie de Lara et Cha"
          aria-label="Afficher ou masquer la vie de Lara et Cha"
          aria-expanded={showLife}
          aria-controls="lara-life-panel"
        >
          <i className="bi bi-heart-pulse-fill" aria-hidden="true" />
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

      {/* Panneaux empilés sous le menu Mon CV */}
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

      {showLife && (
        <div
          id="lara-life-panel"
          className="glass-card shadow-lg rounded-2 align-self-end overflow-hidden life-panel"
          style={{ pointerEvents: 'auto', width: panelWidth, maxWidth: 'calc(100vw - 16px)' }}
        >
          <LaraLifePanel />
        </div>
      )}

      {showPerf && (
        <div
          className="glass-card shadow-lg rounded-2 p-1 align-self-end overflow-hidden"
          style={{
            pointerEvents: 'auto',
            width: 190,
            maxWidth: 'calc(100vw - 16px)',
          }}
        >
          <DevToolsGroups Group={({ children }: any) => <>{children}</>} compact headerless />
        </div>
      )}
    </div>
  );
}
