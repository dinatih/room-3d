import { TOOLBAR_CLASS, TOOLBAR_BUTTON_CLASS } from './toolbarStyles';
/**
 * SidePanel.tsx
 *
 * Desktop : panneau accordéon à gauche (sections Calques / Interactif / Personnage / Profil).
 * Mobile  : tab bar fixe en bas qui ouvre un bottom-sheet plein-largeur.
 *
 * Composant HTML pur rendu HORS du Canvas R3F. Dispatche des events custom
 * écoutés par CameraController et le reste de la scène.
 * Styled using Bootstrap 5.3 and glassmorphism.
 */
import { useState, useEffect, useRef } from 'react';
import { solarPosition } from '@features/scene/SunLight';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useSceneStore } from './store/useSceneStore';
import { HDRI_LIST } from './hdriConfig';
import { WIGS_ITEMS } from '../inventory/inventoryData';

import {
  TABS, ALL_HAIR_COLORS,
  type FurnitureState, type LayerState, type GroundType, type SidePanelProps,
  type LidarMode, type TabKey,
} from './sidepanel/types';
import { Group } from './sidepanel/Group';
import { CvModal, type CvType } from './sidepanel/modals/CvModal';
import { LayersSection } from './sidepanel/sections/LayersSection';
import { InteractiveSection } from './sidepanel/sections/InteractiveSection';
import { CharacterSection } from './sidepanel/sections/CharacterSection';
import { ProfileSection } from './sidepanel/sections/ProfileSection';
import { DevToolsGroups } from './DevToolsOverlay';
import { Minimap } from './Minimap';

export type {
  FurnitureState,
  LayerState,
  GroundType,
  SidePanelProps,
  LidarMode,
};
export { Group } from './sidepanel/Group';
export { ANIM_CATEGORIES, getAnimCategory } from './CharacterAnimSelector';

const SUN_LAT = parseFloat(import.meta.env.VITE_STUDIO_LAT ?? '48.828');
const SUN_LNG = parseFloat(import.meta.env.VITE_STUDIO_LNG ?? '2.376');

export function SidePanel({
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
}: SidePanelProps) {
  const isMobile = useIsMobile();
  const [showCvModal, setShowCvModal] = useState(false);
  const [selectedCvType, setSelectedCvType] = useState<CvType>('devops');
  const [sunInfo, setSunInfo] = useState<{ time: string; el: number } | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>(null);
  const [isVRActive, setIsVRActive] = useState(false);
  const [isVRSupported, setIsVRSupported] = useState(false);
  const [isImmersiveActive, setIsImmersiveActive] = useState(false);
  const currentHdri = useSceneStore(state => state.currentHdri);
  const setHdri = useSceneStore(state => state.setHdri);
  const setCvModalOpen = useSceneStore(state => state.setCvModalOpen);

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

  // Ferme le sheet via Escape sur mobile
  useEffect(() => {
    if (!isMobile || !activeTab) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveTab(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobile, activeTab]);

  // En-têtes boutons pour desktop et mobile
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

  // Instanciations des sections
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

  // ── Rendu mobile : tab bar bottom + sheet ───────────────────────────────────
  if (isMobile) {
    const sheetOpen = activeTab !== null && !hideUI;
    const sheetTitle: Record<Exclude<TabKey, null>, string> = {
      profile: 'Profil & CV',
      layers: 'Calques',
      personnage: 'PNJ',
      perf: 'Perf',
      plan2d: 'Plan 2D',
      interactif: 'Interactif',
    };
    const sheetBody: Record<Exclude<TabKey, null>, React.ReactNode> = {
      profile: profileSectionContent,
      layers: layersSectionContent,
      interactif: interactiveSectionContent,
      personnage: characterSectionContent,
      perf: <DevToolsGroups Group={Group} compact headerless />,
      plan2d: <Minimap embedded showGroup={false} />,
    };
    const activeTabConfig = TABS.find(tab => tab.key === activeTab);

    return (
      <>
        {sheetOpen && (
          <div
            onClick={() => setActiveTab(null)}
            className="position-fixed top-0 bottom-0 start-0 end-0 bg-dark bg-opacity-50"
            style={{ backdropFilter: 'blur(2px)', zIndex: 1001 }}
          />
        )}

        {sheetOpen && activeTab !== null && (
          <div
            className="position-fixed start-0 end-0 border-top shadow-lg d-flex flex-column rounded-top-4"
            style={{
              bottom: 'calc(4.25rem + env(safe-area-inset-bottom))',
              maxHeight: 'calc(100vh - 120px)',
              zIndex: 1002,
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(8px)',
            }}
            onWheel={e => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom text-dark">
              <span className="fw-bold d-flex align-items-center gap-2"><i className={`bi ${activeTabConfig?.icon}`} aria-hidden="true" />{sheetTitle[activeTab]}</span>
              <div className="d-flex align-items-center gap-2">
                {activeTab === 'profile' && profileHeaderButtons}
                {activeTab === 'layers' && layersHeaderButtons}
                {activeTab === 'personnage' && personnageHeaderButtons}
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setActiveTab(null)}
                />
              </div>
            </div>

            <div className="overflow-auto p-2" style={{ flex: 1 }}>
                {Object.entries(sheetBody).map(([k, content]) => (
                  <div key={k} style={{ display: activeTab === k ? 'block' : 'none' }}>
                    {content}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div
          className={`view-control-bar-dock view-control-bar-dock--bottom-menu ui-panel-bottom ${hideUI ? 'ui-hidden' : ''}`}
          style={{
            zIndex: 1003,
            bottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
            left: 0,
            right: 0,
            marginInline: 'auto',
            pointerEvents: hideUI ? 'none' : 'auto',
          }}
        >
          <div className={TOOLBAR_CLASS} role="toolbar" aria-label="Menu principal">
          {/* VR WebXR (uniquement si WebXR est réellement supporté par l'appareil) */}
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

          {/* Mode immersif gyroscopique */}
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

          {TABS.map(t => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(a => a === t.key ? null : t.key)}
                className={`${TOOLBAR_BUTTON_CLASS} ${active ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
              >
                <i className={`bi ${t.icon}`} aria-hidden="true" />
                <span className="fw-semibold">{t.label}</span>
              </button>
            );
          })}
          </div>
        </div>

        {showCvModal   && <CvModal        initialCv={selectedCvType} onClose={handleCloseCv} />}
      </>
    );
  }

  // ── Rendu desktop : sidebar accordéon Bootstrap Glassmorphic ────────────────
  return (
    <>
      <div
        className={`position-fixed overflow-y-auto overflow-x-hidden d-flex flex-column gap-2 side-panel-desktop ui-panel-left ${hideUI ? 'ui-hidden' : ''}`}
        style={{
          top: 16,
          left: 16,
          width: 230,
          maxHeight: 'calc(100vh - 32px)',
          zIndex: 100,
          pointerEvents: hideUI ? 'none' : 'auto',
        }}
        onWheel={e => e.stopPropagation()}
      >
        {/* ── Section C.V. / Profil Ingénieur / Qui suis-je ? ── */}
        <Group icon="bi-briefcase-fill" title="Profil" extra={profileHeaderButtons} defaultOpen={false}>
          {profileSectionContent}
        </Group>

        <Group icon="bi-layers-fill" title="Calques" extra={layersHeaderButtons}>{layersSectionContent}</Group>
        <Group icon="bi-controller" title="Interactif">{interactiveSectionContent}</Group>
        <Group icon="bi-person-fill" title="PNJ" extra={personnageHeaderButtons}>{characterSectionContent}</Group>
        <DevToolsGroups Group={Group} compact />
        <Minimap embedded />
      </div>

      {showCvModal   && <CvModal        initialCv={selectedCvType} onClose={handleCloseCv} />}
    </>
  );
}
