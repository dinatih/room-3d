/**
 * animationTransitions.ts — Transitions sémantiques et durées de fondu.
 *
 * Associe directement les tags du registre d'animations (ex: 'sitting', 'laying')
 * aux clips de relèvement in-between canoniques, sans aucune heuristique de nommage arbitraire.
 */

import { getAnimationDef } from './animationResolver';

interface ExitTransitionConfig {
  anim: string;
  duration?: number;
}

const EXIT_TRANSITIONS: Record<string, ExitTransitionConfig> = {
  sitting: { anim: 'sit-to-stand', duration: 2.3 },
  laying: { anim: 'stand-up', duration: 2.2 },
  crouch: { anim: 'crouch-to-stand', duration: 2.5 },
};

/**
 * Retourne l'animation de sortie (in-between) et sa durée dynamique lue depuis le registre.
 */
export function getExitTransition(animKey: string | null | undefined): { anim: string; duration: number } | null {
  if (!animKey) return null;
  const def = getAnimationDef(animKey);
  if (!def || !def.tags) return null;

  // Éviter de reboucler si l'animation en cours est déjà un clip de transition
  if (def.id === 'sit-to-stand' || def.id === 'stand-up' || def.id === 'crouch-to-stand' || def.id === 'stand-to-sit') {
    return null;
  }

  for (const tag of def.tags) {
    const config = EXIT_TRANSITIONS[tag];
    if (config) {
      const exitDef = getAnimationDef(config.anim);
      const duration = config.duration ?? exitDef?.duration ?? 2.0;
      return { anim: config.anim, duration };
    }
  }

  return null;
}

/**
 * Calcule la durée de crossfade Three.js :
 * 0.2s pour les transitions de locomotion (walk/run), 0.4s pour les autres poses.
 */
export function getCrossfadeDuration(fromKey?: string | null, toKey?: string | null): number {
  if (!fromKey || !toKey || fromKey === toKey) return 0.2;
  const fromDef = getAnimationDef(fromKey);
  const toDef = getAnimationDef(toKey);

  const isLocomotion = (d?: typeof fromDef) =>
    Boolean(d?.tags.some(t => t === 'locomotion' || t === 'walk' || t === 'run'));

  if (isLocomotion(fromDef) && isLocomotion(toDef)) {
    return 0.2;
  }

  return 0.4;
}
