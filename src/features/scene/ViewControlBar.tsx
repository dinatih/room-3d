import './ViewControlBar.scss';
import { TOOLBAR_CLASS, TOOLBAR_BUTTON_CLASS } from './toolbarStyles';
import type { ReactNode } from 'react';
import { useSceneStore } from './store/useSceneStore';
import { dispatchView, ORTHO_VIEWS, EXTRA_VIEWS, ISO_VIEWS } from './sidepanel/types';
import { getLaraGridCameraView, frameLaraGridCamera } from './character/laraGridUtils';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { HDRI_LIST } from './hdriConfig';
import { chooseRandomCharacter } from './store/randomCharacter';
import { CharacterCountSelect } from './CharacterCountSelect';

export interface ViewControlBarProps {
  /** Position du dock flottant. Ignoré quand inline=true. Défaut : 'bottom-right' */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  /** Rendu dans le flux du document (pas position:fixed) */
  inline?: boolean;
  /** Masquer le composant (ex: mode immersif) */
  hidden?: boolean;
  /** Afficher les commandes de la scène principale */
  showCharacterModes?: boolean;
  /** Afficher la bascule Orbit/Pan pour les aperçus d'inventaire. */
  showOrbitControls?: boolean;
  /** Vue de la caméra de l'aperçu ; null pour une caméra libre. */
  activeCameraView?: string | null;
  showMirrorsHD?: boolean;
  hideUI?: boolean;
  onToggleHideUI?: () => void;
  onEnterFlight?: () => void;
  toolbarActions?: ReactNode;
  beforeAmbianceActions?: ReactNode;
  children?: ReactNode;
}

export function ViewControlBar({
  position = 'bottom-right',
  inline = false,
  hidden = false,
  showCharacterModes = false,
  showOrbitControls = false,
  activeCameraView: previewCameraView,
  showMirrorsHD = false,
  hideUI = false,
  onToggleHideUI,
  onEnterFlight,
  toolbarActions,
  beforeAmbianceActions,
  children,
}: ViewControlBarProps) {
  const isMobile = useIsMobile();
  const cameraProjection = useSceneStore(s => s.cameraProjection);
  const cameraMode = useSceneStore(s => s.cameraMode);
  const orbitMouseMode = useSceneStore(s => s.orbitMouseMode);
  const npcGridActive = useSceneStore(s => s.layers.laraGrid);
  const sceneCameraView = useSceneStore(s => s.activeCameraView);
  const activeCameraView = previewCameraView === undefined ? sceneCameraView : previewCameraView;
  const toggleCameraProjection = useSceneStore(s => s.toggleCameraProjection);
  const currentHdri = useSceneStore(s => s.currentHdri);
  const setHdri = useSceneStore(s => s.setHdri);
  const mirrorsHD = useSceneStore(s => s.layers.mirrorsHD);
  const cameraViewMarkers = useSceneStore(s => s.layers.cameraViewMarkers);
  const toggleLayer = useSceneStore(s => s.toggleLayer);

  if (hidden) return null;

  const isOrtho = cameraProjection === 'ortho';
  const orbitActive = !showCharacterModes || cameraMode === 'orbit';
  const isPan = orbitActive && orbitMouseMode === 'pan';
  const orbitTitle = orbitActive
    ? `${isPan ? 'Translation : glisser gauche pour déplacer, droit pour tourner. Passer en Rotation' : 'Rotation : glisser gauche pour tourner, droit pour déplacer. Passer en Translation'}${showCharacterModes ? ' (O)' : ''}`
    : 'Revenir à la caméra Orbit perspective par défaut (Alt+O)';
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
  const mobilePositionStyle = isMobile && position.startsWith('bottom-')
    ? { left: 0, right: 0, marginInline: 'auto', transform: 'none' }
    : undefined;
  const mobileDockOffset = isMobile && position.startsWith('bottom-')
    ? { bottom: 'calc(4.25rem + env(safe-area-inset-bottom) + 4px)' }
    : undefined;

  const viewButtons = (
    views: typeof ORTHO_VIEWS | typeof EXTRA_VIEWS | typeof ISO_VIEWS,
    color: 'cyan' | 'green' | 'purple',
  ) => (
    <div className="d-flex gap-1 view-control-bar__group" role="group" aria-label={views.map(view => view.label).join(', ')}>
      {views.map(view => (
        <button
          key={view.key}
          type="button"
          className={`${TOOLBAR_BUTTON_CLASS} ${isActive(view.key) ? `view-control-bar__btn--${color}` : 'btn-outline-secondary'}`}
          onClick={() => {
            if (npcGridActive && view.key === 'front') {
              frameLaraGridCamera(undefined, cameraProjection);
            } else {
              dispatchView(view.key, npcGridActive ? getLaraGridCameraView().target : undefined);
            }
          }}
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
    <div className={`${TOOLBAR_CLASS} ${inline ? 'view-control-bar--inline overflow-x-auto' : ''}`} role="toolbar" aria-label="Contrôle des vues">
      {showCharacterModes && (
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
      {(showCharacterModes || showMirrorsHD) && (
        <button
          type="button"
          className={`${TOOLBAR_BUTTON_CLASS} ${mirrorsHD ? 'btn-danger' : 'btn-outline-secondary'}`}
          onClick={() => toggleLayer('mirrorsHD')}
          title="Activer ou désactiver les miroirs HD"
          aria-label="Miroirs HD"
          aria-pressed={mirrorsHD}
        >
          HD
        </button>
      )}

      {showCharacterModes && <CharacterCountSelect />}

      {showCharacterModes && (
        <button
          type="button"
          className={`${TOOLBAR_BUTTON_CLASS} btn-outline-secondary`}
          onClick={chooseRandomCharacter}
          title="Changer aléatoirement le PNJ actif parmi les personnages visibles (R)"
          aria-label="Changer aléatoirement le PNJ actif (R)"
          aria-keyshortcuts="r"
        >
          <i className="bi bi-shuffle" aria-hidden="true" />
          <i className="bi bi-person-standing-dress" aria-hidden="true" />
        </button>
      )}

      {showCharacterModes && (
        <div className="d-flex gap-1 view-control-bar__group" role="group" aria-label="Suivi caméra">
          <button
            type="button"
            className={`${TOOLBAR_BUTTON_CLASS} ${cameraMode === 'follow' ? 'view-control-bar__btn--green' : 'btn-outline-secondary'}`}
            onClick={() => dispatchCameraMode('toggle-follow')}
            title="Activer ou quitter le suivi à la troisième personne (M : Follow ↔ FPV)"
            aria-pressed={cameraMode === 'follow'}
          ><i className="bi bi-person-walking" aria-hidden="true" /><span className="fw-semibold">Follow</span></button>
          <button
            type="button"
            className={`${TOOLBAR_BUTTON_CLASS} ${cameraMode === 'fpv' ? 'view-control-bar__btn--blue' : 'btn-outline-secondary'}`}
            onClick={() => dispatchCameraMode('fpv')}
            title="Passer en vue subjective FPV (M : Follow ↔ FPV)"
            aria-pressed={cameraMode === 'fpv'}
          ><i className="bi bi-eye-fill" aria-hidden="true" /><span className="fw-semibold">FPV</span></button>
        </div>
      )}

      <button
        type="button"
        className={`${TOOLBAR_BUTTON_CLASS} ${isOrtho ? 'view-control-bar__btn--blue' : 'view-control-bar__btn--yellow'}`}
        onClick={toggleCameraProjection}
        title={`${isOrtho ? 'Basculer en Perspective (3D conique)' : 'Basculer en Orthographique (isométrique)'} (P)`}
        aria-pressed={isOrtho}
      >
        <i className={`bi ${isOrtho ? 'bi-easel2' : 'bi-eye'}`} aria-hidden="true" />
        <span className="fw-semibold">{isOrtho ? 'Ortho' : 'Persp'}</span>
      </button>

      {(showCharacterModes || showOrbitControls) && (
          <button
            type="button"
            className={`${TOOLBAR_BUTTON_CLASS} ${orbitActive ? 'view-control-bar__btn--yellow' : 'btn-outline-secondary'}`}
            onClick={() => {
              if (showCharacterModes) dispatchCameraMode('orbit');
              else useSceneStore.getState().setOrbitMouseMode(orbitMouseMode === 'rotate' ? 'pan' : 'rotate');
            }}
            title={orbitTitle}
            aria-label={orbitTitle}
            aria-pressed={orbitActive}
          ><i className={`bi ${isPan ? 'bi-arrows-move' : 'bi-globe2'}`} aria-hidden="true" /><span className="fw-semibold">{isPan ? 'Translation' : 'Rotation'}</span></button>
      )}
      {showCharacterModes && (
        <div className="d-flex gap-1 view-control-bar__group" role="group" aria-label="Modes caméra">
          <button
            type="button"
            className={`${TOOLBAR_BUTTON_CLASS} ${npcGridActive ? 'view-control-bar__btn--cyan' : 'btn-outline-secondary'}`}
            onClick={() => dispatchCameraMode('toggle-npc-grid')}
            title="Afficher ou quitter la grille des PNJ (G)"
            aria-pressed={npcGridActive}
          ><i className="bi bi-grid-3x3-gap-fill" aria-hidden="true" /><span className="fw-semibold">NPCs</span></button>
        </div>
      )}

      {viewButtons(ORTHO_VIEWS, 'cyan')}
      {viewButtons(EXTRA_VIEWS, 'green')}
      {viewButtons(ISO_VIEWS, 'purple')}
      {showCharacterModes && (
        <button
          type="button"
          className={`${TOOLBAR_BUTTON_CLASS} ${cameraViewMarkers ? 'btn-danger' : 'btn-outline-danger'}`}
          onClick={() => toggleLayer('cameraViewMarkers')}
          title="Afficher ou masquer les raccourcis de vues 3D"
          aria-label="Raccourcis de vues 3D"
          aria-pressed={cameraViewMarkers}
        >
          <i className="bi bi-camera-video-fill" aria-hidden="true" />
        </button>
      )}
      {beforeAmbianceActions}
      {inline && (
        <select
          className="form-select form-select-sm py-0 ps-2 mw-100 flex-shrink-0 bg-transparent text-body border-secondary small text-truncate view-control-bar__ambiance"
          value={currentHdri}
          onChange={event => setHdri(event.target.value)}
          aria-label="Ambiance de la preview 3D"
          title={HDRI_LIST.find(hdri => hdri.id === currentHdri)?.name ?? currentHdri}
        >
          {HDRI_LIST.map(hdri => (
            <option key={hdri.id} value={hdri.id}>{hdri.name}</option>
          ))}
        </select>
      )}
      {toolbarActions}
      {showCharacterModes && (
        <div className="d-flex gap-1 view-control-bar__group" role="group" aria-label="Actions de la scène">
          <button type="button" className={`${TOOLBAR_BUTTON_CLASS} btn-outline-secondary view-control-bar__outline--orange`} onClick={onEnterFlight} title="Activer le mode avion (F)" aria-label="Activer le mode avion (F)">
            <i className="bi bi-airplane-fill" aria-hidden="true" />
          </button>
          {!isMobile && (
            <>
              <button type="button" className={`${TOOLBAR_BUTTON_CLASS} btn-outline-secondary view-control-bar__outline--cyan`} onClick={() => useSceneStore.getState().setPhotoModeOpen(true)} title="Ouvrir le mode photo Raytracing (F10)" aria-label="Ouvrir le mode photo Raytracing (F10)">
                <i className="bi bi-camera-fill" aria-hidden="true" />
              </button>
              <button type="button" className={`${TOOLBAR_BUTTON_CLASS} btn-outline-secondary`} onClick={() => window.dispatchEvent(new Event('open-shortcuts-modal'))} title="Afficher tous les raccourcis clavier" aria-label="Afficher tous les raccourcis clavier">
                <i className="bi bi-keyboard-fill" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      )}
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
    <div className={`view-control-bar-dock ${children ? 'view-control-bar-dock--stacked gap-2' : ''}`} style={{ position: 'fixed', zIndex: 1000, ...positionStyle, ...mobilePositionStyle, ...mobileDockOffset }}>
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
      {children && <div className="view-control-bar-dock__content mw-100">{children}</div>}
    </div>
  );
}
