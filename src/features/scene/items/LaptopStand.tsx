import { createStaticGlbItem } from './createStaticGlbItem';

/** Griffin support: 25.6 cm wide, bearing surfaces 13–15 cm above the desk. */
export const LaptopStand = createStaticGlbItem('items/support-ordinateur/support_ordinateur.glb');
export const LAPTOP_STAND_TILT = Math.atan2(15 - 13, 22);
export const LAPTOP_STAND_CENTER_HEIGHT = (15 + 13) / 2;
