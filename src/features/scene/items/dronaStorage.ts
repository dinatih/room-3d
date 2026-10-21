import { getAnimationDef } from '../animations/animationResolver';
import { KALLAX_SE_DRONA_POSITIONS } from './kallaxSeDrona';
import { FURNITURE_WALL_CLEARANCE } from '../wallData';

// Actual GLB frame is slightly deeper than the nominal 39 cm.
const KALLAX_NW_WALL_EXTENTS = { west: 20.051, north: 20.5 };
export const KALLAX_NW_POSITION: [number, number, number] = [KALLAX_NW_WALL_EXTENTS.west + FURNITURE_WALL_CLEARANCE, 0, KALLAX_NW_WALL_EXTENTS.north + FURNITURE_WALL_CLEARANCE];
export const KALLAX_NW_ROTATION = -Math.PI / 2;
export const KALLAX_NW_DRONA_POSITIONS: [number, number, number][] = [
  [0, 75.5 / 2 - 17.5, 0], [0, 75.5 / 2 + 17.5, 0],
  [0, 75.5 + 40.5 / 2, 0], [0, 75.5 + 40.5 + 40.5 / 2, 0],
];

// Each set has complete one-shot pull/search/push clips, authored at its handle height.
export const DRONA_SPECIAL_ITEMS = {
  'drona-se-care': {
    shelf: 'se', index: 0, position: KALLAX_SE_DRONA_POSITIONS[0],
    label: 'Dröna Parfum/Crème', interaction: 'Prendre un parfum ou une crème',
    action: 'drona-se-care-slide', animationPrefix: 'drona-care', approach: 50,
  },
  'drona-nw-trousers': {
    shelf: 'nw', index: 2, position: KALLAX_NW_DRONA_POSITIONS[2],
    label: 'Dröna Pantalons', interaction: 'Prendre un pantalon',
    action: 'drona-nw-trousers-slide', animationPrefix: 'drona-trousers', approach: 50,
  },
  'drona-ne-catchall2': {
    shelf: 'ne', index: 0, position: [-17.5, 41 - 20.5, 0],
    label: 'Dröna Fourre-tout 2', interaction: 'Prendre un objet dans le fourre-tout 2',
    action: 'drona-ne-catchall2-slide', animationPrefix: 'drona-catchall2', approach: 50,
  },
} satisfies Record<string, {
  shelf: string; index: number; position: [number, number, number];
  label: string; interaction: string; action: string; animationPrefix: string; approach: number;
}>;

export const SPECIAL_DRONA_SLIDE_DURATION = getAnimationDef('drona-care-pull')!.duration!;
export const DRONA_PULL_RANGE: [number, number] = [0.25, 0.75];
export const DRONA_PUSH_RANGE: [number, number] = [0.25, 0.75];
