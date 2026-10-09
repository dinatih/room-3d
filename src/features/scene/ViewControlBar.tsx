import './ViewControlBar.scss';
import { TOOLBAR_CLASS, TOOLBAR_BUTTON_CLASS } from './toolbarStyles';
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useSceneStore } from './store/useSceneStore';
import { dispatchView, ORTHO_VIEWS, EXTRA_VIEWS, ISO_VIEWS } from './sidepanel/types';
import { getCharacterGridCameraView, frameCharacterGridCamera } from './character/characterGridUtils';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { HDRI_LIST } from './hdriConfig';
import { chooseRandomCharacter } from './store/randomCharacter';
import { CharacterCountSelect } from './CharacterCountSelect';
import { CharacterSelect } from './CharacterSelect';
import { cameraState } from './cameraState';

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
  panelControls?: ReactNode;
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
  panelControls,
  children,
}: ViewControlBarProps) {
  const [hoveredView, setHoveredView] = useState<{
    label: string; top?: number; bottom?: number;
  } | null>(null);
  const [animalCameraActive, setAnimalCameraActive] = useState(Boolean(cameraState.animalTarget));
  useEffect(() => {
    const onAnimalCameraMode = (event: Event) => setAnimalCameraActive((event as CustomEvent<boolean>).detail);
    document.addEventListener('animal-camera-mode', onAnimalCameraMode);
    return () => document.removeEventListener('animal-camera-mode', onAnimalCameraMode);
  }, []);
  const isMobile = useIsMobile();
  const cameraProjection = useSceneStore(s => s.cameraProjection);
  const cameraMode = useSceneStore(s => s.cameraMode);
  const orbitMouseMode = useSceneStore(s => s.orbitMouseMode);
  const npcGridActive = useSceneStore(s => s.layers.characterGrid);
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
    ? `${isPan ? 'Trans (Translation) : glisser gauche pour déplacer, droit pour tourner. Passer en Rot' : 'Rot (Rotation) : glisser gauche pour tourner, droit pour déplacer. Passer en Trans'}${showCharacterModes ? ' (R / T)' : ''}`
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
    ? { bottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }
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
          className={`${TOOLBAR_BUTTON_CLASS} ${isActive(view.key) ? `view-control-bar__btn--${color}` : 'btn-outline-secondary'}`}
          onClick={() => {
            if (npcGridActive && view.key === 'front') {
              frameCharacterGridCamera(undefined, cameraProjection);
            } else {
              dispatchView(view.key, npcGridActive ? getCharacterGridCameraView().target : undefined);
            }
          }}
          title={`${view.label} (${view.shortcut})`}
          onMouseEnter={event => {
            const rect = event.currentTarget.getBoundingClientRect();
            setHoveredView({
              label: `${view.label} (${view.shortcut})`,
              ...(rect.top > window.innerHeight / 2
                ? { bottom: window.innerHeight - rect.top }
                : { top: rect.bottom }),
            });
          }}
          onMouseLeave={() => setHoveredView(null)}
          onBlur={() => setHoveredView(null)}
          aria-label={`${view.label} (${view.shortcut})`}
          aria-pressed={isActive(view.key)}
        >
          <i className={`bi ${view.icon}`} aria-hidden="true" />
        </button>
      ))}
    </div>
  );

  const hoverTooltip = hoveredView && createPortal(
    <div
      role="tooltip"
      className="view-control-bar__view-tooltip position-fixed start-0 end-0 d-flex justify-content-center p-2 pe-none"
      style={{ top: hoveredView.top, bottom: hoveredView.bottom }}
    >
      <div className="d-flex flex-column align-items-center gap-1 mw-100">
        <span className="badge text-bg-danger">{hoveredView.label}</span>
      </div>
    </div>,
    document.body,
  );

  const bar = (
    <>
    {hoverTooltip}
    <div className={`${TOOLBAR_CLASS} ${showCharacterModes ? 'flex-column align-items-stretch view-control-bar--multi-rows' : ''} ${inline ? 'view-control-bar--inline overflow-x-auto' : ''}`} role="toolbar" aria-label="Contrôle des vues">
      {panelControls && (
        <div className="d-flex flex-nowrap align-items-center gap-1 view-control-bar__row">
          {panelControls}
        </div>
      )}
      <div className="d-flex flex-nowrap align-items-center gap-1 view-control-bar__row">
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

        {showCharacterModes && (
          <div className="btn-group btn-group-sm view-control-bar__group" role="group" aria-label="Personnages et suivi caméra">
            <CharacterCountSelect />
            <button
              type="button"
              className={`${TOOLBAR_BUTTON_CLASS} view-control-bar__btn--yellow`}
              onClick={chooseRandomCharacter}
              title="Changer aléatoirement le PNJ actif parmi les personnages visibles (S)"
              aria-label="Changer aléatoirement le PNJ actif (S)"
              aria-keyshortcuts="s"
            >
              <i className="bi bi-shuffle" aria-hidden="true" />
              <i className="bi bi-person-standing-dress" aria-hidden="true" />
            </button>
            <CharacterSelect hideUI={hideUI} />
            <button
              type="button"
              className={`${TOOLBAR_BUTTON_CLASS} ${cameraMode === 'follow' ? 'view-control-bar__btn--green' : 'btn-outline-secondary'}`}
              onClick={() => dispatchCameraMode('toggle-follow')}
              title="Follow / FPV (F / V : alterner)"
              aria-pressed={cameraMode === 'follow'}
            ><i className="bi bi-camera2" aria-hidden="true" /><i className="bi bi-person-walking" aria-hidden="true" /><span className="fw-semibold">Follow</span></button>
            <button
              type="button"
              className={`${TOOLBAR_BUTTON_CLASS} ${cameraMode === 'fpv' ? 'view-control-bar__btn--blue' : 'btn-outline-secondary'}`}
              onClick={() => dispatchCameraMode('fpv')}
              title="FPV / Follow (V / F : alterner)"
              aria-pressed={cameraMode === 'fpv'}
            ><i className="bi bi-eye-fill" aria-hidden="true" /><span className="fw-semibold">FPV</span></button>
          </div>
        )}
        {showCharacterModes && animalCameraActive && (
          <button type="button" className={`${TOOLBAR_BUTTON_CLASS} btn-outline-danger`} onClick={() => dispatchCameraMode('orbit')} title="Quitter la caméra de l’animal" aria-label="Quitter la caméra de l’animal">
            <i className="bi bi-box-arrow-right" aria-hidden="true" /><span className="fw-semibold">Quitter</span>
          </button>
        )}

        <button
          type="button"
          className={`${TOOLBAR_BUTTON_CLASS} ${isOrtho ? 'view-control-bar__btn--indigo' : 'view-control-bar__btn--pink'}`}
          onClick={toggleCameraProjection}
          title={`${isOrtho ? 'Basculer en Perspective (3D conique)' : 'Basculer en Orthographique (isométrique)'} (O / P : alterner)`}
          aria-pressed={isOrtho}
        >
          <i className={`bi ${isOrtho ? 'bi-easel2' : 'bi-eye'}`} aria-hidden="true" />
          <span className="fw-semibold">{isOrtho ? 'Ortho' : 'Persp'}</span>
        </button>

        {(showCharacterModes || showOrbitControls) && (
            <button
              type="button"
              className={`${TOOLBAR_BUTTON_CLASS} ${orbitActive ? `view-control-bar__btn--${isPan ? 'teal' : 'orange'}` : 'btn-outline-secondary'}`}
              onClick={() => {
                if (showCharacterModes) dispatchCameraMode('orbit');
                else useSceneStore.getState().setOrbitMouseMode(orbitMouseMode === 'rotate' ? 'pan' : 'rotate');
              }}
              title={orbitTitle}
              aria-label={orbitTitle}
              aria-pressed={orbitActive}
            >
              <i className={`bi ${isPan ? 'bi-arrows-move' : 'bi-arrow-repeat'}`} aria-hidden="true" />
              <span className="fw-semibold">{isPan ? 'Trans' : 'Rot'}</span>
            </button>
        )}
      </div>
      <div className="d-flex flex-nowrap align-items-center gap-1 view-control-bar__row">
        <div className="btn-group btn-group-sm view-control-bar__group" role="group" aria-label="Zoom caméra">
          {(['in', 'out'] as const).map(direction => (
            <button
              key={direction}
              type="button"
              className={`${TOOLBAR_BUTTON_CLASS} btn-outline-secondary`}
              onClick={() => document.dispatchEvent(new CustomEvent('camera-zoom', {
                detail: { direction, scope: showCharacterModes ? 'scene' : 'preview' },
              }))}
              title={direction === 'in' ? 'Zoomer' : 'Dézoomer'}
              aria-label={direction === 'in' ? 'Zoomer' : 'Dézoomer'}
            >
              <i className={`bi bi-zoom-${direction}`} aria-hidden="true" />
            </button>
          ))}
        </div>
        {viewButtons(ORTHO_VIEWS, 'cyan')}
        {viewButtons(EXTRA_VIEWS, 'green')}
        {viewButtons(ISO_VIEWS, 'purple')}
        {showCharacterModes && (
          <button
            type="button"
            className={`${TOOLBAR_BUTTON_CLASS} bg-transparent ${cameraViewMarkers ? 'btn-outline-danger text-danger' : 'btn-outline-secondary'}`}
            onClick={() => toggleLayer('cameraViewMarkers')}
            title="Afficher ou masquer les raccourcis de vues 3D"
            aria-label="Raccourcis de vues 3D"
            aria-pressed={cameraViewMarkers}
          >
            <i className="bi bi-camera-video" aria-hidden="true" />
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
            <button type="button" className={`${TOOLBAR_BUTTON_CLASS} btn-outline-secondary view-control-bar__outline--orange`} onClick={onEnterFlight} title="Activer le mode avion (Alt+V)" aria-label="Activer le mode avion (Alt+V)">
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
    </div>
    </>
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
