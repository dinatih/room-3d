/**
 * animationTransitions.ts
 * Système intelligent de transition entre animations :
 * - Détection des postures basée prioritairement sur les tags officiels du registre d'animations (animationRegistry)
 * - Choix des clips de transition dédiés (in-between comme sit-to-stand, crouch-to-stand, getting-up) avec identifiants canoniques
 * - Calcul adaptatif de la durée de crossfade (blendDuration)
 */

import { getAnimationDef } from './animationResolver';

export type CharacterPosture = 'standing' | 'sitting' | 'laying' | 'crouching' | 'locomotion';

/**
 * Détermine la posture générale d'une animation en s'appuyant d'abord sur ses tags officiels dans le registre,
 * avec un repli textuel si l'animation n'est pas indexée.
 */
export function getAnimationPosture(animIdOrPath: string | null | undefined): CharacterPosture {
  if (!animIdOrPath) return 'standing';

  const def = getAnimationDef(animIdOrPath);
  if (def && Array.isArray(def.tags)) {
    const tags = def.tags.map(t => t.toLowerCase());

    // 1. Tags prioritaires
    if (tags.some(t => t === 'sitting' || t.includes('sitting') || t.includes('seated'))) {
      if (def.id.includes('sit-to-stand') || def.id.includes('stand-to-sit')) return 'standing';
      return 'sitting';
    }

    if (tags.some(t => t === 'laying' || t.includes('laying') || t.includes('sleep') || t.includes('bed'))) {
      if (def.id.includes('stand-up') || def.id.includes('getting-up')) return 'standing';
      return 'laying';
    }

    if (tags.some(t => t === 'crouch' || t.includes('crouch') || t.includes('kneel'))) {
      if (def.id.includes('crouch-to-stand') || def.id.includes('kneel-to-stand')) return 'standing';
      return 'crouching';
    }

    if (tags.some(t => t === 'locomotion' || t === 'walk' || t === 'run' || t.includes('walk') || t.includes('run'))) {
      return 'locomotion';
    }
  }

  // 2. Repli par analyse sémantique du nom/identifiant si absent du registre ou tags trop génériques
  const name = (def?.id || animIdOrPath).toLowerCase();

  if (
    name.includes('sit') ||
    name.includes('chair') ||
    name.includes('sofa') ||
    name.includes('bench')
  ) {
    if (name.includes('situps')) return 'laying';
    if (name.includes('sit-to-stand') || name.includes('sit_to_stand') || name.includes('stand-to-sit')) return 'standing';
    return 'sitting';
  }

  if (
    name.includes('lay') ||
    name.includes('lying') ||
    name.includes('sleep') ||
    name.includes('bed') ||
    name.includes('floor') ||
    name.includes('push_up') ||
    name.includes('push-up') ||
    name.includes('supta') ||
    name.includes('extended_puppy')
  ) {
    if (name.includes('getting_up') || name.includes('getting-up') || name.includes('stand_up') || name.includes('stand-up')) {
      return 'standing';
    }
    return 'laying';
  }

  if (
    name.includes('crouch') ||
    name.includes('kneel') ||
    name.includes('kneeling')
  ) {
    if (name.includes('crouch-to-stand') || name.includes('crouch_to_stand') || name.includes('kneel-to-stand') || name.includes('kneel_to_stand')) {
      return 'standing';
    }
    return 'crouching';
  }

  if (
    name.includes('walk') ||
    name.includes('run') ||
    name.includes('jog') ||
    name.includes('sprint') ||
    name.includes('step') ||
    name.includes('locomotion')
  ) {
    return 'locomotion';
  }

  return 'standing';
}

/**
 * Tente de trouver un clip d'animation de transition dédié ("in-between") entre deux animations.
 * Retourne l'animation de transition (ID canonique) et sa durée estimée si trouvée.
 */
export function getDedicatedTransitionClip(
  fromAnim: string | null | undefined,
  toAnim: string | null | undefined
): { transitionAnim: string; duration: number } | null {
  if (!fromAnim || !toAnim) return null;
  const fromPosture = getAnimationPosture(fromAnim);
  const toPosture = getAnimationPosture(toAnim);

  // Cas 1 : De assis vers debout ou locomotion
  if (fromPosture === 'sitting' && (toPosture === 'standing' || toPosture === 'locomotion')) {
    return {
      transitionAnim: 'sit-to-stand',
      duration: 2.1,
    };
  }

  // Cas 2 : De debout vers assis
  if ((fromPosture === 'standing' || fromPosture === 'locomotion') && toPosture === 'sitting') {
    return {
      transitionAnim: 'stand-to-sit',
      duration: 2.5,
    };
  }

  // Cas 3 : De accroupi / à genoux vers debout ou locomotion
  if (fromPosture === 'crouching' && (toPosture === 'standing' || toPosture === 'locomotion')) {
    return {
      transitionAnim: 'crouch-to-stand',
      duration: 1.8,
    };
  }

  // Cas 4 : De allongé / au sol vers debout ou locomotion
  if (fromPosture === 'laying' && (toPosture === 'standing' || toPosture === 'locomotion')) {
    return {
      transitionAnim: 'stand-up',
      duration: 2.4,
    };
  }

  return null;
}

/**
 * Calcule la durée optimale de crossfade (fondu enchaîné) entre deux poses / animations.
 * Évite les "snaps" brutaux quand deux poses sont très différentes, tout en restant réactif.
 */
export function getDynamicCrossfadeDuration(
  fromAnim: string | null | undefined,
  toAnim: string | null | undefined
): number {
  if (!fromAnim || !toAnim) return 0.25;
  if (fromAnim === toAnim) return 0.15;

  const fromPosture = getAnimationPosture(fromAnim);
  const toPosture = getAnimationPosture(toAnim);

  // Même posture de locomotion (ex: walk -> run ou run -> walk) : transition réactive et rapide
  if (fromPosture === 'locomotion' && toPosture === 'locomotion') {
    return 0.2;
  }

  // Locomotion vers debout ou inversement (ex: idle -> walk)
  if (
    (fromPosture === 'locomotion' && toPosture === 'standing') ||
    (fromPosture === 'standing' && toPosture === 'locomotion')
  ) {
    return 0.3;
  }

  // Même posture stable (ex: debout -> debout, ou assis -> assis)
  if (fromPosture === toPosture) {
    return 0.4;
  }

  // Postures très différentes (ex: couché <-> debout, ou assis <-> debout sans in-between) :
  // Nécessite un fondu ample et lissé pour éviter tout claquement de squelette
  if (
    fromPosture === 'laying' || toPosture === 'laying' ||
    fromPosture === 'crouching' || toPosture === 'crouching'
  ) {
    return 0.75;
  }

  if (fromPosture === 'sitting' || toPosture === 'sitting') {
    return 0.6;
  }

  return 0.35;
}
