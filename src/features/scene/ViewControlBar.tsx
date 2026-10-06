import './ViewControlBar.scss';
import type { ReactNode } from 'react';
import { useSceneStore } from './store/useSceneStore';
import { dispatchView } from './sidepanel/types';
import { getLaraGridCameraView } from './character/laraGridUtils';
import { useIsMobile } from '@shared/hooks/useIsMobile';

const ORTHO_VIEWS = [
  { key: 'front', label: 'Face', shortcut: 'Alt+1', icon: 'bi-arrow-up' },
  { key: 'back', label: 'Arrière', shortcut: 'Alt+2', icon: 'bi-arrow-down' },
  { key: 'left', label: 'Gauche', shortcut: 'Alt+3', icon: 'bi-arrow-left' },
  { key: 'right', label: 'Droite', shortcut: 'Alt+4', icon: 'bi-arrow-right' },
] as const;

const EXTRA_VIEWS = [
  { key: 'top', label: 'Dessus', shortcut: 'Alt+5', icon: 'bi-chevron-compact-up' },
  { key: 'bottom', label: 'Dessous', shortcut: 'Alt+6', icon: 'bi-chevron-compact-down' },
] as const;

const ISO_VIEWS = [
  { key: 'iso-se', label: 'ISO Sud-Est', shortcut: 'Alt+7', icon: 'bi-arrow-down-right' },
  { key: 'iso-sw', label: 'ISO Sud-Ouest', shortcut: 'Alt+8', icon: 'bi-arrow-down-left' },
  { key: 'iso-ne', label: 'ISO Nord-Est', shortcut: 'Alt+9', icon: 'bi-arrow-up-right' },
  { key: 'iso-nw', label: 'ISO Nord-Ouest', shortcut: 'Alt+0', icon: 'bi-arrow-up-left' },
] as const;

export interface ViewControlBarProps {
  /** Position du dock flottant. Ignoré quand inline=true. Défaut : 'bottom-right' */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  /** Rendu dans le flux du document (pas position:fixed) */
  inline?: boolean;
  /** Masquer le composant (ex: mode immersif) */
  hidden?: boolean;
  /** Afficher les commandes de la scène principale */
  showCharacterModes?: boolean;
  hideUI?: boolean;
  onToggleHideUI?: () => void;
  onEnterFlight?: () => void;
  children?: ReactNode;
}

export function ViewControlBar({
  position = 'bottom-right',
  inline = false,
  hidden = false,
  showCharacterModes = false,
  hideUI = false,
  onToggleHideUI,
  onEnterFlight,
  children,
}: ViewControlBarProps) {
  const isMobile = useIsMobile();
  const cameraProjection = useSceneStore(s => s.cameraProjection);
  const cameraMode = useSceneStore(s => s.cameraMode);
  const npcGridActive = useSceneStore(s => s.layers.laraGrid);
  const activeCameraView = useSceneStore(s => s.activeCameraView);
  const toggleCameraProjection = useSceneStore(s => s.toggleCameraProjection);

  if (hidden) return null;

  const isOrtho = cameraProjection === 'ortho';
  const isActive = (key: string) => activeCameraView === key;
  const dispatchCameraMode = (mode: 'toggle-follow' | 'fpv' | 'orbit' | 'toggle-npc-grid') => {
    document.dispatchEvent(new CustomEvent('camera-mode', { detail: mode }));
  };
  const positionStyle: React.CSSProperties | undefined = inline ? undefined : {
    'top-left': { top: 12, left: 12 },
    'top-right': { top: 12, right: 12 },
    'bottom-left': { bottom: 12, left: 12 },
    'bottom-right': { bottom: 12, right: 12 },
    'bottom-center': { bottom: 12, left: '50%', transform: 'translateX(-50%)' },
  }[position];
  const mobileDockOffset = isMobile && position.startsWith('bottom-')
    ? { bottom: 'calc(3.75rem + env(safe-area-inset-bottom) + 8px)' }
    : undefined;

  const viewButtons = (
    views: typeof ORTHO_VIEWS | typeof EXTRA_VIEWS | typeof ISO_VIEWS,
    color: 'cyan' | 'green' | 'purple',
  ) => (
    <div className="btn-group btn-group-sm view-control-bar__group" role="group" aria-label={views.map(view => view.label).join(', ')}>
      {views.map(view => (
        <button
          key={view.key}
          type="button"
          className={`btn ${isActive(view.key) ? `view-control-bar__btn--${color}` : 'btn-outline-secondary'}`}
          onClick={() => dispatchView(view.key, npcGridActive ? getLaraGridCameraView().target : undefined)}
          title={`${view.label} (${view.shortcut})`}
          aria-label={`${view.label} (${view.shortcut})`}
          aria-pressed={isActive(view.key)}
        >
          <i className={`bi ${view.icon}`} aria-hidden="true" />
        </button>
      ))}
    </div>
  );

  const bar = (
    <div className={`view-control-bar glass-card d-flex flex-nowrap justify-content-center align-items-center gap-1 ${children ? 'p-1 small' : 'p-2'} rounded-3 border shadow-lg ${inline ? 'view-control-bar--inline' : ''}`} role="toolbar" aria-label="Contrôle des vues">
      {showCharacterModes && (
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={onToggleHideUI}
          title={`${hideUI ? 'Afficher' : 'Masquer'} l'interface 2D (0)`}
          aria-label={`${hideUI ? 'Afficher' : 'Masquer'} l'interface 2D (0)`}
        >
          <i className={`bi ${hideUI ? 'bi-eye' : 'bi-eye-slash'}`} aria-hidden="true" />
        </button>
      )}

      <button
        type="button"
        className={`btn btn-sm ${isOrtho ? 'view-control-bar__btn--blue' : 'view-control-bar__btn--yellow'}`}
        onClick={toggleCameraProjection}
        title={`${isOrtho ? 'Basculer en Perspective (3D conique)' : 'Basculer en Orthographique (isométrique)'} (P)`}
        aria-pressed={isOrtho}
      >
        <i className={`bi ${isOrtho ? 'bi-easel2' : 'bi-eye'}`} aria-hidden="true" />
        <span className="ms-1">{isOrtho ? 'ORTHO' : 'PERSP'}</span>
      </button>

      {showCharacterModes && (
        <div className="btn-group btn-group-sm view-control-bar__group" role="group" aria-label="Modes caméra">
          <button
            type="button"
            className={`btn ${cameraMode === 'orbit' ? 'view-control-bar__btn--yellow' : 'btn-outline-secondary'}`}
            onClick={() => dispatchCameraMode('orbit')}
            title="Revenir à la caméra Orbit (O : Orbit → NPC Grid → Follow → FPV → Orbit)"
            aria-pressed={cameraMode === 'orbit'}
          ><i className="bi bi-globe2 me-sm-1" aria-hidden="true" /><span>ORBIT</span></button>
          <button
            type="button"
            className={`btn ${npcGridActive ? 'view-control-bar__btn--cyan' : 'btn-outline-secondary'}`}
            onClick={() => dispatchCameraMode('toggle-npc-grid')}
            title="Afficher ou quitter la grille des PNJ (G ; O : Orbit → NPC Grid → Follow → FPV → Orbit)"
            aria-pressed={npcGridActive}
          ><i className="bi bi-grid-3x3-gap-fill me-sm-1" aria-hidden="true" /><span>NPC GRID</span></button>
          <button
            type="button"
            className={`btn ${cameraMode === 'follow' ? 'view-control-bar__btn--green' : 'btn-outline-secondary'}`}
            onClick={() => dispatchCameraMode('toggle-follow')}
            title="Activer ou quitter le suivi à la troisième personne (M : Follow ↔ FPV ; O : Orbit → NPC Grid → Follow → FPV → Orbit)"
            aria-pressed={cameraMode === 'follow'}
          ><i className="bi bi-person-walking me-sm-1" aria-hidden="true" /><span>FOLLOW</span></button>
          <button
            type="button"
            className={`btn ${cameraMode === 'fpv' ? 'view-control-bar__btn--blue' : 'btn-outline-secondary'}`}
            onClick={() => dispatchCameraMode('fpv')}
            title="Passer en vue subjective FPV (M : Follow ↔ FPV ; O : Orbit → NPC Grid → Follow → FPV → Orbit)"
            aria-pressed={cameraMode === 'fpv'}
          ><i className="bi bi-eye-fill me-sm-1" aria-hidden="true" /><span>FPV</span></button>
        </div>
      )}

      {showCharacterModes && (
        <div className="btn-group btn-group-sm view-control-bar__group" role="group" aria-label="Actions de la scène">
          <button type="button" className="btn btn-outline-secondary view-control-bar__outline--orange" onClick={onEnterFlight} title="Activer le mode avion (F)" aria-label="Activer le mode avion (F)">
            <i className="bi bi-airplane-fill" aria-hidden="true" />
          </button>
          <button type="button" className="btn btn-outline-secondary view-control-bar__outline--cyan" onClick={() => useSceneStore.getState().setPhotoModeOpen(true)} title="Ouvrir le mode photo Raytracing (F10)" aria-label="Ouvrir le mode photo Raytracing (F10)">
            <i className="bi bi-camera-fill" aria-hidden="true" />
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => window.dispatchEvent(new Event('open-shortcuts-modal'))} title="Afficher tous les raccourcis clavier" aria-label="Afficher tous les raccourcis clavier">
            <i className="bi bi-keyboard-fill" aria-hidden="true" />
          </button>
        </div>
      )}

      {viewButtons(ORTHO_VIEWS, 'cyan')}
      {viewButtons(EXTRA_VIEWS, 'green')}
      {viewButtons(ISO_VIEWS, 'purple')}
    </div>
  );

  if (inline) {
    return (
      <div className={`view-control-bar-inline d-flex flex-column align-items-center ${children ? 'gap-2 px-1 py-0' : 'gap-0 px-2 py-2'}`}>
        {bar}
        {children && <div className="w-100">{children}</div>}
      </div>
    );
  }

  return (
    <div className={`view-control-bar-dock ${children ? 'view-control-bar-dock--stacked gap-2' : ''}`} style={{ position: 'fixed', zIndex: 1000, ...positionStyle, ...mobileDockOffset }}>
      {activeCameraView && (
        <span className="badge text-bg-dark bg-opacity-75 view-control-bar-dock__view-label">
          {activeCameraView === 'iso-se' ? 'ISO Sud-Est'
            : activeCameraView === 'iso-sw' ? 'ISO Sud-Ouest'
            : activeCameraView === 'iso-ne' ? 'ISO Nord-Est'
            : activeCameraView === 'iso-nw' ? 'ISO Nord-Ouest'
            : activeCameraView === 'front' ? 'Face'
            : activeCameraView === 'back' ? 'Arrière'
            : activeCameraView === 'left' ? 'Gauche'
            : activeCameraView === 'right' ? 'Droite'
            : activeCameraView === 'perspective' ? 'Perspective'
            : activeCameraView === 'top' ? 'Dessus'
            : activeCameraView === 'bottom' ? 'Dessous'
            : activeCameraView}
        </span>
      )}
      {bar}
      {children && <div className="view-control-bar-dock__content w-100">{children}</div>}
    </div>
  );
}
