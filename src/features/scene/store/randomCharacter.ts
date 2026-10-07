import { CHARACTERS, isCharacterVisibleInMode } from '../characterConfig';
import { useSceneStore } from './useSceneStore';

export function chooseRandomCharacter() {
  const state = useSceneStore.getState();
  const candidates = CHARACTERS.filter(character =>
    character.id !== state.activeCharacterId && isCharacterVisibleInMode(
      character.id,
      state.layers.laraCount ?? 4,
      state.activeCharacterId,
      state.layers.extraCharacters ?? false,
      state.activeExtraIds,
      state.activeMainIds,
    ),
  );
  if (candidates.length) {
    state.setActiveCharacterId(candidates[Math.floor(Math.random() * candidates.length)].id);
  }
}
