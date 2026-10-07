

/**
 * CharacterGroup.tsx — Orchestrateur multi-personnages (Characters & NPCs).
 * Filtre, distribue les props et gère le montage de chaque Character.
 */
import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { Character } from './Character';
import { cacheDynamicGLTF } from './useCharacterAnimations';
import { CHARACTERS, isCharacterVisibleInMode } from '../characterConfig';
import type { CharacterGroupProps } from './characterTypes';
import { getLaraGridPosition } from './laraGridUtils';

function InternalCharacterGroup(props: CharacterGroupProps) {
  const laraGrid = useSceneStore(state => state.layers.laraGrid);
  const activeCharacterId = useSceneStore(state => state.activeCharacterId);
  const laraCount = useSceneStore(state => state.layers.laraCount ?? 4);
  const showAllLaraStyles = useSceneStore(state => state.layers.showAllLaraStyles);
  const extraCharacters = useSceneStore(state => state.layers.extraCharacters ?? false);
  const activeExtraIds = useSceneStore(state => state.activeExtraIds);
  const activeMainIds = useSceneStore(state => state.activeMainIds);

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
      showAllLaraStyles && isCharacterVisibleInMode(char.id, laraCount, activeCharacterId, extraCharacters, activeExtraIds, activeMainIds)
    );
  }, [activeCharacterId, characters, laraCount, props.isPreview, props.previewCharacterId, props.duoAnimDef, props.duoPartnerId, showAllLaraStyles, extraCharacters, activeExtraIds, activeMainIds]);

  if (laraGrid && !props.isPreview && props.duoAnimDef) {
    const duo = props.duoAnimDef;
    const partner = characters.find(char => char.id === props.duoPartnerId);
    if (!partner) throw new Error(`Partenaire de grille inconnu : ${props.duoPartnerId}`);
    const offset = duo.offsetB ?? [0, 0, 0];
    return <>{mountedCharacters.map((leader, index) => {
      const pos = getLaraGridPosition(index, mountedCharacters.length);
      return <Suspense key={leader.id} fallback={null}>
        <Character
          {...props}
          id={leader.id} name={leader.name} modelPath={leader.path}
          isLara={leader.isLara} targetHeight={leader.height} variant={leader.variant}
          isActive={leader.id === activeCharacterId} isNPC={leader.id !== activeCharacterId}
          characterIndex={index} totalCharacters={mountedCharacters.length}
          characterAnim={duo.animA} isAnimationMaster={index === 0}
        />
        <Character
          {...props}
          key={partner.id}
          id={partner.id} name={partner.name} modelPath={partner.path}
          isLara={partner.isLara} targetHeight={partner.height} variant={partner.variant}
          instanceId={`grid:${leader.id}:partner:${partner.id}`}
          isPreview isGridPartner isDuoRoleB isActive={false} isNPC={false}
          isAnimationMaster={false}
          characterIndex={index} totalCharacters={mountedCharacters.length}
          characterAnim={duo.animB}
          previewPosition={[pos.x + offset[0], pos.y + offset[1], pos.z + offset[2]]}
          previewRotationY={duo.rotB ?? 0}
        />
      </Suspense>;
    })}</>;
  }

  return (
    <>
      {mountedCharacters.map((char: any, index: number) => {
        const isDuoRoleA = char.isDuoRoleA;
        const isDuoRoleB = char.isDuoRoleB;

        let charAnim = props.characterAnim;
        let charPos: [number, number, number] | undefined = props.previewPosition;
        let charRot: number | undefined = props.previewRotationY;

        if (props.duoAnimDef) {
          const def = props.duoAnimDef;
          if (isDuoRoleA) {
            charAnim = def.animA;
            charPos = [0, 0, 0];
            charRot = 0;
          } else if (isDuoRoleB) {
            charAnim = def.animB;
            charPos = def.offsetB ? [def.offsetB[0], def.offsetB[1], def.offsetB[2]] : [0, 0, 0];
            charRot = def.rotB !== undefined ? def.rotB : 0;
          }
        }

        const isActive = props.isPreview
          ? char.id === props.previewCharacterId
          : char.id === activeCharacterId;

        return (
          <Suspense key={char.id + (isDuoRoleB ? '-partner' : '')} fallback={null}>
            <Character
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
              characterAnim={charAnim}
              previewPosition={charPos}
              previewRotationY={charRot}
              previewHaircut={props.previewHaircut}
              previewHairColor={props.previewHairColor}
              characterIndex={props.characterIndex !== undefined ? props.characterIndex : index}
              isAnimationMaster={props.isPreview ? !isDuoRoleB : index === 0}
              totalCharacters={mountedCharacters.length}
            />
          </Suspense>
        );
      })}
    </>
  );
}

export function CharacterGroup(props: CharacterGroupProps) {
  return (
    <Suspense fallback={null}>
      <InternalCharacterGroup {...props} />
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
