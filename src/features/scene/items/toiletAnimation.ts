export const TOILET_HINGE_ANGLE = Math.PI / 2.2;
export const TOILET_HINGE_SPEED = 10;
export const TOILET_HINGE_TOLERANCE = 0.005;
// Temps nécessaire pour atteindre la tolérance depuis une ouverture complète.
export const TOILET_HINGE_DURATION = Math.log(TOILET_HINGE_ANGLE / TOILET_HINGE_TOLERANCE) / TOILET_HINGE_SPEED;
