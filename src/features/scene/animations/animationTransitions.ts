/**
 * Animation entry clips and crossfade durations.
 */

import { getAnimationDef } from './animationResolver';

/** Interpolate equivalent orientations along the shortest arc. */
export function lerpAngle(from: number, to: number, progress: number): number {
  const delta = to - from;
  return from + Math.atan2(Math.sin(delta), Math.cos(delta)) * progress;
}

const TRANSITION_CLIP_IDS = new Set([
  'sit-to-stand',
  'stand-to-sit',
  'crouch-to-stand',
  'miley-armature-stand-to-sit',
  'getting-up-from-backside',
  'kip-up',
  'standing-up-from-bed',
  'get-up-bed',
  'stand-up',
  'standing-up',
  'stand-up-1',
]);

export const isPostureTransition = (key: string) => TRANSITION_CLIP_IDS.has(getAnimationDef(key)?.id ?? key);

export const isLocomotionAnimation = (key?: string | null) =>
  Boolean(key && getAnimationDef(key)?.tags.some(tag => ['locomotion', 'walk', 'run'].includes(tag)));

/**
 * Calcule la durée de crossfade Three.js :
 * 0.2s pour les transitions de locomotion (walk/run), 0.4s pour les autres poses.
 */
export function getCrossfadeDuration(fromKey?: string | null, toKey?: string | null): number {
  if (!fromKey || !toKey || fromKey === toKey) return 0.2;
  if (isLocomotionAnimation(fromKey) && isLocomotionAnimation(toKey)) {
    return 0.2;
  }

  return 0.4;
}
