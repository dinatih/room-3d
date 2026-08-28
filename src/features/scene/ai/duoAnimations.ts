export interface DuoAnimationDef {
  id: string;
  label: string;
  icon: string;
  animA: string;
  animB: string;
  dist?: number;
  rotA?: number;
  rotB?: number;
  offsetA?: [number, number, number];
  offsetB?: [number, number, number];
  duration?: number;
}

export const DUO_ANIMATIONS: DuoAnimationDef[] = [
  { id: 'b1', label: 'B1', icon: '💥', animA: 'animations/combat/miley_armature_b1_fall_kicked_knockout.glb', animB: 'animations/locomotion/miley_armature_b1_attack_back_somersault_flip.glb', dist: 100, duration: 4.5 },
  { id: 'd1', label: 'D1', icon: '🤺', animA: 'animations/combat/miley_armature_d1_attack_arms_block.glb', animB: 'animations/combat/miley_armature_d1_dodge_sideways.glb', dist: 100, duration: 3.5 },
  { id: 'd4', label: 'D4', icon: '🤺', animA: 'animations/combat/miley_armature_d4_attack_reverse_front_snap_kick.glb', animB: 'animations/combat/miley_armature_d4_dodge_roll_back.glb', dist: 100, duration: 3.5 },
  { id: 'f2', label: 'F2', icon: '🥊', animA: 'animations/combat/miley_armature_f2_attack_straight_punch02.glb', animB: 'animations/locomotion/miley_armature_f2_fall_to_ground_face_up01.glb', dist: 100, duration: 4.0 },
  { id: 'h1', label: 'H1', icon: '👊', animA: 'animations/combat/miley_armature_h1_hit_punches.glb', animB: 'animations/combat/miley_armature_h1_attack_punches.glb', dist: 100, duration: 4.0 },
  { id: 'h2', label: 'H2', icon: '👊', animA: 'animations/combat/miley_armature_h2_attack_side_kicks.glb', animB: 'animations/combat/miley_armature_h2_hit_dodge.glb', dist: 100, duration: 4.0 },
  { id: 'h4', label: 'H4', icon: '👊', animA: 'animations/combat/miley_armature_h4_attack_rising_kick.glb', animB: 'animations/combat/miley_armature_h4_hit_staggering.glb', dist: 100, duration: 4.0 },
  { id: 'ko1', label: 'Ko1', icon: '😵', animA: 'animations/locomotion/miley_armature_ko1_fall_to_ground_sprawl.glb', animB: 'animations/combat/miley_armature_ko1_attack_uppercut.glb', dist: 100, duration: 4.5 },
  { id: 'ko2', label: 'Ko2', icon: '😵', animA: 'animations/combat/miley_armature_ko2_attack_hood_kicks.glb', animB: 'animations/locomotion/miley_armature_ko2_fall_to_ground_axel_down.glb', dist: 100, duration: 4.5 },
  { id: 'ko3', label: 'Ko3', icon: '😵', animA: 'animations/interactions/miley_armature_ko3_attack_hammer_fist.glb', animB: 'animations/locomotion/miley_armature_ko3_fall_to_ground_side_up02.glb', dist: 100, duration: 4.5 },
  { id: 'p1', label: 'P1', icon: '😤', animA: 'animations/combat/miley_armature_p1_standoff_push_knockout.glb', animB: 'animations/combat/miley_armature_p1_standoff_block_straight_punch.glb', dist: 50, duration: 4.0 },
  { id: 'p2', label: 'P2', icon: '😤', animA: 'animations/poses_idles/miley_armature_p2_standoff_provokes_m1.glb', animB: 'animations/poses_idles/miley_armature_p2_standoff_provokes_m2.glb', dist: 50, duration: 4.0 },
  { id: 's1', label: 'S1', icon: '🥋', animA: 'animations/combat/miley_armature_s1_sparring_punch_m1.glb', animB: 'animations/combat/miley_armature_s1_sparring_punch_m2.glb', dist: 100, duration: 4.0 },
  { id: 's2', label: 'S2', icon: '🥋', animA: 'animations/combat/miley_armature_s2_sparring_dodges01.glb', animB: 'animations/combat/miley_armature_s2_sparring_kicks.glb', dist: 100, duration: 4.0 },
  { id: 's3', label: 'S3', icon: '🥋', animA: 'animations/combat/miley_armature_s3_sparring_dodges02.glb', animB: 'animations/combat/miley_armature_s3_sparring_reverse_kicks.glb', dist: 100, duration: 4.0 },
  { id: 's4', label: 'S4', icon: '🥋', animA: 'animations/combat/miley_armature_s4_sparring_double_kicks_m1.glb', animB: 'animations/combat/miley_armature_s4_sparring_double_kicks_m2.glb', dist: 100, duration: 4.0 },
  { id: 's5', label: 'S5', icon: '🥋', animA: 'animations/combat/miley_armature_s5_sparring_block_kick.glb', animB: 'animations/combat/miley_armature_s5_sparring_block_hit.glb', dist: 100, duration: 4.0 },
  { id: 't1', label: 'T1', icon: '🤼', animA: 'animations/interactions/miley_armature_t1_attack_thrown.glb', animB: 'animations/combat/miley_armature_t1_hit_suplex.glb', dist: 100, duration: 4.5 },
  { id: 't3', label: 'T3', icon: '🤼', animA: 'animations/locomotion/miley_armature_t3_fall_shoulder_throw.glb', animB: 'animations/interactions/miley_armature_t3_attack_shoulder_throw.glb', dist: 100, duration: 4.5 },
  { id: 't4', label: 'T4', icon: '🤼', animA: 'animations/dances/miley_armature_t4_fall_belly_to_back_slam.glb', animB: 'animations/combat/miley_armature_t4_attack_knee_strike.glb', dist: 100, duration: 4.5 },
  { id: 't5', label: 'T5', icon: '🤼', animA: 'animations/emotes_gestures/miley_armature_t5_attack_headlock_takeover.glb', animB: 'animations/locomotion/miley_armature_t5_fall_headlock_takeover.glb', dist: 100, duration: 4.5 },
  { id: 'pop_dance', label: 'Pop Dance', icon: '🕺', animA: 'animations/dances/miley_armature_couple_pop_dance_m.glb', animB: 'animations/dances/miley_armature_couple_pop_dance_f.glb', dist: 50, duration: 8.0 },
  { id: 'energetic_dance', label: 'Energetic Dance', icon: '🕺', animA: 'animations/dances/miley_armature_energetic_dance_m.glb', animB: 'animations/dances/miley_armature_energetic_dance_f.glb', dist: 100, duration: 8.0 },
  { id: 'slow_dance', label: 'Slow Dance', icon: '💃', animA: 'animations/dances/miley_armature_slow_dance_m.glb', animB: 'animations/dances/miley_armature_slow_dance_f.glb', dist: 50, duration: 8.0 },
  { id: 'cuddle_kiss', label: 'Cuddle Kiss', icon: '😘', animA: 'animations/emotes_gestures/miley_armature_cuddle_kiss_m.glb', animB: 'animations/emotes_gestures/miley_armature_cuddle_kiss_f.glb', dist: 50, duration: 6.0 },
  { id: 'eye_to_eye', label: 'Eye to Eye Kiss', icon: '🤗', animA: 'animations/emotes_gestures/miley_armature_eye_to_eye_hug_kiss_f.glb', animB: 'animations/emotes_gestures/miley_armature_eye_to_eye_hug_kiss_m.glb', dist: 30, duration: 6.0 },
  { id: 'farewell_kiss', label: 'Farewell Kiss', icon: '👋', animA: 'animations/emotes_gestures/miley_armature_farewell_kiss_m.glb', animB: 'animations/emotes_gestures/miley_armature_farewell_kiss_f.glb', dist: 100, duration: 6.0 },
  { id: 'date_bearhug', label: 'Date Bearhug', icon: '🐻', animA: 'animations/interactions/miley_armature_date_bearhug_m.glb', animB: 'animations/interactions/miley_armature_date_bearhug_f.glb', dist: 50, duration: 6.0 },
  { id: 'propose', label: 'Propose', icon: '💍', animA: 'animations/poses_idles/miley_armature_propose_f.glb', animB: 'animations/poses_idles/miley_armature_propose_m.glb', dist: 50, duration: 6.0 },
  { id: 'sit_cuddle', label: 'Sit Cuddle', icon: '🛋️', animA: 'animations/poses_idles/miley_armature_sit_cuddle_hug_m.glb', animB: 'animations/poses_idles/miley_armature_sit_cuddle_hug_f.glb', dist: 50, duration: 6.0 },
  { id: 'double_leg_takedown', label: 'Double Leg Takedown', icon: '🤼', animA: 'animations/combat/anim_best_double_leg_takedown_attacker.glb', animB: 'animations/combat/anim_best_double_leg_takedown_victim.glb', dist: 0, rotA: 0, rotB: Math.PI, offsetA: [0, 0, 0], offsetB: [0, 0, 10], duration: 5.0 },
  { id: 'taken_hostage', label: 'Prise d\'otage', icon: '🚨', animA: 'animations/interactions/anim_taken_hostage_victim.glb', animB: 'animations/interactions/anim_taken_hostage_villain.glb', dist: 0, duration: 5.0 },
  { id: 'shoulder_throw', label: 'Projection épaule', icon: '🥋', animA: 'animations/interactions/anim_shoulder_throw_victim.glb', animB: 'animations/interactions/anim_shoulder_throw_aggressor.glb', dist: 0, duration: 5.0 },
  { id: 'kiss_man_woman', label: 'Baiser Homme / Femme', icon: '💋', animA: 'animations/emotes_gestures/anim_kiss_from_woman.glb', animB: 'animations/emotes_gestures/anim_kiss_from_man.glb', dist: 0, duration: 5.0 },
  { id: 'kiss', label: 'Baiser', icon: '💏', animA: 'animations/emotes_gestures/anim_kiss.glb', animB: 'animations/emotes_gestures/anim_kiss_1.glb', dist: 0, duration: 5.0 },
  { id: 'brutal_assassination', label: 'Assassinat brutal', icon: '🗡️', animA: 'animations/combat/anim_brutal_assassination.glb', animB: 'animations/combat/anim_brutal_assassination_1.glb', dist: 0, duration: 5.5 }
];
