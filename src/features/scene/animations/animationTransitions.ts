/**
 * animationTransitions.ts — Transitions sémantiques et durées de fondu.
 *
 * Associe directement les tags du registre d'animations (ex: 'sitting', 'laying')
 * aux clips de relèvement in-between canoniques, sans aucune heuristique de nommage arbitraire.
 */

import { getAnimationDef } from './animationResolver';

const TRANSITION_CLIP_IDS = new Set([
  'sit-to-stand',
  'crouch-to-stand',
  'stand-to-sit',
  'getting-up-from-backside',
  'kip-up',
  'standing-up-from-bed',
  'get-up-bed',
  'stand-up',
  'standing-up',
  'stand-up-1',
]);

const BED_GET_UP_CHOICES = ['standing-up-from-bed', 'stand-up-1', 'get-up-bed'];

const EXIT_TRANSITIONS: Record<string, string | string[]> = {
  sitting: 'sit-to-stand',
  laying: BED_GET_UP_CHOICES,
  'laying-front': BED_GET_UP_CHOICES,
  'laying-front-static': BED_GET_UP_CHOICES,
  'laying-side-static': 'getting-up-from-backside',
  sleep: BED_GET_UP_CHOICES,
  crouch: 'crouch-to-stand',
};

export const isPostureTransition = (key: string) => TRANSITION_CLIP_IDS.has(getAnimationDef(key)?.id ?? key);

/**
 * Orientation native (radians) de la tête pour les postures au lit/sol.
 */
export function getPostureHeadAngle(animKey?: string | null): number {
  if (!animKey) return Math.PI;
  const def = getAnimationDef(animKey);
  const id = def?.id ?? animKey;
  if (
    id === 'female-laying-pose-1' ||
    id === 'female-laying-pose-4' ||
    id === 'sleeping-idle' ||
    def?.tags.includes('laying-side-static')
  ) {
    return -Math.PI / 2; // Tête vers -X (sur le flanc)
  }
  return Math.PI; // Tête vers -Z (sur le dos / ventre)
}

/**
 * Orientation native (radians) de la tête à la frame 0 du clip de transition.
 */
export function getTransitionHeadAngle(targetKey?: string | null): number {
  if (!targetKey) return 0;
  const def = getAnimationDef(targetKey);
  const id = def?.id ?? targetKey;
  if (id === 'standing-up-from-bed') {
    return -Math.PI / 2; // Démarre sur le flanc, tête vers -X
  }
  if (id === 'getting-up-from-backside') {
    return Math.PI; // Démarre sur le dos, tête vers -Z
  }
  if (id === 'stand-up-1' || id === 'get-up-bed' || id === 'getting-up') {
    return 0; // Démarre tête vers +Z
  }
  return 0;
}

/**
 * Calcule l'écart angulaire nécessaire pour que le clip de relèvement démarre
 * exactement dans la même orientation que la posture précédente.
 */
export function getPostureTransitionRotDelta(fromKey?: string | null, toKey?: string | null): number {
  if (!fromKey || !toKey) return 0;
  const fromDef = getAnimationDef(fromKey);
  const toDef = getAnimationDef(toKey);
  const fromTags = fromDef?.tags ?? [];
  const toId = toDef?.id ?? toKey;

  const isLaying = fromTags.some(t => t === 'laying' || t === 'laying-front' || t === 'laying-front-static' || t === 'laying-side-static' || t === 'sleep' || t === 'bed');
  const isBedTransition = toId === 'standing-up-from-bed' || toId === 'getting-up-from-backside' || toId === 'stand-up-1' || toId === 'get-up-bed' || toId === 'getting-up';

  if (!isLaying || !isBedTransition) return 0;

  const angleFrom = getPostureHeadAngle(fromKey);
  const angleTo = getTransitionHeadAngle(toKey);
  return Math.atan2(Math.sin(angleFrom - angleTo), Math.cos(angleFrom - angleTo));
}

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

  // Specific posture tags take precedence over the general laying tag.
  for (const tag of ['laying-side-static', 'laying-front-static', 'laying-front', ...def.tags]) {
    if (!def.tags.includes(tag)) continue;
    const target = EXIT_TRANSITIONS[tag];
    if (target) {
      const anim = Array.isArray(target) ? target[Math.floor(Math.random() * target.length)] : target;
      const exitDef = getAnimationDef(anim);
      if (!exitDef?.duration) throw new Error(`Missing posture transition: ${anim}`);
      return { anim, duration: exitDef.duration };
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
