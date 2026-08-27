

/**
 * Walker.tsx — Personnages (Walkers & NPCs).
 * Gère le chargement, les animations, le retargeting et le positionnement dynamique.
 * Updated: 2026-07-27 T-Pose position fix
 */
import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { SingleCharacter } from './SingleCharacter';
import { CHARACTERS, isCharacterVisibleInMode, type CharacterConfig, ACCESSORIES_MESH_NAMES } from './walkerConfig';
export { CHARACTERS, type CharacterConfig, ACCESSORIES_MESH_NAMES };


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
  const laraCount = useSceneStore(state => state.layers.laraCount ?? 2);
  const showAllLaraStyles = useSceneStore(state => state.layers.showAllLaraStyles);
  const idleGltf = useGLTF('animations/poses_idles/miley_armature_idle01_f.glb');
  const walkingGltf = useGLTF('animations/locomotion/anim_walking.glb');
  const runningGltf = useGLTF('animations/locomotion/anim_running.glb');


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
      ];
      return {
        ...char,
        isLara,
        charAnims,
        // Special animations are loaded only when requested by SingleCharacter.
        sittingScene: undefined
      };
    });
  }, [idleGltf, walkingGltf, runningGltf]);

  const mountedCharacters = useMemo(() => {
    if (props.isPreview) {
      return charactersWithAnims.filter(char => char.id === props.previewCharacterId);
    }
    return charactersWithAnims.filter(char =>
      char.id === activeWalkerId ||
      (showAllLaraStyles && isCharacterVisibleInMode(char.id, laraCount, activeWalkerId))
    );
  }, [activeWalkerId, charactersWithAnims, laraCount, props.isPreview, props.previewCharacterId, showAllLaraStyles]);

  return (
    <>
      {mountedCharacters.map(char => {
        const isActive = props.isPreview
          ? char.id === props.previewCharacterId
          : char.id === activeWalkerId;

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
            characterIndex={CHARACTERS.findIndex(candidate => candidate.id === char.id)}
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

useGLTF.preload('items/famnig27470460/Famnig27470460.glb');
