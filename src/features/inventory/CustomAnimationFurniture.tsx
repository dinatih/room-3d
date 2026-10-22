import { useMemo, type ComponentType } from 'react';
import type { SceneItemProps } from '@shared/types';
import { KallaxSE } from '@features/scene/items/KallaxSE';
import { KallaxNW } from '@features/scene/items/KallaxNW';
import { KallaxNE } from '@features/scene/items/KallaxNE';
import { KallaxCuisine } from '@features/scene/items/KallaxCuisine';
import { BathroomCabinetWest, BathroomCabinetEast } from '@features/scene/items/BathroomCabinet';
import { Drona } from '@features/scene/items/Drona';
import { DRONA_SPECIAL_ITEMS, DRONA_PULL_RANGE, DRONA_PUSH_RANGE } from '@features/scene/items/dronaStorage';
import { KALLAX_SE_DRONA_POSITIONS, DRONA_SE_ITEMS } from '@features/scene/items/kallaxSeDrona';
import { KALLAX_CUISINE_DRONA_POSITIONS, KITCHEN_DRONA_ITEMS } from '@features/scene/items/kallaxCuisineDrona';
import { BATHROOM_STORAGE_ITEMS, BATHROOM_BOX_APPROACH } from '@features/scene/items/bathroomStorage';
import { LINEN_PULL_RANGE, LINEN_PUSH_RANGE } from '@features/scene/animations/dronaLinenManifest';
import { getAnimationDef } from '@features/scene/animations/animationResolver';
import { NOOP_ITEM } from '@features/scene/sceneItem';
import { useAnimPreviewStore } from './useAnimPreviewStore';

const SHELVES: Record<string, ComponentType<SceneItemProps & { noCaps?: boolean; noMannequins?: boolean }>> = {
  se: KallaxSE, nw: KallaxNW, ne: KallaxNE, kitchen: KallaxCuisine,
  'bathroom-cabinet-west': BathroomCabinetWest, 'bathroom-cabinet-east': BathroomCabinetEast,
};
interface FurnitureContext {
  shelf: string; cell: [number, number, number]; approach: number; action?: string;
  box?: string; rotation?: number;
}
const CONTEXTS: Record<string, FurnitureContext> = {
  ...Object.fromEntries(Object.values(DRONA_SPECIAL_ITEMS).flatMap(item => 'animationPrefix' in item ? [[item.animationPrefix, {
    shelf: item.shelf, cell: item.position, approach: item.approach, action: item.action,
  }]] : [])),
  'drona-linen': { shelf: 'se', cell: KALLAX_SE_DRONA_POSITIONS[DRONA_SE_ITEMS['drona-se-linen'].index], approach: 50, action: DRONA_SE_ITEMS['drona-se-linen'].action },
  ...Object.fromEntries(Object.values(KITCHEN_DRONA_ITEMS).map(item => [item.animationPrefix, {
    shelf: 'kitchen', cell: KALLAX_CUISINE_DRONA_POSITIONS[item.index], approach: item.animationPrefix === 'drona-kitchen-diy' ? 65 : 50, action: item.action,
  }])),
  ...Object.fromEntries(Object.entries(BATHROOM_STORAGE_ITEMS).map(([id, item]) => [item.animationPrefix, {
    shelf: item.cabinetId, cell: [0, item.position[1], 0], approach: item.kind === 'cabinet' ? 60 : BATHROOM_BOX_APPROACH,
    action: 'action' in item ? item.action : undefined, rotation: Math.PI, box: item.kind === 'box' ? id : undefined,
  }])),
};

/** Isolated furniture follows the animation clock, including seeks and reverse scrubbing. */
export function CustomAnimationFurniture({ animationId, onSize }: { animationId?: string; onSize: () => void }) {
  const match = animationId?.match(/^(.*)-(pull|search|push)$/);
  const context = match && CONTEXTS[match[1]];
  const definition = animationId ? getAnimationDef(animationId) : undefined;
  const actionState = useMemo(() => ({ previewMotion: context?.action && definition ? {
    get [context.action!]() {
      const phase = match![2];
      const range = match![1] === 'drona-linen'
        ? phase === 'push' ? LINEN_PUSH_RANGE : LINEN_PULL_RANGE
        : phase === 'push' ? DRONA_PUSH_RANGE : DRONA_PULL_RANGE;
      const time = useAnimPreviewStore.getState().currentTime;
      const progress = Math.max(0, Math.min(1, (time / definition.duration! - range[0]) / (range[1] - range[0])));
      return phase === 'search' ? 1 : phase === 'push' ? 1 - progress : progress;
    },
  } : {} }), [animationId]);
  if (!context) return null;
  const Furniture = SHELVES[context.shelf];
  return <group name="custom-animation-furniture" userData={{ animationId }} position={[-context.cell[0], 0, context.approach]}>
    <group rotation-y={context.rotation ?? 0}>
      <Furniture item={NOOP_ITEM} isPreview actionState={actionState} onSize={onSize} noCaps noMannequins />
    </group>
    {context.box && <group name={context.box} position={context.cell}>
      <Drona item={NOOP_ITEM} isPreview actionState={actionState} onSize={onSize} />
    </group>}
  </group>;
}
