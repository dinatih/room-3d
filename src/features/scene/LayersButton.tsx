import { useState, useEffect } from 'react';
import { solarPosition } from '@features/scene/SunLight';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useSceneStore } from './store/useSceneStore';
import { HDRI_LIST } from './hdriConfig';
import type { LayerState, LidarMode } from './sidepanel/types';
import { PanelPopover } from './sidepanel/PanelPopover';
import { LayersSection } from './sidepanel/sections/LayersSection';

const SUN_LAT = parseFloat(import.meta.env.VITE_STUDIO_LAT ?? '48.828');
const SUN_LNG = parseFloat(import.meta.env.VITE_STUDIO_LNG ?? '2.376');

export interface LayersButtonProps {
  layers: LayerState;
  onToggleLayer: (layer: keyof LayerState) => void;
  lidarMode: LidarMode;
  onCycleLidar: () => void;
  lidarOpacity: number;
  onToggleLidarOpacity: () => void;
  hideUI?: boolean;
}

export function LayersButton({
  layers,
  onToggleLayer,
  lidarMode,
  onCycleLidar,
  lidarOpacity,
  onToggleLidarOpacity,
  hideUI = false,
}: LayersButtonProps) {
  const isMobile = useIsMobile();
  const [sunInfo, setSunInfo] = useState<{ time: string; el: number } | null>(null);
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

  const handleRandomHdri = () => {
    const otherHdris = HDRI_LIST.filter(h => h.id !== currentHdri);
    const next = otherHdris[Math.floor(Math.random() * otherHdris.length)];
    if (next) setHdri(next.id);
  };

  const activeHdriItem = HDRI_LIST.find(h => h.id === currentHdri);
  const activeHdriName = activeHdriItem?.name ?? currentHdri;

  const layersHeaderButtons = (
    <div className="d-flex align-items-center gap-1 overflow-hidden" style={{ minWidth: 0 }} onClick={e => e.stopPropagation()}>
      <span className="text-dark fw-medium text-end text-truncate flex-grow-1 small" title={activeHdriName}>
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

  return (
    <PanelPopover
      icon="bi-layers-fill"
      title="Calques & Affichage"
      headerExtra={layersHeaderButtons}
      hideUI={hideUI}
    >
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
    </PanelPopover>
  );
}
