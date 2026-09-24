export const NPC_WALK_ANIMATIONS = [
  'miley-armature-elegant-walk-2l',
  'miley-armature-catwalk-loop',
  'miley-armature-walk-f',
  'anim-female-walk',
  'anim-happy-walk-not-in-place',
  'anim-walking',
  'miley-armature-walk-relaxed-loop',
  'miley-armature-41-provocative-walk',
  'anim-catwalk-walking-not-in-place',
  'anim-happy-walk',
  'anim-swagger-walk',
];

export function getRandomNpcWalkAnimation(characterId?: string): string {
  if (characterId === 'xbot') {
    return 'anim-walking';
  }
  return NPC_WALK_ANIMATIONS[Math.floor(Math.random() * NPC_WALK_ANIMATIONS.length)];
}
