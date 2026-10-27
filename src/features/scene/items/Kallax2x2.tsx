/**
 * Kallax2x2.tsx — KALLAX Étagère, blanc, 77x77 cm (202.758.14).
 * Dimensions réelles : 77×77×39 cm (L×H×P).
 * Le GLB officiel IKEA est en mètres → scale ×100 pour la scène (1 unité = 1 cm).
 * Convention : Y=0 = sommet, Y=-H = bas (identique à Kallax1x1 et Kallax procédural).
 */
import { createStaticGlbItem } from './createStaticGlbItem';

export const Kallax2x2 = createStaticGlbItem('items/kallax20275814/Kallax20275814.glb', {
  origin: 'top',
  rotationY: Math.PI, // accrochages côté mur
});
