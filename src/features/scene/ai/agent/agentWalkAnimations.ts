export const NPC_WALK_ANIMATIONS = [
  'miley-armature-elegant-walk-2l',
  'miley-armature-catwalk-loop',
  'miley-armature-walk-f',
  'female-walk',
  'happy-walk-not-in-place',
  // 'unarmed-walk-forward',
  'walking',
  // 'walking-slow',
  // 'wheelbarrow-walk-2',
  'miley-armature-walk-relaxed-loop',
  // 'miley-armature-08-angry-walk',
  // 'miley-armature-26-drunk-walk',
  // 'miley-armature-32-groove-walk',
  'miley-armature-41-provocative-walk',
  'catwalk-walking-not-in-place',
  // 'drunk-run-forward',
  // 'drunk-walk',
  // 'goofy-running',
  'happy-walk',
  // 'holding-walk',
  // 'running',
  'swagger-walk',
  // 'unarmed-run-forward',
];

export function getRandomNpcWalkAnimation(characterId?: string): string {
  if (characterId === 'xbot') {
    return 'walking';
  }
  return NPC_WALK_ANIMATIONS[Math.floor(Math.random() * NPC_WALK_ANIMATIONS.length)];
}
