import { pEast, pNorth, pSouth, pWest } from '../../wallData';
import { useSceneStore } from '../../store/useSceneStore';

/** Height in cm of the low masonry step under the glass door (matches GlassDoor & GardenLightStrips). */
export const GLASS_DOOR_STEP_HEIGHT = 25;

const GLASS_DOOR_STEP_BOUNDS = {
  minX: pEast('glass-west'),
  maxX: pWest('glass-east'),
  minZ: pNorth('glass-west-ext'),
  maxZ: pSouth('glass-west'),
};

/** World Y elevation of walkable ground at (x, z), taking the window step into account when toggled on. */
export function getWalkableGroundY(x: number, z: number): number {
  if (!useSceneStore.getState().layers.windowStepElevation) return 0;
  if (
    x >= GLASS_DOOR_STEP_BOUNDS.minX &&
    x <= GLASS_DOOR_STEP_BOUNDS.maxX &&
    z >= GLASS_DOOR_STEP_BOUNDS.minZ &&
    z <= GLASS_DOOR_STEP_BOUNDS.maxZ
  ) {
    return GLASS_DOOR_STEP_HEIGHT;
  }
  return 0;
}
