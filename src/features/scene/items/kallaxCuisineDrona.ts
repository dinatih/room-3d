import { BATH_WEST_WALL, ROOM_D, FURNITURE_WALL_CLEARANCE } from '../wallData';

// Measured closed GLB extents towards the walls, boxes included.
export const KALLAX_CUISINE_POSITION: [number, number, number] = [
  BATH_WEST_WALL + 20.124 + FURNITURE_WALL_CLEARANCE, 0,
  ROOM_D - 38.251 - FURNITURE_WALL_CLEARANCE,
];
export const KALLAX_CUISINE_ROTATION = -Math.PI / 2;
export const KALLAX_CUISINE_DRONA_POSITIONS: [number, number, number][] = [
  [-17.5, 56, 0], [-17.5, 20.5, 0], [17.5, 56, 0], [17.5, 20.5, 0],
  [-17.5, 2 * 76.5 + 41 + 33 / 2 + 0.2, 0], [17.5, 2 * 76.5 + 41 + 33 / 2 + 0.2, 0],
];

// Viewed from the opening (-Z local), right is -X and left is +X.
export const KITCHEN_DRONA_ITEMS = {
  'drona-kitchen-diy': { index: 1, label: 'Dröna Bricolage', interaction: 'Prendre du matériel de bricolage' },
  'drona-kitchen-old-it': { index: 3, label: 'Dröna Old IT', interaction: 'Prendre du matériel Old IT' },
  'drona-kitchen-main': { index: 2, label: 'Dröna Cuisine Principale', interaction: 'Prendre un objet de cuisine' },
  'drona-kitchen-electronics': { index: 0, label: 'Dröna Électronique, Câbles', interaction: 'Prendre du matériel électronique ou des câbles' },
};
