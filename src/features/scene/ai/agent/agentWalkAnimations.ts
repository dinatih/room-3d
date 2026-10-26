import { FAB_ANIMATION_DEFINITIONS } from '../../animations/fabManifest';

const fabWalks = FAB_ANIMATION_DEFINITIONS.filter(def => def.tags.includes('npc-walk'));

export const NPC_WALK_ANIMATIONS = [
  'miley-armature-elegant-walk-2l',
  'miley-armature-catwalk-loop',
  'miley-armature-walk-f',
  'female-walk',
  // 'unarmed-walk-forward',
  'walking',
  // 'wheelbarrow-walk-2',
  'miley-armature-walk-relaxed-loop',
  // 'miley-armature-08-angry-walk',
  // 'miley-armature-26-drunk-walk',
  // 'miley-armature-32-groove-walk',
  'miley-armature-41-provocative-walk',
  'catwalk-walking-not-in-place',
  // 'drunk-run-forward',
  // 'drunk-walk',
  'goofy-running',
  'happy-walk',
  // 'holding-walk',
  'running',
  'swagger-walk',
  // 'unarmed-run-forward',
];

/**
 * Vitesses naturelles (cm/s) mesurées sur les avant-pieds en appui de Lara Native.
 * La cadence est ensuite adaptée à la foulée et au déplacement réels de chaque personnage.
 * 1 unité 3D = 1 cm.
 */
export const ANIMATION_WALK_SPEEDS: Record<string, number> = {
  ...Object.fromEntries(fabWalks.map(def => [def.id, def.walkSpeed!])),
  'walking': 157.1,
  'walk': 157.1,
  'female-walk': 123.3,
  'walking-backward': 110.5,
  'walking-slow': 27.0,
  'happy-walk': 143.0,
  'happy-walk-not-in-place': 158.6,
  'swagger-walk': 88.2,
  'catwalk-walking-not-in-place': 95.3,
  'goofy-running': 175.3,
  'running': 301.9,
  'miley-armature-walk-f': 76.4,
  'miley-armature-elegant-walk-2l': 59.6,
  'miley-armature-catwalk-loop': 93.7,
  'miley-armature-walk-relaxed-loop': 38.8,
  'miley-armature-41-provocative-walk': 100.0,
};

export const DEFAULT_WALK_SPEED = ANIMATION_WALK_SPEEDS.walking;

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
