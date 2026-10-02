/**
 * animationTransitions.ts
 * Système intelligent de transition entre animations :
 * - Détection des postures (debout, assis, couché, accroupi, locomotion)
 * - Choix des clips de transition dédiés (in-between comme sit-to-stand, crouch-to-stand, getting-up)
 * - Calcul adaptatif de la durée de crossfade (blendDuration)
 */

export type CharacterPosture = 'standing' | 'sitting' | 'laying' | 'crouching' | 'locomotion';

/**
 * Détermine la posture générale d'une animation à partir de son identifiant ou chemin.
 */
export function getAnimationPosture(animIdOrPath: string | null | undefined): CharacterPosture {
  if (!animIdOrPath) return 'standing';
  const name = animIdOrPath.toLowerCase();

  if (
    name.includes('sit') ||
    name.includes('chair') ||
    name.includes('sofa') ||
    name.includes('bench')
  ) {
    if (name.includes('situps')) return 'laying';
    if (name.includes('sit-to-stand') || name.includes('sit_to_stand')) return 'standing';
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
 * Retourne l'animation de transition et sa durée estimée si trouvée.
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
    // Si stand_to_sit est disponible
    return {
      transitionAnim: 'animations/poses_idles/miley_armature_stand_to_sit.glb',
      duration: 2.0,
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
