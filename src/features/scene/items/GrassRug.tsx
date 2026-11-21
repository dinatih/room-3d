/**
 * Tapis pelouse synthétique SDB — modèle Blender GLB (200 × 100 × 1,2 cm).
 * Rendu en coordonnées locales : centre X/Z à l'origine, Y=0 = sol.
 * Utilisé dans BathroomPlacements.tsx. Pas d'entrée inventaire.
 */
import { createStaticGlbItem } from './createStaticGlbItem';

export const GrassRug = createStaticGlbItem('/items/grass-rug/grass-rug.glb');
