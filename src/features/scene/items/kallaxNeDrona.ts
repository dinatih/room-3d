import { ROOM_W, FURNITURE_WALL_CLEARANCE } from '../wallData';
import { getAnimationDef } from '../animations/animationResolver';

// Closed GLB assembly extents towards the walls, including its boxes.
const WALL_EXTENTS = { east: 20.123, north: 38.251 };
export const KALLAX_NE_POSITION: [number, number, number] = [ROOM_W - WALL_EXTENTS.east - FURNITURE_WALL_CLEARANCE, 0, WALL_EXTENTS.north + FURNITURE_WALL_CLEARANCE];
export const KALLAX_NE_ROTATION = Math.PI / 2;
// Right column of the upper 2×2 row; the VARIERA box sits above this row.
export const DRONA_CATCHALL_POSITION: [number, number, number] = [-17.5, 41 + 76.5 - 20.5, 0];
export const DRONA_CATCHALL_SLIDE_DURATION = getAnimationDef('opening')!.duration! / 2;
