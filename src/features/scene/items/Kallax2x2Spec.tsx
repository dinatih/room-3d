/**
 * Kallax2x2Spec.tsx — KALLAX 2×2 sans cloison verticale centrale dans la rangée haute.
 * Permet de loger le four à pizza dans l'espace supérieur pleine largeur (77cm).
 * GLB généré depuis "KALLAX etag 77x77 blanc.glb" en supprimant les 64 triangles
 * de la cloison centrale haute (centroïde X ≈ 0, Y > 0.388m).
 */
import { createStaticGlbItem } from './createStaticGlbItem';

export const Kallax2x2Spec = createStaticGlbItem('items/kallax etag 77x77 open-top blanc/KALLAX etag 77x77 open-top blanc.glb', {
  origin: 'top',
  rotationY: Math.PI, // accrochages côté mur
});
