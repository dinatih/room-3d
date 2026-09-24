export const NPC_WALK_ANIMATIONS = [
  'miley-armature-elegant-walk-2l',
  'miley-armature-catwalk-loop',
  'miley-armature-walk-f',
  'anim-female-walk',
  'anim-happy-walk-not-in-place',
  // 'anim-unarmed-walk-forward',
  'anim-walking',
  // 'anim-walking-slow',
  // 'anim-wheelbarrow-walk-2',
  'miley-armature-walk-relaxed-loop',
  // 'miley-armature-08-angry-walk',
  // 'miley-armature-26-drunk-walk',
  // 'miley-armature-32-groove-walk',
  'miley-armature-41-provocative-walk',
  'anim-catwalk-walking-not-in-place',
  // 'anim-drunk-run-forward',
  // 'anim-drunk-walk',
  // 'anim-goofy-running',
  'anim-happy-walk',
  // 'anim-holding-walk',
  // 'anim-running',
  'anim-swagger-walk',
  // 'anim-unarmed-run-forward',
];

export function getRandomNpcWalkAnimation(characterId?: string): string {
  if (characterId === 'xbot') {
    return 'anim-walking';
  }
  return NPC_WALK_ANIMATIONS[Math.floor(Math.random() * NPC_WALK_ANIMATIONS.length)];
}
