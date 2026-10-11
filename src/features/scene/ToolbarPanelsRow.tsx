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
import { LayersSection } from './sidepanel/sections/LayersSection';
import { InteractiveSection } from './sidepanel/sections/InteractiveSection';
import { CharacterSection } from './sidepanel/sections/CharacterSection';

export type { ToolbarPanelsProps };

const SUN_LAT = parseFloat(import.meta.env.VITE_STUDIO_LAT ?? '48.828');
const SUN_LNG = parseFloat(import.meta.env.VITE_STUDIO_LNG ?? '2.376');

export interface ToolbarPanelsRowProps extends ToolbarPanelsProps {
  asVerticalList?: boolean;
}

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
  prefix: _prefix,
  asVerticalList = false,
}: ToolbarPanelsRowProps) {
  const isMobile = useIsMobile();
  const [sunInfo, setSunInfo] = useState<{ time: string; el: number } | null>(null);
  const currentHdri = useSceneStore(state => state.currentHdri);
  const setHdri = useSceneStore(state => state.setHdri);
  const npcGridActive = useSceneStore(state => state.layers.characterGrid);

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
    <div className={asVerticalList ? 'd-flex flex-column gap-1 w-100' : 'btn-group btn-group-sm view-control-bar__group'} role="group" aria-label="Panneaux de configuration et grilles">
      {/* 1. Calques */}
      <PanelPopover
        icon="bi-layers-fill"
        label="Calq"
        title="Calques & Affichage"
        headerExtra={layersHeaderButtons}
        hideUI={hideUI}
      >
        {layersSectionContent}
      </PanelPopover>

      {/* 2. Interactif */}
      <PanelPopover
        icon="bi-controller"
        label="Inter"
        title="Objets interactifs"
        hideUI={hideUI}
      >
        {interactiveSectionContent}
      </PanelPopover>

      {/* 3. Config User / PNJ */}
      <PanelPopover
        icon={
          <span className="d-inline-flex align-items-center gap-1">
            <i className="bi bi-person-fill" aria-hidden="true" />
            <i className="bi bi-gear-fill" aria-hidden="true" />
          </span>
        }
        label="PNJ"
        title="Configuration utilisateur & PNJ"
        headerExtra={personnageHeaderButtons}
        hideUI={hideUI}
      >
        {characterSectionContent}
      </PanelPopover>

      {/* 4. Inventaire */}
      {onOpenInventory && (
        <button
          type="button"
          className={`${TOOLBAR_BUTTON_CLASS} btn-outline-secondary`}
          onClick={onOpenInventory}
          title="Ouvrir l'inventaire (I)"
          aria-label="Ouvrir l'inventaire (I)"
        >
          <i className="bi bi-box-seam-fill" aria-hidden="true" />
          <span className="fw-semibold">Inv</span>
        </button>
      )}

      {/* 5. Grille / Vitrine PNJ */}
      <button
        type="button"
        className={`${TOOLBAR_BUTTON_CLASS} ${npcGridActive ? 'view-control-bar__btn--cyan' : 'btn-outline-secondary'}`}
        onClick={() => {
          document.dispatchEvent(new CustomEvent('camera-mode', { detail: 'toggle-npc-grid' }));
        }}
        title="Afficher ou quitter la grille / vitrine des PNJ (G)"
        aria-label="Afficher ou quitter la grille des PNJ (G)"
        aria-pressed={npcGridActive}
      >
        <i className="bi bi-people-fill" aria-hidden="true" />
        <span className="fw-semibold">Grille PNJ</span>
      </button>

      {/* 6. Grille inventaire */}
      <button
        type="button"
        className={`${TOOLBAR_BUTTON_CLASS} ${layers.inventoryGrid ? 'view-control-bar__btn--cyan' : 'btn-outline-secondary'}`}
        onClick={() => {
          if (onToggleLayer) onToggleLayer('inventoryGrid');
          else useSceneStore.getState().toggleLayer?.('inventoryGrid');
        }}
        title="Afficher ou masquer la grille des objets d'inventaire (Alt+I)"
        aria-label="Grille inventaire (Alt+I)"
        aria-pressed={Boolean(layers.inventoryGrid)}
      >
        <i className="bi bi-box-seam" aria-hidden="true" />
        <span className="fw-semibold">Grille Inv</span>
      </button>
    </div>
  );
}
