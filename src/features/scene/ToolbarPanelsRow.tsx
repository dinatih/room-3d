import { TOOLBAR_BUTTON_CLASS } from './toolbarStyles';
/**
 * ToolbarPanelsRow.tsx
 *
 * Actions et panneaux secondaires regroupés dans le menu `+`.
 *
 * Composant HTML pur rendu hors du Canvas R3F.
 */
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { useSceneStore } from './store/useSceneStore';

import { type ToolbarPanelsProps } from './sidepanel/types';
import { PanelPopover } from './sidepanel/PanelPopover';
import { InteractiveSection } from './sidepanel/sections/InteractiveSection';

export type { ToolbarPanelsProps };

export interface ToolbarPanelsRowProps extends ToolbarPanelsProps {
  asVerticalList?: boolean;
}

export function ToolbarPanelsRow({
  layers,
  onToggleLayer,
  lidarMode: _lidarMode,
  onCycleLidar: _onCycleLidar,
  lidarOpacity: _lidarOpacity,
  onToggleLidarOpacity: _onToggleLidarOpacity,
  planeModel = 'origami',
  onSetPlaneModel,
  autopilotVisible = false,
  onToggleAutopilot,
  showLandingStrips = false,
  onToggleLandingStrips,
  hideUI = false,
  prefix: _prefix,
  asVerticalList = false,
}: ToolbarPanelsRowProps) {
  const isMobile = useIsMobile();
  const npcGridActive = useSceneStore(state => state.layers.characterGrid);

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

  return (
    <div className={asVerticalList ? 'd-flex flex-column gap-1 w-100' : 'btn-group btn-group-sm view-control-bar__group'} role="group" aria-label="Panneaux de configuration et grilles">
      {/* 1. Interactif */}
      <PanelPopover
        icon="bi-controller"
        label="Interactions"
        title="Objets interactifs"
        hideUI={hideUI}
      >
        {interactiveSectionContent}
      </PanelPopover>

      {/* 2. Grille / Vitrine Personnages */}
      <button
        type="button"
        className={`${TOOLBAR_BUTTON_CLASS} ${npcGridActive ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
        onClick={() => {
          document.dispatchEvent(new CustomEvent('camera-mode', { detail: 'toggle-npc-grid' }));
        }}
        title="Afficher ou quitter la grille / vitrine des Personnages (G)"
        aria-label="Afficher ou quitter la grille des Personnages (G)"
        aria-pressed={npcGridActive}
      >
        <i className="bi bi-people-fill" aria-hidden="true" />
        <span className="fw-semibold">Grille Personnages</span>
      </button>

      {/* 3. Grille inventaire */}
      <button
        type="button"
        className={`${TOOLBAR_BUTTON_CLASS} ${layers.inventoryGrid ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
        onClick={() => {
          if (onToggleLayer) onToggleLayer('inventoryGrid');
          else useSceneStore.getState().toggleLayer?.('inventoryGrid');
        }}
        title="Afficher ou masquer la grille des objets d'inventaire (Alt+I)"
        aria-label="Grille inventaire (Alt+I)"
        aria-pressed={Boolean(layers.inventoryGrid)}
      >
        <i className="bi bi-box-seam" aria-hidden="true" />
        <span className="fw-semibold">Grille Inventaire</span>
      </button>

      {/* 4. Grille perruques */}
      <button
        type="button"
        className={`${TOOLBAR_BUTTON_CLASS} ${layers.wigGrid ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
        onClick={() => (onToggleLayer ?? useSceneStore.getState().toggleLayer)('wigGrid')}
        title="Afficher ou masquer toutes les perruques sur les bustes de Lara"
        aria-label="Grille perruques"
        aria-pressed={Boolean(layers.wigGrid)}
      >
        <i className="bi bi-person-bust" aria-hidden="true" />
        <span className="fw-semibold">Grille Perruques</span>
      </button>
    </div>
  );
}
