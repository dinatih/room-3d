import { useIsMobile } from '@shared/hooks/useIsMobile';
import type { LayerState, LidarMode } from './sidepanel/types';
import { PanelPopover } from './sidepanel/PanelPopover';
import { LayersSection } from './sidepanel/sections/LayersSection';

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

  return (
    <PanelPopover
      icon="bi-layers-fill"
      title="Calques & Affichage"
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
      />
    </PanelPopover>
  );
}
