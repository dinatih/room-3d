export const TOILET_HINGE_ANGLE = Math.PI / 2.2;
export const TOILET_HINGE_SPEED = 10;
export const TOILET_HINGE_TOLERANCE = 0.005;
// Temps nécessaire pour atteindre la tolérance depuis une ouverture complète.
export const TOILET_HINGE_DURATION = Math.log(TOILET_HINGE_ANGLE / TOILET_HINGE_TOLERANCE) / TOILET_HINGE_SPEED;

export const TOILET_FLUSH_DURATION = 2.8;

export const TOILET_WATER_REST_Y = 17.5;
export const TOILET_WATER_MIN_Y = 11.5;
export const TOILET_WATER_CENTER_X = 0;
export const TOILET_WATER_CENTER_Z = 8.5;
export const TOILET_WATER_RADIUS_X = 8.0;
export const TOILET_WATER_RADIUS_Z = 12.0;

export const TOILET_RIM_Y = 38.5;
export const TOILET_RIM_CENTER_Z = 13.0;
export const TOILET_RIM_RADIUS_X = 13.5;
export const TOILET_RIM_RADIUS_Z = 17.5;
