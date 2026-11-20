/** Semantic actions shared by autonomous dogs; native catalogs keep their names. */
export const PITBULL_LIFE_CLIPS = {
  idle: 'idle 50', rest: 'idle_sit_pose 2', walk: 'walk_fwd 29', run: 'run_fwd 13', jump: 'jump 22',
  shake: 'idle_shake_1. 137', shake2: 'idle_shake_2. 81',
  lie: 'idle_lay_pose 2', bedLay: 'interact_bed_lay_exist 270', sleep: 'interact_bed_sleep_exist 221',
  layDown: 'idle_to_idle_lay 111', getUp: 'idle_lay_to_idle 71',
  pee: 'pee 43', poop: 'poop 75', bark: 'idle_bark_04_warning 47', sniff: 'walk_fwd_sniff 46',
} as const;
export type DogAction = keyof typeof PITBULL_LIFE_CLIPS | 'eat';
export type DogLifeClips = Partial<Record<DogAction, string>>;
export const NATIVE_DOG_LIFE_CLIPS: Record<string, DogLifeClips> = {
  'idle drop': { shake: 'idle shake', lie: 'idle to idle lay', pee: 'pee male', poop: 'poop', bark: 'got scent harvest bark jump', sniff: 'walk fwd sniff' },
  'Armature|Armature|labrador_idle_aggressive_pose_01': Object.fromEntries(Object.entries({
    shake: 'idle_shake_01', shake2: 'idle_shake_02',
    lie: 'idle_lay_pose_01', bedLay: 'interact_bed_lay_exist_01', sleep: 'interact_bed_sleep_exist_01',
    layDown: 'idle_to_idle_lay_01', getUp: 'idle_lay_to_idle_01',
    bark: 'idle_bark_04_warning', sniff: 'walk_fwd_sniff_01',
  }).map(([action, suffix]) => [action, 'Armature|Armature|labrador_' + suffix])),
};
export const DOG_LYING_ACTIONS: DogAction[] = ['lie', 'bedLay', 'sleep'];
export const DOG_PAUSES: DogAction[] = ['idle', 'rest', 'jump', 'shake', 'shake2', 'lie', 'bedLay', 'sleep', 'pee', 'poop', 'bark'];
export const DOG_ONE_SHOTS: DogAction[] = ['jump', 'shake', 'shake2', 'pee', 'poop', 'bark', 'layDown', 'getUp'];
