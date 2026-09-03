/**
 * animationPacks.ts — Registre des packs d'animations et poses pour les slots d'interaction.
 * Permet de regrouper des poses (ex: assises de face, assises de côté à 90°, etc.) avec
 * leur décalage de rotation optionnel (rotYOffset) et de sélectionner aléatoirement une pose.
 */

export interface AnimationPackItem {
  animation: string;
  rotYOffset?: number; // Décalage d'orientation en radians propre à l'animation
}

export interface AnimationPackDef {
  id: string;
  name: string;
  defaultRotYOffset?: number; // Décalage de rotation par défaut pour tout le pack (ex: Math.PI / 2 pour side_sitted_pack)
  animations: Array<string | AnimationPackItem>;
}

export const ANIMATION_PACKS: Record<string, AnimationPackDef> = {
  // ── PACK ASSISE DE FACE (Orientation de base 0°) ───────────────────────────
  seated_front: {
    id: 'seated_front',
    name: 'Poses assises de face',
    defaultRotYOffset: 0,
    animations: [
      'animations/poses_idles/anim_sitting_idle.glb',
      'animations/poses_idles/anim_sitting_2.glb',
      // 'animations/poses_idles/anim_sitting_thumbs_up.glb',
      'animations/poses_idles/anim_sitting_talking_1.glb',
      'animations/poses_idles/anim_sitting_talking.glb',
      'animations/poses_idles/anim_sitting_laughing.glb',
      'animations/combat/anim_sitting_gun_motion.glb',
      'animations/poses_idles/anim_sitting_disbelief.glb',
      'animations/poses_idles/anim_sitting.glb',
      'animations/poses_idles/anim_male_sitting_pose_2.glb',
      'animations/poses_idles/anim_male_sitting_pose_1.glb',
      'animations/poses_idles/anim_female_sitting_pose.glb',
      // 'animations/poses_idles/anim_cheering_while_sitting.glb',
      'animations/poses_idles/miley_armature_sit_talk.glb',
      'animations/poses_idles/miley_armature_sit_look_up_laugh.glb',
      'animations/interactions/anim_having_a_meeting_female.glb',
      'animations/interactions/anim_having_a_meeting_male.glb',
    ],
  },

  // ── PACK ASSISE DE CÔTÉ (Orientation décalée de 90° / π/2) ────────────────
  seated_side: {
    id: 'seated_side',
    name: 'Poses assises de côté (90°)',
    defaultRotYOffset: Math.PI / 2, // Rotation de départ décalée de 90°
    animations: [
      'animations/poses_idles/anim_female_sitting_pose_1.glb',
      'animations/poses_idles/anim_female_sitting_pose_2.glb',
      'animations/poses_idles/anim_female_sitting_pose_3.glb',
    ],
  },

  // ── PACK ALLONGÉ / AU SOL ─────────────────────────────────────────────────
  laying_pack: {
    id: 'laying_pack',
    name: 'Animations allongées / au sol',
    animations: [
      { animation: 'animations/poses_idles/anim_laying.glb', rotYOffset: Math.PI / 2 },
      { animation: 'animations/poses_idles/anim_laying_1.glb', rotYOffset: Math.PI / 2 },
      { animation: 'animations/poses_idles/anim_laying_idle.glb', rotYOffset: Math.PI / 2  },
      { animation: 'animations/poses_idles/anim_laying_idle_1.glb', rotYOffset: Math.PI / 2  },
      { animation: 'animations/poses_idles/anim_laying_mild_cough.glb', rotYOffset: Math.PI / 2  },
      { animation: 'animations/poses_idles/anim_laying_seizure.glb', rotYOffset: Math.PI / 2  },
      { animation: 'animations/poses_idles/anim_laying_severe_cough.glb', rotYOffset: Math.PI / 2  },
      { animation: 'animations/poses_idles/anim_laying_shrugging.glb', rotYOffset: Math.PI / 2  },
      { animation: 'animations/poses_idles/anim_laying_sleeping.glb' },
      { animation: 'animations/poses_idles/anim_male_laying_pose.glb', rotYOffset: Math.PI / 2 },
      { animation: 'animations/poses_idles/anim_male_laying_pose_1.glb', rotYOffset: Math.PI / 2 },
      { animation: 'animations/poses_idles/anim_male_laying_pose_2.glb', rotYOffset: Math.PI / 2 },
      { animation: 'animations/poses_idles/anim_sitting_idle_1.glb', rotYOffset: Math.PI / 2  },
      { animation: 'animations/poses_idles/anim_situps.glb' },
      { animation: 'animations/poses_idles/anim_sleeping_idle.glb' , rotYOffset: Math.PI / 2 },
    ],
  },

  // ── PACK DANSES (toutes les danses du dossier dances/) ────────────────────
  all_dances: {
    id: 'all_dances',
    name: 'Toutes les danses',
    animations: [
      'animations/poses_idles/miley_armature_change_pose.glb',
      'animations/dances/anim_arms_hip_hop_dance.glb',
      'animations/dances/anim_belly_dance.glb',
      'animations/dances/anim_bellydancing.glb',
      'animations/dances/anim_booty_hip_hop_dance.glb',
      'animations/dances/anim_breakdance_1990.glb',
      'animations/dances/anim_breakdance_1990_3.glb',
      'animations/dances/anim_breakdance_ending_1.glb',
      'animations/dances/anim_breakdance_ending_2.glb',
      'animations/dances/anim_breakdance_ending_3.glb',
      'animations/dances/anim_breakdance_footwork_1.glb',
      'animations/dances/anim_breakdance_footwork_2.glb',
      'animations/dances/anim_breakdance_footwork_3.glb',
      'animations/dances/anim_breakdance_footwork_to_freeze.glb',
      'animations/dances/anim_breakdance_footwork_to_idle.glb',
      'animations/dances/anim_breakdance_freeze_var_1.glb',
      'animations/dances/anim_breakdance_freeze_var_2.glb',
      'animations/dances/anim_breakdance_freeze_var_3.glb',
      'animations/dances/anim_breakdance_freeze_var_4.glb',
      'animations/dances/anim_breakdance_freezes.glb',
      'animations/dances/anim_breakdance_ready.glb',
      'animations/dances/anim_breakdance_ready_2.glb',
      'animations/dances/anim_breakdance_ready_3.glb',
      'animations/dances/anim_breakdance_swipes.glb',
      'animations/dances/anim_breakdance_uprock.glb',
      'animations/dances/anim_breakdance_uprock_2.glb',
      'animations/dances/anim_breakdance_uprock_to_ground.glb',
      'animations/dances/anim_breakdance_uprock_to_ground_2.glb',
      'animations/dances/anim_breakdance_uprock_var_1.glb',
      'animations/dances/anim_breakdance_uprock_var_1_end.glb',
      'animations/dances/anim_breakdance_uprock_var_1_start.glb',
      'animations/dances/anim_breakdance_uprock_var_2.glb',
      'animations/dances/anim_brooklyn_uprock.glb',
      'animations/dances/anim_can_can.glb',
      'animations/dances/anim_crossleg_freeze.glb',
      'animations/dances/anim_dancing.glb',
      'animations/dances/anim_dancing_1.glb',
      'animations/dances/anim_dancing_2.glb',
      'animations/dances/anim_dancing_6.glb',
      'animations/dances/anim_dancing_running_man.glb',
      'animations/dances/anim_dancing_twerk.glb',
      'animations/dances/anim_gangnam_style.glb',
      'animations/dances/anim_head_spinning.glb',
      'animations/dances/anim_hip_hop_dancing.glb',
      'animations/dances/anim_hip_hop_dancing_1.glb',
      'animations/dances/anim_hip_hop_dancing_2.glb',
      'animations/dances/anim_hip_hop_dancing_3.glb',
      'animations/dances/anim_hip_hop_dancing_4.glb',
      'animations/dances/anim_hip_hop_dancing_5.glb',
      'animations/dances/anim_hip_hop_dancing_6.glb',
      'animations/dances/anim_hip_hop_dancing_13.glb',
      'animations/dances/anim_hip_hop_dancing_14.glb',
      'animations/dances/anim_hip_hop_dancing_17.glb',
      'animations/dances/anim_hip_hop_dancing_18.glb',
      'animations/dances/anim_hip_hop_dancing_19.glb',
      'animations/dances/anim_house_dancing.glb',
      'animations/dances/anim_house_dancing_1.glb',
      'animations/dances/anim_house_dancing_2.glb',
      'animations/dances/anim_jazz_dancing.glb',
      'animations/dances/anim_jazz_dancing_1.glb',
      'animations/dances/anim_jazz_dancing_2.glb',
      'animations/dances/anim_jazz_dancing_4.glb',
      'animations/dances/anim_locking_hip_hop_dance.glb',
      'animations/dances/anim_macarena_dance.glb',
      'animations/dances/anim_northern_soul_spin_combo.glb',
      'animations/dances/anim_robot_hip_hop_dance.glb',
      'animations/dances/anim_rumba_dancing.glb',
      'animations/dances/anim_salsa_dancing.glb',
      'animations/dances/anim_salsa_dancing_1.glb',
      'animations/dances/anim_salsa_dancing_2.glb',
      'animations/dances/anim_salsa_dancing_3.glb',
      'animations/dances/anim_salsa_dancing_4.glb',
      'animations/dances/anim_salsa_dancing_5.glb',
      'animations/dances/anim_salsa_dancing_man.glb',
      'animations/dances/anim_samba_dancing.glb',
      'animations/dances/anim_samba_dancing_1.glb',
      'animations/dances/anim_samba_dancing_2.glb',
      'animations/dances/anim_samba_dancing_5.glb',
      'animations/dances/anim_silly_dancing.glb',
      'animations/dances/anim_silly_dancing_2.glb',
      'animations/dances/anim_snake_hip_hop_dance.glb',
      'animations/dances/anim_step_hip_hop_dance.glb',
      'animations/dances/anim_swing_dancing.glb',
      'animations/dances/anim_tut_hip_hop_dance.glb',
      'animations/dances/anim_twist_dance.glb',
      'animations/dances/anim_ymca_dance.glb',
      'animations/dances/miley_armature_aerobic_dance.glb',
      'animations/dances/miley_armature_couple_pop_dance_f.glb',
      'animations/dances/miley_armature_couple_pop_dance_m.glb',
      'animations/dances/miley_armature_dance_graceful.glb',
      'animations/dances/miley_armature_dancetomusic_f.glb',
      'animations/dances/miley_armature_energetic_dance_f.glb',
      'animations/dances/miley_armature_energetic_dance_m.glb',
      'animations/dances/miley_armature_groove_jump_up.glb',
      'animations/dances/miley_armature_livingroom_swing_m.glb',
      'animations/dances/miley_armature_sensual_dance_01.glb',
      'animations/dances/miley_armature_sensual_dance_02.glb',
      'animations/dances/miley_armature_sensual_dance_03.glb',
      'animations/dances/miley_armature_slow_dance_f.glb',
      'animations/dances/miley_armature_slow_dance_m.glb',
      'animations/dances/miley_armature_taunt_dance_loop.glb',
    ],
  },
};

// ── Alias pratiques & rétrocompatibilité ─────────────────────────────────────
ANIMATION_PACKS['seated_front_pack'] = ANIMATION_PACKS['seated_front'];
ANIMATION_PACKS['seated_side_pack']  = ANIMATION_PACKS['seated_side'];
ANIMATION_PACKS['sitted_front_pack'] = ANIMATION_PACKS['seated_front'];
ANIMATION_PACKS['side_sitted_pack']  = ANIMATION_PACKS['seated_side'];
ANIMATION_PACKS['sitting_front']     = ANIMATION_PACKS['seated_front'];
ANIMATION_PACKS['sitting_side']      = ANIMATION_PACKS['seated_side'];

/**
 * Résout une animation aléatoire ou définie et son orientation finale (avec rotY offset si nécessaire)
 * pour un slot d'interaction donné.
 *
 * Dans un pack nommé, chaque entrée peut être :
 *   - une string  : 'animations/poses_idles/anim_laying.glb'
 *   - un objet    : { animation: 'animations/poses_idles/anim_laying.glb', rotYOffset: Math.PI / 2 }
 */
export function resolveSlotAnimation(slot: {
  animation?: string;
  rotY: number;
  animations_random?: string | string[];
  availableAnims?: string[];
}): { animation: string; rotY: number } {
  const baseRotY = slot.rotY;

  // 1. Pack nommé (ex: 'laying_pack', 'seated_front', ...)
  if (typeof slot.animations_random === 'string' && ANIMATION_PACKS[slot.animations_random]) {
    const pack = ANIMATION_PACKS[slot.animations_random];
    const item = pack.animations[Math.floor(Math.random() * pack.animations.length)];
    if (typeof item === 'string') {
      return {
        animation: item,
        rotY: baseRotY + (pack.defaultRotYOffset ?? 0),
      };
    } else {
      return {
        animation: item.animation,
        rotY: baseRotY + (item.rotYOffset ?? pack.defaultRotYOffset ?? 0),
      };
    }
  }

  // 2. Tableau direct de strings dans animations_random ou availableAnims
  const animList = Array.isArray(slot.animations_random)
    ? slot.animations_random
    : (slot.availableAnims && slot.availableAnims.length > 0 ? slot.availableAnims : null);

  if (animList && animList.length > 0) {
    return {
      animation: animList[Math.floor(Math.random() * animList.length)],
      rotY: baseRotY,
    };
  }

  // 3. Animation unique spécifiée ou fallback
  return {
    animation: slot.animation || 'animations/poses_idles/anim_sitting_idle.glb',
    rotY: baseRotY,
  };
}
