/**
 * Walker.tsx — Personnages (Walkers & NPCs).
 * Gère le chargement, les animations, le retargeting et le positionnement dynamique.
 * Updated: 2026-07-27 T-Pose position fix
 */
import { useRef, useLayoutEffect, Suspense, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useHelper } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { cameraState } from '@features/scene/cameraState';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { LAYER_WALKER_DETAIL, LAYER_WALKER } from '@config';
import { applyLaraVariantStyles, type LaraVariant } from './LaraVariants';

export const WALKER_ANIM_OPTIONS = [
  { value: "idle", label: "Idle / Return to Default" },
  { value: "media/sandbox/anims/anim_t-pose.glb", label: "T-Pose" },
  { value: "media/sandbox/anims/anim_acknowledging.glb", label: "acknowledging" },
  { value: "media/sandbox/anims/anim_action_idle_to_fight_idle.glb", label: "Action Idle To Fight Idle" },
  { value: "media/sandbox/anims/anim_action_idle_to_standing_idle.glb", label: "Action Idle To Standing Idle" },
  { value: "media/sandbox/anims/anim_administering_cpr.glb", label: "Administering Cpr" },
  { value: "media/sandbox/anims/anim_aerial_evade.glb", label: "Aerial Evade" },
  { value: "media/sandbox/anims/anim_agreeing.glb", label: "Agreeing" },
  { value: "media/sandbox/anims/anim_aiming.glb", label: "Aiming" },
  { value: "media/sandbox/anims/anim_aiming_gun.glb", label: "Aiming Gun" },
  { value: "media/sandbox/anims/anim_air_squat_bent_arms.glb", label: "Air Squat Bent Arms" },
  { value: "media/sandbox/anims/anim_angry.glb", label: "Angry" },
  { value: "media/sandbox/anims/anim_angry_1.glb", label: "Angry (1)" },
  { value: "media/sandbox/anims/anim_angry_2.glb", label: "Angry (2)" },
  { value: "media/sandbox/anims/anim_angry_gesture.glb", label: "Angry Gesture" },
  { value: "media/sandbox/anims/anim_annoyed_head_shake.glb", label: "annoyed head shake" },
  { value: "media/sandbox/anims/anim_arm_stretching.glb", label: "Arm Stretching" },
  { value: "media/sandbox/anims/anim_armada.glb", label: "Armada" },
  { value: "media/sandbox/anims/anim_armada_1.glb", label: "Armada (1)" },
  { value: "media/sandbox/anims/anim_armada_to_esquiva.glb", label: "armada to esquiva" },
  { value: "media/sandbox/anims/anim_arms_hip_hop_dance.glb", label: "Arms Hip Hop Dance" },
  { value: "media/sandbox/anims/anim_arms_hip_hop_dance_1.glb", label: "Arms Hip Hop Dance (1)" },
  { value: "media/sandbox/anims/anim_ascending_stairs.glb", label: "Ascending Stairs" },
  { value: "media/sandbox/anims/anim_asking_question.glb", label: "Asking Question" },
  { value: "media/sandbox/anims/anim_au.glb", label: "Au" },
  { value: "media/sandbox/anims/anim_au_to_role.glb", label: "Au To Role" },
  { value: "media/sandbox/anims/anim_back_flip_to_uppercut.glb", label: "Back Flip To Uppercut" },
  { value: "media/sandbox/anims/anim_back_squat.glb", label: "Back Squat" },
  { value: "media/sandbox/anims/anim_backward_walking_turn.glb", label: "backward walking turn" },
  { value: "media/sandbox/anims/anim_bartending.glb", label: "Bartending" },
  { value: "media/sandbox/anims/anim_bash.glb", label: "Bash" },
  { value: "media/sandbox/anims/anim_bashful.glb", label: "Bashful" },
  { value: "media/sandbox/anims/anim_beckoning.glb", label: "Beckoning" },
  { value: "media/sandbox/anims/anim_being_carried.glb", label: "Being Carried" },
  { value: "media/sandbox/anims/anim_being_carried_1.glb", label: "Being Carried (1)" },
  { value: "media/sandbox/anims/anim_being_cocky.glb", label: "being cocky" },
  { value: "media/sandbox/anims/anim_belly_dance.glb", label: "Belly Dance" },
  { value: "media/sandbox/anims/anim_bellydancing.glb", label: "Bellydancing" },
  { value: "media/sandbox/anims/anim_bencao.glb", label: "Bencao" },
  { value: "media/sandbox/anims/anim_bicep_curl.glb", label: "Bicep Curl" },
  { value: "media/sandbox/anims/anim_big_hit_to_head.glb", label: "Big Hit To Head" },
  { value: "media/sandbox/anims/anim_big_hit_to_head_1.glb", label: "Big Hit To Head (1)" },
  { value: "media/sandbox/anims/anim_big_rib_hit.glb", label: "Big Rib Hit" },
  { value: "media/sandbox/anims/anim_big_side_hit.glb", label: "Big Side Hit" },
  { value: "media/sandbox/anims/anim_block.glb", label: "Block" },
  { value: "media/sandbox/anims/anim_blocking.glb", label: "Blocking" },
  { value: "media/sandbox/anims/anim_blow_a_kiss.glb", label: "Blow A Kiss" },
  { value: "media/sandbox/anims/anim_body_jab_cross.glb", label: "Body Jab Cross" },
  { value: "media/sandbox/anims/anim_booty_hip_hop_dance.glb", label: "Booty Hip Hop Dance" },
  { value: "media/sandbox/anims/anim_box_idle.glb", label: "box idle" },
  { value: "media/sandbox/anims/anim_box_turn.glb", label: "box turn" },
  { value: "media/sandbox/anims/anim_box_turn_2.glb", label: "box turn (2)" },
  { value: "media/sandbox/anims/anim_box_walk_arc.glb", label: "box walk arc" },
  { value: "media/sandbox/anims/anim_boxing.glb", label: "Boxing" },
  { value: "media/sandbox/anims/anim_boxing_1.glb", label: "Boxing (1)" },
  { value: "media/sandbox/anims/anim_boxing_2.glb", label: "Boxing (2)" },
  { value: "media/sandbox/anims/anim_boxing_3.glb", label: "Boxing (3)" },
  { value: "media/sandbox/anims/anim_boxing_4.glb", label: "Boxing (4)" },
  { value: "media/sandbox/anims/anim_boxing_5.glb", label: "Boxing (5)" },
  { value: "media/sandbox/anims/anim_boxing_6.glb", label: "Boxing (6)" },
  { value: "media/sandbox/anims/anim_braced_hang.glb", label: "Braced Hang" },
  { value: "media/sandbox/anims/anim_braced_hang_hop_left.glb", label: "Braced Hang Hop Left" },
  { value: "media/sandbox/anims/anim_braced_hang_shimmy.glb", label: "Braced Hang Shimmy" },
  { value: "media/sandbox/anims/anim_breakdance_1990.glb", label: "Breakdance 1990" },
  { value: "media/sandbox/anims/anim_breakdance_1990_2.glb", label: "breakdance 1990 (2)" },
  { value: "media/sandbox/anims/anim_breakdance_1990_3.glb", label: "breakdance 1990 (3)" },
  { value: "media/sandbox/anims/anim_breakdance_ending_1.glb", label: "breakdance ending 1" },
  { value: "media/sandbox/anims/anim_breakdance_ending_2.glb", label: "breakdance ending 2" },
  { value: "media/sandbox/anims/anim_breakdance_ending_3.glb", label: "breakdance ending 3" },
  { value: "media/sandbox/anims/anim_breakdance_footwork_1.glb", label: "breakdance footwork 1" },
  { value: "media/sandbox/anims/anim_breakdance_footwork_2.glb", label: "breakdance footwork 2" },
  { value: "media/sandbox/anims/anim_breakdance_footwork_3.glb", label: "breakdance footwork 3" },
  { value: "media/sandbox/anims/anim_breakdance_footwork_to_freeze.glb", label: "breakdance footwork to freeze" },
  { value: "media/sandbox/anims/anim_breakdance_footwork_to_idle.glb", label: "Breakdance Footwork To Idle" },
  { value: "media/sandbox/anims/anim_breakdance_footwork_to_idle_2.glb", label: "breakdance footwork to idle (2)" },
  { value: "media/sandbox/anims/anim_breakdance_freeze_var_1.glb", label: "breakdance freeze var 1" },
  { value: "media/sandbox/anims/anim_breakdance_freeze_var_2.glb", label: "breakdance freeze var 2" },
  { value: "media/sandbox/anims/anim_breakdance_freeze_var_3.glb", label: "breakdance freeze var 3" },
  { value: "media/sandbox/anims/anim_breakdance_freeze_var_4.glb", label: "breakdance freeze var 4" },
  { value: "media/sandbox/anims/anim_breakdance_freezes.glb", label: "Breakdance Freezes" },
  { value: "media/sandbox/anims/anim_breakdance_freezes_1.glb", label: "Breakdance Freezes (1)" },
  { value: "media/sandbox/anims/anim_breakdance_freezes_2.glb", label: "Breakdance Freezes (2)" },
  { value: "media/sandbox/anims/anim_breakdance_ready.glb", label: "breakdance ready" },
  { value: "media/sandbox/anims/anim_breakdance_ready_2.glb", label: "breakdance ready (2)" },
  { value: "media/sandbox/anims/anim_breakdance_ready_3.glb", label: "breakdance ready (3)" },
  { value: "media/sandbox/anims/anim_breakdance_swipes.glb", label: "breakdance swipes" },
  { value: "media/sandbox/anims/anim_breakdance_uprock.glb", label: "breakdance uprock" },
  { value: "media/sandbox/anims/anim_breakdance_uprock_2.glb", label: "breakdance uprock (2)" },
  { value: "media/sandbox/anims/anim_breakdance_uprock_to_ground.glb", label: "breakdance uprock to ground" },
  { value: "media/sandbox/anims/anim_breakdance_uprock_to_ground_2.glb", label: "breakdance uprock to ground (2)" },
  { value: "media/sandbox/anims/anim_breakdance_uprock_var_1.glb", label: "breakdance uprock var 1" },
  { value: "media/sandbox/anims/anim_breakdance_uprock_var_1_end.glb", label: "breakdance uprock var 1 end" },
  { value: "media/sandbox/anims/anim_breakdance_uprock_var_1_start.glb", label: "breakdance uprock var 1 start" },
  { value: "media/sandbox/anims/anim_breakdance_uprock_var_2.glb", label: "breakdance uprock var 2" },
  { value: "media/sandbox/anims/anim_brooklyn_uprock.glb", label: "Brooklyn Uprock" },
  { value: "media/sandbox/anims/anim_brutal_assassination.glb", label: "Brutal Assassination" },
  { value: "media/sandbox/anims/anim_brutal_assassination_1.glb", label: "Brutal Assassination (1)" },
  { value: "media/sandbox/anims/anim_burpee.glb", label: "Burpee" },
  { value: "media/sandbox/anims/anim_burpee_end.glb", label: "Burpee End" },
  { value: "media/sandbox/anims/anim_button_pushing.glb", label: "Button Pushing" },
  { value: "media/sandbox/anims/anim_can_can.glb", label: "Can Can" },
  { value: "media/sandbox/anims/anim_capoeira.glb", label: "Capoeira" },
  { value: "media/sandbox/anims/anim_capoeira_2.glb", label: "capoeira (2)" },
  { value: "media/sandbox/anims/anim_capoeira_3.glb", label: "capoeira (3)" },
  { value: "media/sandbox/anims/anim_cards.glb", label: "Cards" },
  { value: "media/sandbox/anims/anim_catwalk_sequence_01.glb", label: "Catwalk Sequence 01" },
  { value: "media/sandbox/anims/anim_catwalk_sequence_02.glb", label: "Catwalk Sequence 02" },
  { value: "media/sandbox/anims/anim_catwalk_sequence_03.glb", label: "Catwalk Sequence 03" },
  { value: "media/sandbox/anims/anim_catwalk_sequence_04.glb", label: "Catwalk Sequence 04" },
  { value: "media/sandbox/anims/anim_catwalk_sequence_05.glb", label: "Catwalk Sequence 05" },
  { value: "media/sandbox/anims/anim_catwalk_walking_not_in_place.glb", label: "Catwalk Walking not in place" },
  { value: "media/sandbox/anims/anim_ch22_nonpbr.glb", label: "Ch22 Nonpbr" },
  { value: "media/sandbox/anims/anim_ch47_nonpbr.glb", label: "Ch47 Nonpbr" },
  { value: "media/sandbox/anims/anim_chapa_2.glb", label: "Chapa 2" },
  { value: "media/sandbox/anims/anim_chapa_giratoria.glb", label: "Chapa-Giratoria" },
  { value: "media/sandbox/anims/anim_chapa_giratoria_2.glb", label: "chapa giratoria 2" },
  { value: "media/sandbox/anims/anim_chapaeu_de_couro.glb", label: "chapaeu de couro" },
  { value: "media/sandbox/anims/anim_cheering.glb", label: "Cheering" },
  { value: "media/sandbox/anims/anim_cheering_while_sitting.glb", label: "Cheering While Sitting" },
  { value: "media/sandbox/anims/anim_clapping.glb", label: "Clapping" },
  { value: "media/sandbox/anims/anim_clean_and_jerk.glb", label: "Clean And Jerk" },
  { value: "media/sandbox/anims/anim_climbing.glb", label: "Climbing" },
  { value: "media/sandbox/anims/anim_climbing_1.glb", label: "Climbing (1)" },
  { value: "media/sandbox/anims/anim_climbing_a_rope.glb", label: "Climbing A Rope" },
  { value: "media/sandbox/anims/anim_climbing_a_rope_1.glb", label: "Climbing A Rope (1)" },
  { value: "media/sandbox/anims/anim_climbing_down.glb", label: "Climbing Down" },
  { value: "media/sandbox/anims/anim_climbing_up_wall.glb", label: "Climbing Up Wall" },
  { value: "media/sandbox/anims/anim_closing.glb", label: "Closing" },
  { value: "media/sandbox/anims/anim_cocky_head_turn.glb", label: "Cocky Head Turn" },
  { value: "media/sandbox/anims/anim_convulsing.glb", label: "Convulsing" },
  { value: "media/sandbox/anims/anim_corkscrew_kip_up.glb", label: "Corkscrew Kip Up" },
  { value: "media/sandbox/anims/anim_counting.glb", label: "Counting" },
  { value: "media/sandbox/anims/anim_couple_man.glb", label: "Couple Man" },
  { value: "media/sandbox/anims/anim_couple_woman.glb", label: "Couple Woman" },
  { value: "media/sandbox/anims/anim_cow_milking.glb", label: "Cow Milking" },
  { value: "media/sandbox/anims/anim_crawl_backwards.glb", label: "Crawl Backwards" },
  { value: "media/sandbox/anims/anim_crawl_backwards_in_prone.glb", label: "Crawl Backwards In Prone" },
  { value: "media/sandbox/anims/anim_crawling_backwards.glb", label: "Crawling Backwards" },
  { value: "media/sandbox/anims/anim_cross_jumps_rotation.glb", label: "Cross Jumps Rotation" },
  { value: "media/sandbox/anims/anim_cross_punch.glb", label: "Cross Punch" },
  { value: "media/sandbox/anims/anim_crossleg_freeze.glb", label: "Crossleg Freeze" },
  { value: "media/sandbox/anims/anim_crouch_idle.glb", label: "crouch idle" },
  { value: "media/sandbox/anims/anim_crouch_look_around_corner.glb", label: "Crouch Look Around Corner" },
  { value: "media/sandbox/anims/anim_crouch_to_stand.glb", label: "Crouch To Stand" },
  { value: "media/sandbox/anims/anim_crouch_to_standing_idle.glb", label: "crouch to standing idle" },
  { value: "media/sandbox/anims/anim_crying.glb", label: "Crying" },
  { value: "media/sandbox/anims/anim_dancing.glb", label: "Dancing" },
  { value: "media/sandbox/anims/anim_dancing_1.glb", label: "Dancing (1)" },
  { value: "media/sandbox/anims/anim_dancing_2.glb", label: "Dancing (2)" },
  { value: "media/sandbox/anims/anim_dancing_3.glb", label: "Dancing (3)" },
  { value: "media/sandbox/anims/anim_dancing_4.glb", label: "Dancing (4)" },
  { value: "media/sandbox/anims/anim_dancing_5.glb", label: "Dancing (5)" },
  { value: "media/sandbox/anims/anim_dancing_6.glb", label: "Dancing (6)" },
  { value: "media/sandbox/anims/anim_dancing_7.glb", label: "Dancing (7)" },
  { value: "media/sandbox/anims/anim_dancing_maraschino_step.glb", label: "Dancing Maraschino Step" },
  { value: "media/sandbox/anims/anim_dancing_maraschino_step_1.glb", label: "Dancing Maraschino Step (1)" },
  { value: "media/sandbox/anims/anim_dancing_running_man.glb", label: "Dancing Running Man" },
  { value: "media/sandbox/anims/anim_dancing_twerk.glb", label: "Dancing Twerk" },
  { value: "media/sandbox/anims/anim_defeat.glb", label: "Defeat" },
  { value: "media/sandbox/anims/anim_descending_stairs.glb", label: "Descending Stairs" },
  { value: "media/sandbox/anims/anim_dig_and_plant_seeds.glb", label: "Dig And Plant Seeds" },
  { value: "media/sandbox/anims/anim_dig_and_plant_seeds_1.glb", label: "Dig And Plant Seeds (1)" },
  { value: "media/sandbox/anims/anim_disappointed.glb", label: "Disappointed" },
  { value: "media/sandbox/anims/anim_dismissing_gesture.glb", label: "dismissing gesture" },
  { value: "media/sandbox/anims/anim_dive_roll.glb", label: "Dive Roll" },
  { value: "media/sandbox/anims/anim_dodging.glb", label: "Dodging" },
  { value: "media/sandbox/anims/anim_dodging_1.glb", label: "Dodging (1)" },
  { value: "media/sandbox/anims/anim_double_leg_takedown___attacker.glb", label: "Double Leg Takedown   Attacker" },
  { value: "media/sandbox/anims/anim_double_leg_takedown_attacker.glb", label: "Double Leg Takedown - Attacker" },
  { value: "media/sandbox/anims/anim_double_leg_takedown_victim.glb", label: "Double Leg Takedown - Victim" },
  { value: "media/sandbox/anims/anim_drinking_fountain.glb", label: "Drinking Fountain" },
  { value: "media/sandbox/anims/anim_dropping.glb", label: "Dropping" },
  { value: "media/sandbox/anims/anim_drunk_idle.glb", label: "drunk idle" },
  { value: "media/sandbox/anims/anim_drunk_idle_variation.glb", label: "Drunk Idle Variation" },
  { value: "media/sandbox/anims/anim_drunk_idle_variation_1.glb", label: "Drunk Idle Variation (1)" },
  { value: "media/sandbox/anims/anim_drunk_idle_variation_2.glb", label: "drunk idle variation (2)" },
  { value: "media/sandbox/anims/anim_drunk_run_backward.glb", label: "drunk run backward" },
  { value: "media/sandbox/anims/anim_drunk_run_forward.glb", label: "drunk run forward" },
  { value: "media/sandbox/anims/anim_drunk_running_left_turn.glb", label: "drunk running left turn" },
  { value: "media/sandbox/anims/anim_drunk_turn.glb", label: "drunk turn" },
  { value: "media/sandbox/anims/anim_drunk_walk.glb", label: "Drunk Walk" },
  { value: "media/sandbox/anims/anim_drunk_walk_backwards.glb", label: "drunk walk backwards" },
  { value: "media/sandbox/anims/anim_drunk_walking_turn.glb", label: "drunk walking turn" },
  { value: "media/sandbox/anims/anim_ducking.glb", label: "Ducking" },
  { value: "media/sandbox/anims/anim_dwarf_idle.glb", label: "Dwarf Idle" },
  { value: "media/sandbox/anims/anim_dying.glb", label: "Dying" },
  { value: "media/sandbox/anims/anim_elbow_punch.glb", label: "Elbow Punch" },
  { value: "media/sandbox/anims/anim_elbow_uppercut_combo.glb", label: "Elbow Uppercut Combo" },
  { value: "media/sandbox/anims/anim_entering_code.glb", label: "Entering Code" },
  { value: "media/sandbox/anims/anim_entry.glb", label: "Entry" },
  { value: "media/sandbox/anims/anim_esquiva_1.glb", label: "esquiva 1" },
  { value: "media/sandbox/anims/anim_esquiva_2.glb", label: "Esquiva 2" },
  { value: "media/sandbox/anims/anim_esquiva_3.glb", label: "esquiva 3" },
  { value: "media/sandbox/anims/anim_esquiva_4.glb", label: "esquiva 4" },
  { value: "media/sandbox/anims/anim_esquiva_5.glb", label: "esquiva 5" },
  { value: "media/sandbox/anims/anim_fall_flat.glb", label: "Fall Flat" },
  { value: "media/sandbox/anims/anim_falling.glb", label: "Falling" },
  { value: "media/sandbox/anims/anim_falling_idle.glb", label: "Falling Idle" },
  { value: "media/sandbox/anims/anim_female_dance_pose.glb", label: "Female Dance Pose" },
  { value: "media/sandbox/anims/anim_female_dance_pose_1.glb", label: "Female Dance Pose (1)" },
  { value: "media/sandbox/anims/anim_female_dance_pose_2.glb", label: "Female Dance Pose (2)" },
  { value: "media/sandbox/anims/anim_female_dynamic_pose.glb", label: "Female Dynamic Pose" },
  { value: "media/sandbox/anims/anim_female_laying_pose.glb", label: "Female Laying Pose" },
  { value: "media/sandbox/anims/anim_female_laying_pose_1.glb", label: "Female Laying Pose (1)" },
  { value: "media/sandbox/anims/anim_female_laying_pose_2.glb", label: "Female Laying Pose (2)" },
  { value: "media/sandbox/anims/anim_female_laying_pose_3.glb", label: "Female Laying Pose (3)" },
  { value: "media/sandbox/anims/anim_female_laying_pose_4.glb", label: "Female Laying Pose (4)" },
  { value: "media/sandbox/anims/anim_female_laying_pose_5.glb", label: "Female Laying Pose (5)" },
  { value: "media/sandbox/anims/anim_female_laying_pose_6.glb", label: "Female Laying Pose (6)" },
  { value: "media/sandbox/anims/anim_female_laying_pose_7.glb", label: "Female Laying Pose (7)" },
  { value: "media/sandbox/anims/anim_female_laying_pose_8.glb", label: "Female Laying Pose (8)" },
  { value: "media/sandbox/anims/anim_female_laying_pose_9.glb", label: "Female Laying Pose (9)" },
  { value: "media/sandbox/anims/anim_female_locomotion_pose.glb", label: "Female Locomotion Pose" },
  { value: "media/sandbox/anims/anim_female_peek_and_aim.glb", label: "Female Peek And Aim" },
  { value: "media/sandbox/anims/anim_female_sitting_pose.glb", label: "Female Sitting Pose" },
  { value: "media/sandbox/anims/anim_female_sitting_pose_1.glb", label: "Female Sitting Pose (1)" },
  { value: "media/sandbox/anims/anim_female_sitting_pose_2.glb", label: "Female Sitting Pose (2)" },
  { value: "media/sandbox/anims/anim_female_sitting_pose_3.glb", label: "Female Sitting Pose (3)" },
  { value: "media/sandbox/anims/anim_female_sitting_pose_4.glb", label: "Female Sitting Pose (4)" },
  { value: "media/sandbox/anims/anim_female_standing_pose.glb", label: "Female Standing Pose" },
  { value: "media/sandbox/anims/anim_female_standing_pose_1.glb", label: "Female Standing Pose (1)" },
  { value: "media/sandbox/anims/anim_female_standing_pose_2.glb", label: "Female Standing Pose (2)" },
  { value: "media/sandbox/anims/anim_female_standing_pose_3.glb", label: "Female Standing Pose (3)" },
  { value: "media/sandbox/anims/anim_female_standing_pose_4.glb", label: "Female Standing Pose (4)" },
  { value: "media/sandbox/anims/anim_female_walk.glb", label: "Female Walk" },
  { value: "media/sandbox/anims/anim_femme_peek_around_corner.glb", label: "Femme Peek Around Corner" },
  { value: "media/sandbox/anims/anim_fight_idle.glb", label: "Fight Idle" },
  { value: "media/sandbox/anims/anim_finding.glb", label: "Finding" },
  { value: "media/sandbox/anims/anim_fireball.glb", label: "Fireball" },
  { value: "media/sandbox/anims/anim_fist_fight_b.glb", label: "Fist Fight B" },
  { value: "media/sandbox/anims/anim_flair.glb", label: "Flair" },
  { value: "media/sandbox/anims/anim_flair_2.glb", label: "flair (2)" },
  { value: "media/sandbox/anims/anim_flair_3.glb", label: "flair (3)" },
  { value: "media/sandbox/anims/anim_flip_kick.glb", label: "Flip Kick" },
  { value: "media/sandbox/anims/anim_flip_kick_1.glb", label: "Flip Kick (1)" },
  { value: "media/sandbox/anims/anim_floating.glb", label: "Floating" },
  { value: "media/sandbox/anims/anim_flying.glb", label: "Flying" },
  { value: "media/sandbox/anims/anim_flying_bicycle_kick.glb", label: "Flying Bicycle Kick" },
  { value: "media/sandbox/anims/anim_focus.glb", label: "Focus" },
  { value: "media/sandbox/anims/anim_free_hang_hop_left.glb", label: "Free Hang Hop Left" },
  { value: "media/sandbox/anims/anim_free_hang_hop_right.glb", label: "Free Hang Hop Right" },
  { value: "media/sandbox/anims/anim_freehang_drop.glb", label: "Freehang Drop" },
  { value: "media/sandbox/anims/anim_front_flip.glb", label: "Front Flip" },
  { value: "media/sandbox/anims/anim_front_twist_flip.glb", label: "Front Twist Flip" },
  { value: "media/sandbox/anims/anim_gaming.glb", label: "Gaming" },
  { value: "media/sandbox/anims/anim_gangnam_style.glb", label: "gangnam style" },
  { value: "media/sandbox/anims/anim_getting_hit_backwards.glb", label: "Getting Hit Backwards" },
  { value: "media/sandbox/anims/anim_getting_up.glb", label: "Getting Up" },
  { value: "media/sandbox/anims/anim_ginga_backward.glb", label: "ginga backward" },
  { value: "media/sandbox/anims/anim_ginga_forward.glb", label: "ginga forward" },
  { value: "media/sandbox/anims/anim_ginga_sideways_1.glb", label: "ginga sideways 1" },
  { value: "media/sandbox/anims/anim_ginga_sideways_2.glb", label: "ginga sideways 2" },
  { value: "media/sandbox/anims/anim_ginga_sideways_to_au.glb", label: "ginga sideways to au" },
  { value: "media/sandbox/anims/anim_ginga_variation_1.glb", label: "Ginga Variation 1" },
  { value: "media/sandbox/anims/anim_ginga_variation_2.glb", label: "ginga variation 2" },
  { value: "media/sandbox/anims/anim_ginga_variation_3.glb", label: "ginga variation 3" },
  { value: "media/sandbox/anims/anim_goalkeeper_body_block.glb", label: "Goalkeeper Body Block" },
  { value: "media/sandbox/anims/anim_goalkeeper_miss.glb", label: "Goalkeeper Miss" },
  { value: "media/sandbox/anims/anim_golf_chip.glb", label: "Golf Chip" },
  { value: "media/sandbox/anims/anim_goofy_running.glb", label: "Goofy Running" },
  { value: "media/sandbox/anims/anim_great_sword_idle.glb", label: "Great Sword Idle" },
  { value: "media/sandbox/anims/anim_great_sword_power_up.glb", label: "Great Sword Power Up" },
  { value: "media/sandbox/anims/anim_guitar_playing.glb", label: "Guitar Playing" },
  { value: "media/sandbox/anims/anim_gunplay.glb", label: "Gunplay" },
  { value: "media/sandbox/anims/anim_gunplay_1.glb", label: "Gunplay (1)" },
  { value: "media/sandbox/anims/anim_gunplay_shooting.glb", label: "Gunplay Shooting" },
  { value: "media/sandbox/anims/anim_hand_raising.glb", label: "Hand Raising" },
  { value: "media/sandbox/anims/anim_hanging_idle.glb", label: "Hanging Idle" },
  { value: "media/sandbox/anims/anim_happy_hand_gesture.glb", label: "Happy Hand Gesture" },
  { value: "media/sandbox/anims/anim_happy_idle.glb", label: "Happy Idle" },
  { value: "media/sandbox/anims/anim_happy_walk.glb", label: "Happy Walk" },
  { value: "media/sandbox/anims/anim_happy_walk_backward.glb", label: "Happy Walk Backward" },
  { value: "media/sandbox/anims/anim_happy_walk_not_in_place.glb", label: "Happy Walk not in place" },
  { value: "media/sandbox/anims/anim_hard_head_nod.glb", label: "hard head nod" },
  { value: "media/sandbox/anims/anim_hard_landing.glb", label: "Hard Landing" },
  { value: "media/sandbox/anims/anim_having_a_meeting_female.glb", label: "Having A Meeting, Female" },
  { value: "media/sandbox/anims/anim_having_a_meeting_male.glb", label: "Having A Meeting, Male" },
  { value: "media/sandbox/anims/anim_head_hit.glb", label: "Head Hit" },
  { value: "media/sandbox/anims/anim_head_nod_yes.glb", label: "Head Nod Yes" },
  { value: "media/sandbox/anims/anim_head_spinning.glb", label: "Head Spinning" },
  { value: "media/sandbox/anims/anim_headbutt.glb", label: "Headbutt" },
  { value: "media/sandbox/anims/anim_header.glb", label: "Header" },
  { value: "media/sandbox/anims/anim_header_soccerball.glb", label: "Header Soccerball" },
  { value: "media/sandbox/anims/anim_header_soccerball_1.glb", label: "Header Soccerball (1)" },
  { value: "media/sandbox/anims/anim_helping_out.glb", label: "Helping Out" },
  { value: "media/sandbox/anims/anim_hip_hop_dancing.glb", label: "Hip Hop Dancing" },
  { value: "media/sandbox/anims/anim_hip_hop_dancing_1.glb", label: "Hip Hop Dancing (1)" },
  { value: "media/sandbox/anims/anim_hip_hop_dancing_10.glb", label: "Hip Hop Dancing (10)" },
  { value: "media/sandbox/anims/anim_hip_hop_dancing_11.glb", label: "Hip Hop Dancing (11)" },
  { value: "media/sandbox/anims/anim_hip_hop_dancing_12.glb", label: "Hip Hop Dancing (12)" },
  { value: "media/sandbox/anims/anim_hip_hop_dancing_13.glb", label: "Hip Hop Dancing (13)" },
  { value: "media/sandbox/anims/anim_hip_hop_dancing_14.glb", label: "Hip Hop Dancing (14)" },
  { value: "media/sandbox/anims/anim_hip_hop_dancing_15.glb", label: "Hip Hop Dancing (15)" },
  { value: "media/sandbox/anims/anim_hip_hop_dancing_16.glb", label: "Hip Hop Dancing (16)" },
  { value: "media/sandbox/anims/anim_hip_hop_dancing_17.glb", label: "Hip Hop Dancing (17)" },
  { value: "media/sandbox/anims/anim_hip_hop_dancing_18.glb", label: "Hip Hop Dancing (18)" },
  { value: "media/sandbox/anims/anim_hip_hop_dancing_19.glb", label: "Hip Hop Dancing (19)" },
  { value: "media/sandbox/anims/anim_hip_hop_dancing_2.glb", label: "Hip Hop Dancing (2)" },
  { value: "media/sandbox/anims/anim_hip_hop_dancing_3.glb", label: "Hip Hop Dancing (3)" },
  { value: "media/sandbox/anims/anim_hip_hop_dancing_4.glb", label: "Hip Hop Dancing (4)" },
  { value: "media/sandbox/anims/anim_hip_hop_dancing_5.glb", label: "Hip Hop Dancing (5)" },
  { value: "media/sandbox/anims/anim_hip_hop_dancing_6.glb", label: "Hip Hop Dancing (6)" },
  { value: "media/sandbox/anims/anim_hip_hop_dancing_7.glb", label: "Hip Hop Dancing (7)" },
  { value: "media/sandbox/anims/anim_hip_hop_dancing_8.glb", label: "Hip Hop Dancing (8)" },
  { value: "media/sandbox/anims/anim_hip_hop_dancing_9.glb", label: "Hip Hop Dancing (9)" },
  { value: "media/sandbox/anims/anim_hit_to_body.glb", label: "Hit To Body" },
  { value: "media/sandbox/anims/anim_hit_to_body_1.glb", label: "Hit To Body (1)" },
  { value: "media/sandbox/anims/anim_hit_to_head.glb", label: "Hit To Head" },
  { value: "media/sandbox/anims/anim_hit_to_side_of_body.glb", label: "Hit To Side Of Body" },
  { value: "media/sandbox/anims/anim_hit_to_the_legs.glb", label: "Hit To The Legs" },
  { value: "media/sandbox/anims/anim_hokey_pokey.glb", label: "Hokey Pokey" },
  { value: "media/sandbox/anims/anim_holding_idle.glb", label: "holding idle" },
  { value: "media/sandbox/anims/anim_holding_turn_left.glb", label: "holding turn left" },
  { value: "media/sandbox/anims/anim_holding_turn_right.glb", label: "holding turn right" },
  { value: "media/sandbox/anims/anim_holding_walk.glb", label: "holding walk" },
  { value: "media/sandbox/anims/anim_hook.glb", label: "Hook" },
  { value: "media/sandbox/anims/anim_house_dancing.glb", label: "House Dancing" },
  { value: "media/sandbox/anims/anim_house_dancing_1.glb", label: "House Dancing (1)" },
  { value: "media/sandbox/anims/anim_house_dancing_2.glb", label: "House Dancing (2)" },
  { value: "media/sandbox/anims/anim_hurricane_kick.glb", label: "Hurricane Kick" },
  { value: "media/sandbox/anims/anim_idle.glb", label: "idle" },
  { value: "media/sandbox/anims/anim_idle_fight.glb", label: "Idle fight" },
  { value: "media/sandbox/anims/anim_idle_left_right.glb", label: "Idle Left Right" },
  { value: "media/sandbox/anims/anim_illegal_elbow_punch.glb", label: "Illegal Elbow Punch" },
  { value: "media/sandbox/anims/anim_injured_walk_right_turn.glb", label: "Injured Walk Right Turn" },
  { value: "media/sandbox/anims/anim_inside_crescent_kick.glb", label: "Inside Crescent Kick" },
  { value: "media/sandbox/anims/anim_insult.glb", label: "Insult" },
  { value: "media/sandbox/anims/anim_inward_block.glb", label: "Inward Block" },
  { value: "media/sandbox/anims/anim_jab_to_elbow_punch.glb", label: "Jab To Elbow Punch" },
  { value: "media/sandbox/anims/anim_jab_to_elbow_punch_1.glb", label: "Jab To Elbow Punch (1)" },
  { value: "media/sandbox/anims/anim_jazz_dancing.glb", label: "Jazz Dancing" },
  { value: "media/sandbox/anims/anim_jazz_dancing_1.glb", label: "Jazz Dancing (1)" },
  { value: "media/sandbox/anims/anim_jazz_dancing_2.glb", label: "Jazz Dancing (2)" },
  { value: "media/sandbox/anims/anim_jazz_dancing_3.glb", label: "Jazz Dancing (3)" },
  { value: "media/sandbox/anims/anim_jazz_dancing_4.glb", label: "Jazz Dancing (4)" },
  { value: "media/sandbox/anims/anim_joyful_jump.glb", label: "Joyful Jump" },
  { value: "media/sandbox/anims/anim_jump.glb", label: "jump" },
  { value: "media/sandbox/anims/anim_jump_away.glb", label: "Jump Away" },
  { value: "media/sandbox/anims/anim_jump_away_1.glb", label: "Jump Away (1)" },
  { value: "media/sandbox/anims/anim_jump_down.glb", label: "Jump Down" },
  { value: "media/sandbox/anims/anim_jump_over.glb", label: "Jump Over" },
  { value: "media/sandbox/anims/anim_jump_push_up.glb", label: "Jump Push Up" },
  { value: "media/sandbox/anims/anim_jumping_down.glb", label: "Jumping Down" },
  { value: "media/sandbox/anims/anim_jumping_down_1.glb", label: "Jumping Down (1)" },
  { value: "media/sandbox/anims/anim_jumping_jacks.glb", label: "Jumping Jacks" },
  { value: "media/sandbox/anims/anim_jumping_over_into_combat.glb", label: "Jumping Over Into Combat" },
  { value: "media/sandbox/anims/anim_jumping_parkour.glb", label: "Jumping parkour" },
  { value: "media/sandbox/anims/anim_jumping_rope.glb", label: "Jumping Rope" },
  { value: "media/sandbox/anims/anim_kettlebell_swing.glb", label: "Kettlebell Swing" },
  { value: "media/sandbox/anims/anim_kick_soccerball.glb", label: "Kick Soccerball" },
  { value: "media/sandbox/anims/anim_kick_to_the_groin.glb", label: "Kick To The Groin" },
  { value: "media/sandbox/anims/anim_kick_to_the_groin_1.glb", label: "Kick To The Groin (1)" },
  { value: "media/sandbox/anims/anim_kick_up_soccerball.glb", label: "Kick Up Soccerball" },
  { value: "media/sandbox/anims/anim_kicking.glb", label: "Kicking" },
  { value: "media/sandbox/anims/anim_kicking_1.glb", label: "Kicking (1)" },
  { value: "media/sandbox/anims/anim_kicking_2.glb", label: "Kicking (2)" },
  { value: "media/sandbox/anims/anim_kicking_3.glb", label: "Kicking (3)" },
  { value: "media/sandbox/anims/anim_kicking_4.glb", label: "Kicking (4)" },
  { value: "media/sandbox/anims/anim_kicking_5.glb", label: "Kicking (5)" },
  { value: "media/sandbox/anims/anim_kicking_6.glb", label: "Kicking (6)" },
  { value: "media/sandbox/anims/anim_kicking_7.glb", label: "Kicking (7)" },
  { value: "media/sandbox/anims/anim_kicking_out.glb", label: "Kicking Out" },
  { value: "media/sandbox/anims/anim_kidney_hit.glb", label: "Kidney Hit" },
  { value: "media/sandbox/anims/anim_kip_up.glb", label: "Kip Up" },
  { value: "media/sandbox/anims/anim_kiss.glb", label: "Kiss" },
  { value: "media/sandbox/anims/anim_kiss_1.glb", label: "Kiss (1)" },
  { value: "media/sandbox/anims/anim_kiss_from_man.glb", label: "Kiss from man" },
  { value: "media/sandbox/anims/anim_kiss_from_woman.glb", label: "Kiss from woman" },
  { value: "media/sandbox/anims/anim_knee_jab.glb", label: "Knee Jab" },
  { value: "media/sandbox/anims/anim_knee_jab_1.glb", label: "Knee Jab (1)" },
  { value: "media/sandbox/anims/anim_knee_kick_lead.glb", label: "Knee Kick Lead" },
  { value: "media/sandbox/anims/anim_kneeing_soccerball.glb", label: "Kneeing Soccerball" },
  { value: "media/sandbox/anims/anim_kneeling_idle.glb", label: "kneeling idle" },
  { value: "media/sandbox/anims/anim_kneeling_inspecting.glb", label: "Kneeling Inspecting" },
  { value: "media/sandbox/anims/anim_kneeling_pointing.glb", label: "Kneeling Pointing" },
  { value: "media/sandbox/anims/anim_laughing.glb", label: "Laughing" },
  { value: "media/sandbox/anims/anim_laughing_1.glb", label: "Laughing (1)" },
  { value: "media/sandbox/anims/anim_laying.glb", label: "Laying" },
  { value: "media/sandbox/anims/anim_laying_1.glb", label: "Laying (1)" },
  { value: "media/sandbox/anims/anim_laying_idle.glb", label: "Laying Idle" },
  { value: "media/sandbox/anims/anim_laying_idle_1.glb", label: "Laying Idle (1)" },
  { value: "media/sandbox/anims/anim_laying_idle_2.glb", label: "Laying Idle (2)" },
  { value: "media/sandbox/anims/anim_laying_mild_cough.glb", label: "Laying Mild Cough" },
  { value: "media/sandbox/anims/anim_laying_seizure.glb", label: "Laying Seizure" },
  { value: "media/sandbox/anims/anim_laying_severe_cough.glb", label: "Laying Severe Cough" },
  { value: "media/sandbox/anims/anim_laying_shrugging.glb", label: "Laying Shrugging" },
  { value: "media/sandbox/anims/anim_laying_sleeping.glb", label: "Laying Sleeping" },
  { value: "media/sandbox/anims/anim_lead_jab.glb", label: "Lead Jab" },
  { value: "media/sandbox/anims/anim_lead_jab_1.glb", label: "Lead Jab (1)" },
  { value: "media/sandbox/anims/anim_leaning.glb", label: "Leaning" },
  { value: "media/sandbox/anims/anim_left_strafe.glb", label: "left strafe" },
  { value: "media/sandbox/anims/anim_left_strafe_walk.glb", label: "left strafe walk" },
  { value: "media/sandbox/anims/anim_left_strafe_walking.glb", label: "left strafe walking" },
  { value: "media/sandbox/anims/anim_left_turn.glb", label: "Left Turn" },
  { value: "media/sandbox/anims/anim_left_turn_2.glb", label: "left turn (2)" },
  { value: "media/sandbox/anims/anim_left_turn_90.glb", label: "left turn 90" },
  { value: "media/sandbox/anims/anim_leg_sweep.glb", label: "Leg Sweep" },
  { value: "media/sandbox/anims/anim_leg_sweep_1.glb", label: "Leg Sweep (1)" },
  { value: "media/sandbox/anims/anim_lengthy_head_nod.glb", label: "lengthy head nod" },
  { value: "media/sandbox/anims/anim_lifting.glb", label: "Lifting" },
  { value: "media/sandbox/anims/anim_light_hit_to_head.glb", label: "Light Hit To Head" },
  { value: "media/sandbox/anims/anim_listening_to_music.glb", label: "Listening To Music" },
  { value: "media/sandbox/anims/anim_locking_hip_hop_dance.glb", label: "Locking Hip Hop Dance" },
  { value: "media/sandbox/anims/anim_lola_b_styperek.glb", label: "Lola B Styperek" },
  { value: "media/sandbox/anims/anim_look_around.glb", label: "Look Around" },
  { value: "media/sandbox/anims/anim_look_away_gesture.glb", label: "look away gesture" },
  { value: "media/sandbox/anims/anim_looking.glb", label: "Looking" },
  { value: "media/sandbox/anims/anim_looking_around.glb", label: "Looking Around" },
  { value: "media/sandbox/anims/anim_looking_through_files_low.glb", label: "Looking Through Files Low" },
  { value: "media/sandbox/anims/anim_loser.glb", label: "Loser" },
  { value: "media/sandbox/anims/anim_low_crawl.glb", label: "Low Crawl" },
  { value: "media/sandbox/anims/anim_lying_down.glb", label: "Lying Down" },
  { value: "media/sandbox/anims/anim_macaco_side.glb", label: "macaco side" },
  { value: "media/sandbox/anims/anim_macarena_dance.glb", label: "Macarena Dance" },
  { value: "media/sandbox/anims/anim_macarena_dance_1.glb", label: "Macarena Dance (1)" },
  { value: "media/sandbox/anims/anim_male_crouch_pose.glb", label: "Male Crouch Pose" },
  { value: "media/sandbox/anims/anim_male_dynamic_matrix_pose.glb", label: "Male Dynamic Matrix Pose" },
  { value: "media/sandbox/anims/anim_male_laying_pose.glb", label: "Male Laying Pose" },
  { value: "media/sandbox/anims/anim_male_laying_pose_1.glb", label: "Male Laying Pose (1)" },
  { value: "media/sandbox/anims/anim_male_laying_pose_2.glb", label: "Male Laying Pose (2)" },
  { value: "media/sandbox/anims/anim_male_sitting_pose.glb", label: "Male Sitting Pose" },
  { value: "media/sandbox/anims/anim_male_sitting_pose_1.glb", label: "Male Sitting Pose (1)" },
  { value: "media/sandbox/anims/anim_male_sitting_pose_2.glb", label: "Male Sitting Pose (2)" },
  { value: "media/sandbox/anims/anim_male_sitting_pose_3.glb", label: "Male Sitting Pose (3)" },
  { value: "media/sandbox/anims/anim_male_standing_pose.glb", label: "Male Standing Pose" },
  { value: "media/sandbox/anims/anim_martelo_2.glb", label: "Martelo 2" },
  { value: "media/sandbox/anims/anim_martelo_3.glb", label: "Martelo 3" },
  { value: "media/sandbox/anims/anim_martelo_do_chau.glb", label: "martelo do chau" },
  { value: "media/sandbox/anims/anim_martelo_do_chau_sem_mao.glb", label: "Martelo Do Chau Sem Mao" },
  { value: "media/sandbox/anims/anim_meia_lua_de_compasso.glb", label: "Meia Lua De Compasso" },
  { value: "media/sandbox/anims/anim_meia_lua_de_compasso_back.glb", label: "Meia Lua De Compasso Back" },
  { value: "media/sandbox/anims/anim_meia_lua_de_frente.glb", label: "Meia Lua De Frente" },
  { value: "media/sandbox/anims/anim_military_signaling.glb", label: "Military Signaling" },
  { value: "media/sandbox/anims/anim_military_signaling_1.glb", label: "Military Signaling (1)" },
  { value: "media/sandbox/anims/anim_military_signaling_2.glb", label: "Military Signaling (2)" },
  { value: "media/sandbox/anims/anim_mma_idle.glb", label: "Mma Idle" },
  { value: "media/sandbox/anims/anim_mma_kick.glb", label: "Mma Kick" },
  { value: "media/sandbox/anims/anim_mma_kick_1.glb", label: "Mma Kick (1)" },
  { value: "media/sandbox/anims/anim_mma_kick_2.glb", label: "Mma Kick (2)" },
  { value: "media/sandbox/anims/anim_moving_while_hanging.glb", label: "Moving While Hanging" },
  { value: "media/sandbox/anims/anim_neck_stretching.glb", label: "Neck Stretching" },
  { value: "media/sandbox/anims/anim_nervously_look_around.glb", label: "Nervously Look Around" },
  { value: "media/sandbox/anims/anim_ninja_idle.glb", label: "Ninja Idle" },
  { value: "media/sandbox/anims/anim_no.glb", label: "No" },
  { value: "media/sandbox/anims/anim_northern_soul_spin_combo.glb", label: "Northern Soul Spin Combo" },
  { value: "media/sandbox/anims/anim_northern_soul_spin_combo_1.glb", label: "Northern Soul Spin Combo (1)" },
  { value: "media/sandbox/anims/anim_offensive_idle.glb", label: "Offensive Idle" },
  { value: "media/sandbox/anims/anim_offensive_idle_1.glb", label: "Offensive Idle (1)" },
  { value: "media/sandbox/anims/anim_one_shoulder_lean.glb", label: "One Shoulder Lean" },
  { value: "media/sandbox/anims/anim_open_door_outwards.glb", label: "Open Door Outwards" },
  { value: "media/sandbox/anims/anim_opening.glb", label: "Opening" },
  { value: "media/sandbox/anims/anim_overhead_squat.glb", label: "Overhead Squat" },
  { value: "media/sandbox/anims/anim_patting.glb", label: "Patting" },
  { value: "media/sandbox/anims/anim_petting_animal.glb", label: "Petting Animal" },
  { value: "media/sandbox/anims/anim_pick_fruit.glb", label: "Pick Fruit" },
  { value: "media/sandbox/anims/anim_pick_fruit_2.glb", label: "pick fruit (2)" },
  { value: "media/sandbox/anims/anim_pick_fruit_3.glb", label: "pick fruit (3)" },
  { value: "media/sandbox/anims/anim_picking_at_shirt.glb", label: "Picking At Shirt" },
  { value: "media/sandbox/anims/anim_picking_at_shirt_1.glb", label: "Picking At Shirt (1)" },
  { value: "media/sandbox/anims/anim_pike_walk.glb", label: "Pike Walk" },
  { value: "media/sandbox/anims/anim_pistol_idle.glb", label: "Pistol Idle" },
  { value: "media/sandbox/anims/anim_pistol_idle_1.glb", label: "Pistol Idle (1)" },
  { value: "media/sandbox/anims/anim_pistol_idle_2.glb", label: "Pistol Idle (2)" },
  { value: "media/sandbox/anims/anim_pistol_kneel_to_stand.glb", label: "Pistol Kneel To Stand" },
  { value: "media/sandbox/anims/anim_pistol_to_idle.glb", label: "Pistol To Idle" },
  { value: "media/sandbox/anims/anim_pivot.glb", label: "Pivot" },
  { value: "media/sandbox/anims/anim_plant_a_plant.glb", label: "Plant A Plant" },
  { value: "media/sandbox/anims/anim_plant_tree.glb", label: "Plant Tree" },
  { value: "media/sandbox/anims/anim_plotting.glb", label: "Plotting" },
  { value: "media/sandbox/anims/anim_pointing.glb", label: "Pointing" },
  { value: "media/sandbox/anims/anim_pontera.glb", label: "pontera" },
  { value: "media/sandbox/anims/anim_praying.glb", label: "Praying" },
  { value: "media/sandbox/anims/anim_praying_1.glb", label: "Praying (1)" },
  { value: "media/sandbox/anims/anim_praying_2.glb", label: "Praying (2)" },
  { value: "media/sandbox/anims/anim_pull_pilot_from_seat.glb", label: "Pull Pilot From Seat" },
  { value: "media/sandbox/anims/anim_pull_plant.glb", label: "Pull Plant" },
  { value: "media/sandbox/anims/anim_pull_plant_1.glb", label: "Pull Plant (1)" },
  { value: "media/sandbox/anims/anim_pull_plant_2.glb", label: "pull plant (2)" },
  { value: "media/sandbox/anims/anim_pulled_from_seat.glb", label: "Pulled From Seat" },
  { value: "media/sandbox/anims/anim_punch_combo.glb", label: "Punch Combo" },
  { value: "media/sandbox/anims/anim_punch_to_elbow_combo.glb", label: "Punch To Elbow Combo" },
  { value: "media/sandbox/anims/anim_punching.glb", label: "Punching" },
  { value: "media/sandbox/anims/anim_punching_1.glb", label: "Punching (1)" },
  { value: "media/sandbox/anims/anim_punching_light.glb", label: "Punching Light" },
  { value: "media/sandbox/anims/anim_push_up.glb", label: "Push Up" },
  { value: "media/sandbox/anims/anim_putting_down.glb", label: "Putting Down" },
  { value: "media/sandbox/anims/anim_putting_down_1.glb", label: "Putting Down (1)" },
  { value: "media/sandbox/anims/anim_quad_punch.glb", label: "Quad Punch" },
  { value: "media/sandbox/anims/anim_queshada_1.glb", label: "queshada 1" },
  { value: "media/sandbox/anims/anim_queshada_2.glb", label: "Queshada 2" },
  { value: "media/sandbox/anims/anim_quick_informal_bow.glb", label: "Quick Informal Bow" },
  { value: "media/sandbox/anims/anim_rallying.glb", label: "Rallying" },
  { value: "media/sandbox/anims/anim_rapping.glb", label: "Rapping" },
  { value: "media/sandbox/anims/anim_rasteira_1.glb", label: "rasteira 1" },
  { value: "media/sandbox/anims/anim_rasteira_2.glb", label: "rasteira 2" },
  { value: "media/sandbox/anims/anim_receive_soccerball.glb", label: "Receive Soccerball" },
  { value: "media/sandbox/anims/anim_receiving_an_uppercut.glb", label: "Receiving An Uppercut" },
  { value: "media/sandbox/anims/anim_release_hostage_villain.glb", label: "Release Hostage - Villain" },
  { value: "media/sandbox/anims/anim_relieved_sigh.glb", label: "Relieved Sigh" },
  { value: "media/sandbox/anims/anim_removing_driver.glb", label: "Removing Driver" },
  { value: "media/sandbox/anims/anim_restrain.glb", label: "Restrain" },
  { value: "media/sandbox/anims/anim_rib_hit.glb", label: "Rib Hit" },
  { value: "media/sandbox/anims/anim_right_block.glb", label: "Right Block" },
  { value: "media/sandbox/anims/anim_right_hook.glb", label: "Right Hook" },
  { value: "media/sandbox/anims/anim_right_strafe.glb", label: "right strafe" },
  { value: "media/sandbox/anims/anim_right_strafe_walk.glb", label: "right strafe walk" },
  { value: "media/sandbox/anims/anim_right_strafe_walking.glb", label: "right strafe walking" },
  { value: "media/sandbox/anims/anim_right_turn.glb", label: "Right Turn" },
  { value: "media/sandbox/anims/anim_right_turn_2.glb", label: "right turn (2)" },
  { value: "media/sandbox/anims/anim_right_turn_90.glb", label: "right turn 90" },
  { value: "media/sandbox/anims/anim_robot_hip_hop_dance.glb", label: "Robot Hip Hop Dance" },
  { value: "media/sandbox/anims/anim_roundhouse_kick.glb", label: "Roundhouse Kick" },
  { value: "media/sandbox/anims/anim_rumba_dancing.glb", label: "Rumba Dancing" },
  { value: "media/sandbox/anims/anim_rummaging.glb", label: "Rummaging" },
  { value: "media/sandbox/anims/anim_run_and_swing.glb", label: "Run And Swing" },
  { value: "media/sandbox/anims/anim_run_backward_arc_right.glb", label: "run backward arc right" },
  { value: "media/sandbox/anims/anim_run_to_flip.glb", label: "Run To Flip" },
  { value: "media/sandbox/anims/anim_running.glb", label: "running" },
  { value: "media/sandbox/anims/anim_running_crawl.glb", label: "running crawl" },
  { value: "media/sandbox/anims/anim_running_slide.glb", label: "Running Slide" },
  { value: "media/sandbox/anims/anim_sad_idle.glb", label: "Sad Idle" },
  { value: "media/sandbox/anims/anim_salsa_dancing.glb", label: "Salsa Dancing" },
  { value: "media/sandbox/anims/anim_salsa_dancing_1.glb", label: "Salsa Dancing (1)" },
  { value: "media/sandbox/anims/anim_salsa_dancing_2.glb", label: "Salsa Dancing (2)" },
  { value: "media/sandbox/anims/anim_salsa_dancing_3.glb", label: "Salsa Dancing (3)" },
  { value: "media/sandbox/anims/anim_salsa_dancing_4.glb", label: "Salsa Dancing (4)" },
  { value: "media/sandbox/anims/anim_salsa_dancing_5.glb", label: "Salsa Dancing (5)" },
  { value: "media/sandbox/anims/anim_salsa_dancing_6.glb", label: "Salsa Dancing (6)" },
  { value: "media/sandbox/anims/anim_salsa_dancing_man.glb", label: "Salsa Dancing man" },
  { value: "media/sandbox/anims/anim_samba_dancing.glb", label: "Samba Dancing" },
  { value: "media/sandbox/anims/anim_samba_dancing_1.glb", label: "Samba Dancing (1)" },
  { value: "media/sandbox/anims/anim_samba_dancing_2.glb", label: "Samba Dancing (2)" },
  { value: "media/sandbox/anims/anim_samba_dancing_3.glb", label: "Samba Dancing (3)" },
  { value: "media/sandbox/anims/anim_samba_dancing_4.glb", label: "Samba Dancing (4)" },
  { value: "media/sandbox/anims/anim_samba_dancing_5.glb", label: "Samba Dancing (5)" },
  { value: "media/sandbox/anims/anim_samba_dancing_6.glb", label: "Samba Dancing (6)" },
  { value: "media/sandbox/anims/anim_samba_dancing_7.glb", label: "Samba Dancing (7)" },
  { value: "media/sandbox/anims/anim_sarcastic_head_nod.glb", label: "sarcastic head nod" },
  { value: "media/sandbox/anims/anim_scared.glb", label: "Scared" },
  { value: "media/sandbox/anims/anim_scissor_kick.glb", label: "Scissor Kick" },
  { value: "media/sandbox/anims/anim_searching_files_high.glb", label: "Searching Files High" },
  { value: "media/sandbox/anims/anim_searching_pockets.glb", label: "Searching Pockets" },
  { value: "media/sandbox/anims/anim_seated_idle.glb", label: "Seated Idle" },
  { value: "media/sandbox/anims/anim_shaking_hands_2.glb", label: "Shaking Hands 2" },
  { value: "media/sandbox/anims/anim_shaking_head_no.glb", label: "shaking head no" },
  { value: "media/sandbox/anims/anim_shooting.glb", label: "Shooting" },
  { value: "media/sandbox/anims/anim_shooting_gun.glb", label: "Shooting Gun" },
  { value: "media/sandbox/anims/anim_shooting_pistol.glb", label: "Shooting Pistol" },
  { value: "media/sandbox/anims/anim_shoulder_throw_aggressor.glb", label: "Shoulder Throw, Aggressor" },
  { value: "media/sandbox/anims/anim_shoulder_throw_victim.glb", label: "Shoulder Throw, Victim" },
  { value: "media/sandbox/anims/anim_side_kick.glb", label: "Side Kick" },
  { value: "media/sandbox/anims/anim_silly_dancing.glb", label: "Silly Dancing" },
  { value: "media/sandbox/anims/anim_silly_dancing_1.glb", label: "Silly Dancing (1)" },
  { value: "media/sandbox/anims/anim_silly_dancing_2.glb", label: "Silly Dancing (2)" },
  { value: "media/sandbox/anims/anim_singing.glb", label: "Singing" },
  { value: "media/sandbox/anims/anim_sit_to_stand.glb", label: "Sit To Stand" },
  { value: "media/sandbox/anims/anim_sitting.glb", label: "Sitting" },
  { value: "media/sandbox/anims/anim_sitting_1.glb", label: "Sitting (1)" },
  { value: "media/sandbox/anims/anim_sitting_2.glb", label: "Sitting (2)" },
  { value: "media/sandbox/anims/anim_sitting_3.glb", label: "Sitting (3)" },
  { value: "media/sandbox/anims/anim_sitting_angry.glb", label: "Sitting Angry" },
  { value: "media/sandbox/anims/anim_sitting_disbelief.glb", label: "Sitting Disbelief" },
  { value: "media/sandbox/anims/anim_sitting_drinking.glb", label: "Sitting Drinking" },
  { value: "media/sandbox/anims/anim_sitting_gun_motion.glb", label: "Sitting Gun Motion" },
  { value: "media/sandbox/anims/anim_sitting_idle.glb", label: "Sitting Idle" },
  { value: "media/sandbox/anims/anim_sitting_idle_1.glb", label: "Sitting Idle (1)" },
  { value: "media/sandbox/anims/anim_sitting_laughing.glb", label: "Sitting Laughing" },
  { value: "media/sandbox/anims/anim_sitting_legs_swing.glb", label: "Sitting-legs-swing" },
  { value: "media/sandbox/anims/anim_sitting_talking.glb", label: "Sitting Talking" },
  { value: "media/sandbox/anims/anim_sitting_talking_1.glb", label: "Sitting Talking (1)" },
  { value: "media/sandbox/anims/anim_sitting_thumbs_up.glb", label: "Sitting Thumbs Up" },
  { value: "media/sandbox/anims/anim_sitting_yell.glb", label: "Sitting Yell" },
  { value: "media/sandbox/anims/anim_situps.glb", label: "Situps" },
  { value: "media/sandbox/anims/anim_skinning_test.glb", label: "Skinning Test" },
  { value: "media/sandbox/anims/anim_sleeping_idle.glb", label: "Sleeping Idle" },
  { value: "media/sandbox/anims/anim_smoking.glb", label: "Smoking" },
  { value: "media/sandbox/anims/anim_snake_hip_hop_dance.glb", label: "Snake Hip Hop Dance" },
  { value: "media/sandbox/anims/anim_snake_hip_hop_dance_1.glb", label: "Snake Hip Hop Dance (1)" },
  { value: "media/sandbox/anims/anim_soccer_header.glb", label: "Soccer Header" },
  { value: "media/sandbox/anims/anim_soccer_idle.glb", label: "Soccer Idle" },
  { value: "media/sandbox/anims/anim_soccer_penalty_kick.glb", label: "Soccer Penalty Kick" },
  { value: "media/sandbox/anims/anim_soccer_spin.glb", label: "Soccer Spin" },
  { value: "media/sandbox/anims/anim_soccer_tackle.glb", label: "Soccer Tackle" },
  { value: "media/sandbox/anims/anim_soccer_tackle_1.glb", label: "Soccer Tackle (1)" },
  { value: "media/sandbox/anims/anim_soccer_tackle_2.glb", label: "Soccer Tackle (2)" },
  { value: "media/sandbox/anims/anim_spat_in_face.glb", label: "Spat In Face" },
  { value: "media/sandbox/anims/anim_speedbag.glb", label: "Speedbag" },
  { value: "media/sandbox/anims/anim_spit_reaction.glb", label: "Spit Reaction" },
  { value: "media/sandbox/anims/anim_sprint_to_wall_climb.glb", label: "Sprint To Wall Climb" },
  { value: "media/sandbox/anims/anim_stall_soccerball.glb", label: "Stall Soccerball" },
  { value: "media/sandbox/anims/anim_stall_soccerball_1.glb", label: "Stall Soccerball (1)" },
  { value: "media/sandbox/anims/anim_stand_up.glb", label: "Stand Up" },
  { value: "media/sandbox/anims/anim_stand_up_1.glb", label: "Stand Up (1)" },
  { value: "media/sandbox/anims/anim_standard_run.glb", label: "Standard Run" },
  { value: "media/sandbox/anims/anim_standing_1h_cast_spell_01.glb", label: "standing 1H cast spell 01" },
  { value: "media/sandbox/anims/anim_standing_1h_magic_attack_01.glb", label: "Standing 1H Magic Attack 01" },
  { value: "media/sandbox/anims/anim_standing_1h_magic_attack_02.glb", label: "Standing 1H Magic Attack 02" },
  { value: "media/sandbox/anims/anim_standing_1h_magic_attack_03.glb", label: "Standing 1H Magic Attack 03" },
  { value: "media/sandbox/anims/anim_standing_2h_cast_spell_01.glb", label: "Standing 2H Cast Spell 01" },
  { value: "media/sandbox/anims/anim_standing_2h_magic_area_attack_01.glb", label: "Standing 2H Magic Area Attack 01" },
  { value: "media/sandbox/anims/anim_standing_2h_magic_area_attack_02.glb", label: "Standing 2H Magic Area Attack 02" },
  { value: "media/sandbox/anims/anim_standing_2h_magic_attack_01.glb", label: "Standing 2H Magic Attack 01" },
  { value: "media/sandbox/anims/anim_standing_2h_magic_attack_02.glb", label: "Standing 2H Magic Attack 02" },
  { value: "media/sandbox/anims/anim_standing_2h_magic_attack_03.glb", label: "Standing 2H Magic Attack 03" },
  { value: "media/sandbox/anims/anim_standing_2h_magic_attack_04.glb", label: "Standing 2H Magic Attack 04" },
  { value: "media/sandbox/anims/anim_standing_2h_magic_attack_05.glb", label: "Standing 2H Magic Attack 05" },
  { value: "media/sandbox/anims/anim_standing_arguing.glb", label: "Standing Arguing" },
  { value: "media/sandbox/anims/anim_standing_arguing_1.glb", label: "Standing Arguing (1)" },
  { value: "media/sandbox/anims/anim_standing_block_idle.glb", label: "standing block idle" },
  { value: "media/sandbox/anims/anim_standing_block_react_large.glb", label: "standing block react large" },
  { value: "media/sandbox/anims/anim_standing_cheering.glb", label: "Standing Cheering" },
  { value: "media/sandbox/anims/anim_standing_clap.glb", label: "Standing Clap" },
  { value: "media/sandbox/anims/anim_standing_cover_turn.glb", label: "Standing Cover Turn" },
  { value: "media/sandbox/anims/anim_standing_death_backward_01.glb", label: "Standing Death Backward 01" },
  { value: "media/sandbox/anims/anim_standing_disarm_over_shoulder.glb", label: "standing disarm over shoulder" },
  { value: "media/sandbox/anims/anim_standing_disarm_underarm.glb", label: "standing disarm underarm" },
  { value: "media/sandbox/anims/anim_standing_idle.glb", label: "standing idle" },
  { value: "media/sandbox/anims/anim_standing_idle_looking_ver_1.glb", label: "standing idle looking ver. 1" },
  { value: "media/sandbox/anims/anim_standing_idle_looking_ver_2.glb", label: "standing idle looking ver. 2" },
  { value: "media/sandbox/anims/anim_standing_jump.glb", label: "Standing Jump" },
  { value: "media/sandbox/anims/anim_standing_jump_1.glb", label: "Standing Jump (1)" },
  { value: "media/sandbox/anims/anim_standing_melee_attack_360_high.glb", label: "standing melee attack 360 high" },
  { value: "media/sandbox/anims/anim_standing_melee_attack_360_low.glb", label: "standing melee attack 360 low" },
  { value: "media/sandbox/anims/anim_standing_melee_attack_backhand.glb", label: "standing melee attack backhand" },
  { value: "media/sandbox/anims/anim_standing_melee_attack_downward.glb", label: "standing melee attack downward" },
  { value: "media/sandbox/anims/anim_standing_melee_attack_horizontal.glb", label: "standing melee attack horizontal" },
  { value: "media/sandbox/anims/anim_standing_melee_attack_kick_ver_1.glb", label: "standing melee attack kick ver. 1" },
  { value: "media/sandbox/anims/anim_standing_melee_attack_kick_ver_2.glb", label: "standing melee attack kick ver. 2" },
  { value: "media/sandbox/anims/anim_standing_melee_combo_attack_ver_1.glb", label: "standing melee combo attack ver. 1" },
  { value: "media/sandbox/anims/anim_standing_melee_combo_attack_ver_2.glb", label: "standing melee combo attack ver. 2" },
  { value: "media/sandbox/anims/anim_standing_melee_combo_attack_ver_3.glb", label: "standing melee combo attack ver. 3" },
  { value: "media/sandbox/anims/anim_standing_melee_kick.glb", label: "Standing Melee Kick" },
  { value: "media/sandbox/anims/anim_standing_melee_run_jump_attack.glb", label: "standing melee run jump attack" },
  { value: "media/sandbox/anims/anim_standing_react_death_right.glb", label: "Standing React Death Right" },
  { value: "media/sandbox/anims/anim_standing_react_large_from_left.glb", label: "standing react large from left" },
  { value: "media/sandbox/anims/anim_standing_react_large_from_right.glb", label: "standing react large from right" },
  { value: "media/sandbox/anims/anim_standing_react_large_gut.glb", label: "standing react large gut" },
  { value: "media/sandbox/anims/anim_standing_run_back.glb", label: "standing run back" },
  { value: "media/sandbox/anims/anim_standing_run_forward.glb", label: "standing run forward" },
  { value: "media/sandbox/anims/anim_standing_taunt_battlecry.glb", label: "standing taunt battlecry" },
  { value: "media/sandbox/anims/anim_standing_taunt_chest_thump.glb", label: "standing taunt chest thump" },
  { value: "media/sandbox/anims/anim_standing_thumbs_up.glb", label: "Standing Thumbs Up" },
  { value: "media/sandbox/anims/anim_standing_turn_left_90.glb", label: "standing turn left 90" },
  { value: "media/sandbox/anims/anim_standing_turn_right_90.glb", label: "standing turn right 90" },
  { value: "media/sandbox/anims/anim_standing_using_touchscreen_tablet.glb", label: "Standing Using Touchscreen Tablet" },
  { value: "media/sandbox/anims/anim_standing_w_briefcase_idle.glb", label: "Standing W_Briefcase Idle" },
  { value: "media/sandbox/anims/anim_standing_walk_back.glb", label: "standing walk back" },
  { value: "media/sandbox/anims/anim_standing_walk_forward.glb", label: "standing walk forward" },
  { value: "media/sandbox/anims/anim_standing_walk_left.glb", label: "standing walk left" },
  { value: "media/sandbox/anims/anim_standing_walk_right.glb", label: "standing walk right" },
  { value: "media/sandbox/anims/anim_step_hip_hop_dance.glb", label: "Step Hip Hop Dance" },
  { value: "media/sandbox/anims/anim_stomach_hit.glb", label: "Stomach Hit" },
  { value: "media/sandbox/anims/anim_stomp.glb", label: "Stomp" },
  { value: "media/sandbox/anims/anim_stroke_hand_gesture.glb", label: "Stroke Hand Gesture" },
  { value: "media/sandbox/anims/anim_stroke_shaking_head.glb", label: "Stroke Shaking Head" },
  { value: "media/sandbox/anims/anim_sumo_high_pull.glb", label: "Sumo High Pull" },
  { value: "media/sandbox/anims/anim_superhuman_choke_lift.glb", label: "Superhuman Choke Lift" },
  { value: "media/sandbox/anims/anim_surprise_uppercut.glb", label: "Surprise Uppercut" },
  { value: "media/sandbox/anims/anim_surprised.glb", label: "Surprised" },
  { value: "media/sandbox/anims/anim_swagger_walk.glb", label: "Swagger Walk" },
  { value: "media/sandbox/anims/anim_swimming.glb", label: "Swimming" },
  { value: "media/sandbox/anims/anim_swimming_to_edge.glb", label: "Swimming To Edge" },
  { value: "media/sandbox/anims/anim_swing_dancing.glb", label: "Swing Dancing" },
  { value: "media/sandbox/anims/anim_swing_into_wall.glb", label: "Swing Into Wall" },
  { value: "media/sandbox/anims/anim_swing_to_land.glb", label: "Swing To Land" },
  { value: "media/sandbox/anims/anim_swing_to_land_1.glb", label: "Swing To Land (1)" },
  { value: "media/sandbox/anims/anim_swing_to_land_2.glb", label: "Swing To Land (2)" },
  { value: "media/sandbox/anims/anim_sword_and_shield_attack.glb", label: "Sword And Shield Attack" },
  { value: "media/sandbox/anims/anim_sword_and_shield_crouch_block_idle.glb", label: "Sword And Shield Crouch Block Idle" },
  { value: "media/sandbox/anims/anim_sword_and_shield_crouch_idle.glb", label: "Sword And Shield Crouch Idle" },
  { value: "media/sandbox/anims/anim_taken_hostage_victim.glb", label: "Taken Hostage - Victim" },
  { value: "media/sandbox/anims/anim_taken_hostage_villain.glb", label: "Taken Hostage - Villain" },
  { value: "media/sandbox/anims/anim_taking_item.glb", label: "Taking Item" },
  { value: "media/sandbox/anims/anim_taking_item_1.glb", label: "Taking Item (1)" },
  { value: "media/sandbox/anims/anim_taking_punch.glb", label: "Taking Punch" },
  { value: "media/sandbox/anims/anim_talking.glb", label: "Talking" },
  { value: "media/sandbox/anims/anim_talking_1.glb", label: "Talking (1)" },
  { value: "media/sandbox/anims/anim_talking_2.glb", label: "Talking (2)" },
  { value: "media/sandbox/anims/anim_talking_at_watercooler.glb", label: "Talking At Watercooler" },
  { value: "media/sandbox/anims/anim_talking_on_a_cell_phone.glb", label: "Talking On A Cell Phone" },
  { value: "media/sandbox/anims/anim_talking_on_phone.glb", label: "Talking On Phone" },
  { value: "media/sandbox/anims/anim_talking_phone_pacing.glb", label: "Talking Phone Pacing" },
  { value: "media/sandbox/anims/anim_talking_woman.glb", label: "Talking woman" },
  { value: "media/sandbox/anims/anim_taunt.glb", label: "Taunt" },
  { value: "media/sandbox/anims/anim_taunt_1.glb", label: "Taunt (1)" },
  { value: "media/sandbox/anims/anim_taunt_2.glb", label: "Taunt (2)" },
  { value: "media/sandbox/anims/anim_telling_a_secret.glb", label: "Telling A Secret" },
  { value: "media/sandbox/anims/anim_tender_placement.glb", label: "Tender Placement" },
  { value: "media/sandbox/anims/anim_tender_placement_1.glb", label: "Tender Placement (1)" },
  { value: "media/sandbox/anims/anim_texting.glb", label: "Texting" },
  { value: "media/sandbox/anims/anim_texting_while_standing.glb", label: "Texting While Standing" },
  { value: "media/sandbox/anims/anim_thankful.glb", label: "Thankful" },
  { value: "media/sandbox/anims/anim_thinking.glb", label: "Thinking" },
  { value: "media/sandbox/anims/anim_thoughtful_head_shake.glb", label: "Thoughtful Head Shake" },
  { value: "media/sandbox/anims/anim_threatening.glb", label: "Threatening" },
  { value: "media/sandbox/anims/anim_thriller_part_2.glb", label: "Thriller Part 2" },
  { value: "media/sandbox/anims/anim_throwing.glb", label: "Throwing" },
  { value: "media/sandbox/anims/anim_tonic_seizure.glb", label: "Tonic Seizure" },
  { value: "media/sandbox/anims/anim_tripping.glb", label: "Tripping" },
  { value: "media/sandbox/anims/anim_troca_1.glb", label: "Troca 1" },
  { value: "media/sandbox/anims/anim_tut_hip_hop_dance.glb", label: "Tut Hip Hop Dance" },
  { value: "media/sandbox/anims/anim_twist_dance.glb", label: "Twist Dance" },
  { value: "media/sandbox/anims/anim_typing.glb", label: "Typing" },
  { value: "media/sandbox/anims/anim_unarmed_equip_over_shoulder.glb", label: "unarmed equip over shoulder" },
  { value: "media/sandbox/anims/anim_unarmed_equip_underarm.glb", label: "unarmed equip underarm" },
  { value: "media/sandbox/anims/anim_unarmed_idle.glb", label: "unarmed idle" },
  { value: "media/sandbox/anims/anim_unarmed_idle_looking_ver_1.glb", label: "unarmed idle looking ver. 1" },
  { value: "media/sandbox/anims/anim_unarmed_idle_looking_ver_2.glb", label: "unarmed idle looking ver. 2" },
  { value: "media/sandbox/anims/anim_unarmed_jump.glb", label: "unarmed jump" },
  { value: "media/sandbox/anims/anim_unarmed_jump_running.glb", label: "unarmed jump running" },
  { value: "media/sandbox/anims/anim_unarmed_run_back.glb", label: "unarmed run back" },
  { value: "media/sandbox/anims/anim_unarmed_run_forward.glb", label: "unarmed run forward" },
  { value: "media/sandbox/anims/anim_unarmed_turn_left_90.glb", label: "unarmed turn left 90" },
  { value: "media/sandbox/anims/anim_unarmed_turn_right_90.glb", label: "unarmed turn right 90" },
  { value: "media/sandbox/anims/anim_unarmed_walk_back.glb", label: "unarmed walk back" },
  { value: "media/sandbox/anims/anim_unarmed_walk_forward.glb", label: "unarmed walk forward" },
  { value: "media/sandbox/anims/anim_uppercut.glb", label: "Uppercut" },
  { value: "media/sandbox/anims/anim_uppercut_jab.glb", label: "Uppercut Jab" },
  { value: "media/sandbox/anims/anim_uppercut_jab_1.glb", label: "Uppercut Jab (1)" },
  { value: "media/sandbox/anims/anim_vampiric_bite.glb", label: "Vampiric Bite" },
  { value: "media/sandbox/anims/anim_victory.glb", label: "Victory" },
  { value: "media/sandbox/anims/anim_walking.glb", label: "Walking" },
  { value: "media/sandbox/anims/anim_walking_backward.glb", label: "Walking Backward" },
  { value: "media/sandbox/anims/anim_walking_slow.glb", label: "Walking slow" },
  { value: "media/sandbox/anims/anim_walking_test.glb", label: "Walking Test" },
  { value: "media/sandbox/anims/anim_wall_run.glb", label: "Wall Run" },
  { value: "media/sandbox/anims/anim_watering.glb", label: "Watering" },
  { value: "media/sandbox/anims/anim_waving.glb", label: "Waving" },
  { value: "media/sandbox/anims/anim_weight_shift.glb", label: "weight shift" },
  { value: "media/sandbox/anims/anim_wheelbarrow_dump.glb", label: "wheelbarrow dump" },
  { value: "media/sandbox/anims/anim_wheelbarrow_idle.glb", label: "wheelbarrow idle" },
  { value: "media/sandbox/anims/anim_wheelbarrow_walk.glb", label: "wheelbarrow walk" },
  { value: "media/sandbox/anims/anim_wheelbarrow_walk_2.glb", label: "wheelbarrow walk (2)" },
  { value: "media/sandbox/anims/anim_wheelbarrow_walk_turn.glb", label: "Wheelbarrow Walk Turn" },
  { value: "media/sandbox/anims/anim_wheelbarrow_walk_turn_2.glb", label: "wheelbarrow walk turn (2)" },
  { value: "media/sandbox/anims/anim_wheelchair.glb", label: "Wheelchair" },
  { value: "media/sandbox/anims/anim_wiping_sweat.glb", label: "Wiping Sweat" },
  { value: "media/sandbox/anims/anim_woman-solo.glb", label: "Woman-Solo" },
  { value: "media/sandbox/anims/anim_writhing_in_pain.glb", label: "Writhing In Pain" },
  { value: "media/sandbox/anims/anim_writing.glb", label: "Writing" },
  { value: "media/sandbox/anims/anim_x_bot.glb", label: "X Bot" },
  { value: "media/sandbox/anims/anim_yelling.glb", label: "Yelling" },
  { value: "media/sandbox/anims/anim_ymca_dance.glb", label: "Ymca Dance" },
  { value: "media/sandbox/anims/anim_ymca_dance_1.glb", label: "Ymca Dance (1)" },
  { value: "media/sandbox/anims/anim_zombie_attack.glb", label: "zombie attack" },
  { value: "media/sandbox/anims/anim_zombie_biting.glb", label: "Zombie Biting" },
  { value: "media/sandbox/anims/anim_zombie_biting_2.glb", label: "zombie biting (2)" },
  { value: "media/sandbox/anims/anim_zombie_crawl.glb", label: "zombie crawl" },
  { value: "media/sandbox/anims/anim_zombie_death.glb", label: "zombie death" },
  { value: "media/sandbox/anims/anim_zombie_dying.glb", label: "zombie dying" },
  { value: "media/sandbox/anims/anim_zombie_idle.glb", label: "zombie idle" },
  { value: "media/sandbox/anims/anim_zombie_neck_bite.glb", label: "zombie neck bite" },
  { value: "media/sandbox/anims/anim_zombie_run.glb", label: "zombie run" },
  { value: "media/sandbox/anims/anim_zombie_scream.glb", label: "zombie scream" },
  { value: "media/sandbox/anims/anim_zombie_walk.glb", label: "zombie walk" },
].filter((v, i, a) => a.findIndex(t => t.value === v.value) === i).sort((a, b) => {
  if (a.value === "idle") return -1;
  if (b.value === "idle") return 1;
  return a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' });
});


const LARA_PATH = 'media/lara_native.glb';
const ROSANNA_PATH = 'media/rosanna_lara_native.glb';
const VIVID_PATH = 'media/vivid_red_lara_native.glb';

export interface CharacterConfig {
  id: string;
  name: string;
  path: string;
  pos: [number, number, number];
  rot: number;
  variant?: LaraVariant;
  height: number;
  sittingScenePath?: string;
  customIdleAnimPath?: string;
  isLara?: boolean;
}

export const CHARACTERS: CharacterConfig[] = [
  // 11 stylized Laras
  { id: 'native', name: 'Lara (Native)', path: 'media/lara_native.glb', pos: [140, 0, 30], rot: 1.9, variant: 'native', height: 173.4 },
  { id: 'rosanna', name: 'Rosanna', path: 'media/lara_native.glb', pos: [251, 75, 178], rot: 1.325 + Math.PI / 2, variant: 'rosanna', height: 173.4, sittingScenePath: 'media/sandbox/anims/anim_push_up.glb', customIdleAnimPath: 'media/sandbox/anims/anim_push_up.glb' },
  { id: 'marissa', name: 'Marissa', path: 'media/lara_native.glb', pos: [160, 0, -440], rot: 0, variant: 'marissa', height: 173.4, sittingScenePath: 'media/sandbox/anims/anim_belly_dance.glb', customIdleAnimPath: 'media/sandbox/anims/anim_belly_dance.glb' },
  { id: 'delphina', name: 'Delphina', path: 'media/lara_native.glb', pos: [120, 35, -250], rot: 1, variant: 'delphina', height: 173.4, sittingScenePath: 'media/sandbox/anims/anim_female_laying_pose_9.glb', customIdleAnimPath: 'media/sandbox/anims/anim_female_laying_pose_9.glb' },
  { id: 'sara', name: 'Sara', path: 'media/lara_native.glb', pos: [340, -40, -310], rot: -Math.PI / 2, variant: 'sara', height: 173.4, sittingScenePath: 'media/sandbox/anims/anim_climbing.glb', customIdleAnimPath: 'media/sandbox/anims/anim_climbing.glb' },
  { id: 'cha', name: 'Cha', path: 'media/lara_native.glb', pos: [30, 0, 151], rot: Math.PI / 2, variant: 'cha', height: 173.4, sittingScenePath: 'media/sandbox/anims/anim_sitting_idle.glb', customIdleAnimPath: 'media/sandbox/anims/anim_sitting_idle.glb' },
  { id: 'vivid', name: 'Vivid', path: 'media/lara_native.glb', pos: [30, 0, 210], rot: Math.PI / 2, variant: 'vivid', height: 173.4, sittingScenePath: 'media/sandbox/anims/anim_sitting_idle.glb', customIdleAnimPath: 'media/sandbox/anims/anim_sitting_idle.glb' },
  { id: 'sabira', name: 'Sabira', path: 'media/lara_native.glb', pos: [100, 0, 370], rot: Math.atan2(158 - 100, 200 - 370), variant: 'sabira', height: 173.4, customIdleAnimPath: 'media/sandbox/anims/anim_dancing_twerk.glb', sittingScenePath: 'media/sandbox/anims/anim_dancing_twerk.glb' },
  { id: 'safa', name: 'Safa', path: 'media/lara_native.glb', pos: [250, 0, 320], rot: Math.atan2(158 - 250, 200 - 320), variant: 'safa', height: 173.4, customIdleAnimPath: 'media/sandbox/anims/anim_stall_soccerball_1.glb', sittingScenePath: 'media/sandbox/anims/anim_stall_soccerball_1.glb' },
  { id: 'sandra', name: 'Sandra', path: 'media/lara_native.glb', pos: [120, 0, -600], rot: 0, variant: 'sandra', height: 173.4, customIdleAnimPath: 'media/sandbox/anims/anim_body_jab_cross.glb', sittingScenePath: 'media/sandbox/anims/anim_body_jab_cross.glb' },
  { id: 'xbot', name: 'Xbot', path: 'media/sandbox/Xbot_official.glb', pos: [150, 0, -600], rot: 0, variant: 'native', height: 173.4, isLara: false }
];

const BONE_SYNONYMS: Record<string, string[]> = {
  'Hips': ['hips', 'pelvis', 'cog', 'roothips', 'rootground', 'hip'],
  'Spine': ['spine01', 'spinelower', 'spine0', 'spine1', 'spine'],
  'Spine2': ['spine02', 'spineupper', 'spine2', 'spine03', 'spine', 'spine3'],
  'Neck': ['neck', 'headnecklower'],
  'Head': ['head', 'headneckupper'],
  'LeftShoulder': ['leftshoulder', 'shoulderl', 'claviclel', 'armleftshoulder', 'larmclavicle', 'shlderl', 'armleftshoulder1'],
  'LeftArm': ['armleftshoulder2', 'upperarml', 'larmhumerus', 'upperarm.l', 'upper_arm.l', 'leftarm', 'armleftelbow', 'arm.l', 'bicepl'],
  'LeftForeArm': ['lowerarml', 'larmradius', 'forearm.l', 'forearm_l', 'leftforearm', 'armleftelbow', 'armleftwrist', 'forarml', 'forearml'],
  'LeftHand': ['handl', 'larmwrist', 'hand.l', 'hand_l', 'wrist.l', 'wrist_l', 'lefthand', 'armleftwrist', 'palml'],
  'RightShoulder': ['rightshoulder', 'shoulderr', 'clavicler', 'armrightshoulder', 'rarmclavicle', 'shlderr', 'armrightshoulder1'],
  'RightArm': ['rightarm', 'armrightshoulder2', 'upperarmr', 'armrightelbow', 'rarmhumerus', 'upperarm.r', 'upper_arm.r', 'arm.r', 'bicepr'],
  'RightForeArm': ['lowerarmr', 'rarmradius', 'forearm.r', 'forearm_r', 'rightforearm', 'armrightelbow', 'armrightwrist', 'forarmr', 'forearmr'],
  'RightHand': ['handr', 'rarmwrist', 'hand.r', 'hand_r', 'wrist.r', 'wrist_r', 'righthand', 'armrightwrist', 'palmr'],
  'LeftUpLeg': ['legleftthigh', 'thighl', 'llegfemur', 'thigh.l', 'thigh_l', 'leftupleg'],
  'LeftLeg': ['legleftknee', 'calfl', 'shinl', 'llegtibia', 'shin.l', 'shin_l', 'calf.l', 'calf_l', 'leftleg'],
  'LeftFoot': ['legleftankle', 'footl', 'llegankle', 'foot.l', 'foot_l', 'ankle.l', 'ankle_l', 'leftfoot'],
  'LeftToeBase': ['leglefttoes', 'balll', 'toel', 'llegball', 'toe.l', 'toe_l', 'ball.l', 'ball_l', 'lefttoebase'],
  'RightUpLeg': ['legrightthigh', 'thighr', 'rlegfemur', 'thigh.r', 'thigh_r', 'rightupleg'],
  'RightLeg': ['legrightknee', 'calfr', 'shinr', 'rlegtibia', 'shin.r', 'shin_r', 'calf.r', 'calf_r', 'rightleg'],
  'RightFoot': ['legrightankle', 'footr', 'rlegankle', 'foot.r', 'foot_r', 'ankle.r', 'ankle_r', 'rightfoot'],
  'RightToeBase': ['legrighttoes', 'ballr', 'toer', 'rlegball', 'toe.r', 'toe_r', 'ball.r', 'ball_r', 'righttoebase']
};

const ACCESSORIES_MESH_NAMES = new Set([
  'backpack', 'oxygen',
  'binoculars', 'buckle', 'camera', 'goggles', 'grapple',
  'handgun_left', 'handgun_right', 'mp5', 'mp5_ammo',
  'handgun_left_holster', 'handgun_right_holster', 'mp5_holster', 'holster',
  'headset', 'pda', 'personal_light', 'ribbon', 'purse',
  'grenades', 'accessories', 'handgun_part'
]);

function resolveTargetFingerBoneName(targetInstance: THREE.Object3D, side: string, type: string, segment: string): string | null {
  const sideChar = side.charAt(0).toLowerCase();
  const segmentIndex = parseInt(segment) - 1;
  const segmentLetter = ['a', 'b', 'c'][segmentIndex] || 'a';

  const candidates = [
    new RegExp(`^${type}${segment}_${sideChar}$`, 'i'),
    new RegExp(`arm.*${side}.*finger.*${type === 'thumb' ? 1 : type === 'index' ? 2 : type === 'middle' ? 3 : type === 'ring' ? 4 : 5}${segmentLetter}`, 'i'),
    new RegExp(`${type}_0${segment}_${sideChar}`, 'i'),
    new RegExp(`${type === 'thumb' ? 'thumb' : 'f_' + type}\\.0${segment}\\.${sideChar}`, 'i'),
    new RegExp(`${sideChar}.*hand.*${type}.*${segmentIndex}`, 'i'),
    new RegExp(`mixamorig.*${side}.*hand.*${type}.*${segment}`, 'i'),
    new RegExp(`mixamorig_${side}_hand_${type}_${segment}`, 'i'),
    new RegExp(`${side}_hand_${type}_${segment}`, 'i')
  ];

  let foundName: string | null = null;
  targetInstance.traverse(node => {
    if ((node as any).isBone && !foundName) {
      for (const rx of candidates) {
        if (rx.test(node.name)) {
          foundName = node.name;
          break;
        }
      }
    }
  });
  return foundName;
}

function getDepth(node: THREE.Object3D): number {
  let depth = 0;
  let curr: THREE.Object3D | null = node;
  while (curr && curr.parent) {
    depth++;
    curr = curr.parent;
  }
  return depth;
}

const _retargetCache: Record<string, THREE.AnimationClip> = {};

function resolveTargetBoneName(targetInstance: THREE.Object3D, baseName: string, sourceHairMap: Map<string, string> | null = null): string | null {
  const baseNameLower = baseName.toLowerCase();
  if (baseNameLower.includes('hair') || baseNameLower.includes('ponytail')) {
    if (sourceHairMap && sourceHairMap.has(baseNameLower)) {
      const targetName = sourceHairMap.get(baseNameLower);
      if (targetName && targetInstance.getObjectByName(targetName)) {
        return targetName;
      }
    }
    const numMatch = baseName.match(/(\d+)/);
    if (numMatch) {
      const N = numMatch[1];
      const targetName = `hair_${N}`;
      if (targetInstance.getObjectByName(targetName)) {
        return targetName;
      }
    }
  }

  const fingerMatch = baseName.match(/Hand(Thumb|Index|Middle|Ring|Pinky)(\d)/i);
  if (fingerMatch) {
    const side = baseName.toLowerCase().includes('left') ? 'left' : 'right';
    const type = fingerMatch[1].toLowerCase();
    const segment = fingerMatch[2];
    const resolvedFinger = resolveTargetFingerBoneName(targetInstance, side, type, segment);
    if (resolvedFinger) return resolvedFinger;
  }

  const synonyms = BONE_SYNONYMS[baseName];
  if (synonyms) {
    for (const syn of synonyms) {
      let foundName: string | null = null;
      targetInstance.traverse(node => {
        if ((node as any).isBone && !foundName) {
          const nameNormalized = node.name.toLowerCase().replace(/[:_ .\-]/g, '');
          if (nameNormalized === syn || (nameNormalized.includes(syn) &&
              !nameNormalized.includes(syn + '1') &&
              !nameNormalized.includes(syn + '2') &&
              !nameNormalized.includes(syn + '3') &&
              !nameNormalized.includes(syn + '4'))) {
            if (!nameNormalized.includes('twist') && !nameNormalized.includes('muscle') && !nameNormalized.includes('offset')) {
              foundName = node.name;
            }
          }
        }
      });
      if (foundName) return foundName;
    }
  }

  const candidates = [
    'mixamorig:' + baseName,
    'mixamorig_' + baseName,
    'mixamorig' + baseName,
    baseName,
    'mixamorig:' + baseName.charAt(0).toLowerCase() + baseName.slice(1),
    'mixamorig_' + baseName.charAt(0).toLowerCase() + baseName.slice(1),
    'mixamorig' + baseName.charAt(0).toLowerCase() + baseName.slice(1),
    baseName.charAt(0).toLowerCase() + baseName.slice(1)
  ];

  for (const cand of candidates) {
    if (targetInstance.getObjectByName(cand)) {
      return cand;
    }
  }
  return null;
}

function retargetClip(rawClip: THREE.AnimationClip, targetInstance: THREE.Object3D, animScene: THREE.Object3D | undefined): THREE.AnimationClip {
  const animBones: Record<string, any> = {};
  const sourceHairMap = new Map<string, string>();

  if (animScene) {
    animScene.updateMatrixWorld(true);

    const sourceHairBones: Array<{ bone: THREE.Object3D; baseName: string; depth: number }> = [];
    animScene.traverse(c => {
      if ((c as any).isBone) {
        const nameLower = (c.name || '').toLowerCase();
        if (nameLower.includes('hair') || nameLower.includes('ponytail')) {
          const match = c.name.match(/mixamorig[:_]?(.+)/i);
          const base = match ? match[1] : c.name;
          sourceHairBones.push({ bone: c, baseName: base, depth: getDepth(c) });
        }
      }
    });
    sourceHairBones.sort((a, b) => a.depth - b.depth);
    sourceHairBones.forEach((hb, idx) => {
      sourceHairMap.set(hb.baseName.toLowerCase(), `hair_${idx + 1}`);
    });

    animScene.traverse((c: any) => {
      if (c.isBone) {
        const match = c.name.match(/mixamorig[:_]?(.+)/i);
        if (match) {
          animBones[match[1]] = {
            restWorldQuaternion: c.getWorldQuaternion(new THREE.Quaternion()),
            restLocalQuaternion: c.quaternion.clone(),
            parentRestWorldQuaternion: c.parent ? c.parent.getWorldQuaternion(new THREE.Quaternion()) : new THREE.Quaternion(),
            defaultPosition: c.position.clone()
          };
        }
      }
    });
  }

  // Deep clone of rawClip tracks to avoid mutating the source clip
  const clonedTracks: THREE.KeyframeTrack[] = [];
  for (const track of rawClip.tracks) {
    const cl = track.clone();
    cl.times = new Float32Array(track.times);
    cl.values = new Float32Array(track.values);
    clonedTracks.push(cl);
  }
  const workingClip = new THREE.AnimationClip(rawClip.name, rawClip.duration, clonedTracks);

  // Detect and fix centimeter positions (scale to meters)
  for (const track of workingClip.tracks) {
    if (track.name.endsWith('.position')) {
      const firstVal = new THREE.Vector3(track.values[0], track.values[1], track.values[2]);
      if (firstVal.length() > 5.0) {
        for (let i = 0; i < track.values.length; i++) {
          track.values[i] *= 0.01;
        }
      }
    }
  }

  // Combine rootjoint and hips rotations
  const rootRotTrackIndex = workingClip.tracks.findIndex(t => t.name.toLowerCase().includes('rootjoint') && t.name.endsWith('.quaternion'));
  const hipsRotTrackIndex = workingClip.tracks.findIndex(t => (t.name.toLowerCase().includes('hips') || t.name.toLowerCase().endsWith('hips.quaternion')) && t.name.endsWith('.quaternion') && !t.name.toLowerCase().includes('rootjoint'));

  if (rootRotTrackIndex !== -1) {
    const rootRotTrack = workingClip.tracks[rootRotTrackIndex];
    if (hipsRotTrackIndex !== -1) {
      const hipsRotTrack = workingClip.tracks[hipsRotTrackIndex];
      const timesSet = new Set<number>([...rootRotTrack.times, ...hipsRotTrack.times]);
      const times = Array.from(timesSet).sort((a, b) => a - b);
      const values = new Float32Array(times.length * 4);

      const evaluateQuaternionTrack = (track: THREE.KeyframeTrack, t: number): THREE.Quaternion => {
        const trackTimes = track.times;
        const trackValues = track.values;
        if (t <= trackTimes[0]) {
          return new THREE.Quaternion(trackValues[0], trackValues[1], trackValues[2], trackValues[3]);
        }
        if (t >= trackTimes[trackTimes.length - 1]) {
          const idx = (trackTimes.length - 1) * 4;
          return new THREE.Quaternion(trackValues[idx], trackValues[idx+1], trackValues[idx+2], trackValues[idx+3]);
        }
        let i = 0;
        while (i < trackTimes.length - 1 && trackTimes[i+1] < t) {
          i++;
        }
        const t0 = trackTimes[i];
        const t1 = trackTimes[i+1];
        const alpha = (t - t0) / (t1 - t0);
        const q0 = new THREE.Quaternion(trackValues[4*i], trackValues[4*i+1], trackValues[4*i+2], trackValues[4*i+3]);
        const q1 = new THREE.Quaternion(trackValues[4*(i+1)], trackValues[4*(i+1)+1], trackValues[4*(i+1)+2], trackValues[4*(i+1)+3]);
        return q0.slerp(q1, alpha);
      };

      for (let i = 0; i < times.length; i++) {
        const t = times[i];
        const qRoot = evaluateQuaternionTrack(rootRotTrack, t);
        const qHips = evaluateQuaternionTrack(hipsRotTrack, t);
        const qCombined = qRoot.multiply(qHips);
        values[4*i] = qCombined.x;
        values[4*i+1] = qCombined.y;
        values[4*i+2] = qCombined.z;
        values[4*i+3] = qCombined.w;
      }
      hipsRotTrack.times = new Float32Array(times);
      hipsRotTrack.values = values;
      workingClip.tracks.splice(rootRotTrackIndex, 1);
    } else {
      const hipsPosTrack = workingClip.tracks.find(t => t.name.toLowerCase().includes('hips') && !t.name.toLowerCase().includes('rootjoint'));
      let hipsName = 'mixamorig:Hips.quaternion';
      if (hipsPosTrack) {
        hipsName = hipsPosTrack.name.split('.')[0] + '.quaternion';
      }
      rootRotTrack.name = hipsName;
    }
  }

  // Determine height translations scale multiplier dynamically
  let srcHipsDefaultY = 0.991;
  let computedHipsRatio = 100.0;
  for (const tr of workingClip.tracks) {
    const [boneFull, prop] = tr.name.split('.');
    const match = boneFull.match(/mixamorig[:_]?(.+)/i);
    if (match) {
      const baseName = match[1];
      if (prop === 'position' && baseName.toLowerCase() === 'hips') {
        const resolvedHipsName = resolveTargetBoneName(targetInstance, 'Hips', sourceHairMap);
        const bone = resolvedHipsName ? targetInstance.getObjectByName(resolvedHipsName) as any : null;
        let refSrcY = 0.991;
        if (animBones[baseName] && animBones[baseName].defaultPosition) {
          refSrcY = animBones[baseName].defaultPosition.length();
        } else {
          refSrcY = 0.991;
        }
        if (refSrcY > 5.0) {
          refSrcY *= 0.01;
        }
        srcHipsDefaultY = refSrcY;

        let targetHipsHeight = 99.1;
        if (bone && bone.defaultPosition) {
          targetHipsHeight = bone.defaultPosition.length();
        }
        if (refSrcY > 0) {
          computedHipsRatio = targetHipsHeight / refSrcY;
        }
      }
    }
  }

  const hasRootTranslation = workingClip.tracks.some(t => t.name.toLowerCase().includes('rootjoint') && t.name.endsWith('.position'));
  const tracks: THREE.KeyframeTrack[] = [];

  for (const tr of workingClip.tracks) {
    const [boneFull, prop] = tr.name.split('.');
    const match = boneFull.match(/mixamorig[:_]?(.+)/i);
    if (!match) continue;
    let baseName = match[1];

    if (prop === 'position' && baseName.toLowerCase() === 'hips' && hasRootTranslation) {
      continue;
    }

    let isRootJointTranslation = false;
    if (prop === 'position' && baseName.toLowerCase().includes('rootjoint')) {
      baseName = 'Hips';
      isRootJointTranslation = true;
    }

    const targetBoneName = resolveTargetBoneName(targetInstance, baseName, sourceHairMap);
    if (!targetBoneName) continue;

    if (prop === 'scale') continue;
    const isHips = targetBoneName.toLowerCase().endsWith('hips') || targetBoneName.toLowerCase().includes('pelvis');
    if (prop === 'position' && !isHips) continue;

    const clone = tr.clone();
    clone.name = `${targetBoneName}.${prop}`;

    // Retarget position for hips
    if (prop === 'position' && isHips) {
      const bone = targetInstance.getObjectByName(targetBoneName) as any;
      if (bone && bone.defaultPosition) {
        let P_src = null;
        if (isRootJointTranslation) {
          P_src = new THREE.Quaternion();
        } else if (animBones[baseName]) {
          P_src = animBones[baseName].parentRestWorldQuaternion;
        } else {
          P_src = new THREE.Quaternion();
        }

        const P_tgt = (bone.parent && bone.parent.restWorldQuaternion)
          ? bone.parent.restWorldQuaternion
          : new THREE.Quaternion();
        const P_tgt_inv = P_tgt.clone().invert();

        let srcRestPos = null;
        if (isRootJointTranslation) {
          srcRestPos = new THREE.Vector3(0, srcHipsDefaultY, 0);
        } else if (animBones[baseName]) {
          srcRestPos = animBones[baseName].defaultPosition.clone();
          if (srcRestPos.length() > 5.0) {
            srcRestPos.multiplyScalar(0.01);
          }
        } else {
          srcRestPos = new THREE.Vector3(0, srcHipsDefaultY * 100, 0);
          if (srcRestPos.length() > 5.0) {
            srcRestPos.multiplyScalar(0.01);
          }
        }

        const restX = clone.values[0];
        const restY = clone.values[1];
        const restZ = clone.values[2];

        let isFlat = true;
        for (let j = 1; j < clone.values.length / 3; j++) {
          if (Math.abs(clone.values[3*j] - restX) > 0.001 ||
              Math.abs(clone.values[3*j+1] - restY) > 0.001 ||
              Math.abs(clone.values[3*j+2] - restZ) > 0.001) {
            isFlat = false;
            break;
          }
        }

        const animNameLower = rawClip.name.toLowerCase();
        const isWalk = (animNameLower.includes('walk') ||
                        animNameLower.includes('run') ||
                        animNameLower.includes('step') ||
                        animNameLower.includes('stairs')) &&
                       !animNameLower.includes('dance');

        if (isFlat && isWalk) {
          const duration = workingClip.duration;
          const fps = 30;
          const numFrames = Math.ceil(duration * fps) + 1;
          const newTimes = new Float32Array(numFrames);
          const newValues = new Float32Array(numFrames * 3);

          for (let f = 0; f < numFrames; f++) {
            const t = Math.min(f / fps, duration);
            newTimes[f] = t;
            const phase = (t / duration) * 2.0 * Math.PI;
            const dx = 0.8 * Math.cos(phase);
            const dy = 0.0;
            const dz = -1.6 * Math.sin(phase * 2.0);

            const dP = new THREE.Vector3(dx, dy, dz)
              .applyQuaternion(P_src)
              .applyQuaternion(P_tgt_inv);
            const resPos = bone.defaultPosition.clone().add(dP);

            newValues[3*f] = resPos.x;
            newValues[3*f+1] = resPos.y;
            newValues[3*f+2] = resPos.z;
          }
          clone.times = newTimes;
          clone.values = newValues;
        } else {
          for (let j = 0; j < clone.values.length / 3; j++) {
            let yVal = clone.values[3*j+1];
            if (isRootJointTranslation && (animNameLower.includes('laying') || animNameLower.includes('sleeping'))) {
              yVal = 0.12; // Force to ground level (in meters)
            }
            const isTPose = animNameLower.includes('t-pose') || animNameLower.includes('tpose');
            const dx = (isWalk || isTPose) ? 0.0 : (clone.values[3*j] - srcRestPos.x) * computedHipsRatio;
            const dy = (isWalk || isTPose) ? 0.0 : (yVal - srcRestPos.y) * computedHipsRatio;
            const dz = (isWalk || isTPose) ? 0.0 : (clone.values[3*j+2] - srcRestPos.z) * computedHipsRatio;

            const dP = new THREE.Vector3(dx, dy, dz)
              .applyQuaternion(P_src)
              .applyQuaternion(P_tgt_inv);
            const resPos = bone.defaultPosition.clone().add(dP);

            clone.values[3*j] = resPos.x;
            clone.values[3*j+1] = resPos.y;
            clone.values[3*j+2] = resPos.z;
          }
        }
      }
    }

    // Retarget rotations
    if (prop === 'quaternion') {
      if (targetBoneName.includes('shoulder_1')) continue;

      const bone = targetInstance.getObjectByName(targetBoneName) as any;
      if (bone) {
        if (bone.restLocalQuaternion && bone.restWorldQuaternion) {
          let B_src = null;
          let P_src = null;
          if (animBones[baseName]) {
            B_src = animBones[baseName].restWorldQuaternion;
            P_src = animBones[baseName].parentRestWorldQuaternion;
          } else {
            B_src = new THREE.Quaternion();
            P_src = new THREE.Quaternion();
          }

          if (B_src && P_src) {
            const B_tgt = bone.restWorldQuaternion;
            const P_tgt = (bone.parent && bone.parent.restWorldQuaternion)
              ? bone.parent.restWorldQuaternion
              : new THREE.Quaternion();
            const P_tgt_inv = P_tgt.clone().invert();
            const B_src_inv = B_src.clone().invert();

            for (let j = 0; j < clone.values.length / 4; j++) {
              const srcLocalQ = new THREE.Quaternion(
                clone.values[4*j],
                clone.values[4*j+1],
                clone.values[4*j+2],
                clone.values[4*j+3]
              );

              const animWorldQ = P_src.clone().multiply(srcLocalQ);
              const deltaQ = animWorldQ.clone().multiply(B_src_inv);
              const tgtAnimWorldQ = deltaQ.clone().multiply(B_tgt);
              const tgtLocalQ = P_tgt_inv.clone().multiply(tgtAnimWorldQ).normalize();

              clone.values[4*j]   = tgtLocalQ.x;
              clone.values[4*j+1] = tgtLocalQ.y;
              clone.values[4*j+2] = tgtLocalQ.z;
              clone.values[4*j+3] = tgtLocalQ.w;
            }
          } else {
            const parentRestWorldQ = (bone.parent && bone.parent.restWorldQuaternion)
              ? bone.parent.restWorldQuaternion
              : new THREE.Quaternion();
            const parentInv = parentRestWorldQ.clone().invert();
            const boneRestLocalQ = bone.restLocalQuaternion.clone();

            for (let i = 0; i < clone.values.length; i += 4) {
              const q = new THREE.Quaternion(clone.values[i], clone.values[i+1], clone.values[i+2], clone.values[i+3]);
              const resQ = parentInv.clone()
                .multiply(q)
                .multiply(parentRestWorldQ)
                .multiply(boneRestLocalQ);

              clone.values[i] = resQ.x;
              clone.values[i+1] = resQ.y;
              clone.values[i+2] = resQ.z;
              clone.values[i+3] = resQ.w;
            }
          }
        }
      }
    }

    tracks.push(clone);
  }

  return new THREE.AnimationClip(`${workingClip.name}_retargeted`, workingClip.duration, tracks);
}

interface WalkerProps {
  showSkeleton?: boolean;
  isPreview?: boolean;
  previewCharacterId?: string;
  characterIndex?: number;
  walkerAnim?: string;
  isPaused?: boolean;
}

function GroundPoint() {
  return (
    <group position={[0, 0.05, 0]} name="GroundPoint">
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4, 5, 32]} />
        <meshBasicMaterial color="#0058a3" transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1, 16]} />
        <meshBasicMaterial color="#0058a3" />
      </mesh>
    </group>
  );
}

interface SingleCharacterProps extends WalkerProps {
  id: string;
  name: string;
  modelPath: string;
  isLara: boolean;
  targetHeight: number;
  isActive: boolean;
  animations: THREE.AnimationClip[];

  variant?: LaraVariant;
  isNPC?: boolean;
  npcPosition?: [number, number, number];
  npcRotationY?: number;
  sittingScene?: THREE.Group;
  customIdleAnimPath?: string;
}

function SingleCharacter({
  id,
  name,
  modelPath,
  isLara,
  targetHeight,
  isActive,
  showSkeleton = false,
  isPreview = false,
  characterIndex = 0,
  walkerAnim = 'idle',
  isPaused = false,
  animations,

  variant,
  isNPC = false,
  npcPosition = [0, 0, 0],
  npcRotationY = 0,
  sittingScene,
  customIdleAnimPath
}: SingleCharacterProps) {
  const laraGrid = useSceneStore(state => state.layers.laraGrid);
  const showAllLaraStyles = useSceneStore(state => state.layers.showAllLaraStyles);
  const showAccessories = useSceneStore(state => state.layers.accessories ?? true);
  const laraPistols = useSceneStore(state => state.layers.laraPistols ?? true);
  const { scene } = useGLTFClone(modelPath);

  const groupRef = useRef<THREE.Group>(null!);
  const modelRef = useRef<THREE.Object3D>(null!);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const activeActionName = useRef<string>('');
  const idleTimerRef = useRef<number>(0);
  const customAnimName = useRef<string | null>(null);
  const prevFirstPersonRef = useRef<boolean | null>(null);
  const animLoopModeRef = useRef<'infinite' | '3x' | '1x'>('infinite');
  const [equipment, setEquipment] = useState<{ holster: boolean; pistols: boolean; backpack: boolean }>({
    holster: true,
    pistols: true,
    backpack: true,
  });

  const hairChainRef = useRef<any[]>([]);
  const breastChainRef = useRef<any[]>([]);

  // Collision bones
  const headBoneRef = useRef<THREE.Bone | null>(null);
  const spine2BoneRef = useRef<THREE.Bone | null>(null);
  const spineBoneRef = useRef<THREE.Bone | null>(null);
  const hipsBoneRef = useRef<THREE.Bone | null>(null);
  const lShoulderRef = useRef<THREE.Bone | null>(null);
  const rShoulderRef = useRef<THREE.Bone | null>(null);

  const physicsPrevDt = useRef<number>(1 / 60);

  const { invalidate } = useThree();

  useEffect(() => {
    const handleActivity = () => {
      if (idleTimerRef.current > 10) {
        invalidate();
      }
      idleTimerRef.current = 0;
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('wheel', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    window.addEventListener('touchmove', handleActivity, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('wheel', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('touchmove', handleActivity);
    };
  }, [invalidate]);

  useLayoutEffect(() => {
    scene.traverse(node => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        const nameLower = (mesh.name || '').toLowerCase();

        let isAccessoryMesh = false;
        for (const accName of ACCESSORIES_MESH_NAMES) {
          const accNameSpace = accName.replace(/_/g, ' ');
          if (nameLower.includes(accName) || nameLower.includes(accNameSpace)) {
            isAccessoryMesh = true;
            break;
          }
        }

        if (isAccessoryMesh) {
          const isHandPistol = nameLower.includes('handgun') && !nameLower.includes('holster');
          const isHolsterPistol = (nameLower.includes('handgun') && nameLower.includes('holster')) || nameLower === 'holster' || nameLower.includes('mp5_holster') || nameLower.endsWith('_holster');

          if (isHandPistol) {
            mesh.visible = laraPistols ? showAccessories : false;
          } else if (isHolsterPistol) {
            mesh.visible = !laraPistols ? showAccessories : false;
          } else {
            mesh.visible = showAccessories;
          }
        }

        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach(mat => {
            if (!mat) return;
            const matNameLower = (mat.name || '').toLowerCase();
            let isAccessoryMat = false;
            for (const accName of ACCESSORIES_MESH_NAMES) {
              const accNameSpace = accName.replace(/_/g, ' ');
              if (matNameLower.includes(accName) || matNameLower.includes(accNameSpace)) {
                isAccessoryMat = true;
                break;
              }
            }

            if (isAccessoryMat) {
              const isHandPistolMat = matNameLower.includes('handgun') && !matNameLower.includes('holster');
              const isHolsterPistolMat = (matNameLower.includes('handgun') && matNameLower.includes('holster')) || matNameLower === 'holster' || matNameLower.includes('mp5_holster') || matNameLower.endsWith('_holster');

              if (isHandPistolMat) {
                mat.visible = laraPistols ? showAccessories : false;
              } else if (isHolsterPistolMat) {
                mat.visible = !laraPistols ? showAccessories : false;
              } else {
                mat.visible = showAccessories;
              }
            }
          });
        }
      }
    });
  }, [scene, showAccessories, laraPistols]);

  useLayoutEffect(() => {
    // Rename all hair bones sequentially from base to tip
    const targetHairBones: Array<{ bone: THREE.Object3D; depth: number }> = [];
    scene.traverse(c => {
      if ((c as any).isBone) {
        const nameLower = (c.name || '').toLowerCase();
        if (nameLower.includes('hair') || nameLower.includes('ponytail') || nameLower.includes('braid') || nameLower.includes('pony')) {
          targetHairBones.push({ bone: c, depth: getDepth(c) });
        }
      }
    });
    targetHairBones.sort((a, b) => a.depth - b.depth);
    targetHairBones.forEach((hb, idx) => {
      hb.bone.name = `hair_${idx + 1}`;
    });

    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);
    scene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(scene);
    const rawSize = box.getSize(new THREE.Vector3());

    const fallbackScale = 100.0;
    const scaleFactor = rawSize.y > 0 ? (targetHeight / rawSize.y) : fallbackScale;

    scene.scale.set(scaleFactor, scaleFactor, scaleFactor);

    scene.updateMatrixWorld(true);

    const resolvedHipsName = resolveTargetBoneName(scene, 'Hips');
    const hips = resolvedHipsName ? scene.getObjectByName(resolvedHipsName) : null;
    hipsBoneRef.current = hips as THREE.Bone;

    const rSpine2 = resolveTargetBoneName(scene, 'Spine2');
    spine2BoneRef.current = (rSpine2 ? scene.getObjectByName(rSpine2) : null) as THREE.Bone;

    const rSpine = resolveTargetBoneName(scene, 'Spine');
    spineBoneRef.current = (rSpine ? scene.getObjectByName(rSpine) : null) as THREE.Bone;

    const rHead = resolveTargetBoneName(scene, 'Head') || resolveTargetBoneName(scene, 'Neck');
    headBoneRef.current = (rHead ? scene.getObjectByName(rHead) : null) as THREE.Bone;

    const rLShoulder = resolveTargetBoneName(scene, 'LeftShoulder');
    lShoulderRef.current = (rLShoulder ? scene.getObjectByName(rLShoulder) : null) as THREE.Bone;

    const rRShoulder = resolveTargetBoneName(scene, 'RightShoulder');
    rShoulderRef.current = (rRShoulder ? scene.getObjectByName(rRShoulder) : null) as THREE.Bone;

    if (hips) {
        const parent = scene.parent || scene;
        const hipsWorld = new THREE.Vector3();
        hips.getWorldPosition(hipsWorld);
        const hipsLocal = parent.worldToLocal(hipsWorld);
        scene.position.x -= hipsLocal.x;
        scene.position.z -= hipsLocal.z;
    }

    scene.traverse(o => {
      const c = o as any;
      if (c.isMesh) {
        c.castShadow = isActive;
        c.receiveShadow = isActive;
        c.frustumCulled = false; // Disable culling for SkinnedMesh as bones move vertices far from rest pose bounding box
        if (c.material) {
            const materials = Array.isArray(c.material) ? c.material : [c.material];
            materials.forEach((mat: any) => {
                mat.transparent = false;
                mat.depthWrite = true;
                mat.side = THREE.FrontSide;
            });
            delete c.raycast;
            delete c.userData.hoverAction;
        }
      }
      if (!c.restWorldQuaternion) {
        c.restWorldQuaternion = c.getWorldQuaternion(new THREE.Quaternion());
      }
      if (c.isBone) {
        if (!c.defaultPosition) {
          c.defaultPosition = c.position.clone();
        }
        if (!c.restLocalQuaternion) {
          c.restLocalQuaternion = c.quaternion.clone();
        }
        if (!c.userData.restPos) {
          c.userData.restPos = c.position.clone();
        }
        if (!c.userData.restQuat) {
          c.userData.restQuat = c.quaternion.clone();
        }
      }
    });

    if (variant) {
        applyLaraVariantStyles(scene, variant);
    }



    // Initialize Hair Chain (Verlet)
    const hairChain: any[] = [];
    const hairBones: THREE.Bone[] = [];
    scene.traverse(c => {
      const nLower = (c.name || '').toLowerCase();
      if ((c as any).isBone && (nLower.includes('hair') || nLower.includes('pony') || nLower.includes('braid'))) {
        hairBones.push(c as THREE.Bone);
      }
    });
      hairBones.sort((a, b) => getDepth(a) - getDepth(b));

      if (hairBones.length > 0) {
        const baseParent = hairBones[0].parent;
        if (baseParent) {
          baseParent.updateMatrixWorld(true);
          const baseParentRestQuat = baseParent.getWorldQuaternion(new THREE.Quaternion());

          let prevAxis = new THREE.Vector3(0, -1, 0);
          for (const bone of hairBones) {
            let axis = prevAxis.clone();
            let length = 8.0;
            const child = bone.children.find(x => {
              const cnLower = (x.name || '').toLowerCase();
              return (x as any).isBone && (cnLower.includes('hair') || cnLower.includes('pony') || cnLower.includes('braid'));
            });
            if (child && child.position.lengthSq() > 1e-8) {
              length = child.position.length();
              axis = child.position.clone().normalize();
            }
            prevAxis = axis.clone();
            bone.updateMatrixWorld(true);
            const jointWorld = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
            const worldScale = new THREE.Vector3().setFromMatrixScale(bone.matrixWorld);
            const worldLength = length * worldScale.y;
            const tipDirWorld = axis.clone().transformDirection(bone.matrixWorld).normalize();
            const tipWorld = jointWorld.clone().addScaledVector(tipDirWorld, worldLength);

            const boneRestQuat = bone.getWorldQuaternion(new THREE.Quaternion());
            const relQuat = baseParentRestQuat.clone().invert().multiply(boneRestQuat);

            hairChain.push({
              bone,
              restQuat: bone.quaternion.clone(),
              relQuat,
              axis,
              length,
              worldLength,
              tipWorld: tipWorld.clone(),
              tipPrev: tipWorld.clone(),
            });
          }
        }
      }
  hairChainRef.current = hairChain;

    // Initialize Breast Chain (Verlet)
    const breastChain: any[] = [];
    const breastBones: THREE.Bone[] = [];
    scene.traverse(c => {
      if ((c as any).isBone && c.name.toLowerCase().includes('breast')) {
        breastBones.push(c as THREE.Bone);
      }
    });

    for (const bone of breastBones) {
      let axis = new THREE.Vector3(0, 1, 0); // point forward along local Y (bone length)
      let length = 15.0;
      const child = bone.children.find(x => (x as any).isBone);
      if (child && child.position.lengthSq() > 1e-8) {
        length = child.position.length();
        axis = child.position.clone().normalize();
      }
      bone.updateMatrixWorld(true);
      const jointWorld = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
      const worldScale = new THREE.Vector3().setFromMatrixScale(bone.matrixWorld);
      const worldLength = length * worldScale.z;
      const tipDirWorld = axis.clone().transformDirection(bone.matrixWorld).normalize();
      const tipWorld = jointWorld.clone().addScaledVector(tipDirWorld, worldLength);

      breastChain.push({
        bone,
        restQuat: bone.quaternion.clone(),
        axis,
        length,
        worldLength,
        tipWorld: tipWorld.clone(),
        tipPrev: tipWorld.clone(),
      });
    }
    breastChainRef.current = breastChain;

    const mixer = new THREE.AnimationMixer(scene);
    mixerRef.current = mixer;

    mixer.addEventListener('finished', (e) => {
      if (customAnimName.current && actionsRef.current[customAnimName.current] === e.action) {
        customAnimName.current = null;
      }
    });

    actionsRef.current = {};

    animations.forEach(clip => {
      const isExternal = clip.name.endsWith('.glb');
      const actualAnimScene = (clip as any).userData?.animScene || (isExternal ? sittingScene : undefined);
      const cacheKey = id + '_' + clip.name;
      let finalClip = _retargetCache[cacheKey];
      if (!finalClip) {
        finalClip = retargetClip(clip, scene, actualAnimScene);
        _retargetCache[cacheKey] = finalClip;
      }

      const action = mixer.clipAction(finalClip);
      actionsRef.current[clip.name] = action;
      action.enabled = true;
      action.play();
      action.setEffectiveWeight(0);
    });

    activeActionName.current = '';

    return () => {
        mixer.stopAllAction();
        mixer.uncacheRoot(scene);
    };
  }, [scene, animations, name, isLara, targetHeight, variant, sittingScene, id]);

  const skeletonRef = useHelper(showSkeleton ? modelRef : null, THREE.SkeletonHelper);

  useEffect(() => {
    if (skeletonRef.current) {
        const helper = skeletonRef.current as unknown as THREE.SkeletonHelper;
        const mat = helper.material as THREE.LineBasicMaterial;
        mat.color.set(0x00ffff);
        mat.depthTest = false;
        helper.renderOrder = 99999;
        helper.raycast = () => {};
        helper.traverse(c => { c.raycast = () => {}; });
    }
  }, [skeletonRef, showSkeleton]);

  const poseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onToggle = (e: any) => {
      if (e.detail?.key === 'walker-anim-loop') {
        animLoopModeRef.current = e.detail.value || 'infinite';
        return;
      }
      if (e.detail?.key === 'lara-custom-holster' && isActive) {
        setEquipment((prev: { holster: boolean; pistols: boolean; backpack: boolean }) => ({ ...prev, holster: !prev.holster }));
        invalidate();
        return;
      }
      if (e.detail?.key === 'lara-custom-pistols' && isActive) {
        setEquipment((prev: { holster: boolean; pistols: boolean; backpack: boolean }) => ({ ...prev, pistols: !prev.pistols }));
        invalidate();
        return;
      }
      if (e.detail?.key === 'lara-custom-backpack' && isActive) {
        setEquipment((prev: { holster: boolean; pistols: boolean; backpack: boolean }) => ({ ...prev, backpack: !prev.backpack }));
        invalidate();
        return;
      }
      const isForMe = (isLara && e.detail?.key === 'walker-anim-lara') ||
                      (!isLara && e.detail?.key === 'walker-anim-xbot');
      if (isForMe && e.detail?.value) {
        const path = e.detail.value;

        if (poseTimerRef.current) {
          clearTimeout(poseTimerRef.current);
          poseTimerRef.current = null;
        }

        const loader = new GLTFLoader();
        loader.load(path, (gltf: any) => {
          const clip = gltf.animations[0];
          if (clip) {
            clip.name = path;
            const cacheKey = id + '_' + path;
            let finalClip = _retargetCache[cacheKey];
            if (!finalClip) {
               finalClip = retargetClip(clip, scene, gltf.scene);
               _retargetCache[cacheKey] = finalClip;
            }
            finalClip.name = path;

            const mixer = mixerRef.current;
            if (!mixer) return;

            let action = actionsRef.current[path];
            if (!action) {
              action = mixer.clipAction(finalClip);
              action.enabled = true;
              actionsRef.current[path] = action;
            }

            const pathLower = path.toLowerCase();
            const clipNameLower = (clip.name || '').toLowerCase();
            const isPose = (pathLower.includes('pose') || clipNameLower.includes('pose')) && !pathLower.includes('t-pose') && !clipNameLower.includes('t-pose');

            if (isPose) {
              const clipDur = finalClip.duration > 0.01 ? finalClip.duration : 0.033;
              const repetitions = Math.max(1, Math.round(10.0 / clipDur));
              action.setLoop(THREE.LoopRepeat, repetitions);
              action.clampWhenFinished = true;

              poseTimerRef.current = setTimeout(() => {
                if (customAnimName.current === path) {
                  customAnimName.current = null;
                  invalidate();
                }
              }, 10000);
            } else {
              const mode = animLoopModeRef.current;
              if (mode === 'infinite') {
                action.setLoop(THREE.LoopRepeat, Infinity);
                action.clampWhenFinished = false;
              } else if (mode === '3x') {
                action.setLoop(THREE.LoopRepeat, 3);
                action.clampWhenFinished = true;
              } else {
                action.setLoop(THREE.LoopOnce, 1);
                action.clampWhenFinished = true;
              }
            }

            customAnimName.current = path;
            invalidate();
          }
        });
      }
    };

    document.addEventListener('furniture-toggle', onToggle);
    return () => {
      document.removeEventListener('furniture-toggle', onToggle);
      if (poseTimerRef.current) {
        clearTimeout(poseTimerRef.current);
        poseTimerRef.current = null;
      }
    };
  }, [isActive, isLara, scene, invalidate, id]);

  useEffect(() => {
    if (!modelRef.current) return;
    if (isActive) {
      modelRef.current.userData.hoverAction = {
        label: `Customiser ${name} 👤`,
        actions: ['lara-custom-holster', 'lara-custom-pistols', 'lara-custom-backpack']
      };
    } else {
      delete modelRef.current.userData.hoverAction;
    }
  }, [isActive, name]);

  useEffect(() => {
    if (!scene) return;
    scene.traverse(o => {
      if ((o as THREE.Mesh).isMesh) {
        const meshName = o.name.toLowerCase();
        const mat = (o as THREE.Mesh).material;
        const matName = mat ? (Array.isArray(mat) ? mat[0].name.toLowerCase() : mat.name.toLowerCase()) : '';

        const isHolsterPart = meshName.includes('holster') || meshName.includes('gear') || meshName.includes('buckle') || matName.includes('holster') || matName.includes('gear') || matName.includes('buckle');
        const isPistolPart = meshName.includes('pistol') || meshName.includes('gun') || meshName.includes('weapon') || matName.includes('pistol') || matName.includes('gun') || matName.includes('weapon');
        const isBackpackPart = meshName.includes('backpack') || meshName.includes('bag') || meshName.includes('pack') || matName.includes('backpack') || matName.includes('bag') || matName.includes('pack');

        if (isHolsterPart) o.visible = equipment.holster;
        if (isPistolPart) o.visible = equipment.pistols;
        if (isBackpackPart) o.visible = equipment.backpack;
      }
    });
    invalidate();
  }, [scene, equipment, invalidate]);

  useEffect(() => {
    if (customIdleAnimPath && scene && mixerRef.current && !actionsRef.current[customIdleAnimPath]) {
      const loader = new GLTFLoader();
      loader.load(customIdleAnimPath, (gltf: any) => {
        const clip = gltf.animations[0];
        if (clip) {
          const cacheKey = id + '_' + customIdleAnimPath;
          let finalClip = _retargetCache[cacheKey];
          if (!finalClip) {
            finalClip = retargetClip(clip, scene, gltf.scene);
            _retargetCache[cacheKey] = finalClip;
          }
          finalClip.name = customIdleAnimPath;

          const mixer = mixerRef.current;
          if (!mixer) return;

          let action = actionsRef.current[customIdleAnimPath];
          if (!action) {
            action = mixer.clipAction(finalClip);
            action.enabled = true;
            action.play();
            action.setEffectiveWeight(0);
            actionsRef.current[customIdleAnimPath] = action;
          }
          invalidate();
        }
      });
    }
  }, [customIdleAnimPath, id, scene, invalidate]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    if (!groupRef.current || !mixerRef.current) return;

    if (isPreview) {
      groupRef.current.position.set(0, 0, 0);
      groupRef.current.rotation.y = 0;
      groupRef.current.visible = true;
    } else if (laraGrid) {
      const row = Math.floor(characterIndex / 5);
      const col = characterIndex % 5;
      const targetX = 150 + (col - 2) * 120;
      const targetY = 400 + row * 220;
      const targetZ = 200;
      groupRef.current.position.set(targetX, targetY, targetZ);
      groupRef.current.rotation.y = 0;
      groupRef.current.visible = !cameraState.walkerHidden && showAllLaraStyles;
    } else {
      if (isActive) {
        groupRef.current.position.set(cameraState.walkerX, 0, cameraState.walkerZ);
        groupRef.current.rotation.y = cameraState.walkYaw;
        groupRef.current.visible = !cameraState.walkerHidden;
      } else if (isNPC) {
        const savedPos = cameraState.positions[id];
        const px = savedPos ? savedPos.x : npcPosition[0];
        const py_pos = savedPos ? savedPos.y : npcPosition[1];
        const pz = savedPos ? savedPos.z : npcPosition[2];
        const py_rot = savedPos ? savedPos.yaw : npcRotationY;
        groupRef.current.position.set(px, py_pos, pz);
        groupRef.current.rotation.y = py_rot;
        groupRef.current.visible = !cameraState.walkerHidden && showAllLaraStyles;
      } else {
        groupRef.current.visible = false;
      }

      const isFirstPerson = isActive && cameraState.mode === 'walk';
      if (prevFirstPersonRef.current !== isFirstPerson) {
        scene.traverse(o => {
          if ((o as THREE.Mesh).isMesh) {
            const meshName = o.name.toLowerCase();
            const mat = (o as THREE.Mesh).material;
            const matName = mat ? (Array.isArray(mat) ? mat[0].name.toLowerCase() : mat.name.toLowerCase()) : '';

            const isHeadPart = meshName.includes('head') || meshName.includes('hair') || meshName.includes('eye') || meshName.includes('lash') || meshName.includes('mouth') || meshName.includes('teeth') ||
                               matName.includes('head') || matName.includes('hair') || matName.includes('eye') || matName.includes('lash') || matName.includes('mouth');

            if (isFirstPerson && isHeadPart) {
              o.layers.set(LAYER_WALKER_DETAIL);
            } else {
              o.layers.set(LAYER_WALKER);
            }
          }
        });
        prevFirstPersonRef.current = isFirstPerson;
      }
    }

    if (!groupRef.current.visible) {
      return;
    }

    const mixer = mixerRef.current;
    const actions = actionsRef.current;

    // Inactive model is always stationary
    let isMoving = isActive ? cameraState.isMoving : false;
    let target = isPreview ? (walkerAnim || 'idle') : (isMoving ? 'walk' : 'idle');

    if (isNPC && customIdleAnimPath && target === 'idle') {
      target = customIdleAnimPath;
    }

    if (customAnimName.current) {
      target = customAnimName.current;
      idleTimerRef.current = 0;
    }

    // Consider rotating as moving to prevent idle timeout freezes
    const isRotating = isActive && useSceneStore.getState().activeWalkerId === id &&
      (Math.abs(cameraState.walkYaw - (groupRef.current.userData.lastYaw || 0)) > 0.001);
    groupRef.current.userData.lastYaw = cameraState.walkYaw;

    if (!isPaused && !isMoving && !isPreview && !isRotating) {
        idleTimerRef.current += delta;
    } else {
        idleTimerRef.current = 0;
    }

    // Both characters time out after 10s of inactivity to save CPU
    const isIdleTimeout = idleTimerRef.current > 10;

    if (target === 'tpose') {
        if (activeActionName.current !== 'tpose') {
            mixer.stopAllAction();
            scene.traverse(o => {
                if ((o as THREE.Bone).isBone) {
                    const b = o as THREE.Bone;
                    if (b.userData.restPos) b.position.copy(b.userData.restPos);
                    if (b.userData.restQuat) b.quaternion.copy(b.userData.restQuat);
                }
            });
            activeActionName.current = 'tpose';
        }
    } else {
        const to = actions[target];
        if (to && activeActionName.current !== target) {
            const from = (activeActionName.current && activeActionName.current !== 'tpose') ? actions[activeActionName.current] : null;
            if (from) from.fadeOut(0.2);
            to.reset().fadeIn(0.2).play();
            to.setEffectiveWeight(1);
            activeActionName.current = target;
            idleTimerRef.current = 0;
        }
    }

    if (activeActionName.current !== 'tpose' && !isPaused && !isIdleTimeout) {
        mixer.update(delta);

        // Lock hair bones to their rest local transforms to completely freeze ponytail movement
        scene.traverse(c => {
          if ((c as any).isBone) {
            const nLower = (c.name || '').toLowerCase();
            if (nLower.includes('hair') || nLower.includes('ponytail') || nLower.includes('braid') || nLower.includes('pony') || nLower.startsWith('hair_')) {
              if ((c as any).restLocalQuaternion) {
                (c as any).quaternion.copy((c as any).restLocalQuaternion);
              }
              if ((c as any).defaultPosition) {
                (c as any).position.copy((c as any).defaultPosition);
              }
            }
          }
        });


        // Update world matrices once per frame per character
        scene.updateMatrixWorld(true);

        // Physics simulation timestep (Time-Corrected Verlet)
        let simDt = delta;
        if (simDt > 0.05) simDt = 0.05; // cap to 20fps
        const dtRatio = physicsPrevDt.current > 0 ? (simDt / physicsPrevDt.current) : 1;

        // Ponytail physics simulation (Verlet)
        const enableHairPhysics = useSceneStore.getState().layers.hairPhysics;
        if (enableHairPhysics && hairChainRef.current.length > 0) {
          const firstNode = hairChainRef.current[0];
          const baseParent = firstNode.bone.parent;
          if (baseParent) {

            const baseParentQuat = baseParent.getWorldQuaternion(new THREE.Quaternion());
            const g = new THREE.Vector3(0, -981, 0); // standard gravity (cm/s^2)

            for (const node of hairChainRef.current) {
              const { bone, restQuat, relQuat, axis, worldLength } = node;
              const parent = bone.parent;
              if (!parent) continue;



              const jointWorld = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);

              // Rest dir based on baseParent to break feedback loop of deformed parent bones
              const restQuatWorld = baseParentQuat.clone().multiply(relQuat);
              const restDir = axis.clone().applyQuaternion(restQuatWorld).normalize();
              const restTip = jointWorld.clone().addScaledVector(restDir, worldLength);

              // Teleportation safety reset
              const dist = jointWorld.distanceTo(node.tipWorld);
              if (dist > worldLength * 3) {
                node.tipWorld.copy(restTip);
                node.tipPrev.copy(restTip);
              }

              const vel = new THREE.Vector3().subVectors(node.tipWorld, node.tipPrev).multiplyScalar(dtRatio * (1 - 0.50)); // damping = 0.50
              const next = new THREE.Vector3().copy(node.tipWorld).add(vel).addScaledVector(g, simDt * simDt);

              next.lerp(restTip, 0.02); // stiffness = 0.02 (almost pure gravity)
              // Resolve constraints iteratively (2 passes) to ensure length and collision are both satisfied
              for (let i = 0; i < 2; i++) {
                // 1. Length constraint
                const dir = new THREE.Vector3().subVectors(next, jointWorld);
                const currentLen = dir.length();
                if (currentLen > 1e-6) {
                  dir.multiplyScalar(worldLength / currentLen);
                } else {
                  dir.copy(restDir).multiplyScalar(worldLength);
                }
                next.copy(jointWorld).add(dir);

                // 2. Collision constraints (Body + Backpack)
                // We use a robust cross-product of (Hips->Head) and (RightShoulder->LeftShoulder)
                // to get the exact "Backward" direction of the torso, independent of the rig's bone axes!
                let backDir = new THREE.Vector3(0, 0, -1);
                if (headBoneRef.current && hipsBoneRef.current && lShoulderRef.current && rShoulderRef.current) {
                  const headW = new THREE.Vector3().setFromMatrixPosition(headBoneRef.current.matrixWorld);
                  const hipsW = new THREE.Vector3().setFromMatrixPosition(hipsBoneRef.current.matrixWorld);
                  const lShoulderW = new THREE.Vector3().setFromMatrixPosition(lShoulderRef.current.matrixWorld);
                  const rShoulderW = new THREE.Vector3().setFromMatrixPosition(rShoulderRef.current.matrixWorld);

                  const up = new THREE.Vector3().subVectors(headW, hipsW).normalize();
                  const right = new THREE.Vector3().subVectors(lShoulderW, rShoulderW).normalize(); // Assuming character faces +Z, left is +X, right is -X. So Right->Left is +X
                  backDir.crossVectors(up, right).normalize(); // Y cross X = -Z (Backward)
                }

                // Head sphere
                if (headBoneRef.current) {
                  const center = new THREE.Vector3().setFromMatrixPosition(headBoneRef.current.matrixWorld);
                  center.addScaledVector(backDir, 5); // push slightly back
                  const radius = 15.0;
                  const dist = next.distanceTo(center);
                  if (dist < radius) next.add(new THREE.Vector3().subVectors(next, center).normalize().multiplyScalar(radius - dist));
                }

                // Backpack / Upper Back (Spine2)
                if (spine2BoneRef.current) {
                  const center = new THREE.Vector3().setFromMatrixPosition(spine2BoneRef.current.matrixWorld);
                  center.addScaledVector(backDir, 16); // push into the backpack
                  const radius = 24.0;
                  const dist = next.distanceTo(center);
                  if (dist < radius) next.add(new THREE.Vector3().subVectors(next, center).normalize().multiplyScalar(radius - dist));
                }

                // Mid Back (Spine)
                if (spineBoneRef.current) {
                  const center = new THREE.Vector3().setFromMatrixPosition(spineBoneRef.current.matrixWorld);
                  center.addScaledVector(backDir, 12);
                  const radius = 20.0;
                  const dist = next.distanceTo(center);
                  if (dist < radius) next.add(new THREE.Vector3().subVectors(next, center).normalize().multiplyScalar(radius - dist));
                }

                // Lower Back / Butt (Hips)
                if (hipsBoneRef.current) {
                  const center = new THREE.Vector3().setFromMatrixPosition(hipsBoneRef.current.matrixWorld);
                  center.addScaledVector(backDir, 10);
                  const radius = 22.0;
                  const dist = next.distanceTo(center);
                  if (dist < radius) next.add(new THREE.Vector3().subVectors(next, center).normalize().multiplyScalar(radius - dist));
                }
              }

              // Final exact length constraint
              const dir = new THREE.Vector3().subVectors(next, jointWorld);
              const currentLen = dir.length();
              if (currentLen > 1e-6) {
                dir.multiplyScalar(worldLength / currentLen);
              } else {
                dir.copy(restDir).multiplyScalar(worldLength);
              }

              node.tipPrev.copy(node.tipWorld);
              node.tipWorld.copy(jointWorld).add(dir);

              const parentQuat = parent.getWorldQuaternion(new THREE.Quaternion());
              const parentQuatInv = parentQuat.clone().invert();
              const localTargetDir = dir.clone().normalize().applyQuaternion(parentQuatInv);

              const restDirParent = axis.clone().applyQuaternion(restQuat);
              const qDelta = new THREE.Quaternion().setFromUnitVectors(restDirParent, localTargetDir);
              bone.quaternion.copy(qDelta).multiply(restQuat);
              bone.updateMatrixWorld(true);
            }
          }
        }

        // Breast physics simulation (Verlet)
        const enableBreastPhysics = useSceneStore.getState().layers.breastPhysics;
        if (enableBreastPhysics && breastChainRef.current.length > 0) {
          const g = new THREE.Vector3(0, -700, 0); // moderate gravity for breasts to allow bouncy feel

          for (const node of breastChainRef.current) {
            const { bone, restQuat, axis, worldLength } = node;
            const parent = bone.parent;
            if (!parent) continue;

            const jointWorld = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);

            // Teleportation safety reset
            const dist = jointWorld.distanceTo(node.tipWorld);
            if (dist > worldLength * 3) {
              const parentQuat = parent.getWorldQuaternion(new THREE.Quaternion());
              const restDir = axis.clone().applyQuaternion(restQuat).applyQuaternion(parentQuat);
              const tipW = jointWorld.clone().addScaledVector(restDir, worldLength);
              node.tipWorld.copy(tipW);
              node.tipPrev.copy(tipW);
            }

            const vel = new THREE.Vector3().subVectors(node.tipWorld, node.tipPrev).multiplyScalar(dtRatio * (1 - 0.12)); // damping = 0.12
            const next = new THREE.Vector3().copy(node.tipWorld).add(vel).addScaledVector(g, simDt * simDt);

            const parentQuat = parent.getWorldQuaternion(new THREE.Quaternion());
            const restDir = axis.clone().applyQuaternion(restQuat).applyQuaternion(parentQuat);
            const restTip = jointWorld.clone().addScaledVector(restDir, worldLength);

            next.lerp(restTip, 0.15); // stiffness = 0.15

            const dir = new THREE.Vector3().subVectors(next, jointWorld);
            const currentLen = dir.length();
            if (currentLen > 1e-6) {
              dir.multiplyScalar(worldLength / currentLen);
            } else {
              dir.copy(restDir).multiplyScalar(worldLength);
            }

            node.tipPrev.copy(node.tipWorld);
            node.tipWorld.copy(jointWorld).add(dir);

            const parentQuatInv = parentQuat.clone().invert();
            const localTargetDir = dir.clone().normalize().applyQuaternion(parentQuatInv);

            const restDirParent = axis.clone().applyQuaternion(restQuat);
            const qDelta = new THREE.Quaternion().setFromUnitVectors(restDirParent, localTargetDir);

            let scaledQ = qDelta;
            const breastIntensity = 1.2;
            const w = Math.min(1, Math.max(-1, qDelta.w));
            const angle = 2 * Math.acos(w);
            if (Math.abs(angle) > 1e-5) {
              const sinHalf = Math.sqrt(1 - w * w);
              const rotAxis = new THREE.Vector3();
              if (sinHalf > 1e-5) {
                rotAxis.set(qDelta.x / sinHalf, qDelta.y / sinHalf, qDelta.z / sinHalf).normalize();
              } else {
                rotAxis.set(0, 0, 1);
              }
              scaledQ = new THREE.Quaternion().setFromAxisAngle(rotAxis, angle * breastIntensity);
            }
            bone.quaternion.copy(scaledQ).multiply(restQuat);
          }
        }

        physicsPrevDt.current = simDt;
    }

    if (!isIdleTimeout || isMoving || isPreview) {
        invalidate();
    }
  });

  return (
    <group ref={groupRef}>
      <primitive ref={modelRef} object={scene} />
      {!isPreview && isActive && <GroundPoint />}
    </group>
  );
}

function InternalWalker(props: WalkerProps) {
  const activeWalkerId = useSceneStore(state => state.activeWalkerId);
  const idleGltf = useGLTF('media/sandbox/anims/anim_idle.glb');
  const walkingGltf = useGLTF('media/sandbox/anims/anim_walking.glb');
  const runningGltf = useGLTF('media/sandbox/anims/anim_running.glb');

  // Preloaded anim paths
  const sittingGltf = useGLTF('media/sandbox/anims/anim_sitting_idle.glb');
  const swimmingGltf = useGLTF('media/sandbox/anims/anim_swimming_to_edge.glb');
  const pushUpGltf = useGLTF('media/sandbox/anims/anim_push_up.glb');
  const laying1Gltf = useGLTF('media/sandbox/anims/anim_laying_idle_1.glb');
  const climbingGltf = useGLTF('media/sandbox/anims/anim_climbing.glb');

  // New character anims
  const bellyDanceGltf = useGLTF('media/sandbox/anims/anim_belly_dance.glb');
  const dancingTwerkGltf = useGLTF('media/sandbox/anims/anim_dancing_twerk.glb');
  const soccerballGltf = useGLTF('media/sandbox/anims/anim_stall_soccerball_1.glb');
  const jabCrossGltf = useGLTF('media/sandbox/anims/anim_body_jab_cross.glb');
  const femaleLayingPose9Gltf = useGLTF('media/sandbox/anims/anim_female_laying_pose_9.glb');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;

    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const animGltfs: Record<string, any> = useMemo(() => ({
    'media/sandbox/anims/anim_sitting_idle.glb': sittingGltf,
    'media/sandbox/anims/anim_swimming_to_edge.glb': swimmingGltf,
    'media/sandbox/anims/anim_push_up.glb': pushUpGltf,
    'media/sandbox/anims/anim_climbing.glb': climbingGltf,
    'media/sandbox/anims/anim_laying_idle_1.glb': laying1Gltf,
    'media/sandbox/anims/anim_belly_dance.glb': bellyDanceGltf,
    'media/sandbox/anims/anim_dancing_twerk.glb': dancingTwerkGltf,
    'media/sandbox/anims/anim_stall_soccerball_1.glb': soccerballGltf,
    'media/sandbox/anims/anim_body_jab_cross.glb': jabCrossGltf,
    'media/sandbox/anims/anim_female_laying_pose_9.glb': femaleLayingPose9Gltf,
  }), [sittingGltf, swimmingGltf, pushUpGltf, climbingGltf, laying1Gltf, bellyDanceGltf, dancingTwerkGltf, soccerballGltf, jabCrossGltf, femaleLayingPose9Gltf]);

  const charactersWithAnims = useMemo(() => {
    return CHARACTERS.map(char => {
      const isLara = true;
      const idleAnim = idleGltf.animations[0].clone();
      idleAnim.name = 'idle';
      (idleAnim as any).userData = { animScene: idleGltf.scene };

      const walkAnim = walkingGltf.animations[0].clone();
      walkAnim.name = 'walk';
      (walkAnim as any).userData = { animScene: walkingGltf.scene };

      const runAnim = runningGltf.animations[0].clone();
      runAnim.name = 'run';
      (runAnim as any).userData = { animScene: runningGltf.scene };

      const charAnims = [
        idleAnim,
        walkAnim,
        runAnim,
        ...(char.customIdleAnimPath && animGltfs[char.customIdleAnimPath]?.animations[0]
          ? [Object.assign(animGltfs[char.customIdleAnimPath].animations[0].clone(), {
              name: char.customIdleAnimPath,
              userData: { animScene: animGltfs[char.customIdleAnimPath].scene }
            })]
          : [])
      ];
      const sittingScene = char.sittingScenePath && animGltfs[char.sittingScenePath]?.scene;
      return {
        ...char,
        isLara,
        charAnims,
        sittingScene
      };
    });
  }, [idleGltf, walkingGltf, runningGltf, animGltfs]);

  return (
    <>
      {charactersWithAnims.map((char, index) => {
        const isActive = props.isPreview
          ? char.id === props.previewCharacterId
          : char.id === activeWalkerId;

        if (props.isPreview && char.id !== props.previewCharacterId) {
          return null;
        }

        return (
          <SingleCharacter
            {...props}
            key={char.id}
            id={char.id}
            name={char.name}
            modelPath={char.path}
            isLara={char.isLara ?? true}
            targetHeight={char.height}
            isActive={isActive}
            animations={char.charAnims}

            variant={char.variant}
            isNPC={!isActive}
            npcPosition={char.pos}
            npcRotationY={char.rot}
            sittingScene={char.sittingScene}
            walkerAnim={props.walkerAnim}
            customIdleAnimPath={char.customIdleAnimPath}
            characterIndex={index}
          />
        );
      })}
    </>
  );
}

export function Walker(props: WalkerProps) {
  return (
    <Suspense fallback={null}>
      <InternalWalker {...props} />
    </Suspense>
  );
}

// Preloads

useGLTF.preload(LARA_PATH);
useGLTF.preload(ROSANNA_PATH);
useGLTF.preload(VIVID_PATH);
useGLTF.preload('media/sandbox/anims/anim_sitting_idle.glb');
useGLTF.preload('media/sandbox/anims/anim_swimming_to_edge.glb');
useGLTF.preload('media/sandbox/anims/anim_climbing.glb');
useGLTF.preload('media/sandbox/anims/anim_push_up.glb');
useGLTF.preload('media/sandbox/anims/anim_laying_idle_1.glb');
useGLTF.preload('media/sandbox/anims/anim_woman-solo.glb');
useGLTF.preload('media/sandbox/anims/anim_belly_dance.glb');
useGLTF.preload('media/sandbox/anims/anim_dancing_twerk.glb');
useGLTF.preload('media/sandbox/anims/anim_stall_soccerball_1.glb');
useGLTF.preload('media/sandbox/anims/anim_body_jab_cross.glb');


CHARACTERS.forEach(char => {
  useGLTF.preload(char.path);
});
