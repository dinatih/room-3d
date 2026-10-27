/**
 * Kallax2x1.tsx — KALLAX étagère, blanc, 77x41 cm (903.015.55).
 * Dimensions réelles : 77×41×39 cm (L×H×P).
 * Le GLB officiel IKEA est en mètres → scale ×100 pour la scène (1 unité = 1 cm).
 * Convention : Y=0 = sommet, Y=-H = bas (identique à Kallax1x1 et Kallax procédural).
 */
import { createStaticGlbItem } from './createStaticGlbItem';

export const Kallax2x1 = createStaticGlbItem('items/kallax90301555/Kallax90301555.glb', {
  origin: 'top',
  rotationY: Math.PI, // accrochages côté mur
});
