import { useFurnitureToggles } from '../utils/useFurnitureToggles';
import type { SceneItemProps } from '@shared/types';

/** L’aperçu conserve son propre état ; la scène utilise le store partagé. */
export function useDoorOpen(key: string, isPreview: boolean, actionState: SceneItemProps['actionState']) {
  const sceneState = useFurnitureToggles([key]);
  return Boolean((isPreview ? actionState : sceneState)[key]);
}
