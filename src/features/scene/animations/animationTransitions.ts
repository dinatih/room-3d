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

const LAYING_EXIT_TRANSITIONS: ExitTransitionConfig[] = [
  { anim: 'sit-to-stand', duration: 2.3 },
  { anim: 'getting-up-from-backside', duration: 2.7 },
  { anim: 'kip-up', duration: 2.0 },
  { anim: 'getting-up', duration: 5.0 },
  { anim: 'standing-up-from-bed', duration: 1.7 },
  { anim: 'stand-up', duration: 6.2 },
  { anim: 'standing-up', duration: 8.5 },
];

const TRANSITION_CLIP_IDS = new Set([
  'sit-to-stand',
  'crouch-to-stand',
  'stand-to-sit',
  'getting-up-from-backside',
  'kip-up',
  'getting-up',
  'standing-up-from-bed',
  'stand-up',
  'standing-up',
  'stand-up-1',
]);

const EXIT_TRANSITIONS: Record<string, ExitTransitionConfig | ExitTransitionConfig[]> = {
  sitting: { anim: 'sit-to-stand', duration: 2.3 },
  laying: LAYING_EXIT_TRANSITIONS,
  'laying-front': LAYING_EXIT_TRANSITIONS,
  'laying-front-static': LAYING_EXIT_TRANSITIONS,
  'laying-side-static': LAYING_EXIT_TRANSITIONS,
  sleep: LAYING_EXIT_TRANSITIONS,
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
  if (TRANSITION_CLIP_IDS.has(def.id)) {
    return null;
  }

  for (const tag of def.tags) {
    const rawConfig = EXIT_TRANSITIONS[tag];
    if (rawConfig) {
      const config = Array.isArray(rawConfig)
        ? rawConfig[Math.floor(Math.random() * rawConfig.length)]
        : rawConfig;
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
