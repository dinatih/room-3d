import { create } from 'zustand';
import { createLife, LIFE_CHARACTER_LABELS, type LifeCharacterId } from './laraLife';

// Independent session state survives controller pauses and guided tours.
export const characterLives = { native: createLife('native'), cha: createLife('cha') };
export const LIFE_SPEEDS = [1, 3, 10] as const;
export type LifeSnapshot = Pick<ReturnType<typeof createLife>, 'needs' | 'memory' | 'relationships' | 'elapsedSeconds'> & { activity: string; reason: string };
const initialSnapshot = (id: LifeCharacterId): LifeSnapshot => ({
  needs: { ...characterLives[id].needs }, memory: {}, relationships: {}, elapsedSeconds: 0,
  activity: 'En attente', reason: `${LIFE_CHARACTER_LABELS[id]} commence sa journée.`,
});
export const useLaraLifeStore = create<{
  characters: Record<LifeCharacterId, LifeSnapshot>;
  selectedCharacterId: LifeCharacterId;
  speed: typeof LIFE_SPEEDS[number];
}>(() => ({ characters: { native: initialSnapshot('native'), cha: initialSnapshot('cha') }, selectedCharacterId: 'native', speed: 1 }));

export function publishLife(id: LifeCharacterId, patch: Partial<LifeSnapshot>) {
  useLaraLifeStore.setState(state => ({ characters: { ...state.characters, [id]: { ...state.characters[id], ...patch } } }));
}
