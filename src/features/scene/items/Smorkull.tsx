/**
 * Smorkull.tsx — SMÖRKULL chaise de bureau av accoudoirs (605.034.37).
 * Dimensions réelles : 65×108×66 cm (L×H×P) à ×100.
 * Le GLB officiel IKEA est en mètres → scale ×100 pour la scène (1 unité = 1 cm).
 * Coordonnées locales : centré X/Z, Y=0 = sol.
 */
import { createStaticGlbItem } from './createStaticGlbItem';

// Largeur mesurée de l'assise (~52 cm), profondeur complète de la chaise (66 cm).
export const SMORKULL_FOOTPRINT = [
  { x: -25.894, z: -33 }, { x: 25.848, z: -33 },
  { x: 25.848, z: 33 }, { x: -25.894, z: 33 },
];

export const Smorkull = createStaticGlbItem('items/smorkull60503437/Smorkull60503437.glb');
