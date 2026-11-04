import { create } from 'zustand';
import { createLife, LIFE_CHARACTER_IDS, LIFE_CHARACTER_LABELS, type LifeCharacterId } from './laraLife';
import { homeDirt, type HomeDirt, type HomeRoom } from './lifeHousekeeping';

// Independent session state survives controller pauses and guided tours.
export const characterLives = Object.fromEntries(LIFE_CHARACTER_IDS.map(id => [id, createLife(id)])) as Record<LifeCharacterId, ReturnType<typeof createLife>>;
export const LIFE_SPEEDS = [1, 3, 10] as const;
export type LifeSnapshot = Pick<ReturnType<typeof createLife>, 'needs' | 'memory' | 'relationships' | 'elapsedSeconds'> & { activity: string; reason: string; room: HomeRoom };
const initialSnapshot = (id: LifeCharacterId): LifeSnapshot => ({
  needs: { ...characterLives[id].needs }, memory: {}, relationships: { ...characterLives[id].relationships }, elapsedSeconds: 0,
  room: 'living', activity: 'En attente', reason: `${LIFE_CHARACTER_LABELS[id]} commence sa journée.`,
});
export const useLaraLifeStore = create<{
  home: HomeDirt;
  characters: Record<LifeCharacterId, LifeSnapshot>;
  selectedCharacterId: LifeCharacterId;
  speed: typeof LIFE_SPEEDS[number];
}>(() => ({ home: { ...homeDirt }, characters: Object.fromEntries(LIFE_CHARACTER_IDS.map(id => [id, initialSnapshot(id)])) as Record<LifeCharacterId, LifeSnapshot>, selectedCharacterId: 'native', speed: 1 }));

export function publishLife(id: LifeCharacterId, patch: Partial<LifeSnapshot>) {
  useLaraLifeStore.setState(state => ({ home: { ...homeDirt }, characters: { ...state.characters, [id]: { ...state.characters[id], ...patch } } }));
}
