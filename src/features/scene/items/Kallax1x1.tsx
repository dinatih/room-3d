/**
 * Kallax1x1.tsx — KALLAX Étagère, blanc, 42x42 cm (203.015.54).
 * Dimensions réelles : 42×41×39 cm (L×H×P).
 * Le GLB officiel IKEA est en mètres → scale ×100 pour la scène (1 unité = 1 cm).
 * Coordonnées locales : centré X/Z, Y=0 = sommet (convention des empilements).
 */
import { createStaticGlbItem } from './createStaticGlbItem';

export const Kallax1x1 = createStaticGlbItem('items/kallax20301554/Kallax20301554.glb', {
  origin: 'top',
  rotationY: Math.PI, // accrochages côté mur
});
