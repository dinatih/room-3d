import { FAB_ANIMATION_DEFINITIONS } from '../../animations/fabManifest';

const fabWalks = FAB_ANIMATION_DEFINITIONS.filter(def => def.tags.includes('npc-walk'));

export const NPC_WALK_ANIMATIONS = [
  // 'miley-armature-elegant-walk-2l',
  // 'miley-armature-catwalk-loop',
  // 'miley-armature-walk-f',
  'female-walk',
  // 'happy-walk-not-in-place',
  // 'unarmed-walk-forward',
  'walking',
  // 'walking-slow',
  // 'wheelbarrow-walk-2',
  // 'miley-armature-walk-relaxed-loop',
  // 'miley-armature-08-angry-walk',
  // 'miley-armature-26-drunk-walk',
  // 'miley-armature-32-groove-walk',
  // 'miley-armature-41-provocative-walk',
  // 'catwalk-walking-not-in-place',
  // 'drunk-run-forward',
  // 'drunk-walk',
  'goofy-running',
  // 'happy-walk',
  // 'holding-walk',
  // 'running',
  // 'swagger-walk',
  // 'unarmed-run-forward',
];

/**
 * Vitesses de translation naturelle (en cm/s) calibrées sur la foulée réelle de chaque animation.
 * 1 unité 3D = 1 cm.
 */
export const ANIMATION_WALK_SPEEDS: Record<string, number> = {
  ...Object.fromEntries(fabWalks.map(def => [def.id, def.walkSpeed!])),
  'walking': 162.0,
  'walk': 162.0,
  'female-walk': 124.0,
  'walking-backward': 116.0,
  'walking-slow': 28.5,
  'happy-walk': 140.0,
  'happy-walk-not-in-place': 162.0,
  'swagger-walk': 92.0,
  'catwalk-walking-not-in-place': 103.0,
  'running': 360.0,
  'miley-armature-walk-f': 110.0,
  'miley-armature-elegant-walk-2l': 120.0,
  'miley-armature-catwalk-loop': 115.0,
  'miley-armature-walk-relaxed-loop': 100.0,
  'miley-armature-41-provocative-walk': 95.0,
};

export const DEFAULT_WALK_SPEED = 162.0;

export function getWalkSpeedForAnimation(animNameOrId?: string | null): number {
  if (!animNameOrId) return DEFAULT_WALK_SPEED;
  const key = animNameOrId.split('/').pop()?.replace('.glb', '').replace(/^anim_/, '') || animNameOrId;
  return ANIMATION_WALK_SPEEDS[key] ?? ANIMATION_WALK_SPEEDS[animNameOrId] ?? DEFAULT_WALK_SPEED;
}

export function getRandomNpcWalkAnimation(characterId?: string): string {
  if (characterId === 'xbot' || characterId === 'unitree-h2') {
    return 'walking';
  }
  return NPC_WALK_ANIMATIONS[Math.floor(Math.random() * NPC_WALK_ANIMATIONS.length)];
}
