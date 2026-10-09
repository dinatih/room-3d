import './ViewControlBar.scss';
import { TOOLBAR_CLASS, TOOLBAR_BUTTON_CLASS } from './toolbarStyles';
import { useEffect, useState, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
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
  /** Vue / position de la caméra de l'aperçu ; null pour une caméra libre. */
  activeCameraPos?: string | null;
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
  activeCameraPos: previewCameraPos,
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
  const sceneCameraPos = useSceneStore(s => s.activeCameraPos);
  const activeCameraPos = previewCameraPos === undefined ? sceneCameraPos : previewCameraPos;
  const toggleCameraProjection = useSceneStore(s => s.toggleCameraProjection);
  const currentHdri = useSceneStore(s => s.currentHdri);
  const setHdri = useSceneStore(s => s.setHdri);
  const mirrorsHD = useSceneStore(s => s.layers.mirrorsHD);
  const cameraViewMarkers = useSceneStore(s => s.layers.cameraViewMarkers);
  const toggleLayer = useSceneStore(s => s.toggleLayer);
  const cameraTarget = useSceneStore(s => s.cameraTarget);
  const setCameraTarget = useSceneStore(s => s.setCameraTarget);

  if (hidden) return null;

  const isOrtho = cameraProjection === 'ortho';
  const isTranslate = orbitMouseMode === 'translate';
  const mouseTitle = isTranslate
    ? 'Translation (clic gauche : déplacer, clic droit : tourner) — Passer en Rotation (R / T)'
    : 'Rotation (clic gauche : tourner, clic droit : déplacer) — Passer en Translation (R / T)';
  const isActive = (key: string) => activeCameraPos === key;
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
  );

  const frontView = ORTHO_VIEWS.find(v => v.key === 'front')!;
  const backView = ORTHO_VIEWS.find(v => v.key === 'back')!;
  const leftView = ORTHO_VIEWS.find(v => v.key === 'left')!;
  const rightView = ORTHO_VIEWS.find(v => v.key === 'right')!;
  const topView = EXTRA_VIEWS.find(v => v.key === 'top')!;
  const bottomView = EXTRA_VIEWS.find(v => v.key === 'bottom')!;



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
      <span className="fw-semibold">{isTranslate ? 'Trans' : 'Rot'}</span>
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

  const hideUIButton = showCharacterModes && (
    <button
      type="button"
      className={`${TOOLBAR_BUTTON_CLASS} btn-outline-secondary`}
      onClick={onToggleHideUI}
      title={`${hideUI ? 'Afficher' : 'Masquer'} l'interface 2D (0)`}
      aria-label={`${hideUI ? 'Afficher' : 'Masquer'} l'interface 2D (0)`}
    >
      <i className={`bi ${hideUI ? 'bi-eye' : 'bi-eye-slash'}`} aria-hidden="true" />
    </button>
  );

  const hdButton = (showCharacterModes || showMirrorsHD) && (
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
  );

  const bar = (
    <>
    {hoverTooltip}
    <div className={`${TOOLBAR_CLASS} ${showCharacterModes ? 'flex-column align-items-stretch view-control-bar--multi-rows' : ''} ${inline ? 'view-control-bar--inline overflow-x-auto' : ''}`} role="toolbar" aria-label="Contrôle des vues">
      {panelControls && (
        isValidElement(panelControls)
          ? cloneElement(panelControls as ReactElement<any>, { prefix: <>{hideUIButton}{hdButton}</> })
          : (
            <div className="d-flex flex-nowrap align-items-center gap-1 view-control-bar__row">
              {hideUIButton}
              {hdButton}
              {panelControls}
            </div>
          )
      )}
      <div className="d-flex flex-nowrap align-items-center gap-1 view-control-bar__row">
        {!panelControls && (
          <>
            {hideUIButton}
            {hdButton}
          </>
        )}
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
            <button
              type="button"
              className={`${TOOLBAR_BUTTON_CLASS} ${cameraMode === 'fpv' ? 'view-control-bar__btn--blue' : 'btn-outline-secondary'}`}
              onClick={() => dispatchCameraMode('fpv')}
              title="FPV / Follow (V / F : alterner)"
              aria-pressed={cameraMode === 'fpv'}
            ><i className="bi bi-eye-fill" aria-hidden="true" /><span className="fw-semibold">FPV</span></button>
            <button
              type="button"
              className={`${TOOLBAR_BUTTON_CLASS} ${cameraTarget === 'studio' && cameraMode === 'orbit' ? 'view-control-bar__btn--blue' : 'btn-outline-secondary'}`}
              onClick={() => {
                setCameraTarget('studio');
                dispatchCameraMode('orbit');
              }}
              title="Centrer la caméra sur l'appartement / studio (Alt+O)"
              aria-label="Centrer la caméra sur l'appartement / studio (Alt+O)"
              aria-pressed={cameraTarget === 'studio' && cameraMode === 'orbit'}
            >
              <i className="bi bi-building" aria-hidden="true" />
              <span className="fw-semibold">Apt</span>
            </button>
          </div>
          {animalCameraActive && (
            <button type="button" className={`${TOOLBAR_BUTTON_CLASS} btn-outline-danger`} onClick={() => dispatchCameraMode('orbit')} title="Quitter la caméra de l’animal" aria-label="Quitter la caméra de l’animal">
              <i className="bi bi-box-arrow-right" aria-hidden="true" /><span className="fw-semibold">Quitter</span>
            </button>
          )}
        </div>
      )}
      <div className="d-flex flex-nowrap align-items-center gap-1 view-control-bar__row">
        {zoomButton('in')}
        <div className="btn-group btn-group-sm view-control-bar__group" role="group" aria-label="Vues orthogonales et dessus">
          {renderViewButton(frontView, 'cyan')}
          {renderViewButton(backView, 'cyan')}
          {renderViewButton(leftView, 'cyan')}
          {renderViewButton(rightView, 'cyan')}
          {renderViewButton(topView, 'green')}
        </div>
        {perspButton}
      </div>
      <div className="d-flex flex-nowrap align-items-center gap-1 view-control-bar__row">
        {zoomButton('out')}
        <div className="btn-group btn-group-sm view-control-bar__group" role="group" aria-label="Vues diagonales et dessous">
          {ISO_VIEWS.map(v => renderViewButton(v, 'purple'))}
          {renderViewButton(bottomView, 'green')}
        </div>
        {rotButton}
      </div>
      <div className="d-flex flex-nowrap align-items-center gap-1 view-control-bar__row">
        {showCharacterModes && (
          <button
            type="button"
            className={`${TOOLBAR_BUTTON_CLASS} btn-outline-secondary view-control-bar__outline--orange`}
            onClick={onEnterFlight}
            title="Activer le mode avion (Alt+V)"
            aria-label="Activer le mode avion (Alt+V)"
          >
            <i className="bi bi-airplane-fill" aria-hidden="true" />
          </button>
        )}
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
        {toolbarActions}
        {showCharacterModes && !isMobile && (
          <div className="d-flex gap-1 view-control-bar__group" role="group" aria-label="Actions de la scène">
            <button type="button" className={`${TOOLBAR_BUTTON_CLASS} btn-outline-secondary view-control-bar__outline--cyan`} onClick={() => useSceneStore.getState().setPhotoModeOpen(true)} title="Ouvrir le mode photo Raytracing (F10)" aria-label="Ouvrir le mode photo Raytracing (F10)">
              <i className="bi bi-camera-fill" aria-hidden="true" />
            </button>
            <button type="button" className={`${TOOLBAR_BUTTON_CLASS} btn-outline-secondary`} onClick={() => window.dispatchEvent(new Event('open-shortcuts-modal'))} title="Afficher tous les raccourcis clavier" aria-label="Afficher tous les raccourcis clavier">
              <i className="bi bi-keyboard-fill" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );

  if (inline) {

    const inlineRow1 = (
      <div className="d-flex flex-nowrap align-items-center gap-1 view-control-bar__row">
        {zoomButton('in')}
        <div className="btn-group btn-group-sm view-control-bar__group" role="group" aria-label="Vues orthogonales et dessus">
          {renderViewButton(frontView, 'cyan')}
          {renderViewButton(backView, 'cyan')}
          {renderViewButton(leftView, 'cyan')}
          {renderViewButton(rightView, 'cyan')}
          {renderViewButton(topView, 'green')}
        </div>
        {perspButton}
        {showMirrorsHD && hdButton}
        {beforeAmbianceActions}
      </div>
    );

    const inlineRow2 = (
      <div className="d-flex flex-nowrap align-items-center gap-1 view-control-bar__row">
        {zoomButton('out')}
        <div className="btn-group btn-group-sm view-control-bar__group" role="group" aria-label="Vues diagonales et dessous">
          {ISO_VIEWS.map(v => renderViewButton(v, 'purple'))}
          {renderViewButton(bottomView, 'green')}
        </div>
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
      </div>
    );

    return (
      <div className={`view-control-bar-inline d-flex flex-column align-items-center ${children ? 'gap-2 px-1 py-0' : 'gap-0 px-2 py-2'}`}>
        {hoverTooltip}
        <div className={`${TOOLBAR_CLASS} flex-column align-items-stretch view-control-bar--multi-rows view-control-bar--inline overflow-x-auto`} role="toolbar" aria-label="Contrôle des vues">
          {inlineRow1}
          {inlineRow2}
        </div>
        {children && <div className="w-100">{children}</div>}
      </div>
    );
  }

  return (
    <div className={`view-control-bar-dock ${children ? 'view-control-bar-dock--stacked gap-2' : ''}`} style={{ position: 'fixed', zIndex: 1000, ...positionStyle, ...mobilePositionStyle, ...mobileDockOffset }}>
      {activeCameraPos && (
        <span className="badge text-bg-dark bg-opacity-75 view-control-bar-dock__view-label">
          {activeCameraPos === 'iso-se' || activeCameraPos === 's-e' ? 'ISO Sud-Est'
            : activeCameraPos === 'iso-sw' || activeCameraPos === 's-o' ? 'ISO Sud-Ouest'
            : activeCameraPos === 'iso-ne' || activeCameraPos === 'n-e' ? 'ISO Nord-Est'
            : activeCameraPos === 'iso-nw' || activeCameraPos === 'n-o' ? 'ISO Nord-Ouest'
            : activeCameraPos === 'front' ? 'Face'
            : activeCameraPos === 'back' ? 'Arrière'
            : activeCameraPos === 'left' ? 'Gauche'
            : activeCameraPos === 'right' ? 'Droite'
            : activeCameraPos === 'perspective' ? 'Perspective'
            : activeCameraPos === 'top' ? 'Dessus'
            : activeCameraPos === 'bottom' ? 'Dessous'
            : activeCameraPos}
        </span>
      )}
      {bar}
      {children && <div className="view-control-bar-dock__content mw-100">{children}</div>}
    </div>
  );
}
