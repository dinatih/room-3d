import { ROOM_W, FURNITURE_WALL_CLEARANCE } from '../wallData';
import { getAnimationDef } from '../animations/animationResolver';

export const KALLAX_NE_POSITION: [number, number, number] = [ROOM_W - 39 / 2 - FURNITURE_WALL_CLEARANCE, 0, 75.5 / 2 + FURNITURE_WALL_CLEARANCE];
export const KALLAX_NE_ROTATION = Math.PI / 2;
// Right column of the upper 2×2 row; the VARIERA box sits above this row.
export const DRONA_CATCHALL_POSITION: [number, number, number] = [-17.5, 41 + 76.5 - 20.5, 0];
export const DRONA_CATCHALL_ACTION = 'drona-ne-catchall-slide';
export const DRONA_CATCHALL_SLIDE_DURATION = getAnimationDef('opening')!.duration! / 2;
