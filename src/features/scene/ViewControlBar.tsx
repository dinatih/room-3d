import './ViewControlBar.scss';
import { TOOLBAR_CLASS, TOOLBAR_BUTTON_CLASS } from './toolbarStyles';
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useSceneStore } from './store/useSceneStore';
import { CAMERA_SHORTCUT_VIEWS, CARDINAL_VIEWS, dispatchView, ELEVATION_VIEWS } from './sidepanel/types';
import { getCharacterGridCameraView, frameCharacterGridCamera } from './character/characterGridUtils';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { HDRI_LIST } from './hdriConfig';
import { chooseRandomCharacter } from './store/randomCharacter';
import { CharacterCountSelect } from './CharacterCountSelect';
import { CharacterSelect } from './CharacterSelect';
import { cameraState } from './cameraState';
import { PresetButton } from './PresetButton';

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
  /** Vue / position de la caméra de l'aperçu ; null pour une caméra libre. */
  activeCameraPos?: string | null;
  /** Rangée unique réordonnée pour la barre de contrôle de l’inventaire. */
  inventoryLayout?: boolean;
  showMirrorsHD?: boolean;
  hideUI?: boolean;
  onToggleHideUI?: () => void;
  onEnterFlight?: () => void;
  toolbarActions?: ReactNode;
  afterToolbarActions?: ReactNode;
  beforeAmbianceActions?: ReactNode;
  panelControls?: ReactNode;
  /** Commandes directionnelles placées au-dessus du dock de la scène. */
  directionalControls?: ReactNode;
  children?: ReactNode;
}

export function ViewControlBar({
  position = 'bottom-right',
  inline = false,
  hidden = false,
  showCharacterModes = false,
  showOrbitControls = false,
  activeCameraPos: previewCameraPos,
  inventoryLayout = false,
  showMirrorsHD = false,
  hideUI = false,
  onToggleHideUI: _onToggleHideUI,
  onEnterFlight: _onEnterFlight,
  toolbarActions,
  afterToolbarActions,
  beforeAmbianceActions,
  panelControls: _panelControls,
  directionalControls,
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
  const sceneCameraPos = useSceneStore(s => s.activeCameraPos);
  const activeCameraPos = previewCameraPos === undefined ? sceneCameraPos : previewCameraPos;
  const toggleCameraProjection = useSceneStore(s => s.toggleCameraProjection);
  const currentHdri = useSceneStore(s => s.currentHdri);
  const setHdri = useSceneStore(s => s.setHdri);
  const cameraTarget = useSceneStore(s => s.cameraTarget);
  const setCameraTarget = useSceneStore(s => s.setCameraTarget);
  const currentElevation = useSceneStore(s => s.cameraElevation ?? 45);

  const [isVRActive, setIsVRActive] = useState(false);
  const [isVRSupported, setIsVRSupported] = useState(false);
  const [isImmersiveActive, setIsImmersiveActive] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'xr' in navigator && (navigator as any).xr) {
      (navigator as any).xr.isSessionSupported('immersive-vr')
        .then((supported: boolean) => setIsVRSupported(supported))
        .catch(() => setIsVRSupported(false));
    }
  }, []);

  useEffect(() => {
    const onVR = (e: Event) => {
      const detail = (e as CustomEvent<{ active: boolean }>).detail;
      if (detail && typeof detail.active === 'boolean') setIsVRActive(detail.active);
    };
    const onImmersive = (e: Event) => {
      const detail = (e as CustomEvent<{ active: boolean }>).detail;
      if (detail && typeof detail.active === 'boolean') setIsImmersiveActive(detail.active);
    };
    document.addEventListener('vr-state-change', onVR);
    document.addEventListener('immersive-state-change', onImmersive);
    return () => {
      document.removeEventListener('vr-state-change', onVR);
      document.removeEventListener('immersive-state-change', onImmersive);
    };
  }, []);

  if (hidden) return null;

  const isOrtho = cameraProjection === 'ortho';
  const isTranslate = orbitMouseMode === 'translate';
  const mouseTitle = isTranslate
    ? 'Translation (clic gauche : déplacer, clic droit : tourner) — Passer en Rotation (R / T)'
    : 'Rotation (clic gauche : tourner, clic droit : déplacer) — Passer en Translation (R / T)';
  const isActive = (key: string) => activeCameraPos === key;
  const dispatchCameraMode = (mode: 'toggle-follow' | 'fpv' | 'orbit' | 'reset-orbit' | 'toggle-npc-grid') => {
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

  const renderViewButton = (
    view: { key: string; label: string; shortcut: string; icon: string },
    color: 'cyan' | 'green' | 'purple',
  ) => (
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
      title={`${view.label} — ${isOrtho ? 'Orthographique' : 'Perspective'} (${view.shortcut})`}
      onMouseEnter={event => {
        const rect = event.currentTarget.getBoundingClientRect();
        setHoveredView({
          label: `${view.label} — ${isOrtho ? 'Orthographique' : 'Perspective'} (${view.shortcut})`,
          ...(rect.top > window.innerHeight / 2
            ? { bottom: window.innerHeight - rect.top }
            : { top: rect.bottom }),
        });
      }}
      onMouseLeave={() => setHoveredView(null)}
      onBlur={() => setHoveredView(null)}
      aria-label={`${view.label} — ${isOrtho ? 'Orthographique' : 'Perspective'} (${view.shortcut})`}
      aria-pressed={isActive(view.key)}
    >
      <i className={`bi ${view.icon}`} aria-hidden="true" />
    </button>
  );

  const renderElevationButton = (elev: { angle: number; label: string; shortcut: string; icon: string }) => (
    <button
      key={elev.angle}
      type="button"
      className={`${TOOLBAR_BUTTON_CLASS} ${currentElevation === elev.angle ? 'view-control-bar__btn--green' : 'btn-outline-secondary'}`}
      onClick={() => {
        const currentPos = activeCameraPos ?? 'north';
        dispatchView(currentPos, npcGridActive ? getCharacterGridCameraView().target : undefined, false, elev.angle);
      }}
      title={`${elev.label} (${elev.shortcut})`}
      aria-label={`${elev.label} (${elev.shortcut})`}
      aria-pressed={currentElevation === elev.angle}
    >
      <i className={`bi ${elev.icon}`} aria-hidden="true" />
      <span className="small fw-semibold">{elev.angle}°</span>
    </button>
  );

  const zoomButton = (direction: 'in' | 'out') => (
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
  );

  const perspButton = (
    <button
      type="button"
      className={`${TOOLBAR_BUTTON_CLASS} ${isOrtho ? 'view-control-bar__btn--indigo' : 'view-control-bar__btn--pink'}`}
      onClick={toggleCameraProjection}
      title={`${isOrtho ? 'Basculer en Perspective (3D conique)' : 'Basculer en Orthographique (isométrique)'} (O / P : alterner)`}
      aria-pressed={isOrtho}
    >
      <i className={`bi ${isOrtho ? 'bi-easel2' : 'bi-eye'}`} aria-hidden="true" />
      <span className="fw-semibold">{isOrtho ? 'Ortho' : 'Pers'}</span>
    </button>
  );

  const rotButton = (showCharacterModes || showOrbitControls) && (
    <button
      type="button"
      className={`${TOOLBAR_BUTTON_CLASS} ${isTranslate ? 'view-control-bar__btn--teal' : 'view-control-bar__btn--orange'}`}
      onClick={() => {
        useSceneStore.getState().setOrbitMouseMode(isTranslate ? 'rotate' : 'translate');
      }}
      title={mouseTitle}
      aria-label={mouseTitle}
      aria-pressed={isTranslate}
    >
      <i className={`bi ${isTranslate ? 'bi-arrows-move' : 'bi-arrow-repeat'}`} aria-hidden="true" />
      <span className="fw-semibold">{isTranslate ? 'Trans' : 'Rota'}</span>
    </button>
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

  const cardinalGroup = (
    <div className="btn-group btn-group-sm view-control-bar__group" role="group" aria-label="Directions cardinales">
      {CARDINAL_VIEWS.map((v, i) => renderViewButton(v, i % 2 === 0 ? 'cyan' : 'purple'))}
    </div>
  );

  const elevationGroup = (
    <div className="btn-group btn-group-sm view-control-bar__group" role="group" aria-label="Élévation caméra">
      {ELEVATION_VIEWS.map(renderElevationButton)}
    </div>
  );

  const bar = (
    <>
    {hoverTooltip}
    <div className={`${TOOLBAR_CLASS} ${showCharacterModes ? 'flex-column align-items-stretch view-control-bar--multi-rows' : ''} ${inline ? 'view-control-bar--inline overflow-x-auto' : ''}`} role="toolbar" aria-label="Contrôle des vues">
      <div className="d-flex flex-nowrap align-items-center gap-1 view-control-bar__row">
        {showCharacterModes && (
          <div className="btn-group btn-group-sm view-control-bar__group" role="group" aria-label="Sélection des personnages">
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
            </button>
            <CharacterSelect hideUI={hideUI} />
          </div>
        )}
      </div>
      {showCharacterModes && (
        <div className="d-flex flex-nowrap align-items-center gap-1 view-control-bar__row">
          <div className="btn-group btn-group-sm view-control-bar__group" role="group" aria-label="Suivi caméra du personnage">
            <button
              type="button"
              className={`${TOOLBAR_BUTTON_CLASS} ${cameraMode === 'follow' ? 'view-control-bar__btn--green' : 'btn-outline-secondary'}`}
              onClick={() => dispatchCameraMode('toggle-follow')}
              title="Follow / FPV (F / V : alterner)"
              aria-pressed={cameraMode === 'follow'}
            ><span className="fw-semibold">Follow</span></button>
            {isVRSupported && (
              <button
                type="button"
                onClick={() => {
                  document.dispatchEvent(new CustomEvent('toggle-vr'));
                }}
                className={`${TOOLBAR_BUTTON_CLASS} ${isVRActive ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
                title="Mode Réalité Virtuelle (WebXR)"
              >
                <i className="bi bi-headset-vr" aria-hidden="true" />
                <span className="fw-semibold">{isVRActive && <i className="bi bi-x-lg me-1" aria-hidden="true" />}VR</span>
              </button>
            )}
            {isMobile && (
              <button
                type="button"
                onClick={() => {
                  document.dispatchEvent(new CustomEvent('toggle-immersive'));
                }}
                className={`${TOOLBAR_BUTTON_CLASS} ${isImmersiveActive ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
                title="Mode Immersif Gyroscope (Plein écran)"
              >
                <i className="bi bi-eye-fill" aria-hidden="true" />
                <span className="fw-semibold">{isImmersiveActive ? 'Quitter' : 'Immer'}</span>
              </button>
            )}
            <button
              type="button"
              className={`${TOOLBAR_BUTTON_CLASS} ${cameraMode === 'fpv' ? 'view-control-bar__btn--blue' : 'btn-outline-secondary'}`}
              onClick={() => dispatchCameraMode('fpv')}
              title="FPV / Follow (V / F : alterner)"
              aria-pressed={cameraMode === 'fpv'}
            ><i className="bi bi-eye-fill" aria-hidden="true" /><span className="fw-semibold">FPV</span></button>
          </div>
          <button
            type="button"
            className={`${TOOLBAR_BUTTON_CLASS} ${cameraTarget === 'studio' && cameraMode === 'orbit' ? 'view-control-bar__btn--blue' : 'btn-outline-secondary'}`}
            onClick={() => {
              setCameraTarget('studio');
              dispatchCameraMode('reset-orbit');
            }}
            title="Centrer la caméra sur l'appartement / studio (Alt+O, orbit)"
            aria-label="Centrer la caméra sur l'appartement / studio (Alt+O, orbit)"
            aria-pressed={cameraTarget === 'studio' && cameraMode === 'orbit'}
          >
            <i className="bi bi-building" aria-hidden="true" />
            <span className="fw-semibold">Apt</span>
          </button>
          {perspButton}
          {rotButton}
          {animalCameraActive && (
            <button type="button" className={`${TOOLBAR_BUTTON_CLASS} btn-outline-danger`} onClick={() => dispatchCameraMode('orbit')} title="Quitter la caméra de l’animal" aria-label="Quitter la caméra de l’animal">
              <i className="bi bi-box-arrow-right" aria-hidden="true" /><span className="fw-semibold">Quitter</span>
            </button>
          )}
        </div>
      )}
      <div className="d-flex flex-nowrap align-items-center gap-1 view-control-bar__row">
        {zoomButton('in')}
        {cardinalGroup}
        {!showCharacterModes && perspButton}
      </div>
      <div className="d-flex flex-nowrap align-items-center gap-1 view-control-bar__row">
        {zoomButton('out')}
        {elevationGroup}
        {!showCharacterModes && rotButton}
      </div>
    </div>
    </>
  );

  if (inline) {

    const inlineRow1 = (
      <div className="d-flex flex-nowrap align-items-center gap-1 view-control-bar__row">
        {zoomButton('in')}
        {cardinalGroup}
        {perspButton}
        {showMirrorsHD && <PresetButton hideUI={hideUI} />}
        {beforeAmbianceActions}
      </div>
    );

    const inlineRow2 = (
      <div className="d-flex flex-nowrap align-items-center gap-1 view-control-bar__row">
        {zoomButton('out')}
        {elevationGroup}
        {rotButton}
        {toolbarActions}
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
        {afterToolbarActions}
      </div>
    );

    const inventoryRow = (
      <div className="d-flex flex-nowrap align-items-center gap-1 view-control-bar__row">
        {zoomButton('out')}
        {zoomButton('in')}
        {cardinalGroup}
        {elevationGroup}
        {rotButton}
        {perspButton}
        {showMirrorsHD && <PresetButton hideUI={hideUI} />}
        {beforeAmbianceActions}
        {toolbarActions}
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
      </div>
    );

    return (
      <div className={`view-control-bar-inline d-flex flex-column align-items-center ${children ? 'gap-2 px-1 py-0' : 'gap-0 px-2 py-2'}`}>
        {hoverTooltip}
        <div className={`${TOOLBAR_CLASS} ${inventoryLayout ? 'view-control-bar--inventory-single-row' : 'flex-column align-items-stretch view-control-bar--multi-rows'} view-control-bar--inline overflow-x-auto`} role="toolbar" aria-label="Contrôle des vues">
          {inventoryLayout ? inventoryRow : <>{inlineRow1}{inlineRow2}</>}
        </div>
        {children && <div className="w-100">{children}</div>}
      </div>
    );
  }

  return (
    <div className={`view-control-bar-dock ${children ? 'view-control-bar-dock--stacked gap-2' : ''}`} style={{ position: 'fixed', zIndex: 1000, ...positionStyle, ...mobilePositionStyle, ...mobileDockOffset }}>
      {directionalControls}
      {activeCameraPos && (
        <span className="badge text-bg-dark bg-opacity-75 view-control-bar-dock__view-label">
          {CAMERA_SHORTCUT_VIEWS.find(view => view.key === activeCameraPos)?.label ?? activeCameraPos}
          {' · '}{isOrtho ? 'Orthographique' : 'Perspective'}
        </span>
      )}
      {bar}
      {children && <div className="view-control-bar-dock__content mw-100">{children}</div>}
    </div>
  );
}
