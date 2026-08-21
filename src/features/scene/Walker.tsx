const ANIM_URLS = [
  "animations/locomotion/anim_falling.glb",
  "animations/poses_idles/anim_crouch_to_stand.glb",
  "animations/poses_idles/anim_sitting_idle.glb",
  "animations/poses_idles/anim_sleeping_idle.glb",
  "animations/sports_fitness/anim_swimming_to_edge.glb",
  "animations/sports_fitness/anim_push_up.glb",
  "animations/locomotion/anim_climbing.glb",
  "animations/interactions/anim_open_door_outwards.glb",
  "animations/poses_idles/anim_texting_while_standing.glb",
  "animations/poses_idles/anim_laying_idle_1.glb",
  "animations/dances/anim_belly_dance.glb",
  "animations/dances/anim_dancing_twerk.glb",
  "animations/sports_fitness/anim_stall_soccerball_1.glb",
  "animations/combat/anim_body_jab_cross.glb",
  "animations/poses_idles/anim_female_laying_pose_9.glb",
  "animations/combat/anim_best_double_leg_takedown_victim.glb",
  "animations/combat/anim_best_double_leg_takedown_attacker.glb",
  "animations/poses_idles/anim_female_standing_pose.glb",
  "animations/poses_idles/anim_female_standing_pose_1.glb",
  "animations/poses_idles/anim_female_standing_pose_2.glb",
  "animations/poses_idles/anim_female_sitting_pose.glb",
  "animations/poses_idles/anim_female_sitting_pose_1.glb",
  "animations/poses_idles/anim_female_sitting_pose_3.glb",
  "animations/dances/anim_female_dance_pose.glb",
  "animations/poses_idles/anim_female_dynamic_pose.glb",
  "animations/poses_idles/anim_texting_while_standing.glb",
  "animations/emotes_gestures/anim_shaking_hands_2.glb",
  "animations/emotes_gestures/anim_hand_raising.glb",

  // "animations/dances/anim_hip_hop_dancing.glb",
  // "animations/dances/anim_hip_hop_dancing_1.glb",
  // "animations/dances/anim_hip_hop_dancing_2.glb",
  // "animations/dances/anim_hip_hop_dancing_4.glb",
  // "animations/dances/anim_hip_hop_dancing_6.glb",
  // "animations/dances/anim_locking_hip_hop_dance.glb",
  // "animations/dances/anim_robot_hip_hop_dance.glb",
  "animations/dances/anim_salsa_dancing.glb",
  "animations/dances/anim_salsa_dancing_1.glb",
  "animations/dances/anim_salsa_dancing_3.glb",
  "animations/dances/anim_salsa_dancing_4.glb",
  // "animations/dances/anim_samba_dancing.glb",
  "animations/dances/anim_samba_dancing_1.glb",
  // "animations/dances/anim_samba_dancing_2.glb",
  "animations/dances/anim_house_dancing.glb",
  // "animations/dances/anim_breakdance_uprock.glb",
  // "animations/dances/anim_gangnam_style.glb",
  // "animations/combat/anim_capoeira.glb",
  // "animations/dances/anim_rumba_dancing.glb",
  // "animations/dances/anim_twist_dance.glb",
  // "animations/dances/anim_macarena_dance.glb",
  // "animations/dances/anim_swing_dancing.glb",
  // "animations/dances/anim_jazz_dancing.glb",
  // "animations/dances/anim_can_can.glb",
  // "animations/dances/anim_ymca_dance.glb",
  "animations/poses_idles/miley_armature_posing_f.glb",
  "animations/dances/miley_armature_10_dance_like_sidestep.glb",
  "animations/dances/miley_armature_aerobic_dance.glb",
  "animations/dances/miley_armature_air_dance.glb",
  "animations/dances/miley_armature_couple_pop_dance_f.glb",
  "animations/dances/miley_armature_couple_pop_dance_m.glb",
  "animations/dances/miley_armature_dance_graceful.glb",
  "animations/dances/miley_armature_dancetomusic_f.glb",
  "animations/dances/miley_armature_energetic_dance_f.glb",
  "animations/dances/miley_armature_energetic_dance_m.glb",
  "animations/dances/miley_armature_sensual_dance_01.glb",
  "animations/dances/miley_armature_sensual_dance_02.glb",
  "animations/dances/miley_armature_sensual_dance_03.glb",
  "animations/dances/miley_armature_slow_dance_f.glb",
  "animations/dances/miley_armature_slow_dance_m.glb"

];

/**
 * Walker.tsx — Personnages (Walkers & NPCs).
 * Gère le chargement, les animations, le retargeting et le positionnement dynamique.
 * Updated: 2026-07-27 T-Pose position fix
 */
import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { SingleCharacter } from './SingleCharacter';
import { CHARACTERS, type CharacterConfig, ACCESSORIES_MESH_NAMES } from './walkerConfig';
export { CHARACTERS, type CharacterConfig, ACCESSORIES_MESH_NAMES };
import { _retargetCache } from './retargeting';


import { WALKER_ANIM_OPTIONS } from './animOptions';
export { WALKER_ANIM_OPTIONS };





export interface WalkerProps {
  isPreview?: boolean;
  previewCharacterId?: string;
  previewHaircut?: string;
  previewHairColor?: string;
  characterIndex?: number;
  walkerAnim?: string;
  isPaused?: boolean;
}

function InternalWalker(props: WalkerProps) {
  const activeWalkerId = useSceneStore(state => state.activeWalkerId);
  const idleGltf = useGLTF('animations/poses_idles/miley_armature_idle01_f.glb');
  const walkingGltf = useGLTF('animations/locomotion/anim_walking.glb');
  const runningGltf = useGLTF('animations/locomotion/anim_running.glb');

    const gltfs = useGLTF(ANIM_URLS) as any[];

  const animGltfs: Record<string, any> = useMemo(() => {
    const map: Record<string, any> = {};
    ANIM_URLS.forEach((url, i) => {
      map[url] = gltfs[i];
    });
    return map;
  }, [gltfs]);


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
        // Inclure également toutes les animations de la map pour qu'elles soient prêtes à l'emploi (AI, interact, etc.)
        ...Object.entries(animGltfs)
          .filter(([_, gltf]) => gltf?.animations?.[0])
          .map(([path, gltf]) => {
            return Object.assign(gltf.animations[0].clone(), {
              name: path,
              userData: { animScene: gltf.scene }
            });
          })
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
            previewHaircut={props.previewHaircut}
            previewHairColor={props.previewHairColor}
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
const LARA_PATH = 'characters/lara/lara_native.glb';

useGLTF.preload(LARA_PATH);
useGLTF.preload('animations/poses_idles/miley_armature_idle01_f.glb');
useGLTF.preload('animations/locomotion/anim_walking.glb');
useGLTF.preload('animations/locomotion/anim_running.glb');
ANIM_URLS.forEach(url => useGLTF.preload(url));


CHARACTERS.forEach(char => {
  useGLTF.preload(char.path);
});

useGLTF.preload('items/famnig27470460/Famnig27470460.glb');
