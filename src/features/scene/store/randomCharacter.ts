import { CHARACTERS, isCharacterVisibleInMode } from '../characterConfig';
import { CAMERA_SUBJECTS } from '../camera/cameraSubjects';
import { cameraState } from '../cameraState';
import { useSceneStore } from './useSceneStore';

export function chooseRandomCharacter() {
  const state = useSceneStore.getState();
  const currentId = cameraState.animalTarget ?? state.activeCharacterId;

  const characters = CHARACTERS.filter(character =>
    isCharacterVisibleInMode(
      character.id,
      state.layers.laraCount,
      state.activeCharacterId,
      state.layers.extraCharacters ?? false,
      state.activeExtraIds,
      state.activeMainIds,
    ),
  ).map(c => ({ id: c.id, isCharacter: true }));

  const nonCharacters = CAMERA_SUBJECTS
    .filter(subject => subject.id !== 'character' && Boolean(cameraState.animalViews[subject.id]))
    .map(s => ({ id: s.id, isCharacter: false }));

  const all = [...characters, ...nonCharacters];
  const candidates = all.filter(c => c.id !== currentId);
  const pool = candidates.length ? candidates : all;
  if (!pool.length) return;

  const choice = pool[Math.floor(Math.random() * pool.length)];
  if (choice.isCharacter) {
    state.setActiveCharacterId(choice.id);
    document.dispatchEvent(new CustomEvent('camera-subject', { detail: 'character' }));
  } else {
    document.dispatchEvent(new CustomEvent('camera-subject', { detail: choice.id }));
  }
}

export const chooseRandomSubject = chooseRandomCharacter;
