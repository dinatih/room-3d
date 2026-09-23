

/**
 * Walker.tsx — Personnages (Walkers & NPCs).
 * Gère le chargement, les animations, le retargeting et le positionnement dynamique.
 * Updated: 2026-07-27 T-Pose position fix
 */
import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { SingleCharacter } from './character';
import { cacheDynamicGLTF } from './character/useCharacterAnimations';
import { CHARACTERS, isCharacterVisibleInMode, type CharacterConfig, ACCESSORIES_MESH_NAMES } from './walkerConfig';
export { CHARACTERS, type CharacterConfig, ACCESSORIES_MESH_NAMES };


import { WALKER_ANIM_OPTIONS } from './animOptions';
export { WALKER_ANIM_OPTIONS };





import { type DuoAnimationDef } from './ai/duoAnimations';

export interface WalkerProps {
  isPreview?: boolean;
  previewCharacterId?: string;
  previewHaircut?: string;
  previewHairColor?: string;
  characterIndex?: number;
  totalCharacters?: number;
  walkerAnim?: string;
  isPaused?: boolean;
  previewPosition?: [number, number, number];
  previewRotationY?: number;
  duoAnimDef?: DuoAnimationDef;
  duoPartnerId?: string;
}

function InternalWalker(props: WalkerProps) {
  const activeWalkerId = useSceneStore(state => state.activeWalkerId);
  const laraCount = useSceneStore(state => state.layers.laraCount ?? 4);
  const showAllLaraStyles = useSceneStore(state => state.layers.showAllLaraStyles);
  const extraCharacters = useSceneStore(state => state.layers.extraCharacters ?? false);
  const activeExtraIds = useSceneStore(state => state.activeExtraIds);

  const characters = useMemo(() => {
    return CHARACTERS.map(char => ({
      ...char,
      isLara: char.isLara !== false,
    }));
  }, []);

  const mountedCharacters = useMemo(() => {
    if (props.isPreview) {
      if (props.duoAnimDef) {
        const leaderId = props.previewCharacterId || 'native';
        const partnerId = props.duoPartnerId || (leaderId === 'native' ? 'rosanna' : 'native');
        const leader = characters.find(char => char.id === leaderId) || characters[0];
        const partner = characters.find(char => char.id === partnerId) || characters.find(char => char.id !== leaderId) || characters[0];
        return [
          { ...leader, isDuoRoleA: true },
          { ...partner, isDuoRoleB: true }
        ];
      }
      return characters.filter(char => char.id === props.previewCharacterId);
    }
    return characters.filter(char =>
      showAllLaraStyles && isCharacterVisibleInMode(char.id, laraCount, activeWalkerId, extraCharacters, activeExtraIds)
    );
  }, [activeWalkerId, characters, laraCount, props.isPreview, props.previewCharacterId, props.duoAnimDef, props.duoPartnerId, showAllLaraStyles, extraCharacters, activeExtraIds]);

  return (
    <>
      {mountedCharacters.map((char: any, index: number) => {
        const isDuoRoleA = char.isDuoRoleA;
        const isDuoRoleB = char.isDuoRoleB;

        let charAnim = props.walkerAnim;
        let charPos: [number, number, number] | undefined = props.previewPosition;
        let charRot: number | undefined = props.previewRotationY;

        if (props.duoAnimDef) {
          const def = props.duoAnimDef;
          if (isDuoRoleA) {
            charAnim = def.animA;
            charPos = [0, 0, 0];
            charRot = def.rotA !== undefined ? def.rotA : 0;
          } else if (isDuoRoleB) {
            charAnim = def.animB;
            charPos = def.offsetB ? [def.offsetB[0], def.offsetB[1], def.offsetB[2]] : [0, 0, 0];
            charRot = def.rotB !== undefined ? def.rotB : 0;
          }
        }

        const isActive = props.isPreview
          ? char.id === props.previewCharacterId
          : char.id === activeWalkerId;

        return (
          <Suspense key={char.id + (isDuoRoleB ? '-partner' : '')} fallback={null}>
            <SingleCharacter
              {...props}
              id={char.id}
              name={char.name}
              modelPath={char.path}
              isLara={char.isLara ?? true}
              targetHeight={char.height}
              isActive={isActive}
              variant={char.variant}
              isNPC={!isActive}
              isDuoRoleB={isDuoRoleB}
              duoAnimDef={props.duoAnimDef}
              npcPosition={char.pos}
              npcRotationY={char.rot}
              walkerAnim={charAnim}
              previewPosition={charPos}
              previewRotationY={charRot}
              previewHaircut={props.previewHaircut}
              previewHairColor={props.previewHairColor}
              characterIndex={props.characterIndex !== undefined ? props.characterIndex : index}
              totalCharacters={mountedCharacters.length}
            />
          </Suspense>
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
useGLTF.preload('/items/famnig27470460/Famnig27470460.glb');

// Pré-chauffage asynchrone des animations de base
cacheDynamicGLTF('animations/poses_idles/miley_armature_idle01_f.glb');
cacheDynamicGLTF('animations/locomotion/anim_walking.glb');
cacheDynamicGLTF('animations/locomotion/anim_running.glb');
