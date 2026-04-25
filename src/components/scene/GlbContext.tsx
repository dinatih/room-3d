/**
 * GlbContext.tsx — contexte booléen pour le toggle GLB.
 *
 * Permet aux composants composites (KallaxNW, SunnerstaGroup…) de masquer
 * seulement leur sous-groupe GLB interne, indépendamment des enfants procéduraux,
 * même quand ces composites se trouvent EN DEHORS du <group visible={layers.glb}>
 * de Studio.tsx.
 *
 * Le contexte défaut à `true` → l'inventaire (qui ne fournit pas de Provider)
 * affiche toujours le composite complet.
 */
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

export const GlbContext = createContext(true);

/** Retourne la valeur courante du toggle GLB (true = visible). */
export function useGlbVisible(): boolean {
  return useContext(GlbContext);
}

/**
 * Groupe dont la visibilité suit automatiquement le toggle GLB.
 * À utiliser pour entourer les meshes GLB à l'intérieur d'un composite.
 */
export function GlbSubGroup({ children }: { children: ReactNode }) {
  const visible = useGlbVisible();
  return <group visible={visible}>{children}</group>;
}
