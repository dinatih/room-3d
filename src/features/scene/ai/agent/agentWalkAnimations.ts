export const NPC_WALK_ANIMATIONS = [
  'animations/locomotion/miley_armature_elegant_walk_2l.glb',
  'animations/locomotion/miley_armature_catwalk_loop.glb',
  'animations/locomotion/miley_armature_walk_f.glb',
  'animations/locomotion/anim_female_walk.glb',
  'animations/locomotion/anim_happy_walk_not_in_place.glb',
  'animations/locomotion/anim_unarmed_walk_forward.glb',
  'animations/locomotion/anim_walking.glb',
  'animations/locomotion/anim_walking_slow.glb',
  'animations/locomotion/anim_wheelbarrow_walk_2.glb',
  'animations/poses_idles/miley_armature_walk_relaxed_loop.glb',
  'animations/locomotion/miley_armature_08_angry_walk.glb',
  'animations/locomotion/miley_armature_26_drunk_walk.glb',
  'animations/locomotion/miley_armature_32_groove_walk.glb',
  'animations/locomotion/miley_armature_41_provocative_walk.glb',
  'animations/locomotion/anim_catwalk_walking_not_in_place.glb',
  'animations/locomotion/anim_drunk_run_forward.glb',
  'animations/locomotion/anim_drunk_walk.glb',
  'animations/locomotion/anim_goofy_running.glb',
  'animations/locomotion/anim_happy_walk.glb',
  'animations/locomotion/anim_holding_walk.glb',
  'animations/locomotion/anim_running.glb',
  'animations/locomotion/anim_swagger_walk.glb',
  'animations/locomotion/anim_unarmed_run_forward.glb',
];

export function getRandomNpcWalkAnimation(characterId?: string): string {
  if (characterId === 'xbot') {
    return 'animations/locomotion/anim_walking.glb';
  }
  return NPC_WALK_ANIMATIONS[Math.floor(Math.random() * NPC_WALK_ANIMATIONS.length)];
}
