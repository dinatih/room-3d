/**
 * SidePanel.tsx
 *
 * Desktop : panneau accordéon à gauche (sections Vues / Calques / Interactif / Personnage / Animations / DevTools).
 * Mobile  : tab bar fixe en bas qui ouvre un bottom-sheet plein-largeur.
 *
 * Composant HTML pur rendu HORS du Canvas R3F. Dispatche des events custom
 * écoutés par CameraController et le reste de la scène.
 * Styled using Bootstrap 5.3 and glassmorphism.
 */
import { useState, useEffect, useRef } from 'react';
import { DevToolsGroups } from '@features/scene/DevToolsOverlay';
import { solarPosition } from '@features/scene/SunLight';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useSceneStore } from './store/useSceneStore';
import { HDRI_LIST } from './hdriConfig';
import { WIGS_ITEMS } from '../inventory/inventoryData';
import { resetAppIdle } from './idleState';
import { WALKER_ANIM_OPTIONS } from './animOptions';
import { DUO_ANIMATIONS } from './ai/duoAnimations';
import { duoSessionManager } from './ai/duoSessionManager';

import {
  TABS, ALL_HAIR_COLORS,
  type FurnitureState, type LayerState, type SidePanelProps,
  type SidePanelProps2, type LidarMode, type TabKey,
} from './sidepanel/types';
import { Group } from './sidepanel/Group';
import { ShortcutsModal } from './sidepanel/modals/ShortcutsModal';
import { ViewsModal } from './sidepanel/modals/ViewsModal';
import { ViewsSection } from './sidepanel/sections/ViewsSection';
import { LayersSection } from './sidepanel/sections/LayersSection';
import { InteractiveSection } from './sidepanel/sections/InteractiveSection';
import { CharacterSection } from './sidepanel/sections/CharacterSection';
import { AnimationsSection } from './sidepanel/sections/AnimationsSection';
import { DuoAnimationsSection } from './sidepanel/sections/DuoAnimationsSection';

// ── Re-exports publics pour compatibilité ascendante ──────────────────────────
export type {
  FurnitureState,
  LayerState,
  SidePanelProps,
  SidePanelProps2,
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
  buildAnim = false,
  onStartBuildAnim,
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
  onToggleHideUI,
}: SidePanelProps2) {
  const isMobile = useIsMobile();
  const [showViews, setShowViews] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [sunInfo, setSunInfo] = useState<{ time: string; el: number } | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>(null);
  const currentHdri = useSceneStore(state => state.currentHdri);
  const setHdri = useSceneStore(state => state.setHdri);

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

  const [activeAnimValue, setActiveAnimValue] = useState<string>('idle');

  useEffect(() => {
    const onToggle = (e: any) => {
      if (e.detail?.key === 'lara-haircut') {
        if (e.detail.value) setGlobalHaircut(e.detail.value);
      }
      if (e.detail?.key === 'walker-anim-lara' || e.detail?.key === 'walker-anim-xbot') {
        const val = e.detail.value ?? 'idle';
        setActiveAnimValue(val);
      }
    };
    document.addEventListener('furniture-toggle', onToggle);
    return () => document.removeEventListener('furniture-toggle', onToggle);
  }, []);

  const handleSelectGlobalAnim = (val: string) => {
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-lara', value: val } }));
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-xbot', value: val } }));
  };

  const handleResetAnim = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetAppIdle();
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-lara', value: 'idle' } }));
    document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'walker-anim-xbot', value: 'idle' } }));
  };

  const handleRandomDuoAnim = () => {
    resetAppIdle();
    const randomAnim = DUO_ANIMATIONS[Math.floor(Math.random() * DUO_ANIMATIONS.length)];
    if (randomAnim) {
      duoSessionManager.forceDuoAnimation(randomAnim);
    }
  };

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
  const layersHeaderButtons = (
    <div className="d-flex align-items-center gap-1" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        className="btn btn-sm btn-warning text-dark p-0 px-1 border-0 shadow-sm fw-bold"
        style={{ fontSize: '11px', lineHeight: 1.2, borderRadius: '4px' }}
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
              className={`btn btn-sm py-0 px-1 fw-bold ${isActive ? 'btn-primary text-white' : 'btn-outline-secondary text-dark'}`}
              style={{
                fontSize: '10px',
                lineHeight: '16px',
                paddingTop: '1px',
                paddingBottom: '1px',
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
        className="btn btn-sm btn-warning text-dark p-0 px-1 border-0 shadow-sm fw-bold"
        style={{ fontSize: '11px', lineHeight: 1.2, borderRadius: '4px' }}
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

  const animHeaderButtons = (
    <div className="d-flex align-items-center gap-1" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        className="btn btn-sm btn-warning text-dark p-0 px-1 border-0 shadow-sm fw-bold"
        style={{ fontSize: '11px', lineHeight: 1.2, borderRadius: '4px' }}
        title="Lancer une animation aléatoire (Perso)"
        onClick={(e) => {
          e.stopPropagation();
          resetAppIdle();
          const pool = WALKER_ANIM_OPTIONS.filter(a => a.value !== 'idle');
          if (pool.length > 0) {
            const randomAnim = pool[Math.floor(Math.random() * pool.length)];
            handleSelectGlobalAnim(randomAnim.value);
          }
        }}
      >
        🎲
      </button>
      <button
        type="button"
        className="btn btn-sm btn-secondary text-white p-0 px-1 border-0 shadow-sm fw-bold"
        style={{ fontSize: '11px', lineHeight: 1.2, borderRadius: '4px' }}
        title="Désactiver l'anim (Remettre les PNJ en mode IA autonome)"
        onClick={handleResetAnim}
      >
        ⏹️
      </button>
    </div>
  );

  const duoAnimHeaderButtons = (
    <div className="d-flex align-items-center gap-1" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        className="btn btn-sm btn-warning text-dark p-0 px-1 border-0 shadow-sm fw-bold"
        style={{ fontSize: '11px', lineHeight: 1.2, borderRadius: '4px' }}
        title="Lancer une animation de couple aléatoire 🎲"
        onClick={(e) => {
          e.stopPropagation();
          handleRandomDuoAnim();
        }}
      >
        🎲
      </button>
    </div>
  );

  // Instanciations des sections
  const viewsSectionContent = (
    <ViewsSection
      isMobile={isMobile}
      onOpenViews={() => setShowViews(true)}
      onOpenShortcuts={() => setShowShortcuts(true)}
      onToggleHideUI={onToggleHideUI}
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

  const animationsSectionContent = (
    <AnimationsSection
      isMobile={isMobile}
      buildAnim={buildAnim}
      buildAnimMatrix={buildAnimMatrix}
      onStartBuildAnim={onStartBuildAnim}
      onStartBuildAnimMatrix={onStartBuildAnimMatrix}
      onStopBuildAnim={onStopBuildAnim}
      animDurations={animDurations}
      activeAnimValue={activeAnimValue}
      onSelectAnim={handleSelectGlobalAnim}
    />
  );

  const duoAnimationsSectionContent = (
    <DuoAnimationsSection isMobile={isMobile} />
  );

  // ── Rendu mobile : tab bar bottom + sheet ───────────────────────────────────
  if (isMobile) {
    const sheetOpen = activeTab !== null;
    const sheetTitle: Record<Exclude<TabKey, null>, string> = {
      views: '📷 Vues',
      layers: '📑 Calques',
      personnage: '👤 Personnage',
      perf: '📊 Perf',
      anims: '💃 Animations Perso',
      animsCouple: '👯‍♀️ Animations Couple',
      interactif: '🎮 Interactif',
    };
    const sheetBody: Record<Exclude<TabKey, null>, React.ReactNode> = {
      views: viewsSectionContent,
      layers: layersSectionContent,
      interactif: interactiveSectionContent,
      personnage: characterSectionContent,
      anims: animationsSectionContent,
      animsCouple: duoAnimationsSectionContent,
      perf: <DevToolsGroups Group={Group} />,
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
              bottom: 64,
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
                {activeTab === 'layers' && layersHeaderButtons}
                {activeTab === 'personnage' && personnageHeaderButtons}
                {activeTab === 'anims' && animHeaderButtons}
                {activeTab === 'animsCouple' && duoAnimHeaderButtons}
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setActiveTab(null)}
                />
              </div>
            </div>

            <div className="overflow-auto p-2" style={{ flex: 1 }}>
              <div className="d-flex flex-column bg-transparent">
                {sheetBody[activeTab]}
              </div>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div 
          className="position-fixed bottom-0 start-0 end-0 border-top shadow-lg d-flex align-items-center"
          style={{ 
            height: '64px', 
            zIndex: 100, 
            paddingBottom: 'env(safe-area-inset-bottom)', 
            background: 'rgba(255, 255, 255, 0.75)', 
            backdropFilter: 'blur(8px)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <button
            onClick={onOpenInventory}
            className="btn border-0 d-flex flex-column align-items-center justify-content-center py-1 text-secondary"
            style={{ fontSize: '10px', minWidth: '60px', flex: '0 0 auto' }}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }}>📦</span>
            <span className="fw-semibold">Inventaire</span>
          </button>
          
          {TABS.map(t => {
            const active = activeTab === t.key;
            if (t.key === 'personnage') {
              return (
                <div key={t.key} className="d-flex align-items-center position-relative" style={{ flex: '0 0 auto' }}>
                  <button
                    onClick={() => setActiveTab(a => a === t.key ? null : t.key)}
                    className={`btn border-0 d-flex flex-column align-items-center justify-content-center py-1 ${active ? 'text-danger fw-bold' : 'text-secondary'}`}
                    style={{ fontSize: '10px', minWidth: '60px' }}
                  >
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>{t.emoji}</span>
                    <span className="fw-semibold">{t.label}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRandomHaircutAndColor();
                    }}
                    className="btn btn-sm btn-warning p-0 d-flex align-items-center justify-content-center border-0 rounded-circle position-absolute shadow-sm"
                    style={{
                      width: '20px',
                      height: '20px',
                      top: '4px',
                      right: '4px',
                      fontSize: '11px',
                      zIndex: 10,
                      background: '#ffc107',
                    }}
                    title="Coupe et couleur aléatoires 🎲"
                  >
                    🎲
                  </button>
                </div>
              );
            }
            if (t.key === 'animsCouple') {
              return (
                <div key={t.key} className="d-flex align-items-center position-relative" style={{ flex: '0 0 auto' }}>
                  <button
                    onClick={() => setActiveTab(a => a === t.key ? null : t.key)}
                    className={`btn border-0 d-flex flex-column align-items-center justify-content-center py-1 ${active ? 'text-danger fw-bold' : 'text-secondary'}`}
                    style={{ fontSize: '10px', minWidth: '60px' }}
                  >
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>{t.emoji}</span>
                    <span className="fw-semibold">{t.label}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRandomDuoAnim();
                    }}
                    className="btn btn-sm btn-warning p-0 d-flex align-items-center justify-content-center border-0 rounded-circle position-absolute shadow-sm"
                    style={{
                      width: '20px',
                      height: '20px',
                      top: '4px',
                      right: '4px',
                      fontSize: '11px',
                      zIndex: 10,
                      background: '#ffc107',
                    }}
                    title="Animation de couple aléatoire 🎲"
                  >
                    🎲
                  </button>
                </div>
              );
            }
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(a => a === t.key ? null : t.key)}
                className={`btn border-0 d-flex flex-column align-items-center justify-content-center py-1 ${active ? 'text-danger fw-bold' : 'text-secondary'}`}
                style={{ fontSize: '10px', minWidth: '60px', flex: '0 0 auto' }}
              >
                <span style={{ fontSize: '20px', lineHeight: 1 }}>{t.emoji}</span>
                <span className="fw-semibold">{t.label}</span>
              </button>
            );
          })}

          {onToggleHideUI && (
            <button
              onClick={onToggleHideUI}
              className="btn border-0 d-flex flex-column align-items-center justify-content-center py-1 text-secondary"
              style={{ fontSize: '10px', minWidth: '60px', flex: '0 0 auto' }}
              title="Masquer l'interface"
            >
              <span style={{ fontSize: '20px', lineHeight: 1 }}>👁️‍🗨️</span>
              <span className="fw-semibold">Cacher UI</span>
            </button>
          )}
        </div>

        {showViews     && <ViewsModal     onClose={() => setShowViews(false)} />}
        {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      </>
    );
  }

  // ── Rendu desktop : sidebar accordéon Bootstrap Glassmorphic ────────────────
  return (
    <>
      <div 
        className="position-fixed overflow-auto d-flex flex-column gap-2 side-panel-desktop"
        style={{
          top: 16,
          left: 16,
          width: 260,
          maxHeight: 'calc(100vh - 32px)',
          zIndex: 100,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 0, 0, 0.25) transparent',
        }}
        onWheel={e => e.stopPropagation()}
      >
        <div className="card shadow-sm glass-card overflow-hidden">
          <button
            className="btn btn-danger w-100 rounded-0 py-2 px-3 fw-bold text-start text-uppercase d-flex align-items-center justify-content-between border-0"
            onClick={onOpenInventory}
            title="Ouvrir l'inventaire (Touche I)"
            style={{ fontSize: '11px', letterSpacing: '0.06em' }}
          >
            <span className="d-flex align-items-center gap-1.5">
              <span>📦 Inventaire</span>
              <kbd className="bg-white bg-opacity-25 text-white border-0 px-1 rounded font-monospace" style={{ fontSize: '9px' }}>I</kbd>
            </span>
            <span style={{ fontSize: '9px' }}>▶</span>
          </button>
        </div>

        {/* ── Dev Tools / Perf ── */}
        <DevToolsGroups Group={Group} />

        <Group emoji="📷" title="Vues">{viewsSectionContent}</Group>
        <Group emoji="📑" title="Calques" extra={layersHeaderButtons}>{layersSectionContent}</Group>
        <Group emoji="🎮" title="Interactif">{interactiveSectionContent}</Group>
        <Group emoji="👤" title="Personnage" extra={personnageHeaderButtons}>{characterSectionContent}</Group>
        <Group emoji="💃" title="Animations Perso" extra={animHeaderButtons}>{animationsSectionContent}</Group>
        <Group emoji="👯‍♀️" title="Animations Couple" extra={duoAnimHeaderButtons}>{duoAnimationsSectionContent}</Group>
      </div>

      {showViews     && <ViewsModal     onClose={() => setShowViews(false)} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </>
  );
}
