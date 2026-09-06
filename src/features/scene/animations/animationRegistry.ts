/**
 * animationRegistry.ts — Registre centralisé et sémantique des animations.
 * Permet d'associer un ID canonique, des alias contextuels, des tags et des métadonnées
 * à chaque fichier d'animation GLB.
 */

export interface AnimationDefinition {
  id: string;                  // ID canonique unique (ex: 'texting_standing')
  path: string;                // Chemin réel GLB relatif à public/
  label?: string;              // Nom lisible pour l'UI
  aliases?: string[];          // Noms contextuels (ex: ['texting', 'inspect_mid_height', 'hold_phone'])
  tags: string[];              // Tags sémantiques (ex: ['standing', 'phone', 'mid_height', 'idle'])
  defaultRotYOffset?: number;  // Décalage natif de rotation (radians) si l'animation n'est pas alignée sur 0
  duration?: number;           // Durée indicative en secondes
}

export const MANUAL_ANIMATION_DEFINITIONS: AnimationDefinition[] = [
  // ── POSES DE BASE & REPOS ──────────────────────────────────────────────────
  {
    id: 't_pose',
    path: 'animations/poses_idles/anim_t_pose.glb',
    label: 'T-Pose (Rest)',
    aliases: ['tpose', 'rest_pose'],
    tags: ['pose', 'rest', 'debug'],
  },
  {
    id: 'standing_idle',
    path: 'animations/poses_idles/anim_action_idle_to_standing_idle.glb',
    label: 'Standing Idle',
    aliases: ['stand_idle', 'standing_default'],
    tags: ['idle', 'standing', 'calm'],
  },
  {
    id: 'miley_idle_01',
    path: 'animations/poses_idles/miley_armature_idle01_f.glb',
    label: 'Idle 01 Female',
    aliases: ['idle_female_1', 'stand_relax'],
    tags: ['idle', 'standing', 'relax', 'female'],
  },
  {
    id: 'miley_idle_02',
    path: 'animations/poses_idles/miley_armature_idle02_f.glb',
    label: 'Idle 02 Female',
    aliases: ['idle_female_2'],
    tags: ['idle', 'standing', 'relax', 'female'],
  },
  {
    id: 'miley_idle_03',
    path: 'animations/poses_idles/miley_armature_idle03_f.glb',
    label: 'Idle 03 Female',
    aliases: ['idle_female_3'],
    tags: ['idle', 'standing', 'relax', 'female'],
  },
  {
    id: 'stand_talk',
    path: 'animations/poses_idles/miley_armature_stand_talk.glb',
    label: 'Stand & Talk',
    aliases: ['talking_standing', 'discuss_standing'],
    tags: ['idle', 'standing', 'social', 'talk'],
  },

  // ── INTERACTIONS OBJETS & TÉLÉPHONE ───────────────────────────────────────
  {
    id: 'texting_standing',
    path: 'animations/poses_idles/anim_texting_while_standing.glb',
    label: 'Texting While Standing',
    aliases: [
      'texting',
      'hold_phone',
      'use_phone',
      'inspect_mid_height',
      'take_object_mid',
      'mid_height_hold',
      'standing_phone'
    ],
    tags: ['standing', 'phone', 'device', 'hands_mid', 'interaction', 'inspect', 'mid_height'],
  },
  {
    id: 'pick_throw',
    path: 'animations/interactions/miley_armature_pick_throw_f1.glb',
    label: 'Pick & Throw',
    aliases: ['pick_up', 'grab_item', 'throw_item'],
    tags: ['standing', 'interaction', 'hands_low', 'grab', 'chore'],
  },
  {
    id: 'acknowledging',
    path: 'animations/interactions/anim_acknowledging.glb',
    label: 'Acknowledging',
    aliases: ['nod', 'agree', 'acknowledge'],
    tags: ['social', 'gesture', 'standing'],
  },

  // ── ASSISES (FRONT & DIVERSES) ─────────────────────────────────────────────
  {
    id: 'sitting_idle',
    path: 'animations/poses_idles/anim_sitting_idle.glb',
    label: 'Sitting Idle',
    aliases: ['sit_idle', 'sit_default'],
    tags: ['sitting', 'seated_front', 'idle', 'relax'],
  },
  {
    id: 'sitting_2',
    path: 'animations/poses_idles/anim_sitting_2.glb',
    label: 'Sitting Relaxed',
    aliases: ['sit_relax'],
    tags: ['sitting', 'seated_front', 'relax'],
  },
  {
    id: 'sitting_talking_1',
    path: 'animations/poses_idles/anim_sitting_talking_1.glb',
    label: 'Sitting & Talking 1',
    aliases: ['sit_talk_1', 'sitting_discussion'],
    tags: ['sitting', 'seated_front', 'social', 'talk'],
  },
  {
    id: 'sitting_talking',
    path: 'animations/poses_idles/anim_sitting_talking.glb',
    label: 'Sitting & Talking 2',
    aliases: ['sit_talk_2'],
    tags: ['sitting', 'seated_front', 'social', 'talk'],
  },
  {
    id: 'sitting_laughing',
    path: 'animations/poses_idles/anim_sitting_laughing.glb',
    label: 'Sitting Laughing',
    aliases: ['sit_laugh'],
    tags: ['sitting', 'seated_front', 'social', 'happy'],
  },
  {
    id: 'sitting_disbelief',
    path: 'animations/poses_idles/anim_sitting_disbelief.glb',
    label: 'Sitting Disbelief',
    aliases: ['sit_disbelief', 'sit_shocked'],
    tags: ['sitting', 'seated_front', 'emote'],
  },
  {
    id: 'sitting_gun_motion',
    path: 'animations/combat/anim_sitting_gun_motion.glb',
    label: 'Sitting Gun Motion',
    aliases: ['sit_play_action'],
    tags: ['sitting', 'seated_front', 'action'],
  },
  {
    id: 'male_sitting_1',
    path: 'animations/poses_idles/anim_male_sitting_pose_1.glb',
    label: 'Male Sitting Pose 1',
    aliases: ['sit_male_1'],
    tags: ['sitting', 'seated_front', 'male'],
  },
  {
    id: 'male_sitting_2',
    path: 'animations/poses_idles/anim_male_sitting_pose_2.glb',
    label: 'Male Sitting Pose 2',
    aliases: ['sit_male_2'],
    tags: ['sitting', 'seated_front', 'male'],
  },
  {
    id: 'female_sitting',
    path: 'animations/poses_idles/anim_female_sitting_pose.glb',
    label: 'Female Sitting Pose',
    aliases: ['sit_female_default'],
    tags: ['sitting', 'seated_front', 'female'],
  },
  {
    id: 'miley_sit_talk',
    path: 'animations/poses_idles/miley_armature_sit_talk.glb',
    label: 'Miley Sit & Talk',
    aliases: ['sit_talk_miley'],
    tags: ['sitting', 'seated_front', 'social', 'female'],
  },
  {
    id: 'miley_sit_look_up_laugh',
    path: 'animations/poses_idles/miley_armature_sit_look_up_laugh.glb',
    label: 'Miley Sit Look Up Laugh',
    aliases: ['sit_laugh_miley'],
    tags: ['sitting', 'seated_front', 'happy', 'female'],
  },
  {
    id: 'meeting_female',
    path: 'animations/interactions/anim_having_a_meeting_female.glb',
    label: 'Meeting Female',
    aliases: ['work_meeting_f', 'desk_meeting_f'],
    tags: ['sitting', 'seated_front', 'work', 'social', 'female'],
  },
  {
    id: 'meeting_male',
    path: 'animations/interactions/anim_having_a_meeting_male.glb',
    label: 'Meeting Male',
    aliases: ['work_meeting_m', 'desk_meeting_m'],
    tags: ['sitting', 'seated_front', 'work', 'social', 'male'],
  },

  // ── ASSISES DE CÔTÉ (90° / π/2) ────────────────────────────────────────────
  {
    id: 'female_sitting_side_1',
    path: 'animations/poses_idles/anim_female_sitting_pose_1.glb',
    label: 'Female Sitting Side 1',
    aliases: ['sit_side_1', 'seat_side_f1'],
    tags: ['sitting', 'seated_side', 'female'],
    defaultRotYOffset: Math.PI / 2,
  },
  {
    id: 'female_sitting_side_2',
    path: 'animations/poses_idles/anim_female_sitting_pose_2.glb',
    label: 'Female Sitting Side 2',
    aliases: ['sit_side_2', 'seat_side_f2'],
    tags: ['sitting', 'seated_side', 'female'],
    defaultRotYOffset: Math.PI / 2,
  },
  {
    id: 'female_sitting_side_3',
    path: 'animations/poses_idles/anim_female_sitting_pose_3.glb',
    label: 'Female Sitting Side 3',
    aliases: ['sit_side_3', 'seat_side_f3'],
    tags: ['sitting', 'seated_side', 'female'],
    defaultRotYOffset: Math.PI / 2,
  },

  // ── COUCHÉ / LIT ──────────────────────────────────────────────────────────
  {
    id: 'laying_default',
    path: 'animations/poses_idles/anim_laying.glb',
    label: 'Laying Default',
    aliases: ['lie_down', 'sleep_default', 'laying_back'],
    tags: ['laying', 'laying_front', 'bed', 'sleep'],
    defaultRotYOffset: Math.PI / 2,
  },
  {
    id: 'laying_1',
    path: 'animations/poses_idles/anim_laying_1.glb',
    label: 'Laying 1',
    aliases: ['lay_1'],
    tags: ['laying', 'laying_front', 'bed', 'sleep'],
    defaultRotYOffset: Math.PI / 2,
  },
  {
    id: 'laying_idle',
    path: 'animations/poses_idles/anim_laying_idle.glb',
    label: 'Laying Idle',
    aliases: ['lay_idle'],
    tags: ['laying', 'laying_front', 'bed', 'sleep'],
    defaultRotYOffset: Math.PI / 2,
  },
  {
    id: 'laying_sleeping',
    path: 'animations/poses_idles/anim_laying_sleeping.glb',
    label: 'Laying Sleeping',
    aliases: ['deep_sleep', 'sleeping_pose'],
    tags: ['laying', 'laying_front', 'bed', 'sleep'],
    defaultRotYOffset: 0,
  },
  {
    id: 'male_laying_1',
    path: 'animations/poses_idles/anim_male_laying_pose_1.glb',
    label: 'Male Laying Pose 1',
    aliases: ['lay_male_1'],
    tags: ['laying', 'laying_front', 'bed', 'male'],
    defaultRotYOffset: Math.PI / 2,
  },
  {
    id: 'male_laying_2',
    path: 'animations/poses_idles/anim_male_laying_pose_2.glb',
    label: 'Male Laying Pose 2',
    aliases: ['lay_male_2'],
    tags: ['laying', 'laying_front', 'bed', 'male'],
    defaultRotYOffset: Math.PI / 2,
  },
  {
    id: 'female_laying_side_1',
    path: 'animations/poses_idles/anim_female_laying_pose_1.glb',
    label: 'Female Laying Side 1',
    aliases: ['lay_side_f1'],
    tags: ['laying', 'laying_side', 'bed', 'female'],
    defaultRotYOffset: 0,
  },
  {
    id: 'female_laying_side_4',
    path: 'animations/poses_idles/anim_female_laying_pose_4.glb',
    label: 'Female Laying Side 4',
    aliases: ['lay_side_f4'],
    tags: ['laying', 'laying_side', 'bed', 'female'],
    defaultRotYOffset: 0,
  },
  {
    id: 'sleeping_idle_side',
    path: 'animations/poses_idles/anim_sleeping_idle.glb',
    label: 'Sleeping Idle Side',
    aliases: ['sleep_side'],
    tags: ['laying', 'laying_side', 'bed', 'sleep'],
    defaultRotYOffset: Math.PI / 6,
  },

  // ── DANSES PRINCIPALES & SPÉCIALES ───────────────────────────────────────
  {
    id: 'miley_change_pose',
    path: 'animations/poses_idles/miley_armature_change_pose.glb',
    label: 'Miley Change Pose Dance',
    aliases: ['change_pose_dance', 'pose_switch'],
    tags: ['dance', 'poses', 'female'],
  },
  {
    id: 'hip_hop_dance',
    path: 'animations/dances/anim_arms_hip_hop_dance.glb',
    label: 'Arms Hip Hop Dance',
    aliases: ['dance_hip_hop', 'hiphop'],
    tags: ['dance', 'hip_hop', 'party'],
  },
  {
    id: 'belly_dance',
    path: 'animations/dances/anim_belly_dance.glb',
    label: 'Belly Dance',
    aliases: ['dance_belly'],
    tags: ['dance', 'party'],
  },
  {
    id: 'salsa_dance',
    path: 'animations/dances/anim_salsa_dancing.glb',
    label: 'Salsa Dancing',
    aliases: ['dance_salsa', 'salsa'],
    tags: ['dance', 'latin', 'party'],
  },
  {
    id: 'gangnam_style',
    path: 'animations/dances/anim_gangnam_style.glb',
    label: 'Gangnam Style',
    aliases: ['dance_gangnam', 'gangnam'],
    tags: ['dance', 'fun', 'party'],
  },
  {
    id: 'macarena',
    path: 'animations/dances/anim_macarena_dance.glb',
    label: 'Macarena Dance',
    aliases: ['dance_macarena', 'macarena'],
    tags: ['dance', 'retro', 'party'],
  },
  {
    id: 'aerobic_dance',
    path: 'animations/dances/miley_armature_aerobic_dance.glb',
    label: 'Aerobic Dance',
    aliases: ['fitness_dance', 'dance_aerobic'],
    tags: ['dance', 'fitness', 'workout'],
  },

  // ── SPORT & ÉTIREMENTS ────────────────────────────────────────────────────
  {
    id: 'arm_stretching',
    path: 'animations/sports_fitness/anim_arm_stretching.glb',
    label: 'Arm Stretching',
    aliases: ['stretch_arms', 'stretch_upper'],
    tags: ['fitness', 'stretch', 'standing', 'warmup'],
  },
  {
    id: 'air_squat',
    path: 'animations/sports_fitness/anim_air_squat_bent_arms.glb',
    label: 'Air Squat',
    aliases: ['squat', 'workout_legs'],
    tags: ['fitness', 'workout', 'standing'],
  },
  {
    id: 'situps',
    path: 'animations/poses_idles/anim_situps.glb',
    label: 'Situps',
    aliases: ['abs_workout', 'situp'],
    tags: ['fitness', 'workout', 'laying', 'bed'],
    defaultRotYOffset: 0,
  }
];

import { WALKER_ANIM_OPTIONS } from '../animOptions';

/**
 * Génération dynamique de l'ensemble complet des ~870 animations.
 * Toutes les animations de WALKER_ANIM_OPTIONS sont intégrées au catalogue :
 * - Les définitions manuelles prévalent (avec leurs alias, defaultRotYOffset et tags affinés).
 * - Les animations restantes héritent automatiquement de tags par dossier (ex: dance, combat, locomotion, poses_idles...)
 *   et de leur durée extraite du label.
 */
const manualPaths = new Set(MANUAL_ANIMATION_DEFINITIONS.map(d => d.path));

// Animations explicitement désactivées ou exclues des packs aléatoires (ex: endings/footwork incomplets)
export const DISABLED_DANCES_PATHS = new Set([
  'animations/dances/anim_breakdance_ending_1.glb',
  'animations/dances/anim_breakdance_ending_2.glb',
  'animations/dances/anim_breakdance_ending_3.glb',
  'animations/dances/anim_breakdance_footwork_1.glb',
  'animations/dances/anim_breakdance_footwork_2.glb',
  'animations/dances/anim_breakdance_footwork_3.glb',
  'animations/dances/anim_breakdance_footwork_to_freeze.glb',
  'animations/dances/anim_breakdance_footwork_to_idle.glb',
  'animations/dances/anim_breakdance_ready.glb',
  'animations/dances/anim_breakdance_ready_2.glb',
  'animations/dances/anim_breakdance_ready_3.glb',
  'animations/dances/anim_breakdance_uprock.glb',
  'animations/dances/anim_breakdance_uprock_2.glb',
  'animations/dances/anim_breakdance_uprock_to_ground.glb',
  'animations/dances/anim_breakdance_uprock_to_ground_2.glb',
  'animations/dances/anim_breakdance_uprock_var_1.glb',
  'animations/dances/anim_breakdance_uprock_var_1_end.glb',
  'animations/dances/anim_breakdance_uprock_var_1_start.glb',
  'animations/dances/anim_breakdance_uprock_var_2.glb',
  'animations/dances/anim_brooklyn_uprock.glb',
  'animations/dances/anim_jazz_dancing_4.glb',
]);

const autoGeneratedDefinitions: AnimationDefinition[] = WALKER_ANIM_OPTIONS
  .filter(opt => opt.value && opt.value !== 'idle' && !manualPaths.has(opt.value))
  .map(opt => {
    const path = opt.value;
    const tags: string[] = [];

    // Dossier d'origine -> tags de catégorie
    if (path.startsWith('animations/dances/')) {
      // Exclure des danses actives celles qui sont marquées désactivées
      if (DISABLED_DANCES_PATHS.has(path)) {
        tags.push('disabled', 'dance_excluded');
      } else {
        tags.push('dance');
      }
    } else if (path.startsWith('animations/combat/')) {
      tags.push('combat');
    } else if (path.startsWith('animations/locomotion/')) {
      tags.push('locomotion', 'walk');
    } else if (path.startsWith('animations/sports_fitness/')) {
      tags.push('fitness', 'sports');
    } else if (path.startsWith('animations/emotes_gestures/')) {
      tags.push('emotes', 'gesture');
    } else if (path.startsWith('animations/interactions/')) {
      tags.push('interaction');
    } else if (path.startsWith('animations/poses_idles/')) {
      tags.push('poses_idles');
    }

    // Détection sémantique additionnelle par nom de fichier
    const fileName = path.split('/').pop()?.toLowerCase() ?? '';
    if (fileName.includes('sit') || fileName.includes('sitted') || fileName.includes('sitting')) {
      tags.push('sitting');
    }
    if (fileName.includes('lay') || fileName.includes('laying') || fileName.includes('sleep')) {
      tags.push('laying');
    }
    if (fileName.includes('dance') && !tags.includes('dance') && !DISABLED_DANCES_PATHS.has(path)) {
      tags.push('dance');
    }

    // Durée indicative extraite du label
    const durMatch = opt.label.match(/([\d.]+)s/);
    const duration = durMatch ? parseFloat(durMatch[1]) : undefined;

    // ID canonique basé sur le nom du fichier sans extension
    const id = fileName.replace(/\.glb$/, '');

    return {
      id,
      path,
      label: opt.label,
      tags,
      duration,
    };
  });

export const ANIMATION_DEFINITIONS: AnimationDefinition[] = [
  ...MANUAL_ANIMATION_DEFINITIONS,
  ...autoGeneratedDefinitions,
];
