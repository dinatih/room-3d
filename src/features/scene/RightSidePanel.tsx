/**
 * RightSidePanel.tsx
 *
 * Panneau latéral droit sur desktop :
 * - Vue Performances (DevTools / stats live)
 * - Minimap 2D juste en dessous
 *
 * Largeur calquée sur la taille de la minimap (SMALL_W_DESKTOP + 8 = 148px).
 */
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { DevToolsGroups } from '@features/scene/DevToolsOverlay';
import { Group } from '@features/scene/sidepanel/Group';
import { Minimap, SMALL_W_DESKTOP } from '@features/scene/Minimap';

export function RightSidePanel() {
  const isMobile = useIsMobile();
  if (isMobile) return null;

  const panelWidth = SMALL_W_DESKTOP + 8; // 148px

  return (
    <div
      className="position-fixed d-flex flex-column gap-2"
      style={{
        top: 16,
        right: 16,
        width: panelWidth,
        zIndex: 90,
        pointerEvents: 'auto',
        maxHeight: 'calc(100vh - 32px)',
        overflowY: 'auto',
        scrollbarWidth: 'none',
      }}
      onWheel={e => e.stopPropagation()}
    >
      <DevToolsGroups Group={Group} compact />
      <Minimap embedded />
    </div>
  );
}
