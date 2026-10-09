import { TOOLBAR_BUTTON_CLASS } from './toolbarStyles';
/**
 * ToolbarPanelsRow.tsx
 *
 * Première ligne de la barre de contrôle contenant les popovers HTML natifs
 * (Plan 2D, Perf, Profil, Inventaire, Calques, Interactif, PNJ, NPCs).
 *
 * Composant HTML pur rendu hors du Canvas R3F.
 */
import { useState, useEffect, useRef } from 'react';
import { solarPosition } from '@features/scene/SunLight';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useSceneStore } from './store/useSceneStore';
import { HDRI_LIST } from './hdriConfig';
import { WIGS_ITEMS } from '../inventory/inventoryData';

import {
  ALL_HAIR_COLORS,
  type ToolbarPanelsProps,
} from './sidepanel/types';
import { PanelPopover } from './sidepanel/PanelPopover';
import { CvModal, type CvType } from './sidepanel/modals/CvModal';
import { LayersSection } from './sidepanel/sections/LayersSection';
import { InteractiveSection } from './sidepanel/sections/InteractiveSection';
import { CharacterSection } from './sidepanel/sections/CharacterSection';
import { ProfileSection } from './sidepanel/sections/ProfileSection';
import { DevToolsGroups } from './DevToolsOverlay';
import { Minimap } from './Minimap';

export type { ToolbarPanelsProps };

const SUN_LAT = parseFloat(import.meta.env.VITE_STUDIO_LAT ?? '48.828');
const SUN_LNG = parseFloat(import.meta.env.VITE_STUDIO_LNG ?? '2.376');

export function ToolbarPanelsRow({
  layers,
  onToggleLayer,
  lidarMode,
  onCycleLidar,
  lidarOpacity,
  onToggleLidarOpacity,
  buildAnimMatrix = false,
  onStartBuildAnimMatrix,
  onStopBuildAnim,
  animDurations = {},
  planeModel = 'origami',
  onSetPlaneModel,
  autopilotVisible = false,
  onToggleAutopilot,
  showLandingStrips = false,
  onToggleLandingStrips,
  hideUI = false,
  onOpenInventory,
  prefix,
}: ToolbarPanelsProps) {
  const isMobile = useIsMobile();
  const [showCvModal, setShowCvModal] = useState(false);
  const [selectedCvType, setSelectedCvType] = useState<CvType>('devops');
  const [sunInfo, setSunInfo] = useState<{ time: string; el: number } | null>(null);
  const [isVRActive, setIsVRActive] = useState(false);
  const [isVRSupported, setIsVRSupported] = useState(false);
  const [isImmersiveActive, setIsImmersiveActive] = useState(false);
  const currentHdri = useSceneStore(state => state.currentHdri);
  const setHdri = useSceneStore(state => state.setHdri);
  const setCvModalOpen = useSceneStore(state => state.setCvModalOpen);
  const npcGridActive = useSceneStore(state => state.layers.characterGrid);

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

  const handleOpenCv = (type: CvType = 'devops') => {
    setSelectedCvType(type);
    setShowCvModal(true);
    setCvModalOpen(true);
  };

  const handleCloseCv = () => {
    setShowCvModal(false);
    setCvModalOpen(false);
  };

  useEffect(() => {
    if (!layers.realSun) { setSunInfo(null); return; }
    const update = () => {
      const now = new Date();
      const { elevation } = solarPosition(SUN_LAT, SUN_LNG, now);
      setSunInfo({
        time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        el: Math.round(elevation),
      });
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [layers.realSun]);

  const [globalHaircut, setGlobalHaircut] = useState<string>('original');
  const [globalHairColor, setGlobalHairColor] = useState<string>('rose');
  const lastWigRef = useRef<string>('hair_101');

  const handleRandomHairColor = () => {
    const otherColors = ALL_HAIR_COLORS.filter((c: string) => c !== globalHairColor);
    const newColor = otherColors[Math.floor(Math.random() * otherColors.length)];
    setGlobalHairColor(newColor);
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircolor', value: newColor } }));
  };

  const handleRandomHaircut = () => {
    const allHaircuts = ['original', ...WIGS_ITEMS.map(w => w.id)];
    const otherHaircuts = allHaircuts.filter(h => h !== globalHaircut);
    const newHaircut = otherHaircuts[Math.floor(Math.random() * otherHaircuts.length)];
    setGlobalHaircut(newHaircut);
    if (newHaircut !== 'original') lastWigRef.current = newHaircut;
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircut', value: newHaircut } }));
  };

  const handleRandomHaircutAndColor = () => {
    handleRandomHaircut();
    handleRandomHairColor();
  };

  const handleRandomHdri = () => {
    const otherHdris = HDRI_LIST.filter(h => h.id !== currentHdri);
    const next = otherHdris[Math.floor(Math.random() * otherHdris.length)];
    if (next) {
      setHdri(next.id);
    }
  };

  useEffect(() => {
    const onToggle = (e: any) => {
      if (e.detail?.key === 'lara-haircut') {
        if (e.detail.value) setGlobalHaircut(e.detail.value);
      }
    };
    document.addEventListener('furniture-toggle', onToggle);
    return () => document.removeEventListener('furniture-toggle', onToggle);
  }, []);

  useEffect(() => {
    const handleToggleHaircut = () => {
      setGlobalHaircut(prev => {
        if (prev === 'original') {
          const wigIds = WIGS_ITEMS.map(w => w.id);
          const next = wigIds[Math.floor(Math.random() * wigIds.length)];
          lastWigRef.current = next;
          document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircut', value: next } }));
          return next;
        } else {
          lastWigRef.current = prev;
          document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'lara-haircut', value: 'original' } }));
          return 'original';
        }
      });
    };
    document.addEventListener('toggle-lara-haircut', handleToggleHaircut as any);
    return () => document.removeEventListener('toggle-lara-haircut', handleToggleHaircut as any);
  }, []);

  // En-têtes boutons
  const activeHdriItem = HDRI_LIST.find(h => h.id === currentHdri);
  const activeHdriName = activeHdriItem?.name ?? currentHdri;

  const layersHeaderButtons = (
    <div className="d-flex align-items-center gap-1 overflow-hidden" style={{ minWidth: 0 }} onClick={e => e.stopPropagation()}>
      <span
        className="text-dark fw-medium text-end text-truncate flex-grow-1 small"
        title={activeHdriName}
      >
        {activeHdriName}
      </span>
      <button
        type="button"
        className="btn btn-sm btn-warning text-dark p-0 px-1 border-0 shadow-sm fw-bold flex-shrink-0 small rounded"
        title="Changer aléatoirement d'ambiance HDRI (Touche 5)"
        onClick={(e) => {
          e.stopPropagation();
          handleRandomHdri();
        }}
      >
        <i className="bi bi-shuffle" aria-hidden="true" />
      </button>
    </div>
  );

  const personnageHeaderButtons = (
    <div className="d-flex align-items-center gap-1" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        className="btn btn-sm btn-warning text-dark p-0 px-1 border-0 shadow-sm fw-bold small rounded"
        title="Coupe et couleur de cheveux aléatoires"
        onClick={(e) => {
          e.stopPropagation();
          handleRandomHaircutAndColor();
        }}
      >
        <i className="bi bi-shuffle" aria-hidden="true" />
      </button>
    </div>
  );

  const profileHeaderButtons = (
    <div className="d-flex align-items-center gap-1" onClick={e => e.stopPropagation()}>
      <a
        href="https://github.com/dinatih"
        target="_blank"
        rel="noreferrer"
        className="btn btn-sm btn-dark text-white p-0 border-0 shadow-sm d-flex align-items-center justify-content-center rounded"
        style={{ height: '22px', width: '24px' }}
        title="Voir mon profil GitHub"
      >
        <i className="bi bi-github"></i>
      </a>
      <a
        href="https://www.linkedin.com/in/dinatih/"
        target="_blank"
        rel="noreferrer"
        className="btn btn-sm btn-primary text-white p-0 border-0 shadow-sm d-flex align-items-center justify-content-center rounded"
        style={{ height: '22px', width: '24px', background: '#0a66c2', borderColor: '#0a66c2' }}
        title="Voir mon profil LinkedIn"
      >
        <i className="bi bi-linkedin"></i>
      </a>
      <button
        type="button"
        className="btn btn-sm btn-danger text-white px-2 border-0 shadow-sm fw-bold d-flex align-items-center gap-1 justify-content-center small rounded"
        style={{ height: '22px', whiteSpace: 'nowrap' }}
        title="Afficher mes CVs (Ingénieur DevOps / Admin Systèmes)"
        onClick={(e) => {
          e.stopPropagation();
          handleOpenCv('devops');
        }}
      >
        <i className="bi bi-file-earmark-person"></i>
        <span>C.V.</span>
      </button>
      <a
        href="https://dinatih.org/visualizer/"
        target="_blank"
        rel="noreferrer"
        className="btn btn-sm btn-dark text-white py-0 px-1 border-0 shadow-sm d-flex align-items-center justify-content-center rounded"
        title="Ouvrir le visualiseur du code"
        aria-label="Ouvrir le visualiseur du code"
      >
        <i className="bi bi-git" aria-hidden="true"></i>
      </a>
    </div>
  );

  const visitorCounter = (
    <div className="d-flex flex-column align-items-center rounded bg-light p-2 flex-shrink-0">
      <span className="small text-dark fw-semibold">Visites du site</span>
      <iframe
        src="https://dinatih.goatcounter.com/counter/TOTAL.html?no_branding=1"
        title="Nombre total de visites du site"
        width="200"
        height="60"
        className="border-0 mw-100"
      />
    </div>
  );

  const profileSectionContent = (
    <>
      <ProfileSection
        isMobile={isMobile}
        onOpenCv={handleOpenCv}
      />
      {visitorCounter}
    </>
  );

  const layersSectionContent = (
    <LayersSection
      layers={layers}
      onToggleLayer={onToggleLayer}
      isMobile={isMobile}
      lidarMode={lidarMode}
      onCycleLidar={onCycleLidar}
      lidarOpacity={lidarOpacity}
      onToggleLidarOpacity={onToggleLidarOpacity}
      sunInfo={sunInfo}
      handleRandomHdri={handleRandomHdri}
    />
  );

  const interactiveSectionContent = (
    <InteractiveSection
      isMobile={isMobile}
      planeModel={planeModel}
      onSetPlaneModel={onSetPlaneModel}
      autopilotVisible={autopilotVisible}
      onToggleAutopilot={onToggleAutopilot}
      showLandingStrips={showLandingStrips}
      onToggleLandingStrips={onToggleLandingStrips}
      buildAnimMatrix={buildAnimMatrix}
      onStartBuildAnimMatrix={onStartBuildAnimMatrix}
      onStopBuildAnim={onStopBuildAnim}
      animDurations={animDurations}
    />
  );

  const characterSectionContent = (
    <CharacterSection
      layers={layers}
      onToggleLayer={onToggleLayer}
      isMobile={isMobile}
      globalHairColor={globalHairColor}
      setGlobalHairColor={setGlobalHairColor}
      globalHaircut={globalHaircut}
      setGlobalHaircut={setGlobalHaircut}
      lastWigRef={lastWigRef}
      handleRandomHairColor={handleRandomHairColor}
      handleRandomHaircut={handleRandomHaircut}
    />
  );

  return (
    <>
      <div className="d-flex flex-nowrap align-items-center gap-1 view-control-bar__row">
        {prefix}
        {/* VR WebXR (si supporté par l'appareil) */}
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

        {/* Mode immersif gyroscopique sur mobile */}
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
            <span className="fw-semibold">{isImmersiveActive ? 'Quitter' : 'Immersif'}</span>
          </button>
        )}

        <div className="btn-group btn-group-sm view-control-bar__group" role="group" aria-label="Panneaux principaux">
          {/* 1. Plan */}
          <PanelPopover
            icon="bi-map-fill"
            title="Plan"
            hideUI={hideUI}
            manual
          >
            <Minimap embedded showGroup={false} />
          </PanelPopover>

          {/* 2. Perf */}
          <PanelPopover
            icon="bi-bar-chart-fill"
            title="Performances & Stats"
            hideUI={hideUI}
            manual
          >
            <DevToolsGroups Group={({ children }: any) => <>{children}</>} compact headerless />
          </PanelPopover>

          {/* 3. CV */}
          <PanelPopover
            icon="bi-briefcase-fill"
            label="CV"
            title="Profil & C.V."
            headerExtra={profileHeaderButtons}
            hideUI={hideUI}
          >
            {profileSectionContent}
          </PanelPopover>
        </div>
      </div>

      <div className="d-flex flex-nowrap align-items-center gap-1 view-control-bar__row">
        <div className="btn-group btn-group-sm view-control-bar__group" role="group" aria-label="Panneaux secondaires">
          {/* 4. Calques */}
          <PanelPopover
            icon="bi-layers-fill"
            label="Calq"
            title="Calques & Affichage"
            headerExtra={layersHeaderButtons}
            hideUI={hideUI}
          >
            {layersSectionContent}
          </PanelPopover>

        {/* 5. Interactif */}
        <PanelPopover
          icon="bi-controller"
          label="Inter"
          title="Objets interactifs"
          hideUI={hideUI}
        >
          {interactiveSectionContent}
        </PanelPopover>

        {/* 6. Config User */}
        <PanelPopover
          icon={
            <span className="d-inline-flex align-items-center gap-1">
              <i className="bi bi-person-fill" aria-hidden="true" />
              <i className="bi bi-gear-fill" aria-hidden="true" />
            </span>
          }
          title="Configuration utilisateur"
          headerExtra={personnageHeaderButtons}
          hideUI={hideUI}
        >
          {characterSectionContent}
        </PanelPopover>

        {/* 7. Grilles & Inventaire */}
        <PanelPopover
          icon="bi-grid-3x3-gap-fill"
          label="Gril"
          title="Grilles & Inventaire"
          hideUI={hideUI}
          active={npcGridActive || Boolean(layers.inventoryGrid)}
        >
          <div className="d-flex flex-column gap-1.5 p-1">
            {/* 1. Inventaire */}
            <button
              type="button"
              className="btn btn-sm btn-light border d-flex align-items-center justify-content-between p-2 text-dark text-start"
              onClick={(e) => {
                (e.currentTarget.closest('[popover]') as HTMLElement | null)?.hidePopover();
                onOpenInventory?.();
              }}
              title="Ouvrir l'inventaire (I)"
            >
              <span className="d-flex align-items-center gap-2">
                <i className="bi bi-box-seam-fill text-primary fs-6" aria-hidden="true" />
                <span className="fw-semibold">Inventaire</span>
              </span>
              <span className="badge bg-secondary-subtle text-secondary small">I</span>
            </button>

            {/* 2. Grille/Vitrine Personnages */}
            <button
              type="button"
              className={`btn btn-sm border d-flex align-items-center justify-content-between p-2 text-start ${
                npcGridActive ? 'btn-primary text-white shadow-sm' : 'btn-light text-dark'
              }`}
              onClick={() => {
                document.dispatchEvent(new CustomEvent('camera-mode', { detail: 'toggle-npc-grid' }));
              }}
              title="Afficher ou quitter la grille / vitrine des PNJ (G)"
              aria-pressed={npcGridActive}
            >
              <span className="d-flex align-items-center gap-2">
                <i className={`bi bi-people-fill fs-6 ${npcGridActive ? 'text-white' : 'text-primary'}`} aria-hidden="true" />
                <span className="fw-semibold">Grille/Vitrine Personnages</span>
              </span>
              <div className="d-flex align-items-center gap-1">
                {npcGridActive && <i className="bi bi-check-lg" aria-hidden="true" />}
                <span className={`badge ${npcGridActive ? 'bg-white bg-opacity-25 text-white' : 'bg-secondary-subtle text-secondary'} small`}>G</span>
              </div>
            </button>

            {/* 3. Grille inventaire */}
            <button
              type="button"
              className={`btn btn-sm border d-flex align-items-center justify-content-between p-2 text-start ${
                layers.inventoryGrid ? 'btn-primary text-white shadow-sm' : 'btn-light text-dark'
              }`}
              onClick={() => {
                if (onToggleLayer) onToggleLayer('inventoryGrid');
                else useSceneStore.getState().toggleLayer?.('inventoryGrid');
              }}
              title="Afficher ou masquer la grille des objets d'inventaire (Alt+I)"
              aria-pressed={Boolean(layers.inventoryGrid)}
            >
              <span className="d-flex align-items-center gap-2">
                <i className={`bi bi-box-seam fs-6 ${layers.inventoryGrid ? 'text-white' : 'text-primary'}`} aria-hidden="true" />
                <span className="fw-semibold">Grille inventaire</span>
              </span>
              <div className="d-flex align-items-center gap-1">
                {layers.inventoryGrid && <i className="bi bi-check-lg" aria-hidden="true" />}
                <span className={`badge ${layers.inventoryGrid ? 'bg-white bg-opacity-25 text-white' : 'bg-secondary-subtle text-secondary'} small`}>Alt+I</span>
              </div>
            </button>
          </div>
        </PanelPopover>
      </div>
    </div>

    {showCvModal && <CvModal initialCv={selectedCvType} onClose={handleCloseCv} />}
    </>
  );
}
