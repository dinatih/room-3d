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
import { ShortcutsModal } from './sidepanel/modals/ShortcutsModal';
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
  onOpenInventory, 
  lidarMode, 
  onCycleLidar, 
  lidarOpacity, 
  onToggleLidarOpacity,
  buildAnimMatrix = false,
  onStartBuildAnimMatrix,
  onStopBuildAnim,
  animDurations = {},
  planeModel = 'paper',
  onSetPlaneModel,
  autopilotVisible = false,
  onToggleAutopilot,
  showLandingStrips = false,
  onToggleLandingStrips,
  hideUI = false,
}: SidePanelProps) {
  const isMobile = useIsMobile();
  const [showShortcuts, setShowShortcuts] = useState(false);
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
    const openShortcuts = () => setShowShortcuts(true);
    window.addEventListener('open-shortcuts-modal', openShortcuts);
    return () => window.removeEventListener('open-shortcuts-modal', openShortcuts);
  }, []);

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
        title="Changer aléatoirement d'ambiance HDRI 🎲 (Touche 5)"
        onClick={(e) => {
          e.stopPropagation();
          handleRandomHdri();
        }}
      >
        🎲
      </button>
    </div>
  );

  const personnageHeaderButtons = (
    <div className="d-flex align-items-center gap-1" onClick={e => e.stopPropagation()}>
      <div className="btn-group btn-group-sm" role="group">
        {([1, 2, 4, 10, 15] as const).map((cnt) => {
          const currentCount = layers.laraCount ?? (isMobile ? 2 : 15);
          const isActive = currentCount === cnt;
          return (
            <button
              key={cnt}
              type="button"
              className={`btn btn-sm py-0 px-1 fw-bold small ${isActive ? 'btn-primary text-white' : 'btn-outline-secondary text-dark'}`}
              style={{
                background: isActive ? undefined : 'rgba(255, 255, 255, 0.65)',
                border: '1px solid rgba(0, 0, 0, 0.15)',
              }}
              title={`Afficher ${cnt} PNJ (${cnt === 1 ? '1 Xbot seul (Léger)' : cnt === 2 ? '2 Duo' : cnt === 4 ? '4 (Lara, Xbot, Rosanna, Cha)' : cnt === 10 ? '10 Eco' : '15 Tous'})`}
              onClick={(e) => {
                e.stopPropagation();
                useSceneStore.getState().setLaraCount(cnt);
              }}
            >
              {cnt}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="btn btn-sm btn-warning text-dark p-0 px-1 border-0 shadow-sm fw-bold small rounded"
        title="Coupe et couleur de cheveux aléatoires 🎲"
        onClick={(e) => {
          e.stopPropagation();
          handleRandomHaircutAndColor();
        }}
      >
        🎲
      </button>
    </div>
  );

  const profileHeaderButtons = (
    <div className="d-flex align-items-center gap-1 pe-1" onClick={e => e.stopPropagation()}>
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
        <span>CV</span>
      </button>
    </div>
  );

  // Instanciations des sections
  const profileSectionContent = (
    <ProfileSection
      isMobile={isMobile}
      onOpenCv={handleOpenCv}
    />
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
      handleRandomHaircutAndColor={handleRandomHaircutAndColor}
      handleRandomHairColor={handleRandomHairColor}
      handleRandomHaircut={handleRandomHaircut}
    />
  );

  // ── Rendu mobile : tab bar bottom + sheet ───────────────────────────────────
  if (isMobile) {
    const sheetOpen = activeTab !== null;
    const sheetTitle: Record<Exclude<TabKey, null>, string> = {
      profile: '💼 Profil & CV',
      layers: '📑 Calques',
      personnage: '👤 PNJ',
      perf: '📊 Perf',
      plan2d: '🗺️ Plan 2D',
      interactif: '🎮 Interactif',
    };
    const sheetBody: Record<Exclude<TabKey, null>, React.ReactNode> = {
      profile: profileSectionContent,
      layers: layersSectionContent,
      interactif: interactiveSectionContent,
      personnage: characterSectionContent,
      perf: <DevToolsGroups Group={Group} compact headerless />,
      plan2d: <Minimap embedded showGroup={false} />,
    };
    const tabIcons: Record<Exclude<TabKey, null>, string> = {
      profile: 'bi-briefcase-fill',
      layers: 'bi-layers-fill',
      personnage: 'bi-person-fill',
      perf: 'bi-bar-chart-fill',
      plan2d: 'bi-map-fill',
      interactif: 'bi-controller',
    };

    return (
      <>
        {sheetOpen && (
          <div
            onClick={() => setActiveTab(null)}
            className="position-fixed inset-0 bg-dark bg-opacity-50"
            style={{ backdropFilter: 'blur(2px)', zIndex: 90 }}
          />
        )}

        {sheetOpen && activeTab !== null && (
          <div
            className="position-fixed start-0 end-0 border-top shadow-lg z-index-95 d-flex flex-column rounded-top-4"
            style={{
              bottom: '3.75rem',
              maxHeight: 'calc(100vh - 120px)',
              zIndex: 95,
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(8px)',
            }}
            onWheel={e => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom text-dark">
              <span className="fw-bold">{sheetTitle[activeTab]}</span>
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
            zIndex: 100,
            bottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: hideUI ? 'none' : 'auto',
          }}
        >
          <div className="view-control-bar glass-card d-flex flex-nowrap justify-content-start align-items-center gap-1 overflow-x-auto p-2 rounded-3 border shadow-lg" role="toolbar" aria-label="Menu principal">
          {/* 🥽 VR WebXR (uniquement si WebXR est réellement supporté par l'appareil) */}
          {isVRSupported && (
            <button
              type="button"
              onClick={() => {
                document.dispatchEvent(new CustomEvent('toggle-vr'));
              }}
              className={`btn btn-sm d-flex flex-row align-items-center justify-content-center gap-1 flex-shrink-0 ${isVRActive ? 'btn-danger text-white fw-bold' : 'btn-outline-secondary'} py-1 px-2`}
              title="Mode Réalité Virtuelle (WebXR)"
            >
              <i className="bi bi-headset" aria-hidden="true" />
              <span className="fw-semibold small">{isVRActive ? '✕ VR' : 'VR'}</span>
            </button>
          )}

          {/* 👁️ Mode Immersif Gyroscopique */}
          <button
            type="button"
            onClick={() => {
              document.dispatchEvent(new CustomEvent('toggle-immersive'));
            }}
            className={`btn btn-sm d-flex flex-row align-items-center justify-content-center gap-1 flex-shrink-0 ${isImmersiveActive ? 'btn-danger text-white fw-bold' : 'btn-outline-secondary'} py-1 px-2`}
            title="Mode Immersif Gyroscope (Plein écran)"
          >
            <i className="bi bi-eye-fill" aria-hidden="true" />
            <span className="fw-semibold small">{isImmersiveActive ? 'Quitter' : 'Immersif'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenInventory}
            className="btn btn-sm btn-outline-secondary d-flex flex-row align-items-center justify-content-center gap-1 flex-shrink-0 py-1 px-2"
          >
            <i className="bi bi-box-seam-fill" aria-hidden="true" />
            <span className="fw-semibold small">Inventaire</span>
          </button>
          
          {TABS.filter(t => t.key !== 'personnage').map(t => {
            const active = activeTab === t.key;
            if (t.key === 'personnage') {
              return (
                <div key={t.key} className="d-flex align-items-center position-relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab(a => a === t.key ? null : t.key)}
                    className={`btn btn-sm border-0 d-flex flex-column align-items-center justify-content-center py-1 px-2 ${active ? 'text-danger fw-bold' : 'text-secondary'}`}
                  >
                    <span className="fs-5 lh-1"><i className={`bi ${tabIcons[t.key]}`} aria-hidden="true" /></span>
                    <span className="fw-semibold small">{t.label}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRandomHaircutAndColor();
                    }}
                    className="btn btn-sm btn-warning p-0 d-flex align-items-center justify-content-center border-0 rounded-circle position-absolute shadow-sm"
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      top: '0.25rem',
                      right: '0.25rem',
                      zIndex: 10,
                    }}
                    title="Coupe et couleur aléatoires 🎲"
                  >
                    <span className="small">🎲</span>
                  </button>
                </div>
              );
            }
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(a => a === t.key ? null : t.key)}
                className={`btn btn-sm d-flex flex-row align-items-center justify-content-center gap-1 flex-shrink-0 py-1 px-2 ${active ? 'btn-danger text-white fw-bold' : 'btn-outline-secondary'}`}
              >
                <i className={`bi ${tabIcons[t.key]}`} aria-hidden="true" />
                <span className="fw-semibold small">{t.label}</span>
              </button>
            );
          })}
          </div>
        </div>

        {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
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
          width: 260,
          maxHeight: 'calc(100vh - 32px)',
          zIndex: 100,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 0, 0, 0.35) rgba(0, 0, 0, 0.05)',
          pointerEvents: hideUI ? 'none' : 'auto',
        }}
        onWheel={e => e.stopPropagation()}
      >
        <div className="card shadow-sm glass-card overflow-hidden flex-shrink-0">
          <button
            className="btn btn-sm btn-danger w-100 rounded-0 py-2 px-3 fw-bold text-start text-uppercase d-flex align-items-center justify-content-between border-0 small flex-shrink-0"
            onClick={onOpenInventory}
            title="Ouvrir l'inventaire (Touche I)"
            style={{ 
              letterSpacing: '0.06em',
              background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(185, 28, 28, 0.95) 100%)',
              textShadow: '0 1px 1px rgba(0, 0, 0, 0.35)'
            }}
          >
            <span className="d-flex align-items-center gap-2">
              <span>📦 Inventaire</span>
              <kbd className="bg-white bg-opacity-25 text-white border-0 px-1 rounded font-monospace small">I</kbd>
            </span>
            <span className="small">▶</span>
          </button>
        </div>

        {/* ── Section C.V. / Profil Ingénieur / Qui suis-je ? ── */}
        <Group emoji="💼" title="Profil & CV" extra={profileHeaderButtons} defaultOpen={false}>
          {profileSectionContent}
        </Group>

        <Group emoji="📑" title="Calques" extra={layersHeaderButtons}>{layersSectionContent}</Group>
        <Group emoji="🎮" title="Interactif">{interactiveSectionContent}</Group>
        <Group emoji="👤" title="PNJ" extra={personnageHeaderButtons}>{characterSectionContent}</Group>
        <DevToolsGroups Group={Group} compact />
        <Minimap embedded />
      </div>

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {showCvModal   && <CvModal        initialCv={selectedCvType} onClose={handleCloseCv} />}
    </>
  );
}
